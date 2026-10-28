/**
 * Publication is determined by the actual timestamp in every environment.
 * A caller may provide a cutoff for an explicitly scoped future preview.
 * Missing dates remain visible for content whose schema makes dates optional;
 * invalid dates are never treated as permission to publish.
 */
export function isPublished(
  pubDate?: Date | string | null,
  asOf: Date = new Date(),
): boolean {
  const cutoff = asOf.getTime();
  if (!Number.isFinite(cutoff)) return false;
  if (pubDate == null) return true;

  const timestamp = pubDate instanceof Date ? pubDate.getTime() : new Date(pubDate).getTime();
  return Number.isFinite(timestamp) && timestamp <= cutoff;
}

export function filterPublished<T extends { data: { pubDate?: Date | string | null } }>(
  items: readonly T[],
  asOf: Date = new Date(),
): T[] {
  return items.filter((item) => isPublished(item.data.pubDate, asOf));
}
