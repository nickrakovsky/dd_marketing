# Dependency security coverage — 2026-10-28

Scope: current dd_marketing main after #288 and #292, retaining Astro 5.18.2. Inventory is npm audit of package-lock.json; the connected GitHub interface does not expose the Dependabot alerts endpoint. No alerts are dismissed by this work.

Affected package entries: 22 before this PR, 6 after. These counts include inherited findings, not unique advisories.

## Fixes

- Preserve main’s SVGs, performance runner, direct patched Sharp dependency and adapter-to-Wrangler override.
- Patch vulnerable esbuild 0.27 copies to 0.28.2, CSS selector parser 6/7 to patched releases, and basic-ftp to 6.2.1 or newer.
- Refresh compatible transitive patches, including ip-address and YAML.
- Do not restore Lighthouse CI or its extract-zip dependency. Those were removed by #288.
- Do not add overrides for already-resolved Undici, ws, tmp or UUID findings.
- Keep Astro 5; install without --force or --legacy-peer-deps.

## Remaining root advisories

| Package | Advisory | Remaining constraint |
|---|---|---|
| `@astrojs/cloudflare` | [GHSA-88gm-j2wx-58h6](https://github.com/advisories/GHSA-88gm-j2wx-58h6) | The patched adapter requires a newer framework and a Pages-to-Workers migration. |
| `astro` | [GHSA-j687-52p2-xcff](https://github.com/advisories/GHSA-j687-52p2-xcff) | Framework upgrade excluded. Patched Sharp preserves the native codec fix, but version-based Astro advisories remain. |
| `astro` | [GHSA-xr5h-phrj-8vxv](https://github.com/advisories/GHSA-xr5h-phrj-8vxv) | Framework upgrade excluded. Patched Sharp preserves the native codec fix, but version-based Astro advisories remain. |
| `astro` | [GHSA-jrpj-wcv7-9fh9](https://github.com/advisories/GHSA-jrpj-wcv7-9fh9) | Framework upgrade excluded. Patched Sharp preserves the native codec fix, but version-based Astro advisories remain. |
| `astro` | [GHSA-f48w-9m4c-m7f5](https://github.com/advisories/GHSA-f48w-9m4c-m7f5) | Framework upgrade excluded. Patched Sharp preserves the native codec fix, but version-based Astro advisories remain. |
| `astro` | [GHSA-7pw4-f3q4-r2p2](https://github.com/advisories/GHSA-7pw4-f3q4-r2p2) | Framework upgrade excluded. Patched Sharp preserves the native codec fix, but version-based Astro advisories remain. |
| `astro` | [GHSA-4g3v-8h47-v7g6](https://github.com/advisories/GHSA-4g3v-8h47-v7g6) | Framework upgrade excluded. Patched Sharp preserves the native codec fix, but version-based Astro advisories remain. |
| `astro` | [GHSA-2pvr-wf23-7pc7](https://github.com/advisories/GHSA-2pvr-wf23-7pc7) | Framework upgrade excluded. Patched Sharp preserves the native codec fix, but version-based Astro advisories remain. |
| `astro` | [GHSA-8hv8-536x-4wqp](https://github.com/advisories/GHSA-8hv8-536x-4wqp) | Framework upgrade excluded. Patched Sharp preserves the native codec fix, but version-based Astro advisories remain. |
| `astro` | [GHSA-26w7-cxv4-gfx2](https://github.com/advisories/GHSA-26w7-cxv4-gfx2) | Framework upgrade excluded. Patched Sharp preserves the native codec fix, but version-based Astro advisories remain. |
| `astro` | [GHSA-376h-93r7-7g6f](https://github.com/advisories/GHSA-376h-93r7-7g6f) | Framework upgrade excluded. Patched Sharp preserves the native codec fix, but version-based Astro advisories remain. |
| `astro` | [GHSA-98hj-9722-w3j8](https://github.com/advisories/GHSA-98hj-9722-w3j8) | Framework upgrade excluded. Patched Sharp preserves the native codec fix, but version-based Astro advisories remain. |
| `zod` | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | Astro 5 depends on Zod 3 APIs; Zod 4 requires a consumer migration. |

The audit remains nonzero for these exceptions. The six affected package entries are Astro, its Pages adapter, MDX/Tailwind integrations inheriting Astro findings, Zod, and zod-to-ts. Validation results and hosted CI status are recorded in the PR description.
