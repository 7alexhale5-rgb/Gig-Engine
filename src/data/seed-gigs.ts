export interface SeedGigPricing {
  basic: number
  standard: number
  premium: number
}

export interface SeedGig {
  title: string
  description: string
  /** Pillar name — resolved to pillar_id at seed time */
  pillar_name: string
  /** Primary platform names this gig targets */
  platform_names: string[]
  pricing: SeedGigPricing
  delivery_days: { basic: number; standard: number; premium: number }
  tags: string[]
}

export const SEED_GIGS: SeedGig[] = [
  // -----------------------------------------------------------------------
  // 1. GoHighLevel Setup & Automation
  // -----------------------------------------------------------------------
  {
    title: "GoHighLevel Setup & Automation",
    description:
      "Complete GoHighLevel sub-account setup with custom pipelines, automated workflows, lead nurture sequences, calendar/booking configuration, and third-party integrations. Includes reporting dashboard and team training walkthrough.",
    pillar_name: "CRM & GoHighLevel",
    platform_names: ["Upwork", "Fiverr"],
    pricing: { basic: 197, standard: 497, premium: 997 },
    delivery_days: { basic: 5, standard: 7, premium: 14 },
    tags: [
      "gohighlevel",
      "crm",
      "automation",
      "pipelines",
      "lead-nurture",
      "sms",
      "email",
    ],
  },

  // -----------------------------------------------------------------------
  // 2. n8n / Make Workflow Build
  // -----------------------------------------------------------------------
  {
    title: "n8n / Make Workflow Build",
    description:
      "Custom automation workflow built in n8n or Make (Integromat). Includes trigger configuration, data transformation nodes, API integrations, error handling, and post-delivery documentation with a walkthrough video.",
    pillar_name: "Automation & Workflows",
    platform_names: ["Fiverr", "Upwork"],
    pricing: { basic: 97, standard: 297, premium: 797 },
    delivery_days: { basic: 3, standard: 5, premium: 10 },
    tags: [
      "n8n",
      "make",
      "integromat",
      "automation",
      "workflow",
      "api",
      "integration",
    ],
  },

  // -----------------------------------------------------------------------
  // 3. AI Chatbot Implementation
  // -----------------------------------------------------------------------
  {
    title: "AI Chatbot Implementation",
    description:
      "Custom AI chatbot or virtual assistant powered by GPT-4, Claude, or open-source LLMs. Includes RAG pipeline for your knowledge base, conversation memory, brand-voice tuning, safety guardrails, and deployment to your website or messaging platform.",
    pillar_name: "AI & Chatbots",
    platform_names: ["Fiverr", "Upwork"],
    pricing: { basic: 197, standard: 497, premium: 1297 },
    delivery_days: { basic: 5, standard: 7, premium: 14 },
    tags: [
      "ai",
      "chatbot",
      "openai",
      "claude",
      "rag",
      "llm",
      "assistant",
      "knowledge-base",
    ],
  },

  // -----------------------------------------------------------------------
  // 4. CRM Migration & Setup
  // -----------------------------------------------------------------------
  {
    title: "CRM Migration & Setup",
    description:
      "End-to-end CRM migration including data audit, field mapping, data cleaning, staged contact/deal migration, automation rebuild, parallel-run testing, and team training. Supports HubSpot, Salesforce, Pipedrive, Zoho to GoHighLevel or any target CRM.",
    pillar_name: "CRM & GoHighLevel",
    platform_names: ["Upwork"],
    pricing: { basic: 297, standard: 797, premium: 1497 },
    delivery_days: { basic: 7, standard: 10, premium: 21 },
    tags: [
      "crm",
      "migration",
      "gohighlevel",
      "hubspot",
      "salesforce",
      "data-migration",
    ],
  },

  // -----------------------------------------------------------------------
  // 5. Custom Dashboard Build
  // -----------------------------------------------------------------------
  {
    title: "Custom Dashboard Build",
    description:
      "Bespoke analytics dashboard with real-time data connections, interactive charts, KPI tracking, date-range filtering, mobile-responsive layout, and PDF export. Built with Next.js, React, and Recharts/Tremor for maximum performance.",
    pillar_name: "Dashboards & Analytics",
    platform_names: ["Upwork", "Fiverr"],
    pricing: { basic: 297, standard: 697, premium: 1297 },
    delivery_days: { basic: 7, standard: 10, premium: 14 },
    tags: [
      "dashboard",
      "analytics",
      "react",
      "next.js",
      "data-visualization",
      "kpi",
      "reporting",
    ],
  },

  // -----------------------------------------------------------------------
  // 6. Landing Page
  // -----------------------------------------------------------------------
  {
    title: "Landing Page",
    description:
      "High-converting landing page built with Next.js and Tailwind CSS. Includes custom responsive design, performance optimisation (90+ Lighthouse), CTA strategy, lead-capture form integration, and analytics setup (GA4, Meta Pixel).",
    pillar_name: "Web & Landing Pages",
    platform_names: ["Fiverr"],
    pricing: { basic: 147, standard: 347, premium: 697 },
    delivery_days: { basic: 3, standard: 5, premium: 7 },
    tags: [
      "landing-page",
      "next.js",
      "tailwind",
      "conversion",
      "responsive",
      "seo",
    ],
  },

  // -----------------------------------------------------------------------
  // 7. Business Process Automation Audit
  // -----------------------------------------------------------------------
  {
    title: "Business Process Automation Audit",
    description:
      "Comprehensive audit of your current tech stack and business processes. Deliverables include a current-state systems map, gap analysis, prioritised automation recommendations with ROI estimates, tool consolidation suggestions, and an automation opportunity scorecard.",
    pillar_name: "Automation & Workflows",
    platform_names: ["Upwork"],
    pricing: { basic: 197, standard: 497, premium: 997 },
    delivery_days: { basic: 5, standard: 7, premium: 10 },
    tags: [
      "audit",
      "automation",
      "consulting",
      "process-improvement",
      "tech-stack",
      "roi",
    ],
  },

  // -----------------------------------------------------------------------
  // 8. API Integration
  // -----------------------------------------------------------------------
  {
    title: "API Integration",
    description:
      "Custom API integration between two or more services. Includes endpoint mapping, authentication setup (OAuth, API keys), data transformation, error handling, retry logic, rate-limit management, and integration documentation.",
    pillar_name: "Automation & Workflows",
    platform_names: ["Upwork", "Fiverr"],
    pricing: { basic: 147, standard: 397, premium: 797 },
    delivery_days: { basic: 3, standard: 5, premium: 10 },
    tags: [
      "api",
      "integration",
      "rest",
      "webhook",
      "oauth",
      "data-sync",
    ],
  },

  // -----------------------------------------------------------------------
  // 9. AI Lead Qualification System
  // -----------------------------------------------------------------------
  {
    title: "AI Lead Qualification System",
    description:
      "Intelligent lead-scoring and qualification system powered by AI. Automatically analyses incoming leads against your ideal customer profile, assigns scores, routes high-priority leads to sales, and nurtures the rest with personalised sequences. Integrates with your CRM and communication tools.",
    pillar_name: "AI & Chatbots",
    platform_names: ["Upwork", "Fiverr"],
    pricing: { basic: 297, standard: 697, premium: 1497 },
    delivery_days: { basic: 7, standard: 10, premium: 14 },
    tags: [
      "ai",
      "lead-qualification",
      "lead-scoring",
      "automation",
      "crm",
      "sales",
    ],
  },

  // -----------------------------------------------------------------------
  // 10. Client Portal MVP
  // -----------------------------------------------------------------------
  {
    title: "Client Portal MVP",
    description:
      "Minimum viable client portal with secure authentication, project status dashboard, file sharing, messaging/comments, invoice history, and notification system. Built with Next.js, Supabase, and Tailwind CSS for rapid deployment and easy iteration.",
    pillar_name: "Web & Landing Pages",
    platform_names: ["Upwork", "Fiverr"],
    pricing: { basic: 497, standard: 1297, premium: 2497 },
    delivery_days: { basic: 10, standard: 14, premium: 21 },
    tags: [
      "portal",
      "client-portal",
      "next.js",
      "supabase",
      "authentication",
      "dashboard",
      "mvp",
    ],
  },
]
