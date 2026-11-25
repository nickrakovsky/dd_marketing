# Marketing CSP on cached reloads

The homepage's initial HTTP 200 response includes the build's trusted script hashes and the response nonce Cloudflare adds for Zaraz. A conditional request returns HTTP 304 with the original hash-only CSP. Updating a browser's cached response with that header removes the authorization for the Zaraz script still in its cached HTML. The nonce belongs to that cached document; generating a replacement nonce for the 304 would also mismatch it.

Initial-load checks with desktop and headless Chromium, on the homepage and integrations, reported no enforced violations. The inspection must also exercise the browser HTTP cache. Playwright request routing disables that cache, so the revalidation check uses CDP to block known vendor endpoints while retaining normal cache behavior.

## Cloudflare change

Add the individual rule in `marketing-csp-304-rule.json` to the existing `http_response_headers_transform` ruleset. Preserve the existing ruleset and put this rule after any rules that set CSP. Merging this file does not deploy the Cloudflare rule.

In the domain's **Rules > Overview**, choose **Create rule > Response Header Transform Rule**. Name it **Retain cached HTML CSP on 304**. Use this custom expression:

```text
(http.host in {"datadocks.com" "www.datadocks.com"} and http.response.code eq 304 and any(http.request.headers["accept"][*] contains "text/html"))
```

Select **Remove** for **Content-Security-Policy**, then deploy the rule. It applies only to marketing HTML revalidation responses. The browser retains and enforces the CSP from the cached HTTP 200 document, including its matching nonce and script hashes. A normal HTTP 200 continues to receive the enforced CSP.

This retains the existing CDN TTLs, browser revalidation, script-loading sequence and immutable asset caching. HSTS settings remain unchanged. The change does not require an added script hash or an unsafe CSP keyword.

## Recovery and validation

After applying the rule, purge the affected homepage HTML URLs, `https://datadocks.com/` and `https://www.datadocks.com/`, to clear their edge copies. Purge other affected marketing HTML URLs if they exhibit this issue. A CDN purge does not clear browser caches: use a hard refresh and confirm an HTTP 200 for recovery in a browser whose cached CSP has already lost its nonce.

Verify an initial response is HTTP 200 with the enforced build hash policy and Cloudflare's matching nonce. Then use a normal reload with the browser cache enabled: its HTTP 304 must omit the CSP header, the cached policy must remain enforced, and Zaraz must start without an enforced violation. An unapproved inline script must still be blocked after revalidation.

`scripts/inspect-csp-revalidation.mjs` reproduces the current production reload behavior. It then uses a local HTTP-cache fixture containing a hashed application script and a nonced provider script to verify the exact 304 header change: both scripts must execute after the fixed reload, while an unapproved inline script remains blocked. Its JSON report distinguishes the production reproduction from that fixture. Production remains unchanged. Runtime evidence is attached to the PR's **Live script CSP evidence** workflow.

## References

- [HTTP cache metadata updates (RFC 9111)](https://httpwg.org/specs/rfc9111.html#rfc.section.3.2)
- [Cloudflare Zaraz and CSP](https://blog.cloudflare.com/cloudflare-zaraz-supports-csp/)
- [Response Header Transform Rules](https://developers.cloudflare.com/rules/transform/response-header-modification/create-dashboard/)
- [Response fields available to header transforms](https://developers.cloudflare.com/rules/transform/response-header-modification/reference/fields-functions/)
