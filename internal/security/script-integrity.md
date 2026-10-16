# Verified marketing scripts

The October 1, 2026 audit found a third-party Bento script without an integrity attribute. Calendly and Dealfront are also loaded dynamically. Adding `integrity` to every external URL is not sufficient: Calendly currently allows cross-origin reads only from its own origin, Dealfront does not advertise CORS, and Partytown executes Bento via a worker rather than normal browser script loading.

This PR publishes reviewed copies at content-versioned `/_astro/vendor/` URLs:

- Calendly widget JS, CSS and its close icon.
- Dealfront tracker.
- Bento bootstrap **and** the SDK it loads. The bootstrap's SDK URL is rewritten to the reviewed local asset.

`src/lib/vendor-assets.mjs` records the public source URLs and SHA-384 pins. The build verifies every downloaded, cached or committed snapshot before publication and fails on unexpected bytes or a failed download. No live CDN fallback executes unreviewed code. Calendly and Dealfront additionally have browser SRI on their native script elements. Bento stays in Partytown, with build verification instead of pretending that an integrity attribute is enforced by Partytown.

The Bento SDK uses a reviewed snapshot at `src/assets/vendor/bento-sdk.js`, captured from `https://app.bentonow.com/b4cb9a34a989bcc643714151df7b7154.js` on October 1, 2026. Its SHA-384 remains `sha384-wXML0YNxxUzw4ZMCNPmYMgFKJwZWr4rw8/XxyI56JGDzr5oC+To3I0lc3qRqEgJ1`. Bento returned HTTP 403 to the GitHub-hosted build runner, so builds read these exact approved bytes locally. Every build verifies the snapshot, even if a cached copy exists. A missing or modified snapshot fails without a network fallback. Changes to the SDK require source review, replacing the snapshot, and updating the pin together.

The existing idle/on-demand schedules, booking URL, event forwarding and production hostname gate remain intact. The Calendly iframe still runs at calendly.com. Optional Bento surveys/chat/customizations are not used by this site and are outside this asset list; review their script dependencies if enabling those features.

## Deploy and maintain

1. Run `npm run test:vendor-assets`, `npm run build` and `npm run test:publication`.
2. Deploy a Cloudflare Pages preview. Confirm `/_astro/vendor/*.js` is served directly with the right MIME type and immutable caching. These generated files use the existing `/_astro/*` asset route and cache policy.
3. Test the Calendly popup, close button and fallback without submitting a booking. Check Bento readiness/forwarding and Dealfront on a production hostname or with locally intercepted network requests, avoiding real lead submissions.
4. Merge after review and preview validation; request a SecurityScorecard retest.

The reviewed Bento ID is `b4cb9a34a989bcc643714151df7b7154`. A different `PUBLIC_BENTO_SITE_UUID` fails the build rather than publishing another site's SDK. When a vendor changes its mutable URL, review the source diff and update the pins intentionally. The currently deployed assets continue working while a new build is blocked. Dependency hashes appear in transformed filenames, so changed SDK/icon dependencies invalidate the correct assets too.

Cloudflare Transform Rules cannot add integrity attributes to HTML or dynamic loaders. This change belongs in the Pages repository. Cloudflare security-header configuration is handled separately.

Sources: [SecurityScorecard SRI finding](https://support.securityscorecard.com/hc/en-us/articles/41067186972827-Unsafe-Implementation-of-Subresource-Integrity-SRI), [Cloudflare Pages headers](https://developers.cloudflare.com/pages/configuration/headers/).
