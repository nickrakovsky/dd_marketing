/**
 * analyse-logos.mjs 
 * 
 * Uses `sharp` to rasterize SVGs and analyse TRUE pixel-perfect ink density.
 * Solves the bounding-box overlap flaw by counting exactly how many 
 * non-transparent pixels exist in the rendered image.
 * 
 * Then applies a mathematical normalisation formula:
 * Area * inkRatio = Constant Optical Mass
 * 
 * Which solves for exact W and H constraints to make all logos visually equal.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imgDir = path.join(__dirname, 'public', 'images');

const logos = [
  { file: 'Layer_1-2.svg',                label: 'LG' },
  { file: 'shipmonk_.svg',                label: 'ShipMonk' },
  { file: 'Layer_2-2.svg',                label: 'GSK' },
  { file: 'Group-1.svg',                  label: 'HelloFresh' },
  { file: 'Group.svg',                    label: 'StitchFix' },
  { file: 'Pepsi_2023.svg',               label: 'Pepsi' },
  { file: 'Samsung.svg',                  label: 'Samsung' },
  { file: 'Toyota_Logo.svg',              label: 'Toyota' },
  { file: 'columbia-wide.svg',            label: 'Columbia' },
];

// Target optical mass (total non-transparent pixels per logo at final display size)
// Tweaking this scales the entire carousel up or down.
const TARGET_MASS = 2500; 

async function analyseImage(filePath) {
  // Try to parse aspect ratio from raw SVG text for best precision
  const svgText = fs.readFileSync(filePath, 'utf-8');
  let aspect = 1;
  const vbMatch = svgText.match(/viewBox=["']([^"']+)["']/);
  if (vbMatch) {
    const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[3] > 0) aspect = parts[2] / parts[3];
  }

  // Render to a clean 800px max bounds for precision alpha sampling
  let rW = 800;
  let rH = Math.round(800 / aspect);
  if (rH > 800) {
    rH = 800;
    rW = Math.round(800 * aspect);
  }
  
  const { data, info } = await sharp(filePath)
    .resize(rW, rH)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
    
  let inkPixels = 0;
  let sumCx = 0;
  let sumCy = 0;
  let totalAlpha = 0;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 4;
      const a = data[idx+3]; // Alpha channel
      if (a > 5) {
        inkPixels++;
        sumCx += x * a;
        sumCy += y * a;
        totalAlpha += a;
      }
    }
  }

  const canvasArea = info.width * info.height;
  // TRUE optical density = filled pixels / total pixels
  const inkRatio = inkPixels / canvasArea;
  
  const cogX = totalAlpha > 0 ? (sumCx / totalAlpha) / info.width : 0.5;
  const cogY = totalAlpha > 0 ? (sumCy / totalAlpha) / info.height : 0.5;

  return { aspect, inkRatio, cogX, cogY };
}

async function run() {
  const results = [];
  for (const logo of logos) {
    const fullPath = path.join(imgDir, logo.file);
    const metrics = await analyseImage(fullPath);
    results.push({ label: logo.label, file: logo.file, ...metrics });
  }

  console.log('\n=== REAL PIXEL OPTICAL DENSITY ===\n');
  const hdr = ['Label','Aspect','True_ink','cogX','cogY'];
  console.log(hdr.map(h=>h.padEnd(12)).join('') + 'File');
  console.log('-'.repeat(80));
  
  for (const r of results) {
    console.log(
      r.label.padEnd(12) +
      String(r.aspect.toFixed(2)).padEnd(12) +
      String(r.inkRatio.toFixed(3)).padEnd(12) +
      String(r.cogX.toFixed(3)).padEnd(12) +
      String(r.cogY.toFixed(3)).padEnd(12) +
      r.file
    );
  }

  console.log('\n=== MATHEMATICALLY NORMALIZED CSS DIMENSIONS ===\n');
  console.log('Algorithm: Visual Mass = Width × Height × InkDensity');
  console.log(`Targeting Mass = ${TARGET_MASS} for all logos.\n`);
  
  for (const r of results) {
    // Math: W = H * Aspect
    // (H * Aspect) * H * InkDensity = TargetMass
    // H² = TargetMass / (Aspect * InkDensity)
    // H = sqrt(TargetMass / (Aspect * InkDensity))
    
    let h = Math.sqrt(TARGET_MASS / (r.aspect * r.inkRatio));
    let w = h * r.aspect;
    
    // Bound sanity checks (don't let things get infinitely tall or wide)
    if (w > 280) { w = 280; h = w / r.aspect; }
    if (h > 90) { h = 90; w = h * r.aspect; }
    if (w < 60) { w = 60; h = w / r.aspect; }

    const posX = Math.round(r.cogX * 100);
    const posY = Math.round(r.cogY * 100);
    
    console.log(
      `{ src: "${r.file}", alt: "${r.label} Logo", cls: "w-[${Math.round(w)}px] h-[${Math.round(h)}px] object-contain", pos: "${posX}% ${posY}%" },`
    );
  }
}

run().catch(console.error);
