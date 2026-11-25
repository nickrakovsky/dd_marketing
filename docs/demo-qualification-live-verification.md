# Controlled live verification — stage 5

**Saved for the agreed live-domain round. Do not run provider tests on a local server or treat mock results as live evidence.** No steps below have been completed merely by writing this document.

## Ready to start

Codex must re-present this list when the live round begins. Nick has completed the configuration plan, the reviewed revision has passed required CI/publication checks, and the user authorizes enabling the unindexed test page. Use the user’s Gmail with `+` variants and `marketing@datadocks.com`. The user already accepts a full booking with the marketing inbox as an obvious test; no new generic “choose test accounts” question is needed.

Record the deployed revision, final origin, switches, browser/device, test addresses, booking time and operator. Do not put tokens, raw subscriber exports or personal/customer screenshots in the repository. Sitewide rollout stays off throughout. Verify ordinary home/nav/inline behaviour remains legacy while `/demo/verification` uses the safeguards. Confirm the test page is absent from sitemap and sends noindex/no-cache instructions.

## User-visible checks and matching evidence

| Order | Visitor action | Expected result | Inspect alongside it |
| --- | --- | --- | --- |
| 1 | Open the test page without interacting | No new capture/booking API calls or Calendly assets | Browser network panel |
| 2 | Enter a fresh Gmail plus-address in the inline form | Work-email request immediately; no calendar yet | One personal capture in Bento; original address preserved where applicable |
| 3 | Repeat through header navigation on a fresh test session | Same qualification behaviour, appropriate popup design | One handler/capture per action; CTA/current-page context retained |
| 4 | Enter marketing@datadocks.com as work email | Calendar opens immediately with that address, independent of Bento delay | Same Bento identity renamed only when safe, or existing work contact updated while personal contact remains; custom field/history association saved |
| 5 | Repeat with an already existing work contact and a personal address that already exists | No manual exception for ordinary existing records | Both histories retained; work contact receives the activity; earlier personal field is not overwritten by a different address |
| 6 | Submit the work address directly in a new attempt/session | Calendar opens normally | Intentional new demo-request activity on the existing contact, not a new identity or retry duplicate |
| 7 | Complete a real demo booking with marketing@datadocks.com | Clear software-demo success screen | Correct host/event/invitee/email/time; session marker recorded in Calendly; one verified server completion event within the background processing interval |
| 8 | Select facility correction, then “Keep my demo” | Demo remains booked | No cancellation request, no cancelled event |
| 9 | Select facility correction and explicitly confirm cancellation | Exact demo is cancelled; clear confirmation, rebook link and 5-second redirect with “Stay here” | Calendly cancellation and stated reason; calendar/invitation update; D1 history with confirmation and observed outcome; separate verified cancellation event in Bento |
| 10 | Let redirect continue | Facility sign-in page contains marketing@datadocks.com | Verify the prefill in the actual browser, not just URL inspection; it has previously worked with the email query parameter |
| 11 | If support destination is now configured, repeat its correction path with a separately agreed booking | Correct support destination; same explicit cancellation checks | Support email prefill only if the destination supports an agreed parameter |
| 12 | Review the private report | Test cancellation and any uncertainty are understandable | Nick’s export/report procedure; owner can find the exact Calendly booking and distinguish intent from confirmed outcome |

No real Yahoo/iCloud inbox is needed merely to test domain recognition; that rule is covered locally. If testing actual provider writes for those domains, use controlled addresses only—never invented recipients that might belong to someone else.

## Bento-specific checklist (deferred until this round)

- Validate actual API authentication/response shape, subscriber lookup by email and UUID, accepted-count response and timing of read-after-write visibility.
- Safe new-personal → new-work rename retains UUID, approved original-personal field, earlier fields, tags and unsubscribe state. Confirm real command semantics and delayed execution. API acceptance alone is not completion.
- Existing-personal/occupied-work fallback appends to the correct work contact, retains personal history, and does not overwrite an earlier personal field. Event history includes every visitor-reported association.
- Repeat visits with the same email append independent intentional actions. A replay of the same request does not append another event. CRM transport uncertainty stays visible and is never called guaranteed delivery.
- Inspect the agreed unsubscribe Flow with the sibling data owner. Its supplied configuration is already accepted evidence; verify actual execution without reopening the policy question. Confirm `demo_booked` triggers the existing DemoBooked flow once and cancellation never removes the “has booked” history.
- Check canonical context/current UTMs including msclkid, acquisition-field preservation, `dd_*` projections and server booking schema 1. `dd_verified_demo_booking_*` must remain verified even if a legacy browser event arrives later. Domain/provider-group fields describe the last processed event, not necessarily the canonical account identity.
- Check the sibling’s separate FreeTrial/resource substring-match concern in its own live Flow audit. Do not change those flows from this task.
- Cancellation event is emitted only after server verification, names the exact invitee, and has separate visitor-confirmation/observation/provider timestamps. `accepted` means Bento accepted the batch; confirm the contact/event and any triggered flow manually.
- Existing automated follow-up messages may reach the agreed test inboxes. Inspect them there; mark/clean up obvious test contacts/events through the normal operator process after saving the necessary test evidence. Do not silently unsubscribe/delete production contacts to make the test tidy.

## Focused resilience checks

First use local mocks for outages. In the live round use browser request blocking or the isolated runtime’s approved switches, not destructive changes to shared production services. Do not invent extra real bookings or duplicate writes to simulate a timeout.

- Cookie/storage blocked: qualification and calendar remain accessible; no false promise of saved CRM progress or verified cancellation.
- Bento unavailable: calendar and Calendly correction still work; UI does not wait for the CRM.
- Calendly read unavailable/missing marker/wrong event type: no website cancellation; clear invitation-management fallback. Missing support destination keeps its option hidden.
- Repeated clicks/replayed confirmation: at most one cancellation send attempt. Close the tab after the server accepts an operation: Worker can finish status checks.
- If a controlled cancellation response is interrupted, inspect status and history before any further action. Unknown does not mean failed. Never deliberately replay a real cancellation to test idempotence.
- External calendar fallback remains usable, but its post-booking correction is through the confirmation email in this version. Check the user accepts this uncommon fallback before full rollout; expanding coverage is a separate Calendly integration decision.

## Release gate and cleanup

Record pass/fail/unknown per check; fix failures before global activation. Verify mobile desktop flows on the live page. Confirm the reviewed revision has passed CI and built-publication checks before proposing general activation. Disable the verification-page switch and confirm 404. Retain the controlled booking/cancellation references privately for the agreed review period. Full rollout requires a reviewed deployment; finishing these documents or local tests is not authorization to publish.
