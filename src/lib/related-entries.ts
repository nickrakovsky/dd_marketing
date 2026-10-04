import { getCollection } from 'astro:content';

// Content entries only change with a deployment. Keep the unfiltered entries
// between requests, then apply the request's publication date in ArticlePage.
function loadEntries() {
  return Promise.all([getCollection('posts'), getCollection('videos')]);
}

let entriesPromise: ReturnType<typeof loadEntries> | undefined;

export function getRelatedEntries() {
  if (!entriesPromise) {
    entriesPromise = loadEntries().catch((error) => {
      entriesPromise = undefined;
      throw error;
    });
  }
  return entriesPromise;
}
