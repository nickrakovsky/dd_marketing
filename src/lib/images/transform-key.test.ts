import { describe, expect, it } from 'vitest';
import { imageTransformKey } from './transform-key.mjs';

describe('precompiled image transform identity', () => {
  const image = { src: '/_astro/photo.source-hash.webp', width: 1200, height: 800, format: 'webp' };
  const transform = { src: image, width: 600, height: 400, format: 'webp' };

  it('does not confuse equally named files from different directories or revisions', () => {
    const key = imageTransformKey(transform);
    expect(imageTransformKey({ ...transform, src: { ...image, src: '/_astro/other/photo.source-hash.webp' } })).not.toBe(key);
    expect(imageTransformKey({ ...transform, src: { ...image, src: '/_astro/photo.changed-hash.webp' } })).not.toBe(key);
  });

  it('distinguishes every option that changes the rendered pixels', () => {
    const key = imageTransformKey(transform);
    for (const overrides of [
      { width: 720 }, { height: 450 }, { format: 'avif' }, { quality: 90 },
      { fit: 'cover' }, { position: 'left top' }, { background: '#ffffff' },
    ]) {
      expect(imageTransformKey({ ...transform, ...overrides })).not.toBe(key);
    }
  });

  it('ignores HTML-only attributes and preserves identity across metadata clones', () => {
    expect(imageTransformKey({ ...transform, alt: 'A photo', class: 'rounded', loading: 'lazy', widths: [600, 720] }))
      .toBe(imageTransformKey(transform));
    expect(imageTransformKey({ ...transform, src: image.src }))
      .toBe(imageTransformKey(transform));
  });
});
