// Same-origin proxy URL for YouTube poster images.
//
// YouTube serves thumbnails from i.ytimg.com with only a 2-hour Cache-Control,
// which trips PageSpeed's "efficient cache lifetimes" audit. We can't change a
// header on a domain we don't own, so we route the image through our own SSR
// endpoint (see src/pages/yt-thumb/[id].ts) which re-serves it with a 24h TTL.
//
// Quality maps to YouTube's thumbnail variants:
//   hq     -> hqdefault.jpg      (default poster, cards)
//   mq     -> mqdefault.jpg
//   sd     -> sddefault.jpg
//   maxres -> maxresdefault.jpg  (featured / large hero cards)
//   sdwebp -> vi_webp/sddefault.webp (lite-youtube progressive upgrade)
export type YtThumbQuality = 'hq' | 'mq' | 'sd' | 'maxres' | 'sdwebp';

export function ytThumb(id: string, q: YtThumbQuality = 'hq'): string {
  return `/yt-thumb/${id}${q === 'hq' ? '' : `?q=${q}`}`;
}
