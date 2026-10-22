# Blog staging and local batch previews

The user authorized the current ten-post batch: overtime on October 12, 2026,
then food-and-beverage posts 2–10 on successive weekdays, October 13–23, at
06:30 fixed UTC−08:00 (14:30 UTC). The scheduled articles now live only in
`src/content/posts/`; their dates are recorded in
[the existing schedule](../../docs/daily-blog-schedule.json). Deployment and the
existing publication gate control when those production copies become public.

This folder is the queue for future drafts. New posts remain undated until
scheduling is authorized. Placing files here does not publish them. `internal/`
must stay outside production imports and output.

## Consolidated working queue — October 22, 2026

Continue new queue work on `codex/blog-posts-queue`, based on current `main`.
This branch consolidates the outstanding packages from
`codex/youtube-video-posts-batch` and `codex/queue-training-posts`, plus the
message-response draft that was saved locally in the YouTube worktree.
Use this branch for the eventual single batch PR; the source branches are
historical references, not parallel queues to maintain.

The 12 entries below remain undated. Folder numbers keep the local preview in a
stable order; they do not assign publication dates. The four video articles
marked approved retain that status from their source commits. The warehouse
setup checklist and message-response draft have no recorded final editorial
approval. All six training slugs and illustrations are accepted; only the first
training post has a full prose draft. Preserve those distinctions before scheduling.

| Queue entry | Draft title | Intended URL | Current status |
|---|---|---|---|
| 12 | Get detention warnings while there’s still time to act | `/posts/get-detention-warnings-in-time-to-act` | Full article; recorded as approved on the source branch |
| 13 | Find where freight slows down in your warehouse | `/posts/find-where-freight-slows-down` | Full article; recorded as approved on the source branch |
| 14 | Warehouse Setup Checklist for a New Facility | `/posts/warehouse-setup-checklist` | Full checklist; queued, final editorial approval not recorded |
| 15 | Set appointment limits by load type | `/posts/set-appointment-limits-by-load-type` | Full article; recorded as approved on the source branch |
| 16 | Confirm pickup details before the driver arrives | `/posts/confirm-pickup-details-before-the-driver-arrives` | Full article; recorded as approved on the source branch |
| 17 | Agree which warehouse messages need an immediate response | `/posts/set-response-expectations-for-warehouse-messages` | Full draft in progress; approval not recorded |
| 18 | Trucks Arriving Hours Early? How to Change the Pattern | `/posts/early-arrival-patterns` | Full prose draft; slug and illustration accepted |
| 19 | Can You Fine Carriers for Late Arrivals and No-Shows? | `/posts/missed-slot-fees` | Reviewed excerpt and illustration; remaining body pending |
| 20 | Receiving Keeps Falling Behind: How to Find Where the Work Gets Stuck | `/posts/receiving-backlogs` | Reviewed excerpt and illustration; remaining body pending |
| 21 | What to Do When Missing Paperwork Holds Up Receiving | `/posts/paperwork-delays` | Reviewed excerpt and illustration; remaining body pending |
| 22 | You Sent Directions. Why Are Drivers Still Getting Out to Ask Where To Go? | `/posts/driver-wayfinding` | Reviewed excerpt and illustration; remaining body pending |
| 23 | Leading a Technology Project When Your Job Is Operations | `/posts/rollout-decisions` | Reviewed excerpt and illustration; remaining body and final title review pending |

The existing 27 scheduled articles remain in `src/content/posts/` and the
existing schedule. Do not copy them back into this queue. Warehouse audit,
outbound dock management and food-fulfilment work already on `main` also need
no duplicate entries. The training packages were renumbered from 12–17 to
18–23 to avoid duplicate preview labels; their URL slugs and payloads are unchanged.

## Package format and review

Each folder contains one `<slug>.mdx` article, its named Astro component and any
required CSS or unique assets. Preserve the accepted prose and source URLs.
Keep `pubDate` absent until scheduling is authorized. Do not add per-post guides,
previews, manifests, copied fonts or equivalent implementations.

Use the existing article framework: `src/content/config.ts`,
`src/components/pages/ArticlePage.astro`, `src/layouts/BlogPostLayout.astro` and
`keystatic.config.ts`. Components use the site's fonts and theme. MDX contains
named component tags, never imports, scripts or a separate page layout.

External citations use the existing `SmartLink` with explicit `href`,
`anchorText`, `title` and `snippet`. Preserve the sentence wording in
`anchorText`; verify the exact standalone source title, publication and year
from the source or its checked research record. Do not manufacture metadata
from a URL or substitute the publisher for the source title. Internal links
may remain ordinary Markdown.

```mdx
<SmartLink href="https://link.springer.com/article/10.1007/s40092-017-0228-4" anchorText="a 2017 inventory model" title="An EOQ model for non-instantaneous deteriorating items with two levels of storage under trade credit policy" snippet="Journal of Industrial Engineering International · 2017" />
```

From the repository root, check the queue and start its local preview:

```sh
npm run check:staging
npm run dev:staging
```

The preview at `/preview/staging` combines future drafts from this queue with
the scheduled production articles whose schedule `sourcePath` begins with
`staging/`. It reads each article's actual publication date and reuses the site
layout and shared components; do not copy scheduled payloads back here. The
preview is available only through this local development configuration.
Do not expose the development server publicly.

The checker accepts optional package folders, `--site <checkout>` and
`--base-ref <ref>`. It compares slugs with the locally recorded `origin/main`
by default and reports its baseline without fetching. Refresh the publishing
base before the eventual publication review.

Agents perform code, compilation and runtime checks. The user reviews visuals,
including desktop/mobile layouts, both site themes, illustrations and source
cards. Do not perform visual inspection on the user's behalf. Preserve the
current batch's authorized titles, slugs and dates. For future batches, present
the titles and intended `/posts/<slug>` URLs for the user's editorial review;
passing checks do not approve titles, slugs or appearance.

For future posts, after the user's approval and scheduling instruction, move the intended public
content through the normal site workflow, register components in the existing
article and Keystatic maps, and assign dates using the existing schedule. Never
import this internal queue from production code or add a new scheduler.
