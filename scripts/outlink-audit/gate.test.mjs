import test from 'node:test';
import assert from 'node:assert/strict';
import { checkGate, cooldownDecision, COOLDOWN_MS, lastAuditStart, selectDeployment, WORKFLOW_PATH } from './gate.mjs';
import { githubClient } from './github.mjs';

const repository = 'owner/site';
const sha = 'a'.repeat(40);
const now = Date.parse('2026-09-30T10:00:00Z');
const check = { id: 10, app: { slug: 'cloudflare-workers-and-pages' }, head_sha: sha,
  status: 'completed', conclusion: 'success', completed_at: '2026-09-30T09:59:00Z',
  details_url: 'https://dash.cloudflare.com/?to=/account/pages/view/dd-marketing/deployment' };
const event = { workflow_run: { event: 'push', head_branch: 'main', head_repository: { full_name: repository },
  head_sha: sha, created_at: '2026-09-30T09:58:00Z', run_attempt: 1 } };
const options = { repository, eventName: 'workflow_run', event, config: { cloudflareProject: 'dd-marketing' },
  now: () => now, sleep: async () => {}, pollAttempts: 2 };

function fakeClient({ artifacts = [], checks = [check], mainSha = sha } = {}) {
  const calls = [];
  return { calls, async request(method, path) {
    calls.push([method, path]);
    if (path.includes('/actions/artifacts?')) return { artifacts };
    if (path.includes('/actions/runs/')) return { path: WORKFLOW_PATH, head_repository: { full_name: repository }, head_branch: 'main' };
    if (path.endsWith('/git/ref/heads/main')) return { object: { sha: mainSha } };
    if (path.includes('/check-runs?')) return { check_runs: checks };
    throw new Error(`Unexpected request: ${method} ${path}`);
  } };
}
const marker = { name: 'outlink-audit-start', created_at: new Date(now - 1000).toISOString(), expired: false,
  workflow_run: { id: 11, head_branch: 'main' } };

test('nine-day boundary is rolling and exact; explicit override is separate', () => {
  assert.equal(cooldownDecision(new Date(now - COOLDOWN_MS + 1).toISOString(), now).due, false);
  assert.equal(cooldownDecision(new Date(now - COOLDOWN_MS).toISOString(), now).due, true);
  assert.equal(cooldownDecision(null, now).due, true);
  assert.equal(cooldownDecision(marker.created_at, now, true).due, true);
  assert.throws(() => cooldownDecision('invalid', now));
});
test('no audit marker means successful skipped workflows do not move cooldown', async () => {
  assert.equal(await lastAuditStart(fakeClient(), repository), null);
  assert.equal((await checkGate({ ...options, client: fakeClient() })).due, true);
});
test('a started failed attempt still blocks; no deployment requests while cooling down', async () => {
  const client = fakeClient({ artifacts: [marker] });
  const result = await checkGate({ ...options, client });
  assert.equal(result.due, false);
  assert.equal(client.calls.some(([, path]) => path.includes('/check-runs')), false);
});
test('only markers from this workflow on main count; state lookup errors fail closed', async () => {
  assert.equal(await lastAuditStart(fakeClient({ artifacts: [{ ...marker, workflow_run: { id: 1, head_branch: 'feature' } }] }), repository), null);
  const wrongWorkflow = fakeClient({ artifacts: [marker] });
  const request = wrongWorkflow.request.bind(wrongWorkflow);
  wrongWorkflow.request = (method, path) => path.includes('/actions/runs/') ? { path: 'other.yml' } : request(method, path);
  assert.equal(await lastAuditStart(wrongWorkflow, repository), null);
  await assert.rejects(checkGate({ ...options, client: { request: async () => { throw new Error('API down'); } } }), /API down/);
});
test('artifacts paginate rather than losing a cooldown marker after page one', async () => {
  const client = fakeClient();
  const request = client.request.bind(client);
  client.request = (method, path) => path.includes('/actions/artifacts?')
    ? { artifacts: path.endsWith('page=1') ? Array.from({ length: 100 }, () => ({ ...marker, expired: true })) : [marker] }
    : request(method, path);
  assert.equal(await lastAuditStart(client, repository), marker.created_at);
});
test('preview pushes, foreign repositories, and CI reruns cannot trigger an automatic scan', async () => {
  for (const change of [{ head_branch: 'feature' }, { event: 'pull_request' }, { head_repository: { full_name: 'fork/site' } }, { run_attempt: 2 }]) {
    const client = { request: () => assert.fail('No API calls expected') };
    assert.equal((await checkGate({ ...options, client, event: { workflow_run: { ...event.workflow_run, ...change } } })).due, false);
  }
});
test('an old main commit is skipped before deployment polling', async () => {
  assert.equal((await checkGate({ ...options, client: fakeClient({ mainSha: 'b'.repeat(40) }) })).due, false);
});
test('matching successful project deployment permits scan, other projects and stale checks do not', async () => {
  const result = await checkGate({ ...options, client: fakeClient() });
  assert.equal(result.due, true);
  assert.equal(result.sha, sha);
  for (const change of [{ head_sha: 'b'.repeat(40) }, { app: { slug: 'github-actions' } },
    { details_url: 'https://dash.cloudflare.com/?to=/account/pages/view/other/deployment' },
    { completed_at: '2026-09-20T09:59:00Z' }, { completed_at: null }]) {
    await assert.rejects(checkGate({ ...options, client: fakeClient({ checks: [{ ...check, ...change }] }) }), /No recent successful/);
  }
});
test('a newer failed deployment wins over an earlier success for the same commit', async () => {
  const result = await checkGate({ ...options, client: fakeClient({ checks: [check, { ...check, id: 11, conclusion: 'failure' }] }) });
  assert.equal(result.due, false);
});
test('a newer queued deployment without timestamps cannot fall back to an older success', async () => {
  const queued = { ...check, id: 11, status: 'queued', conclusion: null, completed_at: null, started_at: null };
  await assert.rejects(checkGate({ ...options, client: fakeClient({ checks: [check, queued] }) }), /No recent successful/);
});
test('pending deployment is polled and another main push prevents obsolete scan', async () => {
  let polls = 0;
  let refs = 0;
  const client = fakeClient();
  const request = client.request.bind(client);
  client.request = (method, path) => {
    if (path.includes('/check-runs?')) return { check_runs: [++polls === 1 ? { ...check, status: 'in_progress' } : check] };
    if (path.endsWith('/git/ref/heads/main')) return { object: { sha: ++refs === 1 ? sha : 'b'.repeat(40) } };
    return request(method, path);
  };
  assert.equal((await checkGate({ ...options, client })).due, false);
  assert.equal(polls, 2);
});
test('manual force bypasses cooldown but still requires a successful production check', async () => {
  const manual = { ...options, eventName: 'workflow_dispatch', event: { inputs: { force: 'true' } } };
  assert.equal((await checkGate({ ...manual, client: fakeClient({ artifacts: [marker] }) })).due, true);
  assert.equal((await checkGate({ ...manual, client: fakeClient({ checks: [{ ...check, conclusion: 'failure' }] }) })).due, false);
});
test('the real Cloudflare details URL shape matches the configured project', () => {
  assert.equal(selectDeployment([check], { sha, project: 'dd-marketing' }).id, 10);
});
test('GitHub transport keeps credentials confined and does not follow redirects', async () => {
  let requests = 0;
  const client = githubClient({ token: 'test-token', fetchImpl: async (url, init) => {
    requests++;
    assert.equal(url, 'https://api.github.com/repos/owner/site/issues');
    assert.equal(init.redirect, 'error');
    assert.equal(init.headers.Authorization, 'Bearer test-token');
    return new Response(JSON.stringify({ number: 1 }), { status: 201 });
  } });
  assert.deepEqual(await client.request('POST', '/repos/owner/site/issues', { title: 'Test' }), { number: 1 });
  await assert.rejects(client.request('GET', 'https://third-party.example/'), /Invalid GitHub/);
  assert.equal(requests, 1);
});
