# YouTube Shorts refresh

The resource hub reads the deployed `src/content/videos` collection. It does not
query YouTube when a visitor opens `/posts`. A successful website rebuild alone
does not import new videos.

`Refresh YouTube Shorts` runs daily at 13:17 UTC, after the channel's usual
11:45 UTC publication time. It imports new public Shorts, validates a production
build and publication behavior when content changes, and commits the additions
to `main`. The existing Cloudflare Git integration deploys that commit. No
Cloudflare dashboard setting or new deploy hook is required by this workflow.

## Configuration

- GitHub Actions repository secret: `YOUTUBE_API_KEY`, a valid YouTube Data API v3 key.
- Channel ID is public configuration in the workflow: `UCwJE5ABaemfSGzk1DBSMGBQ`.
- The workflow requests `contents: write` to commit the imported content. It uses
  ordinary fast-forward pushes and respects repository branch protection.

The schedule becomes active only after this workflow is on the default branch.
The API key must be configured before the first scheduled run. GitHub may delay
scheduled jobs; this is a daily refresh, not an immediate publication webhook.

## Manual checks and recovery

Use Actions → Refresh YouTube Shorts → Run workflow. The default is a dry run:
it fetches and validates new content but does not push. To publish, select the
`main` branch and enable `publish`. Publication from any other branch is rejected.

Locally, set `YOUTUBE_API_KEY` and `YOUTUBE_CHANNEL_ID`, then run:

```sh
npm run test:youtube-sync
npm run sync:youtube -- --shorts-only
```

The importer scans the latest 50 uploads. Existing video files are preserved to
protect editorial changes. New Shorts keep their actual publication timestamps
and descriptions. Long-form videos are excluded from the scheduled job.

Missing credentials, API errors and invalid responses fail the job instead of
reporting a successful refresh. No content is written until the fetched metadata
has been validated. Review the failed Actions run and correct the cause, then
rerun it. GitHub's normal failed-workflow notifications apply.

Development startup uses `--if-configured` to allow development without a key;
an explicitly requested or scheduled sync requires credentials.

The importer retains the existing duration heuristic: videos up to 90 seconds
are treated as Shorts; videos up to three minutes also receive a Shorts URL
check. This is not a general audit of the channel's historical classification.

## Verification

Confirm the Actions summary lists the expected new IDs and a successful push.
Then check that Cloudflare deployed the resulting commit and that `/posts`
starts with the newest Shorts. If import and push succeed but production stays
stale, investigate Cloudflare deployment status and caching next.

GitHub does not trigger another Actions run for a push made with its
`GITHUB_TOKEN`, so the scheduled workflow runs the relevant importer and build
validation itself before pushing.
