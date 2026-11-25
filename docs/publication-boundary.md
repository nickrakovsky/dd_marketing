# Publishing is an explicit choice

Internal work belongs in `internal/`, outside Astro's pages, content collections, and public assets. This directory is versioned in the repository but is never a production input. It is not a place for credentials or information that must be kept out of Git.

## Architecture

| Location | Purpose | Publication rule |
| --- | --- | --- |
| `internal/pages/` | Wireframes, previews, print layouts, brand book | Injected only into local `astro dev`; production imports are rejected |
| `internal/assets/` | Proposal PDFs, brand collateral, local print assets | Served only by local development middleware at `/__internal/assets/`; never copied to build output |
| `src/pages/` | Public routes and endpoints | Routes follow normal Astro discovery; reserved internal URLs are forbidden |
| `src/content/` | Content automatically discovered by the site | Normal content/CMS workflow; publication dates still govern scheduled articles |
| `public/` | Files copied verbatim into deployment | Added normally; this folder is public by definition |
| `src/assets/` | Public images, fonts, and other bundled assets | Added normally and published through imports |
| `src/components/`, `src/lib/` | Shared public implementation | Imports outside approved source roots are prohibited |

The folder is the publication decision. New pages, posts, images and downloads do not require a second filename inventory. Content tools and the CMS continue using their normal publishing folders. Reserved internal namespaces remain forbidden. Production module inputs are limited to `src/`, `public/`, dependencies, Astro-generated modules, and the CMS configuration. Importing internal files, a report from `docs/`, or an external filesystem location is rejected.

The Astro integration enforces this for `astro build` itself, including hosted previews. It checks reserved paths, symlinks, the resolved route table, production imports, and final deployment output. Output files must come from the public folder (discovered automatically), a generated route, or expected framework output. `_build` samples must be removed before the final check, and sitemaps cannot contain internal URLs. The source checks cannot infer intent from a file's contents: putting a document in `public/` publishes it. Internal material must stay in `internal/`.

The Worker also rejects reserved internal URLs before static-asset fallback. Cloudflare routing sends the internal namespaces to this guard. No private files are emitted, including `.html` aliases; this remains the primary protection where a request bypasses the Worker. `noindex` and robots.txt are not access controls and are not part of the publication boundary.

## Working locally

Run `npm run dev` on the default loopback address. Existing `/wireframes`, `/brand-book`, `/sales-one-pager`, `/internal/marketing-pdf`, and `/preview/daily-blog/*` URLs remain available locally. Internal assets are served with no-store and noindex headers. The internal workspace refuses a development server configured with `--host` or another non-loopback host. Shared previews must use a production build, which excludes internal work. A remotely accessible internal review tool would require a separate authenticated application.

The public logo remains at `/brand-assets/logo-orange.svg` because production pages use it. The rest of the brand collateral was moved to `internal/assets/brand/`. Print assets go in `internal/assets/print/`; existing local print files should be relocated there, never back into `public/`.

## Adding public material

1. Add intended public pages, downloads, images and content to the appropriate publishing folder using the normal code/CMS workflow. No manifest update is required for additions, renames or deletions.
2. Keep internal work in `internal/`, outside those folders.
3. Run the boundary tests, build, and production-response tests for boundary changes. CI runs the same checks. Existing content schemas and publication scheduling remain in force.

There is no production flag to enable internal pages. Reserved internal URL names cannot be reused for public content without a deliberate architecture change.

Shared resource-hub components/data now have public names and locations. The wireframe toolbar is inside `internal/components/`. The public image sampler explicitly prepares intrinsic-size resource-card variants; previously the wireframes incidentally generated variants needed by earlier publication states of the public hub. Public builds no longer depend on those internal pages.

## Verification and deployment

`npm run test:publication-boundary` verifies that normal public additions work without an inventory, while reserved internal paths, symlinks, private imports, injected internal routes, internal output artifacts and sitemap leaks are rejected. It also covers encoded aliases and local-only registration. `npm run test:publication` serves the real Cloudflare build, checks the removed URLs return 404, verifies the retained public logo, and checks scheduled article availability.

Deploy only the successful build's `dist/` directory. The code protects ordinary publication mistakes; someone deliberately changing the policy or deploying a different directory can bypass repository controls. Branch protection and the hosting project's build/output settings remain administrative controls outside this code change. Confirm Cloudflare uses this build and `dist`, then verify the removed URLs against production after deployment. Existing indexed URLs require search engines to recrawl the 404 responses; urgent search removals can be requested separately.

Framework reference: [Astro project structure](https://docs.astro.build/en/basics/project-structure/) and [Astro integration hooks](https://v5.docs.astro.build/en/reference/integrations-reference/).
