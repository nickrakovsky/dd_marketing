# Restore the www host without contacting its failing origin

On October 19, 2026, `https://www.datadocks.com/robots.txt` returned Cloudflare
522. The apex robots and sitemap endpoints returned 200. A marketing build or
Pages `_redirects` edit cannot repair an origin timeout on a separate hostname.

`www-apex-redirect.rule.json` is one Cloudflare Single Redirect rule for the
datadocks.com zone's `http_request_dynamic_redirect` phase. It matches exactly
`www.datadocks.com`, redirects HTTP and HTTPS to `https://datadocks.com`, and
preserves the request path and query string. It runs at the edge before an
origin connection, so www does not need a healthy website origin. It does not
match the apex, app, booking, docs, go, or preview hosts.

## Activate in Cloudflare

1. In the datadocks.com zone, confirm the www DNS record is proxied (orange
   cloud), resolves through Cloudflare, and has an active edge TLS certificate.
   The observed 522 establishes that HTTPS already reached Cloudflare; it does
   not establish that every resolver and certificate is configured correctly.
2. Open Rules > Redirect Rules > Single Redirects. Review existing redirects
   for conflicting www matches. Add the rule in this JSON as an individual
   rule; do not replace the zone's existing ruleset.
3. Dashboard expression: `(http.host eq "www.datadocks.com")`. Use Dynamic URL,
   `concat("https://datadocks.com", http.request.uri.path)`, status 301, and
   Preserve query string. Put it before conflicting rules in that phase.
4. Use Cloudflare Trace and then the verification commands below. If www
   remains 522, confirm the rule is enabled in the correct zone and that the
   request is not intercepted by a conflicting earlier redirect.

API users can POST the supplied **individual rule** to
`/zones/{zone_id}/rulesets/{existing_redirect_ruleset_id}/rules`, after inspecting
the current entry-point ruleset. If no entry-point ruleset exists, create one
with `kind: zone`, `phase: http_request_dynamic_redirect` and this rule in its
`rules` array. Never PUT a one-rule replacement over an existing ruleset.

## Verify after activation

```bash
curl -sS -D - -o /dev/null https://www.datadocks.com/robots.txt
curl -sS -D - -o /dev/null 'https://www.datadocks.com/posts?utm_source=www-check&label=a%20b'
curl -sS -D - -o /dev/null http://www.datadocks.com/robots.txt
curl -sS -L --max-redirs 3 -D - https://www.datadocks.com/robots.txt
```

Expect a client-visible 301 to the same path/query on HTTPS datadocks.com, then
200 text/plain for robots.txt. Confirm the apex and booking/app hosts retain
their existing behavior. No robots-content change is required. Roll back by
disabling only the rule with ref `datadocks_www_to_apex`.

Merging this PR does not activate a zone setting. Cloudflare credentials were
not available in the audit session, and this change has not been applied live.

References:
- https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-api/
- https://developers.cloudflare.com/rules/url-forwarding/single-redirects/settings/
- https://developers.cloudflare.com/pages/how-to/www-redirect/
- https://developers.cloudflare.com/pages/configuration/redirects/
