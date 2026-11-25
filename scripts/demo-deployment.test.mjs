import test from 'node:test';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EXAMPLE_INPUT, validateInputs, workerConfiguration, pagesConfiguration, createPackage,
  verifyPackage, configurePackage, checkConfiguration } from './demo-deployment.mjs';

const input = { pagesProject: 'datadocks-marketing', databaseId: 'badc0ffe-1234-5678-90ab-aabbccddeeff',
  calendlyEventType: 'https://api.calendly.com/event_types/EVENT12345678',
  calendlyHosts: ['https://api.calendly.com/users/HOST12345678'], bentoSiteUuid: 'abcdef0123456789'.repeat(2) };

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'demo-package-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const directory of ['scripts', 'workers', 'migrations/demo', 'config']) await mkdir(join(root, directory), { recursive: true });
  await writeFile(join(root, 'scripts/demo-deployment.mjs'), 'export {};\n');
  await writeFile(join(root, 'workers/demo-reconcile.ts'), 'export default {};\n');
  await writeFile(join(root, 'config/demo-reconcile.wrangler.example.toml'), 'name = "datadocks-demo-reconcile"\n');
  await writeFile(join(root, 'migrations/demo/0001_demo_leads.sql'), 'CREATE TABLE demo_leads(id TEXT);\n');
  await writeFile(join(root, 'migrations/demo/0002_demo_bookings.sql'), 'CREATE TABLE demo_bookings(id TEXT);\n');
  await writeFile(join(root, 'package-lock.json'), '{}\n');
  // These files must never be discovered by packaging.
  await writeFile(join(root, '.env'), 'CALENDLY_TOKEN=DO_NOT_INCLUDE\n');
  await writeFile(join(root, 'customer-export.csv'), 'private@example.com\n');
  await writeFile(join(root, 'config/private.local.toml'), 'SECRET=DO_NOT_INCLUDE\n');
  const bundle = async () => ({ bytes: Buffer.from('export default { async scheduled(_event, env) { if (env.DEMO_RECONCILE_ENABLED !== "true") return; throw new Error("must remain disabled"); } };\n'),
    inputs: ['workers/demo-reconcile.ts'], wranglerVersion: '4.155.0', esbuildVersion: 'test-only' });
  const provenance = () => ({ revision: 'a'.repeat(40), branch: 'codex/test', relevant_working_changes: true, release_status: 'Test only' });
  const outputDir = join(root, 'internal', 'demo-deployment', 'package');
  return { root, outputDir, bundle, provenance, repoRoot: root };
}

test('generates matching Pages and Worker settings with all features off and no credentials', () => {
  const parsed = validateInputs(input), worker = workerConfiguration(parsed), pages = pagesConfiguration(parsed);
  assert.equal(worker.d1_databases[0].database_id, pages.d1_bindings.DEMO_DB.database_id);
  assert.equal(worker.vars.DEMO_ALLOWED_ORIGIN, 'https://datadocks.com');
  assert.deepEqual(worker.triggers.crons, ['*/5 * * * *']);
  assert.equal(worker.workers_dev, false); assert.equal(worker.preview_urls, false);
  for (const value of Object.values({ ...worker.vars, ...pages.text_variables })) assert.equal(typeof value, 'string');
  for (const key of ['DEMO_RECONCILE_ENABLED', 'DEMO_BOOKING_ENABLED']) assert.equal(worker.vars[key], 'false');
  for (const key of ['PUBLIC_DEMO_QUALIFICATION_ENABLED', 'DEMO_CAPTURE_ENABLED', 'DEMO_BOOKING_ENABLED', 'DEMO_VERIFICATION_PAGE_ENABLED']) assert.equal(pages.text_variables[key], 'false');
  assert.deepEqual(pages.build_time_variables, ['PUBLIC_DEMO_QUALIFICATION_ENABLED']);
  for (const name of pages.secret_names) { assert.equal(Object.hasOwn(worker.vars, name), false); assert.equal(Object.hasOwn(pages.text_variables, name), false); }
});

test('rejects secrets, unknown switches, placeholders and malformed destination identifiers', () => {
  for (const invalid of [EXAMPLE_INPUT, { ...input, CALENDLY_TOKEN: 'hidden-secret' }, { ...input, DEMO_RECONCILE_ENABLED: 'true' },
    { ...input, pagesProject: '../../another-project' }, { ...input, databaseId: 'guess' },
    { ...input, calendlyEventType: 'https://api.calendly.com.evil.test/event_types/EVENT12345678' },
    { ...input, calendlyEventType: `${input.calendlyEventType}?token=secret` },
    { ...input, calendlyHosts: [] }, { ...input, calendlyHosts: [input.calendlyHosts[0], input.calendlyHosts[0]] },
    { ...input, calendlyHosts: ['https://api.calendly.com/users/HOST12345678\n'] },
    { ...input, bentoSiteUuid: 'BENTO_SECRET_KEY=private' }]) assert.throws(() => validateInputs(invalid));
});

test('builds from the explicit allowlist, records source/checksums and excludes local data', async t => {
  const options = await fixture(t);
  const { directory, manifest } = await createPackage(options);
  assert.equal(manifest.source.revision, 'a'.repeat(40)); assert.equal(manifest.deployment.provider_calls_performed, false);
  assert.equal(manifest.deployment.pages_build_included, false); assert.equal(manifest.deployment.all_new_features_disabled, true);
  assert.equal(manifest.files['.env'], undefined); assert.equal(manifest.files['customer-export.csv'], undefined);
  const exported = JSON.stringify(manifest) + await readFile(join(directory, 'worker/demo-reconcile.mjs'), 'utf8');
  assert(!exported.includes('DO_NOT_INCLUDE')); assert(!exported.includes('private@example.com'));
  await verifyPackage(directory);
  await assert.rejects(createPackage(options), /EEXIST/);
});

test('refuses tampered artifacts, unexpected exports, symlinks and traversal declarations', async t => {
  const options = await fixture(t); await createPackage(options);
  const original = await readFile(join(options.outputDir, 'worker/demo-reconcile.mjs'));
  await writeFile(join(options.outputDir, 'worker/demo-reconcile.mjs'), 'tampered');
  await assert.rejects(verifyPackage(options.outputDir), /checksum mismatch/);
  await writeFile(join(options.outputDir, 'worker/demo-reconcile.mjs'), original);
  await writeFile(join(options.outputDir, 'customer-export.csv'), 'private');
  await assert.rejects(verifyPackage(options.outputDir), /Unexpected files/);
  await rm(join(options.outputDir, 'customer-export.csv'));
  await symlink(join(options.root, '.env'), join(options.outputDir, 'secret-link'));
  await assert.rejects(verifyPackage(options.outputDir), /symlinks/);
  await rm(join(options.outputDir, 'secret-link'));
  const manifest = JSON.parse(await readFile(join(options.outputDir, 'manifest.json'), 'utf8'));
  manifest.files['../.env'] = 'a'.repeat(64);
  await writeFile(join(options.outputDir, 'manifest.json'), JSON.stringify(manifest));
  await assert.rejects(verifyPackage(options.outputDir), /manifest file list/);
});

test('configuration is created once in local/ and check refuses enabled or edited settings', async t => {
  const options = await fixture(t); await createPackage(options);
  const file = join(options.outputDir, 'inputs.local.json'); await writeFile(file, JSON.stringify(input));
  await configurePackage(options.outputDir, file);
  assert.deepEqual((await readdir(join(options.outputDir, 'local'))).sort(), ['inputs.json', 'pages-settings.json', 'wrangler.json']);
  const worker = JSON.parse(await readFile(join(options.outputDir, 'local/wrangler.json'), 'utf8'));
  assert.equal(worker.main, '../worker/demo-reconcile.mjs'); assert.equal(worker.d1_databases[0].migrations_dir, '../migrations');
  await checkConfiguration(options.outputDir);
  await assert.rejects(configurePackage(options.outputDir, file), /EEXIST/);
  worker.vars.DEMO_RECONCILE_ENABLED = 'true';
  await writeFile(join(options.outputDir, 'local/wrangler.json'), JSON.stringify(worker));
  await assert.rejects(checkConfiguration(options.outputDir), /settings were changed/);
});

test('optional Nick instructions are hashed as part of the deliverable', async t => {
  const options = await fixture(t); options.instructionsFile = join(options.root, 'nick.md');
  await writeFile(options.instructionsFile, '# Apply only the reviewed package\n');
  const { manifest } = await createPackage(options);
  assert.match(manifest.files['START-HERE.md'], /^[a-f0-9]{64}$/);
});

test('includes an exact reviewed source bundle and works without origin/main in a shallow-style checkout', async t => {
  const options = await fixture(t);
  const git = (...args) => execFileSync('git', ['-c', 'user.name=Package test', '-c', 'user.email=package-test@example.invalid', ...args],
    { cwd: options.root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  await mkdir(join(options.root, 'src/pages'), { recursive: true });
  const websiteFile = join(options.root, 'src/pages/index.astro');
  await writeFile(websiteFile, '<h1>Reviewed website</h1>\n');
  git('init'); git('add', 'scripts', 'workers', 'config/demo-reconcile.wrangler.example.toml', 'migrations', 'package-lock.json', 'src/pages/index.astro');
  git('commit', '-m', 'Test baseline');
  await writeFile(join(options.root, 'workers/demo-reconcile.ts'), 'export default { version: 2 };\n');
  git('add', 'workers/demo-reconcile.ts'); git('commit', '-m', 'Reviewed worker');
  const sourceBundle = join(options.root, 'reviewed.bundle'); git('bundle', 'create', sourceBundle, 'HEAD^..HEAD');
  const { manifest } = await createPackage({ ...options, provenance: undefined, sourceBundle });
  assert.equal(manifest.source.revision, git('rev-parse', 'HEAD'));
  assert.equal(manifest.source.base_revision, null);
  assert.equal(manifest.deployment.website_source_bundle_included, true);
  assert.match(manifest.files['source/demo-qualification.bundle'], /^[a-f0-9]{64}$/);
  assert.equal(manifest.source.tracked_working_changes, false); // Untracked private fixture files remain allowed.
  await writeFile(websiteFile, '<h1>Uncommitted website</h1>\n');
  await assert.rejects(createPackage({ ...options, outputDir: join(options.root, 'dirty-website'), provenance: undefined, sourceBundle }), /Commit all tracked/);
  git('add', 'src/pages/index.astro');
  await writeFile(websiteFile, '<h1>Reviewed website</h1>\n'); // Working content matches HEAD but the index does not.
  await assert.rejects(createPackage({ ...options, outputDir: join(options.root, 'dirty-index'), provenance: undefined, sourceBundle }), /Commit all tracked/);
  git('restore', '--staged', '--worktree', 'src/pages/index.astro');
  await writeFile(join(options.root, 'workers/demo-reconcile.ts'), 'uncommitted source');
  await assert.rejects(createPackage({ ...options, outputDir: join(options.root, 'dirty-package'), provenance: undefined, sourceBundle }), /Commit the reviewed/);
});
