# Secure the retired domain and update SecurityScorecard

## Old website

Keep getdatadocks.com registered, proxied through Cloudflare, and serving only redirects. There is no reason to retain the old website's HTML, scripts or hosting platform once its links are handled.

The supplied Worker implements:

`http://getdatadocks.com/path?query` → `https://getdatadocks.com/path?query` → `https://datadocks.com/path?query`

It sends HSTS, CSP, frame protection and nosniff on the legacy HTTPS redirect. It never fetches the old origin. Paths and query strings are retained. Review old high-traffic URLs: add explicit mappings for paths that have moved; do not assume every historic path exists on the new website. Keep the already-retired NXDOMAIN hosts `test`, `as` and `new` retired. www currently has no DNS record; its optional Worker route does not require recreating it.

### Cloudflare configuration

1. In the **getdatadocks.com** zone, verify **SSL/TLS > Overview** uses **Full (strict)** and **Edge Certificates** has valid coverage. Keep **TLS 1.3** enabled and minimum TLS at **1.2 or later**; do not lower an existing 1.3 minimum. The live independent checks on October 1 already found no obsolete protocols on tested port 443 and port 8443 endpoints.
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
| Missing CSP | Still missing on current marketing pages. Deploy the separate static + middleware CSP PR; retire go's old HTML. |
| unsafe-inline / unsafe-eval policy | No enforced script policy today. The CSP PR adds baseline protection and a report-only rollout; complete script hashing/externalization and preview validation before claiming this resolved. |
| Missing SRI | Deploy the separate verified first-party vendor asset PR; retest the actual resource. Cloudflare cannot add SRI to dynamic loaders with a header rule. |
| Missing HTTPS redirect | Main and old apex HTTP currently redirect to HTTPS. Verify all specifically reported hostnames; use this Worker for the old domain. |
| Insecure cross-domain HTTP redirect | This Worker upgrades the same hostname to HTTPS first, then redirects to the new domain with HSTS. |
| Missing nosniff | Main and go currently have it. The old-domain Worker carries it too; submit current evidence for stale findings. |
| Missing iframe protection | Main currently has SAMEORIGIN. Retire go's unprotected HTML; the old-domain Worker has DENY and frame-ancestors 'none'. |
| Obsolete TLS protocols | Not reproduced on tested legacy endpoints. Verify Edge Certificates minimum TLS settings, keep 1.3 enabled, and request a retest of the exact reported endpoint. |

Sources: [Claim a SecurityScorecard](https://support.securityscorecard.com/hc/en-us/articles/34707998741531-How-to-Activate-and-Claim-a-Scorecard-in-SecurityScorecard), [Add domains](https://support.securityscorecard.com/hc/en-us/articles/48171763968283-Add-assets-to-your-Digital-Footprint), [Manage or remove assets](https://support.securityscorecard.com/hc/en-us/articles/45103604591899-Manage-assets-or-request-their-removal), [Cloudflare Single Redirects execution order](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/), [Cloudflare Worker routes](https://developers.cloudflare.com/workers/configuration/routing/routes/), [Cloudflare TLS settings](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/minimum-tls/).
