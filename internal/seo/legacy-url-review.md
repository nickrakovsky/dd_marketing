# Legacy URL review, October 19, 2026

Live GET/HEAD checks found `/Posts` and `/Datadocks` returning 404. Existing
Ahrefs keyword observations still reference them. `/Posts` is the legacy-cased
resource hub; `/Datadocks` is the old brand-level URL. Their replacement
destinations are the current `/posts` hub and `/` respectively.

Add explicit 301 mappings for just those aliases, including trailing-slash and
`.html` forms. Preserve query strings. The Pages Worker handles them before
the adapter's asset fallback; `_redirects` also covers static asset handling.
Do not perform global case normalization on assets, identifiers or arbitrary
paths. Unknown children of these aliases remain 404s.

`/wireframes/tabbed-hub` already returns a plain 404 with `X-Robots-Tag: noindex,
nofollow` and `Cache-Control: no-store`. This is the desired retirement behavior
for private previews. It has no equivalent public page that warrants a 301.
Keep its protection, including encoded and mixed-case private aliases, and add
a regression check rather than publishing or redirecting it. A stale search
result can disappear after recrawling; an optional Search Console temporary
removal only hides it sooner and is not required for the code change.
