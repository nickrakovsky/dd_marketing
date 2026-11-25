# Nick: install the demo-booking safeguards

This replaces the earlier setup checklist. Your screenshot shows the website settings and database binding entered. **Keep every new feature switched off.** No Calendly confirmation-page or webhook change is needed.

**Order:** we supply the package and clear the code checks → you complete the installation below → we run the agreed live test → public activation is a separate decision. Preparation of this package is not evidence that CI has passed.

## 1. Complete the package settings

Use the existing **Production** Pages project serving `https://datadocks.com`. We still need its project name, confirmation that the screenshot is Production, the `datadocks-demo` database ID, and the full Calendly event/host URLs as text. Do not send secrets.

Unzip the package. With Node 22.23.4 or later installed, open a terminal in that folder:

```sh
cp inputs.example.json inputs.local.json
```

Fill the five fields in `inputs.local.json`: Pages project name, D1 database ID, Calendly demo event URL, host user URL(s), and the existing public Bento site UUID. Then run:

```sh
node configure.mjs configure
node configure.mjs check
```

This prepares the settings locally; it does not contact or change Cloudflare. If it rejects an entry, correct the source information rather than editing the generated files.

## 2. Check the website settings

In that Pages project's **Production** settings, compare the existing binding and variables with `local/pages-settings.json`. Retain the existing Bento credentials. Confirm all four switches are `false`:

- `PUBLIC_DEMO_QUALIFICATION_ENABLED`
- `DEMO_CAPTURE_ENABLED`
- `DEMO_BOOKING_ENABLED`
- `DEMO_VERIFICATION_PAGE_ENABLED`

Leave `DEMO_SUPPORT_URL` unset. Keep production secrets and this database out of preview environments.

## 3. Install the database updates and background process

**Start this step only after we confirm that the supplied website revision has passed the required checks.** Sign in to the correct Cloudflare account, then run these commands from the package folder, stopping if any command fails:

```sh
npx --yes wrangler@4.155.0 login
npx --yes wrangler@4.155.0 d1 migrations apply datadocks-demo --remote --config local/wrangler.json
npx --yes wrangler@4.155.0 deploy --no-bundle --config local/wrangler.json
```

The migration should apply `0001_demo_leads.sql` and `0002_demo_bookings.sql`, or report them already applied. The new Worker is named `datadocks-demo-reconcile`; its database connection and five-minute schedule are supplied in the package. It remains disabled and has no public website address.

In **that Worker's** Settings → Variables and Secrets, add these four encrypted secrets with exactly the same values as the website:

- `CALENDLY_TOKEN`
- `DEMO_SIGNING_SECRET`
- `BENTO_PUBLISHABLE_KEY`
- `BENTO_SECRET_KEY`

Save/deploy those settings. Leave `DEMO_RECONCILE_ENABLED` and `DEMO_BOOKING_ENABLED` set to `false`.

## 4. Deploy the matching website revision

Deploy the reviewed `codex/demo-qualification` revision through the website's existing Git/Cloudflare Pages release process. Its exact commit is recorded under `source.revision` in `manifest.json`. The optional `source/demo-qualification.bundle` is a transport copy of that source, not a prebuilt website; do not upload this package folder as the website or change the site's production branch.

Keep all four website switches false during the build and deployment. If the deployed revision differs from the package, send us the revision before continuing so we can check the pairing.

## 5. Send back the result, then stop

Send the Pages deployment URL/revision, Worker version, migration result, and confirmation that the settings are saved in Production with all switches still off. Include any error text, without secrets.

We will then arrange the unindexed live test using the agreed Gmail aliases and `marketing@datadocks.com`. Do not turn on the public flow yet. If installation fails, keep the switches off; do not delete the database.

Cloudflare references: [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), [prebuilt Worker deployment](https://developers.cloudflare.com/workers/wrangler/bundling/), [Pages settings](https://developers.cloudflare.com/pages/configuration/build-configuration/).
