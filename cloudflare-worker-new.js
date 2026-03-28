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
  "/privacy-policy-datadocks",
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

    // Redirect /datadocks-vs/opendock to /datadocks-vs-opendock
    if (url.pathname === "/datadocks-vs/opendock" || url.pathname === "/datadocks-vs/opendock/") {
      return Response.redirect("https://datadocks.com/datadocks-vs-opendock", 301);
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

  // Strip broken obfuscated Webflow tracking script (returns 404)
  html = html.replace(/<script[^>]*src="\/g0lnomhfn3mg[^"]*"[^>]*><\/script>/g, '');

  // Fix navigation links: add trailing slashes for Astro-served pages
  // Benefits pages, /posts, and blog post links need trailing slashes
  html = html.replace(/href="(\/benefits\/[^"/]+)"/g, 'href="$1/"');
  html = html.replace(/href="(\/posts)"/g, 'href="$1/"');
  html = html.replace(/href="(\/posts\/[^"/]+)"/g, 'href="$1/"');
  // Fix www.datadocks.com links to datadocks.com
  html = html.replace(/href="https:\/\/www\.datadocks\.com\/?"/g, 'href="https://datadocks.com/"');

  // Inject og:image for pages missing it (feature pages, integration sub-pages)
  if (!html.includes('og:image')) {
    html = html.replace(
      '</title>',
      '</title>\n    <meta property="og:image" content="https://datadocks.com/images/OG-Cover.png" />'
    );
  }

  const headers = new Headers(response.headers);
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://fast.bentonow.com https://cdn.prod.website-files.com https://d3e54v103j8qbb.cloudfront.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.prod.website-files.com https://cdnjs.cloudflare.com; img-src 'self' data: https://cdn.prod.website-files.com https://img.youtube.com https://*.google-analytics.com https://*.googletagmanager.com; font-src 'self' https://fonts.gstatic.com https://cdn.prod.website-files.com; connect-src 'self' https://*.google-analytics.com https://*.googletagmanager.com https://fast.bentonow.com https://region1.google-analytics.com; frame-src https://www.youtube.com https://calendly.com; media-src 'self' https://www.youtube.com; object-src 'none'; base-uri 'self'; form-action 'self' https://calendly.com");

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}