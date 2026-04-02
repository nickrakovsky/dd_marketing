import fs from 'fs';
import path from 'path';

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

function parseCSV(text) {
    const result = [];
    let row = [];
    let inQuotes = false;
    let currentVal = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (inQuotes) {
            if (char === '"' && text[i+1] === '"') {
                currentVal += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                currentVal += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                row.push(currentVal);
                currentVal = '';
            } else if (char === '\n' || char === '\r') {
                if (char === '\r' && text[i+1] === '\n') {
                    i++;
                }
                row.push(currentVal);
                currentVal = '';
                if (row.length > 0 && row.some(x => x !== '')) {
                    result.push(row);
                }
                row = [];
            } else {
                currentVal += char;
            }
        }
    }
    if (currentVal !== '' || row.length > 0) {
        row.push(currentVal);
        result.push(row);
    }
    return result;
}

function formatHtmlForMdx(html) {
    if (!html) return '';
    // Add newlines before and after common block elements to assist MDX parser
    const blockTags = ['p', 'div', 'table', 'thead', 'tbody', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'section'];
    let formatted = html;
    blockTags.forEach(tag => {
        const openTag = new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi');
        const closeTag = new RegExp(`</${tag}>`, 'gi');
        formatted = formatted.replace(openTag, (match) => `\n${match}\n`);
        formatted = formatted.replace(closeTag, (match) => `\n${match}\n`);
    });
    // Remove triple/quadruple newlines to keep it clean
    return formatted.replace(/\n{3,}/g, '\n\n').trim();
}

function parseFeatures() {
    const rawData = fs.readFileSync(FEATURES_CSV, 'utf8');
    const rows = parseCSV(rawData);
    const headers = rows[0];

    const records = rows.slice(1).map(row => {
        const obj = {};
        for(let i = 0; i < headers.length; i++) {
            obj[headers[i]] = row[i];
        }
        return obj;
    }).filter(r => r.Name); // filter empty

    let count = 0;
    for (const record of records) {
        if (record.Draft === 'true' || record.Archived === 'true') continue;

        const title = record['Name'] || '';
        const slug = record['Slug'] || '';
        const pubDate = (record['Published On'] && record['Published On'].length > 0) 
            ? new Date(record['Published On']).toISOString() 
            : new Date().toISOString();
        const shortDescription = record['Feature Brief Description'] || '';
        const htmlContent = record['Feature Detailed Description'] || '';
        const explainerVideo = record['Explainer Video'] || '';
        
        let iconPath = getLocalIconPath(record['Feature Icon'], 'features');
        if (iconPath.includes('vision.webp')) iconPath = '/images/features/vision.svg';
        
        const markdownBody = formatHtmlForMdx(htmlContent);

        const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${shortDescription.replace(/"/g, '\\"')}"
pubDate: "${pubDate}"
icon: "${iconPath}"
${explainerVideo ? `videoUrl: "${explainerVideo}"` : ''}
---

${markdownBody}`;
        
        fs.writeFileSync(path.join(FEATURES_OUT, `${slug}.mdx`), frontmatter);
        count++;
    }
    console.log(`Parsed ${count} features.`);
}

function parseIntegrations() {
    const rawData = fs.readFileSync(INTEGRATIONS_CSV, 'utf8');
    const rows = parseCSV(rawData);
    const headers = rows[0];

    const records = rows.slice(1).map(row => {
        const obj = {};
        for(let i = 0; i < headers.length; i++) {
            obj[headers[i]] = row[i] || '';
        }
        return obj;
    }).filter(r => r['Integration Name']); // filter empty

    let count = 0;
    for (const record of records) {
        if (record.Draft === 'true' || record.Archived === 'true') continue;

        const title = record['Integration Name'] || '';
        const slug = record['Slug'] || '';
        const rawDate = record['Published On'] || record['Created On'];
        const pubDate = (rawDate && rawDate.length > 0) ? new Date(rawDate).toISOString() : new Date().toISOString();
        const overview = record['Integration Card Overview'] || '';
        const subheader = record['Integration Page Subheader'] || '';
        const htmlContent = record['Integration Page Description'] || '';
        const iconPath = getLocalIconPath(record['Integration Icon'], 'integrations');
        const disclaimer = record['Copyrights Disclaimer'] || '';
        
        const pageTitle = record['Page Title'] || '';

        // Formatting benefits into an array
        const benefits = [];
        for (let i = 1; i <= 3; i++) {
            const benIcon = getLocalIconPath(record[`Benefit ${i} Icon`], 'integrations');
            const benTitle = record[`Benefit ${i} Title`] || '';
            const benText = record[`Benefit ${i} Text`] || '';
            if (benTitle || benText) {
                benefits.push(`  - title: "${benTitle.replace(/"/g, '\\"')}"
    text: "${benText.replace(/"/g, '\\"')}"
    icon: "${benIcon}"`);
            }
        }

        const markdownBody = formatHtmlForMdx(htmlContent);

        let frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
pageTitle: "${pageTitle.replace(/"/g, '\\"')}"
description: "${overview.replace(/"/g, '\\"')}"
pubDate: "${pubDate}"
icon: "${iconPath}"
overview: "${overview.replace(/"/g, '\\"')}"
subheader: "${subheader.replace(/"/g, '\\"')}"
`;
        if (disclaimer) frontmatter += `disclaimer: "${disclaimer.replace(/"/g, '\\"')}"\n`;
        if (benefits.length > 0) {
            frontmatter += `benefits:\n${benefits.join('\n')}\n`;
        }
        
        frontmatter += `---\n\n${markdownBody}`;

        fs.writeFileSync(path.join(INTEGRATIONS_OUT, `${slug}.mdx`), frontmatter);
        count++;
    }
    console.log(`Parsed ${count} integrations.`);
}

parseFeatures();
parseIntegrations();
