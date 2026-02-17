# Gig-Engine

## What This Is

A freelancer service directory platform that lets gig workers import their listings from Fiverr, Upwork, and other platforms, then showcase them as a polished public catalog with built-in payments and analytics. Built for Alex's own freelance ops first, designed to be a marketable SaaS product that other freelancers can use.

## Core Value

Freelancers can instantly create a professional service catalog from their existing platform listings and start accepting payments — no manual data entry, no building a website from scratch.

## Requirements

### Validated

- ✓ 62 markdown service listings (31 Fiverr + 31 Upwork) across 5 service pillars — existing
- ✓ Service catalog UI displaying listings grouped by pillar with stats and pricing tiers — existing
- ✓ Gig thumbnail image generation (1280x769 PNG via Satori + resvg-js) — existing
- ✓ Vercel deployment with GitHub auto-deploy from main branch — existing
- ✓ Daily automated Fiverr/Upwork dashboard scraping via Playwright — existing
- ✓ AI-synthesized morning reports delivered via Telegram (Haiku 4.5) — existing
- ✓ Posting helper script for clipboard-ready formatted listing content — existing
- ✓ Upwork proposal generator with keyword matching — existing
- ✓ Weekly performance summary via Telegram — existing

### Active

- [ ] Import gigs from Fiverr/Upwork URLs (auto-scrape listing title, description, pricing, images)
- [ ] Multi-tenant architecture (each freelancer gets their own catalog)
- [ ] Public catalog page per user (shareable Linktree-style service directory)
- [ ] Embeddable widget that freelancers can add to their own website
- [ ] Stripe Checkout for fixed-price service purchases
- [ ] Inquiry form for custom/hourly service requests
- [ ] Analytics dashboard (views, clicks, conversions, revenue)
- [ ] User authentication and account management

### Out of Scope

- Reviews/ratings system — complexity, need real usage data first (v2)
- Client history/CRM features — not core to catalog value prop (v2)
- Platform auto-sync (real-time listing updates from Fiverr/Upwork) — API limitations, fragile (v2)
- Revenue model/pricing tiers — figure it out after proving product-market fit
- Mobile native app — web-first, responsive design sufficient
- Real-time chat/messaging — not core, standard contact forms sufficient
- Multi-currency support — USD only for v1

## Context

- Brownfield project: existing codebase has a working service catalog UI, automation scripts, and Vercel deployment
- The Next.js app (`src/`) has dual-layer legacy: active static catalog page + inactive Supabase-backed dashboard components
- Supabase is installed but not actively used — database schema exists but frontend queries are disconnected
- Automation scripts (`scripts/`) are the most mature part: daily scraping, AI reports, Telegram delivery
- Current catalog is Alex-specific; multi-tenant requires auth, user isolation, and tenant-scoped data
- Target users: freelancers on Fiverr, Upwork, Toptal who want a professional presence beyond platform profiles
- Existing service pillars: AI Workflows, Automation & Workflows, Content & Marketing, Data Solutions, Technical Solutions

## Constraints

- **Tech stack**: Next.js 14 + React 18 + Tailwind CSS + Supabase (already installed, reactivate for multi-tenant)
- **Deployment**: Vercel (already configured, free tier for now)
- **Payments**: Stripe (Checkout for fixed-price, custom flow for inquiries)
- **Budget**: Minimize external service costs — leverage Supabase free tier, Vercel free tier
- **Scraping**: Fiverr/Upwork URL import must handle anti-bot measures (existing Playwright + stealth plugin)
- **Backwards compatibility**: Existing automation scripts (morning report, weekly summary) must keep working

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Import from URLs, not API | Fiverr/Upwork don't offer public listing APIs; scraping is the only viable path | — Pending |
| Both public page AND embeddable widget | Maximizes distribution — freelancers share link OR embed on portfolio site | — Pending |
| Stripe for fixed-price, inquiry form for custom | Different service types need different booking flows | — Pending |
| Multi-tenant from the start | Building for personal use alone doesn't justify the effort; SaaS potential is the motivator | — Pending |
| Reactivate Supabase (not new backend) | Already installed with schema scaffolding; avoid adding new dependencies | — Pending |
| Catalog + payments + analytics for v1 | Ship the core loop first: list services → accept payments → track performance | — Pending |

---
*Last updated: 2026-02-17 after initialization*
