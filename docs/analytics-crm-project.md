# DataDocks analytics and CRM project

Initialised: 21 September 2026. Initial scope was planning only. The user subsequently requested API tagging of the 41 manually identified contacts; see the backfill status below.

## Purpose and scope

Improve how DataDocks collects, understands, and uses pre-sales customer data:

- Google Analytics, Bing, and Ahrefs configuration and measurement quality.
- Customer personae and pre-sales user journeys.
- Lead data enrichment.
- Bento CRM and Google Analytics optimisation.

Email marketing performance optimisation and content creation/optimisation per se are excluded. Analysing page performance is in scope. The specific Bing products/accounts in scope remain to be established.

This document is the starting brief for this initiative within the existing website repository. It does not replace the website's other documentation. The existing `bentoCRM.md` is generic integration background; this brief defines the narrower project scope.

## First pilot: completed demo bookings

The user reports that datadocks.com forms send lead data to Bento before revealing a Calendly popover. Providing an email starts the process but does not establish that a booking was completed.

Desired outcome: add the exact tag `DemoBooked` to all contacts with a verified historical `demo_booked` event. The user has been unable to accomplish this through the native Bento interface.

Confirmed by the user: the event name/type posted to Bento when a user completes the Calendly process is exactly `demo_booked`. The earlier `booked_demo` wording was superseded by this clarification.

Existing tags containing `BookADemo` (sometimes alongside a year or month) mark users who provided their email and clicked “book a demo”, regardless of whether they subsequently interacted with the Calendly popover. These tags indicate initiation, not completion, and must remain distinct from the proposed `DemoBooked` tag. A date-selection or popover-view event alone is also insufficient evidence of completion. `DemoBooked` will mean “has recorded a completed booking”; attendance, cancellation, and current booking status are separate concepts.

This pilot should then identify pages associated with completed bookings and compare them with corresponding traffic to explore page conversion performance. It is a first step toward broader journey and persona analysis.

## Evidence supplied by the user

These are manual observations, not an independently verified audit. Test dates, browser conditions, and sample selection are not yet recorded. Do not infer population-wide rates from these examples.

### CTA observations

| CTA | Observed events and fields | Point to retain |
| --- | --- | --- |
| Home, top | `demo_event_type_viewed`, `Demo Subscriber`; `source=/posts`, `first_landing=/`; `1 - BookADemo`; last medium referral, initial medium/source direct | Source did not match submission page |
| Home, bottom | `Demo Subscriber` only; `source=/posts` | Source mismatch and missing viewed event |
| /posts, top | Both standard events; `source=/posts` | Source matched |
| /posts, bottom | `Demo Subscriber` only; `source=/posts` | Missing viewed event |
| /news | Both standard events; `source=/news` | Source matched |
| Yard-management comparison article, embedded micro-app | Viewed plus `DataDocks Demo Request`; `source=/posts/best-yard-management-options`, `first_landing=/`; no BookADemo tag | Distinct event and tag behaviour |
| Second reported micro-app observation | Both events; `source=/comparison` | Relationship to previous observation needs clarification |
| Home, middle multi-app component | Both events; `source=/` | Source matched |

Across all eight observations, Bento's built-in Referrer and Landing Page metadata were unset and Import Source was API. The custom fields section contained `source`, `first_landing`, and UTM values. Built-in metadata and custom fields must be considered separately.

### Natural-user histories (anonymised examples)

- `ns3`: subscriber, viewed, date selected; homepage source and BookADemo tag, with no booking event reported.
- `ab`: subscriber → viewed → date selected → booked → subscriber. First subscriber event contained email and source; the viewed event two seconds later introduced gclid, source, referrer, first landing, and initial/latest UTM fields. Date selection followed 16 seconds later, booking 30 seconds later, and an email-only subscriber event one second after booking. Source and first landing were `/datadocks-vs-opendock`; Google was labelled referral despite a populated gclid.
- `st1`: subscriber and viewed; the same comparison-page source/first landing, populated gclid, and a third-party domain in referral/UTM fields.
- `mm`: subscriber and viewed; homepage first landing/source, Google labelled referral.
- `sd`: ten events across multiple interactions. Source changed from `/datadocks-features/carrier-portal` to `/` before selection/booking, then back to the carrier-portal page in a later viewed event. Repeated subscriber events were present.
- `jg`: homepage first landing, `/datadocks-features/integration` consistently recorded as source, Bing labelled referral; subscriber, viewed, selected, subscriber, booked, with the last two simultaneous to the second.
- `vj` and `fw`: only an email-bearing subscriber event, no additional fields, BookADemo tag.
- `jj`: subscriber and viewed; only five fields, including gclid, homepage source/first landing, and direct UTM source/medium.
- `lac`: two `$subscribeLCCP` events and a `$click` on a gated PDF; source `/posts/logistics-coordinator-career-path`, tag `LogisticsCoordinatorCareerPath`, no other captured fields. This is a separate non-demo journey.

User hypotheses for missing fields/viewed events: browser/privacy/ad-blocking behaviour; leaving before the Calendly overlay finishes loading; Calendly cookie-consent behaviour. All remain untested. Source persistence/overwrites, component differences, and timing are additional investigation questions, not established causes.

## Initial documentation findings

Reviewed public Bento documentation on 21 September 2026; no account access or API requests were made.

- The API reference documents event creation through `POST /batch/events`, tag addition through subscriber commands (`add_tag`), and tags on batch subscriber imports. Retrieving historical events and tagging the resulting contacts are separate needs. The reviewed reference did not establish a historical event-listing route; this remains an access/export feasibility question, not proof that retrieval is impossible. [API reference](https://bentonow.com/docs/api/reference)
- Bento states that event writes can trigger automations, while batch subscriber imports do not. Do not assume replaying historical booking events is the appropriate backfill method. Endpoint selection and effects remain for a later investigation. [Developer introduction](https://bentonow.com/docs/developer_guides/introduction)
- Account/site scope, pagination, limits, and response handling should be checked when implementation is eventually planned. Credentials are not needed for this initial planning turn. [API conventions](https://bentonow.com/docs/api/conventions)
- Documentation entry point: [Bento docs](https://bentonow.com/docs).

## Manual booking-record discovery

The user subsequently found the records manually and supplied four screenshots of Bento event/person rows. All visible event types are `demo_booked`.

| Screenshot (conversation attachment) | Visible rows |
| --- | ---: |
| `codex-clipboard-a5213325-14ae-4285-b7b8-17a0b6173a2c.png` | 11 |
| `codex-clipboard-0d384140-5fac-4f62-8a11-a3100215f6c2.png` | 12 |
| `codex-clipboard-15051536-9084-4e1b-8815-b0fed33beff1.png` | 12 |
| `codex-clipboard-661e9958-99b1-483b-8269-39158966f418.png` | 6 |
| **Total** | **41** |

The 41 addresses have now been extracted and individually matched to existing contacts through the Bento API, with no duplicates. This is a manually identified cohort; screenshots alone do not establish exhaustive coverage of the account. The screenshots do not show event dates or page fields.

The user believes Calendly began posting this event to Bento around **12 June**. Treat this as a provisional instrumentation start date; the exact date and year have not been independently established. Absence of `demo_booked` before tracking began is not evidence that no demos were booked.

Manual discovery provides a candidate cohort without requiring historical-event API retrieval for these particular records. Further API discovery is no longer the prerequisite for planning this cohort's tagging. The user subsequently supplied first-landing and booking pages for this cohort (see below). Booking timestamps/reporting-period coverage remain to be established. Compare against traffic for a matching period with reliable event coverage, rather than automatically using all historical traffic.

## Lightweight roadmap

| Stage | Future work | Useful output |
| --- | --- | --- |
| 1. Establish booking evidence | Use the 41 manually located rows as the initial cohort; confirm coverage/start date and retain booking timestamps and page evidence | Reviewed cohort and a documented measurement period |
| 2. Plan and perform historical tagging | Build a deduplicated candidate list, review exceptions and existing tags, choose the update method, then verify additions without replaying bookings | Verified `DemoBooked` cohort and an audit of changes; a repeat run should not add noise |
| 3. Pilot page conversion analysis | Use booking-time page evidence, reconcile with Google Analytics traffic, and document attribution and coverage limitations | Page-level bookings, traffic, conversion metric, and confidence/unknowns |
| 4. Improve collection and configuration | Map CTA variants and events; investigate source, UTM, metadata, consent, duplicates, and missing fields; review Google Analytics, Bing, and Ahrefs setup | Prioritised measurement improvements and consistent field/event definitions, including future booking tagging |
| 5. Extend insights and enrichment | Define useful lead attributes and their provenance, explore persona and journey patterns, and connect findings to pre-sales decisions | Evidence-backed segments, enrichment priorities, and repeatable reporting |

Manual record discovery was performed by the user. The assistant subsequently extracted the addresses and submitted the requested API tagging; see backfill status below. Tracking and configuration changes remain future work.

## Measurement principles to settle before analysis

- Keep first landing, CTA submission page, booking-time page, and later profile source distinct. The current contact profile alone may not preserve booking-time attribution.
- A contact tag identifies a cohort; it does not preserve booking dates, page history, or repeated bookings. Retain event-level evidence for analysis.
- Choose a compatible numerator and denominator: unique people, bookings, sessions, and pageviews answer different questions. “Bookings per pageview” is not automatically a visitor conversion probability.
- Align date range, timezone, page-path normalisation, attribution window, and test/internal-traffic exclusions. Keep unknown page attribution visible, and show counts alongside rates for small samples.
- Establish Google Analytics coverage and identity/session matching feasibility before treating CRM-to-analytics ratios as precise conversion rates.
- Treat existing UTM/referral values as observations until their collection rules are understood; gclid plus “direct” or “referral” warrants investigation, not automatic reclassification.

## Account details supplied by the user

- Plan: **Legacy**. Available historical-event retrieval/export capabilities and subscriber-search access are not yet confirmed for this plan.
- DataDocks site UUID: `b4cb9a34a989bcc643714151df7b7154`.
- Key listing: **API key 4845**, Active; access to **all teams and sites the user can access**. The UI reported “Used 9h ago” when the user supplied these details; this is not a live status.
- Existing credentials were subsequently located in the project's ignored `.env` file (`PUBLIC_BENTO_KEY`, `SECRET_BENTO_KEY`, `PUBLIC_BENTO_SITE_UUID`). The configured site matched the user-supplied UUID, and API authentication succeeded. Secret values are not reproduced in project documentation or audit outputs.
- Historical `demo_booked` API retrieval remains unresolved; key access scope does not by itself establish endpoint availability on the Legacy plan. Manual discovery now supplies the initial cohort independently of this API question.

## Backfill status

- User requested API execution for the screenshot cohort.
- All 41 unique extracted addresses matched existing Bento contacts. None had `DemoBooked` before the update.
- Submitted one `POST /batch/subscribers` request containing only each contact's email and `tags: DemoBooked`. Bento reported 41 accepted and zero failed. Subsequent individual API reads confirmed all 41 contacts have `DemoBooked`, with no pending records. Existing tag IDs, custom fields, subscription status/reason, and attribution were unchanged in the before/after comparison.
- Extracted records, pre-update snapshots, request/response, and verification results are saved locally outside the website repository at `/Users/work/.codex/visualizations/2026/09/21/01a0c403-42eb-7292-85dd-5e524d0e2e16/bento-demo-booked/`.
- No booking events were recreated. The batch subscriber endpoint is documented not to trigger Flows/Automations.

## User-supplied landing and booking pages

Recorded all 41 contacts' first-landing and booking pages in [journeys.json](/Users/work/.codex/visualizations/2026/09/21/01a0c403-42eb-7292-85dd-5e524d0e2e16/bento-demo-booked/journeys.json), alongside their emails, event/tag, and source provenance. The original extraction and API audit remain separate and unchanged. These are user-supplied manual observations, not newly verified API event data. No Bento fields were modified.

Nine contacts have individually supplied page pairs. The other 32 explicitly landed on `/` and booked on `/`, as stated by the user; this is not an inferred fallback for missing data. Page paths are preserved exactly as supplied. First landing and booking page do not establish the complete sequence of intermediate visits.

### Booking-page counts ready for traffic input

| Booking page | Contacts with a recorded demo booking |
| --- | ---: |
| `/` | 33 |
| `/benefits/see-everything` | 2 |
| `/datadocks-features/carrier-portal` | 2 |
| `/datadocks-vs-opendock` | 2 |
| `/benefits/delight-carriers` | 1 |
| `/datadocks-features/integration` | 1 |
| **Total** | **41** |

### First-landing counts retained separately

| First landing page | Contacts |
| --- | ---: |
| `/` | 34 |
| `/datadocks-vs-opendock` | 3 |
| `/datadocks-features/carrier-portal` | 1 |
| `/integrations/netsuite-erp` | 1 |
| `/posts/best-yard-management-options` | 1 |
| `/posts/what-is-a-warehouse-management-system-wms` | 1 |
| **Total** | **41** |

The requested comparison is booking-page counts divided by page views, multiplied by 100. Counts represent unique contacts in this 41-person cohort, not a separately established total of all booking occurrences. Do not confuse a page's share of these 41 bookings with its conversion rate.

## GA4 traffic and preliminary page conversion

Source: user-supplied GA4 **Engagement → Pages and screens**, dimension **Page path and screen class**, **12 June 2026–18 September 2026**. The first numeric column is **Views**, followed by Active users, Views per active user, and Average engagement time per active user. Reporting timezone is not supplied. The follow-up integrations screenshot is treated as the same date range based on conversation context; it does not display dates itself.

All 38 supplied page rows, report subset totals, displayed percentage shares, and engagement measures are preserved in [ga4-page-traffic.json](/Users/work/.codex/visualizations/2026/09/21/01a0c403-42eb-7292-85dd-5e524d0e2e16/bento-demo-booked/ga4-page-traffic.json). Rows and totals are kept separate; the posts and features screenshots show only part of their respective subsets. Percentage shares in the subset screenshots are relative to those subsets, not uniformly site-wide.

Preliminary calculation: **booked contacts attributed to the page ÷ GA4 views × 100**. It assumes all 41 contacts' relevant bookings fall within the supplied date range; this has not been verified against event timestamps. This is a CRM-to-GA4 ratio, not GA4's native session/user conversion rate.

| Booking page | Booked contacts | Views | Bookings / views |
| --- | ---: | ---: | ---: |
| `/datadocks-features/integration` | 1 | 150 | 0.667% |
| `/benefits/see-everything` | 2 | 422 | 0.474% |
| `/benefits/delight-carriers` | 1 | 244 | 0.410% |
| `/datadocks-features/carrier-portal` | 2 | 524 | 0.382% |
| `/` | 33 | 24,580 | 0.134% |
| `/datadocks-vs-opendock` (both slash variants) | 2 | 3,916 | 0.051% |

Opendock views combine 3,081 for `/datadocks-vs-opendock` and 835 for `/datadocks-vs-opendock/`, treating trailing-slash variants as the same analytical page. Raw rows remain intact. Active users (2,338 and 684) are not summed into a deduplicated audience; users may appear in both rows. Other unsupplied URL variants are not assumed to have zero traffic.

Integration screenshot recorded: NetSuite ERP 661 views / 494 active users; Microsoft Power BI 127 / 104; SAP S/4HANA 220 / 101; Microsoft SSO Entra 60 / 37; Oracle Fusion Cloud 40 / 35; SAP Business ByDesign 30 / 25. Total: 1,138 views and 771 active users. NetSuite is the first landing page for one booked contact whose booking page is `/benefits/delight-carriers`; it has zero booking-page credits within this cohort. First-landing effectiveness would require a separately defined denominator, rather than interpreting all page views as landings.

The user confirmed both differences were typos in the manual notes. Corrected landing-page paths are now linked to their GA4 traffic:

- Manual `/posts/best-yard-management-systems` versus GA4 `/posts/best-yard-management-options` (876 views).
- Manual `/posts/what-is-a-warehouse-management-system` versus GA4 `/posts/what-is-a-warehouse-management-system-wms` (1,763 views).

The corrected paths are saved in the contact journeys, with the original strings retained as provenance. This does not change the six booking-page rates above. Most non-homepage booking counts are only one or two; the ranking is descriptive, not yet strong evidence of a persistent performance difference.

## Proposed 50/50 influence heuristic

Assign 0.5 credit to first landing and 0.5 to booking page per contact (1 total if the same page). Divide credit by GA4 views and multiply by 1,000. This is a proposed prioritisation score, not a measured conversion probability or causal effect. It omits intermediate pages and retains the unverified booking-period alignment noted above.

| Page | Credits | Views | Credits per 1,000 views |
| --- | ---: | ---: | ---: |
| `/datadocks-features/integration` | 0.5 | 150 | 3.33 |
| `/datadocks-features/carrier-portal` | 1.5 | 524 | 2.86 |
| `/benefits/see-everything` | 1 | 422 | 2.37 |
| `/benefits/delight-carriers` | 0.5 | 244 | 2.05 |
| `/` | 33.5 | 24,580 | 1.36 |
| `/integrations/netsuite-erp` | 0.5 | 661 | 0.76 |
| `/datadocks-vs-opendock` | 2.5 | 3,916 | 0.64 |
| `/posts/best-yard-management-options` | 0.5 | 876 | 0.57 |
| `/posts/what-is-a-warehouse-management-system-wms` | 0.5 | 1,763 | 0.28 |

All 41 booking credits reconcile. Preserve raw contributing-contact counts alongside scores; most non-homepage results rest on only one or two people.

## Excluding Gmail, Yahoo, and iCloud contacts

User-requested analytical comparison using the same proposed 50/50 attribution model. Seven Gmail contacts are excluded; no Yahoo or iCloud addresses occur in this cohort. All observed email domains were checked against the requested providers. The cohort falls from 41 to 34 contacts/credits. Outlook and mail.ru contacts remain, so the result is not a business-email-only cohort. Original data and Bento tags are unchanged.

| Page | Original credit | Filtered credit | Filtered credit / 1,000 views |
| --- | ---: | ---: | ---: |
| `/datadocks-features/integration` | 0.5 | 0.5 | 3.33 |
| `/datadocks-features/carrier-portal` | 1.5 | 1.5 | 2.86 |
| `/benefits/see-everything` | 1 | 1 | 2.37 |
| `/benefits/delight-carriers` | 0.5 | 0.5 | 2.05 |
| `/` | 33.5 | 28 | 1.14 |
| `/integrations/netsuite-erp` | 0.5 | 0.5 | 0.76 |
| `/posts/best-yard-management-options` | 0.5 | 0.5 | 0.57 |
| `/datadocks-vs-opendock` | 2.5 | 1.5 | 0.38 |
| `/posts/what-is-a-warehouse-management-system-wms` | 0.5 | 0 | 0.00 |

Only three pages lose credit: homepage 33.5 → 28, Opendock comparison 2.5 → 1.5, and the WMS article 0.5 → 0. All other credits are unchanged. Original GA4 views are retained: this score measures retained-cohort credit per all recorded page views, not a conversion rate among business-email visitors. Reporting-period alignment and small-sample limitations still apply. The full local comparison and exclusion provenance are in `bento-demo-booked/page-influence-excluding-gmail-yahoo-icloud.json` alongside the other audit files.

## Next-session starting point

Receive any additional traffic/cohort inputs. Confirm that the 41 booking records fall within 12 June–18 September 2026, the GA4 timezone, and any remaining URL-variant coverage before extending the analysis. The approximate 12 June tracking start remains provisional. Preserve first-landing and booking-page attribution separately. No further API calls or configuration changes are needed merely to receive the next inputs.
