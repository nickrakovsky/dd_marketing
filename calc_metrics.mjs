import * as fontkit from 'fontkit';

function getAverageAdvanceWidth(font) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let totalWidth = 0;
  let count = 0;
  for (let i = 0; i < chars.length; i++) {
    const glyph = font.glyphForCodePoint(chars.charCodeAt(i));
    if (glyph && glyph.advanceWidth) {
      totalWidth += glyph.advanceWidth;
      count++;
    }
  }
  return totalWidth / count;
}

const brandFont = fontkit.openSync('src/assets/fonts/BrutaGlbCompressed-ExtraBold.woff2');
const fallbackFont = fontkit.openSync('C:/Windows/Fonts/impact.ttf');

const brandAvgWidth = getAverageAdvanceWidth(brandFont) / brandFont.unitsPerEm;
const fallbackAvgWidth = getAverageAdvanceWidth(fallbackFont) / fallbackFont.unitsPerEm;

const sizeAdjust = brandAvgWidth / fallbackAvgWidth;

const ascentOverride = (brandFont.ascent / brandFont.unitsPerEm) / sizeAdjust;
const descentOverride = Math.abs(brandFont.descent / brandFont.unitsPerEm) / sizeAdjust; // descent override is a positive percentage
const lineGapOverride = (brandFont.lineGap / brandFont.unitsPerEm) / sizeAdjust;

console.log(`size-adjust: ${(sizeAdjust * 100).toFixed(4)}%`);
console.log(`ascent-override: ${(ascentOverride * 100).toFixed(4)}%`);
console.log(`descent-override: ${(descentOverride * 100).toFixed(4)}%`);
console.log(`line-gap-override: ${(lineGapOverride * 100).toFixed(4)}%`);
