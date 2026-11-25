import { describe, expect, it } from 'vitest';
import { createReader } from '@keystatic/core/reader';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import config from '../../keystatic.config';

function componentKeys(source: string, variable: string) {
  const file = ts.createSourceFile('components.ts', source, ts.ScriptTarget.Latest, true);
  const keys = new Set<string>();
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === variable
      && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      for (const property of node.initializer.properties) {
        if (property.name) keys.add(property.name.getText(file).replace(/^['"]|['"]$/g, ''));
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return keys;
}

const slugs = [
  'how-to-get-around-limitations-warehouse-management-system',
  'retail-case-studies',
  'dwell-time-in-trucking',
  'warehouse-receiving-process',
  'reduced-headcount',
  'logistics-coordinator-career-path',
  'what-is-a-supply-chain-center-of-excellence',
];

describe('approved image refresh posts in the content editor', () => {
  const reader = createReader(process.cwd(), config);
  const cms = componentKeys(readFileSync('keystatic.config.ts', 'utf8'), 'mdxComponents');
  const articleSource = readFileSync('src/components/pages/ArticlePage.astro', 'utf8');
  const blog = componentKeys(articleSource.split('---')[1], 'blogComponents');
  const renderMaps = [...articleSource.matchAll(/<Content components=\{(\{[^}]+\})\}/g)].map(match => {
    const keys = componentKeys(`const components = ${match[1]}`, 'components');
    if (match[1].includes('...blogComponents')) {
      for (const key of blog) keys.add(key);
    }
    return keys;
  });

  it.each(slugs)('loads %s with its registered rich content', async slug => {
    const post = await reader.collections.posts.read(slug);
    expect(post).not.toBeNull();
    expect(post?.postType.discriminant).toBe('article');
    const content = await post?.postType.value.content();
    expect(content).toBeTruthy();
    expect(content).not.toMatch(/^(?:import|export)\s/m);
    expect(renderMaps).toHaveLength(2);
    for (const [, component] of String(content).matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)) {
      expect(cms.has(component), `${component} must be editable in ${slug}`).toBe(true);
      for (const renderMap of renderMaps) {
        expect(renderMap.has(component), `${component} must render in both article maps`).toBe(true);
      }
    }
  });
});
