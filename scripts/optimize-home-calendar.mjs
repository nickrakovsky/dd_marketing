import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

// Generate public homepage derivatives from the original screenshot, never from
// another resized image. The full-resolution enlargement remains unchanged.
const directory = new URL('../public/images/', import.meta.url);
const source = fileURLToPath(new URL('DataDocks-Calendar-Screenshot.webp', directory));
const mobileCrop = { left: 178, top: 160, width: 749, height: 540 };
const avif = { quality: 55, effort: 7, chromaSubsampling: '4:4:4' };

for (const width of [400, 560, 749]) {
  const image = sharp(source).extract(mobileCrop).resize({ width, withoutEnlargement: true });
  await image.clone().avif(avif).toFile(fileURLToPath(new URL(`calendar-hero-mobile-${width}.avif`, directory)));
  if (width < mobileCrop.width) {
    await image.clone().webp({ quality: 90, effort: 6, smartSubsample: true })
      .toFile(fileURLToPath(new URL(`calendar-hero-mobile-${width}.webp`, directory)));
  }
}

// Preserve the existing native 749px mobile WebP and all desktop WebP fallbacks.
// A sharper mobile crop requires a new capture; enlarging this source adds no detail.
for (const width of [800, 1080, 1600, 2000]) {
  await sharp(source).resize({ width, withoutEnlargement: true }).avif(avif)
    .toFile(fileURLToPath(new URL(`calendar-hero-desktop-${width}.avif`, directory)));
}
