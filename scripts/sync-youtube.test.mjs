import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { evaluate } from '@mdx-js/mdx';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import matter from 'gray-matter';
import { loadEnv, parseDuration, runCli, syncYouTube } from '../sync-youtube.mjs';

const CHANNEL = 'UCtest-channel';
const KEY = 'test-private-key-never-log';
const NOW = new Date('2026-10-12T12:00:00Z');
const SCRIPT = fileURLToPath(new URL('../sync-youtube.mjs', import.meta.url));
const FIRST = 'aaaaaaaaaaa';
const SECOND = 'bbbbbbbbbbb';

function video(id = FIRST, overrides = {}) {
    return {
        id,
        snippet: {
            channelId: CHANNEL,
            title: 'Real YouTube title',
            description: 'Real YouTube description.',
            publishedAt: '2026-10-12T10:12:34Z',
            liveBroadcastContent: 'none',
        },
        contentDetails: { duration: 'PT59S' },
        status: { privacyStatus: 'public', uploadStatus: 'processed', embeddable: true },
        ...overrides,
    };
}

async function fixture(t, videos = [video()], overrides = {}) {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'youtube-sync-test-'));
    t.after(() => fs.rm(directory, { recursive: true, force: true }));
    const targetDir = path.join(directory, 'videos');
    const calls = [];
    const responses = {
        channels: { items: [{ id: CHANNEL, contentDetails: { relatedPlaylists: { uploads: 'UUuploads' } } }] },
        playlistItems: { items: videos.map(item => ({ contentDetails: { videoId: item.id } })) },
        videos: { items: videos },
        ...overrides,
    };
    const fetchImpl = async (input, options) => {
        const url = new URL(input);
        calls.push({ url, options });
        const resource = url.pathname.split('/').at(-1);
        if (url.hostname === 'www.youtube.com') {
            return new Response(`<link rel="canonical" href="https://www.youtube.com/shorts/${resource}">`);
        }
        const response = responses[resource];
        if (typeof response === 'function') return response(input, options);
        if (response instanceof Response) return response.clone();
        return Response.json(response);
    };
    const options = { apiKey: KEY, channelId: CHANNEL, targetDir, fetchImpl, now: NOW };
    return { directory, targetDir, calls, options, run: extra => syncYouTube({ ...options, ...extra }) };
}

async function assertNoFiles(targetDir) {
    assert.deepEqual(await fs.readdir(targetDir).catch(error => error.code === 'ENOENT' ? [] : Promise.reject(error)), []);
}

test('imports official metadata, preserves exact publication time and reports IDs', async t => {
    const v = video();
    v.snippet.publishedAt = '2026-10-12T00:01:02+02:00';
    const f = await fixture(t, [v]);
    const summary = await f.run();
    assert.deepEqual(summary, { fetched: 1, added: 1, existing: 0, skipped: 0, addedIds: [FIRST], shortIds: [FIRST] });
    const source = await fs.readFile(path.join(f.targetDir, `yt-${FIRST}.mdx`), 'utf8');
    const parsed = matter(source);
    assert.equal(parsed.data.title, v.snippet.title);
    assert.equal(parsed.data.description, v.snippet.description);
    assert.equal(parsed.data.pubDate, v.snippet.publishedAt);
    assert.equal(parsed.data.postType.discriminant, 'short');
    assert.equal(parsed.data.postType.value.duration, 'PT59S');
    assert.doesNotMatch(source, /Key Takeaways|Operational Focus|Facility Throughput/);
    const detailCall = f.calls.find(call => call.url.pathname.endsWith('/videos'));
    assert.ok(detailCall.url.searchParams.get('part').split(',').includes('status'));
    assert.equal(f.calls.find(call => call.url.pathname.endsWith('/playlistItems')).url.searchParams.get('maxResults'), '50');
});

test('never overwrites edited files and repeated imports are idempotent', async t => {
    const f = await fixture(t, [video(), video(SECOND)]);
    await fs.mkdir(f.targetDir);
    const existingPath = path.join(f.targetDir, `yt-${FIRST}.mdx`);
    await fs.writeFile(existingPath, 'Editorial changes must survive.');
    const first = await f.run();
    assert.equal(first.added, 1);
    assert.equal(first.existing, 1);
    assert.deepEqual(first.addedIds, [SECOND]);
    assert.equal(await fs.readFile(existingPath, 'utf8'), 'Editorial changes must survive.');
    const second = await f.run();
    assert.equal(second.added, 0);
    assert.equal(second.existing, 2);
    assert.deepEqual(second.shortIds, [FIRST, SECOND]);
});

test('plain YouTube titles/descriptions compile and render without Markdown or MDX execution', async t => {
    const v = video();
    v.snippet.title = 'Quote " and apostrophe \' : # title {throw new Error("executed")}';
    v.snippet.description = 'export const danger = (() => { throw new Error("executed") })();\n\n'
        + 'import danger from "not-a-real-package"\n\n'
        + '<script>alert("executed")</script> {(() => { throw new Error("executed") })()}\n\n'
        + '[click](javascript:alert(1)) ![image](https://invalid.example/tracker)\n\n'
        + '---\n# Not a heading\n**literal** & <>{} `backticks`';
    const f = await fixture(t, [v]);
    await f.run();
    const parsed = matter(await fs.readFile(path.join(f.targetDir, `yt-${FIRST}.mdx`), 'utf8'));
    assert.equal(parsed.data.title, v.snippet.title);
    assert.equal(parsed.data.description, v.snippet.description.split('\n')[0].slice(0, 160));
    const compiled = await evaluate(parsed.content, { ...jsxRuntime });
    const html = renderToStaticMarkup(jsxRuntime.jsx(compiled.default, {}));
    assert.match(html, /export const danger/);
    assert.match(html, /import danger from/);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /\*\*literal\*\*/);
    assert.doesNotMatch(html, /<script|<img|<a |<h1|<hr|<strong/);
});

test('empty descriptions stay empty rather than acquiring invented takeaways', async t => {
    const v = video();
    v.snippet.description = '';
    const f = await fixture(t, [v]);
    await f.run();
    const parsed = matter(await fs.readFile(path.join(f.targetDir, `yt-${FIRST}.mdx`), 'utf8'));
    assert.equal(parsed.data.description, v.snippet.title);
    assert.equal(parsed.content.trim().split('\n').length, 1);
});

test('duration parsing includes hours and days and rejects invalid/zero input', () => {
    for (const [duration, seconds] of [['PT59S', 59], ['PT1M30S', 90], ['PT3M', 180], ['PT1H', 3600], ['PT1H2M3S', 3723], ['P1DT1S', 86401]]) {
        assert.equal(parseDuration(duration), seconds);
    }
    for (const duration of ['PT', 'P1DT', 'PT0S', 'PT-3S', 'PT1Mbogus', 'PT1H1Mgarbage', '', undefined]) assert.equal(parseDuration(duration), null);
});

test('hours and videos longer than three minutes never trigger Shorts probes', async t => {
    const f = await fixture(t, [video(FIRST, { contentDetails: { duration: 'PT1H' } }), video(SECOND, { contentDetails: { duration: 'PT3M1S' } })]);
    const summary = await f.run({ shortsOnly: true });
    assert.equal(summary.added, 0);
    assert.equal(summary.skipped, 2);
    assert.deepEqual(summary.shortIds, []);
    assert.equal(f.calls.length, 3);
    await assertNoFiles(f.targetDir);
});

test('only explicit Shorts canonical pages classify 91–180 second videos as Shorts', async t => {
    const f = await fixture(t, [video(FIRST, { contentDetails: { duration: 'PT3M' } }), video(SECOND, { contentDetails: { duration: 'PT91S' } })]);
    const apiFetch = f.options.fetchImpl;
    const summary = await f.run({
        shortsOnly: true,
        fetchImpl: (url, options) => url === `https://www.youtube.com/shorts/${SECOND}`
            ? Promise.resolve(new Response('<html>Generic YouTube page</html>')) : apiFetch(url, options),
    });
    assert.equal(summary.added, 1);
    assert.equal(summary.skipped, 1);
    assert.deepEqual(summary.shortIds, [FIRST]);
    assert.deepEqual(await fs.readdir(f.targetDir), [`yt-${FIRST}.mdx`]);
});

test('a Shorts redirect excludes the video and an HTTP failure stops all writes', async t => {
    for (const status of [302, 429]) {
        const f = await fixture(t, [video(), video(SECOND, { contentDetails: { duration: 'PT2M' } })]);
        const apiFetch = f.options.fetchImpl;
        const options = { shortsOnly: true, fetchImpl: (url, init) => url.startsWith('https://www.youtube.com/')
            ? Promise.resolve(new Response(null, { status })) : apiFetch(url, init) };
        if (status === 302) {
            const summary = await f.run(options);
            assert.deepEqual(summary.shortIds, [FIRST]);
            assert.equal(summary.skipped, 1);
        } else {
            await assert.rejects(f.run(options), /Shorts check failed \(HTTP 429\)/);
            await assertNoFiles(f.targetDir);
        }
    }
});

test('excludes private, unlisted, nonembeddable, unprocessed, live, upcoming and future uploads', async t => {
    const variants = [
        v => { v.status.privacyStatus = 'private'; },
        v => { v.status.privacyStatus = 'unlisted'; },
        v => { v.status.embeddable = false; },
        v => { v.status.uploadStatus = 'uploaded'; },
        v => { v.snippet.liveBroadcastContent = 'live'; },
        v => { v.snippet.liveBroadcastContent = 'upcoming'; },
        v => { v.snippet.publishedAt = '2026-10-13T00:00:00Z'; },
    ];
    const videos = variants.map((mutate, index) => {
        const v = video(String(index).repeat(11));
        mutate(v);
        return v;
    });
    const f = await fixture(t, [video(), ...videos]);
    const summary = await f.run();
    assert.equal(summary.added, 1);
    assert.equal(summary.skipped, variants.length);
    assert.deepEqual(await fs.readdir(f.targetDir), [`yt-${FIRST}.mdx`]);
});

for (const [name, mutate] of [
    ['missing title', v => { delete v.snippet.title; }],
    ['empty title', v => { v.snippet.title = ' '; }],
    ['missing description', v => { delete v.snippet.description; }],
    ['invalid text', v => { v.snippet.description = 'null\0byte'; }],
    ['missing date', v => { delete v.snippet.publishedAt; }],
    ['invalid date', v => { v.snippet.publishedAt = 'yesterday'; }],
    ['impossible date', v => { v.snippet.publishedAt = '2026-02-30T00:00:00Z'; }],
    ['wrong channel', v => { v.snippet.channelId = 'different-channel'; }],
    ['missing broadcast status', v => { delete v.snippet.liveBroadcastContent; }],
    ['missing status', v => { delete v.status; }],
    ['invalid privacy', v => { v.status.privacyStatus = 'unknown'; }],
    ['missing embeddable', v => { delete v.status.embeddable; }],
    ['missing duration', v => { delete v.contentDetails.duration; }],
    ['invalid duration', v => { v.contentDetails.duration = 'PT1Mtruncated'; }],
]) {
    test(`${name} fails before any new files are written`, async t => {
        const invalid = video(SECOND);
        mutate(invalid);
        const f = await fixture(t, [video(), invalid]);
        await assert.rejects(f.run(), /missing or invalid/);
        await assertNoFiles(f.targetDir);
    });
}

for (const [name, overrides] of [
    ['HTTP error', { channels: new Response(KEY, { status: 403 }) }],
    ['API error payload', { channels: { error: { message: KEY } } }],
    ['invalid JSON', { channels: new Response(KEY) }],
    ['empty channel', { channels: { items: [] } }],
    ['null channel', { channels: { items: [null] } }],
    ['missing uploads playlist', { channels: { items: [{ id: CHANNEL }] } }],
    ['empty uploads feed', { playlistItems: { items: [] } }],
    ['invalid video ID', { playlistItems: { items: [{ contentDetails: { videoId: '../../oops' } }] } }],
    ['duplicate upload IDs', { playlistItems: { items: [{ contentDetails: { videoId: FIRST } }, { contentDetails: { videoId: FIRST } }] } }],
    ['empty video details', { videos: { items: [] } }],
    ['missing details for one video', { videos: { items: [video()] } }],
    ['unexpected details ID', { videos: { items: [video('ccccccccccc')] } }],
    ['duplicate video details', { videos: { items: [video(), video()] } }],
]) {
    test(`${name} is a visible sanitized failure with no writes`, async t => {
        const f = await fixture(t, [video(), video(SECOND)], overrides);
        await assert.rejects(f.run(), error => {
            assert.doesNotMatch(error.message, new RegExp(`${KEY}|https?://`));
            assert.match(error.message, /YouTube/);
            return true;
        });
        await assertNoFiles(f.targetDir);
    });
}

test('network exceptions cannot leak the API key or request URL', async t => {
    const f = await fixture(t);
    await assert.rejects(f.run({ fetchImpl: async url => { throw new Error(`secret request: ${url}`); } }), error => {
        assert.doesNotMatch(error.message, new RegExp(`${KEY}|https?://`));
        assert.match(error.message, /network access/);
        return true;
    });
    await assertNoFiles(f.targetDir);
});

test('timeouts abort hung requests and leave content untouched', async t => {
    const f = await fixture(t);
    let signal;
    await assert.rejects(f.run({ timeoutMs: 10, fetchImpl: (_url, options) => {
        signal = options.signal;
        return new Promise(() => {});
    } }), /timed out/);
    assert.equal(signal.aborted, true);
    await assertNoFiles(f.targetDir);
});

test('timeouts also cover a hung response body', async t => {
    const f = await fixture(t);
    await assert.rejects(f.run({ timeoutMs: 10, fetchImpl: async () => ({ ok: true, json: () => new Promise(() => {}) }) }), /timed out/);
    await assertNoFiles(f.targetDir);
});

test('dotenv fills missing values but never overrides the process environment', async t => {
    const f = await fixture(t);
    const envPath = path.join(f.directory, '.env');
    await fs.writeFile(envPath, 'YOUTUBE_API_KEY="stale local key"\nexport YOUTUBE_CHANNEL_ID=local-channel # comment\nQUOTED="has#hash=and equals"\nEMPTY=\n');
    const env = { YOUTUBE_API_KEY: KEY, EMPTY: 'process-value' };
    await loadEnv({ env, envPath });
    assert.deepEqual(env, { YOUTUBE_API_KEY: KEY, YOUTUBE_CHANNEL_ID: 'local-channel', QUOTED: 'has#hash=and equals', EMPTY: 'process-value' });
});

test('--if-configured skips only missing credentials; configured API failures still fail', async t => {
    const f = await fixture(t, [video()], { channels: new Response('denied', { status: 403 }) });
    const base = { args: ['--if-configured'], envPath: path.join(f.directory, 'absent-env'), logger: { log() {} }, ...f.options };
    assert.deepEqual(await runCli({ ...base, env: {} }), { notConfigured: true });
    await assert.rejects(runCli({ ...base, env: { YOUTUBE_API_KEY: KEY, YOUTUBE_CHANNEL_ID: CHANNEL } }), /HTTP 403/);
    await assert.rejects(runCli({ ...base, args: [], env: {} }), /Set YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID/);
});

test('real CLI exits nonzero without credentials and succeeds only with explicit dev opt-out', async t => {
    const f = await fixture(t);
    const env = { ...process.env };
    delete env.YOUTUBE_API_KEY;
    delete env.YOUTUBE_CHANNEL_ID;
    const strict = spawnSync(process.execPath, [SCRIPT], { cwd: f.directory, env, encoding: 'utf8' });
    assert.equal(strict.status, 1);
    assert.match(strict.stderr, /Set YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID/);
    const optional = spawnSync(process.execPath, [SCRIPT, '--if-configured'], { cwd: f.directory, env, encoding: 'utf8' });
    assert.equal(optional.status, 0);
    assert.match(optional.stdout, /credentials are not configured/);
});
