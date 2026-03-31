import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDir = './src/content/posts';
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx'));

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  const month = months[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  return `${month} ${day}, ${year} 12:00 PM`;
}

for (const file of files) {
  const filePath = path.join(postsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, content: body } = matter(content);

  let changed = false;

  // 1. Normalize priority casing
  if (data.priority) {
    const p = data.priority.toLowerCase();
    const normalized = p.charAt(0).toUpperCase() + p.slice(1);
    if (data.priority !== normalized) {
      data.priority = normalized;
      changed = true;
    }
  }

  // 2. Normalize dates to MMM DD, YYYY 12:00 PM if they are just YYYY-MM-DD
  // actually, if it's a date object or a string matching YYYY-MM-DD, normalize it
  const dateFields = ['pubDate', 'updatedDate'];
  for (const field of dateFields) {
    if (data[field]) {
      const val = data[field];
      // Check if it's a date object or doesn't have a colon (indicating missing time)
      if (val instanceof Date || (typeof val === 'string' && !val.includes(':') && /^\d{4}-\d{2}-\d{2}$/.test(val))) {
        data[field] = formatDate(val);
        changed = true;
      }
    }
  }

  if (changed) {
     const newContent = matter.stringify(body, data);
     fs.writeFileSync(filePath, newContent);
     console.log(`Normalized ${file}`);
  }
}
