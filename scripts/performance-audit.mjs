import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));

// Preserve the existing performance warning and accessibility/CLS error gates.
// Missing measurements fail closed, even when their usual threshold is a warning.
export function evaluateAssertions(report, assertions) {
  if (report.runtimeError) throw new Error(report.runtimeError.message || report.runtimeError.code);
  return Object.entries(assertions).map(([id, [level, limits]]) => {
    const actual = id.startsWith('categories:')
      ? report.categories?.[id.slice('categories:'.length)]?.score
      : report.audits?.[id]?.numericValue;
    const measured = typeof actual === 'number' && Number.isFinite(actual);
    const passed = measured
      && (limits.minScore === undefined || actual >= limits.minScore)
      && (limits.maxNumericValue === undefined || actual <= limits.maxNumericValue);
    return { id, level: measured ? level : 'error', actual: measured ? actual : null, ...limits, passed };
  });
}

async function responds(url) {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(1000) })).ok;
  } catch { return false; }
}

async function localServer(url) {
  const origin = new URL(url);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) || await responds(url)) return;
  // The Pages adapter does not implement `astro preview`. Exercise its actual
  // production Worker instead, using the same Wrangler entrypoint as publication tests.
  const server = spawn(process.execPath, [path.join(root, 'node_modules/wrangler/bin/wrangler.js'),
    'pages', 'dev', path.join(root, 'dist'), '--ip', origin.hostname,
    '--port', origin.port || '4321', '--kv', 'SESSION', '--log-level', 'warn'], {
    cwd: root, stdio: 'inherit', detached: process.platform !== 'win32',
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
  });
  let startupError;
  server.on('error', error => { startupError = error; });
  const stop = () => {
    if (!server.pid) return;
    try {
      if (process.platform === 'win32') server.kill('SIGTERM');
      else process.kill(-server.pid, 'SIGTERM');
    } catch (error) { if (error.code !== 'ESRCH') throw error; }
  };
  try {
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      if (startupError) throw startupError;
      if (server.exitCode !== null) throw new Error(`Wrangler exited with ${server.exitCode}`);
      if (await responds(url)) return stop;
      await delay(250);
    }
    throw new Error('The production preview did not become ready within 60 seconds. Run npm run build first.');
  } catch (error) { stop(); throw error; }
}

export async function runAudit() {
  const { ci: config } = require('../lighthouserc.cjs');
  const { chromium } = await import('@playwright/test');
  const output = path.join(root, '.lighthouseci');
  // A failed run must never leave a previous run's passing reports in CI.
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });
  const results = [];
  let stopServer;
  try {
    stopServer = await localServer(config.collect.url[0]);
    for (const [index, url] of config.collect.url.entries()) {
      for (let run = 0; run < config.collect.numberOfRuns; run++) {
        const prefix = path.join(output, `lhr-${index}-${run}`);
        const args = [path.join(root, 'node_modules/lighthouse/cli/index.js'), url,
          '--output=json', '--output=html', `--output-path=${prefix}`,
          '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage'];
        if (config.collect.settings?.saveAssets) args.push('--save-assets');
        const child = spawnSync(process.execPath, args, {
          cwd: root, stdio: 'inherit', timeout: 120_000,
          env: { ...process.env, CHROME_PATH: process.env.CHROME_PATH || chromium.executablePath() },
        });
        if (child.status !== 0) throw new Error(`Lighthouse failed for ${url}: ${child.error?.message ?? child.status}`);
        const report = JSON.parse(fs.readFileSync(`${prefix}.report.json`, 'utf8'));
        const assertions = evaluateAssertions(report, config.assert.assertions);
        results.push({ url, run: run + 1, assertions });
        for (const assertion of assertions.filter(item => !item.passed)) {
          console.error(`[${assertion.level}] ${url}: ${assertion.id} = ${assertion.actual ?? 'missing'}`);
        }
        console.log(`[performance] audited ${url} (${run + 1}/${config.collect.numberOfRuns})`);
      }
    }
  } finally {
    stopServer?.();
    fs.writeFileSync(path.join(output, 'assertion-results.json'), JSON.stringify(results, null, 2) + '\n');
  }
  return results.some(result => result.assertions.some(assertion => !assertion.passed && assertion.level === 'error')) ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runAudit().then(code => { process.exitCode = code; }).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
