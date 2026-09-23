# Five-page performance pass

Branch: `codex/site-speed-performance`, based on `origin/main` at `d2556b5`.

## Baseline supplied for this work

| Route | Priorities |
| --- | --- |
| `/` | Invalid ARIA group role on testimonial figures |
| `/posts` | Mobile LCP 3.2 s; invalid group role on shorts articles |
| `/comparison` | Accessibility 85; missing required ARIA parents/children; skipped heading levels |
| `/news` | Mobile Speed Index 4.1 s; forced reflow 73 ms; Recoleta dependency chain |
| `/posts/best-yard-management-options` | Mobile FCP 2.0 s, LCP 3.8 s; image delivery estimate 188 KiB; forced reflow 81 ms; critical path 733 ms |

These are the supplied baseline values, not new measurements or promised results.

## Changes

- Keep native figure/article semantics for testimonial and shorts slides.
- Repair comparison table row groups and heading hierarchy, retaining its expand,
  competitor selection, and responsive behavior.
- Defer below-fold shorts and deep-dive posters; avoid reparenting already sorted
  archive cards during initialization/filtering.
- Split Recoleta into common-text and extended-character subsets. The common
  regular/semibold pair is 36,572 bytes instead of 51,524 bytes (29.0% smaller).
  All mapped characters remain available, with unchanged metrics and shaping
  checked for representative English text. Pages requiring both subsets can
  download slightly more than before.
- Supply AVIF primary yard images with WebP fallback and accurate responsive
  sizes. Defer recommendation data and its booking panel until selector use.
  The yard article's first body image is below the selector/intro and is no
  longer prioritized/preloaded as if it were the initial LCP image.
- Extend Lighthouse CI from the homepage to all five routes using the same
  Cloudflare preview origin. Existing thresholds remain unchanged.

## Forced reflow: Cloudflare follow-up

A focused live mobile trace on 2026-09-22 reproduced the news layout call in
`j.zaraz.init`, line 28, column 3126 (the reported column 3125 in zero-based
notation). It cost 60.242 ms in this trace. The yard article exposed the same
call site, but cost only 1.174 ms in that run: timing varies with network,
HTML parsing, and layout already completed. These are diagnostic traces,
not Lighthouse score comparisons.

This initializer is injected by Cloudflare, not emitted by Astro source.
It was absent from command-line HTTP responses but present for the browser,
which explains why source-only searches did not identify the call.

Changing first-party sidebar/carousel layout code will not remove this
particular call. The next step is to inspect the live Zaraz injection settings
and test a manually loaded, deferred initializer in Cloudflare's preview mode.
Preserve automatic pageview tracking, consent behavior, attribution, and booking
conversion events; avoid loading both auto-injected and manual initializers.
Do not simply disable analytics or change the public site to hide an audit.

Cloudflare documents the necessary configuration switch and initializer at:
https://developers.cloudflare.com/zaraz/advanced/load-zaraz-manually/
https://developers.cloudflare.com/zaraz/reference/settings/

No Cloudflare settings were changed in this worktree.

## Verification boundaries

Local checks use the development server for targeted interaction/accessibility
behavior, not production timing. The existing production React Worker alias
fails in this repository's development SSR mode (`require is not defined`);
an ignored local config removes that alias only for the smoke-test server.
The committed production configuration is unchanged.

Full builds, Lighthouse timing, comprehensive accessibility, publication tests,
and the remaining CI suite must run on the branch's Cloudflare preview. No
post-change FCP/LCP/Speed Index or Lighthouse score is claimed until then.

Focused results:

- Four browser regression cases pass for the reported accessibility rules:
  home carousel, mobile shorts, mobile comparison, and desktop comparison.
  Expanded/collapsed table states and adding a competitor are included.
- Posts hub: zero initial deep-dive poster requests; scroll-to-load and video
  playback pass. Archive initialization/filtering keeps existing nodes in place;
  oldest ordering and reset still work; no page JavaScript errors in this check.
- Yard selector: at 390 px / DPR 2, it selects 800 px AVIF for a 358 px card;
  initial hydration does not request recommendation/booking-panel modules;
  category → subtype → DataDocks details works without page errors. Extraction
  parity covers all 17 yard types and 140 recommendations.
- News fonts: only two Core faces requested for the existing copy; injecting
  accented test text causes the Extended face to load. Generator checks full
  character coverage and metrics; representative shaping/outlines match the
  source faces.
- Changed-file lint and Astro compilation checks pass, with existing lint
  warnings. Lighthouse configuration resolves all five routes to PREVIEW_URL.

AVIF savings for all four primary cards combined: 80,569 bytes (33.3%) at
800 px and 117,041 bytes (33.8%) at 1016 px, compared with the existing WebP
variants. Actual transfer depends on viewport, pixel density, and which cards
are near the viewport; this is not the same as Lighthouse's 188 KiB estimate.

## Paused checkpoint — 2026-09-22

Paused at the user's request. Implementation and focused local checks are saved;
nothing has been pushed or deployed. News Hub remains in its separate checkout.

Additional completed checks: an isolated selector-only bundle comparison measured
40,594 → 20,983 gzip bytes (48.3% smaller initial JavaScript, including Solid).
Both deferred-download failure paths show an accessible error and leave cards
usable. Ordinary articles retain first-image eager/high priority. JSON-LD,
noscript, and hidden crawler references each retain the full 17-type / 140-item
data after the split. Independent review caught and fixed the crawler mapping.
Final scoped lint found one type-import style error; corrected and rechecked,
leaving only existing warnings.

Resume with:

1. Review the saved diff/commit and create a branch preview when requested.
2. Run CI and the five-page mobile Lighthouse audit against that preview; compare
   actual FCP, LCP, Speed Index, accessibility and transferred bytes with baseline.
3. Investigate Cloudflare Zaraz auto-injection separately using the documented
   live trace. Test any loading change with consent, attribution, pageviews, and
   booking conversions intact before applying it to production.
4. Prioritize further work from the production results, including any remaining
   posts archive thumbnail contention. Development timing is not evidence of
   production LCP improvement.

## Resumed — 2026-09-23

Merged current main (`e719265`) into the performance branch without conflicts.
An independent comparison confirmed that main's image compression, deferred
video behavior, title/meta changes, and structured-data corrections survived.
The complete yard taxonomy and JSON-LD match main (17 facilities, 140 entries).

Draft PR: https://github.com/nickrakovsky/dd_marketing/pull/232
First preview: https://f2f8a51c.dd-marketing.pages.dev (commit `ef967ad`).
Its CI lint, type checks, unit tests, build and publication tests passed.
Browser/accessibility/performance/link checks were still running when this
checkpoint was written. Production remains unchanged.

Review found that the fully deferred shorts had lost their no-JavaScript poster
fallback. Linked fallback posters and a JavaScript-disabled regression check
were added to shorts and deep dives. The focused no-JavaScript navigation test
passed, and normal JavaScript-enabled startup still makes zero shorts/deep-dive
poster requests. This correction needs its own updated preview.

The first preview's complete browser/accessibility checks passed. Mobile
Lighthouse recorded the following (preview measurements, not a controlled
before/after comparison with production):

| Page | Performance | Accessibility | FCP | LCP | Speed Index | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 87 | 96 | 1.49 s | 2.36 s | 2.52 s | 0.0003 |
| Posts | 95 | 96 | 1.79 s | 2.72 s | 2.61 s | 0 |
| Comparison | 99 | 97 | 1.51 s | 1.96 s | 1.51 s | 0.0450 |
| News | 98 | 96 | 1.82 s | 2.12 s | 1.82 s | 0.0160 |
| Yard article | 95 | 96 | 1.39 s | 2.12 s | 1.39 s | 0.0004 |

The Lighthouse CI gate failed because comparison and news exceeded the existing
0.01 CLS limit; link crawling was skipped after that failure. Their intro text
changes line wrapping when Recoleta loads. Comparison explicitly identified the
Regular Core font as the cause. Both pages now opt into early Core font preloads;
other pages and Extended fonts retain their existing discovery behavior. This
fix awaits GitHub's automatic checks. Home also has a non-blocking performance
warning; the largest long task in that report comes from Partytown's sandbox.

The user clarified that they are not the Cloudflare administrator and cannot
sign in. Zaraz configuration is deferred to their administrator; no settings
were modified. Repository changes do not resolve the injected Zaraz reflow.

At the user's request, no further local tests, audits, or builds will run.
Validation belongs to the normal GitHub/Cloudflare pipeline; do not manually
rerun workflows merely to collect additional measurements.
