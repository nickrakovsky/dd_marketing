import { describe, expect, it } from 'vitest';
import { legacyRedirectPath } from './legacy-redirects';

describe('legacy marketing aliases', () => {
  it.each([
    ['/Posts', '/posts'], ['/Posts/', '/posts'], ['/Posts.html', '/posts'],
    ['/Datadocks', '/'], ['/Datadocks/', '/'], ['/Datadocks.html', '/'],
    ['/posts/comparison/', '/comparison'],
    ['/posts/datadocks-vs-opendock', '/datadocks-vs-opendock'],
  ])('maps %s to %s', (source, destination) => {
    expect(legacyRedirectPath(source)).toBe(destination);
  });

  it.each([
    '/posts', '/', '/Datadocks/unknown', '/Posts/unknown',
    '/wireframes/tabbed-hub', '/_astro/Posts.svg', '/VIDEOS/AbC',
    '/constructor', '/__proto__', '/posts/comparison-other',
  ])('does not redirect unrelated or private URL %s', (source) => {
    expect(legacyRedirectPath(source)).toBeUndefined();
  });
});
