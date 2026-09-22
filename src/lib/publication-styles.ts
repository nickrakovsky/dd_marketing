/** Replaced with build-only sample results; source and development need no map. */
const serialized: string = '__PUBLICATION_CRITICAL_CSS__';
const criticalByPath: Record<string, string> = serialized.startsWith('{') ? JSON.parse(serialized) : {};

export async function withPublicationStyles(response: Response, pathname: string): Promise<Response> {
  const css = criticalByPath[pathname.toLowerCase()];
  if (!css || response.status !== 200 || !response.headers.get('Content-Type')?.includes('text/html')) return response;

  let inserted = false;
  const html = (await response.text()).replace(/<link\b[^>]*rel="stylesheet"[^>]*href="\/_astro\/[^"<>]+\.css"[^>]*>/g, link => {
    const critical = inserted ? '' : `<style data-publication-critical>${css}</style>`;
    inserted = true;
    return `${critical}${link.replace('rel="stylesheet"', 'rel="stylesheet" media="print" onload="this.media=\'all\'"')}<noscript>${link}</noscript>`;
  });
  const headers = new Headers(response.headers);
  headers.delete('Content-Length');
  headers.delete('ETag');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
