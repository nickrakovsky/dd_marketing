# Marketing script CSP

Production currently enforces a foundational policy but leaves `script-src` in report-only mode. This PR promotes a real document script policy without changing script bodies, loading schedules, stylesheet priority or cache directives.

## Document enforcement

The build parses its reviewed HTML with parse5 and hashes executable inline scripts. It includes the private home, hub, article and video render samples before their existing cleanup, so future publication states use the same reviewed allowlist. JSON-LD, inert templates, comments and external scripts do not expand the inline allowlist. Arbitrary response HTML is never hashed at request time.

The script policy allows only same-origin scripts and the build's SHA-256 hashes, blocks inline event attributes, and restricts worker URLs to the same origin. It has no `unsafe-inline`, `unsafe-eval`, `strict-dynamic` or broad HTTPS allowance. Existing first-party vendor pins/SRI remain unchanged.

The build adds document-only rules to `dist/_headers`; the foundational wildcard rule still supplies frame protection and other headers. Pages combines the two CSP values, and browsers enforce both policies. An early meta policy also protects the static 404 document returned at unknown URLs. Its charset remains first. Static worker JavaScript does not receive the document script policy.

The compiled Worker receives the same build policy through a private placeholder replacement. Middleware enforces it on marketing HTML without reading or hashing response bodies. The authenticated `/keystatic` editor is a separate application and retains the earlier diagnostic policy. Limits are checked: 100 Pages rules and 2,000 characters per header line. A build fails instead of widening the policy if either limit is exceeded or the Worker placeholder is missing.

## Partytown boundary

Bento remains in the existing Partytown worker. Partytown 0.13.2 evaluates reviewed vendor code with `new Function`; its service-worker-generated sandbox and dedicated worker are separate execution contexts. This PR enforces document script restrictions and adds no eval exception. It does **not** claim to remove eval from Partytown or impose the document policy on that worker. Applying a zone-wide document CSP to its worker assets would break Bento. If the customer requires eval to be prohibited inside workers too, replacing Partytown is separate application work and needs tracking and performance validation.

## Release checks

1. Run `npm run test:script-csp`, lint, typecheck, unit tests, vendor/publication regression tests, build and scheduled-publication tests.
2. Test the Cloudflare preview on `/`, `/integrations`, `/posts` and a published article. Prove that an unapproved inline script and document eval are blocked while async CSS, hydration, mobile citations, lead-form validation and the Calendly popup/fallback still work.
3. Confirm Bento's worker/SDK load and event forwarding with test network interception. Verify Dealfront on the production hostname without submitting a real lead or booking.
4. Review the three interleaved mobile Lighthouse runs for production and preview on the home page, integrations and yard-management article. The comparison fails on material LCP, TBT or CLS regressions and uploads its evidence. Dealfront remains production-only; lab comparisons cannot guarantee identical real-user performance.
5. Merge after preview checks, deploy and purge the affected marketing HTML cache. Verify the deployed `script-src` header is enforced. A Cloudflare Transform Rule must not overwrite the new header with the old foundational-only policy.

HSTS still needs a separate Cloudflare correction: repository headers already request `max-age=31536000; includeSubDomains`, while production returns `max-age=86400`.

Sources: [Cloudflare Pages headers](https://developers.cloudflare.com/pages/configuration/headers/), [Pages limits](https://developers.cloudflare.com/pages/platform/limits/), [Partytown configuration](https://partytown.qwik.dev/configuration/).
