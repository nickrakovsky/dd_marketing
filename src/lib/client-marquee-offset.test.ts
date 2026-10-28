import { describe, expect, it } from 'vitest';
import { wrapClientOffset } from './client-marquee-offset';

describe('customer logo carousel wrapping', () => {
  it('keeps advancing through many complete cycles without reaching the track end', () => {
    const width = 1778;
    let offset = -2 * width;
    for (let frame = 0; frame < 120000; frame++) {
      const previous = offset;
      offset = wrapClientOffset(offset - .5, width);
      expect(offset).toBeGreaterThan(-3 * width);
      expect(offset).toBeLessThanOrEqual(-2 * width);
      expect([-.5, width - .5]).toContain(offset - previous);
    }
  });
  it('preserves the visible point after a large drag in either direction', () => {
    for (const drag of [-100000, -4000, 4000, 100000]) {
      const position = -3600 + drag;
      const wrapped = wrapClientOffset(position, 1778);
      expect(Math.abs((wrapped - position) % 1778)).toBe(0);
      expect(wrapped).toBeGreaterThan(-3 * 1778);
      expect(wrapped).toBeLessThanOrEqual(-2 * 1778);
    }
  });
  it('waits for the initial layout measurement', () => {
    expect(wrapClientOffset(-300, 0)).toBe(-300);
  });
});
