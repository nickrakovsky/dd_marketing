# Verified remaining security work — October 2, 2026

## Current findings

Fresh SSL Labs scans now show TLS 1.2 and 1.3 only on every tested address for datadocks.com, booking.datadocks.com and getdatadocks.com. Booking's earlier TLS 1.0/1.1 finding is resolved. Maintain the current settings; no new TLS change is needed for those hosts.

Marketing has enforced frame protection and nosniff, but document script restrictions remain report-only in production. PR #250 now proposes actual script enforcement and a paired mobile performance comparison. Its preview passes browser/security/accessibility and Lighthouse checks. The preview does not include the production Bento UUID/SDK script, so production-configured Bento worker readiness and forwarding remain a release condition, alongside the paired performance comparison, review, deployment and an HTML cache purge.

Booking's root HTML has no CSP header. Its actual login page, `/sessions/new`, has a nonce-based report-only CSP, but neither tested page has an enforced policy. New Relic and application inline scripts already carry nonces; nonce attributes and report-only policies alone do not enforce restrictions. HTML has nosniff and X-Frame-Options SAMEORIGIN; `/assets/application-329d157d.js` and `/assets/application-b49398f3.css` return correct JavaScript/CSS MIME types but lack nosniff. The observed `_data_docks_session` cookie has Secure, HttpOnly and SameSite=Lax.

Marketing apex/www returns HSTS `max-age=86400` without includeSubDomains even though the repository already specifies a one-year policy with includeSubDomains. Check the Cloudflare HSTS setting and response-header transforms rather than opening another repository-header PR.

HTTP redirects to HTTPS on the tested active hosts. go.datadocks.com now redirects to the marketing homepage, but its 301 discards campaign query strings. Full subdomain coverage still needs a Cloudflare DNS/hostname inventory. The legacy www.getdatadocks.com variant has no current DNS record (NXDOMAIN). If it appears in the old audit or legacy links, add it to the retirement redirects rather than treating the apex redirect as coverage for www.

All six marketing vendor assets fetched from production match the reviewed, pinned build bytes and retain nosniff and immutable caching. This verifies deployed files, not every dynamically loaded runtime dependency or logged-in booking flow.

## Cloudflare steps

1. Open **datadocks.com → SSL/TLS → Edge Certificates**. Confirm **Minimum TLS Version = TLS 1.2**, **TLS 1.3 = On** and **Always Use HTTPS = On**. The live TLS scans already pass; retain those settings. If a later hostname differs, inspect per-hostname overrides/certificate settings too.
2. Open **Rules → Transform Rules → Modify Response Header** (or the response-header rule type under the current Rules UI). Create **Booking frame protection and nosniff**. Expression: `http.host eq "booking.datadocks.com"`. Add **Set static**, header `X-Content-Type-Options`, value `nosniff`. Add **Add static**, header `Content-Security-Policy`, value `base-uri 'self'; object-src 'none'; frame-ancestors 'self'; upgrade-insecure-requests`. Keep this scoped to booking. Use Add for CSP so the developer's later nonce-bearing script policy is preserved and both policies are enforced. See `booking-response-headers.json` for the individual Rules API object; do not replace an existing zone ruleset with it.
3. Deploy that header rule and verify both booking HTML and the two asset URLs. This addresses frame protection/nosniff; it does **not** enforce booking script sources. The app work below is still required.
4. Open **SSL/TLS → Edge Certificates → HTTP Strict Transport Security (HSTS)**. Inventory the zone's active web subdomains and confirm valid HTTPS first. Configure **Max Age = 12 months**, **Apply to subdomains = On**, and keep **Preload = Off**. If another response-header rule sets the older HSTS value, correct it as well. Verify apex/www return `max-age=31536000; includeSubDomains`. The site's repository already requests this value.
5. Open the existing **go.datadocks.com Redirect Rule** and enable **Preserve query string**. Keep the intended fixed homepage destination. Test `https://go.datadocks.com/?utm_source=security-check` and confirm the Location is `https://datadocks.com/?utm_source=security-check`. PR #244 already contains HTTPS-first redirect definitions; reconcile that guide with the currently deployed rule instead of creating a second conflicting redirect.
6. For the legacy domain, review PR #245 and validate both getdatadocks.com and www.getdatadocks.com. Keep any active DNS records proxied and serve a valid HTTPS redirect. Review historic path mappings before deploying its path-preserving Worker.
7. After PR #250 is reviewed, merged and deployed, purge affected **marketing HTML** (`/`, `/posts`, the published articles, `/integrations` and other marketing pages). Preserve the existing cache rules and immutable asset caching. Check response-header transforms do not replace its stronger CSP with the earlier foundational policy. Then request a scanner retest.

## Copy to the booking developers

Implement an enforced, nonce-based Content-Security-Policy on booking.datadocks.com. The root page currently has nonce attributes on New Relic/application inline scripts but no CSP response header; `/sessions/new` has a nonce-bearing report-only header. Reuse the existing nonce plumbing and reviewed policy, extending coverage to every relevant HTML response. Use the same unpredictable per-response nonce in the enforced header and every trusted inline script. Keep responses containing session data/nonces private and non-cacheable; do not edge-cache authenticated HTML or reuse a fixed nonce.

Inventory scripts in login, authenticated scheduling, customer/carrier booking, rescheduling, SSO and error pages. Set `script-src` to self, the response nonce, and only the external script origins demonstrated necessary by that inventory. Include `base-uri 'self'`, `object-src 'none'` and `script-src-attr 'none'`. Preserve the login policy's intended `frame-ancestors 'none'` where embedding is unnecessary; use narrowly scoped embedding allowances only where the application requires them. Remove inline event attributes and any eval-dependent code. Enforce through Content-Security-Policy, not just Content-Security-Policy-Report-Only. Do not add unsafe-inline, unsafe-eval or a wildcard HTTPS source to make errors disappear.

Add X-Content-Type-Options: nosniff at the origin/reverse proxy for all responses, including `/assets/*`, errors and redirects, and keep correct MIME types. The temporary Cloudflare rule supplies edge coverage; the origin should supply it too.

Inventory every dynamically loaded executable script, including New Relic agent chunks. Pin versioned third-party resources and add integrity/crossorigin where the provider's CORS permits it, or self-host approved, hash-verified bytes. SRI on one loader does not automatically protect its descendants. Use New Relic's supported CSP/nonce configuration and verify reporting continues to work.

Acceptance: injected inline scripts, inline attributes and eval are blocked; all legitimate login/SSO/appointment/create/reschedule/cancel flows pass in a test tenant; New Relic still reports; HTML/JS/CSS/error responses carry the expected headers; no material mobile performance regression versus the current app. Record full runtime script coverage and all public endpoints before confirming the customer action items complete.

The booking app repository is not available through the current GitHub connection, so this is a developer handoff rather than an application-code patch.

## Other audit findings still visible

DNS queries still show no apex CAA record and DMARC `p=quarantine`. These are separate from the pasted TLS/CSP/SRI checklist. Verify the certificate authorities used by every active endpoint before adding CAA. Review legitimate senders/alignment in DMARC reports before promoting the existing policy to reject. DNS changes cannot be completed by merging this marketing PR.

## Sources and evidence

- [Cloudflare minimum TLS version and per-hostname settings](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/minimum-tls/)
- [Cloudflare response header transform rules](https://developers.cloudflare.com/rules/transform/response-header-modification/)
- [Cloudflare HSTS settings](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/)
- [Cloudflare Always Use HTTPS](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/)
- [Booking TLS scan](https://www.ssllabs.com/ssltest/analyze.html?d=booking.datadocks.com)
- [Marketing TLS scan](https://www.ssllabs.com/ssltest/analyze.html?d=datadocks.com)
- [Legacy TLS scan](https://www.ssllabs.com/ssltest/analyze.html?d=getdatadocks.com)

This PR changes only private deployment guidance and a rule definition. Merging does not apply Cloudflare settings or deploy the booking app.
