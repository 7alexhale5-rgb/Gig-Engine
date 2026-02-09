import type { PlatformStatus } from "@/lib/supabase/types"

export interface SeedPlatform {
  name: string
  profile_url: string
  profile_status: PlatformStatus
  headline: string
  overview_text: string
  hourly_rate: number | null
  skills_tags: string[]
}

export const SEED_PLATFORMS: SeedPlatform[] = [
  {
    name: "Upwork",
    profile_url: "",
    profile_status: "setup_needed",
    headline:
      "Automation & AI Expert | GoHighLevel, n8n, Make | Custom Dashboards & Integrations",
    overview_text:
      "I build automation workflows, AI-powered tools, and custom dashboards that save businesses hours every week. Specializing in GoHighLevel, n8n, Make, and modern web technologies.",
    hourly_rate: 75,
    skills_tags: [
      "n8n",
      "Make",
      "GoHighLevel",
      "AI Chatbots",
      "API Integration",
      "Next.js",
      "Supabase",
      "Dashboard Development",
    ],
  },
  {
    name: "Fiverr",
    profile_url: "",
    profile_status: "setup_needed",
    headline:
      "I will build automation workflows, AI chatbots, and custom dashboards",
    overview_text:
      "Full-stack automation specialist delivering turnkey workflow automations, AI chatbot implementations, and custom business dashboards. Fast delivery, clear communication, and production-ready results.",
    hourly_rate: null,
    skills_tags: [
      "n8n",
      "Make",
      "AI Chatbot",
      "GoHighLevel",
      "Landing Pages",
      "Dashboard",
    ],
  },
  {
    name: "Toptal",
    profile_url: "",
    profile_status: "application_pending",
    headline:
      "Senior Automation Engineer & Full-Stack Developer",
    overview_text:
      "Experienced engineer specializing in business-process automation, AI integrations, and custom web applications. Background in enterprise CRM systems, workflow orchestration, and data-driven dashboard development.",
    hourly_rate: 120,
    skills_tags: [
      "Automation",
      "AI/ML",
      "Node.js",
      "TypeScript",
      "React",
      "Next.js",
      "PostgreSQL",
      "API Design",
    ],
  },
  {
    name: "Arc.dev",
    profile_url: "",
    profile_status: "setup_needed",
    headline: "Full-Stack Developer | Automation & AI Specialist",
    overview_text:
      "Building intelligent automation systems and modern web applications. Deep expertise in workflow orchestration (n8n, Make), CRM platforms (GoHighLevel), and AI-powered business tools.",
    hourly_rate: 90,
    skills_tags: [
      "TypeScript",
      "React",
      "Next.js",
      "n8n",
      "AI Integration",
      "PostgreSQL",
    ],
  },
  {
    name: "PeoplePerHour",
    profile_url: "",
    profile_status: "planned",
    headline:
      "Automation Expert | AI Chatbots | Custom Business Dashboards",
    overview_text:
      "I help businesses automate repetitive tasks, implement AI-powered customer-facing tools, and build custom dashboards for real-time visibility into their operations.",
    hourly_rate: 65,
    skills_tags: [
      "Automation",
      "AI Chatbots",
      "Dashboards",
      "GoHighLevel",
      "Web Development",
    ],
  },
  {
    name: "Guru",
    profile_url: "",
    profile_status: "planned",
    headline: "Business Automation & AI Integration Specialist",
    overview_text:
      "Delivering end-to-end automation solutions, from workflow design through implementation. Expertise in n8n, Make, GoHighLevel, and custom AI assistant development.",
    hourly_rate: 70,
    skills_tags: [
      "n8n",
      "Make",
      "GoHighLevel",
      "AI Assistants",
      "Web Apps",
      "API Integration",
    ],
  },
  {
    name: "LinkedIn Services",
    profile_url: "",
    profile_status: "planned",
    headline:
      "Helping SMBs automate operations with AI, n8n, and GoHighLevel",
    overview_text:
      "I partner with small-to-medium businesses to design and implement automation strategies that reduce manual work, improve lead management, and unlock actionable insights through custom dashboards.",
    hourly_rate: 85,
    skills_tags: [
      "Business Automation",
      "CRM",
      "GoHighLevel",
      "AI Strategy",
      "Process Optimization",
    ],
  },
  {
    name: "Direct/Referral",
    profile_url: "",
    profile_status: "active",
    headline: "",
    overview_text:
      "Direct clients and referrals. No platform fees, full control over pricing and relationship management.",
    hourly_rate: 100,
    skills_tags: [],
  },
]
