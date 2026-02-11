# Upwork Posting & Proposal Checklist

> Step-by-step guide to set up Upwork presence and run daily proposal workflow.
> Generated content lives in: `listings/upwork/{GIG-ID}-{service-slug}.md`
> Proposal templates: `docs/PROPOSAL-TEMPLATES.md`

---

## Part 1: Profile Setup

### Pre-Setup Requirements

- [ ] Upwork freelancer account is active and approved
- [ ] Government ID verification is complete
- [ ] Payment method is connected
- [ ] You have the generated Upwork content files open (from `listings/upwork/`)
- [ ] Profile photo is professional (headshot, clean background, good lighting)

### Main Profile

- [ ] **Professional Title** -- paste headline from generated content (70 chars max, keyword-dense)
  - Good: "CTO & Automation Architect | n8n, GHL, AI Systems, CRM Migrations"
  - Bad: "Experienced Developer Available for Work"
- [ ] **Overview** -- paste from generated content
  - First 250 characters are critical (shown in search results before "more" link)
  - Lead with your strongest differentiator and a concrete result
  - Include primary keywords naturally (Fiverr/Upwork search picks these up)
  - End with a clear CTA
- [ ] **Hourly Rate** -- set per generated content ($95-125 range per `docs/PLATFORM-GUIDES.md`)
- [ ] **Skills** -- add all relevant skills from generated content (Upwork allows up to 15)
  - Prioritize skills that match high-volume job postings
  - Include both specific tools (n8n, GoHighLevel) and general skills (API Integration)
- [ ] **Employment History** -- add CTO / Founder roles with descriptions
- [ ] **Education** -- add relevant entries
- [ ] **Certifications** -- add any relevant platform certifications
- [ ] **Languages** -- English (Native or Bilingual)
- [ ] **Enable Availability Badge** -- shows you're actively looking for work

### Specialized Profiles (Create 2-3)

Specialized Profiles let you appear in different search categories simultaneously. Create one for each primary service pillar:

**Profile 1: Automation & Workflows**
- [ ] Title: paste from generated content (e.g., "Automation Architect | n8n, Make, Zapier, GHL Workflows")
- [ ] Overview: tailored to automation buyers (paste from generated file)
- [ ] Skills: n8n, Make/Integromat, Zapier, GoHighLevel, API Integration, Workflow Automation
- [ ] Portfolio: 2-3 automation case studies

**Profile 2: AI Implementation**
- [ ] Title: paste from generated content (e.g., "AI Systems Engineer | Chatbots, RAG, Custom Assistants")
- [ ] Overview: tailored to AI buyers (paste from generated file)
- [ ] Skills: AI/ML, ChatGPT API, Claude API, Python, RAG Systems, NLP
- [ ] Portfolio: 2-3 AI project case studies

**Profile 3: System Architecture & CRM** (optional, if bandwidth allows)
- [ ] Title: paste from generated content (e.g., "Fractional CTO | CRM Migrations, Tech Audits, System Design")
- [ ] Overview: tailored to enterprise buyers
- [ ] Skills: CRM, System Architecture, Data Migration, Technical Consulting
- [ ] Portfolio: 2-3 architecture/migration case studies

### Portfolio Items

For each portfolio entry, follow the case study format:

- [ ] **Title** -- project name or client type + deliverable
- [ ] **Description** -- Problem > Solution > Result structure
- [ ] **Images** -- 2-3 screenshots (dashboard views, architecture diagrams, before/after)
- [ ] **Metrics** -- quantifiable outcomes (e.g., "Reduced manual data entry by 85%")
- [ ] Add at least 5 portfolio items total across all profiles

### Profile Completion Check

- [ ] Profile strength indicator shows "100%" or "All Star" (Upwork ranks complete profiles higher)
- [ ] All sections filled -- no empty fields
- [ ] Update `tracker.md` with Upwork profile URL and setup date

---

## Part 2: Saved Searches Setup

Create one saved search per service pillar to streamline the morning proposal workflow:

- [ ] **Search 1: Automation** -- keywords: "n8n" OR "make.com" OR "zapier" OR "workflow automation" OR "GoHighLevel"
- [ ] **Search 2: AI/Chatbot** -- keywords: "AI chatbot" OR "ChatGPT integration" OR "AI assistant" OR "RAG"
- [ ] **Search 3: CRM/Migration** -- keywords: "CRM migration" OR "CRM setup" OR "data migration" OR "system integration"
- [ ] **Search 4: Dashboard/Web App** -- keywords: "custom dashboard" OR "admin panel" OR "Next.js" OR "React dashboard"
- [ ] **Search 5: Consulting/Audit** -- keywords: "fractional CTO" OR "tech audit" OR "process automation audit"

For each saved search:
- [ ] Set **Experience Level** filter to "Intermediate" and "Expert"
- [ ] Set **Client Budget** filter to $500+ (skip micro-gigs)
- [ ] Set **Client History** to "1+ hires" (verified buyers)
- [ ] Enable email notifications for new matches

---

## Part 3: Daily Proposal Workflow

> Target: 5-10 proposals per morning session, 7:00-7:45 AM

### Morning Routine (7:00 AM)

**Step 1: Open and Scan (5 minutes)**
- [ ] Open [upwork.com/nx/find-work/best-matches](https://www.upwork.com/nx/find-work/best-matches)
- [ ] Review "Best Matches" tab first (Upwork's algorithm picks for your profile)
- [ ] Open each saved search in separate tabs
- [ ] Quickly scan new postings since yesterday -- look for:
  - Budget $500+
  - Clear project description (not vague)
  - Client has payment method verified
  - Client has hired before (check hire rate)
  - Posted within last 24 hours (freshness matters)
  - Fewer than 15 proposals already submitted

**Step 2: Qualify and Prioritize (5 minutes)**
- [ ] Star/bookmark 5-10 best matches
- [ ] Prioritize by:
  1. Jobs posted < 1 hour ago (highest win rate)
  2. Jobs with < 5 proposals submitted
  3. Budget $1K+ with clear requirements
  4. Client with 4.5+ rating and 80%+ hire rate
- [ ] Skip: vague postings, $0 budget, first-time clients with no verification, jobs with 50+ proposals

**Step 3: Generate and Submit Proposals (30-35 minutes)**

For each qualified job:

- [ ] Read the full job description carefully
- [ ] Identify which proposal template fits (from `docs/PROPOSAL-TEMPLATES.md`)
- [ ] Run the proposal-generator agent: provide the job description + template selection
  - Input: job posting text + template ID
  - Output: customized proposal under 200 words
- [ ] Review and customize the generated proposal:
  - [ ] Hook references something specific from their posting (proves you read it)
  - [ ] Credibility line includes a concrete metric or result
  - [ ] Approach bullets are tailored to their stated requirements
  - [ ] Differentiator is relevant to their industry/use case
  - [ ] CTA includes a specific next step and timeline
- [ ] Set your bid:
  - Hourly jobs: use your profile rate ($95-125/hr) unless the job warrants adjustment
  - Fixed-price jobs: calculate based on estimated hours at your rate
  - For $1K+ jobs: consider using a Boosted proposal (2x Connects)
- [ ] Submit the proposal
- [ ] Log in `tracker.md`:
  - Job title
  - Client name (or identifier)
  - Platform: Upwork
  - Proposal date
  - Bid amount
  - Status: `submitted`
  - Connects used

**Step 4: Wrap Up (5 minutes)**
- [ ] Review Connects balance -- plan weekly Connects budget
- [ ] Check for any interview invitations on previously submitted proposals
- [ ] Respond to any client messages (within 2 hours for algorithm ranking)

### Connects Strategy

| Action | Connects Cost |
|--------|--------------|
| Standard proposal | 2-6 Connects (varies by job) |
| Boosted proposal (featured) | 2x standard cost |
| Monthly allocation (paid plan) | 80 Connects/month |
| Purchase additional | $0.15 per Connect |

- [ ] Target: spend 40-60 Connects per week
- [ ] Boost only on jobs with $1K+ budget and < 10 existing proposals
- [ ] If Connects run low, prioritize higher-budget jobs only

---

## Part 4: Post-Submission Workflow

### When Invited to Interview

- [ ] Respond within 2 hours (Upwork tracks response time -- affects ranking)
- [ ] Review their project details again before responding
- [ ] Propose a call time (use Calendly or suggest 2-3 time slots)
- [ ] Prepare talking points:
  - [ ] Restate their core problem
  - [ ] Your relevant experience (1-2 specific examples)
  - [ ] High-level approach and timeline
  - [ ] Pricing confirmation
  - [ ] Questions for them (shows engagement)

### When You Win a Contract

- [ ] Update `tracker.md` status to `contracted`
- [ ] Set up project milestones in Upwork (for fixed-price)
- [ ] Send introductory message with:
  - Confirmed scope and timeline
  - What you need from them to start
  - Communication preferences (Upwork messages vs. calls)
- [ ] Begin delivery tracking in your projects system

### Weekly Review (Sunday Evening)

- [ ] Review all proposals from the week in `tracker.md`
- [ ] Calculate: proposals sent / responses / interviews / wins
- [ ] Identify which templates and pillars have the best response rate
- [ ] Adjust saved searches if certain keywords aren't producing quality matches
- [ ] Update proposal templates based on what's working

---

## Top Rated Path

Track your progression toward Top Rated status (highest visibility):

| Milestone | Requirements | Timeline |
|-----------|-------------|----------|
| Profile approved | Complete profile, pass screening | Day 1 |
| First contract | Win and complete a job | Week 1-2 |
| Rising Talent | 90%+ JSS, active for 90 days | Week 4-8 |
| Top Rated | $1K+ earned, 90%+ JSS, 12+ months, no major flags | Month 3-4 |
| Top Rated Plus | $10K+ earned, sustained high performance | Month 6+ |

Key metrics that affect Job Success Score (JSS):
- Client feedback (5-star ratings)
- Long-term client relationships
- No contract cancellations or refunds
- Responsive communication

---

## Common Gotchas

1. **Applying too late** -- Jobs with 20+ proposals already have diminished returns. Focus on postings under 1 hour old with fewer than 15 proposals. Set saved search notifications to catch them early.

2. **Generic proposals** -- "I read your job description and I'm a perfect fit" is an instant skip. The hook must reference a specific detail from their posting. If you can't find a specific detail to reference, the posting is probably too vague to pursue.

3. **Overwriting your rate** -- Bidding $25/hr on a $100/hr profile looks desperate and confuses clients. Stay within 20% of your profile rate. It's better to skip cheap jobs than to undercut yourself.

4. **Ignoring client history** -- Check the client's hire rate, previous reviews, and spending history. A client who has posted 10 jobs and hired 0 times is wasting your Connects.

5. **Forgetting to respond quickly** -- Upwork's algorithm tracks your response time. Responding to messages/invitations within 2 hours is not optional -- it directly affects your ranking in search results.

6. **Connects drain** -- At 5-10 proposals per day, you'll burn through Connects fast. The Freelancer Plus plan ($14.99/month for 80 Connects) is essential. Budget an additional $15-30/month for purchased Connects during ramp-up.

7. **Profile switching confusion** -- When you submit a proposal, make sure the correct Specialized Profile is selected. Submitting an AI chatbot proposal from your CRM Migration profile sends mixed signals.

8. **Proposal too long** -- Keep it under 200 words. Clients skim proposals. Your full qualifications are in your profile -- the proposal just needs to get them to click through. The HOOK-CREDIBILITY-APPROACH-DIFFERENTIATOR-CTA framework enforces this discipline.

9. **Not tracking submissions** -- If it's not in `tracker.md`, you can't calculate win rates, identify which templates work, or understand your ROI per Connect spent. Log every submission immediately.

10. **Skipping the weekly review** -- Without reviewing metrics weekly, you'll keep repeating ineffective strategies. Sunday evening review takes 15 minutes and directly improves the following week's conversion.
