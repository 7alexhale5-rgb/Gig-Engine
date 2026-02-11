# PrettyFly Gig Deployment Engine -- Strategy Matrix

> Master reference for all gig listings across platforms. Covers pricing, platform distribution, pillar balance, and deployment priority.

## How to Use This Matrix

**Purpose:** This matrix is the single source of truth for what services PrettyFly deploys, where, and at what price. Use it to:

1. **Deploy gigs in order** -- P1 listings go live in Days 1-14, P2 in Days 15-42, P3 in Days 43-90
2. **Set pricing per platform** -- Fiverr uses productized 3-tier pricing; Upwork uses fixed-price ranges or hourly; Toptal and Arc.dev use hourly rates
3. **Balance the portfolio** -- Every pillar should have 5-6 active listings to avoid over-reliance on any single service type
4. **Track deployment status** -- Update the Status column as listings go from `draft` to `live` to `promoted`
5. **Optimize discovery** -- Keywords column feeds into platform tags, titles, and search optimization

**Pricing Strategy:**
- Fiverr: Productized deliverables with 3 tiers (Basic/Standard/Premium). Start at competitive entry points for review velocity, raise after 10+ reviews.
- Upwork: Fixed-price ranges for scoped projects, hourly for ongoing work. Premium positioning at $95-125/hr.
- Toptal: Enterprise-level hourly rates ($125-175/hr). Only CTO-caliber services.
- Arc.dev: Senior specialist rates ($100-150/hr). AI and automation focus.

**Status Key:** `draft` | `ready` | `live` | `promoted` | `paused`

---

## Main Strategy Matrix

### Pillar 1: Automation & Workflows

| ID | Pillar | Service | Fiverr Pricing | Upwork Pricing | Toptal Rate | Arc.dev Rate | Priority | Status | Keywords |
|----|--------|---------|----------------|----------------|-------------|--------------|----------|--------|----------|
| AW-01 | Automation & Workflows | n8n / Make Workflow Build | $97 / $297 / $797 | $500-2K fixed | $125/hr | $100/hr | P1 | draft | n8n, make, integromat, workflow automation, api integration |
| AW-02 | Automation & Workflows | Business Process Automation Audit | $197 / $497 / $997 | $500-1.5K fixed | $150/hr | - | P1 | draft | automation audit, process improvement, tech stack audit, roi |
| AW-03 | Automation & Workflows | API Integration (Connect 2+ Systems) | $147 / $397 / $797 | $300-1.5K fixed | $125/hr | $100/hr | P1 | draft | api integration, rest api, webhook, data sync, oauth |
| AW-04 | Automation & Workflows | Zapier Advanced Automation | $97 / $247 / $597 | $200-1K fixed | - | - | P2 | draft | zapier, zap, automation, no-code, trigger, multi-step |
| AW-05 | Automation & Workflows | Email & SMS Sequence Automation | $147 / $347 / $697 | $300-1.2K fixed | - | - | P2 | draft | email automation, sms, drip campaign, nurture sequence, mailchimp |
| AW-06 | Automation & Workflows | Data Pipeline & ETL Build | $197 / $497 / $997 | $800-2.5K fixed | $150/hr | $125/hr | P3 | draft | data pipeline, etl, data transformation, sync, database |

### Pillar 2: AI & Chatbots

| ID | Pillar | Service | Fiverr Pricing | Upwork Pricing | Toptal Rate | Arc.dev Rate | Priority | Status | Keywords |
|----|--------|---------|----------------|----------------|-------------|--------------|----------|--------|----------|
| AI-01 | AI & Chatbots | AI Chatbot Implementation | $197 / $497 / $1,297 | $800-3K fixed | $150/hr | $125/hr | P1 | draft | ai chatbot, gpt, claude, llm, knowledge base, rag |
| AI-02 | AI & Chatbots | AI Lead Qualification System | $297 / $697 / $1,497 | $1K-4K fixed | $150/hr | $125/hr | P1 | draft | ai lead scoring, lead qualification, crm, sales automation |
| AI-03 | AI & Chatbots | RAG Pipeline & Knowledge Base | $297 / $697 / $1,497 | $1K-3.5K fixed | $175/hr | $150/hr | P2 | draft | rag, retrieval augmented generation, vector database, embeddings |
| AI-04 | AI & Chatbots | AI-Powered Customer Support Bot | $197 / $497 / $997 | $600-2K fixed | - | $100/hr | P2 | draft | customer support bot, helpdesk ai, ticket routing, auto-reply |
| AI-05 | AI & Chatbots | Custom GPT / AI Assistant Build | $147 / $397 / $897 | $400-1.5K fixed | - | $100/hr | P3 | draft | custom gpt, ai assistant, openai, prompt engineering, fine-tuning |
| AI-06 | AI & Chatbots | AI Document Processing & Extraction | $197 / $497 / $1,197 | $800-2.5K fixed | $150/hr | $125/hr | P3 | draft | document processing, ocr, data extraction, ai parsing, pdf |

### Pillar 3: CRM & GoHighLevel

| ID | Pillar | Service | Fiverr Pricing | Upwork Pricing | Toptal Rate | Arc.dev Rate | Priority | Status | Keywords |
|----|--------|---------|----------------|----------------|-------------|--------------|----------|--------|----------|
| CRM-01 | CRM & GoHighLevel | GoHighLevel Setup & Automation | $197 / $497 / $997 | $500-2.5K fixed | - | - | P1 | draft | gohighlevel, ghl, crm setup, pipeline, lead nurture, sms |
| CRM-02 | CRM & GoHighLevel | CRM Migration & Setup | $297 / $797 / $1,497 | $800-3K fixed | $125/hr | - | P1 | draft | crm migration, hubspot, salesforce, pipedrive, data migration |
| CRM-03 | CRM & GoHighLevel | GHL Funnel & Landing Page Build | $147 / $347 / $697 | $300-1.2K fixed | - | - | P2 | draft | gohighlevel funnel, landing page, lead capture, conversion |
| CRM-04 | CRM & GoHighLevel | HubSpot / Salesforce Optimization | $247 / $597 / $1,197 | $600-2K fixed | $150/hr | - | P2 | draft | hubspot, salesforce, crm optimization, workflow, reporting |
| CRM-05 | CRM & GoHighLevel | CRM Reporting & Dashboard Setup | $197 / $497 / $897 | $500-1.5K fixed | - | - | P3 | draft | crm reporting, dashboard, analytics, kpi, pipeline metrics |
| CRM-06 | CRM & GoHighLevel | Marketing Automation & Nurture Flows | $197 / $497 / $997 | $500-2K fixed | - | - | P3 | draft | marketing automation, nurture, drip, email sequence, crm workflow |

### Pillar 4: Dashboards & Analytics

| ID | Pillar | Service | Fiverr Pricing | Upwork Pricing | Toptal Rate | Arc.dev Rate | Priority | Status | Keywords |
|----|--------|---------|----------------|----------------|-------------|--------------|----------|--------|----------|
| DA-01 | Dashboards & Analytics | Custom Dashboard Build | $297 / $697 / $1,297 | $800-3K fixed | $150/hr | $125/hr | P1 | draft | dashboard, analytics, react, data visualization, kpi, reporting |
| DA-02 | Dashboards & Analytics | Admin Panel / Back-Office Tool | $397 / $897 / $1,797 | $1K-4K fixed | $150/hr | $125/hr | P2 | draft | admin panel, back office, crud, internal tool, react |
| DA-03 | Dashboards & Analytics | Real-Time Analytics Integration | $197 / $497 / $997 | $600-2K fixed | $125/hr | $100/hr | P2 | draft | real-time analytics, ga4, mixpanel, data pipeline, tracking |
| DA-04 | Dashboards & Analytics | KPI Reporting System Build | $247 / $597 / $1,197 | $700-2.5K fixed | $150/hr | - | P3 | draft | kpi, reporting system, executive dashboard, metrics, bi |
| DA-05 | Dashboards & Analytics | Spreadsheet-to-App Migration | $197 / $497 / $997 | $500-2K fixed | - | $100/hr | P3 | draft | spreadsheet migration, excel to app, google sheets, automation |

### Pillar 5: Web & Landing Pages

| ID | Pillar | Service | Fiverr Pricing | Upwork Pricing | Toptal Rate | Arc.dev Rate | Priority | Status | Keywords |
|----|--------|---------|----------------|----------------|-------------|--------------|----------|--------|----------|
| WL-01 | Web & Landing Pages | Landing Page (High-Conversion) | $147 / $347 / $697 | $400-1.5K fixed | - | - | P1 | draft | landing page, conversion, responsive, seo, lead capture |
| WL-02 | Web & Landing Pages | Client Portal MVP | $497 / $1,297 / $2,497 | $2K-6K fixed | $175/hr | $150/hr | P1 | draft | client portal, mvp, next.js, supabase, authentication, dashboard |
| WL-03 | Web & Landing Pages | SaaS MVP / Web App Build | $497 / $1,497 / $2,997 | $2.5K-8K fixed | $175/hr | $150/hr | P2 | draft | saas, mvp, web app, next.js, full stack, startup |
| WL-04 | Web & Landing Pages | Multi-Page Business Website | $247 / $597 / $1,197 | $600-2K fixed | - | - | P2 | draft | business website, next.js, responsive, seo, corporate |
| WL-05 | Web & Landing Pages | Internal Tool / Operations App | $397 / $997 / $1,997 | $1.5K-5K fixed | $150/hr | $125/hr | P3 | draft | internal tool, operations, workflow app, next.js, supabase |
| WL-06 | Web & Landing Pages | E-Commerce Storefront Setup | $297 / $697 / $1,497 | $800-3K fixed | - | - | P3 | draft | ecommerce, shopify, storefront, online store, payments |

---

## Platform Distribution Summary

| Platform | P1 Listings | P2 Listings | P3 Listings | Total | Revenue Target |
|----------|-------------|-------------|-------------|-------|----------------|
| **Fiverr** | 10 | 10 | 9 | 29 | $5,000-12,000/mo |
| **Upwork** | 10 | 10 | 9 | 29 | $6,000-20,000/mo |
| **Toptal** | 6 | 6 | 4 | 16 | $2,000-8,000/mo |
| **Arc.dev** | 5 | 6 | 5 | 16 | $2,000-8,000/mo |

**Fiverr Strategy:** All 29 services get productized Fiverr listings with 3-tier pricing. Productized deliverables, clear scope per tier, designed for conversion. Lower tiers build review velocity, premium tiers capture high-value buyers.

**Upwork Strategy:** All 29 services are available via Upwork proposals. Fixed-price for scoped work, hourly ($95-125/hr) for ongoing engagements. Specialized profiles in 3 categories: Automation, AI/Data, and Web Development.

**Toptal Strategy:** 16 services positioned at enterprise level. CTO-grade deliverables only. $125-175/hr rate range. Focus on architecture, AI, dashboards, and MVPs -- skip commoditized work (basic landing pages, simple Zapier builds).

**Arc.dev Strategy:** 16 services with AI and automation emphasis. $100-150/hr rate range. Position as senior full-stack specialist with AI expertise.

---

## Pillar Balance Check

| Pillar | Color | P1 | P2 | P3 | Total | Target | Status |
|--------|-------|----|----|-----|-------|--------|--------|
| Automation & Workflows | `#3B82F6` blue | 3 | 2 | 1 | 6 | 5-6 | Balanced |
| AI & Chatbots | `#8B5CF6` purple | 2 | 2 | 2 | 6 | 5-6 | Balanced |
| CRM & GoHighLevel | `#10B981` green | 2 | 2 | 2 | 6 | 5-6 | Balanced |
| Dashboards & Analytics | `#F59E0B` amber | 1 | 2 | 2 | 5 | 5-6 | Balanced |
| Web & Landing Pages | `#EF4444` red | 2 | 2 | 2 | 6 | 5-6 | Balanced |
| **Totals** | | **10** | **10** | **9** | **29** | 25-30 | |

All five pillars fall within the 5-6 listing range. No pillar is over-indexed or under-served.

---

## Deployment Schedule

### Days 1-14: P1 Launch Sprint (10 listings)

| Week | Action | Listings |
|------|--------|----------|
| Day 1-3 | Fiverr profile setup, first 5 gigs live | AW-01, AW-02, AI-01, CRM-01, DA-01 |
| Day 4-7 | Remaining 5 Fiverr gigs + Upwork profile | AW-03, AI-02, CRM-02, WL-01, WL-02 |
| Day 8-10 | Upwork Specialized Profiles (3 categories) | All P1 available for proposals |
| Day 11-14 | Toptal + Arc.dev applications submitted | 6 Toptal-eligible, 5 Arc-eligible |

**Daily cadence during launch:** 7:00-7:45 AM proposal session (5-10 Upwork proposals), then delivery work, evening analytics review.

### Days 15-42: P2 Volume & Optimization (10 listings)

| Week | Action | Listings |
|------|--------|----------|
| Week 3 | Deploy P2 Fiverr gigs (5 listings) | AW-04, AI-03, CRM-03, DA-02, WL-03 |
| Week 4 | Deploy remaining P2 gigs | AW-05, AI-04, CRM-04, DA-03, WL-04 |
| Week 5-6 | Optimize: A/B test titles, adjust pricing based on data | Review metrics, promote top performers |

**Promoted Gigs:** Only promote gigs with >3% conversion rate. Budget: $10-15/day per promoted gig, max 3 promoted simultaneously.

### Days 43-90: P3 Scale & Systematize (9 listings)

| Week | Action | Listings |
|------|--------|----------|
| Week 7-8 | Deploy P3 listings | AW-06, AI-05, AI-06, CRM-05, CRM-06, DA-04, DA-05, WL-05, WL-06 |
| Week 9-10 | Price increases on P1 gigs with 10+ reviews | Raise Basic tier 15-25% |
| Week 11-13 | Retainer conversion push, systematize proposal templates | Convert top clients to monthly retainers |

---

## Revenue Projections by Phase

| Phase | Monthly Revenue | Blended Hourly | Active Listings |
|-------|----------------|----------------|-----------------|
| Days 1-14 | $2,000-4,000 | $60-80/hr | 10 |
| Days 15-42 | $6,000-12,000 | $75-100/hr | 20 |
| Days 43-90 | $15,000-25,000 | $90-125/hr | 29 |

**Retainer conversion target:** By Day 90, 3-5 clients on $500-2,000/mo retainers ($3,000-6,000 recurring).

---

## Cross-Reference: Seed Gig IDs to Matrix IDs

| Matrix ID | Seed Gig # | Service Name |
|-----------|------------|--------------|
| CRM-01 | 1 | GoHighLevel Setup & Automation |
| AW-01 | 2 | n8n / Make Workflow Build |
| AI-01 | 3 | AI Chatbot Implementation |
| CRM-02 | 4 | CRM Migration & Setup |
| DA-01 | 5 | Custom Dashboard Build |
| WL-01 | 6 | Landing Page (High-Conversion) |
| AW-02 | 7 | Business Process Automation Audit |
| AW-03 | 8 | API Integration (Connect 2+ Systems) |
| AI-02 | 9 | AI Lead Qualification System |
| WL-02 | 10 | Client Portal MVP |

---

## Notes

- **Pricing is launch pricing.** Raise 15-25% after accumulating 10+ five-star reviews per listing.
- **Toptal and Arc.dev rates are post-acceptance.** Application timelines are 2-4 weeks. Submit during Day 8-14 of the launch sprint so approval aligns with P2 deployment.
- **Keywords are platform tags.** Fiverr allows 5 tags per listing. Upwork uses skills and search terms. Optimize weekly based on impression data.
- **"Fractional CTO" positioning** is embedded across pillars rather than isolated as a standalone listing. The audit (AW-02), architecture services (DA-02, WL-05), and premium tiers across all pillars communicate CTO-level expertise without a separate consulting-only listing that would be hard to productize on Fiverr.
- **Cross-sell paths:** Every P1 listing should have a natural upsell to a P2 or P3 service. For example: Landing Page (WL-01) upsells to Multi-Page Website (WL-04) or Client Portal (WL-02). Chatbot (AI-01) upsells to RAG Pipeline (AI-03) or Lead Qualification (AI-02).
