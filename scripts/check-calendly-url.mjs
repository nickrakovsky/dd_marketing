#!/usr/bin/env node
// Verifies every Calendly URL across the site uses the canonical handle
// from src/lib/calendly-config.mjs. Catches the case where the handle is
// renamed in the constant but blog posts / pages / components still link
// the old URL — which would otherwise silently break every demo CTA in
// MDX content (the click interceptor fires, but Calendly returns 404 on
// the dead handle inside the iframe).
//
// Run via `node scripts/check-calendly-url.mjs`. Exit code 1 on drift.

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CALENDLY_BOOKING_FRAGMENT } from '../src/lib/calendly-config.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SCAN_DIRS = ['src', 'public'];
const SKIP_DIRS = new Set(['node_modules', '.astro', 'dist', '.cloudflare']);

// Anything that looks like a Calendly booking URL — we'll then check it
// matches the canonical fragment.
const CALENDLY_URL_RE = /https?:\/\/(?:www\.)?calendly\.com\/[^\s"'<>)]+/g;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(path);
    } else if (entry.isFile()) {
      yield path;
    }
  }
}

const SCANNABLE_EXT = /\.(astro|tsx?|jsx?|mdx?|html|json|css|svg|txt|mjs|cjs)$/;

const drift = [];

for (const baseDir of SCAN_DIRS) {
  const abs = join(ROOT, baseDir);
  try {
    await stat(abs);
  } catch {
    continue;
  }
  for await (const file of walk(abs)) {
    if (!SCANNABLE_EXT.test(file)) continue;
    // Don't lint the config file itself — it defines the canonical fragment.
    if (file.endsWith('calendly-config.mjs')) continue;
    const content = await readFile(file, 'utf8');
    const matches = content.match(CALENDLY_URL_RE);
    if (!matches) continue;
    for (const url of matches) {
      if (!url.includes(CALENDLY_BOOKING_FRAGMENT)) {
        drift.push({ file: relative(ROOT, file), url });
      }
    }
  }
}

if (drift.length === 0) {
  console.log(`OK — every Calendly URL uses the canonical handle (${CALENDLY_BOOKING_FRAGMENT}).`);
  process.exit(0);
}

console.error('Calendly URL drift detected. Update the canonical handle in src/lib/calendly-config.mjs');
console.error(`OR fix these files to use ${CALENDLY_BOOKING_FRAGMENT}:\n`);
for (const { file, url } of drift) {
  console.error(`  ${file}\n    → ${url}`);
}
process.exit(1);
