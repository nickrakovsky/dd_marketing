import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ISSUE_MARKER, ISSUE_TITLE, readIssueState, reconcileFindings, renderIssue, summarize, syncIssue,
} from './report.mjs';

const urlA = 'https://external.example/a';
const urlB = 'https://external.example/b';
const parentA = 'https://www.datadocks.com/article-a';
const parentB = 'https://www.datadocks.com/article-b';
const repository = 'example/website';
const runUrl = 'https://github.com/example/website/actions/runs/123';

function dead(url = urlA, parents = [parentA], status = 404) {
  return { url, parents, classification: 'dead', status, checks: [{ status, phase: 'initial' }, { status, phase: 'confirmation' }] };
}

function report(links = [dead()], extra = {}) {
  return {
    schemaVersion: 1,
    startedAt: '2026-09-30T10:00:00.000Z',
    completedAt: '2026-09-30T10:01:00.000Z',
    complete: true,
    siteUrl: 'https://www.datadocks.com/',
    coverage: { pagesScanned: 12, externalUrls: links.length },
    links,
    errors: [],
    ...extra,
  };
}

function state(links = [dead()]) {
  return reconcileFindings({ report: report(links) });
}

function issue(extra = {}, savedState = state()) {
  return {
    number: 42,
    state: 'open',
    user: { type: 'Bot', login: 'github-actions[bot]' },
    body: renderIssue({ state: savedState, report: report(), runUrl }),
    ...extra,
  };
}

function clientFor(issues = []) {
  const requests = [];
  return {
    requests,
    async request(method, path, body) {
      requests.push({ method, path, body });
      if (method === 'GET') {
        const page = Number(new URL(path, 'https://api.github.com').searchParams.get('page'));
        return issues.slice((page - 1) * 100, page * 100);
      }
      return { number: method === 'POST' ? 43 : 42 };
    },
  };
}

function mutations(client) {
  return client.requests.filter(request => request.method !== 'GET');
}

test('files only repeated final 404/410 observations from both verification phases', async () => {
  const client = clientFor();
  const input = report([
    { ...dead(), checks: [{ status: 503, phase: 'initial' }, { status: 404, phase: 'initial' }, { status: 410, phase: 'confirmation' }] },
    { ...dead(urlB), checks: [{ status: 404, phase: 'initial' }] },
    { ...dead('https://external.example/c'), checks: [{ status: 404, phase: 'initial' }, { status: 403, phase: 'confirmation' }] },
    { ...dead('https://external.example/d'), classification: 'unverified' },
    { ...dead('https://external.example/e'), checks: [{ status: 404, phase: 'initial' }, { status: 404, phase: 'initial' }] },
  ]);
  const result = await syncIssue({ report: input, client, repository, runUrl });
  assert.equal(result.action, 'created');
  assert.equal(result.issueNumber, 43);
  assert.deepEqual(result.state.findings.map(finding => [finding.url, finding.status]), [[urlA, 410]]);
  const [write] = mutations(client);
  assert.equal(write.method, 'POST');
  assert.equal(write.body.title, ISSUE_TITLE);
  assert.match(write.body.body, /normal browser/);
  assert.ok(write.body.body.includes(parentA));
  assert.ok(write.body.body.includes(runUrl));
  assert.deepEqual(readIssueState(write.body.body), result.state);
});

test('confirmation retries preserve valid evidence from the initial phase', () => {
  const input = report([{ ...dead(), checks: [
    { status: 404, phase: 'initial' },
    { status: 503, phase: 'confirmation' },
    { status: 404, phase: 'confirmation' },
  ] }]);
  assert.equal(reconcileFindings({ report: input }).findings.length, 1);
});

test('does not create an empty issue for blocked, transient or singly observed failures', async () => {
  const client = clientFor();
  const result = await syncIssue({
    report: report([{ ...dead(), classification: 'unverified', status: 429 }, { ...dead(urlB), checks: [] }]),
    client, repository, runUrl,
  });
  assert.equal(result.action, 'unchanged');
  assert.deepEqual(mutations(client), []);
});

test('deduplicates target fragments and referring pages', () => {
  const merged = state([dead(`${urlA}#one`, [parentA, parentA]), dead(`${urlA}#two`, [parentB])]);
  assert.deepEqual(merged.findings, [{ url: urlA, parents: [parentA, parentB], status: 404, availability: 'dead' }]);
});

test('contradictory duplicate observations do not produce a dead finding', () => {
  const merged = state([dead(), { ...dead(), classification: 'reachable', status: 200 }]);
  assert.deepEqual(merged.findings, []);
});

test('unchanged findings do not update an issue for new timestamps, URL order or run links', async () => {
  const client = clientFor([issue({}, state([dead(urlA, [parentA, parentB])]))]);
  const result = await syncIssue({
    report: report([dead(urlA, [parentB, parentA])], { completedAt: '2026-10-07T10:01:00Z' }),
    client, repository, runUrl: `${runUrl}456`,
  });
  assert.equal(result.action, 'unchanged');
  assert.deepEqual(mutations(client), []);
});

test('unverified observations preserve earlier evidence and become stable after one update', async () => {
  const current = report([{ ...dead(), classification: 'unverified', status: 403, checks: [{ status: 403 }] }]);
  const client = clientFor([issue()]);
  const result = await syncIssue({ report: current, client, repository, runUrl });
  assert.equal(result.action, 'updated');
  assert.equal(result.state.findings[0].status, 404);
  assert.equal(result.state.findings[0].availability, 'unverified');
  const [write] = mutations(client);
  assert.equal(write.body.state, undefined);
  assert.match(write.body.body, /earlier finding remains unresolved/);
  const next = clientFor([issue({ body: write.body.body })]);
  assert.equal((await syncIssue({ report: current, client: next, repository, runUrl })).action, 'unchanged');
  assert.deepEqual(mutations(next), []);
});

test('an incomplete crawl never resolves a missing finding or drops known referring pages', async () => {
  const client = clientFor([issue()]);
  const result = await syncIssue({ report: report([], { complete: false }), client, repository, runUrl });
  assert.equal(result.action, 'updated');
  assert.equal(result.state.findings.length, 1);
  assert.equal(result.state.findings[0].availability, 'unverified');
  assert.equal(mutations(client)[0].body.state, undefined);
  const merged = reconcileFindings({ report: report([dead(urlA, [parentB])], { complete: false }), previousState: state() });
  assert.deepEqual(merged.findings[0].parents, [parentA, parentB]);
});

test('complete removal or verified recovery closes only when every active finding is resolved', async () => {
  const client = clientFor([issue({}, state([dead(urlA), dead(urlB)]))]);
  const input = report([{ ...dead(urlA), classification: 'reachable', status: 200, checks: [{ status: 200 }] }]);
  const result = await syncIssue({ report: input, client, repository, runUrl });
  assert.equal(result.action, 'closed');
  assert.deepEqual(result.state.findings, []);
  assert.equal(mutations(client)[0].body.state, 'closed');
  assert.equal(mutations(client)[0].body.state_reason, 'completed');
  const partial = reconcileFindings({ report: report(input.links, { complete: false }), previousState: state([dead(urlA), dead(urlB)]) });
  assert.deepEqual(partial.findings.map(finding => finding.url), [urlB]);
});

test('explicit suppression resolves a finding even when the crawl is incomplete', () => {
  const result = reconcileFindings({
    report: report([], { complete: false, suppressedUrls: [urlA] }), previousState: state(),
  });
  assert.deepEqual(result.findings, []);
});

test('a manually closed issue stays quiet and its acknowledged rows do not return with unrelated new findings', async () => {
  const closed = issue({ state: 'closed' });
  const client = clientFor([closed]);
  const first = await syncIssue({ report: report(), client, repository, runUrl });
  assert.equal(first.action, 'unchanged');
  assert.deepEqual(mutations(client), []);
  const reopening = clientFor([closed]);
  const second = await syncIssue({ report: report([dead(urlA), dead(urlB)]), client: reopening, repository, runUrl });
  assert.equal(second.action, 'reopened');
  assert.deepEqual(second.state.findings.map(finding => finding.url), [urlB]);
  assert.deepEqual(second.state.acknowledged, [urlA]);
  const [update] = mutations(reopening);
  assert.equal(update.body.state, 'open');
  const following = clientFor([issue({ body: update.body.body })]);
  assert.equal((await syncIssue({ report: report([dead(urlA), dead(urlB)]), client: following, repository, runUrl })).action, 'unchanged');
  assert.deepEqual(mutations(following), []);
});

test('acknowledgment resets on verified recovery, allowing a later recurrence to reopen', async () => {
  const client = clientFor([issue({ state: 'closed' })]);
  const recovered = await syncIssue({
    report: report([{ ...dead(), classification: 'reachable', status: 200 }]), client, repository, runUrl,
  });
  assert.equal(recovered.action, 'updated');
  assert.deepEqual(recovered.state.acknowledged, []);
  assert.deepEqual(recovered.state.findings, []);
  const later = clientFor([issue({ state: 'closed', body: mutations(client)[0].body.body })]);
  const recurred = await syncIssue({ report: report(), client: later, repository, runUrl });
  assert.equal(recurred.action, 'reopened');
  assert.deepEqual(recurred.state.findings.map(finding => finding.url), [urlA]);
});

test('an automatically closed empty issue reopens for repeated dead findings', async () => {
  const client = clientFor([issue({ state: 'closed' }, state([]))]);
  const result = await syncIssue({ report: report(), client, repository, runUrl });
  assert.equal(result.action, 'reopened');
  assert.equal(result.issueNumber, 42);
});

test('finds an existing bot issue on later pages and ignores human copies and pull requests', async () => {
  const unrelated = Array.from({ length: 98 }, (_, index) => ({ number: index + 100, body: 'unrelated', user: { type: 'Bot' } }));
  const client = clientFor([
    issue({ number: 1, user: { type: 'User' } }),
    issue({ number: 2, pull_request: { url: 'https://api.github.com/pulls/2' } }),
    ...unrelated,
    issue(),
  ]);
  const result = await syncIssue({ report: report(), client, repository, runUrl });
  assert.equal(result.action, 'unchanged');
  assert.equal(result.issueNumber, 42);
  assert.equal(client.requests.filter(request => request.method === 'GET').length, 2);
  assert.deepEqual(mutations(client), []);
});

test('prefers an existing open managed issue over a closed one', async () => {
  const client = clientFor([issue({ state: 'closed', number: 2 }), issue()]);
  const result = await syncIssue({ report: report(), client, repository, runUrl });
  assert.equal(result.issueNumber, 42);
  assert.equal(result.action, 'unchanged');
});

test('dry runs propose changes but never mutate, including without a network client', async () => {
  for (const existing of [[], [issue({ state: 'closed' }, state([]))], [issue({}, state([dead(urlB)]))]]) {
    const client = clientFor(existing);
    const result = await syncIssue({ report: report(), client, repository, runUrl, dryRun: true });
    assert.ok(['created', 'reopened', 'updated'].includes(result.action));
    assert.deepEqual(mutations(client), []);
  }
  const local = await syncIssue({ report: report(), repository, runUrl, dryRun: true });
  assert.equal(local.action, 'created');
  assert.ok(local.body.includes(ISSUE_MARKER));
});

test('does not overwrite a managed issue whose state was deleted or corrupted', async () => {
  const client = clientFor([issue({ body: `${ISSUE_MARKER}\nHuman-edited content` })]);
  await assert.rejects(syncIssue({ report: report(), client, repository, runUrl }), /missing its state/);
  assert.deepEqual(mutations(client), []);
});

test('URLs cannot inject Markdown, mentions, unsafe schemes, credentials or issue state comments', () => {
  const maliciousUrl = 'https://external.example/a)[click](javascript:alert(1))?x=@team&y=<!--';
  const input = report([dead(maliciousUrl, [parentA, 'javascript:alert(1)', 'https://user:secret@external.example/'])]);
  const body = renderIssue({ state: reconcileFindings({ report: input }), report: input, runUrl: 'javascript:alert(1)' });
  // Mentions in display text are escaped; an @ inside the safe link destination
  // remains part of the original URL and cannot become a Markdown mention.
  assert.ok(body.includes('&#64;team'));
  assert.ok(!body.includes('](javascript:'));
  assert.ok(!body.includes('user:secret'));
  assert.ok(!body.includes('Evidence for this update'));
  assert.ok(body.includes('%28'));
  assert.equal(readIssueState(body).findings.length, 1);
});

test('summary makes incomplete coverage and unverified results explicit', () => {
  const text = summarize(report([
    dead(), { ...dead(urlB), classification: 'unverified', status: 429 },
    { ...dead('https://external.example/c'), classification: 'reachable', status: 200 },
  ], { complete: false, errors: ['discovery failed'], suppressedUrls: ['https://excluded.example/'] }));
  assert.match(text, /Inventory: \*\*incomplete\*\*/);
  assert.match(text, /Pages scanned: 12/);
  assert.match(text, /Reachable: 1/);
  assert.match(text, /Repeated 404\/410 responses: 1/);
  assert.match(text, /Unverified: 1/);
  assert.match(text, /Explicitly excluded: 1/);
  assert.match(text, /Audit errors: 1/);
});
