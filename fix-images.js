import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = path.join(__dirname, 'src', 'content', 'posts');

let fixedCount = 0;

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.mdx')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Replace all instances of `../../assets/images/` with `../../assets/blog-images/`
    content = content.replace(/\.\.\/\.\.\/assets\/images\//g, '../../assets/blog-images/');
    
    // Some lines may have different casing or extensions, but this covers the directory name
    
    // Also handling edge cases:
    content = content.replace(/assets\/images\//g, 'assets/blog-images/');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      fixedCount++;
    }
  }
});

console.log(`Fixed image paths in ${fixedCount} files.`);
