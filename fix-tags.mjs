import fs from 'fs/promises';
import path from 'path';

const directory = './src/content/posts';

async function fixVoidTags() {
    try {
        const files = await fs.readdir(directory);
        let updatedCount = 0;

        for (const file of files) {
            if (file.endsWith('.mdx') || file.endsWith('.md')) {
                const filePath = path.join(directory, file);
                let content = await fs.readFile(filePath, 'utf8');
                const originalContent = content;

                // Matches unclosed void tags (col, img, br, hr, input) and safely adds the closing slash
                const voidTagsRegex = /<(col|img|br|hr|input|source)\b([^>]*?)(?<!\/)>/gi;

                content = content.replace(voidTagsRegex, '<$1$2 />');

                if (content !== originalContent) {
                    await fs.writeFile(filePath, content, 'utf8');
                    updatedCount++;
                }
            }
        }
        console.log(`✅ Successfully fixed self-closing tags in ${updatedCount} files.`);
    } catch (error) {
        console.error('❌ Error updating files:', error);
    }
}

fixVoidTags();