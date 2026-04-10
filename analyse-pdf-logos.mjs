
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imgDir = path.join(__dirname, 'public', 'images');

const logos = [
  { file: 'Pepsi_2023.svg',               label: 'Pepsi' },
  { file: 'conagra.svg',                  label: 'Conagra' },
  { file: 'Group-1.svg',                  label: 'HelloFresh' },
  { file: 'Colavita_logo.svg',            label: 'Colavita' },
  { file: 'signature_brands.png',         label: 'Signature Brands' },
  { file: 'gwfg-logo-white.svg',          label: 'Golden West' },
  { file: 'axon-logo.svg',                 label: 'Axon' },
];

const TARGET_MASS = 1500; // Slightly smaller for PDF layout

async function analyseImage(filePath) {
  let aspect = 1;

  if (filePath.endsWith('.svg')) {
    const svgText = fs.readFileSync(filePath, 'utf-8');
    const vbMatch = svgText.match(/viewBox=["']([^"']+)["']/);
    if (vbMatch) {
      const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[3] > 0) aspect = parts[2] / parts[3];
    }
  }

  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
    
  if (!filePath.endsWith('.svg')) {
    aspect = info.width / info.height;
  }

  let inkPixels = 0;
  let totalAlpha = 0;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i+3];
    if (a > 5) {
      inkPixels++;
      totalAlpha += a;
    }
  }

  const inkRatio = inkPixels / (info.width * info.height);
  return { aspect, inkRatio };
}

async function run() {
  const results = [];
  for (const logo of logos) {
    const fullPath = path.join(imgDir, logo.file);
    if (!fs.existsSync(fullPath)) {
        console.error(`Missing: ${fullPath}`);
        continue;
    }
    const metrics = await analyseImage(fullPath);
    results.push({ label: logo.label, file: logo.file, ...metrics });
  }

  for (const r of results) {
    let h = Math.sqrt(TARGET_MASS / (r.aspect * r.inkRatio));
    let w = h * r.aspect;
    
    // Constraints for PDF header/logos
    if (w > 120) { w = 120; h = w / r.aspect; }
    if (h > 45) { h = 45; w = h * r.aspect; }

    console.log(
      `{ src: "${r.file}", alt: "${r.label} Logo", w: "${Math.round(w)}px", h: "${Math.round(h)}px" },`
    );
  }
}

run().catch(console.error);
