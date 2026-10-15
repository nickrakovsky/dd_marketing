# Warehouse audit checklist

*Editorial draft for Post 1, updated 15 October 2026 for asset 5 approval and its new contextual paragraph; the stock-location revision remains unchanged and awaits human review. The checks, quotations and placement instructions remain working material for human authorship and further prose development. Design markers are not publication copy. See the [visual and interaction brief](warehouse-audit-visual-and-interaction-brief-turn-2.md) and [bibliography](warehouse-audit-article-bibliography.md).*

*The user explicitly approved the current iceberg on 14 October: “That's perfect. let's approve this asset and identify the next”. Freeze its copy and visual presentation unless further edits are requested. Its local approval commit is `2fbbe36`, without push or publication. The subsequently generated asset 5 replacement is rejected; retain the original and remove it from the replacement queue.*

*Asset 5 approved and frozen, 15 October 2026. The user approved the hybrid cleanup with two final edits: remove the visible “Dock scheduling: from chaos to control” title and replace “Unscheduled chaos” with the exact label “First Come First Serve”. Both are applied in `AuditDockFlow.astro`; the figure keeps an accessible name without a visible title. Preserve its two-row composition, SVG trucks, live labels, transparent carton artwork, theme styling, section placement and `audit-dock-illustration` anchor unless the user requests further changes. The original WebP remains unchanged; the active local preview uses the approved hybrid. The separately requested dock-scheduling paragraph now introduces the figure and connects the scene with audit evidence. Targeted component/overview source compilation passed after these edits, and a body-discarded status-only request returned HTTP 200 on port 4338. No automated design checks or generated-output inspections were performed. Asset 4 stays frozen; other review statuses, the three CTA placements and production are unchanged. The earlier restoration and rejected v1 remain history; the integration review-pending status is superseded. Exact extraction prompts remain in `docs/artwork/warehouse-audit-dock-cleanup-v2-prompts.txt`.*

*Original asset 5 retained and restored, 14 October 2026: the user says the original is great and the replacement terrible. The earlier retirement decision was overly broad, expanding a concern about implied causal wording into replacing a useful illustration. The unchanged `src/assets/blog-images/warehouse-audit-checklist-5.webp` is restored after the opening Technology and the people doing the work paragraph, before its conclusion, at `audit-dock-illustration`. No new prose, caption or image modification is added. Overview source compilation passed; a body-discarded status-only request returned HTTP 200 on port 4338. Production is untouched and no new checkpoint was requested. No regeneration is commissioned. The rejected v1, `output/imagegen/warehouse-audit-dock-v1.png`, and exact prompt, `docs/artwork/warehouse-audit-dock-v1-prompt.txt`, remain historical. No automated design/render/image/browser/geometry/contrast/font-metric checks were performed.*

Operating a warehouse requires managing the constant tension between speed, safety, and accuracy. A warehouse audit compares what happens on the floor and in the records with the requirements the operation is meant to meet. This checklist helps you plan that review, investigate discrepancies and put the findings in front of someone who can act.

## Take the audit into your next review

**Coming soon: files and signup are not available yet.**

The planned Excel workbook and printable PDF sheets will help you take your review questions, evidence and action records into a team discussion. When available, the pack will come with an optional DataDocks email subscription. The public article and checklist remain free to use without subscribing.

*Early complete pack preview at `warehouse-audit-working-pack`, directly after the opening paragraph. Keep the pack benefit, subscription exchange and coming-soon/unavailable status visible before the restored native disclosure. `AuditPackDisclosure.astro` supplies the two-line, full-width treatment with an outlined circular chevron: title “Excel and PDF audit pack”, action “Preview pack contents and download”. One outer border encloses the summary and padded open body, which share the same edges; the signup is inset inside that panel. It opens `AuditPackContents.astro` artwork, full contents and an inactive accepted signup prototype, using email ID `audit-preview-email`. The repeat before planning uses the same disclosure component, while the later full offer uses the shared contents directly. Give all three email fields unique IDs. Keep the early preview self-contained and its contents-navigation entry first. V01 remains the opening illustration. Omit the unbuilt planner from current navigation. Keep inherited sentence-case typography, no text shadow and the agreed spacing.*

*Disclosure implementation states: closed cream `#fff8e9`; open sand `#efe2d2` header and cream body inside the shared border. Closed hover uses sand. Open hover keeps its sand header and highlights the toggle orange. Keyboard focus gives an orange outline and toggle; pressing uses deeper sand `#e5d3b3`. Retain the existing dark palette. Hover applies only to hover-capable pointers, and reduced-motion preferences disable transitions. These are implementation facts for human review.*

**Inside “Preview pack contents and download”:**

- Show the approved overlapping-file artwork through `AuditPackContents.astro`, shared by all three placements. Replace design sketches with crops of delivered files before launch.
- **Excel workbook:** editable scope, evidence, findings and action records.
- **PDF field sheets:** printable records for the floor review.
- **Completed examples:** examples showing how to record evidence, unresolved questions and follow-up.
- **Management review template:** a record of findings, missing evidence, actions and decisions needed.
- **One inactive field:** Email address. **One inactive button:** Subscribe & get the audit pack.
- **Status visible before opening the preview:** Coming soon. Downloads and email signup are not available yet.
- **Conditional future exchange:** When the pack is available, you’ll be able to subscribe to DataDocks emails about warehouse guidance and product updates and receive the Excel and PDF files. Unsubscribe anytime. Link the applicable privacy notice.

*Signup treatment: use a joined cream input and orange button where the panel's available width allows; stack them within narrow containers. Controls use normal-weight Recoleta, with a small Inter label and disclosure. Parent padding contains the joined row or stack. Keep the form inset in the shared pack panel, with no separate form card. The one-field prototype remains disabled.*

*The pack is a generic reusable set of files for the reader's working records. The exact accepted launch button, disclosure and fulfilment remain in the future pack handoff below and the step 10 specification. Do not activate email capture or files, promise immediate availability now or send readers to find another offer later.*

## What is a warehouse audit

A warehouse audit is a structured review of a physical warehouse's activities, records and controls against defined requirements. Its scope depends on the question being asked: whether inventory records are reliable, whether goods are handled as required, whether charges are supported, or whether corrective work has actually solved a problem.

Recurring stock differences may prompt a review of the work between counts. A concern about late dispatches or storage conditions may call for operating records and observations. A customer review or warehouse-provider renewal may require evidence against the agreement and the customer's requirements. Establish the decision the review supports, whose requirements apply and who can act on the findings.

*Asset 1, accepted 2 October 2026: `src/assets/blog-images/warehouse-audit-drift-approved-v1.png` preserves the approved v4 raster locked and unchanged. It replaces the provisional opening sketch in the preview at `audit-drift-figure`. The visible HTML caption is exactly “Illustrative drift and recovery”, in small Inter type directly joined to the image with no gap. The artwork wrapper now uses one even all-around shadow with .5rem corners and hidden overflow, replacing the rejected external blurred backdrop and the earlier inner feathering. The image stays sharp and fully opaque, with no duplicate backdrop, blur pseudo-element or masks. The user called the current framing “perfect” and asked to proceed to the next asset; this framing is accepted.*

## The practical warehouse audit checklist

You can’t fix what you don’t look at. Start with the areas relevant to your review, and record what supports each answer.

Use **Check against** to establish the applicable requirement, **Look for** to identify evidence and **If unclear** to decide the next step. A missing reference or contradictory account should remain visible. The 28 checks below are a starting framework to adapt to the actual review, not a claim to cover every industry's requirements.

*Design: preserve the approved checklist model: eight static sentence-case area headings and a compact index explicitly labelled “Jump to an area in this checklist”. Each area anchor keeps its final word and existing `LinkIcon.astro` down chevron together in one nowrap inline span; only the label is underlined. Each complete numbered question is the only native disclosure in the checklist: its number, title, full question and a simple chevron form one summary. Keep the period attached to the number with nowrap text in the wider number column. Guidance opens inside that question and aligns with its heading text. The first question starts open. Remove area disclosures, separate “Evidence and follow-up” controls, interactive check counts and circular-arrow styling. Shared question links open their destination; printing opens all guidance and then restores previous states. Preserve all public check content. Stable IDs, source references and limitations live in the [shared editorial checks](warehouse-audit-checks.json) for the applet and later pack.*

### Inventory accuracy and storage

**Count versus record.** Do the quantities in selected locations agree with the inventory records for the same point in time?

- **Check against:** Establish the item, unit, location, count boundary and comparison time before interpreting a difference.
- **Look for:** Compare count notes with stock records and movements around the count; retain the sample, timing and any recount.
- **If unclear or a concern appears:** Resolve timing or unit uncertainty, record the unexplained variance and assign investigation before treating an adjustment as closure.

**Item, location and unit identity.** Can the team distinguish the item, storage location and handling unit without having to guess?

- **Check against:** Check against the operation's agreed item, location and unit definitions, including relevant pack-size changes.
- **Look for:** Trace selected labels, item records, locations and transaction entries; ask workers how similar-looking products or changed packs are distinguished.
- **If unclear or a concern appears:** Record the specific ambiguity and affected transactions, then identify who can correct the definition and check the resulting records.

**Discrepancies and recurrence.** When stock discrepancies return, does the team investigate what happens between counts?

- **Check against:** Establish how discrepancies should be reported, investigated and closed, separately from correcting the balance.
- **Look for:** Follow selected recurring differences through adjustments, movement records, worker accounts and earlier actions; retain competing explanations and gaps.
- **If unclear or a concern appears:** Assign the next evidence request and an investigation owner. Identify what a later check would need to show before calling the problem resolved.

### Receiving through dispatch

**Receipt identification and exceptions.** Can you trace what arrived, what was accepted and what happened to any discrepancy?

- **Check against:** Identify the receipt, acceptance and exception requirements for the goods and transaction being reviewed.
- **Look for:** Compare expected shipment details, receipt records and recorded damage or shortages; ask who decided the disposition and informed the next team.
- **If unclear or a concern appears:** Record any missing decision or broken record link, and assign the person responsible for resolving that receipt exception.

**Putaway and staging handoffs.** Do accepted goods reach the intended storage location with their status and records still clear?

- **Check against:** Confirm the site's putaway, staging and exception arrangements for the goods, including who owns each handoff.
- **Look for:** Trace selected receipts from staging to storage and record updates; observe delays, unclear ownership or goods awaiting a decision.
- **If unclear or a concern appears:** Separate an unrecorded movement from a physical delay, establish the dependency and assign the next responsible action.

**Picking and dispatch verification.** Can the team connect the authorised order, prepared goods and recorded release to the same shipment?

- **Check against:** Establish the operation's order, verification and release requirements, including authority to resolve a mismatch.
- **Look for:** Compare selected pick or release instructions, item quantities, shipment records and handover details; examine how changes or shortages were communicated.
- **If unclear or a concern appears:** Identify the failed or uncertain handoff and its owner. Keep checking this shipment distinct from reviewing recurring process failures.

**Arrival timing and resource coordination.** Does the team have the information and resources needed for the arrivals and departures it must handle?

- **Check against:** Establish the relevant service commitments, operating constraints and responsibilities for communicating or changing the plan.
- **Look for:** Compare planned and actual timing with workload, staffing, available space and exception records across selected operating periods.
- **If unclear or a concern appears:** Investigate which constraint affected service before choosing an intervention; assign any unresolved coordination or resource decision to its owner.

### Warehouse layout and flow

**Usable space and congestion.** Where does work queue or spill into space needed for another activity?

- **Check against:** Confirm the intended use and relevant constraints of each area for the operating conditions being examined.
- **Look for:** Observe selected busy and quieter periods; compare queues, space use, workload and available resources with the plan and worker explanations.
- **If unclear or a concern appears:** Distinguish a recurring constraint from an isolated event, and identify the evidence needed before changing capacity or layout.

**Slotting, travel and replenishment.** Does the placement of stock support the picking, replenishment and handling work people actually perform?

- **Check against:** Establish the relevant product, handling, access and workload requirements rather than assuming one arrangement suits every item.
- **Look for:** Follow selected pick and replenishment paths; compare item activity, travel, repeated interruptions and worker accounts with the placement rationale.
- **If unclear or a concern appears:** Record the constraint and competing explanations, then identify who should assess a proposed change and its effects.

**Housekeeping and recurring obstructions.** When clutter or obstructions return, is there a clear owner and an explanation beyond clearing them again?

- **Check against:** Identify the site's relevant housekeeping, access and storage requirements and the responsibility for acting on exceptions.
- **Look for:** Compare current observations with earlier reports, assigned work and worker accounts of why material accumulates.
- **If unclear or a concern appears:** Follow the site's response arrangements for current concerns, then assign investigation of recurring causes and a check that the action worked.

### Equipment and machinery

**Inspection and maintenance coverage.** Are the equipment inspections and maintenance required for this operation identifiable, assigned and supported by records?

- **Check against:** Confirm the applicable equipment instructions, inspection requirements and competence needed with the responsible equipment owner.
- **Look for:** Match selected equipment to its identity, inspection and maintenance records, due work and the people responsible.
- **If unclear or a concern appears:** Refer missing coverage or uncertain criteria to the appropriate owner or competent reviewer; do not fill the gap with a generic checklist.

**Defect reports and operating restrictions.** Can people report an equipment defect and find out what restrictions or action apply?

- **Check against:** Establish the defect-reporting and response arrangements, including who is authorised to assess the equipment.
- **Look for:** Trace selected defect reports to decisions, communications and current operating status; ask affected workers what they were told.
- **If unclear or a concern appears:** Escalate missing or conflicting status information through the site's responsible owner. Keep any technical assessment with a person competent for that equipment.

**Repair and return to use.** What evidence supports returning equipment to use after a reported defect or repair?

- **Check against:** Confirm the applicable acceptance requirements and who can authorise the change in operating status.
- **Look for:** Follow selected defects through repair records, assessment or checks required for acceptance, remaining restrictions and communication to users.
- **If unclear or a concern appears:** Keep missing acceptance evidence visible and refer the decision to the authorised owner; a completed work order alone may not answer the readiness question.

### People and workplace safety

**Site hazards and controls.** Do the controls for identified site hazards match the work being performed?

- **Check against:** Establish the applicable hazard assessments, requirements and control arrangements with the responsible safety and operating owners.
- **Look for:** Compare recorded controls with observations, worker accounts, reported concerns and changes in goods, equipment or activity.
- **If unclear or a concern appears:** Route an immediate concern through the site's response process. Assign unresolved control questions to the competent owner and record the evidence still needed.

**Competence and handover.** Do people know how to perform their assigned work and pass unresolved issues to the next responsible person?

- **Check against:** Confirm the task's competence requirements and the site's arrangements for handover, exceptions and escalation.
- **Look for:** Compare preparation records with explanations and observed work; follow a selected unresolved issue across a shift or team boundary.
- **If unclear or a concern appears:** Identify whether the gap concerns preparation, instructions, authority or communication, then assign support and a suitable follow-up check.

**Workload, worker accounts and practical constraints.** What makes it difficult for people to follow the agreed process or report a problem?

- **Check against:** Establish the expected work, available resources and reporting responsibilities for the shifts and tasks reviewed.
- **Look for:** Combine worker accounts with workload, interruption and exception records; examine whether instructions or performance measures pull people in different directions.
- **If unclear or a concern appears:** Preserve differing accounts, test the explanation against records and observations, and escalate resource or authority constraints to the person who can change them.

### Goods protection and specific requirements

**Access, custody and loss controls.** Can the operation account for who had custody of selected goods and how unexplained losses are handled?

- **Check against:** Identify the applicable custody, access and loss-reporting controls for the goods, ownership arrangement and review purpose.
- **Look for:** Trace selected goods through movement and handover records; compare any access records, loss reports and assigned investigations.
- **If unclear or a concern appears:** Separate a missing record from an established loss or wrongdoing, and assign unresolved custody or security questions to the appropriate owner.

**Product condition and traceability.** Can the team establish the identity, recorded condition and relevant movement history of selected goods?

- **Check against:** Confirm the product, customer and applicable assurance requirements, including which identifiers and condition records matter.
- **Look for:** Trace selected goods through receipt, storage and release records, including condition exceptions, holds and disposition decisions where relevant.
- **If unclear or a concern appears:** Identify the break in the evidence chain and the responsible product or quality owner; preserve uncertainty about condition or acceptability until assessed.

**Controlled goods and customs requirements.** Where controlled goods or customs arrangements apply, can the team identify the requirements and produce the relevant evidence?

- **Check against:** Name the actual goods, activities, jurisdiction and programme, then establish the applicable criteria with the responsible specialist.
- **Look for:** Compare selected movement, status and exception records with those criteria and any required permissions or declarations.
- **If unclear or a concern appears:** Record the precise unanswered requirement and assign its resolution to the appropriate compliance owner before drawing an assurance conclusion.

**Storage conditions and environmental obligations.** Are relevant storage conditions and environmental responsibilities defined, monitored and acted on when something goes wrong?

- **Check against:** Establish the goods, site and activity requirements and identify who determines acceptable conditions and responses.
- **Look for:** Review applicable monitoring records, exceptions, decisions and follow-up alongside observations of the relevant area or activity.
- **If unclear or a concern appears:** Assign missing criteria, unexplained exceptions or unresolved actions to the responsible product, facilities or environmental owner; distinguish operating concerns from formal assurance findings.

### Financial controls and warehouse providers

**Adjustment and write-off authority.** Can each selected inventory adjustment or write-off be explained and linked to the authority required for it?

- **Check against:** Establish the organisation's applicable authorisation and supporting-document requirements for the transaction being reviewed.
- **Look for:** Compare adjustment entries with reasons, investigation records, approvals and relevant count or movement evidence; retain missing or conflicting support.
- **If unclear or a concern appears:** Refer unsupported entries or unclear authority to the inventory and finance owners. Record the control question without treating a variance as proof of fraud.

**Custody and reconciliation evidence.** Can warehouse and finance records be reconciled without confusing physical quantity, custody, ownership and value?

- **Check against:** Agree the reconciliation's purpose, period, records and responsibilities with the relevant inventory and finance owners.
- **Look for:** Compare selected stock and transaction records, counts and any applicable external-custody evidence; record unresolved differences and the assertions they affect.
- **If unclear or a concern appears:** Assign each gap to its evidence owner and identify any further financial-audit work required; a matching quantity alone does not answer every financial question.

**Contracted service and qualification evidence.** Does the evidence address both the service a warehouse provider delivers and the qualifications required for this relationship?

- **Check against:** Identify the actual service commitments, qualification requirements, review period and people responsible for each decision.
- **Look for:** Compare selected service records and exceptions with current qualification or assurance evidence relevant to the required scope.
- **If unclear or a concern appears:** Keep performance, qualification and renewal questions separate. Request missing evidence and assign the decision rather than treating one favourable document as settling the whole relationship.

**Charged activity, units and rates.** Can selected warehouse charges be traced to the applicable agreement and the activity or unit being billed?

- **Check against:** Identify the relevant contract and rate version, charging basis, period and authority for resolving a dispute.
- **Look for:** Compare invoice lines with available movement, storage or service records and documented exceptions; retain gaps or inconsistent interpretations.
- **If unclear or a concern appears:** Record the disputed point and supporting evidence, then refer it to the commercial or finance decision owner without assuming entitlement or savings.

### Responsibilities and follow-through

**Purpose, criteria and responsibilities.** Is everyone clear about the decision this review supports and what each participant is responsible for?

- **Check against:** Record the purpose, scope, criteria, intended users and any required assessor competence or independence.
- **Look for:** Compare the review brief with responsibilities understood by the sponsor, evidence providers, assessor and action owners; identify missing authority or conflicting expectations.
- **If unclear or a concern appears:** Resolve the commissioning gap with the relevant decision maker before treating a generic checklist as the agreed scope.

**Evidence coverage and limitations.** Can a reader tell what was examined, what was not and where the evidence remains uncertain?

- **Check against:** Establish the review's coverage, period and evidence needs against its actual purpose and criteria.
- **Look for:** Record selected locations, goods, shifts and transactions, together with missing records, conflicting accounts and reasons for exclusions.
- **If unclear or a concern appears:** Limit each conclusion to its support, identify what additional evidence would change the decision and name who should obtain or assess it.

**Action ownership, resources and escalation.** Does each finding have a next action and someone with the authority or support to move it forward?

- **Check against:** Agree the action owner, decision owner, required resources, target date and escalation route for unresolved dependencies.
- **Look for:** Compare recorded actions with commitments, available authority and the decisions still outstanding; distinguish doing the work from approving resources.
- **If unclear or a concern appears:** Make the blocked decision explicit and take it to the responsible person rather than repeatedly assigning work the team cannot complete.

**Verification and recurring findings.** What shows that an action addressed the finding, and what happens if the concern returns?

- **Check against:** Agree what effectiveness means for the finding, who will check it and under which relevant operating conditions.
- **Look for:** Compare reported completion with follow-up observations, records and recurring exceptions; retain limitations and any unresolved part of the finding.
- **If unclear or a concern appears:** Record further work where effectiveness remains uncertain. Distinguish verified operating results from wider financial benefits that have not been demonstrated.

### Excel and PDF audit pack

Keep this checklist, your evidence and follow-up in one working record for your team.

**Coming soon.** The pack will be included with a DataDocks email subscription. Downloads and email signup are not available yet.

*Additional complete expandable CTA immediately before “Plan the audit around the decision”. Use `AuditPackDisclosure.astro` with heading ID `warehouse-audit-pack-after-checklist`, heading level `h3` and email ID `audit-checklist-preview-email`. Its labels, markup, complete contents and all disclosure states are shared with the early preview. Keep both existing placements. This repeat adds no contents-navigation entry; it is an h3 inside the article rather than another top-level pack section.*

## Plan the audit around the decision you need to make

- **Name the decision.** “Review inventory” is broad. “Find out why discrepancies keep returning in the pick face” gives the team something to investigate. A director considering more capacity can begin with a question about constraints without presuming that dock scheduling is the cause.
- **Define the boundary.** Record the site or area, period, goods, activities and operating conditions. Include what the review does not examine. A quiet-shift observation cannot stand in for a busy-period assessment without further evidence.
- **Establish the criteria.** Identify the relevant procedure, service commitment, contract, technical requirement or assurance framework and its version. Mark an unknown requirement as unresolved rather than replacing it with a generic pass threshold.
- **Assign the work and the decisions.** Identify the sponsor, evidence providers, reviewer, action owners, resource approver and effectiveness reviewer as relevant. One person may hold several roles; record any resulting limits rather than inventing independence.
- **Prepare an evidence request.** Ask for the records and observations that would distinguish competing explanations. An operating team can prepare a review this way; a director with no diagnosis can commission one without pretending findings already exist.

*Design: V02 uses the shared `AuditTrail.astro` renderer for purpose and criteria → evidence → finding and uncertainty → action or decision → verification. Its angular two-tone SVG icons and connecting line use the same treatment as the inventory trail, with no square markers. Retain the return-to-investigation caption when evidence or effectiveness is unresolved. B01 and B05 inform this proposed method.*

## Executing the audit: don’t boil the ocean

### Follow the records and watch the work

- Follow a selected receipt, movement or dispatch through its records and the work it represents. A complete form tells you what was recorded; observations and conversations help establish how the work happened.
- Ask the people doing the work where handoffs fail, which exceptions are difficult to report and what competes for their time. Compare their accounts with records and observations. Preserve a disagreement until the evidence resolves it.
- State the sample and its limits: locations, items, transactions, shifts and conditions. Separate an isolated event from a recurring pattern, and identify the evidence that would change the conclusion.
- Keep a written procedure, evidence that it was followed and evidence that it worked as three distinct questions.

Barratt, Kull and Sodero studied one retailer's distribution centre where employees were expected to notify a supervisor when stock was insufficient for an order. The researchers reported:

> “This policy impaired employee productivity and, thus, reduced their productivity bonuses.”

— Barratt, Kull and Sodero (2018).

Locator: author manuscript p. 17, “Documents, Interviews, and Observations”. [Source](https://www.researchgate.net/publication/328417219_Inventory_Record_Inaccuracy_Dynamics_and_the_Role_of_Employees_within_Multi-Channel_Distribution_Center_Inventory_Systems).

The practical question for a review is whether the measures used to assess work discourage the exception reporting the procedure requires.

*Design: Q01, Q02 and Q03 each use one semantic figure containing the exact quotation, short source label and explicit locator line with the existing citation. Keep the lightly tinted inset and orange Recoleta quotation mark in the smaller decorative grid. Quotation text inherits the article's reading size; supporting attribution and locator use Inter with their own spacing. Keep the quote, source and locator together without mismatched top/bottom bars. Full author/publication information remains in the bibliography; Q01 attributes the account to the researchers.*

### Keep stock counts and process observation distinct

- Establish the count boundary, comparison time, units and the treatment of movements during the count. Preserve the movement record needed to interpret a difference; do not assume every operation requires a complete shutdown.
- **Blind counting** means counting without knowledge of or access to the recorded quantity, while retaining the identifying information needed to count. Its purpose is to reduce the influence of an expected number on the count. The GAO guide describes this practice and contextual alternatives; it is not universally mandatory or a guarantee of accuracy. [B10, Key Factor 8](https://www.gao.gov/assets/gao-02-447g.pdf#page=40).
- Keep the initial result, recount, reconciliation and any authorised adjustment traceable. Document who did what and why a difference remains unexplained.
- Distinguish preparing a controlled count from observing ordinary work. Correct immediate hazards through the site's response process, while recording the original conditions relevant to the review. Tidying the area must not erase evidence of a recurring process problem.

### Example: review a stock location

Choose one item and ask why it is stored in that position. Watch a pick and a refill, paying attention to how people reach and handle the stock and use the space in front of the rack.

*Latest asset 3 persistent-marker revision, 5 October 2026, awaiting human review: `AuditSlottingIllustration.astro` retains the liked raster `src/assets/blog-images/warehouse-audit-slotting-v1.png` unchanged. The figure title remains “Why is this item stored here?” The initial interactive view has no selected option, annotation text, connecting lines or footprint overlays. Four visible numbered circles remain: 1 on the shelf, 1 by the cart, 2 on the incoming pallet load and 3 in the shared working space. Caption: “A stock location has to work for the pick and the refill.”*

*The controls are Picking, Replenishment and Shared access, with no Overview choice. Clicking an active task button again clears it; numbered-marker clicks select or retain their assigned task. Picking reveals “From shelf to cart” and “Space used by a pick”; Replenishment reveals “From load to shelf” and “Space used by a refill”; Shared access reveals only “Where the jobs meet”. Each visible heading and explanation belong to the same task, and unrelated notes stay hidden. The two 1 markers select Picking, marker 2 selects Replenishment and marker 3 selects Shared access. Each visible circle is a 2rem native button whose clickable area is confined to that circle, replacing the broad transparent object rectangles. The source centres are shelf (50%, 44%), cart (84%, 70%), load (17%, 76%) and working space (50%, 82%). Picking's connector reaches both shelf and cart; the shared-space note 3 stays closer to its subject. Central brackets and plus affordances remain removed. Named controls start hidden and appear after binding. Numbered buttons start visible but disabled, and binding enables them. Without JavaScript, the disabled numbered markers remain with a separate text fallback below the artwork. Printing temporarily shows all default attached annotations and four decorative SVG numbers, hides the interactive buttons, then restores the chosen or unselected state. Source retains independent instances and Astro navigation cleanup/rebinding. Targeted Astro source compilation and script syntax passed. A hand-built minimal synthetic fixture verified persistent markers, binding, task mapping and retention, relevant notes/leaders/footprints, clearing, matching copy, independent instances, repeated print restoration and Astro cleanup/rebinding. It used no article HTML, CSS, images or browser render. Source verification confirms one shared coordinate definition and removal of broad transparent rectangles; the raster checksum is unchanged. A status-only local-preview request returned HTTP 200. The figure stays at `#audit-slotting-illustration` under this execution example, outside the checklist. The two earlier replacement concepts remain uncommissioned background ideas.*

Compare those observations with how often the item is picked, its handling requirements and the workers’ explanation of the placement. Record any constraint and the evidence for it before proposing a move.

## Stock discrepancies and financial controls

### Follow a discrepancy through the records

- Start with the physical observation and its context. Identify the item, location, unit, time and relevant movements before comparing the result with a stock record.
- Follow the transaction history and competing explanations. A unit mismatch, delayed transaction or unclear handoff calls for evidence; the difference itself does not establish theft or a software fault.
- Record the reason and authority for an adjustment, then preserve the reconciliation and unresolved investigation. Changing a balance and explaining why it became wrong are separate pieces of work.
- Keep quantity, condition, custody, ownership and valuation distinct. Under PCAOB AS 2510, inventory-observation work includes quantities and physical condition. Its requirements apply within that auditing framework. [B06, .02 and .09–.14](https://pcaobus.org/oversight/standards/auditing-standards/details/AS2510).

*Design: V03 uses the shared `AuditTrail.astro` renderer to follow receipt → stock record → movements → count and recount → adjustment. Each step has an angular two-tone SVG icon connected by the same line treatment as V02; neither trail uses square markers. Keep the title “Follow one item through the record” and caption “A missing connection is an evidence request, not a reason to guess.” The planning and inventory sequences retain their distinct meanings within the shared renderer.*

Martin County's 2021 utilities warehouse report recommended independent verification when a count variance exceeded management's tolerance:

> “The verification count should be performed by a staff member who did not participate in the original count.”

— Martin County warehouse audit (2021).

Locator: p. 24, recommendation 4. [Source](https://www.martinclerk.com/DocumentCenter/View/856/Utilities-Warehouse-Audit-Report---2021-PDF#page=24).

The report's subsequent recommendation also connects differences to documented investigation and corrective action.

### Worked example of a repeated inventory discrepancy

Suppose a review of recurring stock differences selects one item, SKU-104, in bin A-01 at a defined comparison point. The physical count is 11 units; the record shows 12. Retain the count and relevant movement context for the investigation.

*Asset 4 approved and frozen, 14 October 2026: approval covers the current **Count or comparison error** / **Recording error** pair, shared semibold Inter metadata, Recoleta main phrases, two-line norm and lower-edge clearance. The pair was a correction based on recovered earlier discussion, then approved with this final asset; the overlapping **Unrecorded stock change** / **Incorrect stock figures** wording is historical. All other layer copy, shape and placement remain unchanged. Compilation passed for the component and overview; a body-discarded status-only request returned HTTP 200 on port 4338. These technical results are separate from the user's explicit copy and presentation approval. Earlier feedback and pending-review notes below are historical; no new design checks or source changes accompany the approval.*

*Label refinement history, 14 October 2026: the user reported “goods” touching the lower border and requested a common label identity. The unchanged norm statement uses two deliberate lines, “goods out the door” / “= job done”, in a centred fit-content wrapper. “recorded”, “counted” and “Normalised assumption” share 12px Inter, 600 weight, 1.4 leading, .02em tracking and secondary ink, replacing their separate prior treatments. Main Recoleta type, shape, five layers, wording and placement remain unchanged. Improvement feedback and technical results at that point did not establish visual acceptance; the current version subsequently received explicit approval as recorded above.*

*Asset 4 implementation history, 13 October 2026: the per-band decorative SVG and native live-text retry retained the same position after the example setup and before these investigation/follow-up bullets. The tip showed **12 recorded** and **11 counted**. Its immediate pair was **Unrecorded stock change** / **Incorrect stock figures**, since superseded by the correction above. The deeper copy remains **Time pressure**, **Handover gaps**, **Uncaught errors**; **No one owns the outcome** / **Information doesn’t reach other crews**; and **Normalised assumption: goods out the door = job done**. Sustained workload pressure and management focus on keeping things moving can normalise that assumption; it does not blame crews.*

*The five depths convey causes that are more hidden and more deeply causative, with a broad central mass rather than a deepest action target or universal cause. The two immediate families allow count, record, unit and timing comparisons, as well as an unrecorded stock movement; this unresolved example is not diagnosed as a missed pick. Multiple explanations and conditions are illustrative possibilities. The connected source treatment uses pale ice material in both themes, a shared waterline, reduced vertical padding and a broad curved lower end. Large triangular facets are removed. Each band's height follows its text and padding, with dividers at the band boundaries. The user called this compact iteration definitely better than the last but still not great: the counts almost crashed into the border and labels barely belonged. The subsequent refinement broadens the tip around the counts, pulls count columns inward and reduces narrow-container count type. Immediate labels use a smaller muted modifier line above a stronger noun line; condition phrases wrap naturally in smaller semibold type, ownership is smaller, and the norm prefix is quieter. Exact copy remains unchanged. No raster generation, cards, hover reveals, scripts, new visible categories or root-destination arrow are part of this retry.*

*The user's “getting warmer” feedback did not establish acceptance. The subsequent compact Inter-label pass is backed up at `output/checkpoints/asset4-compact-inter-typography-superseded-2026-10-13.astro`. After the user reported a cropped bottom and typography that was still not quite right, the current source expands the lower viewBox, explicitly allows decorative SVG/figure overflow and adds 4px bottom label padding. Explanatory labels now use the site's Recoleta stack at 15px, 14px narrow, with 500 weight and 1.3 leading; the noun/modifier bold and colour split is removed. Counts retain Recoleta numerals, while descriptors, norm prefix and caption stay small Inter. The norm sentence uses Recoleta 400. Exact words, case, content, placement and native band structure remain unchanged. Human visual review of this refinement is pending.*

*The latest lower-edge/Recoleta-label pass passed targeted source compilation for the component and overview. A body-discarded status-only request returned HTTP 200 on port 4338. Visible caption remains “Possible causes at different depths”. Human review must confirm the reported crop and typography. No automated design, image/UI/browser/render, geometry, contrast, layout or font-metric checks were performed. Source and availability results do not establish visual acceptance.*

*The first five-depth mockup was authorized on 8 October. The user subsequently supplied a screenshot and requested a more usable asset. Root acknowledged elongated rock-like facets, a divider crossing the norm label, uneven label wrapping, excessive height and an overemphatic bottom point. That first source is preserved at `output/checkpoints/asset4-five-depth-first-mockup-superseded-2026-10-13.astro`. The 7 October proposed copy, rejected raster and superseded four-peer SVG remain in the visual brief/checkpoint history, including `output/checkpoints/asset4-four-peer-explanations-superseded-2026-10-08.astro`. Their historical compilation and HTTP-status results do not establish the retry's acceptance. Earlier assets and all three CTA placements remain unchanged.*

- **Observation and reference:** INV01 records the 11-versus-12 difference. INV02 asks whether unit and pack definitions agree. The review uses the site's stated inventory procedure.
- **Evidence obtained:** count note, the stock-record comparison and references to the selected receipt/issue records. A recount confirms 11, while the relevant transaction timing and unit history remain to be reconciled.
- **Unconfirmed explanation:** a unit-of-measure or transaction-timing issue is possible. The example does not decide which explanation is true.
- **Next action:** the inventory lead compares the receipt/issue trail and unit definitions with the relevant process/system owner. Any balance adjustment follows the site's authorised process and remains distinct from the investigation.
- **Verification still pending:** after an evidenced action is chosen, the assigned reviewer will examine subsequent relevant transactions/counts. Record the verification date and result when that review takes place.

*Design: V05 retains the unresolved case as ordinary prose and an action list beside the inventory discussion. Asset 4's authorized five-depth local mockup introduces multiple possible explanations and underlying conditions before that list. Its interpretation and aligned copy are accepted; human presentation review remains pending. No separate finding-sheet graphic is required. The future applet uses the same unresolved case facts.*

## Establish the requirements for compliance and customer audits

- **Internal procedure:** identify the agreed work method and evidence that it is used. An internally chosen procedure is not automatically a legal requirement.
- **Customer contract:** establish the actual service or assurance commitment, the relevant goods/site and the evidence the customer expects. Check the agreed scope rather than relying on a certificate's presence.
- **Voluntary framework:** identify the scheme, version, assessment scope and relevant assessor. Do not imply that one favourable assessment covers every activity or customer requirement.
- **Legal requirement:** establish the jurisdiction, goods and activity with the responsible specialist. Keep the actual rule and its evidence requirements attached to the relevant check.

United Warehouse describes internal, third-party, customer and insurance-related reviews. In its customer-audit account, it says:

> “We are routinely audited by many of our customers, and even by their customers.”

— United Warehouse.

Locator: “Customer audits”, first bullet. [Source](https://www.unitedwarehouse.com/why-united/quality-assurance/audits/).

A customer review can therefore involve preparing evidence for another organisation and, at this operator, for that organisation's customers too.

### Example: trace a removal from a UK customs warehouse

Follow goods leaving the warehouse through the records to check that the entries connect and were made at the right time. In a closing stock balance system approved by HM Revenue & Customs (HMRC), the UK’s tax and customs authority, the commercial records and duty-management system together form the stock account.

1. **Start with the commercial record.** Check that the consignment details, quantity and removal date were entered before the goods left.
2. **Follow the audit trail.** Ask how the commercial entries feed into the duty-management update.
3. **Check the update timing.** Confirm the duty-management system was fully updated as soon as information became available, before midnight of the following warehouse operation day. [B11](https://www.gov.uk/guidance/special-procedure-customs-warehousing/duty-management-and-closing-stock-balance-systems).

Agree the removals and period to review with the person responsible for the warehouse’s customs authorisation, using the requirements of its approved arrangement.

*Design: use the reader-led removal trace and its three evidence steps in ordinary prose. The approved UK closing-stock arrangement remains the source boundary. The old generic goods/records/customs schematic stays removed.*

## Turn findings into decisions and follow-through

### Dig for the root cause

- Keep what was observed separate from what might explain it. Similar-looking SKUs, changed case packs, transaction timing and an unclear handoff are possible explanations, not a menu of confirmed causes.
- Ask what evidence would distinguish those explanations. A corrected balance can coexist with an open investigation.
- Record a next evidence request when the cause is unresolved. Do not substitute another training session or a software purchase for that investigation without support.

### Give each action an owner and a route to a decision

- Record the observation, criterion, supporting evidence, consequence, next action, owner and target date. Add a decision/resource request where the action cannot proceed within that owner's authority.
- A logistics director should be able to see the question the review addressed, its evidence limits, consequential findings, options and decisions needed. A colour or score cannot carry that explanation on its own.
- Where one person holds several roles, say so. Distinguish the person doing the work from any required independent review rather than implying an assurance structure the site does not have.

### Check whether the fix worked

- Agree what would count as effective action and who will check it under relevant operating conditions. Keep the completion record and the effectiveness evidence separate.
- If the concern returns or the verification is incomplete, retain that fact and the next owner/action. A tick against “done” must not erase the open question.
- Trace an operating improvement through to the business result before claiming a return. In a survey of 90 firms, Abushaikha and colleagues found associations with warehouse/distribution performance and modelled indirect business-performance relationships; the study does not establish that an audit causes profit improvement. [B08, findings and limitations](https://eprints.glos.ac.uk/5801/).

### Worked example of a mixed warehouse provider review

Suppose a logistics director is considering whether to renew a warehouse-provider contract. Recent dispatches have been late, a customer has raised a storage concern and some invoice charges are disputed. The review needs evidence for each issue before the director can decide whether to renew, request changes or seek further evidence:

| Issue | Evidence and criterion | Owner and unresolved decision |
|---|---|---|
| Late dispatches | The agreed dispatch commitment; selected order-release and actual dispatch timestamps; workload, staffing and exception records for those shipments. The reason for delay is unconfirmed. | The service owner obtains the missing operating evidence. The director considers any required resource or service condition when reviewing renewal. |
| Storage concern | The affected goods/location and actual product/customer storage requirement; condition-monitoring records, the reported exception and a competent assessment of acceptability. | The product/quality owner establishes the required action and how it will be verified. The director needs that evidence for the provider decision. |
| Disputed charges | The applicable contract/rate version; invoice lines and charging units; movement, storage or service records for the billed period; documented exceptions. Entitlement remains unresolved. | The commercial/finance owner resolves the interpretation or requests further evidence. The director receives the remaining commercial issue alongside the service and storage findings. |

The director's renewal decision remains open until these evidence requests and required actions are reviewed.

*Design: V06 renders the three evidence tracks and the director's unresolved renewal decision.*

### Check the basis of a warehouse charge

- Identify the contract and rate version that apply to the disputed period and service. Establish the charging unit: a pallet, movement, day, order or another agreed basis.
- Connect the invoice line to the underlying activity or stock record. Check dates, units, included services and documented exceptions before interpreting a difference.
- Record what is missing or disputed and who can make the commercial decision. A missing record does not by itself settle legal entitlement or establish a saving.
- Keep the billing question distinct from service performance and product assurance. A credit may resolve an invoice dispute while leaving a late-dispatch or storage concern open.

*Integrate these prompts into the disputed-charge part of the provider review above. Do not introduce a separate billing chain in the stock-discrepancy section. This comparison is our editorial method; the actual agreement determines entitlement.*

## Get the checklist in Excel and PDF

**Coming soon. Downloads and email signup are not available yet.**

Take the review into an editable workbook and printable floor sheets. The planned pack will help your team keep scope, evidence, findings, assigned work and management decisions together. When available, it will be included with a DataDocks email subscription. The public article and checklist remain free to use without subscribing.

*Restored full offer C04 at `get-warehouse-audit-pack`, after the provider-renewal example and before the frequency section. Render the same artwork, complete contents and inactive signup through `AuditPackContents.astro`, with an email-field ID distinct from both expandable previews. Keep the shared one-field/button treatment and conditional future-availability disclosure above; do not activate submission or files. All three placements present the same offer and launch terms.*

## How often should you audit a warehouse

- **Routine and pre-use checks:** tied to the actual task, equipment and applicable requirements. They support daily work; they do not replace the broader review.
- **Inventory counts:** selected according to the count programme and its objectives. Cycle counting and a wider process assessment answer different questions.
- **Process or management reviews:** consider changes in work, recurring findings, risk and the decision that needs evidence. A change in conditions can justify revisiting an earlier conclusion.
- **Specified assurance engagements:** follow the relevant customer, scheme, legal or engagement requirements. Identify those requirements before suggesting a schedule.

Inventory counts have their own coverage and timing. Cycle counting covers inventory through successive selections; a full physical count covers the defined inventory at a point in time. A wider warehouse audit examines the work and controls behind the records. [B10, printed p. 20](https://www.gao.gov/assets/gao-02-447g.pdf).

*Asset 2: the user endorsed the diagram and requested typographic refinement, now implemented in `AuditCountComparison.astro` and awaiting human review. This static SVG/CSS comparison remains in the frequency section at `audit-count-comparison`. The same stock-location geometry renders both warehouse views. Cycle counting highlights selected locations and uses three count sheets to show successive selections; full physical counting highlights all locations within its boundary and uses one complete sheet. Supporting labels distinguish inventory coverage over time from counting at a defined point in time. One shared preparation strip covers item/unit, count boundary/time, movements and recount/reconciliation. There is no scope selector or script. Caption: “Both approaches need a defined count scope, timing and records that can be reconciled.” The Recoleta figure title and Inter method/supporting text now use a defined hierarchy, and shared CSS rows align the headings, descriptions and drawings without a fixed minimum text height. The diagram's geometry and content are unchanged. No automated design checks were run. B04, B06 and B07 illustrate distinct review contexts; no universal monthly/quarterly frequency follows from them.*

## How technology should help

- **Records first:** paper, spreadsheets and warehouse systems can all hold useful evidence. Ask whether the team can find the relevant transaction, identify its context and reconcile a discrepancy. A digital record is not automatically correct. B02 and B09 inform this explanation.
- **Photos with context:** a dated, identifiable image may help communicate an observation. Keep the relevant location, scale/context and linked finding; a photograph alone does not establish a cause, a structural judgment or closure.
- **Coordination where relevant:** if the review points to inconsistent appointment information or unclear arrival plans, examine a coordination remedy alongside staffing, space and process constraints. DataDocks describes carrier self-scheduling within facility booking rules; link to that specific capability without promising that scheduling guarantees inventory accuracy or compliance. [P01, Carrier Self-Scheduling](https://datadocks.com/datadocks-features/carrier-portal).

*Commercial placement C05: a modest contextual link, “Explore carrier self-scheduling,” after the coordination explanation. No second demo form is commissioned. The public page verifies the advertised capability description, not its outcomes or suitability for every site.*

Dock scheduling shapes the work an audit needs to understand. When arrivals bunch together, staging space and the team’s time come under pressure. Compare planned appointments with actual arrivals, then trace the loads through receiving or dispatch to check how staging, checks and stock entries were handled. Ask the team what changed during the peak and compare its account with the records.

*Asset 5 placement: insert the approved `AuditDockFlow.astro` here, between the dock-scheduling paragraph and the people-first conclusion. There is no visible figure title; the first row reads “First Come First Serve”.*

## Make the review useful to the people doing the work

- Carry forward the current article's people-first idea: making sure the system supports the work they do.
- Close around a practical next step: choose a review question, identify the first evidence needed and name the person who can act on the result.
- Close with the useful next step and the people-first purpose. The post contents already provide article navigation; do not add another planner/pack scroll CTA.

## Sources

*Use the [working bibliography and quotation ledger](warehouse-audit-article-bibliography.md). Place citations beside substantive claims and give the reader a concise final reference list. Source IDs, scope notes and design markers remain editorial aids rather than publication copy.*

## Editorial notes outside the article

### Opening hook alternatives

The opening above is the recommended continuity option. Its first sentence is retained verbatim from the existing article; the following two sentences are new. Two alternatives remain available for the human author:

**Evidence and practical action:** Finding an error is only half the job. A recurring stock discrepancy, a late dispatch and a disputed storage charge each call for different evidence. This checklist helps the team collect it and the person responsible decide what happens next.

The first sentence of this alternative is retained verbatim; the rest is new.

**A director's decision:** Your next decision might be to add capacity, challenge a warehouse invoice or renew a 3PL contract. Start by establishing what the evidence shows and where it is still incomplete. The checklist below connects checks on the floor with the financial, compliance and management questions behind that decision.

This alternative is new. Use one opening, not all three. These are our draft hooks, not quotations from the external bibliography.

### Preservation pass completed for turn 1

| Existing element | Turn 1 treatment |
|---|---|
| Speed, safety and accuracy opening | Keep its first sentence in the recommended opening; replace the compliance/profitability promises that followed it. |
| Practical checklist with bold labels and concrete questions | Keep the recognisable heading and scanning pattern. Expand the topic coverage while retaining the familiar inventory, equipment, layout and safety subjects. Questions and evidence prompts are developed in turn 2. |
| Executing the audit and not boiling the ocean | Keep the manageable-scope theme and recognisable heading wording. Separate count preparation from observing normal operations. |
| Dig for the root cause | Keep the wording in sentence case and the concrete SKU/case-pack examples as investigation possibilities. Remove the implication that a particular cause or successful fix is already established. |
| How technology should help | Keep the wording in sentence case and the practical focus. Replace paper dismissal, error-free-system claims and scheduling guarantees. |
| People-first close | Keep the supportive idea. Carry the direct voice into financial and management sections too. |
| Business-case promises, fixed frequencies and technical thresholds | Replace unsupported claims; relocate the useful decision questions into the relevant sections. |
| Existing graphics | Preserve any useful explanatory purpose, subject to the step 10 decisions. Turn 2 expands this to six visual compositions and supporting editorial treatments. |

A [dated checkout copy](baselines/warehouse-audit-checklist-2026-09-30.mdx) preserves the original MDX as reference text, including its original relative asset paths. The source article remains unchanged at [its repository path](../src/content/posts/warehouse-audit-checklist.mdx) on the preserved worktree base. The [live version](https://datadocks.com/posts/warehouse-audit-checklist) was reopened on 30 September; the inspected opening, headings and examples agree with this preservation pass. Reported engagement supports taking retention seriously, but does not identify causal engagement drivers.

### Future planner handoff

The unbuilt planner has no visible section, static outline, link or contents entry in the current preview. Turn 3 retains applet position A01 and anchor `warehouse-audit-planner`, after the worked examples once it is built. The three pack placements do not change the planner's build scope. Use the [functional specification](warehouse-audit-applet-and-download-step-10.md), shared check wording and unresolved case facts above.

**Future entry copy:** Choose what you want to review. Build an evidence plan, or record what you have already found.

**Future access copy:** Use, copy, print and export without email. This version does not save work after you close or reload the page.

- **Start an audit plan:** enter an objective, choose areas and add criteria/context where known. Unknowns are allowed.
- **See a worked example:** open the inventory example; protect existing entries before replacing them.
- **Use the output:** get a scope/evidence plan or recorded findings/actions. A management view surfaces entered decision requests and missing evidence; it does not invent a diagnosis or score.
- **Continue outside the page:** public copy, print and CSV retain scope and uncertainty. A secondary link leads to the reusable Excel/PDF pack without transmitting audit notes.
- **Keep the future public tool independent of signup:** it records and presents the user's entries, with no required personal information, automatic verdict or saved-session promise. It does not diagnose the warehouse or certify a result.

### Future pack launch handoff

The market/provider checks and backend consent handling remain as specified in the [planner/download specification](warehouse-audit-applet-and-download-step-10.md). Keep the accepted one-field signup and exact button **Subscribe & get the audit pack** for launch.

**Launch disclosure beside the action:** Subscribe to DataDocks emails about warehouse guidance and product updates, and get the Excel and PDF audit pack immediately. Unsubscribe anytime. Link the applicable privacy notice.

Once the real files and fulfilment work, reveal both download links after a successful acknowledged request. There is no separate checkbox, second subscription screen or confirmation-email gate. None of this activates the current preview's signup or makes the files available now.

### Stage boundary

**Turn 2 remains in human review:** all 28 checks developed; supporting bullets and both worked examples expanded; three exact source quotations selected; visual candidates and three inactive pack placements defined. Preserve the approved static area headings, “Jump to an area in this checklist” index and one native disclosure per complete numbered question. Final-word/chevron groups and number/period text stay together, with a wider number column and aligned guidance. The complete early expandable preview remains at `warehouse-audit-working-pack`; a second expandable CTA at `warehouse-audit-pack-after-checklist` sits immediately before planning, with no extra contents-navigation entry; the restored full offer “Get the checklist in Excel and PDF” remains at `get-warehouse-audit-pack`, after the provider-renewal example and before frequency. The two expandable placements share `AuditPackDisclosure.astro`; all three share `AuditPackContents.astro` with distinct email IDs. Pack benefit, subscription exchange, unavailable status and exact future launch terms remain; all three one-field prototypes stay inactive. Disclosure backgrounds, hover, focus, pressed, dark-palette and reduced-motion states are recorded above without a design-approval claim. Quote figures inherit the reading size, with a smaller decorative mark/grid and Inter attribution/locator spacing. Both diagrams use the shared angular two-tone `AuditTrail` renderer. The customs subsection follows one removal through three evidence steps within the approved UK arrangement. The purpose-led opening and unresolved provider-renewal decision remain. The planner is reserved for the future handoff. The [visual brief](warehouse-audit-visual-and-interaction-brief-turn-2.md) records the implementation handoff. **Turn 3:** build the applet MVP. **Turn 4:** develop flowing prose. Final images, working download files, provider configuration and publication remain outstanding. The live article is unchanged.
