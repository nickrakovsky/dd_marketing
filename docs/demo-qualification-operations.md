# Reviewing cancellations and stored data

## Proposed human arrangement

The website cancels only after the visitor chooses a reason and confirms. It does not infer cancellation from their email domain. A second confirmation warns that the reserved demo time will be removed. After a confirmed cancellation, a five-second redirect offers “Stay here” and a new-demo link. Rebooking creates a new appointment; restoration of the old slot is not promised.

**Proposal for the user/Nick to approve:** Nick or the person who already checks the demo calendar inspects the report after the controlled tests and daily during the first rollout week, then weekly. Prioritize unconfirmed/rejected cancellations and sample confirmed ones. For someone who cancelled by mistake, use your existing contact process to offer a new demo; this implementation does not send outreach automatically. The person and cadence can be changed without rewriting the booking flow.

**Retention proposal:** keep extra D1 submissions, verification snapshots and audit rows for 90 days, restricted to Nick and the nominated operator. This does not set Bento’s or Calendly’s own retention. Confirm this period before enabling a cleanup schedule. No automatic deletion of customer records or audit history has been enabled. Before an actual D1 purge, export required cancellation evidence privately, handle unresolved rows, then delete expired related claims/audit/payload rows together. Do not delete an uncertain pending cancellation just because its age passed a threshold; inspect the provider first. This is an operational proposal for approval, not a claim about legal retention requirements.

The report exports contain email addresses. Keep them in the approved private working folder and delete them when their review purpose ends (proposed maximum 30 days). Do not commit them, put them in public/, upload them to the website, or share a public preview link. Access is through the existing Cloudflare account, so no extra public administration login is being built.

## What is retained and why

- Captures: submitted personal/work addresses, CTA and marketing context, session hash, provider verification snapshot, processing checkpoints. Needed to finish identity work without repeating an uncertain write. Baseline subscriber fields/tags are retained to check a rename did not destroy them.
- Bookings: visitor-submitted email/context, event and invitee references, session marker, scheduled time, verified status, explicit correction reason/confirmation time, cancellation result, and Bento reporting checkpoints. Needed to verify session ownership and identify what happened to a specific booking.
- Audit: internal operation reference, time, state and reason/result at each durable checkpoint.
- Temporary rate counters: hashed short-lived request keys. Expired counters are pruned. Raw IP addresses are not stored in the demo database. Tokens/secrets are not copied into the history or browser.

Prepared-but-abandoned sessions are not completed bookings. `cancel_sent` means the request may have reached Calendly and must not be repeated automatically. `cancelled / confirmed` means our confirmed reason matches the cancelled provider state. `cancelled / already_cancelled` means cancellation is observed but not attributed to this flow. `review` names a condition that could not be verified safely, not proof that the visitor did anything wrong.

Bento `sent` without a later receipt, or `unknown`, means delivery is uncertain; never blindly replay it. `accepted` is transport acceptance, not proof every configured Bento follow-up has run. Cancellations are recorded per booking and never clear the historic DemoBooked tag.

## Nick’s private export and readable report

Run from the reviewed revision with the approved Cloudflare account/database. The output path below is a private folder chosen by the operator, not a website directory. Replace `/PRIVATE_FOLDER` and `/PACKAGE_FOLDER` with the chosen private export folder and configured deployment-package folder before running. These are manual read-only instructions; Codex has not run them against the live database.

```sh
npx --yes wrangler@4.155.0 d1 execute datadocks-demo --remote --config /PACKAGE_FOLDER/local/wrangler.json --json --command "SELECT payload FROM demo_bookings ORDER BY created_at DESC LIMIT 1000" > /PRIVATE_FOLDER/demo-bookings.json
node scripts/demo-review.mjs /PRIVATE_FOLDER/demo-bookings.json /PRIVATE_FOLDER/demo-booking-review.html
```

Open the HTML file locally. It contains no remote resources/scripts and makes no provider requests. It refuses to overwrite an existing output file. The first export includes the most recent 1,000 rows; for older or unusually busy periods, query a specific date range and unresolved records rather than assuming it is complete.

For the cancellation checkpoint trail:

```sql
SELECT booking_id, occurred_at, phase, reason, outcome
FROM demo_booking_audit
WHERE booking_id = 'THE_INTERNAL_REFERENCE_FROM_THE_REPORT'
ORDER BY occurred_at;
```

For CRM operations that could not complete:

```sql
SELECT id, email, phase, json_extract(payload, '$.workEmail') AS work_email,
       json_extract(payload, '$.reason') AS reason
FROM demo_leads WHERE phase = 'review' ORDER BY created_at DESC LIMIT 100;
```

These queries are for investigation, not automatic repair. Do not rerun rename, capture or cancellation writes from an export. Use provider state and the documented checkpoint to decide a reviewed repair. Ordinary preexisting personal/work contacts now take the accepted separate-contact path automatically; they are not a routine manual review queue.

## Real limits to verify

This version covers bookings completed in the website popup while its session is available. A blocked cookie, missing Calendly tracking marker, altered booking email, group event, or external-tab fallback can prevent website cancellation; the invitation’s normal management link remains available. No support destination or support-prefill format is invented. Report access/retention and account setup remain human decisions; the underlying local implementation and mock checks do not depend on them.
