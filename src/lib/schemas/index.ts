/**
 * Barrel export for all Zod validation schemas.
 *
 * Usage:
 *   import { opportunitySchema, type OpportunityFormData } from "@/lib/schemas"
 *   import { gigSchemaRefined, type GigFormDataRefined } from "@/lib/schemas"
 */

// Opportunity pipeline
export {
  opportunitySchema,
  opportunitySchemaRefined,
  type OpportunityFormData,
  type OpportunityFormDataRefined,
} from "./opportunity"

// Gig listings
export {
  gigSchema,
  gigSchemaRefined,
  type GigFormData,
  type GigFormDataRefined,
} from "./gig"

// Revenue entries
export {
  revenueSchema,
  revenueSchemaRefined,
  type RevenueFormData,
  type RevenueFormDataRefined,
} from "./revenue"

// Proposal templates
export {
  proposalTemplateSchema,
  type ProposalTemplateFormData,
} from "./proposal-template"

// Projects
export {
  projectSchema,
  projectSchemaRefined,
  milestoneSchema,
  checklistItemSchema,
  type ProjectFormData,
  type ProjectFormDataRefined,
  type MilestoneFormData,
  type ChecklistItemFormData,
} from "./project"

// Content blocks
export {
  contentBlockSchema,
  type ContentBlockFormData,
} from "./content-block"

// Daily metrics
export {
  dailyMetricsSchema,
  dailyMetricsSchemaRefined,
  type DailyMetricsFormData,
  type DailyMetricsFormDataRefined,
} from "./daily-metrics"

// Platform settings
export {
  platformSchema,
  type PlatformFormData,
} from "./platform"
