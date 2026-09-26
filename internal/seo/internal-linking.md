# DataDocks internal linking guide

Reviewed September 26, 2026. This is an editorial reference; it is excluded from the deployed site.

## Choosing the link

Choose the destination that answers the reader's next question. A company mention can link to the homepage or About page. A process explanation should usually link to an educational guide, a product capability to its feature page, and a buying decision to a comparison. Do not automatically link every occurrence of DataDocks or a keyword.

Use short, natural anchor text that describes the destination. Keep enough surrounding explanation for the link to make sense. Avoid vague wording, whole-sentence anchors, adjacent chains of links, and repeated links that add no navigational value. There is no fixed links-per-page or keyword quota.

Use ordinary HTML links with an `href`. Markdown links in article bodies and rendered feature fields already produce these. Choose published, indexable, canonical destinations that return HTTP 200. Do not route editorial links through tracking URLs or redirects. The keyword landing pages using `KeywordLandingLayout.astro` are intentionally noindexed and are excluded from this plan.

For each new article, review both directions: useful existing pages it should link to, and existing pages where a link to the new article would help. Check manually that the destination fulfils the anchor's promise. Preserve publication scheduling; never link to an upcoming article before it is available.

## Destination examples

| Reader's question | Suitable anchor | Destination |
| --- | --- | --- |
| What is the process? | dock scheduling explained | `/posts/what-is-dock-scheduling` |
| What happens outside the warehouse? | yard management | `/yard-management` |
| Which scheduling platform fits? | compare dock scheduling software | `/comparison` |
| Which yard system fits? | yard management software options | `/posts/best-yard-management-options` |
| How can carriers book? | carrier self-scheduling | `/datadocks-features/carrier-portal` |
| How are bookings constrained? | dock capacity limits | `/datadocks-features/capacity-limits` |
| How are systems connected? | WMS and TMS integrations | `/datadocks-features/integration` |
| What should we measure? | average dwell time | `/posts/dwell-time-in-trucking` |
| How should we prepare for volume spikes? | peak-season dock playbook | `/posts/peak-season-without-dock-chaos-a-complete-playbook` |
| What supports the company story? | Nick Rakovsky's interview on The New Warehouse | `/news/nick-rakovsky-the-new-warehouse-414` |

These are examples, not a requirement to repeat identical anchors everywhere. Descriptive branded anchors such as “DataDocks' carrier portal” are also appropriate when the sentence discusses the product.

## SEO and AI search

Google's guidance for AI Overviews and AI Mode carries over its ordinary SEO fundamentals, including discovery through internal links and accessible text. It does not prescribe special AI markup or files. For ChatGPT search, OpenAI identifies access for OAI-SearchBot as a discovery requirement. The repository already allows that crawler; CDN access needs separate verification if there are crawling problems.

Our practical inference is to keep related definitions, workflows, product capabilities and supporting company information easy to find and understand. Internal links support that structure; they do not guarantee rankings or AI citations. This change adds content links without a browser-side linking script, dependency, extra media request or content-collection scan.

## Review method

- Consulted official Google and OpenAI documentation and Ahrefs' explanation of its Link Opportunities report.
- Used the connected Ahrefs Site Audit data as supporting evidence, then independently inspected article bodies, rendered feature fields, routes and publication dates in the repository.
- The Ahrefs Link Opportunities UI presented a persistent security-verification screen. The user subsequently supplied its suggestion rows, which were reviewed against the current source. Filtered brand-only links to documentation, existing links (including fragment variants), same-page suggestions, and broad uppercase destinations. Adopted relevant scorecard and yard-software suggestions, correcting destinations where the surrounding passage needed a feature or definition instead. Current audit crawl data was still in progress and was treated as provisional.
- Prioritized the yard explainer, software comparison, practical operations guides, and articles with sparse body links. Kept educational definitions distinct from product links, including the container-terminal example that had pointed to a DataDocks feature.
- Added company-story links to existing interview and funding pages. Kept research exports and account metrics out of the repository.

After deployment and recrawling, review the same Ahrefs report for remaining useful suggestions. Compare canonical, indexable incoming links, search impressions/clicks, and relevant referral/conversion traffic over time. A higher link count alone is not the goal.

## Sources

- [Google: crawlable links and anchor text](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [OpenAI: publishers and developers FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq)
- [Ahrefs: how Link Opportunities works](https://ahrefs.com/blog/link-opportunities/)

## Implemented link map

59 new links and 9 revisions across 32 public pages. The table includes destination corrections and anchor improvements as well as additions.

| Source page | Anchor | Destination |
| --- | --- | --- |
| `/datadocks-features/capacity-limits` | peak-season dock playbook | `/posts/peak-season-without-dock-chaos-a-complete-playbook` |
| `/datadocks-features/capacity-limits` | trucks queue up | `/posts/loading-dock-congestion` |
| `/datadocks-features/carrier-portal` | ways logistics coordinators can add value | `/posts/10-ways-logistics-coordinators-add-value` |
| `/datadocks-features/carrier-portal` | carrier scorecarding | `/posts/carrier-scorecards` |
| `/datadocks-features/dock-dashboard` | automated alerts | `/datadocks-features/notifications` |
| `/datadocks-features/efficiency-reports` | average dwell time | `/posts/dwell-time-in-trucking` |
| `/datadocks-features/efficiency-reports` | carrier scorecards | `/posts/carrier-scorecards` |
| `/datadocks-features/integration` | connect your WMS or TMS | `/integrations` |
| `/datadocks-features/integration` | EDI | `/posts/edi-vs-api` |
| `/datadocks-features/yard-management` | yard search time | `/posts/yard-visibility` |
| `/datadocks-features/yard-management` | Yard management | `/yard-management` |
| `/posts/appointment-management-for-distribution-centers` | carrier scorecards | `/posts/carrier-scorecards` |
| `/posts/automated-store-replenishment-stock-errors` | clearer receiving procedure | `/posts/warehouse-receiving-process` |
| `/posts/automated-yard-operations` | yard management | `/yard-management` |
| `/posts/automated-yard-operations` | yard management system (YMS) | `/posts/best-yard-management-options` |
| `/posts/automated-yard-operations` | connect it to your WMS or TMS | `/datadocks-features/integration` |
| `/posts/best-yard-management-options` | carrier scorecards | `/posts/carrier-scorecards` |
| `/posts/comprehensive-guide-to-manufacturing-logistics` | Yard Management System (YMS) | `/posts/yard-management-process-flow` |
| `/posts/disadvantages-of-operating-without-dock-scheduling-software` | capacity limits | `/datadocks-features/capacity-limits` |
| `/posts/disadvantages-of-operating-without-dock-scheduling-software` | lack of dock visibility | `/benefits/see-everything` |
| `/posts/disadvantages-of-operating-without-dock-scheduling-software` | WMS, TMS, and ERP integrations | `/integrations` |
| `/posts/drop-trailer-vs-live-unload` | Peak seasons | `/posts/peak-season-without-dock-chaos-a-complete-playbook` |
| `/posts/drop-trailer-vs-live-unload` | EDI or API integration | `/posts/edi-vs-api` |
| `/posts/drop-trailer-vs-live-unload` | dock scheduling | `/posts/what-is-dock-scheduling` |
| `/posts/edi-vs-api` | carrier scorecards | `/posts/carrier-scorecards` |
| `/posts/enterprise-dock-scheduling` | capacity rules | `/datadocks-features/capacity-limits` |
| `/posts/enterprise-dock-scheduling` | structured reports | `/datadocks-features/efficiency-reports` |
| `/posts/enterprise-dock-scheduling` | dispute a detention claim | `/posts/truck-detention-accessorial-fees` |
| `/posts/enterprise-dock-scheduling` | comparison of dock scheduling platforms | `/comparison` |
| `/posts/how-to-build-your-logistics-tech-stack` | supply chain visibility | `/posts/ultimate-guide-to-supply-chain-visibility-for-industry-professionals` |
| `/posts/how-to-build-your-logistics-tech-stack` | working around WMS limitations | `/posts/how-to-get-around-limitations-warehouse-management-system` |
| `/posts/how-to-choose-the-right-platform` | dock scheduling software comparison | `/comparison` |
| `/posts/how-to-choose-the-right-platform` | Dock scheduling software | `/posts/what-is-dock-scheduling` |
| `/posts/how-to-choose-the-right-platform` | capacity limits | `/datadocks-features/capacity-limits` |
| `/posts/how-to-choose-the-right-platform` | carriers to schedule deliveries themselves | `/datadocks-features/carrier-portal` |
| `/posts/loading-dock-congestion` | dock scheduling process | `/posts/what-is-dock-scheduling` |
| `/posts/loading-dock-congestion` | capacity limits | `/datadocks-features/capacity-limits` |
| `/posts/loading-dock-congestion` | yard management | `/yard-management` |
| `/posts/robots-in-logistics` | yard management system | `/posts/best-yard-management-options` |
| `/posts/shadow-freight-spend-2-you-won-the-rate-but-you-lost-the-truck` | annual freight negotiations | `/posts/negotiate-with-carriers` |
| `/posts/shadow-freight-spend-2-you-won-the-rate-but-you-lost-the-truck` | carrier scorecards | `/posts/carrier-scorecards` |
| `/posts/shadow-freight-spend-2-you-won-the-rate-but-you-lost-the-truck` | appointment booking process | `/posts/what-is-dock-scheduling` |
| `/posts/supply-chain-kpis-you-need-to-track` | Yard Management System (YMS) | `/yard-management` |
| `/posts/time-slot-management` | carriers and partners to request appointments | `/datadocks-features/carrier-portal` |
| `/posts/time-slot-management` | compare dock scheduling software | `/comparison` |
| `/posts/warehouse-optimization-strategies` | Yard Management System (YMS) | `/yard-management` |
| `/posts/warehouse-without-its-best-supervisor` | warehouse management system | `/posts/what-is-a-warehouse-management-system-wms` |
| `/posts/warehouse-without-its-best-supervisor` | receiving procedure | `/posts/warehouse-receiving-process` |
| `/posts/what-is-a-warehouse-management-system-wms` | integrated with other logistics tech | `/datadocks-features/integration` |
| `/posts/what-is-a-warehouse-management-system-wms` | Yard Management System (YMS) | `/yard-management` |
| `/posts/what-is-a-warehouse-management-system-wms` | Select WMS solutions | `/posts/how-to-choose-a-warehouse-management-system` |
| `/posts/what-is-dock-scheduling` | time slot management | `/posts/time-slot-management` |
| `/posts/what-is-dock-scheduling` | automatic notifications | `/datadocks-features/notifications` |
| `/posts/what-is-dock-scheduling` | yard management | `/yard-management` |
| `/posts/what-is-dock-scheduling` | kinds of yard management software | `/posts/best-yard-management-options` |
| `/posts/when-capable-people-hide-broken-processes` | automated replenishment rollout | `/posts/automated-store-replenishment-stock-errors` |
| `/posts/when-capable-people-hide-broken-processes` | Training another clerk | `/posts/warehouse-without-its-best-supervisor` |
| `/posts/yard-management-process-flow` | detention fees | `/posts/truck-detention-accessorial-fees` |
| `/posts/yard-management-process-flow` | yard management | `/yard-management` |
| `/posts/yard-management-process-flow` | online appointment system | `/datadocks-features/carrier-portal` |
| `/posts/yard-management-process-flow` | Yard Management Systems | `/posts/best-yard-management-options` |
| `/posts/yard-visibility` | peak season | `/posts/peak-season-without-dock-chaos-a-complete-playbook` |
| `/posts/yard-visibility` | standard procedures for trailer placement | `/posts/yard-management-process-flow` |
| `/about` | Nick Rakovsky’s interview on The New Warehouse | `/news/nick-rakovsky-the-new-warehouse-414` |
| `/about` | FedDev Ontario’s support for DataDocks’ platform development | `/news/feddev-ontario-datadocks-funding-2025` |
| `/comparison` | yard management software | `/posts/best-yard-management-options` |
| `/yard-management` | yard management software | `/posts/best-yard-management-options` |
| `/yard-management` | dock scheduling software | `/posts/what-is-dock-scheduling` |
