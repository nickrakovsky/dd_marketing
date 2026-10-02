# CSP rollout on Cloudflare Pages

The live audit on October 1, 2026 found no CSP on either static or Worker-rendered marketing pages. This change adds the same enforced policy to both delivery paths. Cloudflare Pages does not apply `public/_headers` to Pages Functions, so the Astro middleware is required too.

## What is enforced

`base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src-attr 'none'; upgrade-insecure-requests`

This prevents cross-origin framing, external base-URL injection, plugin objects and inline event attributes, and upgrades insecure resource URLs. A small listener in the document head applies asynchronously loaded stylesheets; it adds no network request. Static pages retain Beasties' preload behavior, and Worker pages retain print-media loading and critical CSS. Citation actions use a delegated click listener. There is no new response-body rewriting, per-request nonce or cache change. The existing X-Frame-Options and nosniff headers remain in place.

**This is a first stage, not a complete script/XSS policy.** The enforced policy intentionally has no `script-src` or `default-src`. Absence of `unsafe-inline`/`unsafe-eval` in this header does not mean arbitrary scripts are blocked. Do not close the unsafe-script-policy concern based only on this PR.

## Stricter script policy

The separate `Content-Security-Policy-Report-Only` header tests same-origin scripts plus the current vendor hosts and rejects inline event attributes in diagnostic mode. It logs violations in browser developer tools; no external reporting service is configured. Existing inline scripts will produce expected warnings while continuing to execute.

Before enforcing `script-src`:

1. Move owned inline scripts into Astro-processed external modules, or add hashes for each trusted inline block at build time. Do not hash arbitrary response HTML at request time.
2. Keep stylesheet `onload` attributes and the smart-link `onclick` attribute absent. They have been replaced with event listeners; `tests/security-headers.spec.ts` verifies real browser enforcement, delayed CSS loading and mobile citation navigation.
3. Test the Partytown worker, Bento event forwarding, Dealfront, lead forms, Calendly popup and fallback, blog search and video embeds on a production build. Check worker policy separately; Partytown executes vendor code inside a worker.
4. Add only the required script sources/hashes. Do not enable `unsafe-inline`, `unsafe-eval` or all of `https:` as a shortcut.
5. Enforce on preview, verify those flows without sending real leads, and only then promote the stricter policy to production.

Partytown 0.13.2 (the locked version) uses `new Function(scriptContent)` in its worker. A nonce or hash on its bootstrap does not remove that evaluation requirement. Do not solve this by weakening the policy on Worker responses or adding `unsafe-eval`. Replace this execution path with an external, CSP-compatible worker or an explicitly reviewed native/server-side Bento integration, preserving the existing `identify`, `track`, `view`, `tag` and `updateFields` contract. If moving work onto the main thread, compare mobile LCP and total blocking time against the current build before rollout.

## Deployment and verification

Merge and deploy through the normal Cloudflare Pages workflow. Check `/integrations` (static) and `/posts` and `/` (Worker-rendered):

```sh
curl -sSI https://datadocks.com/integrations
curl -sSI https://datadocks.com/posts
curl -sSI https://datadocks.com/
```

Each should have exactly one enforced CSP and one report-only header. A Cloudflare Response Header Transform using **Set static** can enforce the same foundational policy on proxied marketing hostnames. Keep it scoped to `datadocks.com` and `www.datadocks.com`; a zone-wide rule could affect the application or unrelated subdomains. Avoid adding a duplicate header or overwriting a later stricter policy.

Request a SecurityScorecard finding retest after deployment. Report-only rules alone do not remediate a finding.

Sources: [Cloudflare Pages headers](https://developers.cloudflare.com/pages/configuration/headers/), [Cloudflare response header rules](https://developers.cloudflare.com/rules/transform/response-header-modification/create-dashboard/), [Astro v5 CSP limitations](https://v5.docs.astro.build/en/reference/experimental-flags/csp/).
