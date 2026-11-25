import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import { createCollectionCache } from './collection-cache';

// Astro's data-store getCollection path rebuilds image metadata on every call.
// Production content is fixed by the build; development must see editor changes.
const loadCollection = createCollectionCache<CollectionKey, CollectionEntry<CollectionKey>>(
  getCollection,
  import.meta.env.PROD,
);

export async function getCachedCollection<Key extends CollectionKey>(key: Key): Promise<CollectionEntry<Key>[]> {
  return await loadCollection(key) as CollectionEntry<Key>[];
}
