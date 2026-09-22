import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { imageTransformKey } from '../src/lib/images/transform-key.mjs';

const MARKER = /(['"])__DD_SSR_IMAGE_MANIFEST__\1/g;

async function javascriptFiles(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await javascriptFiles(filename));
    else if (/\.[cm]?js$/.test(entry.name)) files.push(filename);
  }
  return files;
}

/**
 * Astro already generates the exact Image/getImage transforms encountered while
 * prerendering. Record its returned URLs while the private publication samples
 * render, then make that mapping available to request-time rendering.
 *
 * No image manifest or sample HTML is exposed as a public URL.
 */
export default function precompiledImages() {
  const variants = new Map();
  let serverDirectory;
  return {
    name: 'datadocks-precompiled-images',
    hooks: {
      'astro:config:setup': ({ command, updateConfig }) => {
        if (command === 'build') {
          updateConfig({ image: { endpoint: { entrypoint: '@astrojs/cloudflare/image-endpoint' } } });
        }
      },
      'astro:config:done': ({ config }) => {
        serverDirectory = fileURLToPath(config.build.server);
      },
      'astro:build:start': () => variants.clear(),
      'astro:build:ssr': () => {
        const assets = globalThis.astroAsset;
        const addStaticImage = assets?.addStaticImage;
        if (typeof addStaticImage !== 'function') {
          throw new Error('[precompiled-images] Astro did not expose its build-time image registration hook.');
        }
        assets.addStaticImage = (options, propertiesToHash, originalFilePath) => {
          const url = addStaticImage(options, propertiesToHash, originalFilePath);
          const key = imageTransformKey(options);
          if (variants.has(key) && variants.get(key) !== url) {
            throw new Error(`[precompiled-images] Conflicting optimized URLs for ${key}`);
          }
          variants.set(key, url);
          return url;
        };
      },
      'astro:build:done': async ({ dir, logger }) => {
        if (variants.size === 0) {
          throw new Error('[precompiled-images] No optimized variants were recorded.');
        }
        // Fail a build with a dangling image URL, rather than returning originals
        // or promising a responsive width that the actual image does not have.
        for (const url of new Set(variants.values())) {
          const pathname = decodeURIComponent(new URL(url, 'https://datadocks.com').pathname);
          await fs.access(new URL(`.${pathname}`, dir));
        }
        const manifest = JSON.stringify(Object.fromEntries([...variants].sort(([a], [b]) => a.localeCompare(b))));
        let replacements = 0;
        for (const filename of await javascriptFiles(serverDirectory)) {
          const source = await fs.readFile(filename, 'utf8');
          const updated = source.replace(MARKER, () => {
            replacements++;
            return manifest;
          });
          if (updated !== source) await fs.writeFile(filename, updated);
        }
        if (replacements === 0) {
          throw new Error('[precompiled-images] Private Worker image manifest marker was not found.');
        }
        logger.info(`Preserved ${variants.size} optimized image variants for request-time pages.`);
      },
    },
  };
}
