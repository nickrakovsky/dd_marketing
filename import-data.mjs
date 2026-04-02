import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import TurndownService from 'turndown';

const turndownService = new TurndownService();

const FEATURES_CSV = path.join(process.cwd(), 'webflow-migration/features-integrations-csv-exports/features.csv');
const INTEGRATIONS_CSV = path.join(process.cwd(), 'webflow-migration/features-integrations-csv-exports/integrations.csv');

const FEATURES_OUT = path.join(process.cwd(), 'src/content/features');
const INTEGRATIONS_OUT = path.join(process.cwd(), 'src/content/integrations');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Ensure output directories exist
ensureDir(FEATURES_OUT);
ensureDir(INTEGRATIONS_OUT);

function getLocalIconPath(url, folder) {
    if (!url) return '';
    try {
        const basename = String(url).split('/').pop().replace('%3A', '').replace(/%20/g, '-').toLowerCase();
        return `/images/${folder}/${basename}`;
    } catch {
        return '';
    }
}

function parseFeatures() {
    const rawData = fs.readFileSync(FEATURES_CSV, 'utf8');
    const records = parse(rawData, {
        columns: true,
        skip_empty_lines: true
    });

    for (const record of records) {
        if (record.Draft === 'true' || record.Archived === 'true') continue;

        const title = record['Name'];
        const slug = record['Slug'];
        const pubDate = new Date(record['Published On']).toISOString();
        const shortDescription = record['Feature Brief Description'];
        const htmlContent = record['Feature Detailed Description'] || '';
        const explainerVideo = record['Explainer Video'];
        
        let iconPath = getLocalIconPath(record['Feature Icon'], 'features');
        if (iconPath.includes('vision.webp')) iconPath = '/images/features/vision.svg'; // Hardcode known mismatch if any, otherwise it falls back nicely.
        
        const markdownBody = turndownService.turndown(htmlContent);

        const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${shortDescription.replace(/"/g, '\\"')}"
pubDate: "${pubDate}"
icon: "${iconPath}"
${explainerVideo ? `videoUrl: "${explainerVideo}"` : ''}
---
${markdownBody}`;
        
        fs.writeFileSync(path.join(FEATURES_OUT, `${slug}.mdx`), frontmatter);
    }
    console.log(`Parsed ${records.length} features.`);
}

function parseIntegrations() {
    const rawData = fs.readFileSync(INTEGRATIONS_CSV, 'utf8');
    const records = parse(rawData, {
        columns: true,
        skip_empty_lines: true
    });

    for (const record of records) {
        if (record.Draft === 'true' || record.Archived === 'true') continue;

        const title = record['Integration Name'];
        const slug = record['Slug'];
        const pubDate = new Date(record['Published On'] || record['Created On']).toISOString();
        const overview = record['Integration Card Overview'];
        const subheader = record['Integration Page Subheader'];
        const htmlContent = record['Integration Page Description'] || '';
        const iconPath = getLocalIconPath(record['Integration Icon'], 'integrations');
        const disclaimer = record['Copyrights Disclaimer'];
        
        const pageTitle = record['Page Title'];

        // Formatting benefits into an array
        const benefits = [];
        for (let i = 1; i <= 3; i++) {
            const benIcon = getLocalIconPath(record[`Benefit ${i} Icon`], 'integrations');
            const benTitle = record[`Benefit ${i} Title`];
            const benText = record[`Benefit ${i} Text`];
            if (benTitle || benText) {
                benefits.push(`  - title: "${(benTitle || '').replace(/"/g, '\\"')}"
    text: "${(benText || '').replace(/"/g, '\\"')}"
    icon: "${benIcon}"`);
            }
        }

        const markdownBody = turndownService.turndown(htmlContent);

        let frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
pageTitle: "${(pageTitle || '').replace(/"/g, '\\"')}"
description: "${overview.replace(/"/g, '\\"')}"
pubDate: "${pubDate}"
icon: "${iconPath}"
overview: "${overview.replace(/"/g, '\\"')}"
subheader: "${(subheader || '').replace(/"/g, '\\"')}"
`;
        if (disclaimer) frontmatter += `disclaimer: "${disclaimer.replace(/"/g, '\\"')}"\n`;
        if (benefits.length > 0) {
            frontmatter += `benefits:\n${benefits.join('\n')}\n`;
        }
        
        frontmatter += `---\n\n${markdownBody}`;

        fs.writeFileSync(path.join(INTEGRATIONS_OUT, `${slug}.mdx`), frontmatter);
    }
    console.log(`Parsed ${records.length} integrations.`);
}

parseFeatures();
parseIntegrations();
