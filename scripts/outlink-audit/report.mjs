/**
 * Reporting is deliberately separate from crawling. The injected GitHub client
 * implements request(method, path, body?) and returns parsed REST response JSON.
 * No credentials, networking, or process execution live in this module.
 */
export const ISSUE_MARKER = '<!-- outlink-audit:managed:v1 -->';
export const ISSUE_TITLE = 'External links needing editorial review';
const STATE_PREFIX = '<!-- outlink-audit:state:';
const DEAD_STATUSES = new Set([404, 410]);

function httpUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

function uniqueUrls(values = []) {
  return [...new Set(values.map(httpUrl).filter(Boolean))].sort();
}

function escapeText(value) {
  // eslint-disable-next-line no-control-regex -- Remove controls before displaying untrusted URLs in Markdown.
  return String(value).replace(/[\r\n\u0000-\u001f\u007f]+/g, ' ')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/[\\`*_{}[\]()#+.!|~]/g, '\\$&').replace(/@/g, '&#64;');
}

function markdownUrl(value) {
  const url = httpUrl(value);
  if (!url) return '(URL unavailable)';
  const destination = url.replace(/[()]/g, character => character === '(' ? '%28' : '%29')
    .replace(/[<>\s]/g, character => encodeURIComponent(character));
  return `[${escapeText(url)}](${destination})`;
}

function isRepeatedDead(link) {
  const finalByPhase = new Map();
  for (const check of Array.isArray(link.checks) ? link.checks : []) {
    if (check?.phase === 'initial' || check?.phase === 'confirmation') finalByPhase.set(check.phase, check);
  }
  return link.classification === 'dead'
    && ['initial', 'confirmation'].every(phase => DEAD_STATUSES.has(finalByPhase.get(phase)?.status));
}

/** Normalize duplicates conservatively: contradictory observations cannot file a finding. */
function inventory(report) {
  const byUrl = new Map();
  for (const link of report.links ?? []) {
    const url = httpUrl(link.url);
    if (!url) continue;
    const classification = isRepeatedDead(link) ? 'dead'
      : link.classification === 'reachable' ? 'reachable' : 'unverified';
    const value = {
      url,
      parents: uniqueUrls(link.parents),
      classification,
      status: classification === 'dead' ? link.checks.at(-1).status : link.status ?? null,
    };
    const previous = byUrl.get(url);
    if (previous) {
      value.parents = uniqueUrls([...previous.parents, ...value.parents]);
      if (previous.classification !== classification) {
        value.classification = [previous.classification, classification].includes('reachable')
          ? 'reachable' : 'unverified';
        value.status = null;
      }
    }
    byUrl.set(url, value);
  }
  return byUrl;
}

function normalizeFinding(finding) {
  const url = httpUrl(finding?.url);
  if (!url || !DEAD_STATUSES.has(finding.status)) return null;
  return {
    url,
    parents: uniqueUrls(finding.parents),
    status: finding.status,
    availability: finding.availability === 'unverified' ? 'unverified' : 'dead',
  };
}

function normalizeState(state) {
  if (state?.schemaVersion !== 1 || !Array.isArray(state.findings)
    || !Array.isArray(state.acknowledged ?? [])) {
    throw new Error('Managed external-link issue has invalid state; refusing to overwrite it.');
  }
  const findings = state.findings.map(normalizeFinding);
  if (findings.some(value => !value)) {
    throw new Error('Managed external-link issue has invalid findings; refusing to overwrite it.');
  }
  return {
    schemaVersion: 1,
    findings: findings.sort((a, b) => a.url.localeCompare(b.url)),
    acknowledged: uniqueUrls(state.acknowledged),
  };
}

/** Machine state is encoded to prevent URLs from terminating an HTML comment. */
export function readIssueState(body) {
  const match = String(body ?? '').match(/<!-- outlink-audit:state:([A-Za-z0-9+/=]+) -->/);
  if (!match) throw new Error('Managed external-link issue is missing its state; refusing to overwrite it.');
  try {
    return normalizeState(JSON.parse(Buffer.from(match[1], 'base64').toString('utf8')));
  } catch (error) {
    throw new Error(`Cannot read managed external-link issue state: ${error.message}`);
  }
}

/**
 * A complete inventory can establish removal. An incomplete inventory or blocked
 * request cannot establish recovery. suppressedUrls comes from explicit exceptions.
 */
export function reconcileFindings({ report, previousState, issueClosed = false }) {
  const previous = normalizeState(previousState ?? { schemaVersion: 1, findings: [], acknowledged: [] });
  const current = inventory(report);
  const suppressed = new Set(uniqueUrls(report.suppressedUrls));
  const acknowledged = new Set(previous.acknowledged);
  if (issueClosed) {
    // A person closing an issue acknowledges its existing rows. Keep that choice
    // when an unrelated new URL later reopens the rolling issue.
    for (const finding of previous.findings) acknowledged.add(finding.url);
  }
  const isResolved = url => suppressed.has(url) || current.get(url)?.classification === 'reachable'
    || (report.complete === true && !current.has(url));
  for (const url of acknowledged) if (isResolved(url)) acknowledged.delete(url);

  const findings = new Map();
  for (const finding of previous.findings) {
    if (acknowledged.has(finding.url) || isResolved(finding.url)) continue;
    const observed = current.get(finding.url);
    findings.set(finding.url, {
      ...finding,
      parents: observed?.parents.length
        ? (report.complete ? observed.parents : uniqueUrls([...finding.parents, ...observed.parents]))
        : finding.parents,
      availability: observed?.classification === 'dead' ? 'dead' : 'unverified',
    });
  }
  for (const link of current.values()) {
    if (link.classification !== 'dead' || suppressed.has(link.url) || acknowledged.has(link.url)) continue;
    const previousFinding = findings.get(link.url);
    findings.set(link.url, {
      url: link.url,
      parents: report.complete ? link.parents : uniqueUrls([...(previousFinding?.parents ?? []), ...link.parents]),
      status: link.status,
      availability: 'dead',
    });
  }
  return normalizeState({ schemaVersion: 1, findings: [...findings.values()], acknowledged: [...acknowledged] });
}

export function summarize(report) {
  const links = [...inventory(report).values()];
  const counts = { reachable: 0, dead: 0, unverified: 0 };
  for (const link of links) counts[link.classification] += 1;
  return [
    '## External link audit',
    '',
    `Inventory: **${report.complete === true ? 'complete' : 'incomplete'}**.`,
    `Pages scanned: ${Number(report.coverage?.pagesScanned) || 0}. External URLs observed: ${Number(report.coverage?.externalUrls) || links.length}.`,
    '',
    `- Reachable: ${counts.reachable}`,
    `- Repeated 404/410 responses: ${counts.dead}`,
    `- Unverified: ${counts.unverified}`,
    `- Explicitly excluded: ${uniqueUrls(report.suppressedUrls).length}`,
    '',
    'Repeated 404/410 responses are candidates for human review. Blocked, rate-limited and inconclusive requests are not evidence of a dead link.',
    ...(report.complete === true ? [] : ['', 'The incomplete inventory cannot resolve previously reported links merely because they were not observed.']),
    ...((report.errors?.length ?? 0) ? ['', `Audit errors: ${report.errors.length}. See the JSON report for details.`] : []),
    '',
  ].join('\n');
}

export function renderIssue({ state, report, runUrl }) {
  const normalized = normalizeState(state);
  const lines = [
    ISSUE_MARKER,
    '',
    'These external URLs returned 404 or 410 on repeated requests. Please open each URL in a normal browser before changing the referring pages; access restrictions can sometimes return these statuses too.',
    '',
  ];
  if (!normalized.findings.length) {
    lines.push('All tracked findings have been verified reachable, removed from a complete inventory, explicitly excluded, or acknowledged by closing this issue.');
  }
  for (const finding of normalized.findings) {
    lines.push(`- ${markdownUrl(finding.url)} — observed **${finding.status}**${finding.availability === 'unverified' ? '; latest check is inconclusive, so the earlier finding remains unresolved' : ' on repeated requests'}.`);
    if (finding.parents.length) {
      lines.push(`  - Referring pages: ${finding.parents.map(markdownUrl).join(', ')}`);
    }
  }
  if (normalized.acknowledged.length) {
    lines.push('', `${normalized.acknowledged.length} previously acknowledged URL(s) remain suppressed until verified recovered or removed from a complete inventory.`);
  }
  lines.push('', `Production site: ${markdownUrl(report.siteUrl)}.`);
  if (httpUrl(runUrl)) lines.push(`Evidence for this update: ${markdownUrl(runUrl)}.`);
  lines.push('', 'This issue changes only when its findings change. Close it to acknowledge the current findings; new dead URLs can reopen it. Add explicit audit exceptions for persistent exclusions.');
  lines.push('', `${STATE_PREFIX}${Buffer.from(JSON.stringify(normalized)).toString('base64')} -->`);
  const body = lines.join('\n');
  if (Buffer.byteLength(body, 'utf8') > 60000) {
    throw new Error('External-link issue would exceed the safe body size; see the full audit report.');
  }
  return body;
}

async function findManagedIssue(client, repository) {
  const matches = [];
  for (let page = 1; ; page += 1) {
    const issues = await client.request('GET', `/repos/${repository}/issues?state=all&per_page=100&page=${page}`);
    if (!Array.isArray(issues)) throw new Error('GitHub issue listing returned an invalid response.');
    matches.push(...issues.filter(issue => !issue.pull_request && issue.user?.type === 'Bot'
      && String(issue.body ?? '').includes(ISSUE_MARKER)));
    if (issues.length < 100) break;
  }
  // Prefer the existing open issue; number ordering is stable if an earlier
  // configuration accidentally created duplicates. Do not alter other issues.
  return matches.sort((a, b) => Number(a.state !== 'open') - Number(b.state !== 'open') || a.number - b.number)[0];
}

/**
 * Reconcile one bot-owned issue. dryRun still reads existing issues when a client
 * is supplied, but never creates, edits, closes, reopens, or comments on them.
 * Without a client, dryRun provides a local-only proposal.
 */
export async function syncIssue({ report, client, repository, runUrl, dryRun = false }) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? '')) {
    throw new Error('repository must be an owner/repository pair.');
  }
  if (!dryRun && typeof client?.request !== 'function') throw new Error('A GitHub client is required to sync an issue.');
  const issue = client ? await findManagedIssue(client, repository) : null;
  const previousState = issue ? readIssueState(issue.body) : { schemaVersion: 1, findings: [], acknowledged: [] };
  const state = reconcileFindings({ report, previousState, issueClosed: issue?.state === 'closed' });
  let action = 'unchanged';
  if (!issue) {
    if (state.findings.length) action = 'created';
  } else if (issue.state === 'closed') {
    if (state.findings.length) action = 'reopened';
    else {
      const previousAcknowledged = uniqueUrls([...previousState.acknowledged, ...previousState.findings.map(finding => finding.url)]);
      // No write just to acknowledge a manual close. Persist actual recoveries,
      // so a later recurrence can become actionable again.
      if (JSON.stringify(previousAcknowledged) !== JSON.stringify(state.acknowledged)) action = 'updated';
    }
  } else if (!state.findings.length) {
    action = 'closed';
  } else if (JSON.stringify(previousState) !== JSON.stringify(state)) {
    action = 'updated';
  }
  const result = { action, dryRun, issueNumber: issue?.number ?? null, state, summary: summarize(report) };
  if (action === 'unchanged') return result;
  const body = renderIssue({ state, report, runUrl });
  if (dryRun) return { ...result, body };
  if (action === 'created') {
    const created = await client.request('POST', `/repos/${repository}/issues`, { title: ISSUE_TITLE, body });
    return { ...result, issueNumber: created.number };
  }
  const update = { body };
  if (action === 'closed') Object.assign(update, { state: 'closed', state_reason: 'completed' });
  if (action === 'reopened') update.state = 'open';
  await client.request('PATCH', `/repos/${repository}/issues/${issue.number}`, update);
  return result;
}
