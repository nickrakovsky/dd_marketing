/** Cache build-immutable metadata, never time-dependent publication decisions. */
export function createCollectionCache<Key extends string, Entry>(
  load: (key: Key) => Promise<Entry[]>,
  enabled: boolean,
) {
  const collections = new Map<Key, Promise<Entry[]>>();
  return async (key: Key): Promise<Entry[]> => {
    if (!enabled) return load(key);
    let entries = collections.get(key);
    if (!entries) {
      entries = load(key).catch(error => {
        collections.delete(key);
        throw error;
      });
      collections.set(key, entries);
    }
    // Callers may sort/filter their array; the underlying metadata is read-only.
    return (await entries).slice();
  };
}
