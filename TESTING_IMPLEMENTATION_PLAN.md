# Comprehensive Testing Framework Implementation Plan

## System Status: Fully Operational (Green)
*All phases of the testing framework implementation are complete. The CI/CD pipeline is active, robust, and integrated with Cloudflare Pages.*

### The Final Architecture
1. **The Gatekeeper (`npm run check` & `npm run lint`):** 
   * Runs first on every PR. 
   * Strict Astro type-checking and custom ESLint rules (including AST validation to prevent trailing slashes on internal links).
2. **Component Isolation (Vitest):**
   * Validates state changes and rendering for React (`.tsx`) interactive islands.
3. **Cloudflare Integration (CI/CD Polling):**
   * The GitHub Action dynamically polls the GitHub Commits Status API to pause the workflow until Cloudflare finishes building the PR Preview URL.
4. **End-to-End Validation (Playwright):**
   * Targets the live Cloudflare Preview URL.
   * Catches all hydration and browser console errors.
   * Uses network interception (`page.route`) to validate Bento CRM payloads without polluting the production database.
   * Uses `window.open` stubs to reliably test external routing (PDFs, Calendly) without popup flakiness.
5. **Quality Assurance (Lighthouse CI & Linkinator):**
   * Enforces a hard baseline for Core Web Vitals (0 CLS) and Axe-core accessibility standards.
   * Crawls the live preview for 404s, explicitly ignoring rate-limiting external domains (LinkedIn, Twitter, Calendly).

---

# Historical Archive - Stage 3: Finalize CI/CD Integration & E2E Hardening

## System Status: Green Baseline Achieved
*CRITICAL CONTEXT FOR EXECUTING LLM: The repository has been completely scrubbed. All 1,175+ legacy Astro/React type and linting errors (e.g., `className` vs `class` attributes) have been successfully resolved. `npm run check` and `npm run lint` now pass cleanly. DO NOT spend time looking for or fixing component-level linting errors; your focus is strictly on the testing and deployment infrastructure.*

## Immediate Directives
Your task is to take the existing testing scaffolding and integrate it accurately with our actual codebase and Cloudflare environment.

### 1. Hardening Playwright Tests (Kill False-Passes)
*   **Action:** Update the existing E2E tests (e.g., `tests/forms.spec.ts` or `tests/lead-magnet.spec.ts`).
*   **Constraint 1 (Strict Assertions):** Remove any conditionals or silent returns that check if an element exists. Use strict assertions (e.g., `await expect(page.locator('.lead-magnet-form')).toBeVisible()`). If the target form does not exist on the URL being tested, the test MUST fail loudly.
*   **Constraint 2 (Popup Handling):** Handle external popups (like Calendly) safely. Do not wait for a flaky `page` event. Either stub `window.open` using `page.addInitScript()` to intercept the call, or assert that the CTA button's `href` or `onClick` handler contains the correct URL.

### 2. CI/CD: Cloudflare Preview Polling
*   **Action:** Modify `.github/workflows/ci.yml`. Remove the steps that build the site locally to run Playwright against `localhost`.
*   **Constraint:** Write a bash step using `curl` and `jq` that polls the GitHub Commits Status API (`/repos/${{ github.repository }}/commits/${{ github.sha }}/statuses`). Have it loop until it finds a `success` state for the context matching Cloudflare Pages, and extract the `target_url` (the Cloudflare Preview URL) to save as an environment variable (e.g., `PREVIEW_URL` in `$GITHUB_ENV`).

### 3. Dynamic Test Routing
*   **Action:** Ensure the commands for Playwright, Lighthouse CI (`lhci autorun`), and Linkinator (`npm run crawl` or the respective script) dynamically ingest the newly extracted Cloudflare Preview URL. Pass it via the environment variable or override the config via CLI arguments so all automated checks run against the live preview.

---

# Historical Archive - Stage 2: Architectural Audit & Green Baseline Cleanup (Obsolete)

## Current Status: Scaffolding Complete, Needs Integration Review
*A fast LLM agent (Gemini Flash) has scaffolded the core testing infrastructure. The current task is for an advanced LLM to audit, refine, and connect these systems to our actual codebase reality and Cloudflare environment.*

**Completed Scaffolding (Do Not Rebuild These):**
*   **Phase 1 (Linting/Crawling):** ESLint is configured with a custom AST rule for trailing slashes. `linkinator` is installed for crawling.
*   **Phase 2 (Unit Tests):** Vitest is installed and a basic React component test exists. (Note: Astro component unit testing was intentionally skipped in favor of E2E testing).
*   **Phase 3 & 4 (E2E & Perf):** Playwright, Axe-core (a11y), and Lighthouse CI (`lighthouserc.cjs`) are installed. A scaffolding test for Bento CRM form interception exists.
*   **Phase 5 (CI/CD):** `.github/workflows/ci.yml` was updated to include all these testing steps.

---

## The Integration & Reality Check
*Instruction for executing LLM: Review the existing setup and execute the following refinements.*

### 1. Audit Playwright Selectors
*   **Action:** Review the Playwright test files (e.g., `tests/lead-magnet.spec.ts` or `tests/forms.spec.ts`). 
*   **Action:** Cross-reference the locators (like `.lead-magnet-form` or `.success-message`) with the actual code in `src/components/CTAForm.tsx` or `LeadMagnetForm.astro`. 
*   **Action:** Update the Playwright tests to use the *actual* DOM elements, Tailwind classes, or ARIA labels present in our codebase. Ensure the test can successfully fill out the form and submit it.

### 2. Refine CI/CD for Cloudflare Previews
*   **Context:** Currently, `ci.yml` builds the site locally on the GitHub runner. We want to utilize Cloudflare Pages Preview deployments.
*   **Action:** Modify `.github/workflows/ci.yml`. Remove the local `npm run build` and `npm run preview` steps.
*   **Action:** Implement a step to wait for the Cloudflare Pages Preview URL to be generated for the Pull Request. (Consider using an action like `cloudflare/pages-action` or polling the Cloudflare API if standard deployment statuses aren't sufficient).
*   **Action:** Point the Playwright, Lighthouse, and Linkinator scripts to target this dynamic Cloudflare Preview URL instead of `localhost`.

### 3. Stabilize Flaky Scripts
*   **Action:** Ensure that any commands in `package.json` or `ci.yml` that depend on a server being ready use `wait-on` rather than brittle `sleep` commands.

**Final Directive:** Focus purely on making the existing scaffold robust, accurate to the codebase, and properly integrated with Cloudflare. Do not add new testing frameworks.

# Historical Archive - Stage 1: Framework Scaffolding (Completed)

## Project Context for Executing LLMs
This document outlines the step-by-step implementation of a multi-layered testing framework for the DataDocks marketing site. The primary goal is to prevent regressions (interaction crashes, SEO drops, broken links, canonical flapping) caused by rapid AI-assisted development. 

---

## Phase 1: Static Analysis, Linting, & Link Enforcement
**Goal:** Catch syntax errors, enforce internal routing rules, and prevent rogue outbound links before a build even starts.

### 1.1 ESLint Configuration
*   **Action:** Install ESLint and relevant Astro/React plugins.
*   **Action:** Create `.eslintrc.js` (or update existing).
*   **Action:** Write custom rules or configure existing ones to enforce the "No trailing slashes" rule for internal links (e.g., `/posts/slug` is valid, `/posts/slug/` is invalid)[cite: 1].

### 1.2 Link Crawling (Muffet)
*   **Action:** Integrate `muffet` (a fast web crawler) into the package configuration.
*   **Action:** Write a utility script in `package.json` that can run Muffet against a local build (`localhost:4321`) to flag any 404s or unauthorized competitor outbound links.

---

## Phase 2: Component-Level Testing (Vitest)
**Goal:** Isolate and test individual components to ensure standard renders and state updates do not throw errors.

### 2.1 Setup Vitest
*   **Action:** Install Vitest, React Testing Library, and `@astrojs/test` (or equivalent Astro testing utilities).
*   **Action:** Configure `vitest.config.ts` to support both React and Astro environments.

### 2.2 Server-Side Component Testing (Astro)
*   **Action:** Write tests for critical Astro components (e.g., `BlogPostLayout.astro`).
*   **Action:** Verify that static props render correct HTML structure (e.g., assert that passing the `showToc` prop correctly outputs the Table of Contents in the DOM)[cite: 1].

### 2.3 Client-Side Component Testing (React)
*   **Action:** Target interactive React components injected via Astro islands using `client:visible` or `client:load`[cite: 1].
*   **Action:** Write test files (e.g., `LeadMagnetForm.test.tsx`) to ensure these components mount, accept input, and do not crash the client-side thread[cite: 1].

---

## Phase 3: End-to-End (E2E) Testing (Playwright)
**Goal:** Simulate real user interactions in a headless browser to catch full-page interaction crashes and validate form submissions.

### 3.1 Setup Playwright
*   **Action:** Install `@playwright/test` and initialize the configuration (`playwright.config.ts`).
*   **Action:** Configure Playwright to listen for and fail tests upon encountering unexpected browser console errors.

### 3.2 Form Interception Testing (Bento CRM)
*   **Action:** Create a test specifically for `LeadMagnetForm`[cite: 1] and any other conversion forms.
*   **Action:** Implement **Network Interception** in Playwright:
    1.  Fill out the form with mock data.
    2.  Intercept the outbound POST request to Bento CRM (`bentonow.com/api/...`).
    3.  Assert that the payload contains the correct email formatting and required fields.
    4.  Fulfill the request locally with a mocked `200 OK` response.
    5.  Assert that the UI updates to the success/Thank You state without crashing.

---

## Phase 4: Core Web Vitals & Accessibility
**Goal:** Automate performance metrics and DOM semantic checks to maintain 0 CLS[cite: 1] and SEO visibility.

### 4.1 Accessibility (Axe-Core)
*   **Action:** Install `@axe-core/playwright`.
*   **Action:** Inject Axe-core into the base Playwright E2E tests to automatically scan critical pages (Home, Post Layouts) for ARIA violations, missing alt text, and semantic HTML errors.

### 4.2 Performance (Lighthouse CI)
*   **Action:** Install `@lhci/cli`.
*   **Action:** Create an `lighthouserc.js` file.
*   **Action:** Configure strict assertions to fail the build if Cumulative Layout Shift (CLS) is greater than 0[cite: 1].

---

## Phase 5: CI/CD Pipeline Automation (GitHub Actions)
**Goal:** Tie all testing layers together into an automated gatekeeper that runs on every Pull Request.

### 5.1 Create GitHub Workflow
*   **Action:** Create `.github/workflows/testing.yml`.

### 5.2 Configure Execution Order
Implement the following steps in the YAML file:
1.  **Fast Fails:** Run `npm run check` (Astro type-check)[cite: 1], ESLint, and Vitest component tests on the PR code.
2.  **Await Preview Deployment:** Utilize an action (like `cloudflare/pages-action` or a deployment status waiter) to pause the workflow until Cloudflare Pages successfully generates the unique PR Preview URL.
3.  **Run Integration Tests:** Execute Playwright E2E tests (including Axe-core a11y checks and Bento CRM network interception) targeting the live Cloudflare Preview URL.
4.  **Run Performance Tests:** Execute Lighthouse CI against the Cloudflare Preview URL.
5.  **Run Crawler:** Execute Muffet against the Cloudflare Preview URL to verify all generated links.

---
**Final Directive for Executing LLM:** Execute these phases sequentially. Do not proceed to Phase 5 until tools in Phases 1-4 have been successfully configured and verified locally. Keep all configurations as lean as possible.