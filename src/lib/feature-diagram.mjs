// Mermaid renders workflow labels at 16 SVG units. Preserve at least 14 CSS
// pixels of text, allowing the existing container to scroll when necessary.
export function getDiagramMinWidth(svg) {
  const root = svg.match(/<svg\b[^>]*>/i)?.[0];
  const value = root?.match(/\bviewBox\s*=\s*(["'])([^"']*)\1/i)?.[2];
  const box = value?.trim().split(/[\s,]+/).map(Number);
  if (!box || box.length !== 4 || !box.every(Number.isFinite) || box[2] <= 0 || box[3] <= 0) {
    throw new Error('Feature diagram requires a valid root SVG viewBox.');
  }
  return Math.ceil(box[2] * 14 / 16);
}
