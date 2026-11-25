# Demo safeguards — current checkpoint

Updated 25 November 2026. This replaces the September checkpoint. Work is on `codex/demo-qualification` in `/Users/work/.codex/worktrees/demo-qualification/dd_marketing`. The shared checkout is unrelated and has not been switched or edited.

## Current state

- The saved safeguards implementation was checkpointed locally, then integrated with `origin/main` at `51270d0`. Publication-boundary PR #234 is already included in main; it is no longer a dependency. The current boundary uses directory separation, not the earlier proposed filename manifest.
- The local simulation moved to `internal/pages/demo-qualification-preview.astro`. `/demo/verification` remains a separate runtime-gated, unindexed live-test page, disabled by default and excluded from the sitemap.
- Current security headers, pinned first-party Calendly assets, font/performance work, campaign attribution and lazy Yard UI are preserved. The runtime flag is read from the body attribute so it does not introduce a different inline script hash on the test page.
- Shared resource handlers and canonical Bento helpers were reconciled with the sibling data work. There is one resource-event writer; the unsubscribe/Flow account work remains with the sibling. Current campaign conversion-page attribution is preserved alongside original session context.
- Existing demo forms now use the shared capture owner; qualification routes them through the safeguards when enabled. The ordinary flow does not wait for CRM delivery. Form designs and navigation-dialog behavior remain separate.
- External cancellations observed before a booking can be verified are retained in the audit but leave the scheduled queue, preventing them from blocking later work.
- A reproducible offline deployment builder now supplies a bundled disabled Worker, two migrations, settings generator, checksums, exact source revision and optional incremental Git source bundle. CI is configured to build/check this package too. Nothing has been provisioned or deployed by Codex, and no real Bento/Calendly call has been made.

## Next actions, in order

1. Complete the integration review and focused checks, commit the dedicated branch and build the final package. Use [Nick's single installation checklist](demo-qualification-nick-setup.md), included as `START-HERE.md` in the package. A prepared package does not mean CI has passed.
2. Required GitHub Actions and Cloudflare preview checks must pass for the reviewed revision before installation/release. Full builds, type-check/unit suites, E2E, accessibility, performance and built-publication checks belong to CI, per current workspace instructions. Do not duplicate them locally.
3. Nick confirms Production project name, database ID and full Calendly identifiers, then applies the package once the checks are cleared. Keep every new switch false. The screenshot proves entered settings/binding only, not successful runtime credentials, migrations or Worker installation.
4. Re-present [the saved live verification list](demo-qualification-live-verification.md) and coordinate activation of only the isolated test. All real Bento checks remain deferred to that round. The user's Gmail aliases and marketing@datadocks.com are already agreed.
5. Public activation follows successful live review. Support destination and operating ownership/retention remain human decisions; they do not prevent the facility test. No retention deletion or outbound human notifications have been enabled.

## Accepted behavior

Only exact gmail.com/yahoo.com/icloud.com trigger qualification. Personal capture runs separately from the work-email prompt. Safe rename of a newly captured personal contact is preferred; existing-personal or occupied-work cases retain both contacts and save the association, with `original_personal_email` preserved. No destructive merge or blind replay.

Cancellation requires visitor confirmation and verification of that signed session's individual booking. Unknown outcomes remain visible. Reporting is at-most-one send attempt, not guaranteed delivery; verified completion fields cannot be downgraded by legacy events. Cancellation retains historic DemoBooked status.

Facility redirect is `https://booking.datadocks.com/sessions/new?email=...`; actual prefill previously worked and remains on the live checklist. Support stays hidden until configured. External-calendar-tab fallback uses Calendly invitation management rather than the website correction screen in this version; review that limitation in the live round.

## Evidence and local tooling

Use the final package manifest for the exact commit and file checksums. Focused integration/unit/packaging checks, scoped strict TypeScript, scoped lint and source-boundary checks have passed locally; pre-existing lint warnings remain. Full CI and live-provider checks must be reported separately and are not claimed here. Earlier September test counts describe the earlier revision only.

Node is `/Users/work/.nvm/versions/node/v24.14.0/bin/node`. This worktree now has its own dependencies installed from the current lockfile; the old shared node_modules symlink was removed without altering the shared checkout. Unrelated CSVs and historical notes remain outside the deployment package. Generated packages under `internal/demo-deployment/` are ignored and never website inputs.
