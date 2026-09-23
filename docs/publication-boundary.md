# Publishing is an explicit choice

Internal work belongs in `internal/`, outside Astro's pages, content collections, and public assets. This directory is versioned in the repository but is never a production input. It is not a place for credentials or information that must be kept out of Git.

## Architecture

| Location | Purpose | Publication rule |
| --- | --- | --- |
| `internal/pages/` | Wireframes, previews, print layouts, brand book | Injected only into local `astro dev`; production imports are rejected |
| `internal/assets/` | Proposal PDFs, brand collateral, local print assets | Served only by local development middleware at `/__internal/assets/`; never copied to build output |
| `src/pages/` | Public routes and endpoints | Every entrypoint must be in the reviewed publication manifest |
| `src/content/` | Content automatically discovered by the site | Every file must be in the manifest; publication dates still govern scheduled articles |
| `public/` | Files copied verbatim into deployment | Every file must be in the manifest |
| `src/assets/` | Public images, fonts, and other bundled assets | Every file must be in the manifest; published through imports |
| `src/components/`, `src/lib/` | Shared public implementation | Imports outside approved source roots are prohibited |

`config/publication-manifest.json` is an explicit inventory, not a generated acceptance list. It includes the current public routes, static files, bundled assets, content, and framework integration routes. New files in a publication input directory stop the build until deliberately approved in the manifest. Internal namespaces remain forbidden even if someone adds them to that inventory. Production module inputs are limited to `src/`, dependencies, Astro-generated modules, approved public assets, and the CMS configuration. Importing a report from `docs/` or an external filesystem location is rejected too.

The Astro integration enforces this for `astro build` itself, so invoking the framework directly or building a Cloudflare preview does not bypass an npm prebuild check. It validates source inputs, the resolved route table, production imports, and the final deployment directory. Final HTML must correspond to an approved generated route. Static files must be approved inputs. Framework output is confined to its expected namespaces (`_astro`, `_worker.js`, and `~partytown`) and known sitemap/hosting files. `_build` samples must have been removed before the final check. Sitemaps cannot contain internal URLs.

The Worker also rejects reserved internal URLs before static-asset fallback. Cloudflare routing sends the internal namespaces to this guard. No private files are emitted, including `.html` aliases; this remains the primary protection where a request bypasses the Worker. `noindex` and robots.txt are not access controls and are not part of the publication boundary.

## Working locally

Run `npm run dev` on the default loopback address. Existing `/wireframes`, `/brand-book`, `/sales-one-pager`, `/internal/marketing-pdf`, and `/preview/daily-blog/*` URLs remain available locally. Internal assets are served with no-store and noindex headers. The internal workspace refuses a development server configured with `--host` or another non-loopback host. Shared previews must use a production build, which excludes internal work. A remotely accessible internal review tool would require a separate authenticated application.

The public logo remains at `/brand-assets/logo-orange.svg` because production pages use it. The rest of the brand collateral was moved to `internal/assets/brand/`. Print assets go in `internal/assets/print/`; existing local print files should be relocated there, never back into `public/`.

## Adding public material

1. Decide that the route, download, or content is intended for the public internet.
2. Add it to the appropriate public input directory and add its exact filename to the manifest in the same change. Content tools and automation must include this step. Do not bulk-approve unknown files to make a build pass.
3. Review the manifest diff with the content/code diff. Adding an entry is a publishing decision.
4. Run the boundary tests, build, and production-response tests. CI runs the same checks. Existing publication scheduling remains in force for approved articles.

There is no production flag to enable internal pages. Reserved internal URL names cannot be reused for public content without a deliberate architecture change.

Shared resource-hub components/data now have public names and locations. The wireframe toolbar is inside `internal/components/`. The public image sampler explicitly prepares intrinsic-size resource-card variants; previously the wireframes incidentally generated variants needed by earlier publication states of the public hub. Public builds no longer depend on those internal pages.

## Verification and deployment

`npm run test:publication-boundary` exercises accidental routes, assets and content, reserved manifest entries, symlinks, private imports, injected routes, output artifacts, sitemap leakage, encoded aliases, and local-only registration. `npm run test:publication` serves the real Cloudflare build, checks the removed URLs return 404, verifies the retained public logo, and checks scheduled article availability.

Deploy only the successful build's `dist/` directory. The code protects ordinary publication mistakes; someone deliberately changing the policy or deploying a different directory can bypass repository controls. Branch protection and the hosting project's build/output settings remain administrative controls outside this code change. Confirm Cloudflare uses this build and `dist`, then verify the removed URLs against production after deployment. Existing indexed URLs require search engines to recrawl the 404 responses; urgent search removals can be requested separately.

Validated locally on 2026-09-23: production build, 8 boundary regression tests, 36 existing unit tests, and 211 Cloudflare production-response/publication checks passed. Type checking and the repository lint command passed (existing lint warnings remain). Direct Astro builds were also tested with temporary accidental-public-file and private-raw-import fixtures; both stopped as required. Ten local internal page URLs and two internal asset URLs returned 200. A development launch with `--host 0.0.0.0` was rejected. No production deployment or hosting settings were changed.

Framework reference: [Astro project structure](https://docs.astro.build/en/basics/project-structure/) and [Astro integration hooks](https://v5.docs.astro.build/en/reference/integrations-reference/).
