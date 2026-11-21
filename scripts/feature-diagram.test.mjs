import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { getDiagramMinWidth } from '../src/lib/feature-diagram.mjs';

test('uses the root viewBox with a nonzero origin rather than an arrow marker', () => {
  const svg = '<svg viewBox="4 4 936 94.2"><defs><marker viewBox="0 0 10 10" /></defs></svg>';
  assert.equal(getDiagramMinWidth(svg), 819);
});

test('accepts standard SVG coordinate separators and quoted attributes', () => {
  assert.equal(getDiagramMinWidth("<svg viewBox='-4, -4, 1e3, 200'></svg>"), 875);
  assert.equal(getDiagramMinWidth('<svg viewBox="0 0 1000 200"></svg>'), 875);
  assert.equal(getDiagramMinWidth('<svg viewBox="4\n4\n936\n94.2"></svg>'), 819);
});

test('invalid root viewBoxes fail instead of using a nested viewBox', () => {
  for (const box of ['', '0 0 0 100', '0 0 -10 100', '0 0 100 nope', '0 0 100', '0 0 Infinity 20']) {
    assert.throws(() => getDiagramMinWidth(`<svg viewBox="${box}"><marker viewBox="0 0 10 10" /></svg>`), /root SVG viewBox/);
  }
  assert.throws(() => getDiagramMinWidth('<svg><marker viewBox="0 0 10 10" /></svg>'), /root SVG viewBox/);
});

test('all committed workflow diagrams retain a readable label floor', () => {
  const directory = new URL('../src/assets/feature-diagrams/', import.meta.url);
  const files = fs.readdirSync(directory).filter(name => name.endsWith('.svg'));
  assert.equal(files.length, 12);
  for (const file of files) {
    const svg = fs.readFileSync(new URL(file, directory), 'utf8');
    const root = svg.match(/<svg\b[^>]*>/)[0];
    const width = Number(root.match(/viewBox="([^"]+)"/)[1].split(/\s+/)[2]);
    const floor = getDiagramMinWidth(svg);
    assert.ok(floor > 200, `${file} must not use the marker's width`);
    assert.ok(16 * floor / width >= 14, `${file} keeps 14px labels`);
  }
});
