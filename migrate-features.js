const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, 'src', 'content', 'posts');

// Mapping of old feature identifiers to the new branch's identifiers
const featureMap = {
    'carrier-portal': 'carrier-self-scheduling',
    'yard-management': 'yard-visibility-execution', // Guessing the slug based on title
    'documentation': 'document-management-checklists',
    'capacity-limits': 'dock-capacity-management',
    'custom-rules': 'automated-scheduling-rules',
    'data-validation': 'appointment-data-controls',
    'efficiency-reports': 'detention-analytics-executive-reporting',
    'notifications': 'automated-partner-internal-alerts',
    'access-anywhere': 'mobile-companion-app',
    'integration': 'wms-tms-integrations',
    'dock-dashboard': 'live-dock-board',
    'live-editing': 'live-dock-board' // Mapping deprecated feature to its native replacement
};

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx'));

let updatedCount = 0;

for (const file of files) {
    const filePath = path.join(postsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Simple regex to replace the relatedFeature field in frontmatter
    for (const [oldFeature, newFeature] of Object.entries(featureMap)) {
        // Regex looks for relatedFeature: 'old-feature' or relatedFeature: "old-feature" or relatedFeature: old-feature
        const regex = new RegExp(`(relatedFeature\\s*:\\s*)(['"]?)${oldFeature}(['"]?)`, 'g');
        
        if (regex.test(content)) {
            content = content.replace(regex, `$1$2${newFeature}$3`);
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        updatedCount++;
        console.log(`Updated feature reference in: ${file}`);
    }
}

console.log(`\nMigration complete. Updated ${updatedCount} blog posts to use the new feature slugs.`);
