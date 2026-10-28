# Apex cache purge after a Pages deployment

GitHub stores code and runs offline tests only. **No Cloudflare API token or
webhook secret belongs in GitHub.** Cloudflare's Pages deployment-success
notification wakes a separate Cloudflare Worker. The Worker checks the live
`dd-marketing` production deployment and sends exactly
`{"hosts":["datadocks.com"]}` to the purge API. Every app subdomain, including
www, booking and checkin, is excluded. There is no request-controlled hostname,
zone, URL list or purge selector, and the helper has no datadocks.com route.

After the one-time setup below, merging a PR and successfully deploying Pages
is the signal. No special PR flag, GitHub purge job or build-time purge is needed.

## 1. Deploy the helper inside Cloudflare

Create a separate Worker named `datadocks-apex-cache-purge` using Cloudflare's
Git integration with this repository. Use production branch `main`, repository
root `/`, no application build command, and deploy command:

```sh
npx wrangler deploy --config scripts/cloudflare-cache-purge/wrangler.jsonc
```

Use the existing locked npm dependencies. Disable non-production branch builds
for this helper. Cloudflare manages its own build/deploy authorization; do not
put a deploy token in GitHub. This is separate from the existing `dd-marketing`
Pages project: do not replace its build or deployment command.

The config creates a SQLite-backed Durable Object to serialize notifications
and remember the last successfully purged deployment. The public endpoint is
only `https://datadocks-apex-cache-purge.<your-workers-subdomain>.workers.dev/pages-deployed`.
No marketing or application custom-domain route is attached. `keep_vars: true`
preserves the dashboard variables below across future helper deployments.

## 2. Create a narrowly scoped Cloudflare API token

In Cloudflare, open **My Profile > API Tokens > Create Token > Create Custom
Token**. Give it a dedicated name such as `DataDocks apex purge worker`.
Configure only these permissions:

| Permission | Resource restriction | Purpose |
| --- | --- | --- |
| Zone / Cache Purge | Include / Specific zone / **datadocks.com** | Purge the apex cache |
| Account / Cloudflare Pages / Read | Include / Specific account / **the dd-marketing account** | Independently verify the live production deployment |

Do not select all accounts/zones or add DNS, Workers, Pages Edit, account-admin,
user-management or token-creation permissions. Use a dedicated API token rather
than the Global API Key or an existing deployment/admin token. Pages Read is
account-scoped; this is not permission to edit or deploy the app.

**Permission boundary:** Cloudflare's Cache Purge token permission is scoped to
a **zone**, not an individual hostname. The datadocks.com zone also contains
its subdomains. The token itself therefore could purge their caches if stolen;
Cloudflare does not enforce an apex-only restriction on this token. This
Worker enforces the narrower fixed apex selector and keeps the credential out
of GitHub and webhook requests. Stronger token-level separation would require
a separate Cloudflare zone or another separately enforced privilege boundary.

Set an expiry (for example, 90 days) and rotate before it expires: create a
replacement with the same restricted scopes, update the Worker secret, verify
a successful deployment notification/purge, then revoke the old token. Use
Cloudflare account MFA. Store any recovery copy in your password manager.

Client IP filters are useful only with a verified stable egress IP. Worker
outbound IPs are not a dedicated fixed address: do not enter your home/office
IP, assume a dedicated Worker IP, or allowlist huge shared ranges and describe
that as strong isolation. This design does not run on GitHub-hosted runners.

## 3. Put variables and secrets only in the helper Worker

Open **Workers & Pages > datadocks-apex-cache-purge > Settings > Variables and
Secrets**. Configure these runtime bindings (not Pages/build variables):

| Name | Type | Value |
| --- | --- | --- |
| `CF_ACCOUNT_ID` | Text | Account ID hosting dd-marketing |
| `CF_ZONE_ID` | Text | datadocks.com zone ID |
| `CF_PURGE_API_TOKEN` | **Secret** | Dedicated token from step 2 |
| `WEBHOOK_SECRET` | **Secret** | Independently generated random value, at least 32 bytes |

Account and zone IDs are identifiers, not credentials. Generate a 32-byte
webhook secret locally with `openssl rand -hex 32` or a password manager; the
result is 64 hexadecimal characters. Store it securely because the same value
is needed in step 4. Never paste either secret into the PR, code, logs, chat or
a URL. Never reuse the Cloudflare API token as the webhook secret.

Protect main and require review for changes to this helper. Restrict who can
edit the Worker, its runtime secrets, the Pages notification, and repository
production code. The API credential is never exposed to PR preview jobs.

## 4. Connect the Cloudflare production deployment event

1. In Cloudflare **Alerts > Destinations**, create a **Generic webhook**.
2. Set its URL to the helper's `...workers.dev/pages-deployed` URL and its
   **Secret** to the same `WEBHOOK_SECRET` value. Cloudflare sends that value in
   `cf-webhook-auth`; the helper checks it before any API request.
3. Choose **Save and Test**. A test message returns 200 and intentionally does
   **not** purge anything.
4. Create a **Pages / Project updates** notification with filters: project
   **dd-marketing**, environment **Production**, event **Deployment success**.
   Send it to this generic webhook only. Do not reuse this destination for
   unrelated account alerts. Save/enable the notification.
5. After the next normal production deployment, check notification delivery
   history and the helper Worker logs for its deployment ID and apex-only
   purge confirmation. A rejected verification/purge returns an error; do not
   broaden the token's permissions to work around it.

The webhook body is only a wake-up signal. It cannot specify a target host or
trusted deployment: Cloudflare's project API is authoritative. Preview, failed,
unfinished, dirty or skipped deployments cannot purge. Duplicate/concurrent
deliveries are coalesced; success is recorded only after Cloudflare accepts the
purge. A delivery interrupted after purge but before recording may safely
repeat the same apex-only purge. Production rollbacks are checked against the
actual live deployment rather than GitHub's newest commit.

## Scope and verification

The helper and notification require one-time setup in Cloudflare after merge;
creating this PR does not deploy/configure them or perform a live purge.
This replaces the earlier GitHub-secret implementation in PR #275 and the
build-time idea in #238. No cron is used, and scheduled article publication
rules remain unchanged. Edge purging does not erase browser caches or app data.

Tests: `node --test scripts/purge-production-cache.test.mjs`.
Bundle/config check: `npx wrangler deploy --dry-run --config scripts/cloudflare-cache-purge/wrangler.jsonc`.

Official references:
- https://developers.cloudflare.com/notifications/notification-available/ (Pages project updates)
- https://developers.cloudflare.com/notifications/get-started/configure-webhooks/
- https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
- https://developers.cloudflare.com/fundamentals/api/how-to/restrict-tokens/
- https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/get/
- https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-hostname/
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
