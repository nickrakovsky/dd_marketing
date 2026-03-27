const ORIGIN = "https://nickrakovsky.github.io";

// Vanity URL mappings
const VANITY_MAP = {
  "capacity": "increase-capacity",
  "carriers": "delight-carriers",
  "visibility": "see-everything",
  "accuracy": "digitize-operations"
};

// Real benefit page slugs that exist in Astro
const REAL_BENEFITS = new Set([
  "increase-capacity",
  "delight-carriers",
  "see-everything",
  "digitize-operations"
]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // Only apply to main marketing domain
    const isMainDomain = hostname === 'datadocks.com' || hostname === 'www.datadocks.com';

    // Proxy and cache Webflow CSS
    if (isMainDomain && url.pathname.startsWith('/webflow-cache/')) {
      const cdnPath = url.pathname.replace('/webflow-cache/', '');
      const cdnUrl = `https://cdn.prod.website-files.com/${cdnPath}`;
      return fetch(cdnUrl, {
        cf: { cacheTtl: 31536000, cacheEverything: true }
      });
    }

    // Merge sitemaps
    if (isMainDomain && url.pathname === "/sitemap.xml") {
      try {
        const [webflowSitemap, astroSitemap] = await Promise.all([
          fetch(request).then(r => r.text()),
          fetch(`${ORIGIN}/dd_marketing/sitemap-0.xml`).then(r => r.text())
        ]);

        // Extract URLs from Astro sitemap
        const astroUrls = astroSitemap.match(/<loc>([^<]+)<\/loc>/g) || [];
        const astroUrlSet = new Set(
          astroUrls.map(url => url.replace(/<\/?loc>/g, '').trim())
        );

        // Merge into Webflow sitemap
        let merged = webflowSitemap.replace(
          '</urlset>',
          astroUrls.map(url => `  <url>\n    ${url}\n  </url>`).join('\n') + '\n</urlset>'
        );

        return new Response(merged, {
          headers: { 'Content-Type': 'application/xml' }
        });
      } catch (e) {
        return fetch(request);
      }
    }

    // Handle vanity benefit pages and Astro pages
    if (isMainDomain) {
      const match = url.pathname.match(/^\/benefits\/([^/]+)\/?$/);
      if (match) {
        const slug = match[1];
        const realSlug = VANITY_MAP[slug] || (REAL_BENEFITS.has(slug) ? slug : null);

        if (realSlug) {
          const astroRequest = new Request(
            `${ORIGIN}/dd_marketing/benefits/${realSlug}/index.html`,
            request
          );
          const response = await fetch(astroRequest);
          return rewriteSEO(response);
        }
      }

      // Proxy other dd_marketing pages
      if (url.pathname.startsWith("/dd_marketing/")) {
        const response = await fetch(ORIGIN + url.pathname, request);
        return rewriteSEO(response);
      }

      // Webflow pages - rewrite CSS and add hero image preload
      const response = await fetch(request);
      return rewriteWebflowCSS(response);
    }

    // Subdomains pass through unchanged
    return fetch(request);
  }
};

async function rewriteSEO(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  let html = await response.text();

  // Remove all GitHub references
  html = html.replace(/https:\/\/nickrakovsky\.github\.io(\/dd_marketing)?/g, "https://datadocks.com");
  html = html.replace(/https:\/\/datadocks\.com\/dd_marketing\//g, "https://datadocks.com/");

  // Inline Astro CSS files to eliminate render blocking
  const cssLinks = html.match(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+\/_astro\/[^"]+\.css)"[^>]*>/g);
  if (cssLinks) {
    for (const linkTag of cssLinks) {
      const cssUrlMatch = linkTag.match(/href="([^"]+)"/);
      if (cssUrlMatch) {
        const cssUrl = cssUrlMatch[1];
        const fullCssUrl = cssUrl.startsWith('http') ? cssUrl : `https://datadocks.com${cssUrl}`;

        try {
          const cssResponse = await fetch(fullCssUrl, {
            cf: { cacheTtl: 31536000, cacheEverything: true }
          });
          const cssContent = await cssResponse.text();

          html = html.replace(linkTag, `<style>${cssContent}</style>`);
        } catch (e) {
          console.error('Failed to fetch Astro CSS:', e);
        }
      }
    }
  }

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

async function rewriteWebflowCSS(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  let html = await response.text();

  // Find and inline CSS
  const cssMatch = html.match(/<link[^>]*href="(https:\/\/cdn\.prod\.website-files\.com\/[^"']+\.css)"[^>]*>/);
  if (cssMatch) {
    const cssUrl = cssMatch[1];
    const linkTag = cssMatch[0];

    try {
      // Fetch the CSS content
      const cssResponse = await fetch(cssUrl, {
        cf: { cacheTtl: 31536000, cacheEverything: true }
      });
      const cssContent = await cssResponse.text();

      // Replace the link tag with inline style
      html = html.replace(
        linkTag,
        `<style>${cssContent}</style>`
      );
    } catch (e) {
      // If fetching fails, fall back to original link tag
      console.error('Failed to fetch CSS:', e);
    }
  }

  // Find hero image and add preload + fetchpriority
  const heroMatch = html.match(/class="image-12"[^>]*src="([^"]+)"/);
  if (heroMatch) {
    const heroImageUrl = heroMatch[1];

    // Add hero image preload in head
    html = html.replace(
      '</title>',
      `</title>\n    <link rel="preload" href="${heroImageUrl}" as="image" fetchpriority="high">`
    );

    // Add fetchpriority="high" to the img tag itself
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
    headers: response.headers
  });
}
