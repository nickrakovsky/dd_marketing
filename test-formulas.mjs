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

async function analyseImage(filePath) {
  const svgText = fs.readFileSync(filePath, 'utf-8');
  let aspect = 1;
  const vbMatch = svgText.match(/viewBox=["']([^"']+)["']/);
  if (vbMatch) {
    const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[3] > 0) aspect = parts[2] / parts[3];
  }

  let rW = 800;
  let rH = Math.round(800 / aspect);
  if (rH > 800) { rH = 800; rW = Math.round(800 * aspect); }
  
  const { data, info } = await sharp(filePath).resize(rW, rH).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    
  let inkPixels = 0, sumCx = 0, sumCy = 0, totalAlpha = 0;
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const a = data[(y * info.width + x) * 4 + 3];
      if (a > 5) {
        inkPixels++;
        sumCx += x * a; sumCy += y * a; totalAlpha += a;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const canvasArea = info.width * info.height;
  const inkRatio = inkPixels / canvasArea;
  const tightW = maxX - minX + 1;
  const tightH = maxY - minY + 1;
  const tightAspect = tightW / tightH;
  const cropRatio = (tightW * tightH) / canvasArea;

  return { aspect, inkRatio, tightAspect, cropRatio, cogX: (sumCx/totalAlpha)/info.width, cogY: (sumCy/totalAlpha)/info.height };
}

async function run() {
  const results = [];
  for (const logo of logos) results.push({ label: logo.label, file: logo.file, ...await analyseImage(path.join(imgDir, logo.file)) });

  console.log('--- NEW FORMULA: Area = TargetArea / (Density ^ 0.5) ---');
  const TARGET_AREA = 3800; 

  results.forEach(r => {
    // Density dampening: don't blow up sparse wordmarks infinitely
    let dampenedDensity = Math.pow(r.inkRatio, 0.6); 
    
    // Calculate required bounding box area
    let targetArea = TARGET_AREA / dampenedDensity;
    
    let h = Math.sqrt(targetArea / r.aspect);
    let w = h * r.aspect;
    
    // Limits
    if (w > 220 && r.label !== 'Columbia') { h = h * (220/w); w = 220; }
    if (h > 65) { w = w * (65/h); h = 65; }

    // Special allowance for Columbia because of its text ratio vs crown
    if (r.label === 'Columbia') {
        w = 260; 
        h = w / r.aspect;
    }

    console.log(`{ src: "${r.file}", alt: "${r.label} Logo", cls: "w-[${Math.round(w)}px] h-[${Math.round(h)}px] object-contain", pos: "${Math.round(r.cogX*100)}% ${Math.round(r.cogY*100)}%" },`);
  });
}
run();
