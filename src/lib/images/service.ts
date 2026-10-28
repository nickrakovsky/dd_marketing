import { baseService } from 'astro/assets';
import type { LocalImageService } from 'astro';
import { optimizedImages } from './manifest';
import { imageTransformKey } from './transform-key.mjs';

/**
 * Sharp runs only during development and build-time sampling. In the deployed
 * Worker, Image/getImage resolve to those same optimized, immutable files.
 */
const service: LocalImageService = {
  ...baseService,
  async getURL(options, config) {
    const defaultURL = await baseService.getURL(options, config);
    const sourceURL = typeof options.src === 'string' ? options.src : options.src.src;
    // Preserve Astro's handling of sources that do not use its image endpoint.
    if (defaultURL === sourceURL) return defaultURL;

    if (import.meta.env.DEV || globalThis.astroAsset?.addStaticImage) return defaultURL;

    const key = imageTransformKey(options);
    const optimizedURL = optimizedImages[key];
    if (!optimizedURL) {
      throw new Error(`Missing precompiled image variant: ${key}. Include this render in the build-time publication samples.`);
    }
    return optimizedURL;
  },
  async transform(input, options, config) {
    // Never import the native Sharp dependency while initializing the Worker.
    const { default: sharpService } = await import('astro/assets/services/sharp');
    return sharpService.transform(input, options, config);
  },
};

export default service;
