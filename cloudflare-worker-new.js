// Cloudflare Worker: Proxy unconverted pages to Webflow
// Astro on Cloudflare Pages is the primary origin.
// This worker intercepts Webflow-only paths and proxies them transparently.

const WEBFLOW_ORIGIN = "https://datadocks-staging.webflow.io";

// Paths that should be proxied to Webflow
const WEBFLOW_PATHS = [
  "/datadocks-features/",
  "/integrations/",
  "/integrations",
  "/datadocks-vs-opendock",
  "/datadocks-vs/",
  "/support",
];

function shouldProxyToWebflow(pathname) {
  return WEBFLOW_PATHS.some(path => {
    if (path.endsWith("/")) {
      return pathname.startsWith(path) || pathname === path.slice(0, -1);
    }
    return pathname === path || pathname === path + "/";
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Only apply to main domain
    const isMainDomain = url.hostname === "datadocks.com" || url.hostname === "www.datadocks.com";
    if (!isMainDomain) {
      return fetch(request);
    }

    // Redirect www to non-www
    if (url.hostname === "www.datadocks.com") {
      url.hostname = "datadocks.com";
      return Response.redirect(url.toString(), 301);
    }

    // Proxy Webflow paths
    if (shouldProxyToWebflow(url.pathname)) {
      const webflowUrl = new URL(url.pathname + url.search, WEBFLOW_ORIGIN);
      const webflowRequest = new Request(webflowUrl, {
        method: request.method,
        headers: request.headers,
      });

      const response = await fetch(webflowRequest);
      return rewriteWebflowHTML(response, url.pathname);
    }

    // Everything else falls through to Cloudflare Pages (Astro)
    return fetch(request);
  },
};

async function rewriteWebflowHTML(response, pathname) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  let html = await response.text();

  // Replace Webflow staging URL with production URL (with and without protocol)
  html = html.replace(/https:\/\/datadocks-staging\.webflow\.io/g, "https://datadocks.com");
  html = html.replace(/datadocks-staging\.webflow\.io/g, "datadocks.com");

  // Inject canonical tag if missing
  if (!html.includes('rel="canonical"')) {
    const canonicalUrl = `https://datadocks.com${pathname}`;
    html = html.replace(
      '</title>',
      `</title>\n    <link rel="canonical" href="${canonicalUrl}" />`
    );
  }

  // Inline Webflow CSS to eliminate render blocking
  const cssMatch = html.match(/<link[^>]*href="(https:\/\/cdn\.prod\.website-files\.com\/[^"']+\.css)"[^>]*>/);
  if (cssMatch) {
    try {
      const cssResponse = await fetch(cssMatch[1], {
        cf: { cacheTtl: 31536000, cacheEverything: true }
      });
      const cssContent = await cssResponse.text();
      html = html.replace(cssMatch[0], `<style>${cssContent}</style>`);
    } catch (e) {
      console.error('Failed to inline Webflow CSS:', e);
    }
  }

  // Preload hero image if present
  const heroMatch = html.match(/class="image-12"[^>]*src="([^"]+)"/);
  if (heroMatch) {
    html = html.replace(
      '</title>',
      `</title>\n    <link rel="preload" href="${heroMatch[1]}" as="image" fetchpriority="high">`
    );
    html = html.replace(
      /(<img[^>]*class="image-12"[^>]*)(>)/,
      '$1 fetchpriority="high"$2'
    );
  }

  // Defer jQuery
  html = html.replace(
    /<script src="https:\/\/d3e54v103j8qbb\.cloudfront\.net\/js\/jquery-([^"]+)" type="text\/javascript"/g,
    '<script defer src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-$1" type="text/javascript"'
  );

  // Defer Webflow JS
  html = html.replace(
    /<script src="https:\/\/cdn\.prod\.website-files\.com\/([^"]+)\/js\/webflow\.([^"]+)" type="text\/javascript"/g,
    '<script defer src="https://cdn.prod.website-files.com/$1/js/webflow.$2" type="text/javascript"'
  );

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}