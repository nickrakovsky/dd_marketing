
# Comprehensive Testing Framework Implementation Plan

## Current Status: Scaffolding Complete, Needs Integration Review
*A fast LLM agent (Gemini Flash) has scaffolded the core testing infrastructure. The current task is for an advanced LLM to audit, refine, and connect these systems to our actual codebase reality and Cloudflare environment.*

**Completed Scaffolding (Do Not Rebuild These):**
*   **Phase 1 (Linting/Crawling):** ESLint is configured with a custom AST rule for trailing slashes. `linkinator` is installed for crawling.
*   **Phase 2 (Unit Tests):** Vitest is installed and a basic React component test exists. (Note: Astro component unit testing was intentionally skipped in favor of E2E testing).
*   **Phase 3 & 4 (E2E & Perf):** Playwright, Axe-core (a11y), and Lighthouse CI (`lighthouserc.cjs`) are installed. A scaffolding test for Bento CRM form interception exists.
*   **Phase 5 (CI/CD):** `.github/workflows/ci.yml` was updated to include all these testing steps.

---

## Current Task: The Integration & Reality Check
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

# Previous Steps (already completed: do not repeat)

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