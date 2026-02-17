# Gig-Engine — PrettyFly Gig Deployment Engine

> Status: active | Type: product

Document-driven freelance deployment system. Pivoted from SaaS app to automation scripts + markdown listings.

## Current State
- 44 listings ready (22 Fiverr, 22 Upwork) across 5 pillars in `listings/`
- 22 Fiverr gig images (1280x769 PNG) in `images/fiverr/`
- 31 services in strategy matrix (22 P1 + P2 deployed, 9 P3 planned)
- Strategy matrix + platform-specific checklists
- Gig Monitor LIVE (daily Playwright scraping + Haiku AI morning briefing via Telegram)

## Tech Stack
- Node.js scripts, Playwright + stealth plugin (scraping)
- Haiku 4.5 (AI synthesis), Telegram Bot API
- launchd scheduling, Satori + resvg-js (image generation)
- Auth state at `~/.gig-engine/`, env at `.env.monitor`

## Key Files

| Path | Purpose |
|------|---------|
| `listings/` | 44 markdown listing files (22 Fiverr + 22 Upwork) |
| `images/fiverr/` | 22 Fiverr gig images (Satori-generated) |
| `scripts/morning-report.mjs` | Daily report orchestrator |
| `scripts/scrape-fiverr.mjs` | Fiverr dashboard scraper |
| `scripts/scrape-upwork.mjs` | Upwork dashboard scraper |
| `scripts/generate-report.mjs` | Haiku 4.5 AI synthesis |
| `scripts/send-telegram.mjs` | Telegram Bot API delivery |
| `scripts/update-tracker.mjs` | Auto-updates tracker.md metrics |
| `strategy-matrix.md` | 5 pillars x 4 platforms strategy |
| `tracker.md` | Deployment status + live metrics (auto-updated) |
| `checklists/` | Platform-specific posting guides |

## Gig Monitor
- **launchd**: `com.prettyfly.gig-monitor` (daily 6:45 AM) + `com.prettyfly.gig-watchdog` (7:15 AM)
- **Flow**: Scrape Fiverr/Upwork -> AI synthesis -> Telegram briefing -> update tracker
- **Auth**: `~/.gig-engine/fiverr-auth.json` + `~/.gig-engine/upwork-auth.json`
- **Re-auth**: `node scripts/fiverr-login.mjs` / `node scripts/upwork-login.mjs`
- **Env**: `.env.monitor` (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, ANTHROPIC_API_KEY)
- **Cost**: ~$0.43/month (Haiku synthesis only)

## Commands
```bash
node scripts/morning-report.mjs        # Run daily report manually
node scripts/fiverr-login.mjs          # Re-auth Fiverr (interactive)
node scripts/upwork-login.mjs          # Re-auth Upwork (interactive)
node scripts/generate-gig-images.mjs    # Regenerate all 22 gig images
```

## Common Pitfalls
- Auth state lives in `~/.gig-engine/`, NOT in the project directory
- Scrapers use `playwright-extra` stealth plugin — don't remove it
- Env vars in `.env.monitor` (not `.env.local`)
- Legacy `src/` and `supabase/` dirs are NOT active — see `docs/PROJECT-SPEC.md`
- Scraper selectors may need updating when platforms change their DOM

## Next Steps
- Post listings to platforms using `checklists/`
- Monitor tracks metrics automatically after first real data
- Refine scraper selectors after first real data cycle

## MCP Servers
- **firecrawl** — scrape competitor gig listings and market research
