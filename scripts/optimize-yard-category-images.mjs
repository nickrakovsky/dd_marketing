import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

// Keep the original JPEGs and WebP fallbacks. These AVIF sources reduce the
// four initial selector cards without changing their crop or dimensions.
const imageDirectory = new URL('../public/images/temp/', import.meta.url);
const categories = [
  'warehouse-docks',
  'rail-transit',
  'materials-aggregates',
  'agriculture-processing',
];

for (const category of categories) {
  const stem = `yard-quadrant-${category}`;
  for (const width of [400, 600, 800, 1016]) {
    await sharp(fileURLToPath(new URL(`${stem}.jpg`, imageDirectory)))
      .resize({ width, withoutEnlargement: true })
      .avif({ quality: 45, effort: 6 })
      .toFile(fileURLToPath(new URL(`${stem}-${width}.avif`, imageDirectory)));
  }
}
