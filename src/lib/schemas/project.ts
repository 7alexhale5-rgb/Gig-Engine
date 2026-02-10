/**
 * Zod validation schema for the Project form.
 *
 * Projects are active delivery engagements with milestones, checklists,
 * and time tracking. They are optionally linked to a pipeline opportunity.
 * The `time_entries_json` and `client_communication_log_json` columns
 * have their own dedicated UI flows and are not part of the main form.
 */

import { z } from "zod"

// ---------------------------------------------------------------------------
// Enum values (kept in sync with ProjectStatus in types.ts)
// ---------------------------------------------------------------------------

const PROJECT_STATUSES = [
  "active",
  "paused",
  "completed",
  "cancelled",
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

/**
 * Optional ISO date string (YYYY-MM-DD).
 * Accepts empty strings from cleared date inputs.
 */
const optionalDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .optional()
  .or(z.literal(""))

// ---------------------------------------------------------------------------
// Nested object schemas — milestones and checklists
// ---------------------------------------------------------------------------

/**
 * A project milestone with an optional due date and completion state.
 * Matches the `Milestone` interface in `@/lib/supabase/types`.
 */
export const milestoneSchema = z.object({
  /** Client-generated unique ID (e.g. crypto.randomUUID()). */
  id: z.string().min(1, "Milestone ID is required"),

  /** Short milestone title. */
  title: z
    .string()
    .min(1, "Milestone title is required")
    .max(200, "Milestone title must be 200 characters or fewer"),

  /** Optional longer description of the milestone scope. */
  description: z
    .string()
    .max(1000, "Description must be 1,000 characters or fewer")
    .optional()
    .or(z.literal("")),

  /** Target due date (ISO date string). */
  due_date: optionalDateString,

  /** Whether this milestone has been completed. */
  completed: z.boolean().default(false),

  /** ISO timestamp of when the milestone was marked complete. */
  completed_at: z.string().optional().or(z.literal("")),
})

/**
 * A single checklist item with completion state.
 * Matches the `ChecklistItem` interface in `@/lib/supabase/types`.
 */
export const checklistItemSchema = z.object({
  /** Client-generated unique ID. */
  id: z.string().min(1, "Checklist item ID is required"),

  /** The checklist item text. */
  text: z
    .string()
    .min(1, "Checklist item text is required")
    .max(500, "Checklist item text must be 500 characters or fewer"),

  /** Whether this item has been checked off. */
  completed: z.boolean().default(false),

  /** ISO timestamp of when the item was checked off. */
  completed_at: z.string().optional().or(z.literal("")),
})

// ---------------------------------------------------------------------------
// Main project schema
// ---------------------------------------------------------------------------

export const projectSchema = z.object({
  /** Project title / name. */
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or fewer"),

  /** Linked pipeline opportunity (optional). */
  opportunity_id: optionalUuid,

  /** Current project status. */
  status: z.enum(PROJECT_STATUSES).default("active"),

  /** Date work began on this project. */
  start_date: optionalDateString,

  /** Agreed delivery date with the client. */
  target_delivery_date: optionalDateString,

  /** Actual date the project was delivered. */
  actual_delivery_date: optionalDateString,

  /** Ordered list of project milestones. */
  milestones_json: z.array(milestoneSchema).default([]),

  /** Delivery checklist items. */
  checklist_json: z.array(checklistItemSchema).default([]),
})

// ---------------------------------------------------------------------------
// Refined schema — date consistency
// ---------------------------------------------------------------------------

/**
 * Extended schema with cross-field date validations:
 * - target_delivery_date must be on or after start_date.
 * - actual_delivery_date must be on or after start_date.
 */
export const projectSchemaRefined = projectSchema
  .refine(
    (data) => {
      if (data.start_date && data.target_delivery_date) {
        return data.target_delivery_date >= data.start_date
      }
      return true
    },
    {
      message: "Target delivery date must be on or after the start date",
      path: ["target_delivery_date"],
    },
  )
  .refine(
    (data) => {
      if (data.start_date && data.actual_delivery_date) {
        return data.actual_delivery_date >= data.start_date
      }
      return true
    },
    {
      message: "Actual delivery date must be on or after the start date",
      path: ["actual_delivery_date"],
    },
  )

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

/** Form data shape inferred from the base schema. */
export type ProjectFormData = z.infer<typeof projectSchema>

/** Form data shape inferred from the refined schema (use for submission). */
export type ProjectFormDataRefined = z.infer<typeof projectSchemaRefined>

/** Milestone form data shape. */
export type MilestoneFormData = z.infer<typeof milestoneSchema>

/** Checklist item form data shape. */
export type ChecklistItemFormData = z.infer<typeof checklistItemSchema>
