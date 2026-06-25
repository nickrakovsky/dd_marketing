const fs = require('fs');

let smartLinkContent = fs.readFileSync('src/components/SmartLink.astro', 'utf8');

const replacement1 = `  } else if (parsedHref.startsWith('/videos/')) {
    type = 'video';
    id = id || parsedHref.replace('/videos/', '').replace(/\\/$/, '').split('#')[0];
  } else if (parsedHref.startsWith('/posts/')) {
    type = 'post';
    id = id || parsedHref.replace('/posts/', '').replace(/\\/$/, '').split('#')[0];
  } else if (parsedHref.includes('play.google.com/store/apps') || parsedHref.includes('apps.apple.com')) {
    type = 'app-store' as any;
    try {
      const url = new URL(parsedHref);
      title = title || (parsedHref.includes('apple') ? 'App Store' : 'Google Play');
      snippet = snippet || 'Get the DataDocks app for your device.';
    } catch(e) {
      title = title || 'App Store';
    }
  } else {
    // External link parsing...`;

smartLinkContent = smartLinkContent.replace(/  } else if \(parsedHref\.startsWith\('\/videos\/'\)\) {[^}]+} else {\n    \/\/ External link/m, replacement1);

const replacement2 = `// Fetch data
let youtubeId = '';
let iconStr = '';

// Helper to get case-insensitive entry
async function getEntryCaseInsensitive(collection: any, idToFind: any) {
  if (!idToFind) return null;
  const { getCollection } = await import('astro:content');
  const allEntries = await getCollection(collection);
  return allEntries.find((e: any) => e.slug.toLowerCase() === idToFind.toLowerCase());
}

if (type === 'glossary' && id) {
  const entry = await getEntryCaseInsensitive('glossary', id);
  if (entry) {
    title = title || entry.data.termName;
    snippet = snippet || entry.data.contextSnippet;
    href = href || (entry.data.targetPost ? \`/posts/\${entry.data.targetPost.id}\` : '#');
  }
} else if (type === 'post' && id) {
  const entry = await getEntryCaseInsensitive('posts', id);
  if (entry) {
    title = title || entry.data.title;
    snippet = snippet || entry.data.description;
    href = href || \`/posts/\${entry.slug}\`;
  }
} else if (type === 'video' && id) {
  const entry = await getEntryCaseInsensitive('videos', id);
  if (entry) {
    title = title || entry.data.title;
    snippet = snippet || entry.data.description;
    href = href || \`/videos/\${entry.slug}\`;
    youtubeId = entry.data.postType?.value?.youtubeId || '';
    if (entry.data.postType?.discriminant === 'video') {
      type = 'video-widescreen' as any;
    }
  }
}`;

const target2Regex = /\/\/ Fetch data[\s\S]*?(?=\/\/ 3\. If no Title or Snippet)/;
smartLinkContent = smartLinkContent.replace(target2Regex, replacement2 + '\n\n');

fs.writeFileSync('src/components/SmartLink.astro', smartLinkContent);
