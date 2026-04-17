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

        // 2. Fetch the latest 15 videos from that playlist
        const playlistRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${uploadsPlaylistId}&part=snippet&maxResults=15&key=${apiKey}`);
        const playlistData = await playlistRes.json();

        let addedCount = 0;

        // 3. Process each video
        for (const item of playlistData.items) {
            const snippet = item.snippet;
            const videoId = snippet.resourceId.videoId;
            const title = snippet.title.replace(/"/g, '\\"'); // Escape quotes for frontmatter
            const date = snippet.publishedAt.split('T')[0]; // Extract YYYY-MM-DD

            // Clean up the description (grab the first line or two)
            const description = snippet.description.split('\n')[0].replace(/"/g, '\\"').substring(0, 120);

            // 4. The "Shorts" Trap: Ping the shorts URL to see if it redirects
            let contentType = "video";
            const shortsCheck = await fetch(`https://www.youtube.com/shorts/${videoId}`, { redirect: 'manual' });
            if (shortsCheck.status === 200) {
                contentType = "short";
            }

            // 5. Create the MDX File Content
            const mdxContent = `---
title: "${title}"
description: "${description}..."
pubDate: ${date}
author: "DataDocks"
contentType: "${contentType}"
youtubeId: "${videoId}"
---
`;

            // 6. Save to the database
            // Create a clean filename from the video ID
            const fileName = `yt-${videoId}.mdx`;
            const filePath = path.join('./src/content/posts', fileName);

            // Check if file already exists to avoid overwriting edits
            try {
                await fs.access(filePath);
            } catch {
                await fs.writeFile(filePath, mdxContent, 'utf8');
                console.log(`✅ Added ${contentType}: ${title}`);
                addedCount++;
            }
        }

        console.log(`🎉 Sync Complete! Added ${addedCount} new videos to the database.`);

    } catch (error) {
        console.error("❌ Failed to sync YouTube data:", error);
    }
}

syncYouTube();