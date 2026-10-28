import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openSync } from 'fontkit';

const hero = JSON.parse(fs.readFileSync(new URL('../src/data/comparison-hero.json', import.meta.url), 'utf8'));
const fontPath = name => fileURLToPath(new URL(`../src/assets/fonts/${name}`, import.meta.url));
const faces = [
  {
    name: 'Bruta',
    original: 'BrutaGlbCompressed-ExtraBold.woff2',
    subset: 'Comparison-Bruta-Hero.woff2',
    text: hero.heading.join(' ').toUpperCase(),
    samples: hero.heading.map(line => line.toUpperCase()),
  },
  {
    name: 'Recoleta',
    original: 'Recoleta-Regular-Core.woff2',
    subset: 'Comparison-Recoleta-Hero.woff2',
    text: hero.intro,
    samples: [hero.intro],
  },
];

for (const face of faces) {
  const original = openSync(fontPath(face.original));
  const subset = openSync(fontPath(face.subset));

  test(`${face.name} hero subset covers the current copy exactly`, () => {
    const required = [...new Set(Array.from(face.text, character => character.codePointAt(0)))].sort((a, b) => a - b);
    // Fontkit exposes the format-4 U+FFFF terminator, which maps to .notdef.
    const covered = subset.characterSet.filter(codepoint => subset.glyphForCodePoint(codepoint).id !== 0);
    assert.deepEqual(covered.sort((a, b) => a - b), required);
    assert.ok(required.every(codepoint => subset.hasGlyphForCodePoint(codepoint)));
  });

  test(`${face.name} hero subset preserves source metrics and shaping`, () => {
    for (const metric of ['unitsPerEm', 'ascent', 'descent', 'lineGap', 'capHeight', 'xHeight']) {
      assert.equal(subset[metric], original[metric], metric);
    }
    for (const text of [face.text, ...face.samples]) {
      const expected = original.layout(text);
      const actual = subset.layout(text);
      assert.equal(actual.glyphs.length, expected.glyphs.length, text);
      assert.deepEqual(actual.positions, expected.positions, text);
    }
  });
}
