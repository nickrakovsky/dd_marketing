import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, readdir, lstat } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT = fileURLToPath(import.meta.url);
const REPO = resolve(dirname(SCRIPT), '..');
const SECRET_NAMES = ['CALENDLY_TOKEN', 'DEMO_SIGNING_SECRET', 'BENTO_PUBLISHABLE_KEY', 'BENTO_SECRET_KEY'];
const INPUT_KEYS = ['pagesProject', 'databaseId', 'calendlyEventType', 'calendlyHosts', 'bentoSiteUuid'];
const MIGRATIONS = ['0001_demo_leads.sql', '0002_demo_bookings.sql'];
const PACKAGE_FILES = ['worker/demo-reconcile.mjs', 'configure.mjs', 'inputs.example.json', 'wrangler.example.json',
  'pages-settings.example.json', '.gitignore', ...MIGRATIONS.map(name => `migrations/${name}`)];
const sha256 = value => createHash('sha256').update(value).digest('hex');
const pretty = value => `${JSON.stringify(value, null, 2)}\n`;
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

export const EXAMPLE_INPUT = {
  pagesProject: 'REPLACE_WITH_PRODUCTION_PAGES_PROJECT',
  databaseId: 'REPLACE_WITH_D1_DATABASE_ID',
  calendlyEventType: 'https://api.calendly.com/event_types/REPLACE_WITH_EVENT_ID',
  calendlyHosts: ['https://api.calendly.com/users/REPLACE_WITH_HOST_ID'],
  bentoSiteUuid: 'REPLACE_WITH_EXISTING_BENTO_SITE_UUID',
};

/** Only non-secret identifiers belong in this file. Unknown keys fail closed. */
export function validateInputs(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).some(key => !INPUT_KEYS.includes(key))
    || INPUT_KEYS.some(key => !own(value, key))) throw new Error('Use exactly the five non-secret fields in inputs.example.json; never include credentials or flags.');
  const text = (input, pattern) => typeof input === 'string' && !/REPLACE|PLACEHOLDER|EXAMPLE/i.test(input) && pattern.test(input);
  if (!text(value.pagesProject, /^[a-z0-9][a-z0-9-]{0,127}$/)) throw new Error('Invalid production Pages project name.');
  if (!text(value.databaseId, /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i)
    || /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(value.databaseId)) throw new Error('Invalid D1 database ID.');
  if (!text(value.calendlyEventType, /^https:\/\/api\.calendly\.com\/event_types\/[A-Za-z0-9_-]{8,80}$/)) throw new Error('Invalid Calendly event-type URI.');
  if (!Array.isArray(value.calendlyHosts) || !value.calendlyHosts.length || value.calendlyHosts.length > 20
    || value.calendlyHosts.some(host => !text(host, /^https:\/\/api\.calendly\.com\/users\/[A-Za-z0-9_-]{8,80}$/))
    || new Set(value.calendlyHosts).size !== value.calendlyHosts.length) throw new Error('Supply distinct full Calendly host user URIs.');
  if (!text(value.bentoSiteUuid, /^(?:[a-f0-9]{32}|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i)) throw new Error('Invalid public Bento site UUID.');
  return { ...value, calendlyHosts: [...value.calendlyHosts] };
}

function commonVariables(input) {
  return { DEMO_ALLOWED_ORIGIN: 'https://datadocks.com', PUBLIC_BENTO_SITE_UUID: input.bentoSiteUuid,
    CALENDLY_EVENT_TYPE: input.calendlyEventType, CALENDLY_HOSTS: input.calendlyHosts.join(',') };
}
export function workerConfiguration(input) {
  return { name: 'datadocks-demo-reconcile', main: './worker/demo-reconcile.mjs',
    compatibility_date: '2024-09-23', compatibility_flags: ['nodejs_compat'],
    workers_dev: false, preview_urls: false,
    vars: { ...commonVariables(input), DEMO_RECONCILE_ENABLED: 'false', DEMO_BOOKING_ENABLED: 'false' },
    d1_databases: [{ binding: 'DEMO_DB', database_name: 'datadocks-demo', database_id: input.databaseId, migrations_dir: './migrations' }],
    triggers: { crons: ['*/5 * * * *'] } };
}
export function pagesConfiguration(input) {
  return { project_name: input.pagesProject, environment: 'production',
    d1_bindings: { DEMO_DB: { database_name: 'datadocks-demo', database_id: input.databaseId } },
    text_variables: { ...commonVariables(input), PUBLIC_DEMO_QUALIFICATION_ENABLED: 'false', DEMO_CAPTURE_ENABLED: 'false',
      DEMO_BOOKING_ENABLED: 'false', DEMO_VERIFICATION_PAGE_ENABLED: 'false' },
    build_time_variables: ['PUBLIC_DEMO_QUALIFICATION_ENABLED'],
    secret_names: SECRET_NAMES, support_destination: 'Leave DEMO_SUPPORT_URL unset until supplied.' };
}

function safeRelative(path) {
  return typeof path === 'string' && path !== '' && !path.includes('\\') && !path.split('/').includes('..') && !isAbsolute(path);
}
async function readRegularFile(path) {
  if (!(await lstat(path)).isFile()) throw new Error('Package input must be a regular file, not a symlink or directory.');
  return readFile(path);
}
async function writeNew(path, contents) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, { flag: 'wx', mode: 0o600 });
}
async function allFiles(directory, prefix = '') {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error('Package must not contain symlinks.');
    if (entry.isDirectory()) output.push(...await allFiles(join(directory, entry.name), path));
    else if (entry.isFile()) output.push(path);
    else throw new Error('Unexpected package file type.');
  }
  return output.sort();
}

export async function verifyPackage(directory) {
  const manifest = JSON.parse(await readRegularFile(join(directory, 'manifest.json')));
  if (manifest.schema_version !== 1 || !manifest.files || typeof manifest.files !== 'object') throw new Error('Unsupported package manifest.');
  if (PACKAGE_FILES.some(file => !own(manifest.files, file))
    || Object.keys(manifest.files).some(file => !PACKAGE_FILES.includes(file) && !['START-HERE.md', 'source/demo-qualification.bundle'].includes(file))) throw new Error('Unexpected package manifest file list.');
  const checksumLines = (await readRegularFile(join(directory, 'SHA256SUMS'))).toString().trim().split('\n');
  const declared = {};
  for (const line of checksumLines) {
    const match = /^([a-f0-9]{64}) {2}(.+)$/.exec(line);
    if (!match || !safeRelative(match[2]) || own(declared, match[2])) throw new Error('Invalid checksum list.');
    declared[match[2]] = match[1];
  }
  const expected = [...Object.keys(manifest.files), 'manifest.json'].sort();
  if (JSON.stringify(Object.keys(declared).sort()) !== JSON.stringify(expected)) throw new Error('Manifest and checksums do not agree.');
  for (const file of expected) {
    if (!safeRelative(file) || !/^[a-f0-9]{64}$/.test(declared[file])) throw new Error('Invalid package path or checksum.');
    const digest = sha256(await readRegularFile(join(directory, file)));
    if (digest !== declared[file] || (file !== 'manifest.json' && manifest.files[file] !== digest)) throw new Error(`Package checksum mismatch: ${file}`);
  }
  // The sole extra directory is private local operator configuration, which is never shipped.
  const unexpected = (await allFiles(directory)).filter(file => !expected.includes(file) && file !== 'SHA256SUMS' && file !== 'inputs.local.json' && !file.startsWith('local/'));
  if (unexpected.length) throw new Error('Unexpected files in package. Rebuild from the explicit allowlist.');
  return manifest;
}

export async function configurePackage(directory, inputFile) {
  await verifyPackage(directory);
  const input = validateInputs(JSON.parse(await readRegularFile(inputFile)));
  const worker = workerConfiguration(input);
  // The generated config lives in local/ so references point one level up.
  worker.main = '../worker/demo-reconcile.mjs'; worker.d1_databases[0].migrations_dir = '../migrations';
  await mkdir(join(directory, 'local'), { recursive: false });
  await writeNew(join(directory, 'local', 'inputs.json'), pretty(input));
  await writeNew(join(directory, 'local', 'wrangler.json'), pretty(worker));
  await writeNew(join(directory, 'local', 'pages-settings.json'), pretty(pagesConfiguration(input)));
  await checkConfiguration(directory);
  return input;
}
export async function checkConfiguration(directory) {
  const manifest = await verifyPackage(directory);
  const input = validateInputs(JSON.parse(await readRegularFile(join(directory, 'local', 'inputs.json'))));
  const expected = workerConfiguration(input);
  expected.main = '../worker/demo-reconcile.mjs'; expected.d1_databases[0].migrations_dir = '../migrations';
  const actual = JSON.parse(await readRegularFile(join(directory, 'local', 'wrangler.json')));
  const pages = JSON.parse(await readRegularFile(join(directory, 'local', 'pages-settings.json')));
  if (JSON.stringify(actual) !== JSON.stringify(expected) || JSON.stringify(pages) !== JSON.stringify(pagesConfiguration(input))) {
    throw new Error('Generated settings were changed. Restore them with all new features disabled before deployment.');
  }
  return manifest;
}

async function bundleWorker(repoRoot) {
  const require = createRequire(join(repoRoot, 'package.json'));
  const wranglerPath = require.resolve('wrangler/package.json');
  const wrangler = JSON.parse(await readFile(wranglerPath, 'utf8'));
  const lock = JSON.parse(await readFile(join(repoRoot, 'package-lock.json'), 'utf8'));
  if (wrangler.version !== lock.packages['node_modules/wrangler'].version) throw new Error('Installed Wrangler differs from the lockfile. Run npm ci in this checkout before packaging.');
  const esbuild = createRequire(wranglerPath)('esbuild');
  const built = await esbuild.build({ absWorkingDir: repoRoot, entryPoints: ['workers/demo-reconcile.ts'],
    outfile: 'demo-reconcile.mjs', bundle: true, format: 'esm', platform: 'browser', target: 'es2022',
    write: false, metafile: true, sourcemap: false, legalComments: 'none', logLevel: 'silent' });
  const metadata = Object.values(built.metafile.outputs);
  if (built.outputFiles.length !== 1 || metadata.some(output => output.imports.length)) throw new Error('Worker must bundle into one self-contained module.');
  const inputs = Object.keys(built.metafile.inputs).sort();
  if (inputs.some(path => !safeRelative(path) || (path !== 'workers/demo-reconcile.ts' && !path.startsWith('src/lib/')))) {
    throw new Error('Worker imports an unexpected source. Review its package allowlist before proceeding.');
  }
  return { bytes: built.outputFiles[0].contents, inputs, wranglerVersion: wrangler.version, esbuildVersion: esbuild.version };
}

function gitMetadata(repoRoot, sources) {
  const git = (...args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const revision = git('rev-parse', 'HEAD');
  const branch = git('branch', '--show-current');
  let baseRevision = null;
  try { baseRevision = git('rev-parse', 'origin/main'); } catch { /* A shallow CI checkout may omit main. */ }
  const status = git('status', '--porcelain=v1', '--untracked-files=all', '--', ...sources);
  const trackedStatus = git('status', '--porcelain=v1', '--untracked-files=no');
  return { revision, branch, base_revision: baseRevision, relevant_working_changes: !!status, tracked_working_changes: !!trackedStatus,
    release_status: 'Prepared offline; CI and live verification must be checked before release.' };
}

/** Explicit inputs only: never archive the worktree, customer exports, or secrets. */
export async function createPackage({ repoRoot = REPO, outputDir, instructionsFile, sourceBundle, bundle = bundleWorker, provenance = gitMetadata } = {}) {
  const output = resolve(outputDir || join(repoRoot, 'internal/demo-deployment/package'));
  if (output === resolve(repoRoot) || relative(output, resolve(repoRoot)) === '') throw new Error('Choose a new package directory.');
  const built = await bundle(repoRoot);
  const sourcePaths = [...built.inputs, ...MIGRATIONS.map(name => `migrations/demo/${name}`),
    'scripts/demo-deployment.mjs', 'config/demo-reconcile.wrangler.example.toml', 'package-lock.json'].sort();
  const source = provenance(repoRoot, sourcePaths);
  if (sourceBundle && source.relevant_working_changes) throw new Error('Commit the reviewed package sources before including a source bundle.');
  if (sourceBundle && source.tracked_working_changes) throw new Error('Commit all tracked working-tree and staged changes before including a source bundle.');
  const sourceHashes = {};
  for (const source of sourcePaths) sourceHashes[source] = sha256(await readRegularFile(join(repoRoot, source)));
  const files = {
    'worker/demo-reconcile.mjs': built.bytes,
    'configure.mjs': await readRegularFile(join(repoRoot, 'scripts/demo-deployment.mjs')),
    'inputs.example.json': pretty(EXAMPLE_INPUT),
    'wrangler.example.json': pretty(workerConfiguration(EXAMPLE_INPUT)),
    'pages-settings.example.json': pretty(pagesConfiguration(EXAMPLE_INPUT)),
    '.gitignore': '/local/\n/inputs.local.json\n/node_modules/\n/.wrangler/\n',
  };
  for (const migration of MIGRATIONS) files[`migrations/${migration}`] = await readRegularFile(join(repoRoot, 'migrations/demo', migration));
  if (instructionsFile) files['START-HERE.md'] = await readRegularFile(resolve(instructionsFile));
  if (sourceBundle) {
    const path = resolve(sourceBundle);
    const bytes = await readRegularFile(path);
    if (!/^# v[23] git bundle\n/.test(bytes.subarray(0, 30).toString()) || bytes.length > 100 * 1024 * 1024) throw new Error('Supply the reviewed incremental Git bundle, at most 100 MiB.');
    execFileSync('git', ['bundle', 'verify', path], { cwd: repoRoot, stdio: 'pipe' });
    const heads = execFileSync('git', ['bundle', 'list-heads', path], { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    if (!heads.split('\n').some(line => line.startsWith(`${head} `))) throw new Error('Source bundle does not advertise the current reviewed revision.');
    files['source/demo-qualification.bundle'] = bytes;
  }
  const manifest = { schema_version: 1, created_at: new Date().toISOString(), source,
    toolchain: { node: process.versions.node, wrangler: built.wranglerVersion, esbuild: built.esbuildVersion },
    source_files: sourceHashes, files: Object.fromEntries(Object.entries(files).map(([path, contents]) => [path, sha256(contents)])),
    secret_names: SECRET_NAMES, deployment: { pages_build_included: false, website_source_bundle_included: !!sourceBundle, site_revision: 'Use the reviewed website revision supplied with this Worker package.',
      all_new_features_disabled: true, provider_calls_performed: false } };
  files['manifest.json'] = pretty(manifest);
  const sums = Object.entries(files).sort(([a], [b]) => a.localeCompare(b)).map(([path, contents]) => `${sha256(contents)}  ${path}`).join('\n') + '\n';
  await mkdir(dirname(output), { recursive: true });
  await mkdir(output, { recursive: false });
  for (const [path, contents] of Object.entries(files)) await writeNew(join(output, path), contents);
  await writeNew(join(output, 'SHA256SUMS'), sums);
  await verifyPackage(output);
  // Syntax + disabled scheduler smoke check execute no account tool and no provider request.
  execFileSync(process.execPath, ['--check', join(output, 'worker/demo-reconcile.mjs')], { stdio: 'pipe' });
  const smoke = `globalThis.fetch = () => { throw new Error('Provider requests are prohibited'); };
    const worker = (await import(${JSON.stringify(pathToFileURL(join(output, 'worker/demo-reconcile.mjs')).href)})).default;
    if (!worker || typeof worker.scheduled !== 'function' || 'fetch' in worker) throw new Error('Invalid scheduled-only Worker');
    await worker.scheduled({}, { DEMO_RECONCILE_ENABLED: 'false' });`;
  execFileSync(process.execPath, ['--input-type=module', '--eval', smoke], { stdio: 'pipe', env: { PATH: process.env.PATH || '' } });
  return { directory: output, manifest };
}

async function main(args) {
  const [command, ...values] = args;
  if (command === 'package') {
    const options = {};
    for (let i = 0; i < values.length; i += 2) {
      if (!values[i + 1] || !['--output', '--instructions', '--source-bundle'].includes(values[i])) throw new Error('Usage: package [--output NEW_DIRECTORY] [--instructions SHORT_CHECKLIST.md] [--source-bundle REVIEWED.bundle]');
      options[{ '--output': 'outputDir', '--instructions': 'instructionsFile', '--source-bundle': 'sourceBundle' }[values[i]]] = values[i + 1];
    }
    const result = await createPackage(options);
    console.log(`Offline package prepared: ${result.directory}\nSource revision: ${result.manifest.source.revision}\nAll new features remain disabled. No deployment or provider calls were performed.`);
  } else if (command === 'configure' && values.length <= 1) {
    await configurePackage(dirname(SCRIPT), values[0] ? resolve(values[0]) : join(dirname(SCRIPT), 'inputs.local.json'));
    console.log('Local configuration created with all new features disabled. Secrets must be added directly in Cloudflare.');
  } else if (command === 'check' && values.length === 0) {
    await checkConfiguration(dirname(SCRIPT));
    console.log('Package checksums and disabled local configuration verified. This is not a live connection test.');
  } else if (command === 'verify' && values.length === 0) {
    await verifyPackage(dirname(SCRIPT)); console.log('Package checksums verified.');
  } else throw new Error('Usage: node demo-deployment.mjs package [--output DIR] [--instructions FILE] [--source-bundle FILE]; or in the package: node configure.mjs configure [INPUTS.json] | check | verify');
}
if (process.argv[1] && resolve(process.argv[1]) === SCRIPT) main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
