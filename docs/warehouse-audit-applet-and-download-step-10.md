# Warehouse audit planner and working pack — step 10 specification

Date: **29 September 2026; signup decision updated 30 September**. Companion to the [existing-page revamp brief](warehouse-audit-revamp-brief-step-10.md). **Requirements defined; no functional applet or pack built, signup configured, data collected or email sent.** This document specifies the existing page's first release, not the additional setup page.

Drafting turn 2 adds the [shared 28-check content](warehouse-audit-checks.json), [developed examples](warehouse-audit-article-draft.md), and [visual and interaction handoff](warehouse-audit-visual-and-interaction-brief-turn-2.md). The public planner follows the planning section; the single pack form follows the worked examples, with earlier links leading to it. The [static design preview](previews/warehouse-audit-turn-2.html) is illustrative and does not run the tool or collect email. Turn 3 is the authorised next build stage when requested.

## 1. Product decision and scope

Build one optional **Warehouse audit planner** within the article. A reader selects a review scope and can leave with an evidence plan before any findings exist. If observations are available, the same tool organises them into findings and next actions.

Use the 28 starter checks and eight areas defined in the article brief. Share stable IDs and reviewed wording across article, applet and pack. Area selection affects the working plan, not the public article or a visitor's access to its content.

Keep the first release to **one review in the current browser tab**, without accounts, multi-user editing, uploads, integrations, stored audit histories, automatic diagnosis, financial calculations or a compliance score. An email is never required to see, copy, print or export the visitor's own entries.

The gated offer is a **generic reusable working pack**, available through subscribing to the stated DataDocks email programme. It is connected to the applet through an optional next step, but does not depend on using the applet and does not receive its contents. It is not a personalised report.

## 2. Interaction flow

| Stage | Visible task and behaviour |
|---|---|
| **Start** | Explain the task and public access. Offer “Start an audit plan” and “See a worked example.” Show that work is not saved after closing/reloading, with export available. Loading an example must not overwrite existing entries without confirmation. |
| **Set scope** | Enter the review objective; select relevant areas or start with the whole starter checklist. Record site/area alias, period/conditions and criteria if known. Unknowns remain visible. No required job-title quiz. |
| **Plan evidence / record observations** | Show selected checks in small groups. Each has its question, criterion reminder and evidence prompt. Status begins unreviewed. Expand evidence/follow-up fields when useful; allow a reader with no observations to go straight to the evidence plan. |
| **Review the output** | Present scope, outstanding evidence, recorded concerns and actions. A concise management-summary view uses the same entries; it does not infer new findings. Let users return and edit without loss. |
| **Use the result** | Copy, print/save as PDF through the browser, or export a CSV of the working records. Offer the reusable Excel/PDF pack separately, with the subscription-and-pack exchange stated before opening its form. |

Do not force a full 28-row response before generating a useful plan. Selecting no areas produces a request to choose scope, not an empty favourable report. Readers may deselect areas; preserve any existing entries and make excluded items visible in the scope record rather than silently deleting them.

### Inputs and data model

| Record | First-release fields |
|---|---|
| Review header | Objective/decision; site/area alias; review date or period; relevant operating conditions and sampling boundaries; scope exclusions; criteria/reference or “not yet established.” |
| Check | Stable ID and area; question; selected/not selected; applicable criterion/reference; status; evidence note/reference; observation date/context where relevant. |
| Finding or unresolved question | Linked check ID, or a custom finding in a selected area; observation; consequence/decision affected; evidence limits; possible cause labelled as a hypothesis; next evidence or action needed. |
| Action | Immediate correction, investigation, corrective action or verification; description; responsible role/person; target date; user-assigned urgency; completion state; verification method, responsible reviewer, date and result. |
| Decision request, optional | Decision or resources needed; why the action cannot proceed without it; responsible decision owner. Keep this separate from action ownership and urgency. |

Show fields progressively. Basic use needs an objective, at least one selected area and an output; unknown criteria and missing observations are legitimate gaps, not reasons to prevent export. A finding can be incomplete, but the output must identify missing responsibility or verification.

Use short notes and references, not document uploads. Prompt users to use roles and non-sensitive references where sufficient. Do not ask for customer names, transaction dumps, photographs, exact inventory values or personnel allegations.

Enter named criteria/references once at review level and allow the user to assign them to selected areas or checks. Make inherited assignments visible, with a per-check override or “not yet established” option. Do not silently apply one criterion to all 28 checks; exports retain each check's effective reference and any override.

Urgency choices should be plain language: **not assessed; routine follow-up; user-flagged urgent concern**. These record the user's judgment. They are not automatically calculated risk classifications, nor a substitute for the site's response procedures. A management/resource decision is an independent field: an urgent concern can also need a decision.

The applet records a **snapshot** of available findings, action facts and planned verification in this session. It can record verification already performed, but has no history, scheduled follow-up or reopening workflow. The workbook supports continuing work over time.

### Status vocabulary

- **Not reviewed**
- **Evidence supports the stated check**
- **Concern found**
- **Inconclusive or conflicting evidence**
- **Not applicable — reason recorded**

Do not use “compliant,” “certified,” “audit passed” or an overall health score. A favourable entry is the user's recorded assessment within the stated scope, not a conclusion generated by DataDocks.

## 3. Transparent output rules

1. **Blank stays unreviewed.** There is no default favourable status. An unreviewed selection becomes an evidence-collection task.
2. **Missing criteria stay visible.** Where a criterion/reference is not established, flag it as unresolved even if the user selected a favourable status.
3. **Support needs a reference.** A favourable status without a supporting note is displayed with “supporting evidence not recorded.” Do not silently turn it into an established finding.
4. **Exclusions are explicit.** “Not applicable” needs a reason; otherwise show that the reason is missing. Excluded areas and their retained entries appear in the scope/exclusions record.
5. **Conflicting evidence remains open.** The tool can prompt a next evidence request, but cannot choose which account is true.
6. **Concerns prompt follow-up.** Missing owner, target date or verification plan appears as an action-planning gap. Export remains possible, with the gaps intact.
7. **Urgency cannot be averaged away.** User-flagged urgent concerns remain prominent regardless of other entries. For actual immediate hazards, the page should direct users to their site's immediate-response process; completing the tool must not delay it.
8. **Completion and effectiveness are separate.** “Work completed” without a recorded effectiveness check remains awaiting verification. If the user records an adverse verification result, the snapshot shows further follow-up needed and retains the finding. This is not an automated lifecycle or audit-history system.
9. **Scope limits travel with conclusions.** Keep site, period, selected sample and uncertainty in every summary/export. Counts describe entries in this review, never the percentage of a warehouse that is safe, compliant or healthy.
10. **No invented interpretation.** Free text is reproduced and organised. There is no LLM classification, automatic root cause, benchmark, savings estimate or product recommendation.

### Outputs

**Review brief:** objective, selected areas/checks, criteria, period, scope limits and unresolved commissioning questions.

**Evidence plan:** what remains unreviewed, which records/observations to seek, missing criteria and conflicting evidence needing resolution.

**Findings and actions:** check ID, observation and evidence, attention assigned by the user, action type, owner, due date, completion and verification status.

**Management summary:** the same scope and limits; user-flagged urgent matters; decisions/resource requests explicitly entered by the user; unresolved evidence; missing ownership and verification. Do not manufacture a top-three ranking or calculate a combined verdict.

One illustrative output should make the uncertainty concrete: an inventory concern with a recorded recount, an unconfirmed unit-of-measure hypothesis, an investigation assigned to the inventory lead and a later verification requirement. Show an incomplete action honestly rather than filling every field with plausible invented data.

### Export and persistence decisions

- Provide public copy and print views, plus CSV of working check/finding/action records. CSV must include scope and criterion references so rows remain interpretable outside the page.
- Browser print/save-as-PDF is an output convenience; the pack's typeset PDF is a distinct reusable asset. Do not label a CSV as an Excel workbook.
- Make the lack of saved sessions clear at entry and beside export. Keep entries through in-page navigation and opening/closing the pack form. A reset needs confirmation when entries exist.
- No local persistent storage or server save in the first release. Reload/close can lose work; offer a best-effort departure warning and prominent export rather than claiming guaranteed recovery.
- No import/resume feature in this release. The workbook is the option for continuing the review over time.

## 4. Two journeys the applet must support

**Operator with a recurring discrepancy:** chooses inventory and receiving checks, records count/transaction context, retains uncertain causes, assigns investigation and verification. The result separates correcting the current balance from preventing recurrence.

**Director with a service/capacity decision and no diagnosis:** defines the question and relevant scope, leaves checks unreviewed and generates an evidence/commissioning plan. The director is not forced to invent answers, select a warehouse “type” or acknowledge a dock problem.

A mixed 3PL review can include performance, product assurance and charges within one plan, but each finding retains its own criteria, owner and conclusion. A small-site owner may fill several roles without the output implying independent verification.

## 5. Gated offer: Warehouse Audit Working Pack

**Selected formats:** one editable **XLSX workbook** and one **printable PDF pack**, with separate download links. XLSX serves editable/delegated work; PDF serves field use, meetings and a stable example. State the actual formats. No legacy XLS, cloud spreadsheet integration or DOCX is required for the first release.

The public article already supplies the checks and explanatory method. The pack adds prepared working structure, examples and reusable meeting/verification records. It is not merely the article printed to PDF.

### Workbook specification

| Sheet | Purpose |
|---|---|
| **Read me** | Intended use, version/date, field definitions, status meanings, adaptation instructions, source/article link and scope limits. |
| **Scope and criteria** | Decision to support, site/period/coverage, criteria and versions, reviewers, responsibilities, exclusions and evidence requests. |
| **Checklist and evidence** | All 28 starter checks, evidence prompts and editable fields; permit additional checks. Use the same IDs and status meanings as the applet. |
| **Findings and actions** | Linked finding, evidence, correction/investigation/prevention, responsible owner, resources/decision, target date, completion and effectiveness verification. |
| **Management review** | A meeting/briefing template for scope, consequential findings, uncertainty, options, resource decisions and follow-through. It does not auto-generate a narrative or a pass score. |
| **Worked examples** | The labelled fictional inventory and mixed-3PL cases, separated from blank working records. |

Use readable column widths, filters, frozen labels and clearly distinguished editable fields. Simple status validation and follow-up counts are useful; macros, complex dashboards, financial formulas and cross-site rankings are unnecessary. Keep any formulas transparent and test them with blank, incomplete and conflicting records.

### PDF specification

Include a short instruction/scope sheet, the grouped starter checklist with evidence space, repeatable finding/action sheets, a management review sheet and the labelled examples. Use legible print layouts rather than shrinking the workbook onto pages. Provide a selectable-text, accessible document with a clear reading order and tested page breaks; no fixed page-count target should compromise usability.

Give both assets a consistent version and link back to the article for current guidance. Keep example data visibly fictional. Do not copy third-party checklists, standards tables or copyrighted diagrams into the pack.

### Public preview and offer placement

Show exactly what is included, the two formats, the subscription-and-pack exchange and a small readable preview of a working record. Do not imply that files are immediately ungated or that the pack establishes certification.

Use one reusable form placement near the offer, with the sole submission button **“Subscribe & get the audit pack.”** Earlier and applet-result calls to action can link to that form. Avoid exit overlays and repeated full forms. On success, offer both files and keep them accessible for the current page session without asking again.

**Connection decision:** the same pack is available to a reader who never starts the tool and one who has completed it. Do not attach the visitor's findings, prefill the email form with audit notes or describe the static pack as their personalised result.

## 6. Email capture, fulfilment and consent

**Selected experience, accepted 30 September:** one email field and one button, **“Subscribe & get the audit pack.”** Require no company, phone, job title, business-domain email or demo booking. An independent consultant or small-site manager can be relevant. Defer role/task profiling until there is a demonstrated need; it is not part of the initial form.

Place concise, prominent explanatory text beside the field/button: **“Subscribe to DataDocks emails about warehouse guidance and product updates, and get the Excel and PDF audit pack immediately. Unsubscribe anytime.”** Link the applicable privacy notice. Final wording must accurately describe the actual sender and programme. There is no checkbox, two-button choice, separate subscription screen or confirmation-email gate. Submitting is the explicit subscription action; file access follows the successful acknowledged submission without another user step.

This replaces the earlier separate optional-marketing-choice design. The user has selected the experience, not established universal legal clearance. Market/recipient applicability and provider requirements remain to be verified during implementation. Keep that assessment, consent evidence, suppression and withdrawal handling behind the scenes; do not add speculative user-facing gates to this specification. If an actual applicable requirement conflicts with the selected design, resolve that concrete conflict before launch.

Record the action, timestamp, disclosed purposes, wording/version, source and provider result, alongside the pack/version. Subscription, file access and email delivery are distinct records even though the user performs one action. A tracking acknowledgement or delivery receipt alone does not prove subscription registration.

### Required states

| State | Required behaviour |
|---|---|
| Invalid input | Explain the specific email problem in text, associate it with the field and preserve the entry. |
| Submitting | Show progress, prevent duplicate submission and keep the applet state intact. |
| Capture acknowledged | Reveal explicit XLSX and PDF links immediately after the backend accepts the subscription/pack request. Record the affirmative action and wording/version separately from the pack request; verify provider registration through the configured flow. Do not wait for an inbox action or claim completed enrolment if only an event has been accepted. |
| Email fulfilment | Send the same pack links through the verified resource-specific flow. A tracking-event acknowledgement is not proof of delivery; use truthful wording about the request and offer immediate downloads regardless of email delay. This email is not a confirmation gate. |
| Capture failure/timeout | Show a recoverable error, retain the email and provide retry. Do not claim success or erase the visitor's applet work. The public checklist and exports remain usable. |
| Repeat request | Current-session file access needs no fresh submission. Existing subscribers receive access without duplicate enrolment or restarting sequences. A previously withdrawn or suppressed address needs explicit provider-state handling: a new deliberate subscription action is recorded and assessed, while a file-link click, page visit or abandoned entry must never clear suppression. Do not override bounce/complaint suppression through a blanket resubscribe rule. |
| Email delivery failure, monitored by the provider | Keep direct downloads available on the page. Monitor fulfilment failures/bounces in the provider's operational reporting and provide a recovery path. Do not report delivery as successful merely because submission succeeded. No browser delivery callback or new webhook subsystem is required for this release. |

The deliberate subscription action may enrol the reader in the accurately described warehouse-guidance and product-email programme. It does not constitute a demo request, booking or separate personal sales enquiry. Preserve an easy unsubscribe route and apply withdrawal/suppression consistently. No messages or automation are configured in this documentation turn.

Use a **subscription-and-pack soft gate** to static assets for this release, consistent with the existing site pattern. Direct file URLs can be shared; this is not secure document access. Do not build accounts, expiring credentials or a personalised report service to protect generic templates.

## 7. Repository feasibility and implementation gaps

Read-only findings from the prepared worktree on 29 September. No deployment or email-provider account was inspected, so these are not claims about live automation settings.

| Existing capability | Consequence for this brief |
|---|---|
| [Inline lead-magnet component](../src/components/LeadMagnetForm.astro) and CMS block support | Reuse the placement/content pattern, but not its current success handling unchanged. It shows success and opens an asset without awaiting capture. |
| [Capture helper](../src/lib/home-demo-capture.ts) | Reuse/adapt its acknowledgement pattern: check both HTTP response and application success. Replace its demo-specific event with the subscription-and-pack event. |
| [Bento event proxy](../src/pages/api/bento-track.ts) | It forwards events, not files or emails. The accepted fields currently lack asset version and the required consent evidence. Add and persist purpose, affirmative action, timestamp, wording/version and source alongside asset/version and provider outcome; extra frontend inputs alone are insufficient. |
| [Main](../src/components/LeadMagnetForm.astro) and [sidebar](../src/components/LeadCaptureWidget.astro) handlers | Binding guards differ, and client/server events may both fire. Use one submission owner and verify provider/request deduplication, including retries after upstream acceptance, so one request does not cause multiple deliveries. |
| [Article island pattern](../src/components/pages/ArticlePage.astro) | A public interactive component plus readable fallback already has precedent. The audit state, rules and exports are new work. Embed in the article rather than creating a competing tool landing page. |
| [Post schema](../src/content/config.ts) | It has no declared leadCapture field. Inline content blocks are the established route; do not assume adding frontmatter activates a working sidebar flow. |
| [Global scripts](../src/layouts/Layout.astro) | Bento and Dealfront are loaded; the latter is described in code as using DOM/form listeners. Verify effective capture/exclusion settings before promising that audit inputs stay local. |
| [Demo form](../src/components/CTAform.tsx) | It records a demo event and opens scheduling. It is not the pack-request flow. |

Verify/configure the resource-specific subscription and fulfilment flow with the existing provider during implementation. Test end-to-end registration, immediate file access, email delivery, repeat subscribers and previously withdrawn/suppressed addresses in the appropriate test environment. Inspect actual provider states and deduplication; do not infer external automation from a success message in the repository.

## 8. Accessibility, data handling and performance

Use native labelled controls, grouped fields, visible keyboard focus, text error explanations and announced status changes. Avoid colour-only states, drag-only interactions and compulsory horizontal scrolling. Test mobile layouts and enlarged text. The article and printable starter checklist must remain useful with JavaScript unavailable. These design requirements follow [W3C's forms guidance](https://www.w3.org/WAI/tutorials/forms/) and [status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html); they are not a claim of conformance before testing.

Load the tool without blocking access to the article. Keep the initial page stable and check the performance impact against the current page. No new heavy model/API dependency is justified by the tool's deterministic task.

**Data boundary:** audit entries remain in browser memory and local user-initiated exports. The capture endpoint receives only the information needed for the disclosed subscription-and-fulfilment purposes and appropriate attribution, never checklist statuses, findings, evidence references or entered names. Keep those contents out of URLs, analytics, logs and error reports. Verify global scripts and provider settings; if they cannot reliably exclude these fields, change their behaviour on this page before enabling free-text audit entry.

Treat exported entries as text, including safe CSV handling for spreadsheet formula-like input. Preserve line breaks and special characters without exposing markup execution. Use non-sensitive test records in QA.

## 9. Measurement and acceptance

Measure **started plan**, **output generated**, **copy/print/CSV requested**, **subscription/pack form started**, **submission acknowledged**, **new subscription recorded**, **file link selected**, and **explicit sales enquiry** as separate events. Count provider-confirmed new subscriptions separately from repeat requests; this flow has no separate-checkbox opt-in rate. Monitor **delivery failures** separately through provider operational reporting; they are not a browser event in this release. Specify precise denominators when reporting rates.

Use minimal event metadata such as page, content/tool version, action and file format. Do not attach audit answers, free text, email or evidence references to general analytics. A file-link click is not proof of use; a subscription/pack request is not proof of lead quality; an output generated without observations is a valid commissioning outcome, not a completed audit.

Before release, exercise these meaningful scenarios:

| Scenario | Acceptance result |
|---|---|
| Director has an objective but no observations | Gets a useful scope/evidence plan; no fabricated conclusion or forced diagnosis. |
| Operator enters a favourable status without evidence or criteria | Output prominently preserves those gaps. |
| Everything is unreviewed or marked not applicable | No favourable overall result; missing scope/reasons remain visible. |
| One urgent concern sits among favourable entries | Concern remains prominent, without averaging or delay. |
| Correction is completed but effectiveness not checked | Finding remains awaiting verification. |
| Mixed service, assurance and billing review | Separate criteria, evidence and decisions remain legible in output and exports. |
| One concern is urgent and also needs funding approval | Both urgency and the entered decision request/decision owner appear; neither replaces the other. |
| A shared reference is assigned to selected checks, with one override | Each output/export shows the effective criterion; unrelated checks do not inherit it silently. |
| Area deselected, example loaded or reset requested | Existing work is retained or an explicit destructive-change confirmation is required. |
| Keyboard/mobile/assistive-technology user | Can select scope, edit entries, recover from errors and obtain outputs; no essential meaning relies on colour. |
| Network/capture/provider failure | No false success, duplicate delivery or lost audit work; retry and public outputs remain available. |
| Request times out after provider acceptance, then the visitor retries | Request/provider deduplication prevents duplicate fulfilment or nurture enrolment; a single frontend handler alone is not considered sufficient. |
| Reader submits the disclosed subscription-and-pack offer | One field and one button; immediate file links after acknowledgement, with no checkbox, second screen or confirmation-email dependency. Subscription and fulfilment are recorded accurately. |
| Reader enters an email but leaves without submitting | No enrolment or delivery; the public article and applet remain usable. |
| Existing subscriber repeats the request | Pack accessible without duplicate enrolment, restarted sequences or counting another new subscriber. |
| Previously withdrawn or suppressed address submits again | Deliberate action and provider handling are recorded; no passive reenrolment or blanket suppression override. Withdrawal remains effective across the configured programme. |
| Privacy inspection with representative notes | Audit contents absent from requests, URLs, global tracking and logs; capture data stays within the stated purpose. |
| Article, applet, XLSX and PDF compared | IDs, status meanings, examples, scope notes and current version agree; files open, print and remain editable where promised. |

These are future acceptance checks, not tests run in step 10. The main [revamp brief](warehouse-audit-revamp-brief-step-10.md) defines editorial success and later search/business evaluation.
