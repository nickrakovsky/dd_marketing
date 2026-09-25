# Publication boundary

- Put wireframes, experiments, previews, collateral, and internal documents in `internal/`. Start there when publication intent is uncertain.
- `internal/` is local-only. Never import it from production code or move internal material into publishing folders.
- `src/pages/`, `public/`, `src/assets/`, and `src/content/` are publishing folders. Add intended public pages, content and assets there through the normal workflow; no separate filename inventory is required. Never use these folders for internal notes, prototypes or collateral.
- Shared components used by public pages belong in `src/`; internal pages may import them. The reverse dependency is forbidden.
- Keep `publicationBoundary()` last in `astro.config.mjs`. It must run for all production builds, including hosted previews, regardless of environment variables.
- For changes to publication rules, run `npm run test:publication-boundary`, `npm run build`, and `npm run test:publication`. Include failure cases, not just a successful build.
- See `docs/publication-boundary.md` for the architecture and workflow.
