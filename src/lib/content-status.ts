/**
 * Utility to determine whether a content item is published or scheduled for a future date.
 * In production builds, items with a future pubDate are excluded.
 * In development / local preview mode, all items remain accessible.
 */
export function isPublished(pubDate?: Date | string | null): boolean {
  if (!import.meta.env.PROD) {
    return true; // Always visible in development and preview
  }
  if (!pubDate) {
    return true;
  }
  const dateObj = pubDate instanceof Date ? pubDate : new Date(pubDate);
  if (isNaN(dateObj.getTime())) {
    return true;
  }
  return dateObj <= new Date();
}

export function filterPublished<T extends { data: { pubDate?: Date | string } }>(items: T[]): T[] {
  return items.filter((item) => isPublished(item.data.pubDate));
}
