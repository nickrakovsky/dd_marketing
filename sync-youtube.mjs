import fs from 'fs/promises';
import path from 'path';

// Load variables from .env file manually (so we don't need external packages)
async function loadEnv() {
    try {
        const envFile = await fs.readFile('.env', 'utf-8');
        const lines = envFile.split(/\r?\n/);

        lines.forEach(line => {
            // 1. Remove comments and trim whitespace
            const cleanLine = line.split('#')[0].trim();
            if (!cleanLine) return;

            // 2. Split by the first '=' found
            const [key, ...valueParts] = cleanLine.split('=');
            const value = valueParts.join('=').trim();

            if (key && value) {
                // 3. Strip leading/trailing quotes of any kind
                const sanitizedValue = value.replace(/^["']|["']$/g, '');
                process.env[key.trim()] = sanitizedValue;
            }
        });

        // Debugging (Remove these after it works)
        console.log("Checking keys...");
        if (!process.env.YOUTUBE_API_KEY) console.log("❌ YOUTUBE_API_KEY is still missing from process.env");
        if (!process.env.YOUTUBE_CHANNEL_ID) console.log("❌ YOUTUBE_CHANNEL_ID is still missing from process.env");

    } catch (e) {
        console.log("⚠️ Could not find or read .env file.");
    }
}

async function syncYouTube() {
    await loadEnv();
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;

    if (!apiKey || !channelId) {
        console.warn("⚠️ Skipping YouTube sync: YOUTUBE_API_KEY or YOUTUBE_CHANNEL_ID not found in .env");
        return;
    }

    console.log("📡 Connecting to YouTube API...");

    try {
        // 1. Get the "Uploads" Playlist ID for the channel
        const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?id=${channelId}&part=contentDetails&key=${apiKey}`);
        const channelData = await channelRes.json();
        const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

        // 2. Fetch the latest 50 videos from that playlist
        const playlistRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${uploadsPlaylistId}&part=snippet&maxResults=50&key=${apiKey}`);
        const playlistData = await playlistRes.json();

        if (!playlistData.items || playlistData.items.length === 0) {
            console.log("No videos found in playlist.");
            return;
        }

        // Collect video IDs to fetch durations and contentDetails in batch
        const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId);
        const detailsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoIds.join(',')}&part=contentDetails,snippet&key=${apiKey}`);
        const detailsData = await detailsRes.json();
        const detailsMap = new Map();
        if (detailsData.items) {
            for (const v of detailsData.items) {
                detailsMap.set(v.id, v);
            }
        }

        let addedCount = 0;

        // Ensure target directory exists
        const targetDir = './src/content/videos';
        await fs.mkdir(targetDir, { recursive: true });

        // 3. Process each video
        for (const item of playlistData.items) {
            const videoId = item.snippet.resourceId.videoId;
            const detail = detailsMap.get(videoId);
            const snippet = detail ? detail.snippet : item.snippet;
            const duration = (detail && detail.contentDetails && detail.contentDetails.duration) || 'PT1M0S';

            const rawTitle = snippet.title || '';
            const title = rawTitle.replace(/'/g, "''").trim();
            const dateStr = snippet.publishedAt ? new Date(snippet.publishedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }) + ' 12:00 PM' : 'Jan 1, 2026 12:00 PM';

            // Clean up description for frontmatter
            const rawDesc = snippet.description || '';
            const firstLine = rawDesc.split('\n').filter(Boolean)[0] || rawTitle;
            const description = firstLine.replace(/'/g, "''").slice(0, 160).trim();

            // Determine if short: duration under 95 seconds or shorts URL ping
            let isShort = false;
            const durMatch = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/i);
            if (durMatch) {
                const m = parseInt(durMatch[1] || '0', 10);
                const s = parseInt(durMatch[2] || '0', 10);
                const totalSec = m * 60 + s;
                if (totalSec > 0 && totalSec <= 90) {
                    isShort = true;
                }
            }

            if (!isShort) {
                try {
                    const shortsCheck = await fetch(`https://www.youtube.com/shorts/${videoId}`, { redirect: 'manual' });
                    if (shortsCheck.status === 200) {
                        isShort = true;
                    }
                } catch {}
            }

            const contentType = isShort ? 'short' : 'video';

            // 5. Create the MDX File Content
            const mdxContent = `---
title: '${title}'
description: >-
  ${description}...
pubDate: '${dateStr}'
author: DataDocks
postType:
  discriminant: ${contentType}
  value:
    youtubeId: ${videoId}
    duration: '${duration}'
---

## ${rawTitle.replace(/#\w+/g, '').trim()}

${rawDesc.trim() || 'Key insights and operational recommendations from Nick Rakovsky on warehouse operations, dock scheduling, and yard management.'}

### Key Takeaways

- **Operational Focus:** Real-time visibility and structured dock scheduling eliminate carrier congestion and turn dock bottlenecks into predictable flows.
- **Carrier Communication:** Digital driver check-in and automated notifications keep facility teams aligned and prepared ahead of truck arrivals.
- **Facility Throughput:** Consistent appointment scheduling prevents detention fees and maximizes dock utilization.
`;

            // 6. Save to src/content/videos/
            const fileName = `yt-${videoId}.mdx`;
            const filePath = path.join(targetDir, fileName);

            // Check if file already exists to avoid overwriting edits
            try {
                await fs.access(filePath);
            } catch {
                await fs.writeFile(filePath, mdxContent, 'utf8');
                console.log(`✅ Added ${contentType}: ${rawTitle}`);
                addedCount++;
            }
        }

        console.log(`🎉 Sync Complete! Added ${addedCount} new videos to src/content/videos.`);

    } catch (error) {
        console.error("❌ Failed to sync YouTube data:", error);
    }
}

syncYouTube();