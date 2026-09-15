# News & updates

Design and content prepared 15 September 2026 on `codex/news-hub`. Local route: `/news`. This work has not been deployed.

## Content decisions

| Supplied item | Original date shown | Treatment |
| --- | --- | --- |
| SupplyTech Breakthrough 2026 | 18 June 2026, DataDocks announcement | `/news/supplytech-breakthrough-award-2026`; official winners and original announcement linked |
| Inc. Best in Business 2025 | 4 December 2025, DataDocks announcement | `/news/inc-best-in-business-2025`; exact two categories, official profile and company announcement linked |
| Best in Biz gold 2025 | 10 December 2025, DataDocks announcement | `/news/best-in-biz-gold-2025`; gold and exact category, official winners linked |
| CNBC freight data | 2 April 2025 | `/news/cnbc-freight-booking-data-april-2025`; original context for DataDocks appointment figures |
| Recycling Today launch | 2 March 2016 | External card; historical launch context, no obsolete pricing reproduced |
| Bloomberg snow-cooled data centres | 29 October 2020 | Excluded: source concerns DataDock Inc. in Japan, a different company |
| CNBC tariff costs | 1 April 2025 | External card with context about Nick Rakovsky's contribution |
| Material Handling Wholesaler episode 414 | 28 August 2023 | Secondary source on the one podcast page |
| The New Warehouse episode 414 | 28 August 2023 | `/news/nick-rakovsky-the-new-warehouse-414`; one interview, two publication locations |
| Komi design project | 2024 project year | External company-news card; source does not state an exact publication date |
| Government of Canada / FedDev Ontario | 4 March 2025 | `/news/feddev-ontario-datadocks-funding-2025`; $750,000 contribution and legal/operating-name connection supported by official sources |

Result: nine distinct entries, six original DataDocks story pages, three direct external destinations. Original prose adds context; it does not reproduce publisher articles or charts. Bloomberg exclusion source: https://www.bloomberg.com/news/articles/2020-10-29/japan-wants-to-take-the-heat-off-data-centers-with-the-help-of-snow .

## Page and discovery design

- Three selected awards anchor the page with original typographic artwork. These are not official award badges.
- The complete dated list also includes those highlights, so filtering never hides a story merely because it is featured elsewhere.
- Type and year filters combine, update the address, announce result counts, and provide an empty state and reset. All entries and links are in the initial HTML; JavaScript enhances filtering.
- Resources, About and the existing press-contact email connect the page to the rest of the website. The footer links back to News & updates.
- Self-canonical detail pages include original summaries, clear DataDocks attribution, source links and contextual product/resource links. CollectionPage, ItemList and NewsArticle metadata describe visible content.
- Search and AI discoverability depend on useful, crawlable content and clear sourcing. No ranking or citation outcome is guaranteed.

## Editing and growth

`News & updates` is a separate Keystatic collection at `src/content/news`. Story type and format are distinct. Supported types include product updates, awards, press, interviews and company news. Product updates will appear in the filter automatically after one is published; the page does not show empty placeholder categories.

- `destination: internal` creates one `/news/<slug>` page from the original MDX body.
- `destination: external` creates a hub entry linking to the source; no thin local page is generated.
- `eventDate` records the original source/announcement date, or a known year. Keep unknown historical dates blank.
- `publishedAt` and `updatedAt` record the actual DataDocks page dates. The current retrospective pages use 15 September 2026 and visibly distinguish that from historical event dates. Adjust publication dates to the actual publication decision if launch is later.
- For an original product update, use `dateContext: Published`; its `publishedAt` supplies the display date if no event date is needed. An external source is optional for original DataDocks updates.
- Draft and future-dated records are excluded from generated pages. Publishing a scheduled item still requires a build/deployment; this task does not add a scheduler.
- `featured` selects award highlights. The shared `getNewsItems()` helper is ready to supply selected entries to the `/posts` revamp or About without copying stories.

The separate Resources branch has not been edited. Its future Latest from DataDocks section can consume this helper and link directly to these canonical destinations.

## Homepage consistency

News navigation and story demo links use the email-first prompt from `codex/homepage-redesign`. The shared capture helper waits for a confirmed save through `/api/bento-track` before opening Calendly, with the email prefilled and attribution retained. The component and helper keep their homepage-branch paths to support a later merge. Standalone news pages also support direct `#book-demo` links and an email contact fallback without JavaScript.

Orange artwork and CTAs use white text. Reading copy and CTA labels use Recoleta, display headings use Bruta, and compact metadata uses Inter; paper colors match the homepage design. Verified desktop and mobile prompts, mobile menu closure, and tablet award artwork. The six existing email-capture tests, Astro checks, and production build pass.

## Research

Detailed source checks and date distinctions: [awards](news-research-awards.md) and [media and government announcement](news-research-media.md).
