# Retire go.datadocks.com on Cloudflare

Destination: **https://datadocks.com/**. All old go paths land on the homepage; query strings, including campaign UTMs, are retained. This does not publish another copy of the website.

## Current status

The October 1, 2026 follow-up observed HTTP upgrading to HTTPS on go and HTTPS returning 301 to datadocks.com. Check the existing rule order, campaign paths/query strings and old-provider association before adding another rule. Reuse or adjust working redirects; do not create competing duplicates. This PR remains an operational handoff, not evidence that Cloudflare settings or provider removal were applied. TLS support on go port 8443 was not independently verified.

## Dashboard steps

1. Select the **datadocks.com** zone. In **DNS > Records**, ensure the existing `go` record is **Proxied** (orange cloud). Keep its current target while preparing the rules.
2. Open **Rules > Overview > Create rule > Redirect Rule**. Use **Custom filter expression** and create the rules below in this order. Place them before any broader rule that could redirect go traffic.

| Rule | Filter expression | Target type and value | Status | Preserve query string |
| --- | --- | --- | --- | --- |
| go HTTPS first | `(http.host eq "go.datadocks.com" and not ssl)` | Dynamic: `concat("https://go.datadocks.com", http.request.uri.path)` | 301 | Yes |
| retire go marketing | `(http.host eq "go.datadocks.com" and ssl)` | Static: `https://datadocks.com/` | 301 | Yes |

3. Deploy both rules and test the URLs below. Cloudflare's redirect action is terminal, so the HTTP rule must run first; it secures the same hostname before crossing to the main domain. HTTPS visits have one redirect to the main website.
4. Once verified, replace the marketing-provider DNS target with a single **A** record: name **go**, IPv4 **192.0.2.1**, **Proxied**. Remove the superseded conflicting go CNAME/A/AAAA records. This Cloudflare-documented placeholder is for a hostname fully handled by redirect rules; it is not a hosting server. The redirect rules must be active before this DNS change.
5. Confirm Cloudflare's edge certificate covers go.datadocks.com, then remove the old go website/domain association from the marketing provider and stop serving its HTML. Leave other hostnames and mail records alone.

`scripts/cloudflare/go-retirement-rules.json` contains the corresponding Rules API rule objects. Append them to the zone's existing `http_request_dynamic_redirect` ruleset in the displayed order. Do not replace the whole ruleset and erase other redirects. This PR does not deploy dashboard settings automatically.

## Verification

```sh
curl -sSI 'http://go.datadocks.com/old-campaign?utm_source=test'
curl -sSI 'https://go.datadocks.com/old-campaign?utm_source=test'
curl -sSIL --max-redirs 5 'http://go.datadocks.com/old-campaign?utm_source=test'
```

Expected: HTTP first returns 301 to `https://go.datadocks.com/old-campaign?utm_source=test`; HTTPS returns 301 to `https://datadocks.com/?utm_source=test`; the chain ends with a 200 response from the main website. There should be no marketing-provider HTML remaining at go.

Removing the old HTML addresses the missing frame protection and CSP on that separate site after a finding retest. It does not remove a hostname you own from SecurityScorecard attribution. DNS pointing alone cannot create an HTTP redirect. If any go campaign needs a specific destination, add that mapping above the homepage fallback before retiring it.

Cloudflare-generated redirects may bypass response-header Transform Rules because redirects terminate rule processing. If SecurityScorecard specifically requests security headers on the 301 itself, use a small redirect Worker that returns those headers; do not assume a later Transform Rule will run.

Sources: [Cloudflare Single Redirects](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/), [Create a redirect rule](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-dashboard/), [Redirect one domain to another](https://developers.cloudflare.com/fundamentals/manage-domains/redirect-domain/).
