export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revenueSchema } from "@/lib/schemas"
import type { RevenueEntry, RevenueEntryWithRelations } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// GET /api/revenue
// ---------------------------------------------------------------------------

/**
 * List revenue entries with optional date range and platform/pillar filters.
 *
 * Query params:
 *   from         - Start date (YYYY-MM-DD)
 *   to           - End date (YYYY-MM-DD)
 *   platform_id  - Filter by platform UUID
 *   pillar_id    - Filter by service pillar UUID
 *   entry_type   - Filter by entry type (gig_payment, retainer, bonus, tip)
 *   page         - Page number (1-based, default 1)
 *   limit        - Items per page (default 50, max 100)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)),
    )
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Filters
    const dateFrom = searchParams.get("from")
    const dateTo = searchParams.get("to")
    const platformId = searchParams.get("platform_id")
    const pillarId = searchParams.get("pillar_id")
    const entryType = searchParams.get("entry_type")

    let query = supabase
      .from("revenue_entries")
      .select(
        "*, platforms(name), service_pillars(name, color)",
        { count: "exact" },
      )
      .order("received_date", { ascending: false })
      .range(from, to)

    if (dateFrom) {
      query = query.gte("received_date", dateFrom)
    }
    if (dateTo) {
      query = query.lte("received_date", dateTo)
    }
    if (platformId) {
      query = query.eq("platform_id", platformId)
    }
    if (pillarId) {
      query = query.eq("pillar_id", pillarId)
    }
    if (entryType) {
      query = query.eq("entry_type", entryType)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("Failed to fetch revenue entries:", error)
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      data: (data as unknown as RevenueEntryWithRelations[]) ?? [],
      error: null,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    })
  } catch (err) {
    console.error("Unexpected error fetching revenue:", err)
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// POST /api/revenue
// ---------------------------------------------------------------------------

/**
 * Create a new revenue entry. Body is validated against the revenue Zod schema.
 * Returns the created record with 201.
 *
 * Note: `net_amount` is a GENERATED column (amount - platform_fee_amount)
 * and must not be included in the insert payload.
 */
export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()

    // Validate with Zod
    const result = revenueSchema.safeParse(body)
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

    // Clean empty-string optional UUID fields to undefined
    const insertData: Record<string, unknown> = { ...validated }
    const uuidFields = ["platform_id", "pillar_id", "opportunity_id"] as const
    for (const field of uuidFields) {
      if (insertData[field] === "") {
        delete insertData[field]
      }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("revenue_entries")
      .insert(insertData)
      .select("*, platforms(name), service_pillars(name, color)")
      .single()

    if (error) {
      console.error("Failed to create revenue entry:", error)
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { data: data as unknown as RevenueEntryWithRelations, error: null },
      { status: 201 },
    )
  } catch (err) {
    console.error("Unexpected error creating revenue entry:", err)
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    )
  }
}
