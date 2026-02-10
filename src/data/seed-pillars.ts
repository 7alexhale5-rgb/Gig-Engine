export interface SeedPillar {
  name: string
  description: string
  color: string
  sort_order: number
}

export const SEED_PILLARS: SeedPillar[] = [
  {
    name: "Automation & Workflows",
    description:
      "n8n, Make, and Zapier workflow builds. Business-process automation, data pipelines, and system integrations that eliminate manual tasks.",
    color: "#3B82F6",
    sort_order: 1,
  },
  {
    name: "AI & Chatbots",
    description:
      "Custom AI assistants, chatbot implementations, RAG pipelines, and intelligent automation using OpenAI, Anthropic, and open-source LLMs.",
    color: "#8B5CF6",
    sort_order: 2,
  },
  {
    name: "CRM & GoHighLevel",
    description:
      "GoHighLevel setup, CRM migrations, marketing-automation funnels, and client-management system builds for agencies and small businesses.",
    color: "#10B981",
    sort_order: 3,
  },
  {
    name: "Dashboards & Analytics",
    description:
      "Custom reporting dashboards, data visualization, KPI tracking systems, and analytics integrations using modern web frameworks.",
    color: "#F59E0B",
    sort_order: 4,
  },
  {
    name: "Web & Landing Pages",
    description:
      "High-converting landing pages, business websites, client portals, and web application MVPs built with Next.js and modern tooling.",
    color: "#EF4444",
    sort_order: 5,
  },
]
