// Same-origin proxy URL for YouTube poster images.
//
// YouTube serves thumbnails from i.ytimg.com with only a 2-hour Cache-Control,
// which trips PageSpeed's "efficient cache lifetimes" audit. We can't change a
// header on a domain we don't own, so we route the image through our own SSR
// endpoint (see src/pages/yt-thumb/[id].ts) which re-serves it with a 24h TTL.
//
// Quality maps to YouTube's thumbnail variants. The proxy resolves each of
// these through an ordered fallback chain server-side and always terminates in
// hqdefault.jpg, so a missing variant NEVER 404s the browser:
//   sdwebp -> vi_webp/sddefault.webp -> sddefault.jpg -> hqdefault.jpg  (DEFAULT — WebP, ~half the bytes)
//   maxres -> maxresdefault.jpg -> sddefault.jpg -> hqdefault.jpg       (featured / large hero cards)
//   sd     -> sddefault.jpg -> hqdefault.jpg
//   mq     -> mqdefault.jpg -> hqdefault.jpg
//   hq     -> hqdefault.jpg
//
// Default is 'sdwebp': WebP is ~50% smaller than the JPEG hqdefault and
// sddefault is higher-res (640x480 vs 480x360), so the card fetch is both
// lighter and sharper. Safe now that the proxy falls back to JPEG when the
// WebP variant is absent on older uploads.
export type YtThumbQuality = 'hq' | 'mq' | 'sd' | 'maxres' | 'sdwebp';

export function ytThumb(id: string, q: YtThumbQuality = 'sdwebp'): string {
  return `/yt-thumb/${id}${q === 'hq' ? '' : `?q=${q}`}`;
}
