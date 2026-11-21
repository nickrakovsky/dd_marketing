import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { handleNotification, purgeLiveDeployment, singleFlight } from './cloudflare-cache-purge/core.mjs';

const sha = 'a'.repeat(40);
const account = 'b'.repeat(32), zone = 'c'.repeat(32);
const deployment = '12345678-1234-1234-1234-123456789abc';
const nextDeployment = '87654321-1234-1234-1234-123456789abc';
const env = { CF_ACCOUNT_ID: account, CF_ZONE_ID: zone, CF_PURGE_API_TOKEN: 'api-secret-marker', WEBHOOK_SECRET: 'd'.repeat(64) };
const project = () => ({ name: 'dd-marketing', production_branch: 'main', domains: ['datadocks.com'],
  canonical_deployment: { id: deployment, environment: 'production',
    deployment_trigger: { metadata: { branch: 'main', commit_hash: sha, commit_dirty: false } },
    latest_stage: { name: 'deploy', status: 'success' } },
});
const identity = { id: deployment, sha };
const notification = { alert_type: 'pages_event_alert', account_id: account, data: { alert_name: 'pages_event_alert',
  account_tag: account, project_name: 'dd-marketing', environment: 'ENVIRONMENT_PRODUCTION',
  event: 'EVENT_DEPLOYMENT_SUCCESS', deployment_id: deployment, commit_hash: sha } };
function request(body = notification, { secret = env.WEBHOOK_SECRET, path = '/pages-deployed', method = 'POST' } = {}) {
  return new Request('https://purger.example.workers.dev'+path, { method,
    headers: { 'cf-webhook-auth': secret, 'Content-Type': 'application/json' },
    ...(method === 'GET' ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });
}
function harness({ projects = [project()], fail = false } = {}) {
  const requests = [], state = new Map();
  let reads = 0;
  const storage = { get: async key => state.get(key), put: async (key, value) => { state.set(key, value); } };
  const fetchImpl = async (url, options) => {
    requests.push({ url, ...options });
    assert.equal(options.redirect, 'manual');
    assert.equal(options.headers.Authorization, `Bearer ${env.CF_PURGE_API_TOKEN}`);
    if (options.method === 'POST') {
      assert.equal(url, `https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`);
      assert.deepEqual(JSON.parse(options.body), { hosts: ['datadocks.com'] });
      return Response.json({ success: !fail, errors: [{ message: 'api-secret-marker' }] });
    }
    assert.equal(url, `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/dd-marketing`);
    return Response.json({ success: true, result: projects[Math.min(reads++, projects.length - 1)] });
  };
  return { storage, state, requests, run: (expected = identity) => purgeLiveDeployment(env, storage, expected, fetchImpl),
    posts: () => requests.filter(x => x.method === 'POST') };
}

test('successful live production deployment purges exactly datadocks.com and records success', async () => {
  const h = harness();
  const result = await h.run();
  assert.equal(result.purged, true);
  assert.equal(h.posts().length, 1);
  assert.equal(h.state.get('last-purged').id, deployment);
  assert.equal(h.requests[1].method, 'GET');
  assert.deepEqual(JSON.parse(h.posts()[0].body), { hosts: ['datadocks.com'] });
});

test('duplicate notifications do not purge the same deployment again', async () => {
  const h = harness();
  assert.equal((await h.run()).purged, true);
  assert.equal((await h.run()).purged, false);
  assert.equal(h.posts().length, 1);
});

test('a new production deployment causes another purge', async () => {
  const next = project(); next.canonical_deployment.id = nextDeployment;
  const h = harness({ projects: [project(), project(), next, next] });
  assert.equal((await h.run()).purged, true);
  assert.equal((await h.run({ id: nextDeployment, sha })).purged, true);
  assert.equal(h.posts().length, 2);
});

test('coordinator coalesces concurrent deliveries and permits later deployments', async () => {
  const h = harness(); let calls = 0;
  const coordinate = singleFlight(async () => { calls++; return h.run(); });
  const results = await Promise.all(Array.from({ length: 10 }, () => coordinate()));
  assert.equal(calls, 1);
  assert.equal(h.posts().length, 1);
  assert.ok(results.every(result => result.purged));
  assert.equal((await coordinate()).purged, false);
});

test('preview, failed, unfinished, skipped, dirty and wrong-branch deployments cannot purge', async () => {
  for (const change of [
    p => { p.canonical_deployment.environment = 'preview'; },
    p => { p.canonical_deployment.latest_stage.status = 'failure'; },
    p => { p.canonical_deployment.latest_stage.name = 'build'; },
    p => { p.canonical_deployment.is_skipped = true; },
    p => { p.canonical_deployment.deployment_trigger.metadata.commit_dirty = true; },
    p => { p.canonical_deployment.deployment_trigger.metadata.branch = 'feature'; },
    p => { p.canonical_deployment.deployment_trigger.metadata.commit_hash = 'invalid'; },
    p => { p.canonical_deployment.id = undefined; },
  ]) {
    const p = project(); change(p); const h = harness({ projects: [p] });
    assert.equal((await h.run()).purged, false);
    assert.equal(h.posts().length, 0);
    assert.equal(h.state.size, 0);
  }
});

test('wrong project, production branch and app-only domains fail closed', async () => {
  for (const change of [p => { p.name = 'application'; }, p => { p.production_branch = 'preview'; },
    p => { p.domains = ['www.datadocks.com', 'booking.datadocks.com']; }]) {
    const p = project(); change(p); const h = harness({ projects: [p] });
    await assert.rejects(h.run(), /Unexpected project/);
    assert.equal(h.posts().length, 0);
  }
});

test('a deployment changing during verification is not purged', async () => {
  const next = project(); next.canonical_deployment.id = nextDeployment;
  const h = harness({ projects: [project(), next] });
  await assert.rejects(h.run(), /deployment changed/);
  assert.equal(h.posts().length, 0);
});

test('a rejected purge is not recorded and can be retried', async () => {
  const h = harness({ fail: true });
  await assert.rejects(h.run(), /request rejected/);
  assert.equal(h.state.size, 0);
  await assert.rejects(h.run(), /request rejected/);
  assert.equal(h.posts().length, 2);
});

test('missing configuration makes no API requests', async () => {
  for (const change of [{ CF_PURGE_API_TOKEN: '' }, { CF_ZONE_ID: '../other-zone' }, { CF_ACCOUNT_ID: '' }]) {
    let calls = 0;
    await assert.rejects(purgeLiveDeployment({ ...env, ...change }, {}, identity, async () => { calls++; }), /Configure/);
    assert.equal(calls, 0);
  }
});

test('an API redirect fails without following or forwarding credentials', async () => {
  let calls = 0;
  await assert.rejects(purgeLiveDeployment(env, {}, identity, async (_url, options) => {
    calls++;
    assert.equal(options.redirect, 'manual');
    return new Response(null, { status: 302, headers: { Location: 'https://untrusted.example/' } });
  }), /HTTP 302/);
  assert.equal(calls, 1);
});

test('authenticated Pages notification invokes coordinator', async () => {
  let calls = 0;
  const response = await handleNotification(request(), env, async () => { calls++; return { purged: true }; });
  assert.equal(response.status, 200);
  assert.equal(calls, 1);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('staging or preview notifications cannot purge even when an unpurged production deployment exists', async () => {
  const variants = [
    { environment: 'preview' }, { environment: 'staging' },
    { environment: 'ENVIRONMENT_PREVIEW' }, { environment: 'ENVIRONMENT_STAGING' },
    { environment: undefined }, { event: 'EVENT_DEPLOYMENT_STARTED' },
    { event: 'EVENT_DEPLOYMENT_FAILED' }, { event: undefined },
    { project_name: 'dd-marketing-staging' }, { branch: 'staging' },
    { account_tag: 'e'.repeat(32) },
  ];
  for (const change of variants) {
    const h = harness(); let coordinatorCalls = 0;
    const payload = { ...notification, data: { ...notification.data, ...change } };
    const response = await handleNotification(request(payload), env, expected => {
      coordinatorCalls++; return h.run(expected);
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).purged, false);
    assert.equal(coordinatorCalls, 0);
    assert.equal(h.requests.length, 0);
    assert.equal(h.state.size, 0);
  }
});

test('production success purges only the matching live deployment, not a different preview or stale notification', async () => {
  for (const change of [{ deployment_id: nextDeployment }, { commit_hash: 'e'.repeat(40) }]) {
    const h = harness();
    const response = await handleNotification(request({ ...notification, data: { ...notification.data, ...change } }), env, h.run);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).purged, false);
    assert.equal(h.posts().length, 0);
    assert.equal(h.state.size, 0);
  }
});

test('production success without a usable deployment identity is rejected before coordination', async () => {
  for (const change of [{ deployment_id: undefined }, { deployment_id: 'invalid' }, { commit_hash: 'invalid' }]) {
    const response = await handleNotification(request({ ...notification, data: { ...notification.data, ...change } }), env,
      () => { throw Error('must not coordinate'); });
    assert.equal(response.status, 400);
  }
});

test('an old event failing during a production switch cannot swallow the newer successful event', async () => {
  const next = project(); next.canonical_deployment.id = nextDeployment;
  const h = harness({ projects: [project(), next, next, next] });
  const coordinate = singleFlight(h.run);
  const result = await Promise.allSettled([coordinate(identity), coordinate({ id: nextDeployment, sha })]);
  assert.equal(result[0].status, 'rejected');
  assert.equal(result[1].status, 'fulfilled');
  assert.equal(result[1].value.purged, true);
  assert.equal(h.posts().length, 1);
  assert.equal(h.state.get('last-purged').id, nextDeployment);
});

test('missing/wrong/short webhook secrets reject before any coordinator call', async () => {
  for (const [req, configuration] of [[request(undefined, { secret: '' }), env],
    [request(undefined, { secret: 'wrong' }), env], [request(), { ...env, WEBHOOK_SECRET: 'short' }]]) {
    const response = await handleNotification(req, configuration, () => { throw Error('must not run'); });
    assert.equal(response.status, 401);
  }
});

test('Save and Test, unrelated alerts and another account never purge', async () => {
  for (const payload of [{ text: 'Hello World! This is a test message sent from https://cloudflare.com.' },
    { ...notification, alert_type: 'workers_alert' }, { ...notification, account_id: 'e'.repeat(32) }]) {
    const response = await handleNotification(request(payload), env, () => { throw Error('must not run'); });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).purged, false);
  }
});

test('documented optional envelope fields may be omitted without relaxing deployment checks', async () => {
  const { alert_type: _type, account_id: _account, ...payload } = notification;
  let seen;
  const response = await handleNotification(request(payload), env, async expected => {
    seen = expected; return { purged: false };
  });
  assert.equal(response.status, 200);
  assert.deepEqual(seen, identity);
});

test('payload cannot override hostname, zone or deployment verification', async () => {
  const h = harness();
  const response = await handleNotification(request({ ...notification, hosts: ['booking.datadocks.com'],
    purge_everything: true, zone: 'attacker', deployment: 'attacker' }), env, h.run);
  assert.equal(response.status, 200);
  assert.equal(h.posts().length, 1);
});

test('malformed, oversized, wrong-path and wrong-method requests cannot purge', async () => {
  for (const [req, status] of [[request('invalid json'), 400], [request(' '.repeat(65537)), 413],
    [request(null), 400], [request([], {}), 400], [request(undefined, { path: '/other' }), 404],
    [request(undefined, { method: 'GET' }), 405]]) {
    const response = await handleNotification(req, env, () => { throw Error('must not run'); });
    assert.equal(response.status, status);
  }
});

test('failure responses do not leak tokens or upstream messages', async () => {
  const response = await handleNotification(request(), env, async () => { throw Error('api-secret-marker'); });
  assert.equal(response.status, 502);
  assert.doesNotMatch(await response.text(), /api-secret-marker/);
});

test('GitHub has offline tests only; deployed helper has no marketing/app routes', () => {
  const workflowRoot = new URL('../.github/workflows/', import.meta.url);
  assert.equal(fs.existsSync(new URL('purge-production-cache.yml', workflowRoot)), false);
  for (const name of fs.readdirSync(workflowRoot)) {
    assert.doesNotMatch(fs.readFileSync(new URL(name, workflowRoot), 'utf8'), /CF_PURGE_API_TOKEN|WEBHOOK_SECRET/);
  }
  const ci = fs.readFileSync(new URL('ci.yml', workflowRoot), 'utf8');
  assert.match(ci, /wrangler deploy --dry-run/);
  assert.doesNotMatch(ci, /wrangler deploy (?!\-\-dry-run)/);
  const config = fs.readFileSync(new URL('./cloudflare-cache-purge/wrangler.jsonc', import.meta.url), 'utf8');
  assert.match(config, /"routes": \[\]/);
  assert.match(config, /"keep_vars": true/);
  assert.match(config, /"preview_urls": false/);
  assert.doesNotMatch(config, /"CF_PURGE_API_TOKEN"\s*:/);
});
