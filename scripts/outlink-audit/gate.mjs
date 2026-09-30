import { paginate } from './github.mjs';

export const COOLDOWN_MS = 9 * 24 * 60 * 60 * 1000;
export const START_ARTIFACT = 'outlink-audit-start';
export const WORKFLOW_PATH = '.github/workflows/outlink-audit.yml';

export function selectDeployment(checks, { sha, project, notBefore = 0 }) {
  const latest = checks.filter(check => {
    if (check.app?.slug !== 'cloudflare-workers-and-pages' || check.head_sha !== sha) return false;
    try {
      const url = new URL(check.details_url);
      return url.hostname === 'dash.cloudflare.com' &&
        new URLSearchParams(url.search).get('to')?.includes(`/pages/view/${project}/`);
    } catch { return false; }
  }).sort((a, b) => b.id - a.id)[0];
  // Select the newest deployment BEFORE testing timestamps. A queued check may
  // not have timestamps yet; never fall back to an older successful deployment.
  if (!latest || latest.status !== 'completed') return latest;
  const timestamp = Date.parse(latest.completed_at || latest.started_at);
  return Number.isFinite(timestamp) && timestamp >= notBefore ? latest : undefined;
}

export function cooldownDecision(startedAt, now = Date.now(), force = false) {
  if (startedAt !== null && !Number.isFinite(Date.parse(startedAt))) throw new Error('Invalid audit-start timestamp.');
  const nextEligibleAt = startedAt === null ? null : new Date(Date.parse(startedAt) + COOLDOWN_MS).toISOString();
  return { due: force || startedAt === null || now >= Date.parse(nextEligibleAt), nextEligibleAt };
}

export async function lastAuditStart(client, repository) {
  const artifacts = await paginate(client, `/repos/${repository}/actions/artifacts?name=${START_ARTIFACT}`, 'artifacts');
  const candidates = artifacts.filter(artifact => !artifact.expired && artifact.name === START_ARTIFACT &&
    artifact.workflow_run?.head_branch === 'main').sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  for (const artifact of candidates) {
    const run = await client.request('GET', `/repos/${repository}/actions/runs/${artifact.workflow_run.id}`);
    if (run.path === WORKFLOW_PATH && run.head_repository?.full_name === repository && run.head_branch === 'main') {
      // Artifact creation precedes all crawling. Skipped workflows never upload one.
      if (!Number.isFinite(Date.parse(artifact.created_at))) throw new Error('Malformed audit-start artifact.');
      return artifact.created_at;
    }
  }
  return null;
}

export async function checkGate({ client, repository, eventName, event, config, now = Date.now,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), pollAttempts = 40, pollMs = 15000 }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('Invalid repository.');
  const manual = eventName === 'workflow_dispatch';
  const run = event.workflow_run;
  if (!manual && (eventName !== 'workflow_run' || run?.event !== 'push' || run.head_branch !== 'main' ||
    run.head_repository?.full_name !== repository)) return { due: false, reason: 'Not a production main-branch push.' };
  if (!manual && run.run_attempt > 1) return { due: false, reason: 'Rerunning CI is not a new deployment; use manual dispatch to retry an audit.' };
  const force = manual && (event.inputs?.force === 'true' || event.inputs?.force === true);
  const cooldown = cooldownDecision(await lastAuditStart(client, repository), now(), force);
  if (!cooldown.due) return { ...cooldown, reason: `Nine-day cooldown; next eligible ${cooldown.nextEligibleAt}.` };

  const currentMain = await client.request('GET', `/repos/${repository}/git/ref/heads/main`);
  const sha = manual ? currentMain.object.sha : run.head_sha;
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Invalid production commit.');
  if (sha !== currentMain.object.sha) return { due: false, reason: 'A newer main commit superseded this deployment.' };
  // Cloudflare emits Checks, not deployment_status, in this repository. A fresh
  // main push identifies the production build; old checks from CI reruns don't.
  const notBefore = manual ? 0 : Date.parse(run.created_at) - 120000;
  if (!Number.isFinite(notBefore)) throw new Error('Missing triggering CI timestamp.');
  for (let attempt = 0; attempt < pollAttempts; attempt++) {
    const checks = await paginate(client, `/repos/${repository}/commits/${sha}/check-runs?filter=all`, 'check_runs');
    const deployment = selectDeployment(checks, { sha, project: config.cloudflareProject, notBefore });
    if (deployment?.status === 'completed') {
      if (deployment.conclusion !== 'success') return { due: false, reason: 'Cloudflare deployment did not succeed.' };
      const latest = await client.request('GET', `/repos/${repository}/git/ref/heads/main`);
      if (latest.object.sha !== sha) return { due: false, reason: 'A newer deployment superseded this run.' };
      return { due: true, sha, deploymentId: deployment.id, reason: force ? 'Manual cooldown override; production verified.' : 'Production deployed and nine-day cooldown elapsed.' };
    }
    if (attempt < pollAttempts - 1) await sleep(pollMs);
  }
  throw new Error('No recent successful production deployment could be verified within ten minutes. No cooldown was recorded.');
}
