# Daily blog rollout

Implemented locally on 2026-09-17 in branch `codex/set-up-daily-blog-posts`.
This supersedes the earlier preparation-only handover. The user subsequently authorized implementation and promotion of the two redesigned pages.

## Status

The daily schedule now contains 38 articles through November 10, 2026. On October 23, the user authorized publication setup and a PR for all 12 consolidated queue articles, retaining the current titles, slugs, prose and illustrations, then directed that the warehouse setup checklist publish as evergreen outside the daily queue. Eleven daily articles occupy slots 28–38; slots 1–27 are unchanged. All 12 new payloads and their components now live in the normal production locations; no duplicate draft packages remain in `internal/blog-staging/`.

The branch for ongoing queue management is `codex/blog-posts-queue`. Merge and deployment install the scheduled content; this preparation alone does not publish it. Any article whose timestamp has already passed becomes eligible in that deployment. Preview controls remain local-only.

The original 15-post rollout was extended with Nick Rakovsky’s food fulfilment article for October 9, then overtime on October 12 and food-and-beverage posts 2–10 through October 23. The approved missing-stock video companion remains scheduled for Monday, October 26 at 14:30 UTC, before the new batch begins on October 27. The redesigned homepage is `/`; the resource hub is `/posts`.

## Publication schedule

Weekdays at **06:30 fixed PST (UTC−08:00), or 14:30 UTC**, from September 17 through November 10, 2026. This follows the user's literal “PST” instruction; it does not switch to daylight-adjusted Pacific time.

The original 15-post rotation is A → B → C, repeated five times. Slot 16 continues with a sixth Nick Rakovsky post; slots 17–26 add the approved overtime and food-and-beverage batch:

- A: the five-part Shadow Freight Spend series, in source order.
- B: the five Nick Rakovsky posts, in draft-number order.
- C: the five researched DataDocks Team posts, in draft-number order.

| Slot | Date | Group / part | Title |
|---|---|---|---|
| 1 | Thu 2026-09-17 | A1 | Why Freight Plans Break at the Dock Door |
| 2 | Fri 2026-09-18 | B1 | Before expanding automated store replenishment, look at the stock errors people fix every day |
| 3 | Tue 2026-09-22 | C1 | When capable people hide broken processes |
| 4 | Wed 2026-09-23 | A2 | You Won the Rate, but You Lost the Truck |
| 5 | Thu 2026-09-24 | B2 | Can your warehouse run without its best supervisor? |
| 6 | Fri 2026-09-25 | C2 | When does human judgement beat forecasting software? |
| 7 | Mon 2026-09-28 | A3 | Who Actually Holds the Company Checkbook? |
| 8 | Tue 2026-09-29 | B3 | You know how to improve operations. How do you get your company on board? |
| 9 | Wed 2026-09-30 | C3 | Can your warehouses afford to have no spare capacity? |
| 10 | Thu 2026-10-01 | A4 | The Friday 4:30 PM Meltdown |
| 11 | Fri 2026-10-02 | B4 | Why are you getting retail stockouts when the system says there’s inventory? |
| 12 | Mon 2026-10-05 | C4 | What are saved minutes worth if they don’t reduce payroll? |
| 13 | Tue 2026-10-06 | A5 | Autopsy of a Freight Invoice |
| 14 | Wed 2026-10-07 | B5 | What I ask when a supplier starts missing deliveries |
| 15 | Thu 2026-10-08 | C5 | Sometimes a temporary 3PL is worth the time it buys |
| 16 | Fri 2026-10-09 | B6 | When growing food sales strain fulfilment |
| 17 | Mon 2026-10-12 | C6 | Cut warehouse overtime by scheduling the work behind each truck |
| 18 | Tue 2026-10-13 | B7 | Should a food business reduce inventory to free up cash? |
| 19 | Wed 2026-10-14 | B8 | Buying fresh produce before you have a buyer |
| 20 | Thu 2026-10-15 | B9 | When a major customer suddenly orders more |
| 21 | Fri 2026-10-16 | B10 | Can you actually use your backup ingredient supplier? |
| 22 | Mon 2026-10-19 | B11 | Is your food business ready for more products and sales channels? |
| 23 | Tue 2026-10-20 | B12 | Expiring food and missed orders: what to fix first |
| 24 | Wed 2026-10-21 | B13 | Does your frozen-food distribution network still fit your customers? |
| 25 | Thu 2026-10-22 | B14 | How quickly can you trace ingredients back to their source? |
| 26 | Fri 2026-10-23 | B15 | Agreeing on longer food-production runs |
| 27 | Mon 2026-10-26 | C7 | Stop letting warehouse workarounds hide missing stock |

The October 27–November 10 extension uses a separate **source rotation**:

- A: training-derived articles.
- B: YouTube-derived articles.
- C: future Nick audio-derived articles, added only when approved and scheduled.

Slots 28–38 alternate A/B. The independently researched warehouse setup checklist is evergreen, outside the daily schedule and source rotation, with no daily slot. Its publication timestamp is `2026-10-23T00:00:00Z`, so it is eligible immediately after merge and deployment. In the manifest, `rotationGroup` records this new source rotation and `provenance` records each source type. Historical `group`, `sequenceInGroup` and top-level `rotation` keep their original meanings; the new DataDocks Team articles continue historical group C with sequence numbers 8–18.

| Slot | Date | Source rotation | Title |
|---|---|---|---|
| 28 | Tue 2026-10-27 | A | Trucks Arriving Hours Early? How to Change the Pattern |
| 29 | Wed 2026-10-28 | B | Find where freight slows down in your warehouse |
| 30 | Thu 2026-10-29 | A | What to Do When Missing Paperwork Holds Up Receiving |
| 31 | Fri 2026-10-30 | B | Set appointment limits by load type |
| 32 | Mon 2026-11-02 | A | Leading a Technology Project When Your Job Is Operations |
| 33 | Tue 2026-11-03 | B | Get detention warnings while there’s still time to act |
| 34 | Wed 2026-11-04 | A | You Sent Directions. Why Are Drivers Still Getting Out to Ask Where To Go? |
| 35 | Thu 2026-11-05 | B | Agree which warehouse messages need an immediate response |
| 36 | Fri 2026-11-06 | A | Receiving Keeps Falling Behind: How to Find Where the Work Gets Stuck |
| 37 | Mon 2026-11-09 | B | Confirm pickup details before the driver arrives |
| 38 | Tue 2026-11-10 | A | Can You Fine Carriers for Late Arrivals and No-Shows? |

The machine-readable manifest is [daily-blog-schedule.json](daily-blog-schedule.json). It records titles, authors, slugs, timestamps, source paths and SHA-256 hashes. The runtime reads publication dates from article frontmatter; the manifest is the editorial audit record.

## Content import

The October 12–23 batch comes from the project’s `staging/` packages. Its ten illustrations live in `src/components/blog/` and are registered in both article render paths and Keystatic. The MDX has named tags without imports. Verified external citation titles and publication/year descriptions use `SmartLink`; the accepted prose and URLs are preserved.

The October 23 publication setup comes from the consolidated `internal/blog-staging/` queue. It includes all six full training-derived articles, including the five bodies developed locally on October 22, five YouTube companions and the evergreen warehouse setup checklist from the warehouse-audit research programme. For the eleven daily articles, manifest source paths and `sourceSha256` capture the pre-move MDX; `sourceBodySha256` verifies the unchanged accepted body after adding publication metadata. The same integration check separately verifies the evergreen checklist's preserved body. Components and actual stylesheets move into the existing article/CMS system. Existing site card artwork is reused. The development staging preview loads the daily production copies through either historical `staging/` or `internal/blog-staging/` source paths, preserving local post labels without duplicate payloads.

Sources were read from `/Users/work/.codex/.chatgpt-projects/g-p-6aa2d8d753748191b2b5e4161818cc5e`. The five series files are at the root; the ten standalone drafts are under `outputs/drafts`. The source folder was not changed.

- All ten standalone article bodies and all 18 citation URLs are preserved. Their repeated source H1/byline lines are handled by the article template.
- Series export artifacts were normalized: empty bullets and spacing removed, raw diagram notation converted to accessible lists/tables, and redundant headings removed. The original source wording was retained.
- The series has no source byline and quotes Nick in the third person, so those five articles are attributed to DataDocks Team. The other authors follow their supplied bylines.
- No draft included artwork. Relevant existing site illustrations are reused for article cards, with descriptive alternative text.
- DataDocks Team resolves explicitly to the organization author, including article structured data.

## Canonical pages and future previews

Current pages:

- [Homepage](http://127.0.0.1:4337/)
- [Resource hub](http://127.0.0.1:4337/posts)

Views after all 38 daily articles have been published:

- [Future homepage](http://127.0.0.1:4337/preview/daily-blog/home)
- [Future resource hub](http://127.0.0.1:4337/preview/daily-blog/posts)

The homepage highlight selects the most recently updated eligible article from the hub’s curated evergreen list (falling back to publication date when no update date exists). Daily posts populate the five-item feed and cannot replace this highlight.

Both previews reuse the canonical page components with a scoped cutoff of `2026-11-11T00:00:00Z`. They preserve the articles' actual dates and are labeled as previews. Preview routes exist only in development, carry `noindex`, and are absent from the production build and sitemap. Query parameters cannot override publication dates on ordinary pages.

The previews show the two requested overview pages. Article links retain their canonical URLs: unpublished article detail pages remain unavailable until due. No future-content override is exposed on production routes.

Retired routes, with no redirects: `/index/home-revamp` and `/wireframes/modular-editorial`.

## Scheduling and publication safeguards

The original daily rebuild workflow has been removed. Publication now happens at request time on Cloudflare Pages: the homepage, hub, article and video routes, and article sitemap read one server timestamp per request. The existing 06:30 fixed PST / 14:30 UTC dates and A/B/C rotation are unchanged.

One deployment is required to install this implementation and the scheduled content. After that, already-deployed posts become available at their own timestamp without deployments, cache clears, or a cron task. Adding or editing content still requires an ordinary deployment.

Before publication, an article returns a real `404` with `noindex, nofollow`, and its title/body/URL do not appear in public listings or the article sitemap. At the cutoff, the same deployed Worker returns the article and includes it in the applicable feeds, archive, related articles and sitemap. Public query parameters and request headers cannot change the publication clock. Static feature/keyword-page resource blocks retain their build-time filtering; these 15 posts do not qualify for those blocks.

`/sitemap.xml` and `/sitemap-index.xml` retain the static non-article sitemap and point to the request-time `/sitemap-posts.xml`. No article URL is baked into the static sitemap. Search engines decide when to crawl/index a newly available article; its availability is immediate, its indexing is not guaranteed at a specific time.

The existing middleware sets `Cache-Control: public, max-age=0, s-maxage=86400, stale-while-revalidate=86400` and `CDN-Cache-Control: public, max-age=86400, stale-while-revalidate=86400`. This queue extension does not change runtime publication or caching. The Worker evaluates eligibility at each request timestamp, while a shared cache may serve a previously stored response within those existing bounds. The publication harness exercises the Worker directly and verifies the bounded cache headers; it does not exercise Cloudflare CDN expiry or revalidation.

Build-only samples render the complete content set to retain optimized image variants and critical CSS. Their HTML is deleted from `dist` before deployment and excluded from every sitemap; generated manifests stay inside the private Worker bundle. These samples are not production previews. The development-only preview URLs remain unchanged.

React's server import uses its edge renderer so this does not require new dashboard-only Cloudflare compatibility flags. There are no new external services, content databases, or paid image-service dependencies.

Run `npm run build` followed by `npm run test:publication` to exercise all 38 daily cutoffs against a single production artifact. The test also verifies the unchanged original 27 schedule records, the new order and source rotation, publication metadata, body hashes and component registration, with separate coverage of the evergreen checklist. It copies the artifact to a temporary directory and controls time only in that copied Worker; it adds no production clock override.

## Request-time publication verification

- Production build passes with the original Cloudflare compatibility date and flags, using React's edge renderer.
- 191 checks pass across all 15 exact publication cutoffs against one unchanged compiled Worker, including private-file access and sitemap protections.
- Existing production functional/accessibility suite: 61 passed, 3 intentionally skipped (development previews and live Calendly).
- Type check: zero errors and warnings (42 existing hints). Unit tests: 36 passed. Lint: zero errors (88 existing warnings).
- Repository hygiene check passes; unrelated local files are untracked, retained locally, and ignored. CI rejects any ignored files force-added to Git.

## Original rollout verification (before the request-time correction)

- Content audit: all 15 source hashes, titles, authors, images and destination files verified; five per group; exact A/B/C rotation; weekdays only; series order preserved.
- `npm run check`: passed, no errors or warnings (42 existing hints).
- `npm run lint`: passed, no errors (98 existing warnings).
- `npm test`: 29 tests passed, including nine publication-cutoff tests and four evergreen-selection tests.
- Production build: passed. All 164 generated public HTML files were inspected. The first due post is built, listed on both canonical pages, and included in the sitemap. The future 14 have no public article HTML, titles, links, inline listing data, or sitemap entries. Retired and preview routes are absent.
- Five rollout browser checks passed: canonical designs and indexing, removed routes, future article exclusion, all 15 in the future hub, latest five plus the separately selected evergreen highlight on the future homepage, isolation of future previews, and author/avatar/date/topic/type metadata on all five Latest Insights cards.
- Seventeen email-capture and hub-interaction regressions passed, including homepage hero/bottom forms, capture-before-booking, failure handling, duplicate submission prevention and booking prefill. External capture/booking calls were stubbed.

For future browser-test runs, `PLAYWRIGHT_FUTURE_PREVIEWS=1` enables the two development-only overview checks in `tests/blog-rollout.spec.mjs`. Leave it unset against a production build, where those routes intentionally do not exist.
