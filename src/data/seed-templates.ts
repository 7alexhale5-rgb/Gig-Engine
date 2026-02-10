export interface SeedTemplate {
  name: string
  /** Pillar name — resolved to pillar_id at seed time */
  pillar_name: string
  /** Platform names — first entry used as primary platform_id at seed time */
  platform_names: string[]
  template_text: string
  variables: string[]
  tags: string[]
}

export const SEED_TEMPLATES: SeedTemplate[] = [
  // -----------------------------------------------------------------------
  // 1. GHL Automation (Upwork)
  // -----------------------------------------------------------------------
  {
    name: "GHL Automation",
    pillar_name: "CRM & GoHighLevel",
    platform_names: ["Upwork"],
    template_text: `Hi {{client_name}},

I read through your project description and it's clear you need someone who understands GoHighLevel inside and out — not just the surface-level setup, but the automations, pipelines, and integrations that actually drive results.

Here's what I'd deliver:

1. **Full GHL Sub-Account Setup** — custom pipelines, automation workflows, and calendar/booking configuration tailored to your business model.
2. **Lead Nurture Sequences** — automated email + SMS follow-up sequences so no lead falls through the cracks.
3. **Third-Party Integrations** — connect GHL to your existing tools (Stripe, Calendly, Slack, Zapier/n8n) so everything talks to each other.
4. **Reporting Dashboard** — a clear view of pipeline health, conversion rates, and revenue attribution.

I've helped {{experience_note}} set up and optimise GHL for lead gen, client onboarding, and retention workflows. I build systems that are maintainable — not "set it and pray."

Happy to hop on a quick call to scope this out properly. Looking forward to hearing from you.

Best,
{{sender_name}}`,
    variables: ["client_name", "experience_note", "sender_name"],
    tags: ["gohighlevel", "crm", "automation", "upwork"],
  },

  // -----------------------------------------------------------------------
  // 2. n8n / Automation Workflow (Fiverr + Upwork)
  // -----------------------------------------------------------------------
  {
    name: "n8n / Automation Workflow",
    pillar_name: "Automation & Workflows",
    platform_names: ["Fiverr", "Upwork"],
    template_text: `Hi {{client_name}},

Your project caught my eye — I specialise in building production-grade automation workflows using n8n and Make (Integromat).

Here's my approach for {{project_summary}}:

**Phase 1 — Discovery & Design**
- Map your current manual process end-to-end.
- Identify automation triggers, data transformations, and error-handling requirements.
- Deliver a visual workflow diagram for your approval before I write a single node.

**Phase 2 — Build & Test**
- Implement the full workflow in n8n (self-hosted or cloud) or Make.
- Integrate with your existing APIs and services ({{integration_list}}).
- Thorough testing with real data to ensure edge-case handling.

**Phase 3 — Handoff & Documentation**
- Walk-through video explaining every node.
- Written documentation so your team can maintain it.
- 7 days of post-delivery support for adjustments.

I've built 50+ automation workflows ranging from simple Slack notifications to multi-step data pipelines processing thousands of records per day. I'd love to do the same for you.

Let me know if you have questions — happy to discuss scope.

{{sender_name}}`,
    variables: [
      "client_name",
      "project_summary",
      "integration_list",
      "sender_name",
    ],
    tags: ["n8n", "make", "automation", "workflow", "integration"],
  },

  // -----------------------------------------------------------------------
  // 3. AI Chatbot / Assistant (Fiverr + Upwork)
  // -----------------------------------------------------------------------
  {
    name: "AI Chatbot / Assistant",
    pillar_name: "AI & Chatbots",
    platform_names: ["Fiverr", "Upwork"],
    template_text: `Hi {{client_name}},

I build custom AI chatbots and assistants that go beyond basic FAQ bots — they understand context, pull from your knowledge base, and genuinely help your users.

For {{project_summary}}, here's what I'm thinking:

**What You'll Get:**
- A custom AI assistant powered by {{llm_provider}} (GPT-4, Claude, or open-source — your choice).
- **RAG Pipeline** — your documents, FAQs, and knowledge base indexed and searchable so the bot gives accurate, sourced answers.
- **Conversation Memory** — the bot remembers context within a session for natural, multi-turn conversations.
- **Tone & Guardrails** — system prompts fine-tuned to your brand voice, with safety guardrails to keep responses on-topic.
- **Integration** — embedded in your website, Slack, WhatsApp, or any platform via API.

**My Process:**
1. Understand your use case and prepare a prompt-engineering brief.
2. Build and iterate on the assistant with your feedback.
3. Deploy with monitoring and a handoff guide.

I've implemented AI assistants for customer support, internal knowledge management, and lead qualification. Happy to share examples.

Looking forward to discussing this further.

{{sender_name}}`,
    variables: [
      "client_name",
      "project_summary",
      "llm_provider",
      "sender_name",
    ],
    tags: ["ai", "chatbot", "rag", "openai", "claude", "assistant"],
  },

  // -----------------------------------------------------------------------
  // 4. CRM Migration (Upwork)
  // -----------------------------------------------------------------------
  {
    name: "CRM Migration",
    pillar_name: "CRM & GoHighLevel",
    platform_names: ["Upwork"],
    template_text: `Hi {{client_name}},

Migrating CRMs is one of those projects that sounds simple but can go sideways fast without proper planning. I've handled migrations from {{source_crm}} to {{target_crm}} before and I know where the landmines are.

**My Migration Process:**

1. **Audit & Mapping** — I'll document every field, automation, tag, and pipeline in your current CRM and create a detailed migration map.
2. **Data Cleaning** — before moving anything, we clean duplicates, fix formatting, and standardise fields. Garbage in, garbage out.
3. **Staged Migration** — contacts, deals, notes, and tags migrated in batches with validation at each step. No "big bang" cutover.
4. **Automation Rebuild** — your existing workflows and automations recreated (and often improved) in the new system.
5. **Testing & Parallel Run** — both systems running side-by-side until you're confident everything works.
6. **Training & Handoff** — video walkthrough + documentation so your team hits the ground running.

I'll also flag any features in {{source_crm}} that don't have a direct equivalent in {{target_crm}} and recommend workarounds.

Want to schedule a quick call to discuss your setup?

{{sender_name}}`,
    variables: [
      "client_name",
      "source_crm",
      "target_crm",
      "sender_name",
    ],
    tags: ["crm", "migration", "data", "gohighlevel", "hubspot", "salesforce"],
  },

  // -----------------------------------------------------------------------
  // 5. Custom Dashboard Build (Upwork + Fiverr)
  // -----------------------------------------------------------------------
  {
    name: "Custom Dashboard Build",
    pillar_name: "Dashboards & Analytics",
    platform_names: ["Upwork", "Fiverr"],
    template_text: `Hi {{client_name}},

I build custom dashboards that turn raw data into clear, actionable insights — no more digging through spreadsheets or switching between five different tools.

For {{project_summary}}, here's what I'd propose:

**Dashboard Features:**
- **Real-Time Data** — live connection to your data sources ({{data_sources}}) with automatic refresh.
- **Key Metrics at a Glance** — the 5-7 KPIs that actually matter for your business, front and centre.
- **Interactive Charts** — filter by date range, team member, product line, or any dimension that's relevant.
- **Mobile-Responsive** — looks great on desktop and phone.
- **Export & Sharing** — PDF exports and shareable links for stakeholders.

**Tech Stack:**
- Next.js + React for a fast, modern frontend.
- Recharts or Tremor for beautiful, performant visualisations.
- Supabase or direct API connections for your data layer.

**Timeline:** Typically 1-2 weeks from kickoff to delivery, depending on data complexity.

I've built dashboards for sales teams, marketing agencies, and SaaS companies. Happy to share relevant examples.

Let's chat about your data and what you need to see.

{{sender_name}}`,
    variables: [
      "client_name",
      "project_summary",
      "data_sources",
      "sender_name",
    ],
    tags: ["dashboard", "analytics", "next.js", "react", "data-visualization"],
  },

  // -----------------------------------------------------------------------
  // 6. Landing Page (Fiverr)
  // -----------------------------------------------------------------------
  {
    name: "Landing Page",
    pillar_name: "Web & Landing Pages",
    platform_names: ["Fiverr"],
    template_text: `Hi {{client_name}},

I'll build you a high-converting landing page that loads fast, looks sharp on every device, and is optimised for the action you want visitors to take.

**What's Included:**

- **Custom Design** — pixel-perfect implementation matching your brand (or I can design from scratch based on your brief).
- **Mobile-First & Responsive** — tested across devices and browsers.
- **Performance Optimised** — targeting 90+ Lighthouse score for speed, accessibility, and SEO.
- **Clear CTA Flow** — strategic placement of calls-to-action based on conversion best practices.
- **Form / Lead Capture** — integrated with your email tool, CRM, or webhook.
- **Analytics Ready** — Google Analytics, Meta Pixel, or any tracking you need.

**Tech:** Next.js + Tailwind CSS for a fast, SEO-friendly, and maintainable result. Alternatively, I can build in your preferred platform.

**Timeline:** {{timeline}} from approved design.

I've built landing pages for SaaS launches, agency lead-gen campaigns, and product launches. Happy to share examples.

Let me know your requirements and I'll put together a detailed scope.

{{sender_name}}`,
    variables: ["client_name", "timeline", "sender_name"],
    tags: ["landing-page", "web", "next.js", "conversion", "design"],
  },

  // -----------------------------------------------------------------------
  // 7. Tech Stack Audit (Upwork)
  // -----------------------------------------------------------------------
  {
    name: "Tech Stack Audit",
    pillar_name: "Automation & Workflows",
    platform_names: ["Upwork"],
    template_text: `Hi {{client_name}},

Before building anything new, it's worth understanding what you already have and where the gaps are. That's exactly what I deliver with a Tech Stack Audit.

**What You'll Receive:**

1. **Current-State Map** — a visual diagram of every tool in your stack and how they connect (or don't).
2. **Gap Analysis** — where data is falling through the cracks, where manual work could be automated, and where you're paying for overlapping tools.
3. **Recommendations Report** — prioritised list of improvements with estimated ROI, grouped into quick wins (< 1 week) and strategic projects (1-3 months).
4. **Automation Opportunity Scorecard** — I'll rate each manual process on effort-to-automate vs. time-saved, so you know exactly where to invest first.
5. **Tool Consolidation Suggestions** — where you can reduce your SaaS spend by replacing or merging tools.

**Process:**
- 30-minute discovery call to understand your business and goals.
- I'll need access (read-only is fine) to your current tools for 2-3 days.
- Deliver the full audit report within {{timeline}}.

This is a great starting point if you know things could be better but aren't sure where to begin.

Happy to discuss — no commitment needed.

{{sender_name}}`,
    variables: ["client_name", "timeline", "sender_name"],
    tags: [
      "audit",
      "tech-stack",
      "consulting",
      "automation",
      "process-improvement",
    ],
  },
]
