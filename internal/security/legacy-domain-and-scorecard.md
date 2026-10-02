# Secure the retired domain and update SecurityScorecard

## Old website

Keep getdatadocks.com registered, proxied through Cloudflare, and serving only redirects. There is no reason to retain the old website's HTML, scripts or hosting platform once its links are handled.

The supplied Worker implements:

`http://getdatadocks.com/path?query` → `https://getdatadocks.com/path?query` → `https://datadocks.com/path?query`

It sends HSTS, CSP, frame protection and nosniff on the legacy HTTPS redirect. It never fetches the old origin. Paths and query strings are retained. Review old high-traffic URLs: add explicit mappings for paths that have moved; do not assume every historic path exists on the new website. Keep the already-retired NXDOMAIN hosts `test`, `as` and `new` retired. www currently has no DNS record; its optional Worker route does not require recreating it.

### Cloudflare configuration

1. In the **getdatadocks.com** zone, verify **SSL/TLS > Overview** uses **Full (strict)** and **Edge Certificates** has valid coverage. Keep **TLS 1.3** enabled and minimum TLS at **1.2 or later**; do not lower an existing 1.3 minimum. The independent October 1 follow-up found TLS 1.2/1.3 only on all four tested legacy-domain port 443 addresses. Port 8443 served an HTTPS redirect, but its supported TLS versions were not independently verified; test that exact port separately. Booking still allowed TLS 1.0/1.1 on all four tested addresses and needs a datadocks.com-zone fix.
2. Create a Worker under **Workers & Pages**, paste `scripts/cloudflare/legacy-domain-redirect.mjs`, and add the route **getdatadocks.com/** followed by a wildcard `*` in the getdatadocks.com zone. Add **www.getdatadocks.com/** plus `*` only if that hostname is being retained. The supplied Wrangler config expresses these routes without enabling workers.dev.
3. Test the Worker before replacing the origin. Ensure a broad Single Redirect/Page Rule is not intercepting requests first; redirect rules execute before Workers. Replace the existing direct HTTP-to-new-domain redirect with the Worker route. Always Use HTTPS can remain enabled; it should upgrade the same host first.
4. Once the route works, use a proxied apex **A 192.0.2.1** record and remove only superseded web-origin records. Preserve MX/TXT/email records. Keep valid certificates and Cloudflare proxying active. Remove the old website's hosting/domain association after verification.

CLI review/deployment commands, when authenticated to the intended account:

```sh
node --test scripts/cloudflare/legacy-domain-redirect.test.mjs
npx wrangler deploy --config scripts/cloudflare/legacy-domain-redirect.toml --dry-run
npx wrangler deploy --config scripts/cloudflare/legacy-domain-redirect.toml
```

The first two commands are validation; the third deploys the Worker. This PR does not run the deployment. Response-header Transform Rules alone are not a reliable way to attach HSTS to a Cloudflare-generated redirect, because redirect actions terminate rule processing. Returning the headers from the Worker makes that behavior explicit.

Verify with `curl -sSI http://getdatadocks.com/`, `curl -sSI https://getdatadocks.com/` and `curl -sSIL --max-redirs 5 http://getdatadocks.com/`. The HTTPS redirect should include HSTS and the chain should end at datadocks.com without old website HTML.

## SecurityScorecard: make datadocks.com the current site

The free-trial thank-you URL is a signup confirmation, not the screen where scan targets are edited.

1. Activate the account from the email and sign in at [SecurityScorecard](https://platform.securityscorecard.io/). A signup email at **@datadocks.com** can automatically claim that domain's scorecard. If the existing account claimed getdatadocks.com, request the correct primary scorecard/domain from support rather than registering a misleading ownership claim.
2. Go to **My Organization > My Scorecard > Digital Footprint > Domains > Add** and add/claim **datadocks.com** as an owned current domain. This needs the appropriate permissions; if the control is unavailable on the trial or account, submit a support request. Adding the apex discovers its subdomains; subdomains cannot be added individually through this control.
3. Ask support to use **datadocks.com as the primary company website/scorecard** and identify getdatadocks.com as a **retired, redirect-only owned domain**. Request a review of stale assets such as the NXDOMAIN legacy subdomains and the retired go website after its redirect is deployed.
4. On each relevant finding, submit current remediation evidence and request a retest. Include the actual hostname/path/port, header output or redirect chain, and the deployment date. The April 21, 2026 PDF is a historical snapshot; a changed scorecard will not change that PDF.

Updating the primary website does not exclude other assets the company still owns. Do not classify getdatadocks.com as misattributed just because it redirects, or call it third-party parked. If an owned asset remains in the footprint, securing it is the practical fix. Approved qualification/removal requests update the score within 48 hours; adding a domain can take several days. Individual finding retests depend on the finding workflow.

## Audit-to-remediation map

| Concern in the April report | Current finding and action |
| --- | --- |
| Missing CSP | Main marketing now enforces base-uri, object-src and frame-ancestors, with a separate diagnostic script policy. PR #250 adds enforced script-src-attr. The complete script policy remains open; booking has no enforced CSP on the tested login/reset routes. |
| unsafe-inline / unsafe-eval policy | Main marketing still has no enforced script-src/default-src. Partytown 0.13.2 evaluates vendor code with new Function. Replace that execution path and hash/externalize owned scripts before enforcing a complete script policy. |
| Missing SRI | PR #247 is merged. All six live marketing vendor assets match their approved pins. Calendly/Dealfront native loaders carry browser SRI; Bento remains build-verified in Partytown. Cloudflare cannot add SRI with a header rule. |
| Missing HTTPS redirect | Main and old apex HTTP currently redirect to HTTPS. Verify all specifically reported hostnames; use this Worker for the old domain. |
| Insecure cross-domain HTTP redirect | This Worker upgrades the same hostname to HTTPS first, then redirects to the new domain with HSTS. |
| Missing nosniff | Tested marketing HTML/assets have it. Booking HTML has it, but its tested application JS/CSS assets do not. Fix the booking asset-serving layer or a scoped Cloudflare response-header rule. The legacy Worker carries it on redirects. |
| Missing iframe protection | Main has enforced frame-ancestors 'self' and SAMEORIGIN. Booking has SAMEORIGIN, but its frame-ancestors directive is only report-only. Go already redirected during the follow-up; verify all retained paths. The legacy Worker has DENY and frame-ancestors 'none'. |
| Obsolete TLS protocols | Legacy port 443 passes; booking port 443 fails on IPv4 and IPv6. Set its applicable minimum TLS policy to 1.2 or later, keep TLS 1.3 enabled, and retest every reported host/address/port independently. Port 8443 remains unverified. |

Sources: [Claim a SecurityScorecard](https://support.securityscorecard.com/hc/en-us/articles/34707998741531-How-to-Activate-and-Claim-a-Scorecard-in-SecurityScorecard), [Add domains](https://support.securityscorecard.com/hc/en-us/articles/48171763968283-Add-assets-to-your-Digital-Footprint), [Manage or remove assets](https://support.securityscorecard.com/hc/en-us/articles/45103604591899-Manage-assets-or-request-their-removal), [Cloudflare Single Redirects execution order](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/), [Cloudflare Worker routes](https://developers.cloudflare.com/workers/configuration/routing/routes/), [Cloudflare TLS settings](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/minimum-tls/).
