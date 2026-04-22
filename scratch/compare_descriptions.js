import fs from 'fs';
import path from 'path';

const csvPath = 'c:/Users/jeowy/Desktop/dd_marketing/dd_marketing/assets-for-import/BranchBros-Article-Schema.csv';
const postsDir = 'src/content/posts';

function parseCSV(content) {
    const lines = content.split('\n');
    const results = [];
    let currentLine = '';
    let inQuotes = false;

    for (let i = 1; i < lines.length; i++) {
        let line = lines[i];
        if (!line) continue;
        
        currentLine += (currentLine ? '\n' : '') + line;
        
        // Count quotes to handle multi-line CSV cells
        const quotes = (line.match(/"/g) || []).length;
        if (quotes % 2 !== 0) {
            inQuotes = !inQuotes;
        }
        
        if (!inQuotes) {
            // Process currentLine
            const parts = currentLine.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (parts && parts.length >= 2) {
                const url = parts[1].replace(/"/g, '').trim();
                const schemaMatch = currentLine.match(/<script type=""application\/ld\+json"">([\s\S]*?)<\/script>/);
                if (schemaMatch) {
                    try {
                        const jsonStr = schemaMatch[1].replace(/""/g, '"');
                        const schema = JSON.parse(jsonStr);
                        results.push({ url, description: schema.description, headline: schema.headline });
                    } catch (e) {
                        // Silent fail for bad JSON
                    }
                }
            }
            currentLine = '';
        }
    }
    return results;
}

const csvContent = fs.readFileSync(csvPath, 'utf8');
const csvData = parseCSV(csvContent);

const mdxFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx'));
const comparison = [];

for (const entry of csvData) {
    const slug = entry.url.split('/posts/')[1];
    if (!slug) continue;
    
    const mdxFile = mdxFiles.find(f => f === `${slug}.mdx`);
    if (mdxFile) {
        const mdxContent = fs.readFileSync(path.join(postsDir, mdxFile), 'utf8');
        const descMatch = mdxContent.match(/description: (?:>-\n)?\s*(["']?)([\s\S]*?)\1\n/);
        if (descMatch) {
            let mdxDesc = descMatch[2].replace(/\n\s+/g, ' ').trim();
            const csvDesc = entry.description ? entry.description.trim() : '';
            
            if (mdxDesc !== csvDesc) {
                comparison.push({
                    title: entry.headline,
                    url: entry.url,
                    csvDesc,
                    mdxDesc
                });
            }
        }
    }
}

console.log(JSON.stringify(comparison, null, 2));
