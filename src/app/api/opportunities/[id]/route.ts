export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { opportunitySchema } from "@/lib/schemas"
import type { OpportunityWithRelations } from "@/lib/supabase/types"

interface RouteContext {
  params: Promise<{ id: string }>
}

// ---------------------------------------------------------------------------
// GET /api/opportunities/[id]
// ---------------------------------------------------------------------------

/**
 * Fetch a single opportunity by ID with platform and pillar relations.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("opportunities")
      .select("*, platforms(name), service_pillars(name, color)")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { data: null, error: "Opportunity not found" },
          { status: 404 },
        )
      }
      console.error("Failed to fetch opportunity:", error)
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      data: data as unknown as OpportunityWithRelations,
      error: null,
    })
  } catch (err) {
    console.error("Unexpected error fetching opportunity:", err)
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/opportunities/[id]
// ---------------------------------------------------------------------------

/**
 * Update an opportunity's fields. Accepts a partial body validated against the
 * opportunity schema. Only provided fields are updated.
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body: unknown = await req.json()

    // Partial validation — allow subset of fields
    const partialSchema = opportunitySchema.partial()
    const result = partialSchema.safeParse(body)

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

    // Clean empty-string optional UUID fields to null for DB update
    const updateData: Record<string, unknown> = { ...validated }
    const uuidFields = [
      "pillar_id",
      "gig_id",
      "proposal_template_id",
    ] as const
    for (const field of uuidFields) {
      if (updateData[field] === "") {
        updateData[field] = null
      }
    }

    // Set updated_at
    updateData.updated_at = new Date().toISOString()

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("opportunities")
      .update(updateData)
      .eq("id", id)
      .select("*, platforms(name), service_pillars(name, color)")
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { data: null, error: "Opportunity not found" },
          { status: 404 },
        )
      }
      console.error("Failed to update opportunity:", error)
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      data: data as unknown as OpportunityWithRelations,
      error: null,
    })
  } catch (err) {
    console.error("Unexpected error updating opportunity:", err)
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/opportunities/[id]
// ---------------------------------------------------------------------------

/**
 * Delete an opportunity by ID. Returns the deleted record.
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("opportunities")
      .delete()
      .eq("id", id)
      .select()
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { data: null, error: "Opportunity not found" },
          { status: 404 },
        )
      }
      console.error("Failed to delete opportunity:", error)
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      data: data,
      error: null,
    })
  } catch (err) {
    console.error("Unexpected error deleting opportunity:", err)
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    )
  }
}
