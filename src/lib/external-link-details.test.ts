import { describe, expect, it } from 'vitest';
import { escapeLinkCardText, externalSourceContext, resolveExternalDetails } from './external-link-details';

function externalLink(label: string, href: string): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = href;
  link.textContent = label;
  link.dataset.smartlinkType = 'external';
  link.dataset.smartlinkHref = href;
  link.dataset.smartlinkTitle = 'Old fallback';
  return link;
}

describe('external source cards', () => {
  it('keeps a standalone source title separate from contextual anchor text', () => {
    const href = 'https://www.pymnts.com/news/b2b-payments/2026/the-new-procurement-question-isnt-cost-its-cash/';
    const link = externalLink('its June 2026 analysis of procurement and cash', href);
    Object.assign(link.dataset, {
      smartlinkManual: 'true',
      smartlinkTitle: 'The New Procurement Question Isn’t Cost. It’s Cash.',
      smartlinkSnippet: externalSourceContext(href),
    });
    resolveExternalDetails(link);
    resolveExternalDetails(link);
    expect(link.textContent).toBe('its June 2026 analysis of procurement and cash');
    expect(link.dataset.smartlinkTitle).toBe('The New Procurement Question Isn’t Cost. It’s Cash.');
    expect(link.dataset.smartlinkSnippet).toBe('Source: www.pymnts.com');
  });

  it.each([
    ['Sysco’s full-year fiscal 2026 results', 'https://investors.sysco.com/annual-reports-and-sec-filings/news-releases/2026/08-04-2026-130610546', 'investors.sysco.com'],
    ['2008 study of a Brazilian food company', 'https://www.emerald.com/ijlm/article-abstract/19/3/389/136369/Cost-to-serve-measurement-and-customer?redirectedFrom=fulltext', 'www.emerald.com'],
    ['October 2025 reporting on Sysco', 'https://m.investing.com/news/stock-market-news/food-distributor-sysco-keeps-annual-forecast-intact-as-economic-uncertainty-looms-4313620?ampMode=1', 'm.investing.com'],
  ])('uses a neutral hostname when %s has no standalone source title', (label, href, hostname) => {
    const link = externalLink(label, href);
    resolveExternalDetails(link);
    expect(link.dataset.smartlinkTitle).toBe(hostname);
    expect(link.dataset.smartlinkSnippet).toBe('');
    expect(link.textContent).toBe(label);
    expect(link.href).toBe(href);
  });

  it('produces the same metadata on repeated card and sheet resolution', () => {
    const link = externalLink('  Results\n  and outlook  ', 'https://investors.sysco.com/news-releases/2026/123');
    resolveExternalDetails(link);
    const metadata = { ...link.dataset };
    resolveExternalDetails(link);
    expect({ ...link.dataset }).toEqual(metadata);
    expect(link.dataset.smartlinkTitle).toBe('investors.sysco.com');
  });

  it.each([
    ['Explicit title', 'Explicit description'],
    ['Explicit title', ''],
    ['investors.sysco.com', 'Explicit description'],
  ])('preserves manual SmartLink metadata (%s / %s)', (title, snippet) => {
    const link = externalLink('Authored label', 'https://investors.sysco.com/');
    Object.assign(link.dataset, { smartlinkManual: 'true', smartlinkTitle: title, smartlinkSnippet: snippet });
    resolveExternalDetails(link);
    expect(link.dataset.smartlinkTitle).toBe(title);
    expect(link.dataset.smartlinkSnippet).toBe(snippet);
  });

  it('uses a complete hostname when a link has no label', () => {
    const link = externalLink('', 'https://m.investing.com/news/123');
    resolveExternalDetails(link);
    expect(link.dataset.smartlinkTitle).toBe('m.investing.com');
  });

  it('uses a neutral fallback without inventing metadata for an invalid URL', () => {
    const link = externalLink('Research report', 'not-a-url');
    resolveExternalDetails(link);
    expect(link.dataset.smartlinkTitle).toBe('External source');
    expect(link.dataset.smartlinkSnippet).toBe('');
  });

  it('reads encoded HTML as text and keeps markup and literal entities inert in cards', () => {
    const link = externalLink('', 'https://example.com/source');
    link.innerHTML = 'Sysco&#x20;&amp; research: &lt;img src=x onerror=alert(1)&gt; &amp;#x52;';
    link.dataset.smartlinkManual = 'true';
    link.dataset.smartlinkTitle = link.textContent || '';
    resolveExternalDetails(link);
    expect(link.dataset.smartlinkTitle).toBe('Sysco & research: <img src=x onerror=alert(1)> &#x52;');
    const card = document.createElement('div');
    card.innerHTML = `<h3>${escapeLinkCardText(link.dataset.smartlinkTitle!)}</h3>`;
    expect(card.textContent).toBe(link.dataset.smartlinkTitle);
    expect(card.querySelector('img')).toBeNull();
  });
});
