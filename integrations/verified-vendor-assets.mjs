import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VENDOR_SOURCES, VENDOR_ASSETS } from '../src/lib/vendor-assets.mjs';

export function verifyVendorSource(name, bytes, expected = VENDOR_SOURCES[name].integrity) {
  const actual = `sha384-${createHash('sha384').update(bytes).digest('base64')}`;
  if (actual !== expected) {
    throw new Error(`Vendor asset ${name} failed SHA-384 verification. Review the upstream change and explicitly update its pin; do not bypass verification.`);
  }
}

export function transformVendorSource(name, bytes) {
  if (name === 'bentoBootstrap') {
    // The bootstrap itself loads another script. Localizing only the outer
    // tag would leave an unverified vendor script in the execution chain.
    const source = bytes.toString('utf8');
    const upstream = VENDOR_SOURCES.bentoSdk.url;
    if (source.split(upstream).length !== 2) throw new Error('Unexpected Bento bootstrap SDK reference.');
    return Buffer.from(source.replace(upstream, VENDOR_ASSETS.bentoSdk.path));
  }
  if (name === 'calendlyCss') {
    // This absolute image URL would otherwise resolve against datadocks.com.
    const source = bytes.toString('utf8');
    const upstream = '/assets/external/close-icon.svg';
    if (source.split(upstream).length !== 2) throw new Error('Unexpected Calendly close-icon reference.');
    return Buffer.from(source.replace(upstream, VENDOR_ASSETS.calendlyCloseIcon.path));
  }
  return bytes;
}

export async function prepareVendorAssets(buildRoot, cacheRoot, fetcher = fetch) {
  await fs.mkdir(cacheRoot, { recursive: true });
  for (const [name, spec] of Object.entries(VENDOR_SOURCES)) {
    const key = createHash('sha384').update(spec.integrity).digest('hex');
    const cacheFile = path.join(cacheRoot, key);
    let bytes;
    try {
      bytes = await fs.readFile(cacheFile);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const response = await fetcher(spec.url, {
        redirect: 'error', credentials: 'omit', signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`Vendor asset ${name} returned HTTP ${response.status}.`);
      bytes = Buffer.from(await response.arrayBuffer());
      verifyVendorSource(name, bytes);
      await fs.writeFile(cacheFile, bytes);
    }
    // Recheck cached bytes too. There is no unverified CDN fallback.
    verifyVendorSource(name, bytes);
    const destination = path.join(buildRoot, VENDOR_ASSETS[name].path.slice(1));
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, transformVendorSource(name, bytes));
  }
}

export default function verifiedVendorAssets() {
  let cacheRoot;
  return {
    name: 'verified-vendor-assets',
    hooks: {
      'astro:config:done': ({ config }) => {
        cacheRoot = fileURLToPath(new URL('verified-vendor-assets/', config.cacheDir));
      },
      'astro:build:done': async ({ dir }) => {
        const buildRoot = fileURLToPath(dir);
        await prepareVendorAssets(buildRoot, cacheRoot);
        // _astro is already excluded from Worker routing and has immutable
        // caching. These generated assets use that existing publication path.
        console.log('[vendor-assets] published six SHA-384-verified first-party assets');
      },
    },
  };
}
