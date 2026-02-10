export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { opportunitySchema } from "@/lib/schemas"
import type {
  OpportunityWithRelations,
  OpportunityStage,
} from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// GET /api/opportunities
// ---------------------------------------------------------------------------

/**
 * List opportunities with optional filters and pagination.
 *
 * Query params:
 *   stage        - Filter by pipeline stage
 *   platform_id  - Filter by platform UUID
 *   pillar_id    - Filter by service pillar UUID
 *   search       - Full-text search on job_title and client_name
 *   page         - Page number (1-based, default 1)
 *   limit        - Items per page (default 25, max 100)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10)),
    )
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Filters
    const stage = searchParams.get("stage") as OpportunityStage | null
    const platformId = searchParams.get("platform_id")
    const pillarId = searchParams.get("pillar_id")
    const search = searchParams.get("search")

    // Build query with joins
    let query = supabase
      .from("opportunities")
      .select(
        "*, platforms(name), service_pillars(name, color)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to)

    if (stage) {
      query = query.eq("stage", stage)
    }
    if (platformId) {
      query = query.eq("platform_id", platformId)
    }
    if (pillarId) {
      query = query.eq("pillar_id", pillarId)
    }
    if (search) {
      const sanitized = search.replace(/[%_\\(),.]/g, "")
      if (sanitized) {
        query = query.or(
          `job_title.ilike.%${sanitized}%,client_name.ilike.%${sanitized}%`,
        )
      }
    }

    const { data, error, count } = await query

    if (error) {
      console.error("Failed to fetch opportunities:", error)
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      data: (data as unknown as OpportunityWithRelations[]) ?? [],
      error: null,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    })
  } catch (err) {
    console.error("Unexpected error listing opportunities:", err)
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// POST /api/opportunities
// ---------------------------------------------------------------------------

/**
 * Create a new opportunity. Body is validated against the opportunity Zod schema.
 * Returns the created record with 201.
 */
export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()

    // Validate with Zod
    const result = opportunitySchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          data: null,
          error: "Validation failed",
          issues: result.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      )
    }

    const validated = result.data

    // Clean empty-string optional UUID fields to undefined for DB insert
    const insertData = { ...validated } as Record<string, unknown>
    const uuidFields = [
      "pillar_id",
      "gig_id",
      "proposal_template_id",
    ] as const
    for (const field of uuidFields) {
      if (insertData[field] === "") {
        delete insertData[field]
      }
    }

    // Clean empty-string optional text fields
    const textFields = [
      "job_url",
      "job_description",
      "client_name",
      "client_company",
      "client_location",
      "proposal_text",
      "delivery_deadline",
      "notes",
    ] as const
    for (const field of textFields) {
      if (insertData[field] === "") {
        insertData[field] = ""
      }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { data, error } = await supabase
      .from("opportunities")
      .insert(insertData)
      .select("*, platforms(name), service_pillars(name, color)")
      .single()

    if (error) {
      console.error("Failed to create opportunity:", error)
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { data: data as unknown as OpportunityWithRelations, error: null },
      { status: 201 },
    )
  } catch (err) {
    console.error("Unexpected error creating opportunity:", err)
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    )
  }
}
