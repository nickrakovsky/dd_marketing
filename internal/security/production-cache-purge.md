# Production cache purge

After a successful Cloudflare Pages production deployment, the workflow sends
exactly `{"hosts":["datadocks.com"]}` to the Cloudflare Purge Cache API. It clears
all paths and cached assets on that exact hostname. It excludes **every
subdomain**, including www, booking, checkin and customer app hosts. There are no
hostname inputs, wildcard selectors or zone-wide purge requests.

## One-time GitHub configuration

In this repository's Actions settings, configure:

- Variable `CF_ACCOUNT_ID`: the account hosting the `dd-marketing` Pages project.
- Secret `CF_ZONE_ID`: the Cloudflare zone ID for datadocks.com.
- Secret `CF_PURGE_API_TOKEN`: a Cloudflare API token with **Zone / Cache Purge**
  for the datadocks.com zone and **Account / Cloudflare Pages / Read** for the
  Pages account. Pages read access verifies the actual live deployment; the
  workflow never writes Pages configuration or deploys the website.

Missing configuration or a rejected purge fails the workflow visibly. Secrets
are supplied only to the production verification/purge step, never site builds.

## Deployment checks

Cloudflare's completed check wakes the workflow after a successful deployment.
CI completion on a main push is a fallback for GitHub's check_run suppression on
Actions-created commits. Both always check out trusted main and verify through
Cloudflare's project API that canonical_deployment is a successful production
deployment of the current main commit. A check-triggered run must also match
that exact deployment ID. Preview, failed, wrong-project/account and superseded
commits cannot purge. A main-branch manual dispatch can retry a missed/failed
purge after the same verification. Concurrent triggers are serialized; the
Cloudflare check and CI fallback may safely repeat the same exact-host purge.

This supersedes the approach in PR #238, whose Astro build hook runs before the
new deployment is live. Do not add that build-time hook alongside this workflow.
No live purge is performed when preparing or testing this PR.

Cloudflare edge purging does not erase visitors' browser caches or application
data. It also does not change request-time publication dates.

References:
- https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-hostname/
- https://developers.cloudflare.com/api/resources/cache/methods/purge/
- https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/get/
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#check_run
