# Gig Monitor: Automated Fiverr/Upwork Morning Report System

> **Created**: 2026-02-11
> **Status**: Plan — awaiting Alex approval
> **Team**: gig-monitor-plan (4 research agents)
> **Monthly Cost**: ~$0.43 (Option B Hybrid with Haiku 4.5)

---

## Executive Summary

Automated daily monitoring system that scrapes Fiverr seller dashboard (no API exists), pulls Upwork data via official GraphQL API, synthesizes an AI-powered morning briefing, updates `tracker.md`, and delivers via Telegram — all before Alex's 7:00 AM proposal workflow begins.

**Architecture**: Hybrid (Option B) — standalone Node.js scripts handle all scraping/API calls (zero AI tokens), then Haiku 4.5 synthesizes the report ($0.014/day).

**Scheduling**: macOS `launchd` at 6:45 AM (survives sleep with `WakeSystem`) as primary. OpenClaw cron as secondary/manual trigger.

---

## Architecture Overview

```
                       6:40 AM                    6:45 AM
                    +-----------+              +-------------+
                    | pmset     |              | launchd     |
                    | wake Mac  |──────────────| plist fires |
                    +-----------+              +------+------+
                                                      |
                                          +-----------v-----------+
                                          |  morning-report.mjs   |
                                          |  (main orchestrator)  |
                                          +--+--------+--------+--+
                                             |        |        |
                              +--------------+   +----+----+   +-------------+
                              |                  |         |                 |
                    +---------v--------+  +------v---+ +---v---------+      |
                    | scrape-fiverr.mjs|  |fetch-     | |generate-    |      |
                    | Playwright       |  |upwork.mjs | |report.mjs   |      |
                    | (headless)       |  |GraphQL API| |Haiku 4.5    |      |
                    +---------+--------+  +------+---+ +---+---------+      |
                              |                  |         |                 |
                              v                  v         v                 v
                    data/fiverr/       data/upwork/  data/reports/   tracker.md
                    metrics-latest.json              YYYY-MM-DD.md   (updated)
                                                           |
                                                    +------v-------+
                                                    | send-telegram |
                                                    | Bot API       |
                                                    +--------------+
                                                           |
                                                    +------v-------+
                                                    | @mike_lawdbot|
                                                    | → Alex       |
                                                    +--------------+

                       7:15 AM
                    +-------------+
                    | watchdog.sh |  ← checks report exists, alerts if missing
                    +-------------+
```

---

## Decision Log

### Why Option B (Hybrid) over A or C?

| Option | Monthly Cost | Intelligence | Reliability | Maintenance |
|--------|-------------|-------------|-------------|-------------|
| **A: Full AI Pipeline** | $1.95-9.75 | High | Low (DOM changes break AI) | High |
| **B: Hybrid (CHOSEN)** | **$0.43** | **Medium** | **High** | **Low** |
| **C: Zero AI** | $0.00 | None | Highest | Low |

Option B wins because:
- Playwright scripts are deterministic — they don't burn tokens navigating
- Haiku 4.5 at $0.014/day adds trend analysis, anomaly detection, and actionable insights
- Even upgrading to Opus is only $2.14/month — trivially cheap
- Graceful degradation: if Haiku is down, falls back to template-only report

### Why launchd over OpenClaw cron (primary)?

- Mac is typically sleeping at 6:45 AM (lid closed overnight)
- OpenClaw cron requires the gateway process to be awake — it can't fire if macOS suspended it
- launchd with `WakeSystem: true` wakes the Mac first, then runs the script
- Same proven pattern as the Claude Code Router (`com.alexhale.claude-code-router`)
- OpenClaw cron is still useful for manual triggers (`/morning-report`)

### Why direct Telegram Bot API over OpenClaw delivery?

- Zero dependency on OpenClaw gateway being up
- Direct `curl` to `api.telegram.org` is simpler and more reliable
- Bot token (`8488281192:AAF...`) and chat ID (`5891169890`) already known
- OpenClaw is the fallback, not the primary delivery channel

---

## Phase 1: Foundation (Day 1)

### 1A. Create directory structure

```
Gig-Engine/
  scripts/
    morning-report.mjs       # Main orchestrator
    scrape-fiverr.mjs        # Playwright Fiverr scraper
    fetch-upwork.mjs         # Upwork OAuth2 + GraphQL client
    generate-report.mjs      # Haiku 4.5 synthesis call
    send-telegram.mjs        # Telegram Bot API sender
    update-tracker.mjs       # tracker.md auto-updater
    watchdog.sh              # 7:15 AM missing report check
  data/
    fiverr/
      history/               # Daily snapshots (YYYY-MM-DD.json)
    upwork/
      history/               # Daily snapshots (YYYY-MM-DD.json)
    reports/                  # Generated morning reports (YYYY-MM-DD.md)
  logs/                       # launchd stdout/stderr
```

### 1B. Install dependencies

```bash
cd /Users/alexhale/Projects/Gig-Engine
npm install playwright @anthropic-ai/sdk dotenv
npx playwright install chromium
```

### 1C. Create `.env.monitor` (gitignored)

```bash
# Telegram (already known from OpenClaw config)
TELEGRAM_BOT_TOKEN=<from ~/.openclaw/openclaw.json>
TELEGRAM_CHAT_ID=5891169890

# Anthropic (for Haiku synthesis)
ANTHROPIC_API_KEY=<from existing key>

# Upwork OAuth 2.0 (after API app approval)
UPWORK_CLIENT_ID=
UPWORK_CLIENT_SECRET=
UPWORK_ACCESS_TOKEN=
UPWORK_REFRESH_TOKEN=

# Paths
GIG_ENGINE_ROOT=/Users/alexhale/Projects/Gig-Engine
```

### 1D. Register Upwork API app (START NOW — 2 week wait)

1. Go to https://www.upwork.com/developer/
2. Create new app with description: "Personal dashboard to monitor my freelancer activity: proposals, contracts, earnings, and messages. Internal use only."
3. Redirect URI: `http://localhost:3000/callback`
4. Request **read-only scopes only**: Common Entities, Jobs, Proposals/Offers, Contracts, Messages, Reports, Freelancer Profile
5. Wait for email approval (~2 weeks)

### 1E. Token storage via macOS Keychain

```bash
# Store secrets securely (after obtaining them)
security add-generic-password -a "gig-monitor" -s "anthropic-api-key" -w "$ANTHROPIC_API_KEY"
security add-generic-password -a "gig-monitor" -s "telegram-bot-token" -w "$TELEGRAM_BOT_TOKEN"
security add-generic-password -a "gig-monitor" -s "upwork-client-id" -w "$UPWORK_CLIENT_ID"
security add-generic-password -a "gig-monitor" -s "upwork-client-secret" -w "$UPWORK_CLIENT_SECRET"

# Retrieve in scripts
security find-generic-password -a "gig-monitor" -s "anthropic-api-key" -w
```

---

## Phase 2: Fiverr Scraper (Days 1-3)

### Scraping Specification

**Tool**: Playwright (headless Chromium) + `playwright-extra` with stealth plugin
**Auth**: `storageState` JSON file saved after manual login
**Frequency**: 1x/day at 6:45 AM
**Session duration**: 45-90 seconds (3-5 pages)
**Anti-detection**: residential IP, human-speed delays (3-8s), persistent browser profile

### Pages to Visit (MVP — 3 pages)

| # | URL | Data Extracted |
|---|-----|----------------|
| 1 | `/seller_dashboard` | Seller level, success score, earnings summary, to-dos, active gig count |
| 2 | `/manage_orders` | Active orders, deadlines, items needing attention |
| 3 | `/inbox` | Unread message count, new buyer inquiries |

### Enhanced (add after MVP — 5 pages)

| 4 | `/seller_dashboard/analytics` | Trend data, traffic sources, monthly chart |
| 5 | `/seller_dashboard/earnings` | Pending clearance, withdrawable balance |

### Authentication Flow

1. **First run (manual)**: Alex runs Playwright in headed mode, logs into Fiverr manually (handling any 2FA/device verification), script saves `storageState` to `~/.gig-engine/fiverr-auth.json`
2. **Subsequent runs**: Script loads `storageState`, navigates to `/seller_dashboard`, checks if redirected to `/login` — if yes, alerts Alex via Telegram
3. **After each successful run**: Re-save `storageState` to capture refreshed cookies

### Anti-Detection Strategy

- Persistent browser context (not incognito)
- `playwright-extra` + stealth plugin (patches `navigator.webdriver`, WebGL fingerprint, etc.)
- Realistic viewport: 1440x900
- Random delays: `3000 + Math.random() * 5000` ms between navigations
- Residential IP only (Alex's home network)
- Same browser profile every run

### Data Extraction Approach

Primary: DOM scraping via `page.textContent()` / `page.$$eval()`
Investigate: `get_perseus_initial_props()` — Fiverr may embed structured JSON in initial page load (React SSR pattern). If found, this is more reliable than DOM selectors.

### Output Schema (`data/fiverr/metrics-latest.json`)

```json
{
  "scraped_at": "2026-02-11T06:45:32-06:00",
  "platform": "fiverr",
  "seller_level": "new_seller",
  "success_score": null,
  "response_rate": "100%",
  "response_time": "1h",
  "gigs": [
    {
      "id": "AW-01",
      "title": "n8n Workflow Build",
      "status": "live",
      "impressions": 245,
      "clicks": 18,
      "orders": 1,
      "conversion_rate": "5.6%",
      "revenue": 297,
      "rating": null,
      "reviews": 0
    }
  ],
  "inbox": { "unread": 2, "pending_orders": 1 },
  "totals": {
    "impressions": 1250,
    "clicks": 87,
    "orders": 3,
    "revenue": 741,
    "active_gigs": 10
  },
  "earnings": {
    "available": 0,
    "pending_clearance": 741,
    "expected": 0
  }
}
```

### Error Handling

| Failure | Detection | Response |
|---------|-----------|----------|
| Session expired | Redirect to `/login` | Alert: "Fiverr session expired — re-login needed" |
| CAPTCHA | Cloudflare challenge page | Alert: "Fiverr CAPTCHA — manual login required within 1hr" |
| 2FA triggered | Login page shows 2FA form | Alert: "Fiverr 2FA — approve on phone" |
| DOM changed | Selector returns null | Log error, skip field, alert if >3 fields missing |

---

## Phase 3: Upwork API Client (Days 3-7, after API approval)

### OAuth 2.0 Flow

**Initial auth (one-time, requires browser):**
1. Script starts local HTTP server on `localhost:3000`
2. Opens browser to Upwork authorization URL
3. Alex logs in and approves
4. Upwork redirects to `localhost:3000/callback?code=AUTH_CODE`
5. Script exchanges code for `access_token` + `refresh_token`
6. Stores both in macOS Keychain

**Daily operation (headless):**
1. Read tokens from Keychain
2. If `access_token` expired (24h TTL), refresh using `refresh_token`
3. Make GraphQL queries
4. Save new `refresh_token` to Keychain (rolling 14-day window)

### API Endpoints for Morning Report

| Query | Method | Data |
|-------|--------|------|
| Job search (3 skill sets) | GraphQL `marketplaceJobPostingsSearch` | New matching jobs from saved searches |
| My proposals | GraphQL `freelancerOffers` | Pending/active proposals and status |
| Active contracts | GraphQL `contracts` | In-progress work, milestones |
| Messages | REST `GET /api/v3/messages/rooms` | Unread conversations |
| Earnings | REST `GET /api/v3/reports/finance/...` | Current period revenue |
| My profile | GraphQL `user > freelancerProfile` | Profile data, hourly rate |

**Total: ~14 API requests per run** (well within 300/min rate limit)

### What Requires Browser Fallback (Phase 5)

- Profile view count (no API endpoint)
- Connects balance (not documented)
- Job Success Score (not documented)
- Saved search configuration (not documented)

### Output Schema (`data/upwork/metrics-latest.json`)

```json
{
  "fetched_at": "2026-02-11T06:45:45-06:00",
  "platform": "upwork",
  "profile": {
    "title": "Automation & AI Specialist",
    "hourly_rate": "$110-125/hr",
    "availability": "More than 30 hrs/week"
  },
  "proposals": {
    "total_sent": 47,
    "pending": 12,
    "interviewing": 3,
    "withdrawn": 2
  },
  "contracts": {
    "active": 1,
    "total_value": 2500,
    "milestones_due": []
  },
  "messages": {
    "unread_rooms": 2
  },
  "earnings": {
    "this_week": 500,
    "this_month": 500,
    "pending": 0
  },
  "job_matches": [
    {
      "title": "n8n automation for Salesforce",
      "budget": 2000,
      "proposals_count": 3,
      "posted_hours_ago": 4,
      "skills": ["n8n", "Salesforce", "API Integration"],
      "url": "https://www.upwork.com/jobs/..."
    }
  ]
}
```

### Cost

**The Upwork API is completely free** for authenticated freelancers. No per-request fees, no monthly subscription. The only cost is the compute to run the script (~0 on local Mac).

### TOS Compliance

- Read-only scopes only — no automated proposals, no message sending
- Personal dashboard use — not reselling data
- Within rate limits (14 req/run vs 300/min allowed)
- 24-hour cache policy respected (daily snapshots overwrite)

---

## Phase 4: Report Synthesis + Delivery (Days 2-3)

### Haiku 4.5 Synthesis

**Input** (~6,800 tokens):
- Today's Fiverr metrics JSON
- Today's Upwork metrics JSON
- Yesterday's metrics (from `history/` for comparison)
- System prompt with report template and instructions

**Output** (~1,500 tokens):
- Formatted morning briefing with trend analysis, anomaly flags, and action items

**Cost**: $0.014/day = **$0.43/month**

### System Prompt (for `generate-report.mjs`)

```
You are Alex's morning briefing assistant for PrettyFly.ai freelance operations.

Given today's Fiverr and Upwork metrics (plus yesterday's for comparison), generate a concise morning briefing.

Format:
- Platform sections with key metrics and day-over-day changes
- Flag any anomalies (>20% drops, new orders, urgent messages)
- Top 3 actionable priorities for the morning workflow
- Highlight best job matches from Upwork saved searches

Keep it under 300 words. Use plain text (Telegram-compatible).
No emojis unless a metric is critical (use ⚠️ for alerts only).
```

### Telegram Morning Report Format

```
PRETTYFLY MORNING BRIEFING
2026-02-11 (Tue) | Day 14 of 90

--- FIVERR ---
Impressions: 1,250 (+12%)
Clicks: 87 (6.9% CTR)
Orders: 3 ($741 total)
Unread messages: 2
Pending deliveries: 1

Top performer: AI-01 (45 clicks)
⚠️ AW-02 impressions dropped 30%

--- UPWORK ---
Proposals sent: 47 total
Interviews: 3 active
Contracts: 1 ($2,500)
Earnings this month: $500

New matches: 8 jobs
Best: "n8n automation for Salesforce" ($2K, 3 proposals)

--- PRIORITIES ---
1. Reply to 2 Fiverr messages (response time)
2. Send 5-10 proposals on 8 new Upwork matches
3. Consider refreshing AW-02 title (impressions down)

Next report: tomorrow 6:45 AM
```

### tracker.md Auto-Update

`update-tracker.mjs` parses the markdown tables in `tracker.md` and updates:
- Fiverr table: Impressions, Clicks, Orders, Revenue columns per gig
- Upwork table: Proposals Sent, Interviews, Contracts, Revenue columns
- Deployment Status: Posted/Live counts
- Weekly Performance Summary: if Monday, fill in prior week row

---

## Phase 5: Scheduling + Fallbacks (Day 3)

### Primary: launchd plist

**File**: `~/Library/LaunchAgents/com.prettyfly.gig-monitor.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.prettyfly.gig-monitor</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/alexhale/Projects/Gig-Engine/scripts/morning-report.mjs</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>6</integer>
        <key>Minute</key>
        <integer>45</integer>
    </dict>
    <key>WakeSystem</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/alexhale/Projects/Gig-Engine/logs/morning-report-stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/alexhale/Projects/Gig-Engine/logs/morning-report-stderr.log</string>
    <key>WorkingDirectory</key>
    <string>/Users/alexhale/Projects/Gig-Engine</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>
```

### Backup: pmset wake

```bash
sudo pmset repeat wakeorpoweron MTWRFSU 06:40:00
```

### Watchdog (7:15 AM)

**File**: `~/Library/LaunchAgents/com.prettyfly.gig-watchdog.plist`
Runs `scripts/watchdog.sh` at 7:15 AM — checks if today's report file exists, alerts via Telegram if missing.

### Manual Triggers

| Trigger | How |
|---------|-----|
| Telegram | `@mike_lawdbot /morning-report` → OpenClaw runs the script |
| CLI | `node scripts/morning-report.mjs` |
| npm | `npm run morning-report` |
| Claude Code | Playwright MCP for interactive debugging |

### OpenClaw Cron (secondary)

```bash
openclaw cron add \
  --name "gig-monitor-morning" \
  --cron "45 6 * * *" \
  --tz "America/Chicago" \
  --session isolated \
  --message "Run: node /Users/alexhale/Projects/Gig-Engine/scripts/morning-report.mjs" \
  --channel telegram
```

---

## Cost Model

### Per-Run Costs

| Component | Tokens (input) | Tokens (output) | Cost (Haiku) |
|-----------|----------------|-----------------|--------------|
| Fiverr scrape | 0 | 0 | $0.00 |
| Upwork API | 0 | 0 | $0.00 |
| Haiku synthesis | ~6,800 | ~1,500 | $0.014 |
| Telegram send | 0 | 0 | $0.00 |
| tracker.md update | 0 | 0 | $0.00 |
| **Total per run** | **~6,800** | **~1,500** | **$0.014** |

### Monthly Costs

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| Haiku 4.5 synthesis (30 runs) | $0.43 | With prompt caching: ~$0.35 |
| Upwork API | $0.00 | Free for authenticated users |
| Playwright/Node.js | $0.00 | Runs locally |
| Telegram Bot API | $0.00 | Free |
| macOS launchd | $0.00 | OS built-in |
| **Total** | **$0.43/month** | |

### Upgrade Path

| Need | Model | Monthly Cost |
|------|-------|-------------|
| Basic metrics + trends | Haiku 4.5 | $0.43 |
| Proposal suggestions | Sonnet 4.5 | $1.28 |
| Full strategic analysis | Opus 4.6 | $2.14 |

---

## MCP Configuration

### Playwright MCP — Claude Code only (manual debugging)

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

NOT added to OpenClaw. Reasons:
- Adds ~2,000-3,000 tokens to every prompt (tool definitions)
- OpenClaw gateway blocks browser commands via `denyCommands`
- Hybrid approach runs Playwright outside the AI loop
- Only useful for interactive debugging sessions

### No other MCPs needed

The automated pipeline is self-contained Node.js. No MCP servers required.

---

## Error Handling Matrix

| Error | Detection | Response | Alert Level |
|-------|-----------|----------|-------------|
| Fiverr session expired | Redirect to `/login` | Skip Fiverr, use yesterday's data | P0 — immediate |
| Fiverr CAPTCHA | Challenge page detected | Skip Fiverr, alert | P0 — response time at risk |
| Fiverr 2FA | 2FA form on login page | Skip Fiverr, alert | P0 |
| Fiverr DOM changed | Selector returns null | Log, skip field, alert if >3 | P1 — fix before tomorrow |
| Upwork token expired | 401 response | Auto-refresh via refresh_token | Silent (log only) |
| Upwork refresh expired | 401 after refresh | Alert for manual re-auth | P0 |
| Upwork rate limited | 429 response | Backoff: 30s, 60s, 120s | P2 if retries succeed |
| Network down | ECONNREFUSED | Retry 3x, save local, alert | P1 |
| Haiku API error | Non-200 from Anthropic | Template-only report (no AI) | P2 — informational |
| Telegram send failed | Bot API error | Retry 2x, save report locally | P2 |
| Script crash | Non-zero exit code | Watchdog alerts at 7:15 AM | P1 |

### Alert Delivery

All alerts via direct Telegram Bot API (not through OpenClaw).
P0 alerts include a 7:15 AM follow-up reminder if unresolved.

---

## Security Considerations

1. **Fiverr credentials**: Never stored in code. `storageState` JSON at `~/.gig-engine/fiverr-auth.json` (chmod 600)
2. **Upwork OAuth tokens**: macOS Keychain (primary), `.env.monitor` (fallback, gitignored)
3. **Anthropic API key**: macOS Keychain or `.env.monitor`
4. **Telegram bot token**: Already in OpenClaw config; reuse in `.env.monitor`
5. **Git**: `.env.monitor`, `data/`, `logs/`, `~/.gig-engine/` all gitignored
6. **Upwork token rotation**: Each refresh returns a new refresh_token — always persist immediately
7. **Read-only scopes**: Upwork API uses read-only permissions only — no write risk
8. **No automated posting**: System never submits proposals, sends messages, or modifies listings

---

## Files to Create / Modify

### New Files

| File | Purpose |
|------|---------|
| `scripts/morning-report.mjs` | Main orchestrator — runs all steps in sequence |
| `scripts/scrape-fiverr.mjs` | Playwright headless Fiverr dashboard scraper |
| `scripts/fetch-upwork.mjs` | Upwork OAuth2 token refresh + GraphQL queries |
| `scripts/generate-report.mjs` | Haiku 4.5 API call for report synthesis |
| `scripts/send-telegram.mjs` | Direct Telegram Bot API message sender |
| `scripts/update-tracker.mjs` | Parses and updates tracker.md tables |
| `scripts/watchdog.sh` | 7:15 AM check for missing report |
| `.env.monitor` | Secrets file (gitignored) |
| `~/Library/LaunchAgents/com.prettyfly.gig-monitor.plist` | 6:45 AM schedule |
| `~/Library/LaunchAgents/com.prettyfly.gig-watchdog.plist` | 7:15 AM watchdog |

### Modified Files

| File | Change |
|------|--------|
| `package.json` | Add scripts + dependencies (playwright, @anthropic-ai/sdk, dotenv) |
| `.gitignore` | Add `.env.monitor`, `data/`, `logs/` |
| `tracker.md` | Auto-updated daily by `update-tracker.mjs` |

### New Directories

```
data/fiverr/history/
data/upwork/history/
data/reports/
logs/
```

---

## Implementation Sequence

| Phase | Days | What | Blocker |
|-------|------|------|---------|
| **1: Foundation** | Day 1 | Dirs, deps, .env, Keychain setup | None |
| **2: Fiverr Scraper** | Days 1-3 | Playwright script, storageState, anti-detection | Alex must do initial Fiverr login |
| **3: Upwork API** | Days 3-7 | OAuth flow, GraphQL queries, token refresh | **2-week API app approval** |
| **4: Report + Delivery** | Days 2-3 | Haiku synthesis, Telegram send, tracker update | Phases 2 or 3 (either alone is enough for MVP) |
| **5: Scheduling** | Day 3 | launchd plists, pmset, watchdog, OpenClaw cron | Phase 4 |

**Critical path**: Register Upwork API app NOW (Phase 1D). The 2-week approval is the longest lead time. Fiverr scraper can ship independently while waiting.

---

## Decisions Needing Alex Input

1. **Fiverr Seller Plus**: Do you have Seller Plus ($11.99/mo)? If yes, we get advanced analytics (per-gig conversion rates, click-through rates, top keywords). Affects scraping scope.

2. **Upwork API app**: Need you to register at https://www.upwork.com/developer/ — requires your logged-in account. Can you do this today?

3. **OpenClaw browser deny list**: The gateway currently blocks `browser.navigate`, `browser.evaluate`, `browser.screenshot`. Do you want to keep this restriction? (Recommendation: yes, keep it — the hybrid approach works around it.)

4. **RipKit integration**: You have RipKit at `/Users/alexhale/Projects/RipKit/` (Playwright + Cheerio + AI scraping toolkit). Should we build the Fiverr scraper as a RipKit module or as a standalone script in Gig-Engine? (Recommendation: standalone in Gig-Engine for simplicity.)

5. **Report delivery channel**: Direct Telegram Bot API (recommended, no OpenClaw dependency) or through OpenClaw gateway (adds dependency but integrates with Mike's conversation)?

---

## Revision Log

| Date | Change |
|------|--------|
| 2026-02-11 | Plan created by gig-monitor-plan team (4 research agents) |
