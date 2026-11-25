import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const API_ROOT = 'https://www.googleapis.com/youtube/v3/';

// Only controlled messages reach the CLI: fetch errors can contain credentialed URLs.
export class YouTubeSyncError extends Error {}

export async function loadEnv({ env = process.env, envPath = '.env' } = {}) {
    let source;
    try {
        source = await fs.readFile(envPath, 'utf8');
    } catch (error) {
        if (error.code === 'ENOENT') return env;
        throw new YouTubeSyncError('Cannot read the local environment file. Check its permissions.');
    }
    for (const line of source.split(/\r?\n/)) {
        const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (!match || Object.hasOwn(env, match[1])) continue;
        let value = match[2];
        if (value.startsWith('"') || value.startsWith("'")) {
            const quoted = value.match(/^(["'])(.*?)\1\s*(?:#.*)?$/);
            if (!quoted) throw new YouTubeSyncError('Invalid quoted value in the local environment file.');
            value = quoted[2];
        } else {
            value = value.replace(/\s+#.*$|^#.*$/, '').trim();
        }
        env[match[1]] = value;
    }
    return env;
}

export function parseDuration(duration) {
    if (typeof duration !== 'string' || duration.endsWith('T')) return null;
    const match = duration.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/);
    if (!match || !match.slice(1).some(value => value !== undefined)) return null;
    const seconds = Number(match[1] || 0) * 86400 + Number(match[2] || 0) * 3600
        + Number(match[3] || 0) * 60 + Number(match[4] || 0);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

// Descriptions are untrusted plain text, not Markdown/JSX supplied by an author.
// Entity-encode syntax and the first character of each line (including import/export).
export function escapeMarkdownLiteral(value) {
    return value.split(/\r?\n/).map(line => {
        const characters = [...line.trim()];
        return characters.map((character, index) => index === 0 || /[&<>{}\\`*_\[\]()#+.!|~=\-]/.test(character)
            ? `&#${character.codePointAt(0)};` : character).join('');
    }).join('\n');
}

export function renderVideo(video, isShort) {
    const { id, snippet, contentDetails } = video;
    const description = snippet.description.split(/\r?\n/).map(line => line.trim()).find(Boolean) || snippet.title;
    return `---
title: ${JSON.stringify(snippet.title.trim())}
description: ${JSON.stringify(description.slice(0, 160))}
pubDate: ${JSON.stringify(snippet.publishedAt)}
author: DataDocks
postType:
  discriminant: ${isShort ? 'short' : 'video'}
  value:
    youtubeId: ${JSON.stringify(id)}
    duration: ${JSON.stringify(contentDetails.duration)}
---

## ${escapeMarkdownLiteral(snippet.title.trim())}
${snippet.description.trim() ? `\n${escapeMarkdownLiteral(snippet.description.trim())}\n` : ''}`;
}

async function timedRequest({ fetchImpl, timeoutMs }, label, url, consume, options = {}) {
    const controller = new AbortController();
    let timer;
    try {
        return await Promise.race([
            (async () => consume(await fetchImpl(url, { ...options, signal: controller.signal })))(),
            new Promise((_, reject) => {
                timer = setTimeout(() => {
                    controller.abort();
                    reject(new YouTubeSyncError(`${label} timed out. Retry the sync.`));
                }, timeoutMs);
            }),
        ]);
    } catch (error) {
        if (error instanceof YouTubeSyncError) throw error;
        throw new YouTubeSyncError(`${label} could not be read. Check network access and retry.`);
    } finally {
        clearTimeout(timer);
    }
}

async function apiRequest(context, resource, parameters, label) {
    const url = new URL(resource, API_ROOT);
    url.search = new URLSearchParams({ ...parameters, key: context.apiKey }).toString();
    return timedRequest(context, label, url.toString(), async response => {
        if (!response.ok) {
            const hint = response.status === 401 || response.status === 403
                ? 'Check the API key, YouTube Data API access, restrictions, and quota.'
                : 'Check YouTube API availability and retry.';
            throw new YouTubeSyncError(`${label} failed (HTTP ${response.status}). ${hint}`);
        }
        let data;
        try {
            data = await response.json();
        } catch {
            throw new YouTubeSyncError(`${label} returned invalid JSON. Retry the sync.`);
        }
        if (!data || typeof data !== 'object' || data.error || !Array.isArray(data.items)) {
            throw new YouTubeSyncError(`${label} returned an invalid API response. Check API access and retry.`);
        }
        if (data.items.length === 0) {
            throw new YouTubeSyncError(`${label} returned no items. Verify the channel and API access.`);
        }
        return data.items;
    });
}

function invalidMetadata(id, field) {
    throw new YouTubeSyncError(`Video ${id} has missing or invalid ${field}. No new files were written.`);
}

function validPublicationDate(value) {
    if (typeof value !== 'string') return false;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);
    if (!match || !Number.isFinite(Date.parse(value))) return false;
    const [, year, month, day, hour, minute, second] = match.map(Number);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]
        && hour < 24 && minute < 60 && second < 60;
}

function validateVideo(video, channelId, now) {
    const { id, status, snippet, contentDetails } = video;
    if (!status || !['public', 'unlisted', 'private'].includes(status.privacyStatus)
        || !['processed', 'uploaded', 'failed', 'rejected', 'deleted'].includes(status.uploadStatus)
        || typeof status.embeddable !== 'boolean') invalidMetadata(id, 'publication status');
    if (status.privacyStatus !== 'public' || status.uploadStatus !== 'processed' || !status.embeddable) return null;
    if (!snippet || snippet.channelId !== channelId) invalidMetadata(id, 'channel metadata');
    if (!['none', 'live', 'upcoming'].includes(snippet.liveBroadcastContent)) invalidMetadata(id, 'broadcast status');
    if (snippet.liveBroadcastContent !== 'none') return null;
    if (!validPublicationDate(snippet.publishedAt)) invalidMetadata(id, 'publication date');
    if (Date.parse(snippet.publishedAt) > now.getTime()) return null;
    if (typeof snippet.title !== 'string' || !snippet.title.trim()
        || typeof snippet.description !== 'string'
        || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(snippet.title + snippet.description)) {
        invalidMetadata(id, 'title or description');
    }
    const seconds = parseDuration(contentDetails?.duration);
    if (seconds === null) invalidMetadata(id, 'duration');
    return seconds;
}

async function isShortVideo(context, video, seconds) {
    // Retain the existing <=90s rule. Hours and >3-minute videos never probe Shorts.
    if (seconds <= 90) return true;
    if (seconds > 180) return false;
    return timedRequest(context, 'YouTube Shorts check', `https://www.youtube.com/shorts/${video.id}`, async response => {
        if ([301, 302, 303, 307, 308].includes(response.status)) return false;
        if (response.status !== 200) {
            throw new YouTubeSyncError(`YouTube Shorts check failed (HTTP ${response.status}). Retry the sync.`);
        }
        const html = await response.text();
        // A generic 200 page is insufficient: require a Shorts canonical URL for this ID.
        const links = html.match(/<link\b[^>]*>/gi) || [];
        return links.some(link => /\brel\s*=\s*["']canonical["']/i.test(link)
            && new RegExp(`\\bhref\\s*=\\s*["']https://www\\.youtube\\.com/shorts/${video.id}["']`, 'i').test(link));
    }, { redirect: 'manual' });
}

export async function syncYouTube({
    apiKey,
    channelId,
    targetDir = './src/content/videos',
    fetchImpl = globalThis.fetch,
    now = new Date(),
    timeoutMs = 15000,
    shortsOnly = false,
} = {}) {
    if (!apiKey?.trim() || !channelId?.trim()) {
        throw new YouTubeSyncError('Set YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID before running the YouTube sync.');
    }
    if (!Number.isFinite(now?.getTime()) || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        throw new YouTubeSyncError('Invalid sync clock or request timeout.');
    }
    const context = { apiKey, fetchImpl, timeoutMs };
    const channels = await apiRequest(context, 'channels', { id: channelId, part: 'contentDetails' }, 'YouTube channel lookup');
    const uploads = channels[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (channels.length !== 1 || channels[0]?.id !== channelId || typeof uploads !== 'string' || !uploads.trim()) {
        throw new YouTubeSyncError('YouTube channel lookup returned an invalid uploads playlist. Verify YOUTUBE_CHANNEL_ID.');
    }
    const playlist = await apiRequest(context, 'playlistItems', {
        playlistId: uploads, part: 'contentDetails', maxResults: '50',
    }, 'YouTube uploads lookup');
    const videoIds = playlist.map(item => item?.contentDetails?.videoId);
    if (videoIds.some(id => typeof id !== 'string' || !VIDEO_ID.test(id)) || new Set(videoIds).size !== videoIds.length) {
        throw new YouTubeSyncError('YouTube uploads lookup returned invalid or duplicate video IDs. No new files were written.');
    }
    const videos = await apiRequest(context, 'videos', {
        id: videoIds.join(','), part: 'snippet,contentDetails,status',
    }, 'YouTube video details lookup');
    const byId = new Map();
    for (const video of videos) {
        if (!video || !videoIds.includes(video.id) || byId.has(video.id)) {
            throw new YouTubeSyncError('YouTube video details lookup returned unexpected or duplicate IDs. No new files were written.');
        }
        byId.set(video.id, video);
    }
    if (byId.size !== videoIds.length) {
        throw new YouTubeSyncError('YouTube video details lookup omitted uploaded videos. Retry or check channel visibility. No new files were written.');
    }

    const summary = { fetched: videoIds.length, added: 0, existing: 0, skipped: 0, addedIds: [], shortIds: [] };
    const candidates = [];
    // Validate the entire response and classify everything before writing anything.
    for (const id of videoIds) {
        const video = byId.get(id);
        const seconds = validateVideo(video, channelId, now);
        if (seconds === null) {
            summary.skipped++;
            continue;
        }
        const isShort = await isShortVideo(context, video, seconds);
        if (isShort) summary.shortIds.push(id);
        if (shortsOnly && !isShort) {
            summary.skipped++;
            continue;
        }
        candidates.push({ id, content: renderVideo(video, isShort) });
    }
    if (candidates.length) await fs.mkdir(targetDir, { recursive: true });
    for (const { id, content } of candidates) {
        try {
            // Never overwrite editorial changes, including files created during this run.
            await fs.writeFile(path.join(targetDir, `yt-${id}.mdx`), content, { encoding: 'utf8', flag: 'wx' });
            summary.added++;
            summary.addedIds.push(id);
        } catch (error) {
            if (error.code !== 'EEXIST') throw new YouTubeSyncError('Cannot save imported videos. Check content-directory permissions and available disk space.');
            summary.existing++;
        }
    }
    return summary;
}

export async function runCli({
    args = process.argv.slice(2), env = process.env, envPath = '.env', logger = console, ...options
} = {}) {
    if (args.some(arg => !['--if-configured', '--shorts-only'].includes(arg))) {
        throw new YouTubeSyncError('Usage: node sync-youtube.mjs [--if-configured] [--shorts-only]');
    }
    await loadEnv({ env, envPath });
    if ((!env.YOUTUBE_API_KEY?.trim() || !env.YOUTUBE_CHANNEL_ID?.trim()) && args.includes('--if-configured')) {
        logger.log('YouTube sync skipped: credentials are not configured for local development.');
        return { notConfigured: true };
    }
    const summary = await syncYouTube({
        ...options, apiKey: env.YOUTUBE_API_KEY, channelId: env.YOUTUBE_CHANNEL_ID, shortsOnly: args.includes('--shorts-only'),
    });
    logger.log(`YouTube sync: ${summary.added} added, ${summary.existing} already present, ${summary.skipped} excluded, ${summary.fetched} uploads checked.`);
    if (summary.addedIds.length) logger.log(`Added video IDs: ${summary.addedIds.join(', ')}`);
    logger.log(`Published short IDs: ${summary.shortIds.join(', ') || '(none)'}`);
    return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    runCli().catch(error => {
        console.error(error instanceof YouTubeSyncError ? error.message : 'YouTube sync failed. Check local configuration and filesystem access.');
        process.exitCode = 1;
    });
}
