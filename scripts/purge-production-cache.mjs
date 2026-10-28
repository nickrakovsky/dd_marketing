import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { githubClient } from './outlink-audit/github.mjs';

const REPOSITORY = 'nickrakovsky/dd_marketing';
const PROJECT = 'dd-marketing';
const HOSTNAME = 'datadocks.com';
const API = 'https://api.cloudflare.com/client/v4';
const SHA = /^[a-f0-9]{40}$/;
const ID = /^[a-f0-9]{32}$/;
const DEPLOYMENT_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

function triggeringDeployment(eventName, event, repository, ref) {
  if (repository !== REPOSITORY) return null;
  if (eventName === 'workflow_dispatch') return ref === 'refs/heads/main' ? {} : null;
  if (eventName === 'workflow_run') {
    const run = event.workflow_run;
    return event.action === 'completed' && run?.event === 'push' &&
      run.head_branch === 'main' && run.head_repository?.full_name === repository &&
      SHA.test(run.head_sha) ? { sha: run.head_sha } : null;
  }
  const check = event.check_run;
  if (eventName !== 'check_run' || event.action !== 'completed' ||
    check?.app?.slug !== 'cloudflare-workers-and-pages' || check.status !== 'completed' ||
    check.conclusion !== 'success' || !SHA.test(check.head_sha)) return null;
  try {
    const url = new URL(check.details_url);
    const match = url.searchParams.get('to')?.match(/^\/([a-f0-9]{32})\/pages\/view\/dd-marketing\/([a-f0-9-]{36})$/);
    if (url.protocol !== 'https:' || url.hostname !== 'dash.cloudflare.com' || !match) return null;
    return { sha: check.head_sha, account: match[1], deployment: match[2] };
  } catch { return null; }
}

// No caller-supplied hostname, URL list or purge selector can broaden this scope.
async function cloudflareRequest(path, { token, body, fetchImpl, sleep }) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetchImpl(`${API}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      redirect: 'error', signal: AbortSignal.timeout(30000),
    });
    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      await response.body?.cancel();
      await sleep(1000 * (attempt + 1));
      continue;
    }
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.success !== true) {
      // API bodies may contain sensitive data. Do not include them in logs.
      throw new Error(`Cloudflare ${body === undefined ? 'verification' : 'cache purge'} rejected (HTTP ${response.status}).`);
    }
    return data.result;
  }
}

export async function purgeProductionCache({ eventName, event, repository, ref,
  githubToken, accountId, zoneId, token, fetchImpl = fetch,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
  pollAttempts = 40, pollMs = 15000 }) {
  const trigger = triggeringDeployment(eventName, event, repository, ref);
  const skip = reason => ({ purged: false, reason });
  if (!trigger) return skip('Not a production deployment trigger.');
  const github = githubClient({ token: githubToken, fetchImpl });
  const main = () => github.request('GET', `/repos/${REPOSITORY}/git/ref/heads/main`);
  const current = (await main()).object?.sha;
  if (!SHA.test(current)) throw new Error('GitHub did not return a valid main commit.');
  const sha = trigger.sha ?? current;
  if (sha !== current) return skip('A newer main commit superseded this deployment.');
  if (!ID.test(accountId ?? '') || !ID.test(zoneId ?? '') || !token) {
    throw new Error('Configure CF_ACCOUNT_ID, CF_ZONE_ID and CF_PURGE_API_TOKEN in GitHub Actions.');
  }
  if (trigger.account && trigger.account !== accountId) return skip('Different Cloudflare account.');
  const request = (path, body) => cloudflareRequest(path, { token, body, fetchImpl, sleep });

  for (let attempt = 0; attempt < pollAttempts; attempt++) {
    if ((await main()).object?.sha !== sha) return skip('A newer main commit superseded this deployment.');
    const project = await request(`/accounts/${accountId}/pages/projects/${PROJECT}`);
    if (project?.name !== PROJECT || project.production_branch !== 'main' ||
      !project.domains?.includes(HOSTNAME)) throw new Error('Unexpected Cloudflare Pages project or production domain.');
    // canonical_deployment is the deployment currently serving production,
    // unlike latest_deployment, which can refer to a preview or failed build.
    const deployment = project.canonical_deployment;
    const metadata = deployment?.deployment_trigger?.metadata;
    if (DEPLOYMENT_ID.test(deployment?.id ?? '') && !deployment.is_skipped &&
      deployment.environment === 'production' && metadata?.branch === 'main' && !metadata.commit_dirty &&
      metadata.commit_hash === sha && deployment.latest_stage?.name === 'deploy' &&
      deployment.latest_stage.status === 'success') {
      if (trigger.deployment && trigger.deployment !== deployment.id) return skip('Preview or superseded deployment.');
      // Recheck main immediately before the sole mutating API request.
      if ((await main()).object?.sha !== sha) return skip('A newer main commit superseded this deployment.');
      const result = await request(`/zones/${zoneId}/purge_cache`, { hosts: [HOSTNAME] });
      return { purged: true, hostname: HOSTNAME, deployment: deployment.id, sha, purgeId: result?.id };
    }
    if (attempt + 1 < pollAttempts) await sleep(pollMs);
  }
  throw new Error('No successful current production deployment was verified within ten minutes; cache was not purged.');
}

async function main() {
  const result = await purgeProductionCache({
    eventName: process.env.GITHUB_EVENT_NAME,
    event: JSON.parse(await fs.readFile(process.env.GITHUB_EVENT_PATH, 'utf8')),
    repository: process.env.GITHUB_REPOSITORY, ref: process.env.GITHUB_REF,
    githubToken: process.env.GH_TOKEN, accountId: process.env.CF_ACCOUNT_ID,
    zoneId: process.env.CF_ZONE_ID, token: process.env.CF_PURGE_API_TOKEN,
  });
  const message = result.purged
    ? `Purged ${HOSTNAME} only after production deployment ${result.deployment} (${result.sha}).`
    : `Cache purge skipped: ${result.reason}`;
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
