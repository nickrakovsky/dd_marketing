// Offline measurement only: the homepage ships the original SVGs and static CSS.
// Regenerate after changing a logo: node scripts/measure-customer-logos.mjs
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const sources = [
  ['HelloFresh', 'Group-1.svg'], ['Stitch Fix', 'Group.svg'],
  ['ShipMonk', 'shipmonk_.svg'], ['Samsung', 'Samsung.svg'],
  ['Toyota', 'Toyota_Logo.svg'], ['LG', 'Layer_1-2.svg'],
  ['GSK', 'Layer_2-2.svg'], ['Pepsi', 'Pepsi_2023.svg'],
  ['Columbia', 'columbia-wide.svg'],
];
const metrics = [];
for (const [name, src] of sources) {
  const source = await fs.readFile(new URL(`public/images/${src}`, root));
  const { data, info } = await sharp(source)
    .resize({ width: 1400, height: 1400, fit: 'inside' })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width, top = info.height, right = 0, bottom = 0;
  let inkArea = 0, verticalMoment = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const pixel = (y * info.width + x) * 4;
      const alpha = data[pixel + 3] / 255;
      // Ignore transparent padding, white cutouts, and negligible edge noise.
      const darkness = 1 - (.2126 * data[pixel] + .7152 * data[pixel + 1] + .0722 * data[pixel + 2]) / 255;
      if (alpha * darkness < .03) continue;
      left = Math.min(left, x); top = Math.min(top, y);
      right = Math.max(right, x); bottom = Math.max(bottom, y);
      inkArea += alpha;
      verticalMoment += y * alpha;
    }
  }
  if (!inkArea) throw new Error(`No visible artwork found in ${src}`);
  metrics.push({
    name, src,
    sourceHash: createHash('sha256').update(source).digest('hex'),
    canvasWidth: info.width, canvasHeight: info.height,
    left, top, width: right - left + 1, height: bottom - top + 1,
    inkArea: Number(inkArea.toFixed(4)),
    centroidY: Number((verticalMoment / inkArea - top).toFixed(4)),
  });
}
await fs.writeFile(new URL('src/data/customer-logo-metrics.json', root), JSON.stringify(metrics, null, 2) + '\n');
console.log(`Measured visible bounds, ink area and vertical centre for ${metrics.length} customer logos.`);
