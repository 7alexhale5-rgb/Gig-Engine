/**
 * Zod validation schema for the Daily Metrics form.
 *
 * Captures a daily snapshot of platform activity: proposals, gig
 * performance, and revenue. Each row is unique per (date, platform_id).
 * All counter fields default to 0 and must be non-negative integers.
 */

import { z } from "zod"

// ---------------------------------------------------------------------------
// Reusable field helpers
// ---------------------------------------------------------------------------

/** Accepts a valid UUID or an empty string (for "All Platforms" aggregate). */
const optionalUuid = z
  .string()
  .uuid("Must be a valid selection")
  .optional()
  .or(z.literal(""))

/**
 * Non-negative integer field. Coerces form-input strings to integers.
 * Defaults to 0 for convenience when logging partial daily data.
 */
const nonNegativeInt = z.coerce
  .number()
  .int("Must be a whole number")
  .min(0, "Must be zero or greater")
  .default(0)

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const dailyMetricsSchema = z.object({
  /** The date this snapshot covers (ISO date string, e.g. "2026-03-15"). */
  date: z
    .string()
    .min(1, "Date is required")
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Date must be in YYYY-MM-DD format",
    ),

  /**
   * Platform these metrics belong to (optional).
   * When null, represents an aggregate / cross-platform entry.
   */
  platform_id: optionalUuid,

  // -- Proposal activity ---------------------------------------------------

  /** Number of proposals sent on this date. */
  proposals_sent: nonNegativeInt,

  /** Number of proposals viewed / opened by clients. */
  proposals_viewed: nonNegativeInt,

  /** Number of responses received from clients. */
  responses_received: nonNegativeInt,

  /** Number of contracts won (proposals accepted). */
  contracts_won: nonNegativeInt,

  // -- Gig performance -----------------------------------------------------

  /** Gig listing impressions / views from search. */
  gig_impressions: nonNegativeInt,

  /** Gig listing clicks (visits to the gig page). */
  gig_clicks: nonNegativeInt,

  /** Orders / purchases placed on gig listings. */
  gig_orders: nonNegativeInt,

  // -- Revenue & notes -----------------------------------------------------

  /** Total revenue earned on this date (across all gigs / contracts). */
  revenue: z.coerce
    .number()
    .min(0, "Revenue must be zero or greater")
    .default(0),

  /** Optional notes about the day (wins, blockers, observations). */
  notes: z
    .string()
    .max(2000, "Notes must be 2,000 characters or fewer")
    .optional()
    .or(z.literal("")),
})

// ---------------------------------------------------------------------------
// Refined schema — logical consistency
// ---------------------------------------------------------------------------

/**
 * Extended schema with cross-field validations:
 * - contracts_won cannot exceed proposals_sent.
 * - responses_received cannot exceed proposals_sent.
 * - gig_orders cannot exceed gig_clicks.
 * - gig_clicks cannot exceed gig_impressions.
 */
export const dailyMetricsSchemaRefined = dailyMetricsSchema
  .refine(
    (data) => data.contracts_won <= data.proposals_sent,
    {
      message:
        "Contracts won cannot exceed proposals sent",
      path: ["contracts_won"],
    },
  )
  .refine(
    (data) => data.responses_received <= data.proposals_sent,
    {
      message:
        "Responses received cannot exceed proposals sent",
      path: ["responses_received"],
    },
  )
  .refine(
    (data) => {
      if (data.gig_impressions > 0) {
        return data.gig_clicks <= data.gig_impressions
      }
      return true
    },
    {
      message: "Gig clicks cannot exceed gig impressions",
      path: ["gig_clicks"],
    },
  )
  .refine(
    (data) => {
      if (data.gig_clicks > 0) {
        return data.gig_orders <= data.gig_clicks
      }
      return true
    },
    {
      message: "Gig orders cannot exceed gig clicks",
      path: ["gig_orders"],
    },
  )

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

/** Form data shape inferred from the base schema. */
export type DailyMetricsFormData = z.infer<typeof dailyMetricsSchema>

/** Form data shape inferred from the refined schema (use for submission). */
export type DailyMetricsFormDataRefined = z.infer<
  typeof dailyMetricsSchemaRefined
>
