# External Integrations

**Analysis Date:** 2026-02-17

## APIs & External Services

**Anthropic AI:**
- Claude API (Haiku 4.5) - Synthesizes daily morning briefings from scraped metrics
  - SDK: `@anthropic-ai/sdk` (0.74.0)
  - Auth: `ANTHROPIC_API_KEY` (env var in `.env.monitor`)
  - Usage: `scripts/generate-report.mjs` for daily report synthesis
  - Fallback: Template-based report if API unavailable

**Telegram:**
- Telegram Bot API - Delivers daily morning reports and alerts
  - Client: Native `fetch()` to `https://api.telegram.org/bot{token}/sendMessage`
  - Auth: `TELEGRAM_BOT_TOKEN` (env var in `.env.monitor`)
  - Recipient: `TELEGRAM_CHAT_ID` (env var in `.env.monitor`)
  - Usage: `scripts/send-telegram.mjs` for message delivery
  - Features: Message chunking (max 4096 chars per message), retry logic (2 retries, 5s delay)

**Fiverr:**
- Seller Dashboard - Scraped for metrics and gig performance data
  - Client: Playwright + stealth plugin (puppeteer-extra-plugin-stealth)
  - Auth: Session saved to `~/.gig-engine/fiverr-auth.json` (user home directory)
  - Login: Interactive via `scripts/fiverr-login.mjs` (manual re-auth when needed)
  - Scraper: `scripts/scrape-fiverr.mjs` (daily automated via launchd)
  - Output: `data/fiverr/metrics-latest.json` + dated archive in `data/fiverr/history/`
  - Metrics: Seller level, response rate, response time, earnings balance, pending clearance

**Upwork:**
- Dashboard - Scraped for metrics and job opportunity tracking
  - Client: Playwright + stealth plugin (puppeteer-extra-plugin-stealth)
  - Auth: Session saved to `~/.gig-engine/upwork-auth.json` (user home directory)
  - Login: Interactive via `scripts/upwork-login.mjs` (manual re-auth when needed)
  - Scraper: `scripts/scrape-upwork.mjs` (daily automated via launchd)
  - Output: `data/upwork/metrics-latest.json` + dated archive in `data/upwork/history/`
  - Metrics: Job views, applications, contracts, earnings

## Data Storage

**Databases:**
- Supabase PostgreSQL (version 15)
  - Connection: Via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Client: `@supabase/supabase-js` (2.95.3) - prepared but not actively used in current state
  - Server-side: `@supabase/ssr` (0.8.0) - auth helpers for future implementation
  - Local dev: `supabase/config.toml` with Docker-based local database (port 54322)
  - Status: Application UI prepared; backend integration deferred

**File Storage:**
- Local filesystem only
  - Generated listings: `listings/` (markdown files)
  - Gig images: `images/fiverr/` (PNG files, 1280x769)
  - Scraped data: `data/fiverr/` and `data/upwork/` (JSON metrics)
  - Reports: `data/reports/` (markdown daily briefings)
  - Auth sessions: `~/.gig-engine/` (home directory, outside project)

**Caching:**
- None - reports generated fresh daily

## Authentication & Identity

**Auth Providers:**
- Custom: Browser session-based authentication for Fiverr/Upwork
  - Mechanism: Automated login scripts save browser session cookies to user home directory
  - Storage: `~/.gig-engine/fiverr-auth.json` and `~/.gig-engine/upwork-auth.json`
  - Expiry: Managed manually (scripts may require re-authentication if sessions expire)

**Future Auth:**
- Supabase Auth prepared but not yet implemented
  - JWT expiry: 3600 seconds (configured in `supabase/config.toml`)
  - Enable signup: true (configured)
  - Double confirm changes: enabled

## Monitoring & Observability

**Error Tracking:**
- None - errors logged to console and exit codes

**Logs:**
- Console output via Node.js scripts
- Daily execution logs via launchd job logs
- Script output: `scripts/morning-report.mjs` → console output (timestamp + step results)
- No persistent log storage (launchd stderr captured by system)

## CI/CD & Deployment

**Hosting:**
- Vercel (GitHub auto-deploy from `main` branch)
  - Project ID: `prj_RGYurFzF1tt8aVJbGPdce2gJHFEZ`
  - URL: https://gig-engine.vercel.app
  - Connected: GitHub main branch auto-deploys frontend

**CI Pipeline:**
- GitHub (auto-deploy on push to main)
- Build command: `npm run build` (inherited from Next.js)
- Start command: `npm start` (inherited from Next.js)

**Local Scheduling:**
- launchd (macOS)
  - `com.prettyfly.gig-monitor` - Daily 6:45 AM (orchestrator: morning-report.mjs)
  - `com.prettyfly.gig-watchdog` - Daily 7:45 AM (watchdog.sh)
  - `com.prettyfly.marketing-queue` - Every 5 minutes (separate PrettyFly service)
  - `com.prettyfly.marketing-token-refresh` - Sundays 3 AM (separate PrettyFly service)

## Environment Configuration

**Required env vars (development):**
```
NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY       # Supabase service role (optional, not currently used)
ANTHROPIC_API_KEY               # Claude API key (required for morning reports)
```

**Required env vars (monitoring/scripts):**
```
TELEGRAM_BOT_TOKEN              # Telegram Bot token (morning reports)
TELEGRAM_CHAT_ID                # Telegram recipient chat ID
ANTHROPIC_API_KEY               # Claude API key
GIG_ENGINE_ROOT                 # Project root path (used by scripts)
```

**Secrets location:**
- `.env.local` (development frontend, `.gitignore`d)
- `.env.monitor` (monitoring scripts, `.gitignore`d)
- Session storage: `~/.gig-engine/` (user home, outside project)
- Vercel environment variables (production)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- Telegram messages (one-way: daily morning report delivery)
  - Endpoint: `https://api.telegram.org/bot{token}/sendMessage`
  - Payload: JSON with chat_id, text, parse_mode

---

*Integration audit: 2026-02-17*
