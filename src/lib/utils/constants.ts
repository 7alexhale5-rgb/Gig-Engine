import type { OpportunityStage, GigStatus, ProjectStatus, PlatformStatus, ContractType, RevenueEntryType } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Opportunity stages
// ---------------------------------------------------------------------------

export const OPPORTUNITY_STAGES: OpportunityStage[] = [
  "discovered",
  "proposal_sent",
  "interview",
  "contracted",
  "in_progress",
  "delivered",
  "review_requested",
  "complete",
  "lost",
]

export const STAGE_LABELS: Record<OpportunityStage, string> = {
  discovered: "Discovered",
  proposal_sent: "Proposal Sent",
  interview: "Interview",
  contracted: "Contracted",
  in_progress: "In Progress",
  delivered: "Delivered",
  review_requested: "Review Requested",
  complete: "Complete",
  lost: "Lost",
}

export const STAGE_COLORS: Record<OpportunityStage, string> = {
  discovered: "bg-slate-400",
  proposal_sent: "bg-blue-400",
  interview: "bg-indigo-400",
  contracted: "bg-purple-500",
  in_progress: "bg-amber-500",
  delivered: "bg-teal-500",
  review_requested: "bg-cyan-500",
  complete: "bg-emerald-500",
  lost: "bg-red-400",
}

// ---------------------------------------------------------------------------
// Gig statuses
// ---------------------------------------------------------------------------

export const GIG_STATUSES: GigStatus[] = ["draft", "active", "paused", "archived"]

// ---------------------------------------------------------------------------
// Project statuses
// ---------------------------------------------------------------------------

export const PROJECT_STATUSES: ProjectStatus[] = [
  "active",
  "paused",
  "completed",
  "cancelled",
]

// ---------------------------------------------------------------------------
// Platform statuses
// ---------------------------------------------------------------------------

export const PLATFORM_STATUSES: PlatformStatus[] = [
  "setup_needed",
  "application_pending",
  "active",
  "paused",
  "planned",
]

// ---------------------------------------------------------------------------
// Contract types
// ---------------------------------------------------------------------------

export const CONTRACT_TYPES: ContractType[] = ["fixed", "hourly"]

// ---------------------------------------------------------------------------
// Revenue entry types
// ---------------------------------------------------------------------------

export const REVENUE_ENTRY_TYPES: RevenueEntryType[] = [
  "gig_payment",
  "retainer",
  "bonus",
  "tip",
]

// ---------------------------------------------------------------------------
// Service pillars
// ---------------------------------------------------------------------------

export interface ServicePillarDefinition {
  name: string
  color: string
  description: string
}

export const SERVICE_PILLARS: ServicePillarDefinition[] = [
  {
    name: "Automation & Workflows",
    color: "#3B82F6",
    description:
      "n8n, Make, and Zapier workflow builds. Business-process automation, data pipelines, and system integrations that eliminate manual tasks.",
  },
  {
    name: "AI Implementation",
    color: "#8B5CF6",
    description:
      "Custom AI assistants, chatbot implementations, RAG pipelines, and intelligent automation using OpenAI, Anthropic, and open-source LLMs.",
  },
  {
    name: "System Architecture",
    color: "#10B981",
    description:
      "CRM setup, GoHighLevel migrations, technical audits, system design, and infrastructure planning for agencies and small businesses.",
  },
  {
    name: "Web App Development",
    color: "#F59E0B",
    description:
      "Custom reporting dashboards, landing pages, client portals, and web application MVPs built with Next.js and modern tooling.",
  },
  {
    name: "Strategy & Consulting",
    color: "#EF4444",
    description:
      "Process mapping, fractional CTO advisory, digital strategy, architecture reviews, and technical consulting services.",
  },
]

export const PILLAR_COLORS: Record<string, string> = SERVICE_PILLARS.reduce(
  (acc, pillar) => {
    acc[pillar.name] = pillar.color
    return acc
  },
  {} as Record<string, string>
)
