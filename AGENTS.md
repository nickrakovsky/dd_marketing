# Publication boundary

- Put wireframes, experiments, previews, collateral, and internal documents in `internal/`. Start there when publication intent is uncertain.
- `internal/` is local-only. Never import it from production code, move it into `public/`, or add its paths to the publication manifest.
- `src/pages/`, `public/`, `src/assets/`, and `src/content/` are publication inputs. Every new file needs an intentional entry in `config/publication-manifest.json` as part of the public feature/content change. Do not regenerate the manifest to silence a failure.
- Shared components used by public pages belong in `src/`; internal pages may import them. The reverse dependency is forbidden.
- Keep `publicationBoundary()` last in `astro.config.mjs`. It must run for all production builds, including hosted previews, regardless of environment variables.
- For changes to publication rules, run `npm run test:publication-boundary`, `npm run build`, and `npm run test:publication`. Include failure cases, not just a successful build.
- See `docs/publication-boundary.md` for the architecture and workflow.
