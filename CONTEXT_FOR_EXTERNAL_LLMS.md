# Context for External LLMs (DataDocks Marketing Site)

This document provides a comprehensive snapshot of the DataDocks marketing site codebase for external LLMs (Claude, ChatGPT, etc.) to ensure consistency in development, SEO, and brand voice.

---

## 1. Project Overview & Tech Stack
- **Framework:** Astro (latest) with MDX for content.
- **Styling:** Tailwind CSS (configured with brand variables).
- **CMS:** Keystatic (Local/GitHub-based, no external database).
- **Interactivity:** React (Islands architecture).
- **Hosting:** Cloudflare Pages (uses `wrangler.toml` for simple config).
- **Package Manager:** npm.

---

## 2. Core Rules & Conventions (Master List)

### Operational Commands
- `npm run dev` — Local development.
- `npm run build` — Production build.
- `npm run check` — **CRITICAL:** Runs Astro type-check. Must pass before any deployment.

### Development Standards
- **TypeScript:** Strict mode enabled. Use `import type` for React types.
- **Astro Components:** Avoid inline generics in `.map()` within HTML templates.
- **Links:** **No trailing slashes** (e.g., `/posts/slug`). Use absolute links for Webflow pages (`datadocks.com/benefits/`).
- **Components:** Use `client:visible` for everything below the fold; `client:load` only for hero/above-fold interactivity.

### SEO & AI Optimization
- **Headings:** Blog `H2` tags should be phrased as questions to optimize for AI citation.
- **Opening Paragraphs:** Aim for 134-167 words. Lead with "X is Y" definitions.
- **Structured Data:** Uses a JSON-LD `@graph` pattern in `Layout.astro`. 
- **FAQ Schema:** Passed via `schemaData={{ faq: [...] }}`.
- **Bots:** Never block bots in `robots.txt`; maximize AI visibility.

---

## 3. Content Architecture (Keystatic Models)

The site structure is defined in `keystatic.config.ts`. Key collections include:

### Blog Posts (`posts`)
- **Fields:** `title`, `description`, `author`, `category`, `pubDate`, `cardImage`, `cardAlt`, `showToc`.
- **Post Types:** `article`, `video`, `short`.
- **MDX Components:**
    - `LeadMagnetForm`: For CTAs.
    - `FAQ`: In-content FAQ blocks.
    - `SmartLink`: Links to glossary terms with tooltips.

### Glossary (`glossary`)
- **Purpose:** Defines industry terms (e.g., "Dwell Time", "BOL").
- **Fields:** `termName`, `contextSnippet` (for tooltips), `targetPost` (deep-dive link).

---

## 4. Design System & Brand Identity

### Brand Colors (`COLORS.md`)
- **Official Orange:** `#FE5000` (Hero CTAs).
- **Paper White:** `#FFF8EE` (Main background).
- **Solid Black:** `#000000` (Main text).
- **Tailwind Class:** `brand-orange` maps to `#fd4f00`.

### Typography
- **Primary:** Inter (Sans).
- **Brand Headings:** **Bruta** (Clean, professional).
- **Editorial:** **Recoleta** (Premium serif for blog headings/quotes).

### Voice and Tone
- **Audience:** Warehouse managers, Logistics VPs, COOs. Practical, skeptical of fluff.
- **Voice:** Direct, grounded, operational. Sound like an operator, not a marketer.
- **Forbidden Terms:** "Unlock value", "game-changing", "revolutionary", "in today's fast-paced world".
- **Focus:** Operational pain—congestion, detention, wasted labor, lack of visibility.

---

## 5. Directory Structure
- `src/content/posts/`: MDX blog content.
- `src/content/glossary/`: JSON glossary terms.
- `src/layouts/`: `Layout.astro` (Global) and `BlogPostLayout.astro`.
- `src/components/`: Mix of Astro and React (`.tsx`) components.
- `public/`: Robots.txt, sitemaps, and LLM-specific meta files (`llms.txt`).

---

## 6. Recent Sprint Priorities (Context for Current Tasks)
1. **Glossary SmartLinks:** Every blog post should ideally map to 4 glossary terms using the `<SmartLink />` component.
2. **AI SEO:** Refining all existing content to lead with clear, citation-friendly definitions.
3. **Performance:** Maintaining 0 CLS (Cumulative Layout Shift) by strictly managing font-loading and image dimensions.

---

*When working with this site, always prioritize **Operational Utility** over marketing polish. If it wouldn't make sense to a warehouse manager on a loading dock, rewrite it.*
