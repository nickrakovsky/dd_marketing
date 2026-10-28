import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { purgeProductionCache } from './purge-production-cache.mjs';

const sha = 'a'.repeat(40);
const newerSha = 'b'.repeat(40);
const accountId = 'c'.repeat(32);
const zoneId = 'd'.repeat(32);
const deploymentId = '12345678-1234-1234-1234-123456789abc';
const repository = 'nickrakovsky/dd_marketing';
const checkEvent = () => ({ action: 'completed', check_run: {
  app: { slug: 'cloudflare-workers-and-pages' }, status: 'completed', conclusion: 'success', head_sha: sha,
  details_url: `https://dash.cloudflare.com/?to=/${accountId}/pages/view/dd-marketing/${deploymentId}`,
} });
const project = () => ({ name: 'dd-marketing', production_branch: 'main', domains: ['datadocks.com'],
  canonical_deployment: { id: deploymentId, environment: 'production',
    deployment_trigger: { metadata: { branch: 'main', commit_hash: sha } },
    latest_stage: { name: 'deploy', status: 'success' } },
});

function harness({ projects = [project()], heads = [sha], purgeResponses = [] } = {}) {
  const requests = [];
  let projectReads = 0, headReads = 0, purgeCalls = 0;
  const fetchImpl = async (url, options) => {
    requests.push({ url, ...options });
    if (url.startsWith('https://api.github.com/')) {
      assert.equal(options.method, 'GET');
      return Response.json({ object: { sha: heads[Math.min(headReads++, heads.length - 1)] } });
    }
    assert.equal(new URL(url).origin, 'https://api.cloudflare.com');
    assert.equal(options.redirect, 'error');
    if (options.method === 'POST') {
      assert.equal(url, `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`);
      assert.deepEqual(JSON.parse(options.body), { hosts: ['datadocks.com'] });
      const response = purgeResponses[purgeCalls++];
      return response ?? Response.json({ success: true, result: { id: 'purge-id' } });
    }
    assert.equal(url, `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/dd-marketing`);
    return Response.json({ success: true, result: projects[Math.min(projectReads++, projects.length - 1)] });
  };
  const options = { eventName: 'check_run', event: checkEvent(), repository, ref: 'refs/heads/main',
    githubToken: 'github-test-token', token: 'cloudflare-test-token', accountId, zoneId,
    fetchImpl, sleep: async () => {}, pollAttempts: 2, pollMs: 0 };
  return { options, requests, run: overrides => purgeProductionCache({ ...options, ...overrides }),
    posts: () => requests.filter(request => request.method === 'POST') };
}

test('verified live production deployment purges exactly the apex host after all verification', async () => {
  const h = harness();
  const result = await h.run();
  assert.equal(result.purged, true);
  assert.equal(result.deployment, deploymentId);
  assert.equal(h.posts().length, 1);
  assert.equal(h.requests.at(-2).url, `https://api.github.com/repos/${repository}/git/ref/heads/main`);
  assert.deepEqual(JSON.parse(h.posts()[0].body), { hosts: ['datadocks.com'] });
});

test('CI main-push fallback and main-only manual retry verify the live deployment too', async () => {
  const h = harness();
  const event = { action: 'completed', workflow_run: { event: 'push', head_branch: 'main',
    head_sha: sha, head_repository: { full_name: repository } } };
  assert.equal((await h.run({ eventName: 'workflow_run', event })).purged, true);
  assert.equal((await h.run({ eventName: 'workflow_dispatch', event: {} })).purged, true);
  assert.equal((await h.run({ eventName: 'workflow_dispatch', ref: 'refs/heads/feature', event: {} })).purged, false);
  assert.equal(h.posts().length, 2);
});

test('irrelevant, failed, foreign, fork and PR triggers make no requests', async () => {
  const variants = [
    { eventName: 'push' }, { repository: 'someone/fork' },
    { event: { action: 'completed', check_run: { ...checkEvent().check_run, conclusion: 'failure' } } },
    { event: { action: 'completed', check_run: { ...checkEvent().check_run, app: { slug: 'github-actions' } } } },
    { event: { action: 'completed', check_run: { ...checkEvent().check_run, details_url: 'https://evil.test/?to=/anything' } } },
    { eventName: 'workflow_run', event: { action: 'completed', workflow_run: { event: 'pull_request', head_branch: 'main', head_sha: sha, head_repository: { full_name: repository } } } },
    { eventName: 'workflow_run', event: { action: 'completed', workflow_run: { event: 'push', head_branch: 'preview', head_sha: sha, head_repository: { full_name: repository } } } },
  ];
  for (const variant of variants) {
    const h = harness();
    assert.equal((await h.run(variant)).purged, false);
    assert.equal(h.requests.length, 0);
  }
});

test('preview of the same main SHA cannot purge production', async () => {
  const live = project();
  live.canonical_deployment.id = '87654321-1234-1234-1234-123456789abc';
  const h = harness({ projects: [live] });
  assert.equal((await h.run()).purged, false);
  assert.equal(h.posts().length, 0);
});

test('a preview commit, another account and superseded main skip before Cloudflare requests', async () => {
  const h = harness();
  const event = checkEvent(); event.check_run.head_sha = newerSha;
  assert.equal((await h.run({ event })).purged, false);
  assert.equal((await h.run({ accountId: 'e'.repeat(32) })).purged, false);
  assert.equal(h.requests.some(request => request.url.startsWith('https://api.cloudflare.com')), false);
});

test('waits for deploy success rather than purging after build success', async () => {
  const building = project(); building.canonical_deployment.latest_stage.name = 'build';
  const h = harness({ projects: [building, project()] });
  assert.equal((await h.run()).purged, true);
  assert.equal(h.requests.filter(request => request.url.includes('/pages/projects/')).length, 2);
  assert.equal(h.posts().length, 1);
});

test('unverified, failed, skipped and wrong-branch production builds never purge', async () => {
  for (const change of [
    p => { p.canonical_deployment.environment = 'preview'; },
    p => { p.canonical_deployment.latest_stage.status = 'failure'; },
    p => { p.canonical_deployment.latest_stage.status = 'active'; },
    p => { p.canonical_deployment.latest_stage.status = 'skipped'; },
    p => { p.canonical_deployment.is_skipped = true; },
    p => { p.canonical_deployment.id = undefined; },
    p => { p.canonical_deployment.deployment_trigger.metadata.commit_dirty = true; },
    p => { p.canonical_deployment.deployment_trigger.metadata.branch = 'feature'; },
    p => { p.canonical_deployment.deployment_trigger.metadata.commit_hash = newerSha; },
  ]) {
    const p = project(); change(p);
    const h = harness({ projects: [p] });
    await assert.rejects(h.run(), /No successful current production deployment/);
    assert.equal(h.posts().length, 0);
  }
});

test('wrong project, production branch, missing apex domain or missing configuration fail closed', async () => {
  for (const change of [p => { p.name = 'application'; }, p => { p.production_branch = 'feature'; },
    p => { p.domains = ['www.datadocks.com', 'booking.datadocks.com']; }]) {
    const p = project(); change(p);
    const h = harness({ projects: [p] });
    await assert.rejects(h.run(), /Unexpected Cloudflare Pages project/);
    assert.equal(h.posts().length, 0);
  }
  const h = harness();
  await assert.rejects(h.run({ token: '' }), /Configure CF_ACCOUNT_ID/);
  await assert.rejects(h.run({ zoneId: '../another-zone' }), /Configure CF_ACCOUNT_ID/);
  assert.equal(h.posts().length, 0);
});

test('main advancing while deployment is verified prevents an obsolete purge', async () => {
  const h = harness({ heads: [sha, sha, newerSha] });
  assert.equal((await h.run()).purged, false);
  assert.equal(h.posts().length, 0);
});

test('rate-limit retry retains the same exact-host payload', async () => {
  const h = harness({ purgeResponses: [Response.json({ success: false }, { status: 429 })] });
  assert.equal((await h.run()).purged, true);
  assert.equal(h.posts().length, 2);
});

test('Cloudflare rejection fails visibly without leaking response contents or broadening scope', async () => {
  const h = harness({ purgeResponses: [Response.json({ success: false, errors: [{ message: 'secret-marker' }] })] });
  await assert.rejects(h.run(), error => /cache purge rejected/.test(error.message) && !error.message.includes('secret-marker'));
  assert.equal(h.posts().length, 1);
});

test('workflow executes trusted main without write permissions or PR artifacts', () => {
  const yaml = fs.readFileSync(new URL('../.github/workflows/purge-production-cache.yml', import.meta.url), 'utf8');
  assert.match(yaml, /ref: main/);
  assert.match(yaml, /persist-credentials: false/);
  assert.doesNotMatch(yaml, /: write|download-artifact|pull_request_target|cancel-in-progress: true/);
  assert.match(yaml, /check_run:/);
  assert.match(yaml, /workflow_run:/);
});
