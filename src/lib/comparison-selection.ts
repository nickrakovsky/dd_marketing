/**
 * Read ?compare=opendock,c3-solutions without accepting arbitrary display text.
 * The first compare parameter owns the selection. Unknown/duplicate IDs are
 * ignored and at most two competitors are returned, in the requested order.
 * An empty result tells the caller to retain its default comparison.
 * DataDocks is a fixed column and must not appear in the competitor allowlist.
 */
export function parseComparisonSelection(search: string, allowedIds: readonly string[]): string[] {
  const requested = new URLSearchParams(search).get('compare');
  if (!requested) return [];

  const allowed = new Set(allowedIds);
  const selected: string[] = [];
  for (const value of requested.split(',')) {
    const id = value.trim();
    if (!allowed.has(id) || selected.includes(id)) continue;
    selected.push(id);
    if (selected.length === 2) break;
  }
  return selected;
}
