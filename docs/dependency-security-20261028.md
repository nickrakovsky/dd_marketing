# Dependency security coverage — 2026-10-28

Scope: dd_marketing, retaining Astro 5.18.2. Inventory comes from npm audit of the lockfile; the connected GitHub tool does not expose the Dependabot alerts endpoint. This is not a claim that GitHub alerts were dismissed.

Affected package entries: 61 before, 15 after both PRs. Counts include inherited advisory chains, not unique vulnerabilities.

## Changes

- Restore the Pages-compatible Cloudflare adapter 12.6.13; adapter 13 requires a framework/hosting migration.
- Remove unused Jimp and @playform/inline, including their vulnerable dependency trees.
- Refresh compatible patch releases and explicitly patch nested Undici, esbuild, Sharp, WebSocket, temporary-file, UUID, FTP and CSS-parser dependencies.
- Keep Astro 5; no Astro 7 upgrade and no forced or legacy peer dependency installation.

## Remaining root advisories

| Package | Advisory | Reason still open |
|---|---|---|
| `@astrojs/cloudflare` | [GHSA-88gm-j2wx-58h6](https://github.com/advisories/GHSA-88gm-j2wx-58h6) | Patched adapter requires a newer framework and Workers migration; Pages adapter retained. |
| `astro` | [GHSA-j687-52p2-xcff](https://github.com/advisories/GHSA-j687-52p2-xcff) | Excluded framework upgrade. Sharp 0.35.5 preserves the native image codec fix, but version-based Astro findings remain. |
| `astro` | [GHSA-xr5h-phrj-8vxv](https://github.com/advisories/GHSA-xr5h-phrj-8vxv) | Excluded framework upgrade. Sharp 0.35.5 preserves the native image codec fix, but version-based Astro findings remain. |
| `astro` | [GHSA-jrpj-wcv7-9fh9](https://github.com/advisories/GHSA-jrpj-wcv7-9fh9) | Excluded framework upgrade. Sharp 0.35.5 preserves the native image codec fix, but version-based Astro findings remain. |
| `astro` | [GHSA-f48w-9m4c-m7f5](https://github.com/advisories/GHSA-f48w-9m4c-m7f5) | Excluded framework upgrade. Sharp 0.35.5 preserves the native image codec fix, but version-based Astro findings remain. |
| `astro` | [GHSA-7pw4-f3q4-r2p2](https://github.com/advisories/GHSA-7pw4-f3q4-r2p2) | Excluded framework upgrade. Sharp 0.35.5 preserves the native image codec fix, but version-based Astro findings remain. |
| `astro` | [GHSA-4g3v-8h47-v7g6](https://github.com/advisories/GHSA-4g3v-8h47-v7g6) | Excluded framework upgrade. Sharp 0.35.5 preserves the native image codec fix, but version-based Astro findings remain. |
| `astro` | [GHSA-2pvr-wf23-7pc7](https://github.com/advisories/GHSA-2pvr-wf23-7pc7) | Excluded framework upgrade. Sharp 0.35.5 preserves the native image codec fix, but version-based Astro findings remain. |
| `astro` | [GHSA-8hv8-536x-4wqp](https://github.com/advisories/GHSA-8hv8-536x-4wqp) | Excluded framework upgrade. Sharp 0.35.5 preserves the native image codec fix, but version-based Astro findings remain. |
| `astro` | [GHSA-26w7-cxv4-gfx2](https://github.com/advisories/GHSA-26w7-cxv4-gfx2) | Excluded framework upgrade. Sharp 0.35.5 preserves the native image codec fix, but version-based Astro findings remain. |
| `astro` | [GHSA-376h-93r7-7g6f](https://github.com/advisories/GHSA-376h-93r7-7g6f) | Excluded framework upgrade. Sharp 0.35.5 preserves the native image codec fix, but version-based Astro findings remain. |
| `astro` | [GHSA-98hj-9722-w3j8](https://github.com/advisories/GHSA-98hj-9722-w3j8) | Excluded framework upgrade. Sharp 0.35.5 preserves the native image codec fix, but version-based Astro findings remain. |
| `extract-zip` | [GHSA-jmr9-qjv8-65gv](https://github.com/advisories/GHSA-jmr9-qjv8-65gv) | No patched release; pulled in by the current Lighthouse CI/Puppeteer toolchain. Requires replacement or a separately maintained patch. |
| `extract-zip` | [GHSA-7pqw-9j4j-h8q3](https://github.com/advisories/GHSA-7pqw-9j4j-h8q3) | No patched release; pulled in by the current Lighthouse CI/Puppeteer toolchain. Requires replacement or a separately maintained patch. |
| `zod` | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | Patched major is Zod 4; Astro 5 and other consumers still depend on Zod 3 APIs. Requires consumer migration, not a safe blind override. |

## Removed package findings

The following packages no longer appear as affected entries after both PRs:

- `@astrojs/language-server`
- `@jimp/core`
- `@jimp/diff`
- `@jimp/js-bmp`
- `@jimp/js-gif`
- `@jimp/js-jpeg`
- `@jimp/js-png`
- `@jimp/js-tiff`
- `@jimp/plugin-blit`
- `@jimp/plugin-blur`
- `@jimp/plugin-circle`
- `@jimp/plugin-color`
- `@jimp/plugin-contain`
- `@jimp/plugin-cover`
- `@jimp/plugin-crop`
- `@jimp/plugin-displace`
- `@jimp/plugin-dither`
- `@jimp/plugin-fisheye`
- `@jimp/plugin-flip`
- `@jimp/plugin-hash`
- `@jimp/plugin-mask`
- `@jimp/plugin-print`
- `@jimp/plugin-quantize`
- `@jimp/plugin-resize`
- `@jimp/plugin-rotate`
- `@jimp/plugin-threshold`
- `@jimp/types`
- `@jimp/utils`
- `@keystatic/astro`
- `@playform/inline`
- `@playform/pipe`
- `@tailwindcss/typography`
- `basic-ftp`
- `deepmerge-ts`
- `esbuild`
- `external-editor`
- `get-uri`
- `inquirer`
- `ip-address`
- `jimp`
- `pac-proxy-agent`
- `postcss-selector-parser`
- `proxy-agent`
- `tmp`
- `undici`
- `uuid`
- `volar-service-yaml`
- `yaml`
- `yaml-language-server`

Validation results and hosted check status are recorded in the PR descriptions. The audit intentionally remains nonzero for the listed exceptions.
