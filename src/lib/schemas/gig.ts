/**
 * Zod validation schema for the Gig Listing form.
 *
 * Covers gig metadata, 3-tier pricing (Basic / Standard / Premium), and
 * delivery timelines. Tier pricing is validated with refinements to
 * ensure logical consistency: if a higher tier is set, the lower tier
 * must also be set, and prices must increase across tiers.
 */

import { z } from "zod"

// ---------------------------------------------------------------------------
// Enum values (kept in sync with GigStatus in types.ts)
// ---------------------------------------------------------------------------

const GIG_STATUSES = ["draft", "active", "paused", "archived"] as const

// ---------------------------------------------------------------------------
// Reusable field helpers
// ---------------------------------------------------------------------------

/** Coerces form-input strings to numbers; treats empty / missing as undefined. */
const optionalPositiveNumber = z.coerce
  .number()
  .min(0, "Must be zero or greater")
  .optional()

/** Coerces to a positive integer (for delivery days). */
const optionalPositiveInt = z.coerce
  .number()
  .int("Must be a whole number")
  .min(1, "Must be at least 1 day")
  .optional()

// ---------------------------------------------------------------------------
// Base schema
// ---------------------------------------------------------------------------

export const gigSchema = z.object({
  /** Platform this gig is listed on (required). */
  platform_id: z.string().uuid("Select a platform"),

  /** Service pillar this gig belongs to (required). */
  pillar_id: z.string().uuid("Select a service pillar"),

  /** Gig title as displayed on the platform. */
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or fewer"),

  /** Full gig description / sales copy. */
  description: z
    .string()
    .max(5000, "Description must be 5,000 characters or fewer")
    .optional()
    .or(z.literal("")),

  /** Searchable tags / keywords for the listing. */
  tags: z
    .array(z.string().min(1, "Tag cannot be empty").max(50, "Tag too long"))
    .default([]),

  /** Current listing status. */
  status: z.enum(GIG_STATUSES).default("draft"),

  // -- 3-tier pricing ------------------------------------------------------

  /** Basic tier price. */
  pricing_basic: optionalPositiveNumber,

  /** Standard tier price. */
  pricing_standard: optionalPositiveNumber,

  /** Premium tier price. */
  pricing_premium: optionalPositiveNumber,

  /** Basic tier delivery time in days. */
  delivery_days_basic: optionalPositiveInt,

  /** Standard tier delivery time in days. */
  delivery_days_standard: optionalPositiveInt,

  /** Premium tier delivery time in days. */
  delivery_days_premium: optionalPositiveInt,

  // -- Links ---------------------------------------------------------------

  /** Direct link to the live gig page on the platform. */
  gig_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
})

// ---------------------------------------------------------------------------
// Refined schema — 3-tier pricing consistency
// ---------------------------------------------------------------------------

/**
 * Extended schema with pricing-tier refinements:
 *
 * 1. If Standard tier price is set, Basic tier price must also be set.
 * 2. If Premium tier price is set, Standard tier price must also be set.
 * 3. Standard price must be > Basic price when both are set.
 * 4. Premium price must be > Standard price when both are set.
 */
export const gigSchemaRefined = gigSchema
  .refine(
    (data) => {
      // If standard is set, basic must be set
      if (data.pricing_standard !== undefined && data.pricing_basic === undefined) {
        return false
      }
      return true
    },
    {
      message:
        "Basic tier price is required when Standard tier price is set",
      path: ["pricing_basic"],
    },
  )
  .refine(
    (data) => {
      // If premium is set, standard must be set
      if (data.pricing_premium !== undefined && data.pricing_standard === undefined) {
        return false
      }
      return true
    },
    {
      message:
        "Standard tier price is required when Premium tier price is set",
      path: ["pricing_standard"],
    },
  )
  .refine(
    (data) => {
      // Standard must be > basic when both set
      if (
        data.pricing_basic !== undefined &&
        data.pricing_standard !== undefined
      ) {
        return data.pricing_standard > data.pricing_basic
      }
      return true
    },
    {
      message: "Standard tier price must be greater than Basic tier price",
      path: ["pricing_standard"],
    },
  )
  .refine(
    (data) => {
      // Premium must be > standard when both set
      if (
        data.pricing_standard !== undefined &&
        data.pricing_premium !== undefined
      ) {
        return data.pricing_premium > data.pricing_standard
      }
      return true
    },
    {
      message:
        "Premium tier price must be greater than Standard tier price",
      path: ["pricing_premium"],
    },
  )

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

/** Form data shape inferred from the base schema. */
export type GigFormData = z.infer<typeof gigSchema>

/** Form data shape inferred from the refined schema (use for submission). */
export type GigFormDataRefined = z.infer<typeof gigSchemaRefined>
