# Migration Rules & Architecture

## Core Stack
- **Framework:** Astro + React (for interactive islands)
- **Styling:** Tailwind CSS (Do NOT use raw CSS files or Webflow classes)
- **Icons:** Use Lucide-React or SVGs from `/public/images`

## Current Workflows
1. **Images:** Currently using `/public/images/` for all migration assets. Do not use `src/assets` yet.
2. **Development:** Run `npm run dev` (It is configured to run at root `/`).
3. **Deployment:** We are using a Staging Workflow. All work must be on the `staging-v2` branch.

## Component Strategy
- **Navigation:** controlled by `Navigation.jsx` (React)
- **Homepage:** `src/pages/home-draft.astro`
- **Sections:** All homepage sections live in `src/components/home/`

## Known Constraints
- **Legacy CSS:** `webflow-legacy.css` is present but COMMENTED OUT to prevent conflicts. Do not uncomment it.
- **Visuals:** We are mimicking the visual design of the `homepage.html` export, but implementing it using clean Tailwind utility classes.