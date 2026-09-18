import { afterEach, describe, expect, it, vi } from 'vitest';
import { filterPublished, isPublished } from './content-status';

const firstPublication = new Date('2026-09-17T06:30:00-08:00');

afterEach(() => {
  vi.useRealTimers();
});

describe('scheduled publication', () => {
  it('publishes exactly at the timestamp, including the fixed PST offset', () => {
    expect(isPublished(firstPublication, new Date('2026-09-17T14:29:59.999Z'))).toBe(false);
    expect(isPublished(firstPublication, new Date('2026-09-17T14:30:00.000Z'))).toBe(true);
    expect(isPublished(firstPublication, new Date('2026-09-17T14:30:00.001Z'))).toBe(true);
    expect(isPublished('2026-09-17T06:30:00-08:00', firstPublication)).toBe(true);
  });

  it('uses the real publication cutoff by default, even in development', () => {
    vi.useFakeTimers();
    vi.setSystemTime('2026-09-17T14:29:59.999Z');
    expect(isPublished(firstPublication)).toBe(false);
    vi.advanceTimersByTime(1);
    expect(isPublished(firstPublication)).toBe(true);
  });

  it('lets a scoped preview include the final post without changing ordinary results', () => {
    vi.useFakeTimers();
    vi.setSystemTime(firstPublication);
    const finalPublication = '2026-10-07T06:30:00-08:00';
    expect(isPublished(finalPublication)).toBe(false);
    expect(isPublished(finalPublication, new Date('2026-10-08T00:00:00Z'))).toBe(true);
    expect(isPublished(finalPublication)).toBe(false);
  });

  it.each(['', 'not-a-date', new Date('invalid')])('excludes invalid publication dates: %s', date => {
    expect(isPublished(date, firstPublication)).toBe(false);
  });

  it('preserves missing optional dates but fails closed for an invalid cutoff', () => {
    expect(isPublished(undefined, firstPublication)).toBe(true);
    expect(isPublished(null, firstPublication)).toBe(true);
    expect(isPublished(firstPublication, new Date('invalid'))).toBe(false);
    expect(isPublished(undefined, new Date('invalid'))).toBe(false);
  });

  it('filters with one cutoff, preserving input order, object identity, and source dates', () => {
    const existing = Object.freeze({ data: Object.freeze({ pubDate: '2026-09-01T14:30:00Z' }) });
    const due = Object.freeze({ data: Object.freeze({ pubDate: firstPublication }) });
    const future = Object.freeze({ data: Object.freeze({ pubDate: '2026-09-18T14:30:00Z' }) });
    const invalid = Object.freeze({ data: Object.freeze({ pubDate: 'invalid' }) });
    const optional = Object.freeze({ data: Object.freeze({}) });
    const items = Object.freeze([future, due, invalid, existing, optional]);
    const result = filterPublished(items, firstPublication);

    expect(result).toEqual([due, existing, optional]);
    expect(result[0]).toBe(due);
    expect(items).toEqual([future, due, invalid, existing, optional]);
    expect(result).not.toBe(items);
    expect(firstPublication.toISOString()).toBe('2026-09-17T14:30:00.000Z');
  });

  it('filters collections against the current time when no preview cutoff is supplied', () => {
    vi.useFakeTimers();
    vi.setSystemTime(firstPublication);
    const due = { data: { pubDate: firstPublication } };
    const future = { data: { pubDate: '2026-09-18T14:30:00Z' } };
    expect(filterPublished([due, future])).toEqual([due]);
  });
});
