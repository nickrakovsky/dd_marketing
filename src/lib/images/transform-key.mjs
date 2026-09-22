/**
 * The full emitted source URL is part of the key. Two files with the same name
 * in different directories, or a changed source image, must never share a variant.
 * These are the transform fields used by Astro's local image service.
 */
export function imageTransformKey(options) {
  return JSON.stringify([
    typeof options.src === 'string' ? options.src : options.src.src,
    options.width ?? null,
    options.height ?? null,
    options.format ?? null,
    options.quality ?? null,
    options.fit ?? null,
    options.position ?? null,
    options.background ?? null,
  ]);
}
