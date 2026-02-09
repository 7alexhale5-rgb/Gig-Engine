/**
 * Zod validation schema for Proposal Template forms.
 *
 * Templates are reusable proposal blueprints organized by service pillar
 * and platform. They support placeholder variables (e.g. {{client_name}})
 * that are replaced at generation time. The `times_used`, `times_won`,
 * and `win_rate` fields are tracked automatically and not part of the form.
 */

import { z } from "zod"

// ---------------------------------------------------------------------------
// Reusable field helpers
// ---------------------------------------------------------------------------

/** Accepts a valid UUID or an empty string (for "All Platforms" / "All Pillars"). */
const optionalUuid = z
  .string()
  .uuid("Must be a valid selection")
  .optional()
  .or(z.literal(""))

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const proposalTemplateSchema = z.object({
  /** Display name for the template (e.g. "Automation Specialist - Upwork"). */
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be 100 characters or fewer"),

  /** Service pillar this template targets (optional, null = all pillars). */
  pillar_id: optionalUuid,

  /** Platform this template is optimized for (optional, null = all platforms). */
  platform_id: optionalUuid,

  /**
   * Full proposal template text with optional {{variable}} placeholders.
   * Must contain meaningful content to be useful as a template.
   */
  template_text: z
    .string()
    .min(10, "Template text must be at least 10 characters")
    .max(15000, "Template text must be 15,000 characters or fewer"),

  /**
   * List of variable names used in the template (without braces).
   * Example: ["client_name", "project_scope", "timeline"]
   * These drive the variable-replacement UI during proposal generation.
   */
  variables: z
    .array(
      z
        .string()
        .min(1, "Variable name cannot be empty")
        .max(50, "Variable name too long")
        .regex(
          /^[a-z][a-z0-9_]*$/,
          "Variable names must be lowercase with underscores (e.g. client_name)",
        ),
    )
    .default([]),

  /** Searchable tags for template categorization and filtering. */
  tags: z
    .array(z.string().min(1, "Tag cannot be empty").max(50, "Tag too long"))
    .default([]),
})

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

/** Form data shape inferred from the schema. */
export type ProposalTemplateFormData = z.infer<typeof proposalTemplateSchema>
