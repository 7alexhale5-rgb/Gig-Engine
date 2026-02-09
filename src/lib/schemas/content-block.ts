/**
 * Zod validation schema for Content Block forms.
 *
 * Content blocks are reusable text assets — bios, credentials, process
 * descriptions, testimonials, and case studies — that can be tagged by
 * platform and pillar for quick retrieval during proposal generation.
 * The `times_used` counter is tracked automatically and not part of the form.
 */

import { z } from "zod"

// ---------------------------------------------------------------------------
// Enum values (kept in sync with ContentBlockCategory in types.ts)
// ---------------------------------------------------------------------------

const CONTENT_BLOCK_CATEGORIES = [
  "bio",
  "credential",
  "process",
  "testimonial",
  "case_study",
] as const

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const contentBlockSchema = z.object({
  /**
   * Content category. Determines how the block is used:
   * - bio: Professional biography / about text
   * - credential: Certification, award, or qualification
   * - process: Methodology or workflow description
   * - testimonial: Client testimonial or review excerpt
   * - case_study: Brief case study narrative
   */
  category: z.enum(CONTENT_BLOCK_CATEGORIES, {
    message: "Select a valid category",
  }),

  /** Display title for quick identification. */
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or fewer"),

  /** The actual content text. Must be substantive enough to be useful. */
  content_text: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(10000, "Content must be 10,000 characters or fewer"),

  /**
   * Platform names this content is relevant to.
   * Used for filtering when generating proposals for a specific platform.
   */
  platform_tags: z
    .array(z.string().min(1, "Tag cannot be empty").max(50, "Tag too long"))
    .default([]),

  /**
   * Pillar names this content is relevant to.
   * Used for filtering when generating proposals for a specific service area.
   */
  pillar_tags: z
    .array(z.string().min(1, "Tag cannot be empty").max(50, "Tag too long"))
    .default([]),
})

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

/** Form data shape inferred from the schema. */
export type ContentBlockFormData = z.infer<typeof contentBlockSchema>
