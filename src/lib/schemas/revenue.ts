/**
 * Zod validation schema for Revenue Entry forms.
 *
 * Tracks all incoming revenue with platform fee deduction, linked
 * optionally to a specific opportunity, platform, and service pillar.
 * The `net_amount` is a GENERATED column in the database
 * (amount - platform_fee_amount), so it is NOT included in this schema.
 */

import { z } from "zod"

// ---------------------------------------------------------------------------
// Enum values (kept in sync with RevenueEntryType in types.ts)
// ---------------------------------------------------------------------------

const REVENUE_ENTRY_TYPES = [
  "gig_payment",
  "retainer",
  "bonus",
  "tip",
] as const

// ---------------------------------------------------------------------------
// Reusable field helpers
// ---------------------------------------------------------------------------

/** Accepts a valid UUID or an empty string (for unselected optional selects). */
const optionalUuid = z
  .string()
  .uuid("Must be a valid selection")
  .optional()
  .or(z.literal(""))

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const revenueSchema = z.object({
  /** Gross revenue amount before platform fees (required, must be positive). */
  amount: z.coerce
    .number()
    .positive("Amount must be greater than zero"),

  /** ISO 4217 currency code. Defaults to USD. */
  currency: z
    .string()
    .min(3, "Currency code must be 3 characters")
    .max(3, "Currency code must be 3 characters")
    .default("USD"),

  /** Classification of the revenue entry. */
  entry_type: z.enum(REVENUE_ENTRY_TYPES).default("gig_payment"),

  /** Date the payment was received (ISO date string, e.g. "2026-03-15"). */
  received_date: z
    .string()
    .min(1, "Received date is required")
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Date must be in YYYY-MM-DD format",
    ),

  /** Platform that sourced this revenue (optional). */
  platform_id: optionalUuid,

  /** Service pillar this revenue belongs to (optional). */
  pillar_id: optionalUuid,

  /** Originating opportunity (optional). */
  opportunity_id: optionalUuid,

  /**
   * Platform fee / commission deducted from the gross amount.
   * Defaults to 0. The database computes net_amount = amount - platform_fee_amount.
   */
  platform_fee_amount: z.coerce
    .number()
    .min(0, "Platform fee cannot be negative")
    .default(0),

  /** Internal notes about this revenue entry. */
  notes: z
    .string()
    .max(2000, "Notes must be 2,000 characters or fewer")
    .optional()
    .or(z.literal("")),
})

// ---------------------------------------------------------------------------
// Refined schema — fee cannot exceed amount
// ---------------------------------------------------------------------------

/**
 * Extended schema with cross-field validation:
 * - platform_fee_amount must not exceed the gross amount.
 */
export const revenueSchemaRefined = revenueSchema.refine(
  (data) => data.platform_fee_amount <= data.amount,
  {
    message: "Platform fee cannot exceed the gross amount",
    path: ["platform_fee_amount"],
  },
)

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

/** Form data shape inferred from the base schema. */
export type RevenueFormData = z.infer<typeof revenueSchema>

/** Form data shape inferred from the refined schema (use for submission). */
export type RevenueFormDataRefined = z.infer<typeof revenueSchemaRefined>
