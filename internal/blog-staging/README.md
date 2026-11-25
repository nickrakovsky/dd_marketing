# Blog staging and local batch previews

Scheduled articles live only in `src/content/posts/`; their dates are recorded in
[the existing schedule](../../docs/daily-blog-schedule.json). Deployment and the
existing publication gate control when those production copies become public.

This folder is the queue for future drafts. New posts remain undated until
scheduling is authorized. Placing files here does not publish them. `internal/`
must stay outside production imports and output.

## Shared queue extension — November 25, 2026

Continue the next batch on `codex/daily-posts-queue-november-26`, based on main
after PR #301. The approved forklift-maintenance YouTube companion occupies
slot 50 on November 26 at 14:30 UTC, at
`/posts/forklift-breakdowns-beyond-repair-bill`. Slots 1–49 are unchanged.
Its article, component and required icons live in the production folders;
the local preview reads those same files.

Other post-drafting agents should append approved posts to this shared branch
and PR. Read `docs/daily-blog-schedule.json` before assigning the next weekday
slot; preserve existing dates and the fixed 14:30 UTC publication time. Follow
the package, editorial approval and integration workflow below. Merge and
deployment remain required for release.

## Consolidated queue scheduled — October 23, 2026

Continue queue management on `codex/blog-posts-queue`, based on current `main`.
This branch consolidated the outstanding packages from
`codex/youtube-video-posts-batch` and `codex/queue-training-posts`, plus the
message-response draft saved in the YouTube worktree. Those source branches
are historical references, not parallel queues to maintain.

On October 23, the user authorized publication setup and a PR for all 12
articles, retaining their current titles, slugs, prose and illustrations.
The warehouse setup checklist was then explicitly excluded from the daily
queue: it publishes as evergreen and is eligible immediately after merge and
deployment.
This authorization supersedes the earlier draft-review notes, including the
provisional technology-project title. All six training articles have full
prose; the five bodies developed locally on October 22 are included.

The payloads now live only in `src/content/posts/` and `src/components/blog/`.
There are no remaining draft packages in this queue. The original 27 scheduled
slots are unchanged; the 11 daily entries occupy slots 28–38 at **06:30 fixed
UTC−08:00 / 14:30 UTC** on the dates below. They become eligible only after
the normal merge and deployment, subject to the existing publication gate.

The new source rotation is **A = training**, **B = YouTube**, with **C = Nick
audio** reserved for future approved articles. Slots 28–38 alternate A/B; the
warehouse setup checklist is a separate evergreen research article, with no
daily slot. This source rotation is recorded as `rotationGroup`; the
manifest's historical `group` A/B/C meanings remain unchanged.

| Schedule slot | Date | Source rotation | Title | URL |
|---|---|---|---|---|
| 28 | 2026-10-27 | A | Trucks Arriving Hours Early? How to Change the Pattern | `/posts/early-arrival-patterns` |
| 29 | 2026-10-28 | B | Find where freight slows down in your warehouse | `/posts/find-where-freight-slows-down` |
| 30 | 2026-10-29 | A | What to Do When Missing Paperwork Holds Up Receiving | `/posts/paperwork-delays` |
| 31 | 2026-10-30 | B | Set appointment limits by load type | `/posts/set-appointment-limits-by-load-type` |
| 32 | 2026-11-02 | A | Leading a Technology Project When Your Job Is Operations | `/posts/rollout-decisions` |
| 33 | 2026-11-03 | B | Get detention warnings while there’s still time to act | `/posts/get-detention-warnings-in-time-to-act` |
| 34 | 2026-11-04 | A | You Sent Directions. Why Are Drivers Still Getting Out to Ask Where To Go? | `/posts/driver-wayfinding` |
| 35 | 2026-11-05 | B | Agree which warehouse messages need an immediate response | `/posts/set-response-expectations-for-warehouse-messages` |
| 36 | 2026-11-06 | A | Receiving Keeps Falling Behind: How to Find Where the Work Gets Stuck | `/posts/receiving-backlogs` |
| 37 | 2026-11-09 | B | Confirm pickup details before the driver arrives | `/posts/confirm-pickup-details-before-the-driver-arrives` |
| 38 | 2026-11-10 | A | Can You Fine Carriers for Late Arrivals and No-Shows? | `/posts/missed-slot-fees` |

**Evergreen article:** “Warehouse Setup Checklist for a New Facility,” at
`/posts/warehouse-setup-checklist`. It has no scheduled daily position; its past
publication timestamp makes it eligible immediately on merge and deployment.

The manifest preserves the daily articles' original `internal/blog-staging/post-<number>/`
source paths, source hashes and unchanged-body hashes as provenance. Those
paths also preserve the existing local preview labels; they are not payload
copies to restore here. Warehouse audit, outbound dock management and
food-fulfilment work already on `main` need no duplicate entries.

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
`staging/` or `internal/blog-staging/`. It reads each article's actual
publication date and reuses the site
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

## Nick Rakovsky posts scheduled — November 2, 2026

The five reviewed Nick audio posts are integrated into the production article and
component folders. They use source rotation C and extend the queue on the next
five weekdays at 06:30 fixed UTC−08:00 / 14:30 UTC. The original 38 slots are
unchanged. The user authorized a regular PR and will review automated checks
before merge; release still depends on the existing publication gate and deployment.

| Schedule slot | Date | Title | URL |
|---|---|---|---|
| 39 | 2026-11-11 | Before You Put AI to Work, Learn Its Limits | `/posts/learn-ai-limits-before-adoption` |
| 40 | 2026-11-12 | Warehouse Software Projects Fail When the New Process Is 'Optional' | `/posts/warehouse-software-optional-process` |
| 41 | 2026-11-13 | Don’t Lose Operational Know-How in the Rush to Adopt AI | `/posts/keep-operational-know-how-with-ai` |
| 42 | 2026-11-16 | Don’t Try To Automate the Give-and-Take Out of Logistics | `/posts/logistics-automation-give-and-take` |
| 43 | 2026-11-17 | Reduce Warehouse Travel by Connecting Inbound and Outbound Data | `/posts/connect-inbound-outbound-warehouse-data` |

Source paths and hashes in the schedule preserve provenance; no duplicate staged
payloads or private source recordings are included.


## Combined batch scheduled — November 16, 2026

PR [#299](https://github.com/nickrakovsky/dd_marketing/pull/299), on
`codex/daily-posts-queue-november`, adds the reviewed warehouse-process YouTube
post ahead of the four approved Recording 37 articles (D1–D4). The existing
43 slots are unchanged and finish on November 17. This five-post extension
uses the next weekdays at **06:30 fixed UTC−08:00 / 14:30 UTC**, in the order
the user requested.

| Schedule slot | Date | Source | Title | URL |
|---|---|---|---|---|
| 44 | 2026-11-18 | YouTube | Test one warehouse process change before rolling it out | `/posts/test-one-warehouse-process-change` |
| 45 | 2026-11-19 | D1 | What to Account for Before Bringing Truck Freight In-House | `/posts/truck-freight-in-house` |
| 46 | 2026-11-20 | D2 | Using Agency Staffing to Find People You Want to Keep | `/posts/agency-staffing-retention` |
| 47 | 2026-11-23 | D3 | What Running a Recycling Plant Taught Me About Costs That Arrive With the Load | `/posts/costs-arrive-with-the-load` |
| 48 | 2026-11-24 | D4 | Leaner Logistics Teams Depend More on Their Providers | `/posts/provider-dependence` |

The accepted prose, titles, slugs and interactions are preserved. The YouTube
article uses source rotation B; D1–D4 use C (Nick audio). Payloads now live only
in `src/content/posts/` and `src/components/blog/`, registered in the existing
article renderer and CMS. No duplicate packages remain here. The historical
source paths in the schedule preserve preview labels 29–33 and provenance.
Merge, deployment and the existing publication gate control release.

## Supervisor-deadline companion scheduled — November 17, 2026

The user approved post 34, “Give warehouse supervisors a deadline they can plan
around,” and requested its addition to the schedule. It occupies slot 49 on
**November 25, 2026 at 14:30 UTC**, at
`/posts/give-warehouse-supervisors-clear-deadlines`. Slots 1–48 are unchanged.

The article, `SupervisorWorkPlan.astro` and its stylesheet now live in the normal
production folders. Its accepted prose and interaction are preserved, with the
component registered in the existing article renderer and Keystatic. The local
preview continues at `/preview/staging/give-warehouse-supervisors-clear-deadlines`
using the production payload; no staged duplicate remains. The change is prepared
on `codex/youtube-supervisor-deadlines`, based on remote main after PR #299.
Merge and deployment install the queued release.
