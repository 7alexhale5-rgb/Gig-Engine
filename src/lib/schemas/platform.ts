/**
 * Zod validation schema for the Platform Settings form.
 *
 * Manages platform profiles (Upwork, Fiverr, Toptal, etc.) including
 * profile URLs, status, headline text, and skills. The `specialized_profiles_json`
 * column is managed through a separate UI and is not part of this form.
 */

import { z } from "zod"

// ---------------------------------------------------------------------------
// Enum values (kept in sync with PlatformStatus in types.ts)
// ---------------------------------------------------------------------------

const PLATFORM_STATUSES = [
  "setup_needed",
  "application_pending",
  "active",
  "paused",
  "planned",
] as const

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const platformSchema = z.object({
  /** Platform display name (e.g. "Upwork", "Fiverr", "Toptal"). */
  name: z
    .string()
    .min(1, "Platform name is required")
    .max(100, "Name must be 100 characters or fewer"),

  /** Direct link to the user's profile on this platform. */
  profile_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),

  /** Current status of the platform account. */
  profile_status: z.enum(PLATFORM_STATUSES).default("planned"),

  /** Profile headline / tagline shown on the platform. */
  headline: z
    .string()
    .max(300, "Headline must be 300 characters or fewer")
    .optional()
    .or(z.literal("")),

  /** Profile overview / about section text. */
  overview_text: z
    .string()
    .max(5000, "Overview must be 5,000 characters or fewer")
    .optional()
    .or(z.literal("")),

  /** Hourly rate displayed on the platform profile (optional). */
  hourly_rate: z.coerce
    .number()
    .positive("Hourly rate must be greater than zero")
    .optional(),

  /**
   * Skills / expertise tags listed on the platform profile.
   * These map to the platform's skills taxonomy where applicable.
   */
  skills_tags: z
    .array(z.string().min(1, "Skill cannot be empty").max(100, "Skill name too long"))
    .default([]),
})

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

/** Form data shape inferred from the schema. */
export type PlatformFormData = z.infer<typeof platformSchema>
