# DataDocks Marketing Site

## Tech Stack
- **Framework:** Astro with MDX
- **Styling:** Tailwind CSS
- **Deployment:** Cloudflare Pages
- **CMS:** Keystatic
- **Interactive components:** React (islands architecture)
- **Package manager:** npm

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build (also copies sitemap-index.xml to sitemap.xml)
- `npm run check` — **run this before every commit** — astro type-check (catches undefined variables, bad imports, prop mismatches)
- `npm run preview` — preview production build

> **RULE FOR AI AGENTS:** Always run `npm run check` after making code changes and before committing.
> If it reports errors, fix them first. A passing `check` means the Cloudflare build will not fail
> due to TypeScript or import errors.


## Project Structure
- `src/content/posts/` — Blog posts (MDX files)
- `src/pages/` — Astro pages (static with `export const prerender = true`)
- `src/layouts/Layout.astro` — Main layout with JSON-LD `@graph` structured data
- `src/layouts/BlogPostLayout.astro` — Blog post layout
- `src/components/` — Astro and React components
- `src/assets/blog-images/` — Blog images (processed by Astro)
- `public/` — Static assets (robots.txt, llms.txt, llms-full.txt, images)
- `public/_headers` — Cloudflare Pages response headers

## Conventions

### TypeScript Strict Mode Rules
- The project runs TypeScript in strict mode (`verbatimModuleSyntax` enabled).
- **React Components:** You MUST separate type imports from code imports. Use `import type { ... } from '...';` for types.
- **Astro Components:** Avoid using inline generic types (e.g. `<... >`) inside `.map()` functions within the Astro template (HTML) section, as it breaks Astro's JSX-like parser. Either cast the array properly beforehand or type the parameters as `any`.
- **CMS Collections:** Always use `CollectionEntry<'collectionName'>` from `astro:content` to strongly type CMS data. If a page type or field falls outside the built-in options, you MUST update `src/content/config.ts` to reflect the new schema instead of falling back to `any`.

### URLs and Links
- **No trailing slashes.** Internal links must be `/posts/slug` not `/posts/slug/`
- **No `.html` extensions.** Internal links must be `/about` not `/about.html`
- Internal blog links use relative format: `/posts/slug` not `https://datadocks.com/posts/slug`

### URL Canonicalization — DO NOT BREAK
The canonical URL format is **no trailing slash, no `.html` extension**. Three config pieces enforce this together — if any one is changed, Ahrefs/Google will flag redirect chains sitewide:

1. **[astro.config.mjs](astro.config.mjs)** — must keep `trailingSlash: 'never'` AND `build.format: 'file'`. The `file` format makes Astro emit `page.html` instead of `page/index.html`, so Cloudflare serves it at `/page` with no auto-redirect.
2. **[src/layouts/Layout.astro](src/layouts/Layout.astro)** — the canonical normalizer strips both `.html` and trailing slash: `Astro.url.pathname.replace(/\.html$/, '').replace(/\/$/, '')`. Do not simplify.
3. **[public/_redirects](public/_redirects)** — `/*.html /:splat 301` makes any `.html` URL 301 to the clean version. Do not remove.

**Do not change any of these without updating all three.** Also do not add a `public/_redirects` rule that creates trailing slashes, and do not hardcode `.html` or trailing slashes in internal links, sitemap customPages, or schema `@id`/`url` fields.

### External Links
- Never link to competitor websites (dock scheduling, yard management, or WMS software vendors)
- OK to link to: news/media, academic/research sources, government sites, industry associations, and non-competing software (e.g. ERP, BI tools)
- When citing a statistic or concept, prefer linking to the original research source, not a competitor's blog post about it
- Links to product/feature pages (datadocks.com/benefits/, datadocks.com/datadocks-features/) are absolute since they're served from Webflow

### SEO
- All bots allowed in robots.txt — do NOT block any crawlers (search or training). User wants maximum AI visibility
- Blog H2 headings should be phrased as questions for AI citation extraction
- Statistics in blog posts must have source attribution
- AI citation-optimized opening paragraphs: lead with "X is Y" definition, target 134-167 words
- `cardAlt` frontmatter field provides alt text for blog card/cover images — never leave empty
- FAQ schema benefits AI/LLM citation but no longer triggers Google rich results on commercial sites (Aug 2023)
- YouTube video posts (`/posts/yt-*`) must have a written summary/description in the MDX body — never leave them as embed-only
- **Never link to competitor websites** (OpenDock, C3 Reservations, Transplace, etc.). Mentioning competitors by name is fine for comparison content, but never give them a backlink. Use neutral third-party sources (G2, Capterra, industry publications) if a citation is needed.

### Structured Data
- JSON-LD uses `@graph` array pattern in Layout.astro
- FAQPage schema passed via `schemaData={{ faq: [...] }}` prop
- Review schema passed via `schemaData={{ reviews: [...] }}` prop
- `reviewCount` must be a number, not a string

### Components
- Use `client:visible` for below-fold React components (not `client:load`)
- `client:load` only for above-fold interactive components

### Blog Post Frontmatter
- `title` — page title and H1
- `category` — used for related posts grouping
- `description` — meta description
- `author` — byline
- `pubDate` / `updatedDate` — dates used in schema and sitemap lastmod
- **When editing an existing blog post's body content, you MUST bump `updatedDate` to the current date/time.** This keeps sitemap `lastmod` and JSON-LD `dateModified` honest so Google/AI crawlers see the post as freshly updated. Skip this only for pure mechanical changes (link format, typo, whitespace). Format: `'Apr 23, 2026 4:30 PM'` (matches existing frontmatter style).
- `cardImage` — relative path to cover image in `src/assets/blog-images/`
- `cardAlt` — alt text for cover image (never leave empty)
- `showToc` — enables table of contents
- `postType` — discriminant: `article`, `video`, or `short`
   

## Preferences
- Don't ask questions — just do it
- Be concise, skip preamble
- We care about SEO and AI SEO and performance of the site. Always care about these.
- We always want to ranking (in search and AI) for our keywords - Dock Management, Dock Management Software, Yard Management, Yard Management Software, Dock Scheduling, Dock Scheduling Software, Best Yard Management Software, Best Dock Management Software, Best Dock Scheduling Software / all variations and all the support words around it.

## Voice and Tone

### Audience
Operations professionals in warehousing, logistics, and supply chain leadership — including warehouse managers, logistics coordinators, directors of operations, VPs of Operations, and COOs. They are busy, experienced, practical, and skeptical of marketing language.

### Voice
Direct, clear, and grounded. Write like someone who understands warehouse operations firsthand. Sound like an operator or experienced consultant, not a brand strategist or SaaS marketer.

### Style
- Use short paragraphs and plain language
- Get to the point quickly
- Be specific
- Use real operational examples where possible
- Use industry terms naturally when relevant (dwell time, detention, FCFS, BOL, cross-dock, dock congestion, missed appointments, yard visibility)
- Do not force jargon in just to sound smart

### What to Emphasize
Focus on real operational pain: manual scheduling, dock congestion, missed appointments, detention and dwell time, poor communication between teams/carriers/warehouses, lack of visibility, wasted labour, reactive firefighting, inefficient yard and dock flow.

### How DataDocks Should Sound
Confident, practical, and credible. Show understanding of how the work actually happens on the floor. Prefer specifics over broad claims. Explain value in operational terms: saving time, reducing chaos, improving flow, creating visibility, and helping teams stay ahead of issues.

### Assume the Reader Knows the Problem
Don't spend paragraphs explaining why dock congestion is bad or why detention matters — they deal with it daily. Get to the specifics, the data, and the fix. Respect the reader's experience.

### Rules
- Do not use corporate buzzwords
- Do not use hype language
- Do not use exclamation marks
- Do not sound overly polished or salesy
- Do not say things like "unlock value," "game-changing," "revolutionary," or "in today's fast-paced world"
- Do not make vague claims without grounding them in a real operational problem
- Do not write like software for software people

### CTA Style
Keep calls to action simple and straightforward: "Book a demo", "See how it works", "Take a look", "Happy to walk you through it"

### Writing Test
- If the sentence would sound awkward spoken by someone running warehouse operations, rewrite it
- If the sentence is vague, make it more concrete
- If it sounds like marketing fluff, cut it

Write copy that sounds like it came from a company that knows warehouse operations because they live it.

## Domain Context
- **Product:** DataDocks — SaaS dock scheduling and yard management software for warehouses and DCs
- **Audience:** Warehouse managers, logistics coordinators, supply chain VPs/COOs, carriers
- **Competitors:** OpenDock, C3 Reservations, Transplace Dock Scheduler
- **Key customers:** Stitch Fix, HelloFresh, Samsung, Toyota, LG, Pepsi
- **Founded:** 2013, headquartered in Toronto
- **Main site:** datadocks.com 

