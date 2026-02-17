# Testing Patterns

**Analysis Date:** 2026-02-17

## Test Framework

**Status:** Not detected

**Current Situation:**
- No Jest, Vitest, or other test runner configured in `package.json`
- No test files found in `src/` or `scripts/` directories
- No test configuration files (jest.config.ts, vitest.config.ts, etc.)
- Package dependencies include `zod` (validation) but no testing frameworks

**Dev Dependencies:**
- `eslint`: ^9.39.2
- `eslint-config-next`: ^16.1.6
- `prettier`: ^3.8.1
- `tailwindcss`: ^3.4.19
- No test runner or assertion library

## Manual Testing Approach

**Node.js Scripts:**

The codebase relies on manual execution and observation for script validation:

1. **Script Execution Pattern:**
   - Direct command-line invocation: `node scripts/morning-report.mjs`
   - Structured result objects for state tracking
   - Console logging for step-by-step feedback
   - Example from `morning-report.mjs`:
   ```javascript
   const results = {
     fiverr: false,
     upwork: false,
     report: false,
     telegram: false,
     tracker: false,
   };

   try {
     const fiverrResult = await scrapeFiverr()
     results.fiverr = fiverrResult.success
     console.log(`Fiverr scrape: ${fiverrResult.success ? 'OK' : 'FAILED'}`)
   } catch (err) {
     console.error(`Fiverr scrape error: ${err.message}`)
   }

   // Final summary
   console.log(
     `Fiverr: ${results.fiverr ? 'ok' : 'failed'}, ` +
     `Upwork: ${results.upwork ? 'ok' : 'failed'}, ` +
     `Report: ${results.report ? 'ok' : 'failed'}`
   )
   ```

2. **Dry-Run Patterns:**
   - Scripts support `--dry-run` flag for preview-only execution
   - Example: `node scripts/weekly-summary.mjs --dry-run`
   - Outputs expected results without side effects (no Telegram send, no file writes)

**Web Application:**

Manual testing via the Next.js dev server:
- UI components tested by visual inspection
- State management validated through browser DevTools
- Drag-and-drop interactions (Kanban board) verified manually
- No automated component or integration tests

## Test Data & Fixtures

**Seed Data:**

Data fixtures defined as TypeScript/JavaScript:

1. **Platforms:** `src/data/seed-platforms.ts`
   - Static list of platform definitions (Upwork, Fiverr, Toptal, etc.)
   - Used by proposal generator and filtering UI

2. **Proposal Templates:** `src/data/seed-templates.ts`
   - Pre-defined proposal template objects (268 lines)
   - Includes example templates for different service pillars
   - Loaded in component props during development

3. **Listings:** `src/lib/listings.ts`
   - Parses markdown listing files from `listings/` directory
   - Maps gig IDs to priority tiers (P1, P2, P3)
   - Extracts pricing and descriptions from markdown frontmatter

**Location:** Seed data committed to repository in `src/data/`

## Integration Testing

**API Integration:**

No formal API tests. Integration validation happens through:

1. **Supabase Client:**
   - Direct queries executed in hooks (`src/lib/hooks/useOpportunities.ts`)
   - Error handling logs to console
   - Live data fetched from Supabase on component mount

2. **Web Scraping:**
   - Playwright browser automation tests platform availability
   - Selectors defined as fallback arrays in case DOM changes
   - Manual validation after first real data collection
   - Example from `scrape-fiverr.mjs`:
   ```javascript
   const SELLER_LEVEL_SELECTORS = [
     '[data-testid="seller-level"]',
     '.seller-level',
     '.seller-level-label',
     '.level-title',
     '.seller-card .level',
   ];

   async function extractMetric(page, label, selectors) {
     // Try each CSS selector until one works
     for (const selector of selectors) {
       try {
         const el = await page.$(selector);
         if (el) {
           const text = await el.textContent();
           return parseNumber(text);
         }
       } catch (err) {
         // Continue to next selector
       }
     }
     // Fallback: regex search in page body
     const content = await page.textContent('body');
     const regex = new RegExp(`${label}[:\s]*([\\d,.]+)`, 'i');
     const match = content.match(regex);
     return match ? parseNumber(match[1]) : null;
   }
   ```

3. **Telegram Bot API:**
   - Tested through `send-telegram.mjs` script
   - Sends actual messages to configured chat (env vars: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`)
   - No mock testing; production environment used for validation

## Validation Testing

**Schema Validation:**

Zod schemas used for runtime validation:

1. **Location:** `src/lib/schemas/`
   - Separate schema files per entity/feature
   - Examples: `opportunity.ts`, `platform.ts`, `gig.ts`

2. **Usage Pattern:**
   - Forms use Zod schemas with React Hook Form
   - Example from `OpportunityForm.tsx`:
   ```typescript
   import { useForm } from "react-hook-form"
   import { zodResolver } from "@hookform/resolvers/zod"
   import { opportunitySchema } from "@/lib/schemas/opportunity"

   const form = useForm({
     resolver: zodResolver(opportunitySchema),
     defaultValues: initialData,
   })
   ```

3. **API-Level Validation:**
   - Supabase RLS policies enforce schema at database layer
   - Client-side Zod parsing before database mutations

## Test Coverage

**Current Status:** No coverage tooling configured

**Gap Areas:**

1. **React Components:**
   - Kanban board drag-and-drop logic untested
   - Form validation (OpportunityForm, GigForm, ProposalGenerator) not automated
   - State management in useOpportunities, useGigs hooks untested

2. **Node Scripts:**
   - Web scraping selectors not validated (marked as "provisional, may need updating")
   - Data transformation and aggregation logic (generate-report.mjs) untested
   - Error recovery paths (fallback selectors) never exercised

3. **API/Database:**
   - No integration tests against real/test Supabase instance
   - Query filtering logic untested

## Future Testing Strategy

**Recommended Setup:**

1. **Unit Tests (React):**
   - Add Vitest + React Testing Library
   - Start with hooks (useOpportunities, useRevenue) — easiest to test
   - Then component utilities (formatters, constants)

2. **Component Tests:**
   - Test Kanban board drag handlers
   - Test form submission and validation
   - Snapshot tests for stable UI components

3. **Integration Tests (Scripts):**
   - Mock Playwright page objects for selector testing
   - Create test fixtures for Fiverr/Upwork response parsing
   - Validate data transformation in generate-report.mjs

4. **E2E Tests:**
   - Playwright for end-to-end flows (login, create opportunity, move through stages)
   - Test production-like environment (real Supabase if test database available)

---

*Testing analysis: 2026-02-17*
