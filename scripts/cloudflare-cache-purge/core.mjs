const HOST = 'datadocks.com';
const PROJECT = 'dd-marketing';
const API = 'https://api.cloudflare.com/client/v4';
const ID = /^[a-f0-9]{32}$/;
const SHA = /^[a-f0-9]{40}$/;
const DEPLOYMENT_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

const reply = (body, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store' },
});

async function secretMatches(provided, expected) {
  if (typeof expected !== 'string' || expected.length < 32 || !provided || provided.length > 1024) return false;
  const encode = value => new TextEncoder().encode(value);
  const [a, b] = await Promise.all([provided, expected].map(value => crypto.subtle.digest('SHA-256', encode(value))));
  const left = new Uint8Array(a), right = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  return difference === 0;
}

async function readPayload(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Invalid payload');
  const chunks = [];
  let size = 0;
  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
    const { value } = chunk;
    size += value.byteLength;
    if (size > 65536) { await reader.cancel(); throw new Error('Payload too large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function handleNotification(request, env, coordinate) {
  const url = new URL(request.url);
  if (url.pathname !== '/pages-deployed') return reply({ error: 'Not found' }, 404);
  if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  if (!await secretMatches(request.headers.get('cf-webhook-auth'), env.WEBHOOK_SECRET)) {
    return reply({ error: 'Unauthorized' }, 401);
  }
  let payload;
  try { payload = await readPayload(request); }
  catch (error) { return reply({ error: 'Invalid payload' }, error.message === 'Payload too large' ? 413 : 400); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return reply({ error: 'Invalid payload' }, 400);
  // Save and Test sends only `text`. The alert configuration is the first
  // filter; independently check the notification before consulting production.
  const data = payload.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return reply({ purged: false, reason: 'Test or unrelated notification' });
  }
  if ((payload.alert_type ?? data.alert_name) !== 'pages_event_alert' ||
    (payload.account_id && payload.account_id !== env.CF_ACCOUNT_ID) ||
    (data.account_tag && data.account_tag !== env.CF_ACCOUNT_ID) ||
    data.project_name !== PROJECT ||
    (data.branch !== undefined && data.branch !== 'main') ||
    !['ENVIRONMENT_PRODUCTION', 'production'].includes(data.environment) ||
    data.event !== 'EVENT_DEPLOYMENT_SUCCESS') {
    return reply({ purged: false, reason: 'Not this project\'s production deployment success' });
  }
  if (!DEPLOYMENT_ID.test(data.deployment_id ?? '') ||
    (data.commit_hash !== undefined && !SHA.test(data.commit_hash))) {
    return reply({ error: 'Incomplete production deployment notification' }, 400);
  }
  // Only this identity crosses the internal boundary. It is checked against
  // Cloudflare's live state; hostnames and API paths never come from the body.
  const expected = { id: data.deployment_id, ...(data.commit_hash === undefined ? {} : { sha: data.commit_hash }) };
  try { return reply(await coordinate(expected)); }
  catch { return reply({ error: 'Production verification or purge failed; inspect Worker logs and token configuration' }, 502); }
}

async function cloudflare(path, env, fetchImpl, body) {
  const response = await fetchImpl(`${API}${path}`, {
    // Workers supports follow/manual; manual prevents forwarding this token.
    method: body === undefined ? 'GET' : 'POST', redirect: 'manual',
    headers: { Authorization: `Bearer ${env.CF_PURGE_API_TOKEN}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json().catch(() => null);
  // Do not log token headers, notification bodies or API response bodies.
  if (!response.ok || data?.success !== true) throw new Error(`Cloudflare request rejected (HTTP ${response.status})`);
  return data.result;
}

function liveDeployment(project) {
  if (project?.name !== PROJECT || project.production_branch !== 'main' || !project.domains?.includes(HOST)) {
    throw new Error('Unexpected project or production domain');
  }
  const deployment = project.canonical_deployment;
  const metadata = deployment?.deployment_trigger?.metadata;
  if (!DEPLOYMENT_ID.test(deployment?.id ?? '') || deployment.is_skipped ||
    deployment.environment !== 'production' || metadata?.branch !== 'main' || metadata.commit_dirty ||
    !SHA.test(metadata.commit_hash ?? '') || deployment.latest_stage?.name !== 'deploy' ||
    deployment.latest_stage.status !== 'success') return null;
  return { id: deployment.id, sha: metadata.commit_hash };
}

export async function purgeLiveDeployment(env, storage, expected, fetchImpl = fetch) {
  if (!DEPLOYMENT_ID.test(expected?.id ?? '') ||
    (expected.sha !== undefined && !SHA.test(expected.sha))) throw new Error('Invalid notification deployment identity');
  if (!ID.test(env.CF_ACCOUNT_ID ?? '') || !ID.test(env.CF_ZONE_ID ?? '') || !env.CF_PURGE_API_TOKEN) {
    throw new Error('Configure the Cloudflare Worker variables and API token secret');
  }
  const projectPath = `/accounts/${env.CF_ACCOUNT_ID}/pages/projects/${PROJECT}`;
  const deployment = liveDeployment(await cloudflare(projectPath, env, fetchImpl));
  if (!deployment) return { purged: false, reason: 'No successful live production deployment' };
  if (deployment.id !== expected.id || (expected.sha !== undefined && deployment.sha !== expected.sha)) {
    return { purged: false, reason: 'Notification does not match the live production deployment' };
  }
  const last = await storage.get('last-purged');
  if (last?.id === deployment.id) return { purged: false, reason: 'Already purged this deployment' };
  // A second read prevents an older notification from purging during a switch.
  const current = liveDeployment(await cloudflare(projectPath, env, fetchImpl));
  if (!current || current.id !== deployment.id) throw new Error('Production deployment changed; retry the notification');
  // Fixed selector: no notification, binding, URL or request body can select a subdomain.
  await cloudflare(`/zones/${env.CF_ZONE_ID}/purge_cache`, env, fetchImpl, { hosts: [HOST] });
  await storage.put('last-purged', { ...deployment, at: new Date().toISOString() });
  return { purged: true, hostname: HOST, deployment: deployment.id, sha: deployment.sha };
}

// One durable coordinator serializes concurrent deliveries, including retries.
export function singleFlight(run) {
  const pending = new Map();
  let tail = Promise.resolve();
  return expected => {
    const key = `${expected?.id ?? ''}:${expected?.sha ?? ''}`;
    if (pending.has(key)) return pending.get(key);
    const operation = tail.catch(() => {}).then(() => run(expected));
    tail = operation;
    const result = operation.finally(() => { pending.delete(key); });
    pending.set(key, result);
    return result;
  };
}
