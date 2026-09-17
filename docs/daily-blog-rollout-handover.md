# Daily blog rollout

Implemented locally on 2026-09-17 in branch `codex/set-up-daily-blog-posts`.
This supersedes the earlier preparation-only handover. The user subsequently authorized implementation and promotion of the two redesigned pages.

## Status

All 15 drafts have been imported and assigned publication timestamps. The redesigned homepage is `/`; the redesigned resource hub is `/posts`. The never-published prototype routes have been removed without redirects.

The changes are prepared in the branch; this task has not pushed, merged, or deployed them. The first post is already due and will be included in the merge deployment. If merging happens after additional scheduled dates, those posts will also be included.

Worktree: `/Users/work/Work/dd_marketing-set-up-daily-blog-posts`.
Local development server: `http://127.0.0.1:4337`.

## Publication schedule

Weekdays at **06:30 fixed PST (UTC−08:00), or 14:30 UTC**, from September 17 through October 7, 2026. This follows the user's literal “PST” instruction; it does not switch to daylight-adjusted Pacific time. The earlier timezone clarification was unanswered, and this implementation assumption was stated in the task.

The rotation is A → B → C, repeated five times:

- A: the five-part Shadow Freight Spend series, in source order.
- B: the five Nick Rakovsky posts, in draft-number order.
- C: the five researched DataDocks Team posts, in draft-number order.

| Slot | Date | Group / part | Title |
|---|---|---|---|
| 1 | Thu 2026-09-17 | A1 | Why Freight Plans Break at the Dock Door |
| 2 | Fri 2026-09-18 | B1 | Before expanding automated store replenishment, look at the stock errors people fix every day |
| 3 | Mon 2026-09-21 | C1 | When capable people hide broken processes |
| 4 | Tue 2026-09-22 | A2 | You Won the Rate, but You Lost the Truck |
| 5 | Wed 2026-09-23 | B2 | Can your warehouse run without its best supervisor? |
| 6 | Thu 2026-09-24 | C2 | When does human judgement beat forecasting software? |
| 7 | Fri 2026-09-25 | A3 | Who Actually Holds the Company Checkbook? |
| 8 | Mon 2026-09-28 | B3 | You know how to improve operations. How do you get your company on board? |
| 9 | Tue 2026-09-29 | C3 | Can your warehouses afford to have no spare capacity? |
| 10 | Wed 2026-09-30 | A4 | The Friday 4:30 PM Meltdown |
| 11 | Thu 2026-10-01 | B4 | Why are you getting retail stockouts when the system says there’s inventory? |
| 12 | Fri 2026-10-02 | C4 | What are saved minutes worth if they don’t reduce payroll? |
| 13 | Mon 2026-10-05 | A5 | Autopsy of a Freight Invoice |
| 14 | Tue 2026-10-06 | B5 | What I ask when a supplier starts missing deliveries |
| 15 | Wed 2026-10-07 | C5 | Sometimes a temporary 3PL is worth the time it buys |

The machine-readable manifest is [daily-blog-schedule.json](daily-blog-schedule.json). It records titles, authors, slugs, timestamps, source paths and SHA-256 hashes. The runtime reads publication dates from article frontmatter; the manifest is the editorial audit record.

## Content import

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

Views after all 15 have been published:

- [Future homepage](http://127.0.0.1:4337/preview/daily-blog/home)
- [Future resource hub](http://127.0.0.1:4337/preview/daily-blog/posts)

The homepage highlight selects the most recently updated eligible article from the hub’s curated evergreen list (falling back to publication date when no update date exists). Daily posts populate the five-item feed and cannot replace this highlight.

Both previews reuse the canonical page components with a scoped cutoff of `2026-10-08T00:00:00Z`. They preserve the articles' actual dates and are labeled as previews. Preview routes exist only in development, carry `noindex`, and are absent from the production build and sitemap. Query parameters cannot override publication dates on ordinary pages.

The previews show the two requested overview pages. Article links retain their canonical URLs: unpublished article detail pages remain unavailable until due. No future-content override is exposed on production routes.

Retired routes, with no redirects: `/index/home-revamp` and `/wireframes/modular-editorial`.

## Scheduling and publication safeguards

`.github/workflows/scheduled-publish.yml` now requests a weekday rebuild at 14:30 UTC. It uses the existing `CF_PAGES_DEPLOY_HOOK` secret, preserves manual dispatch and concurrency control, and removes the old 08:30 Pacific time gate.

Publication is build-triggered. Scheduled workflow runs can be delayed; posts become publicly available after the resulting deployment finishes, not necessarily at the exact scheduled minute. The workflow change takes effect when it reaches the default branch.

The remote workflow enablement, secret availability, and deploy-hook target branch remain unverified. No deployment was triggered. The attempted read-only browser check was unavailable because browser access was not approved.

Publication filtering now uses actual timestamps in development as well as production. Future dates are excluded from article/video routes, homepage feeds, the resource hub and archive, related content, SmartLink metadata, and sitemap URLs. Invalid dates do not publish. An internal link to a future post displays its authored text without exposing an unavailable link or preview metadata.

## Verification

- Content audit: all 15 source hashes, titles, authors, images and destination files verified; five per group; exact A/B/C rotation; weekdays only; series order preserved.
- `npm run check`: passed, no errors or warnings (42 existing hints).
- `npm run lint`: passed, no errors (98 existing warnings).
- `npm test`: 29 tests passed, including nine publication-cutoff tests and four evergreen-selection tests.
- Production build: passed. All 164 generated public HTML files were inspected. The first due post is built, listed on both canonical pages, and included in the sitemap. The future 14 have no public article HTML, titles, links, inline listing data, or sitemap entries. Retired and preview routes are absent.
- Five rollout browser checks passed: canonical designs and indexing, removed routes, future article exclusion, all 15 in the future hub, latest five plus the separately selected evergreen highlight on the future homepage, isolation of future previews, and author/avatar/date/topic/type metadata on all five Latest Insights cards.
- Seventeen email-capture and hub-interaction regressions passed, including homepage hero/bottom forms, capture-before-booking, failure handling, duplicate submission prevention and booking prefill. External capture/booking calls were stubbed.

For future browser-test runs, `PLAYWRIGHT_FUTURE_PREVIEWS=1` enables the two development-only overview checks in `tests/blog-rollout.spec.mjs`. Leave it unset against a production build, where those routes intentionally do not exist.
