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
    name: "AI Implementation",
    description:
      "Custom AI assistants, chatbot implementations, RAG pipelines, and intelligent automation using OpenAI, Anthropic, and open-source LLMs.",
    color: "#8B5CF6",
    sort_order: 2,
  },
  {
    name: "System Architecture",
    description:
      "CRM setup, GoHighLevel migrations, technical audits, system design, and infrastructure planning for agencies and small businesses.",
    color: "#10B981",
    sort_order: 3,
  },
  {
    name: "Web App Development",
    description:
      "Custom reporting dashboards, landing pages, client portals, and web application MVPs built with Next.js and modern tooling.",
    color: "#F59E0B",
    sort_order: 4,
  },
  {
    name: "Strategy & Consulting",
    description:
      "Process mapping, fractional CTO advisory, digital strategy, architecture reviews, and technical consulting services.",
    color: "#EF4444",
    sort_order: 5,
  },
]
