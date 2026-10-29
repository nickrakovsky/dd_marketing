// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { comparisonCompetitors } from '../data/pages/comparison';
import { parseComparisonSelection } from './comparison-selection';

const allowedIds = comparisonCompetitors.map(competitor => competitor.id);
const parse = (search: string) => parseComparisonSelection(search, allowedIds);

describe('comparison link selection', () => {
  it('selects the requested pair in URL order', () => {
    expect(parse('?compare=opendock,c3-solutions')).toEqual(['opendock', 'c3-solutions']);
    expect(parse('?compare=c3-solutions,opendock')).toEqual(['c3-solutions', 'opendock']);
  });

  it('accepts one competitor and keeps unrelated tracking parameters out of the selection', () => {
    expect(parse('?utm_source=google&compare=goramp&utm_campaign=comparison')).toEqual(['goramp']);
  });

  it('ignores repeated IDs without spending a selection slot', () => {
    expect(parse('?compare=opendock,opendock,c3-solutions')).toEqual(['opendock', 'c3-solutions']);
    expect(parse('?compare=opendock,opendock')).toEqual(['opendock']);
  });

  it.each(['', '?utm_source=google', '?compare=', '?compare=,,', '?compare=unknown'])
  ('leaves the default comparison intact for absent/empty/invalid input: %s', search => {
    expect(parse(search)).toEqual([]);
  });

  it('rejects display text, markup, script URLs, prototype names and unknown vendor IDs', () => {
    expect(parse('?compare=%3Cscript%3Ealert(1)%3C%2Fscript%3E,javascript%3Aalert(1),constructor,__proto__,c3')).toEqual([]);
    expect(parse('?compare=Opendock,C3%20Solutions')).toEqual([]);
  });

  it('ignores malformed percent encoding without throwing or selecting arbitrary values', () => {
    expect(parse('?compare=%E0%A4%A,%25')).toEqual([]);
  });

  it('retains valid IDs after unknown entries and trims encoded whitespace', () => {
    expect(parse('?compare=unknown,%20opendock%20,,c3-solutions')).toEqual(['opendock', 'c3-solutions']);
  });

  it('caps the selection at the first two valid distinct competitors', () => {
    expect(parse('?compare=opendock,c3-solutions,goramp,conduit')).toEqual(['opendock', 'c3-solutions']);
  });

  it('keeps DataDocks out of the configurable competitor slots', () => {
    expect(allowedIds).not.toContain('datadocks');
    expect(parse('?compare=datadocks,opendock')).toEqual(['opendock']);
  });

  it('uses the first compare parameter when the URL repeats its key', () => {
    expect(parse('?compare=opendock&compare=goramp,c3-solutions')).toEqual(['opendock']);
  });
});
