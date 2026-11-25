import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import matter from 'gray-matter';
import { parse } from 'parse5';

const featureDirectory = new URL('../src/content/features/', import.meta.url);
const features = readdirSync(featureDirectory)
  .filter(name => name.endsWith('.mdx'))
  .map(name => ({
    path: `/datadocks-features/${name.replace(/\.mdx$/, '')}`,
    ...matter(readFileSync(new URL(name, featureDirectory), 'utf8')).data,
  }));

function findAll(node, predicate) {
  return [
    ...(predicate(node) ? [node] : []),
    ...(node.childNodes || []).flatMap(child => findAll(child, predicate)),
  ];
}

const attr = (node, name) => node.attrs?.find(attribute => attribute.name === name)?.value;
const text = node => node.nodeName === '#text'
  ? node.value
  : (node.childNodes || []).map(text).join('');

const pages = [
  ...features,
  {
    path: '/datadocks-vs-opendock',
    title: 'DataDocks vs OpenDock: Dock Scheduling Software Comparison',
  },
];

for (const { path, title, pubDate } of pages) {
  test(`server-rendered Article schema: ${path}`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const document = parse(await response.text());
    const head = findAll(document, node => node.tagName === 'head')[0];
    const graphs = findAll(head, node => node.tagName === 'script'
      && attr(node, 'type') === 'application/ld+json')
      .flatMap(node => JSON.parse(text(node))['@graph']);
    const articles = graphs.filter(node => ['Article', 'BlogPosting', 'NewsArticle'].includes(node['@type']));
    expect(articles).toHaveLength(1);
    const article = articles[0];
    const canonical = attr(findAll(head, node => node.tagName === 'link'
      && attr(node, 'rel') === 'canonical')[0], 'href');
    expect(canonical).toBe(`https://datadocks.com${path}`);
    const description = attr(findAll(head, node => node.tagName === 'meta'
      && attr(node, 'name') === 'description')[0], 'content');
    const image = attr(findAll(head, node => node.tagName === 'meta'
      && attr(node, 'property') === 'og:image')[0], 'content');
    expect(article).toMatchObject({
      '@type': 'Article',
      '@id': `${canonical}#article`,
      mainEntityOfPage: { '@id': canonical },
      headline: title,
      description,
      image,
      author: { '@id': 'https://datadocks.com/#organization' },
      publisher: { '@id': 'https://datadocks.com/#organization' },
    });
    expect(graphs.find(node => node['@id'] === canonical)?.['@type']).toBe('ItemPage');
    expect(graphs.some(node => node['@type'] === 'BreadcrumbList')).toBe(true);
    expect(graphs.some(node => node['@id'] === article.author['@id']
      && node['@type'] === 'Organization')).toBe(true);
    if (pubDate) {
      expect(article.datePublished).toBe(new Date(pubDate).toISOString());
    } else {
      expect(article).not.toHaveProperty('datePublished');
    }
    if (path.startsWith('/datadocks-features/')) {
      expect(text(findAll(document, node => node.tagName === 'h1')[0]).trim()).toBe(title);
    } else {
      expect(graphs.find(node => node['@type'] === 'FAQPage')?.mainEntity).toHaveLength(6);
    }
    expect(article).not.toHaveProperty('dateModified');
  });
}
