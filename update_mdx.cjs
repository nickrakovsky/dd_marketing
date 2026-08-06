const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, 'src/content/features');
const draftsFile = path.join('/Users/joeybowie/.gemini/antigravity/brain/080a6198-4cb5-4103-8ec6-4061653b791e/content_expansion_drafts.md');

const draftsContent = fs.readFileSync(draftsFile, 'utf8');

const mapping = {
  'access-anywhere.mdx': '1. Mobile Companion App',
  'ai-assistant.mdx': '2. AI Logistics Assistant',
  'capacity-limits.mdx': '3. Dock Capacity Management',
  'carrier-portal.mdx': '4. Carrier Self-Scheduling',
  'custom-rules.mdx': '5. Automated Scheduling Rules',
  'data-validation.mdx': '6. Appointment Data Controls',
  'dock-dashboard.mdx': '7. Live Dock Board',
  'documentation.mdx': '8. Document Management & Checklists',
  'efficiency-reports.mdx': '9. Detention Analytics & Executive Reporting',
  'integration.mdx': '10. WMS & TMS Integrations',
  'notifications.mdx': '11. Automated Partner & Internal Alerts',
  'yard-management.mdx': '12. Yard Visibility & Execution'
};

function parseDrafts() {
  const sections = draftsContent.split(/## \d+\. /);
  const data = {};
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const lines = section.split('\n');
    const title = lines[0].trim();
    
    let implementation = '';
    let differentiation = '';
    let businessImpact = '';
    let vision = '';
    let table = null;
    let faq = [];
    let dataVizText = '';
    
    let currentBlock = null;
    
    for (let j = 1; j < lines.length; j++) {
      const line = lines[j];
      if (line.startsWith('### ')) {
        const heading = line.replace('### ', '').trim().toLowerCase();
        if (heading.includes('implementation')) currentBlock = 'implementation';
        else if (heading.includes('differentiation')) currentBlock = 'differentiation';
        else if (heading.includes('business impact')) currentBlock = 'businessImpact';
        else if (heading.includes('strategic vision')) currentBlock = 'vision';
        else if (heading.includes('table idea')) currentBlock = 'table';
        else if (heading.includes('faq idea')) currentBlock = 'faq';
        else if (heading.includes('flow chart') || heading.includes('data viz')) currentBlock = 'dataViz';
        else currentBlock = null;
        continue;
      }
      
      if (!currentBlock) continue;
      
      if (['implementation', 'differentiation', 'businessImpact', 'vision'].includes(currentBlock)) {
        if (line.trim() && !line.startsWith('**How ')) {
            // Avoid adding the "**How to implement...**" line to the output if we want clean text. 
            // Wait, actually I'll just remove markdown bold lines that match those instructions.
            if (!line.match(/^\*\*How/) && !line.match(/^\*\*The business/) && !line.match(/^\*\*Before vs/)) {
                if (currentBlock === 'implementation') implementation += line + ' ';
                if (currentBlock === 'differentiation') differentiation += line + ' ';
                if (currentBlock === 'businessImpact') businessImpact += line + ' ';
                if (currentBlock === 'vision') vision += line + ' ';
            }
        }
      }
      
      if (currentBlock === 'faq') {
        if (line.trim().startsWith('- ')) {
          faq.push(line.trim().substring(2));
        }
      }
      
      if (currentBlock === 'table') {
        if (!table) table = [];
        if (line.trim().startsWith('|')) {
          if (!line.includes('|---|')) {
            const cols = line.split('|').filter(c => c.trim()).map(c => c.trim());
            if (cols.length > 0) {
              table.push(cols);
            }
          }
        }
      }

      if (currentBlock === 'dataViz') {
        if (line.trim() && !line.startsWith('**')) {
            dataVizText += line + ' ';
        }
      }
    }
    
    // Process the table into headers and rows
    let tableHeaders = [];
    let tableRows = [];
    if (table && table.length > 0) {
      tableHeaders = table[0];
      tableRows = table.slice(1);
    }
    
    data[title] = {
      implementation: implementation.trim().replace(/"/g, '\\"'),
      differentiation: differentiation.trim().replace(/"/g, '\\"'),
      businessImpact: businessImpact.trim().replace(/"/g, '\\"'),
      vision: vision.trim().replace(/"/g, '\\"'),
      faq,
      tableHeaders,
      tableRows,
      dataVizText: dataVizText.trim().replace(/"/g, '\\"')
    };
  }
  return data;
}

const parsedDrafts = parseDrafts();

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const lines = match[1].split('\n');
  const fm = {};
  lines.forEach(l => {
    const idx = l.indexOf(':');
    if (idx !== -1) {
      const key = l.substring(0, idx).trim();
      const val = l.substring(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        fm[key] = val.substring(1, val.length - 1);
      } else {
        fm[key] = val;
      }
    }
  });
  return fm;
}

for (const [filename, title] of Object.entries(mapping)) {
  const rawTitle = title.replace(/^\d+\. /, ''); // e.g. Mobile Companion App
  const draftData = parsedDrafts[rawTitle];
  if (!draftData) {
    console.log('Skipping', filename, '- no draft data found for', rawTitle);
    continue;
  }
  
  const filePath = path.join(featuresDir, filename);
  let existingContent = '';
  if (fs.existsSync(filePath)) {
    existingContent = fs.readFileSync(filePath, 'utf8');
  } else {
    continue;
  }
  
  const existingFm = extractFrontmatter(existingContent);
  
  // Build new YAML
  let yaml = `---\n`;
  yaml += `title: "${existingFm.title || rawTitle}"\n`;
  yaml += `description: "${existingFm.description || ''}"\n`;
  yaml += `pubDate: "${existingFm.pubDate || '2026-02-23T16:10:17.000Z'}"\n`;
  if (existingFm.icon) yaml += `icon: "${existingFm.icon}"\n`;
  if (existingFm.videoUrl) yaml += `videoUrl: "${existingFm.videoUrl}"\n`;
  
  yaml += `faq:\n`;
  if (draftData.faq.length > 0) {
    draftData.faq.forEach(q => {
      yaml += `  - question: "${q.replace(/"/g, '\\"')}"\n`;
      yaml += `    answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."\n`;
    });
  } else {
    yaml += `  - question: "Lorem ipsum dolor sit amet?"\n`;
    yaml += `    answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."\n`;
  }
  
  // keyMetric
  yaml += `keyMetric:\n`;
  yaml += `  value: "N/A"\n`;
  yaml += `  label: "Metric placeholder"\n`;
  
  // Testimonial commented out
  yaml += `# testimonial:\n`;
  yaml += `#   quote: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco."\n`;
  yaml += `#   author: "Jane Doe"\n`;
  yaml += `#   role: "Manager"\n`;
  yaml += `#   company: "Lorem Ipsum Logistics"\n`;
  
  // Bento Content
  yaml += `bentoContent:\n`;
  yaml += `  implementation: "${draftData.implementation}"\n`;
  yaml += `  differentiation: "${draftData.differentiation}"\n`;
  yaml += `  businessImpact: "${draftData.businessImpact}"\n`;
  yaml += `  vision: "${draftData.vision}"\n`;
  
  yaml += `  dataViz:\n`;
  yaml += `    type: "mermaid"\n`;
  yaml += `    content: "flowchart LR\\n  A[Step 1] --> B[Step 2]"\n`;
  yaml += `    caption: "${draftData.dataVizText.substring(0, 80)}..."\n`; // Truncate caption if it's too long
  
  yaml += `  table:\n`;
  yaml += `    title: "Feature Comparison"\n`;
  if (draftData.tableHeaders.length > 0) {
    yaml += `    headers: [${draftData.tableHeaders.map(h => `"${h.replace(/"/g, '\\"')}"`).join(', ')}]\n`;
    yaml += `    rows:\n`;
    draftData.tableRows.forEach(row => {
      yaml += `      - [${row.map(c => `"${c.replace(/"/g, '\\"')}"`).join(', ')}]\n`;
    });
  } else {
    yaml += `    headers: ["Column 1", "Column 2"]\n`;
    yaml += `    rows:\n`;
    yaml += `      - ["Row 1 Data", "Row 1 Data"]\n`;
  }
  
  yaml += `---\n`;
  
  fs.writeFileSync(filePath, yaml, 'utf8');
  console.log('Updated', filename);
}
