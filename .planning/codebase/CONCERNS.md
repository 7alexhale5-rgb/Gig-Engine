# Codebase Concerns

**Analysis Date:** 2026-02-17

## Tech Debt

**Dual-layer legacy code:**
- Issue: `src/` directory and Supabase backend infrastructure exist but are not actively used. The project has pivoted to document-driven deployment (markdown listings + Node.js scripts). The Next.js frontend and Supabase schemas remain in the codebase but are disconnected from the active workflow.
- Files: `src/`, `supabase/`, `docs/PLAN-*.md`, `docs/PROJECT-SPEC.md`
- Impact: Confusion for new contributors. Dead code increases maintenance burden. Type definitions in `src/lib/supabase/types.ts` are generated from unused database schema.
- Fix approach: Either (1) fully remove the legacy Next.js app and Supabase scaffolding, or (2) formally re-integrate them as the monitoring dashboard (consuming scraped data from scripts). Currently it's half-deleted.

**Placeholder Supabase credentials baked into client code:**
- Issue: `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` contain hardcoded placeholder JWT and Supabase URL fallbacks when env vars are missing. These are used during build time.
- Files: `src/lib/supabase/client.ts` (lines 3-14), `src/lib/supabase/server.ts` (lines 10-11)
- Impact: While marked as "placeholder" and intended for build-time fallback, this violates secret management practices. The JWT is visible in source control.
- Fix approach: Remove hardcoded credentials. Let the build fail if env vars are missing. Use proper secret injection at build/deployment time.

**Overly generic error handling in hooks:**
- Issue: All hooks (`useRevenue`, `useOpportunities`, `useGigs`, etc.) catch errors with `console.error()` and silently set state to empty arrays. No error recovery, retry logic, or user-facing error messages.
- Files: `src/lib/hooks/useRevenue.ts`, `src/lib/hooks/useOpportunities.ts`, `src/lib/hooks/useGigs.ts`, `src/lib/hooks/useProposals.ts`, `src/lib/hooks/useDailyMetrics.ts`
- Impact: Network errors are swallowed. Users see empty lists without knowing why. Debugging is difficult. Missing granular error states (no differentiation between 400, 401, 500, network timeout, etc.).
- Fix approach: Expand error state shape to include `{ error: null | { code: string; message: string } }`. Implement exponential backoff retry on 5xx. Return detailed error codes to component.

**Missing error boundary logging:**
- Issue: `src/components/shared/ErrorBoundary.tsx` logs errors to console but doesn't report to an error tracking service (Sentry, Axiom, etc.).
- Files: `src/components/shared/ErrorBoundary.tsx` (lines 32-35)
- Impact: Production errors in React components are invisible. No alerting for critical failures.
- Fix approach: Integrate Sentry (free tier available). Send `error` and `errorInfo` to error tracking service.

## Known Issues

**Selector brittleness in Fiverr scraper:**
- Problem: Fiverr dashboard selectors are provisional and likely to break if Fiverr updates their DOM. Multiple fallback selectors are provided, but they are not validated against real Fiverr pages.
- Files: `scripts/scrape-fiverr.mjs` (lines 44-128)
- Trigger: Any Fiverr UI redesign. Particularly vulnerable: seller level, response rate, response time, earnings balance, pending clearance, available for withdrawal, active gigs counts.
- Workaround: Script logs warnings when selectors don't match. Falls back to regex text search in page body.
- Risk: If no selector matches and regex fails, metric returns `null`. Report generation treats `null` as missing data, which is acceptable but reduces insight.

**Upwork selector volatility:**
- Problem: Upwork scrapers have even fewer fallback selectors than Fiverr. No regex fallback for most metrics.
- Files: `scripts/scrape-upwork.mjs` (lines 100-250)
- Trigger: Any Upwork dashboard update
- Workaround: Script has `safeText` and `safeNumber` helpers that return `null` on selector miss. Daily reports still generate even if Upwork data is sparse.
- Risk: Upwork data gaps don't fail the morning report (handled gracefully), but insights are incomplete.

**Optimistic update without conflict resolution in updateStage:**
- Problem: `src/lib/hooks/useOpportunities.ts` (`updateStage`, lines 108-133) applies optimistic update to local state before network request. If the network request fails, it re-fetches the entire opportunities list. This can discard concurrent edits.
- Files: `src/lib/hooks/useOpportunities.ts` (lines 108-133)
- Trigger: Network failure during drag-and-drop stage update. If user drags while offline, state updates locally. When online again, the full fetch overwrites any other changes made offline.
- Workaround: Most single-user workflows won't hit this. Conflict resolution is best-effort only.
- Risk: Data loss on concurrent offline-then-online edge cases. Not critical for single-user ops tool but problematic if multi-user mode is added later.

**Hardcoded timezone assumption:**
- Problem: Scrapers and scripts hardcode timezone to `America/Chicago` for Playwright viewport and environment.
- Files: `scripts/scrape-fiverr.mjs` (line 361), `scripts/fiverr-login.mjs` (line 44), `scripts/scrape-upwork.mjs` (line 180), `scripts/upwork-login.mjs` (line 42)
- Trigger: Running Gig-Engine from a different timezone will produce misleading timestamps in analytics and reports.
- Risk: Date comparisons in `generate-report.mjs` (day-over-day analysis) may be off if system timezone differs from hardcoded timezone.

## Performance Bottlenecks

**Synchronous markdown file I/O in tracker updates:**
- Problem: `scripts/update-tracker.mjs` reads entire tracker.md file (a large markdown table), parses it line-by-line, updates table cells, and writes the entire file back. No atomic updates or locking.
- Files: `scripts/update-tracker.mjs` (full file)
- Cause: Line-by-line text manipulation is O(n) where n = file size. File is ~400 lines currently, manageable but will degrade as history grows.
- Impact: Morning report generation is gated on tracker update. If tracker update is slow, the entire morning report is delayed.
- Improvement path: (1) Migrate tracker data to JSON (parse once, update in-memory, write once). (2) Add file locking to prevent concurrent writes from cron jobs. (3) Or, use a database (defeats document-driven design but enables scaling).

**No batching in Telegram message sending:**
- Problem: `scripts/send-telegram.mjs` sends Telegram messages sequentially with 1-second delays between chunks. If a report is split into 10 chunks, this takes 10+ seconds just for delivery.
- Files: `scripts/send-telegram.mjs` (lines 160-175)
- Cause: Telegram API rate limiting precautions are conservative. Could batch more aggressively.
- Impact: Morning report delivery is delayed for longer reports (low priority but observable).
- Improvement path: Increase batch size or switch to batched API calls if Telegram supports bulk message sending.

**Full re-fetch on error instead of differential update:**
- Problem: `useOpportunities.updateStage` re-fetches all opportunities on network failure instead of retrying the single update.
- Files: `src/lib/hooks/useOpportunities.ts` (line 128)
- Impact: If user has 100+ opportunities, re-fetch is expensive. Happens every time a drag-and-drop update fails.
- Improvement path: Implement retry logic with exponential backoff instead of full re-fetch. Cache the failed update and retry it on next successful request.

## Security Considerations

**Session state stored in user's home directory with loose permissions:**
- Risk: Fiverr and Upwork auth sessions are stored in `~/.gig-engine/fiverr-auth.json` and `~/.gig-engine/upwork-auth.json`. These files contain session cookies that could be stolen if a malicious process gains file system access.
- Files: `scripts/fiverr-login.mjs` (lines 20, 63), `scripts/scrape-fiverr.mjs` (line 35), `scripts/upwork-login.mjs` (lines 19-20), `scripts/scrape-upwork.mjs` (line 42)
- Current mitigation: Files are created by user process. No explicit permission hardening documented.
- Recommendations: (1) Restrict file permissions to `0600` (user read/write only) after creation. (2) Encrypt auth sessions at rest if sensitive. (3) Implement token rotation or session expiry to limit blast radius of stolen sessions.

**API credentials in .env.monitor committed or exposed:**
- Risk: `.env.monitor` is not in .gitignore (or is gitignored but used by launchd jobs). Telegram Bot Token and Chat ID are exposed if the file leaks.
- Files: `.env.monitor` (not in `.gitignore` - need to verify)
- Current mitigation: Unknown — file is noted in CLAUDE.md as containing secrets.
- Recommendations: (1) Confirm `.env.monitor` is in `.gitignore`. (2) Rotate Telegram token if it has been exposed. (3) Use a secrets manager (1Password, Hashicorp Vault) instead of dotenv files.

**No input validation on scraped data before report synthesis:**
- Risk: If scraped JSON contains malicious content (e.g., prompt injection in job titles), it's passed directly to Haiku API without sanitization.
- Files: `scripts/generate-report.mjs` (lines 212-213, payload includes raw scraped data)
- Impact: Low priority for single-user tool, but relevant if scraping is automated or data source changes.
- Recommendations: Validate JSON schema before report synthesis. Strip markdown/HTML from job titles.

## Fragile Areas

**Morning report orchestration is a single point of failure:**
- Files: `scripts/morning-report.mjs` (lines 50-59)
- Why fragile: If either Fiverr or Upwork scraper fails, the entire morning report fails and alerts are sent. But if _both_ fail, an error message is sent to Telegram. This logic is correct but the whole workflow is sequential: a single Playwright crash takes down the entire morning.
- Safe modification: Add per-scraper timeout and fallback. If Fiverr scraper hangs, time it out and continue with Upwork-only report instead of blocking.
- Test coverage: No tests for morning-report.mjs. No mock scrapers to validate fallback behavior.

**Scraper session expiry is undetected until runtime:**
- Files: `scripts/scrape-fiverr.mjs` (lines 369-376), `scripts/scrape-upwork.mjs` (lines 300-310)
- Why fragile: Sessions expire silently. Scraper detects redirect to `/login` page at runtime. By then, the cron job has already started.
- Safe modification: Pre-check session validity before launching the full scraper. (1) Load auth JSON and check cookie expiry timestamps. (2) Optionally ping the dashboard with a fast HEAD request to confirm session is live.
- Test coverage: No tests for session expiry handling.

**Markdown table parsing is fragile:**
- Files: `scripts/update-tracker.mjs` (lines 74-80, cell update logic)
- Why fragile: `updateCell` function assumes specific table structure. If markdown table formatting changes (e.g., extra spaces, different alignment), updates silently fail or corrupt the table.
- Safe modification: Use a markdown parser library instead of string splitting. Or lock the table structure with a JSON schema validator.
- Test coverage: No tests for tracker updates.

## Scaling Limits

**Scraper capacity limits with Playwright:**
- Current capacity: 2 scrapers (Fiverr, Upwork), 13 metrics per scraper, running daily
- Limit: Playwright launches a full Chromium instance per scraper. Headless, but still memory-intensive (~100-200 MB per browser). If adding Toptal, Arc.dev, or FlexJobs scrapers, memory usage compounds.
- Scaling path: (1) Reuse a single Playwright context for multiple sites (feasible). (2) Switch to lightweight HTTP scraping where possible (requires more selector maintenance). (3) Use serverless cloud functions (Netlify, Vercel Edge Functions) to distribute scraping load.

**Telegram message chunking for very large reports:**
- Current capacity: Reports split at 4096 chars (Telegram limit)
- Limit: 10-chunk reports take 10+ seconds to send (1 second per chunk). Very large multi-day digests could hit Telegram rate limits (~30 msgs/second globally).
- Scaling path: Use Telegram Bot API file upload for long reports, or switch to email/Slack for high-volume notifications.

**Single-user architecture blocks multi-user expansion:**
- Limit: All hooks and queries lack user context. No RLS (Row-Level Security) configured properly on Supabase.
- Scaling path: If Gig-Engine is to be shared, re-add proper auth and RLS policies. See `supabase/migrations/014_enable_rls.sql` for stub RLS policies.

## Dependencies at Risk

**playwright-extra + puppeteer-extra-plugin-stealth:**
- Risk: Stealth plugin is a cat-and-mouse game with Fiverr/Upwork anti-bot measures. Updates may be slow if the maintainer is not active. Plugin may break with Playwright API changes.
- Impact: Scrapers fail if plugin is no longer maintained.
- Migration plan: (1) Switch to official Playwright API with custom UA strings and delays. (2) Use a dedicated scraping service (ScrapingBee, Bright Data) if anti-bot measures become too aggressive.

**Anthropic Claude Haiku pricing and availability:**
- Risk: Morning report synthesis depends on Anthropic API. API price changes or service degradation directly impacts cost and reliability of morning briefings.
- Impact: (1) High API costs if usage scales. (2) Outages block morning reports. (3) Rate limiting if requests spike.
- Migration plan: (1) Cache AI-synthesized reports (reuse yesterday's report structure if today's data is sparse). (2) Implement fallback template-based reports (already done in `generate-report.mjs`). (3) Evaluate open-source models (Llama, Mistral) if self-hosting is feasible.

**Next.js 14 + Supabase SSR:**
- Risk: These dependencies are installed but unused. If the project re-integrates the UI layer, they'll need updates. Version lock at time of writing: Next.js 14.2.35, Supabase SSR 0.8.0. Both are current but will age.
- Impact: Security patches may be missed if code is revived without dependency updates.
- Migration plan: If UI is to be used, pin to latest and conduct security audit before deploying.

## Test Coverage Gaps

**Morning report orchestration has no tests:**
- What's not tested: Failure modes in `scripts/morning-report.mjs` (lines 26-68). Specifically: (1) Both scrapers fail — does alert send correctly? (2) One scraper fails — is report still generated? (3) Telegram delivery fails — does exit code reflect failure?
- Files: `scripts/morning-report.mjs`
- Risk: Cron job could be silently failing for days without alerting.
- Priority: High

**Scraper selectors have no validation tests:**
- What's not tested: Do the CSS selectors in `scripts/scrape-fiverr.mjs` (lines 45-128) and `scripts/scrape-upwork.mjs` actually match real Fiverr/Upwork pages?
- Files: `scripts/scrape-fiverr.mjs`, `scripts/scrape-upwork.mjs`
- Risk: Scrapers could be extracting `null` for all metrics without alerting.
- Priority: High

**Tracker update logic has no tests:**
- What's not tested: Does `updateCell` function correctly handle edge cases? (1) Cell with no spaces, (2) cell with variable padding, (3) missing column
- Files: `scripts/update-tracker.mjs`
- Risk: Tracker table silently corrupts.
- Priority: Medium

**React hooks (useRevenue, useOpportunities, etc.) have no tests:**
- What's not tested: (1) Do hooks retry on network errors? (2) Do they emit correct error states? (3) Do optimistic updates rollback on failure?
- Files: `src/lib/hooks/*.ts`
- Risk: UI fails silently in production. Only noticed if a user reports it.
- Priority: Medium

**Supabase client initialization has no tests:**
- What's not tested: Do the placeholder Supabase credentials work correctly during build? Does the fallback credential JWT actually parse?
- Files: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`
- Risk: Build could be silently using placeholder credentials, making the app non-functional in production.
- Priority: High

## Missing Critical Features

**No monitoring/alerting for scraper health:**
- Problem: Scrapers run silently. If all selectors fail and return nulls, the morning report still generates (with empty metrics). No alert is sent to indicate a problem.
- Blocks: Confidence in automation. Early detection of anti-bot measures or platform changes.
- Recommendation: Add a health check step after scraping: if >50% of metrics are null, send an alert before report generation.

**No retry/backoff strategy for Fiverr/Upwork login expiry:**
- Problem: When session expires, cron job fails. Manual re-auth via `fiverr-login.mjs` is required.
- Blocks: Fully autonomous morning reports.
- Recommendation: Implement automatic re-login on session expiry (requires storing credentials securely, which adds complexity).

**No differential reporting (day-over-day insight):**
- Problem: `generate-report.mjs` has plumbing for yesterday's data (lines 169-170) and passes it to Haiku, but the fallback template report doesn't calculate or display day-over-day changes.
- Blocks: Morning briefing insights. Users can't see if metrics improved or degraded.
- Recommendation: Add % change calculations in template fallback. Format as "Balance: $100 (+5% vs yesterday)".

---

*Concerns audit: 2026-02-17*
