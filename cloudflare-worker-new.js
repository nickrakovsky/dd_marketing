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

    // Redirect /datadocks-vs/opendock to /datadocks-vs-opendock/
    if (url.pathname === "/datadocks-vs/opendock" || url.pathname === "/datadocks-vs/opendock/") {
      return Response.redirect("https://datadocks.com/datadocks-vs-opendock/", 301);
    }

    // Enforce trailing slashes on Webflow paths (match Astro trailingSlash: 'always')
    if (shouldProxyToWebflow(url.pathname) && !url.pathname.endsWith("/")) {
      return Response.redirect(`https://datadocks.com${url.pathname}/${url.search}`, 308);
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

  // Fix or inject canonical tag to match Astro's trailingSlash: 'always'
  const canonicalUrl = `https://datadocks.com${pathname.endsWith('/') ? pathname : pathname + '/'}`;
  if (/<link[^>]*rel\s*=\s*["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(
      /<link[^>]*rel\s*=\s*["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${canonicalUrl}" />`
    );
  } else {
    // Inject after <head> if no </title> found (some Webflow pages have unusual structure)
    if (html.includes('</title>')) {
      html = html.replace(
        '</title>',
        `</title>\n    <link rel="canonical" href="${canonicalUrl}" />`
      );
    } else {
      html = html.replace(
        /<head[^>]*>/i,
        `$&\n    <link rel="canonical" href="${canonicalUrl}" />`
      );
    }
  }

  // Strip ALL Webflow JSON-LD schema (conflicting Organization, SoftwareApplication, etc.)
  // and inject canonical schema that matches our Astro source of truth
  html = html.replace(/<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(
    '</head>',
    `<script type="application/ld+json">${JSON.stringify(getCanonicalSchema(canonicalUrl, pathname))}</script>\n</head>`
  );

  // Fix or inject og:url to match canonical
  if (/<meta[^>]*property\s*=\s*["']og:url["'][^>]*>/i.test(html)) {
    html = html.replace(
      /<meta[^>]*property\s*=\s*["']og:url["'][^>]*>/i,
      `<meta property="og:url" content="${canonicalUrl}" />`
    );
  } else {
    html = html.replace(
      '</title>',
      `</title>\n    <meta property="og:url" content="${canonicalUrl}" />`
    );
  }

  // Inject missing OG tags (og:title, og:type, og:description, og:site_name)
  if (!/<meta[^>]*property\s*=\s*["']og:title["']/i.test(html)) {
    html = html.replace(
      '</title>',
      `</title>\n    <meta property="og:title" content="${pageTitle}" />`
    );
  }
  if (!/<meta[^>]*property\s*=\s*["']og:type["']/i.test(html)) {
    html = html.replace(
      '</title>',
      `</title>\n    <meta property="og:type" content="website" />`
    );
  }
  if (pageDescription && !/<meta[^>]*property\s*=\s*["']og:description["']/i.test(html)) {
    html = html.replace(
      '</title>',
      `</title>\n    <meta property="og:description" content="${pageDescription}" />`
    );
  }
  if (!/<meta[^>]*property\s*=\s*["']og:site_name["']/i.test(html)) {
    html = html.replace(
      '</title>',
      `</title>\n    <meta property="og:site_name" content="DataDocks" />`
    );
  }

  // Inject Twitter card meta tags if missing
  if (!/<meta[^>]*(?:name|property)\s*=\s*["']twitter:card["']/i.test(html)) {
    const twitterTags = `
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${canonicalUrl}" />
    <meta property="twitter:title" content="${pageTitle}" />
    ${pageDescription ? `<meta property="twitter:description" content="${pageDescription}" />` : ''}
    <meta property="twitter:image" content="https://datadocks.com/images/OG-Cover.png" />
    <meta name="twitter:creator" content="@datadocks" />`;
    html = html.replace('</title>', `</title>${twitterTags}`);
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

  // Inject or fix og:image (replace Webflow CDN URLs with datadocks.com)
  if (/<meta[^>]*property\s*=\s*["']og:image["'][^>]*>/i.test(html)) {
    html = html.replace(
      /<meta[^>]*property\s*=\s*["']og:image["'][^>]*>/i,
      `<meta property="og:image" content="https://datadocks.com/images/OG-Cover.png" />`
    );
  } else {
    html = html.replace(
      '</title>',
      '</title>\n    <meta property="og:image" content="https://datadocks.com/images/OG-Cover.png" />'
    );
  }

  // Inject robots meta tag for explicit indexing directive
  if (!/<meta[^>]*name\s*=\s*["']robots["']/i.test(html)) {
    html = html.replace(
      '</title>',
      '</title>\n    <meta name="robots" content="index, follow" />'
    );
  }

  const headers = new Headers(response.headers);
  // Strip leaked Webflow headers
  headers.delete("content-security-policy");
  headers.delete("set-cookie");
  headers.delete("surrogate-key");
  headers.delete("surrogate-control");
  headers.delete("x-lambda-id");
  headers.delete("x-wf-region");
  // Set security headers
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Set cache headers for Webflow-proxied pages
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400");

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Canonical schema injected into all Webflow-proxied pages.
// Single source of truth matching Astro's Layout.astro Organization + WebSite.
function getCanonicalSchema(canonicalUrl, pathname) {
  const pageTitle = getPageTitle(pathname);
  const pageDescription = getPageDescription(pathname);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://datadocks.com/#organization",
        "name": "DataDocks",
        "url": "https://datadocks.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://datadocks.com/images/Orange-Logo.svg",
          "width": 201,
          "height": 43
        },
        "description": "Dock scheduling software for warehouses and distribution centers. Reduce truck wait times with automated appointment scheduling.",
        "foundingDate": "2013",
        "sameAs": [
          "https://www.linkedin.com/company/datadocks",
          "https://x.com/datadocks",
          "https://www.youtube.com/@DataDocks",
          "https://www.capterra.com/p/179266/DataDocks/"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+1-647-848-8250",
          "contactType": "Sales",
          "email": "info@datadocks.com",
          "areaServed": "Worldwide",
          "availableLanguage": ["English"]
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://datadocks.com/#website",
        "url": "https://datadocks.com",
        "name": "DataDocks",
        "description": "Dock Scheduling Software for Warehouses",
        "publisher": { "@id": "https://datadocks.com/#organization" },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://datadocks.com/posts/?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "WebPage",
        "@id": canonicalUrl,
        "url": canonicalUrl,
        "name": pageTitle,
        ...(pageDescription ? { "description": pageDescription } : {}),
        "isPartOf": { "@id": "https://datadocks.com/#website" },
        "primaryImageOfPage": { "@type": "ImageObject", "url": "https://datadocks.com/images/OG-Cover.png" },
        "breadcrumb": { "@id": `${canonicalUrl}#breadcrumb` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        "itemListElement": buildBreadcrumbs(pathname)
      }
    ]
  };
}

function getPageTitle(pathname) {
  const titles = {
    "/datadocks-vs-opendock": "DataDocks vs OpenDock | Dock Scheduling Comparison",
    "/support": "Support | DataDocks",
    "/privacy-policy-datadocks": "Privacy Policy | DataDocks",
    "/integrations": "Integrations | DataDocks",
    "/integrations/microsoft-power-bi": "Microsoft Power BI Integration | DataDocks",
    "/integrations/microsoft-sso-entra": "Microsoft SSO (Entra) Integration | DataDocks",
    "/integrations/netsuite-erp": "NetSuite ERP Integration | DataDocks",
    "/integrations/oracle-fusion-cloud": "Oracle Fusion Cloud Integration | DataDocks",
    "/integrations/sap-business-bydesign": "SAP Business ByDesign Integration | DataDocks",
    "/integrations/sap-s-4hana": "SAP S/4HANA Integration | DataDocks",
  };
  // Strip trailing slash for lookup
  const clean = pathname.replace(/\/$/, '') || '/';
  // Check exact match first, then check feature pages pattern
  if (titles[clean]) return titles[clean];
  if (clean.startsWith('/datadocks-features/')) {
    const feature = clean.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `${feature} | DataDocks Features`;
  }
  return "DataDocks | Dock Scheduling Software";
}

function getPageDescription(pathname) {
  const descriptions = {
    "/datadocks-vs-opendock": "Compare DataDocks and OpenDock dock scheduling software. See how features, support, and scalability stack up for warehouses and distribution centers.",
    "/support": "Get help with DataDocks dock scheduling software. Contact our support team for assistance.",
    "/privacy-policy-datadocks": "DataDocks privacy policy. Learn how we handle and protect your data.",
    "/integrations": "Connect DataDocks with SAP, Oracle, NetSuite, Microsoft and more. Integrate your ERP, WMS or TMS with real-time dock scheduling data.",
    "/integrations/microsoft-power-bi": "Connect DataDocks with Microsoft Power BI for real-time dock scheduling analytics and reporting dashboards.",
    "/integrations/microsoft-sso-entra": "Enable single sign-on for DataDocks using Microsoft Entra ID (Azure AD). Streamline user access and security.",
    "/integrations/netsuite-erp": "Integrate DataDocks with NetSuite ERP for seamless dock scheduling and warehouse management data flow.",
    "/integrations/oracle-fusion-cloud": "Connect DataDocks with Oracle Fusion Cloud for automated dock appointment scheduling and logistics data sync.",
    "/integrations/sap-business-bydesign": "Integrate DataDocks with SAP Business ByDesign for coordinated dock scheduling and ERP operations.",
    "/integrations/sap-s-4hana": "Connect DataDocks with SAP S/4HANA for real-time dock scheduling integrated with your enterprise resource planning.",
  };
  const clean = pathname.replace(/\/$/, '') || '/';
  if (descriptions[clean]) return descriptions[clean];
  if (clean.startsWith('/datadocks-features/')) {
    const feature = clean.split('/').pop().replace(/-/g, ' ');
    return `Learn about DataDocks ${feature} feature for dock scheduling and yard management.`;
  }
  return null;
}

function buildBreadcrumbs(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const items = [{ "@type": "ListItem", "position": 1, "name": "Home", "item": "https://datadocks.com" }];
  segments.forEach((seg, i) => {
    const url = `https://datadocks.com/${segments.slice(0, i + 1).join('/')}/`;
    const name = seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    items.push({ "@type": "ListItem", "position": i + 2, "name": name, "item": url });
  });
  return items;
}