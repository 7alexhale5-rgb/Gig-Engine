/**
 * Zod validation schema for the Opportunity form.
 *
 * Covers all fields on the opportunity pipeline — from initial discovery
 * through proposal, contracting, delivery, and review. Optional UUID
 * foreign-key fields accept empty strings so that unselected `<select>`
 * inputs pass validation (coerced to `undefined` before DB insert).
 */

import { z } from "zod"

// ---------------------------------------------------------------------------
// Enum values (kept in sync with OpportunityStage / ContractType in types.ts)
// ---------------------------------------------------------------------------

const OPPORTUNITY_STAGES = [
  "discovered",
  "proposal_sent",
  "interview",
  "contracted",
  "in_progress",
  "delivered",
  "review_requested",
  "complete",
  "lost",
] as const

const CONTRACT_TYPES = ["fixed", "hourly"] as const

// ---------------------------------------------------------------------------
// Reusable field helpers
// ---------------------------------------------------------------------------

/** Accepts a valid UUID or an empty string (for unselected optional selects). */
const optionalUuid = z
  .string()
  .uuid("Must be a valid selection")
  .optional()
  .or(z.literal(""))

/** Coerces form-input strings to numbers; treats empty strings as undefined. */
const optionalPositiveNumber = z.coerce
  .number()
  .min(0, "Must be zero or greater")
  .optional()

// ---------------------------------------------------------------------------
// Base schema
// ---------------------------------------------------------------------------

export const opportunitySchema = z.object({
  /** Platform this opportunity originates from (required). */
  platform_id: z.string().uuid("Select a platform"),

  /** Service pillar category (optional). */
  pillar_id: optionalUuid,

  /** Associated gig listing, if any. */
  gig_id: optionalUuid,

  /** Current pipeline stage. Defaults to "discovered" for new opportunities. */
  stage: z.enum(OPPORTUNITY_STAGES),

  /** Job or project title as listed by the client. */
  job_title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or fewer"),

  /** Direct link to the job posting on the platform. */
  job_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),

  /** Full job description / requirements text. */
  job_description: z
    .string()
    .max(10000, "Description must be 10,000 characters or fewer")
    .optional()
    .or(z.literal("")),

  // -- Client information --------------------------------------------------

  /** Client's display name on the platform. */
  client_name: z
    .string()
    .max(100, "Client name must be 100 characters or fewer")
    .optional()
    .or(z.literal("")),

  /** Client's company / organization. */
  client_company: z
    .string()
    .max(100, "Company must be 100 characters or fewer")
    .optional()
    .or(z.literal("")),

  /** Client's location or timezone region. */
  client_location: z
    .string()
    .max(100, "Location must be 100 characters or fewer")
    .optional()
    .or(z.literal("")),

  // -- Budget & contract ---------------------------------------------------

  /** Low end of the client's stated budget range. */
  budget_min: optionalPositiveNumber,

  /** High end of the client's stated budget range. */
  budget_max: optionalPositiveNumber,

  /** Fixed-price or hourly contract structure. */
  contract_type: z.enum(CONTRACT_TYPES),

  // -- Proposal ------------------------------------------------------------

  /** Full proposal text submitted (or drafted). */
  proposal_text: z
    .string()
    .max(10000, "Proposal must be 10,000 characters or fewer")
    .optional()
    .or(z.literal("")),

  /** Template used to generate the proposal. */
  proposal_template_id: optionalUuid,

  // -- Financials & time ---------------------------------------------------

  /** Agreed contract value once contracted. */
  contract_value: optionalPositiveNumber,

  /** Estimated hours to complete the project. */
  estimated_hours: optionalPositiveNumber,

  /** Actual hours logged against this opportunity. */
  actual_hours: optionalPositiveNumber,

  // -- Dates & notes -------------------------------------------------------

  /** Target delivery deadline (ISO date string, e.g. "2026-03-15"). */
  delivery_deadline: z.string().optional().or(z.literal("")),

  /** Free-form internal notes about this opportunity. */
  notes: z
    .string()
    .max(5000, "Notes must be 5,000 characters or fewer")
    .optional()
    .or(z.literal("")),
})

// ---------------------------------------------------------------------------
// Refined schema — cross-field validations
// ---------------------------------------------------------------------------

/**
 * Extended schema with cross-field refinements:
 * - budget_max must be >= budget_min when both are provided.
 */
export const opportunitySchemaRefined = opportunitySchema.refine(
  (data) => {
    if (
      data.budget_min !== undefined &&
      data.budget_max !== undefined &&
      data.budget_min > 0 &&
      data.budget_max > 0
    ) {
      return data.budget_max >= data.budget_min
    }
    return true
  },
  {
    message: "Max budget must be greater than or equal to min budget",
    path: ["budget_max"],
  },
)

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

/** Form data shape inferred from the base schema. */
export type OpportunityFormData = z.infer<typeof opportunitySchema>

/** Form data shape inferred from the refined schema (use for submission). */
export type OpportunityFormDataRefined = z.infer<
  typeof opportunitySchemaRefined
>
