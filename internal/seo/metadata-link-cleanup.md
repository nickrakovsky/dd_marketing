# Search metadata and internal links

October 27 follow-up: refreshed this branch against current main, retaining the
current approved vendor snapshots and the retail article's interactive artwork.
Added search titles for the newly flagged ingredient-traceability and
frozen-food-network-fit articles, bringing the reviewed title count to 33.

The audit flagged 31 indexable URLs with long search titles, six with long meta
descriptions and ten with a single incoming dofollow internal link.

`src/data/seo-metadata.ts` holds reviewed search and social snippets for these
specific URLs. The shared layout also uses them for WebPage name/description.
Visible article headlines, editorial titles, article schema headlines, dates,
slugs, canonical URLs and campaign indexing rules retain their current values.
The entries are deliberately written, not mechanically truncated. They retain
the topic and avoid adding a year solely to imply freshness.

## Contextual links added

| Existing source | Destination |
| --- | --- |
| Retail case studies: stockouts | `/posts/retail-stockouts-despite-inventory` |
| Warehouse management career: structured handover | `/posts/warehouse-without-its-best-supervisor` |
| Overtime scheduling: capacity response | `/posts/warehouse-spare-capacity` |
| Products/channels readiness: fulfilment margin | `/posts/food-fulfilment-economics` |
| Supervisor cover: knowledge held by one person | `/posts/when-capable-people-hide-broken-processes` |
| Shadow freight part 2: physical dock friction | `/posts/shadow-freight-spend-1-why-freight-plans-break-at-the-dock-door` |
| Shadow freight part 1: carrier availability | `/posts/shadow-freight-spend-2-you-won-the-rate-but-you-lost-the-truck` |
| The New Warehouse interview: related funding update | `/news/feddev-ontario-datadocks-funding-2025` |
| Funding update: related founder interview | `/news/nick-rakovsky-the-new-warehouse-414` |
| CNBC booking-data report: earlier Bloomberg report | `/news/bloomberg-tariffs-freight-bookings-march-2025` |

These sources and destinations were published by the audit date. Links use
ordinary anchors and canonical relative destinations. The news entries use the
existing relatedLinks component. No future publication dates change.

Open PR #240 has a broader linking pass. These placements were checked against
its diff; none duplicates its source/anchor placement. It independently adds
other links to the supervisor and news articles.

Length warnings are editorial signals, not proof of a ranking penalty. Confirm
the deployed HTML, recrawl, and evaluate non-brand clicks and qualified demos.
