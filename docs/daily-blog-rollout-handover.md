# Daily blog rollout — handover for Astra Ultra

Prepared 2026-09-17. This is a preparation checkpoint, not a completed publication setup.

## Workspace and stopping point

- Worktree: `/Users/work/Work/dd_marketing-set-up-daily-blog-posts`
- Branch: `codex/set-up-daily-blog-posts`
- Starting commit for this preparation: `d595ace`.
- Local dev server: `http://127.0.0.1:4337`.
- User explicitly requested a basic plan, easiest preparation steps, then a stop for Astra Ultra. Do not mistake this handover for authorization to publish immediately or for a completed import.
- Earlier merge and responsive work is complete and committed. This preparation changes documentation only. No new post has been imported, scheduled in production, or published; no future preview route has been implemented.

## User request

Import 15 posts from project folder `g-p-6aa2d8d753748191b2b5e4161818cc5e`:
- Five files at/near its root, beginning `DataDocks - Post Every Day Strategy`.
- Ten files under `outputs/drafts`.
- Three groups of five: A = five-part topic series; B = Nick Rakovsky; C = researched DataDocks Team.
- Alternate A, B, C on weekdays at 06:30, starting Thursday September 17, 2026. Keep series parts in order. The first date is intentionally in the past, so the first post should become eligible with the merge deployment.
- Provide two special views of the homepage redesign and redesigned posts hub after all 15 are published.

The group letters follow the order of the user's list; source filenames have not yet been mapped to groups.

## Outstanding inputs

1. **Source folder location.** The user says access has been granted, but no absolute path was supplied or exposed in the current workspace. Filename/path searches in the workspace and ordinary local document roots produced no match; broad directory traversal was stopped rather than prolonged. No drafts were read and their formats, titles, authors and image assets remain unverified. A question requesting the full path is pending. Do not claim the 15 drafts have been inventoried.
2. **Timezone.** Asked whether “PST” means Pacific local time (`America/Los_Angeles`) or fixed UTC−08:00. No answer received at preparation time. September 17–October 7 at 06:30 is 13:30 UTC for Pacific local time, or 14:30 UTC for fixed PST. Keep `pubDate` unset until this is resolved. The planning JSON includes both candidates.

## Prepared rotation

Every listed date is a weekday, with exactly five slots per group. Publication time is 06:30 in the confirmed timezone. Within B and C, select the editorial order after reading the drafts.

| Slot | Date | Group / part |
|---|---|---|
| 1 | Thu 2026-09-17 | A1 |
| 2 | Fri 2026-09-18 | B1 |
| 3 | Mon 2026-09-21 | C1 |
| 4 | Tue 2026-09-22 | A2 |
| 5 | Wed 2026-09-23 | B2 |
| 6 | Thu 2026-09-24 | C2 |
| 7 | Fri 2026-09-25 | A3 |
| 8 | Mon 2026-09-28 | B3 |
| 9 | Tue 2026-09-29 | C3 |
| 10 | Wed 2026-09-30 | A4 |
| 11 | Thu 2026-10-01 | B4 |
| 12 | Fri 2026-10-02 | C4 |
| 13 | Mon 2026-10-05 | A5 |
| 14 | Tue 2026-10-06 | B5 |
| 15 | Wed 2026-10-07 | C5 |

Machine-readable companion: `docs/daily-blog-schedule.plan.json`. This is planning data, not an application input. It deliberately leaves source paths, titles, slugs and final publication timestamps empty.

## Confirmed repository findings

- `src/content/config.ts`: posts require title, author and `pubDate` (`z.coerce.date()`); optional description, category, cardImage/cardAlt, readTime, related features, etc. MDX articles live in `src/content/posts/`. Use ISO timestamps with an explicit offset or `Z`, not the legacy ambiguous date strings found in some existing posts.
- `src/lib/content-status.ts`: `isPublished` compares publication dates with the real build time in production; it returns true for all dates in development. Missing or invalid dates also return true. Production preview builds still use the production check, despite the helper's loose “preview” wording.
- `src/pages/posts/[slug].astro` and `src/pages/posts/index.astro`: prerendered, with `isPublished` checks. New eligibility requires a rebuild for these routes.
- `.github/workflows/scheduled-publish.yml`: weekday cron is currently `30 15,16 * * 1-5`; a Pacific-hour check targets **08**, then posts to the Cloudflare Pages hook using `CF_PAGES_DEPLOY_HOOK`. It does not implement 06:30 yet. Manual dispatch bypasses the hour check. Remote workflow enablement, secret availability and deploy-hook target branch have NOT been verified.
- For Pacific local 06:30, the existing two-cron/DST pattern would become `30 13,14 * * 1-5` with a Pacific **06** hour gate. For fixed PST, use 14:30 UTC with no contradictory daylight-time hour gate. Decide after the timezone answer.
- This is build-triggered publishing: live availability follows build completion, not necessarily the exact scheduled minute. Confirm the needed timing tolerance before claiming precise 06:30 visibility.
- `src/offline-pages/home-revamp.astro`: direct `Date.now()` filters exclude future posts even in development. Featured article requires `cardImage`; author/avatar presentation should be checked for Nick and DataDocks Team.
- `src/lib/wireframe-data.ts`, `getModularHubData()`: uses `isPublished`, so development currently includes all future posts. The latest-five list and older archive sort non-evergreen posts by publication date. Curated evergreen sections are separate.
- `astro.config.mjs`: injects `/index/home-revamp` only for development. `/wireframes/modular-editorial` is the current redesigned hub prototype; actual `/posts` still uses its separate existing layout. Do not silently replace the public routes merely to provide previews.
- Existing future-content gaps to close during implementation: related-post suggestions in `src/pages/posts/[slug].astro` use unfiltered collections; `src/components/home/Resources.astro` likewise selects from all posts. Future posts with matching priority/images could appear early in these surfaces even while their article routes are excluded.
- Sitemap dates are handled in `astro.config.mjs`; future dates are excluded from its post-date map in production. Verify actual generated sitemap URLs as well as page routes. Do not equate removal of lastmod data with a proven URL exclusion.

## Basic implementation plan

1. **Inventory and editorial mapping.** Find/read all 15 final drafts and any colocated publishing notes/assets. Establish exact title, author, group, series order, slug, description, category, image/alt text and source path. Resolve duplicate draft versions. Map them into the prepared schedule. Check source instructions before editing that folder.
2. **Import the content.** Convert the final drafts to the site's MDX conventions, keeping wording, citations and supported components intact. Handle images and bylines deliberately; do not invent researched claims or silently default authors to Joe Fitzpatrick. Validate internal/series links, especially links to parts not yet published. Set explicit confirmed timestamps. An overdue first post becomes eligible naturally; if the eventual merge occurs after later slots too, those elapsed slots will also be eligible.
3. **Complete scheduling.** Adjust the workflow time after the timezone decision. Unify publication filtering across listings, related links and other relevant public surfaces. Verify the workflow and hook configuration without printing secret values or triggering a deployment in this preparation stage.
4. **Create the two future previews.** Prefer dedicated development-only routes reusing the real homepage and redesigned hub rendering. Pass a scoped `asOf` instant to data selection, rather than changing the system clock or globally disabling the production publication gate. Use a cutoff of `2026-10-08T00:00:00Z`, which follows all 15 slots in either timezone interpretation. Preserve the actual scheduled dates in visible labels. Keep preview routes out of public navigation and sitemap; mark them noindex. If hosted/shareable previews are needed, explicitly choose a preview-environment guard rather than exposing all future content on production routes.
5. **Verify then report.** Check all 15 documents, five per group, chronological rotation, weekend skips, explicit timezone, and first-post eligibility. Exercise publication cutoffs just before/at a timestamp and after the final slot. Build a normal production view proving future URLs/cards remain excluded, and inspect both future previews on phone/desktop. Check image availability, authors, latest-five/archive ordering, related links, sitemap, and existing capture behavior. Supply the two actual working preview URLs when implemented.

Proposed local preview URLs (NOT created yet):
- `http://127.0.0.1:4337/preview/daily-blog/home`
- `http://127.0.0.1:4337/preview/daily-blog/posts`

Existing pages for reference only:
- `http://127.0.0.1:4337/index/home-revamp`
- `http://127.0.0.1:4337/wireframes/modular-editorial`

Do not add a query parameter to a prerendered production route and assume its build-time publication filtering will change.

## Preparation verification

The JSON was parsed and generated with Python date/time calculations. Assertions confirm 15 weekday slots, five per group, and the final date October 7, 2026. No application code changed in this preparation, so no new application test/build run was necessary. Last application checkpoint (`d595ace`) passed lint, type checking, production build, 13 viewport/page checks and four hub interaction tests.
