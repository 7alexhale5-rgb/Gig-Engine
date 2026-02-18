export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { format } from "date-fns"

// ---------------------------------------------------------------------------
// CSV helper
// ---------------------------------------------------------------------------

/**
 * Escape a value for CSV output. Wraps in quotes if the value contains
 * a comma, double-quote, or newline. Double-quotes within values are doubled.
 */
function csvEscape(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// ---------------------------------------------------------------------------
// Row shape from the joined query
// ---------------------------------------------------------------------------

interface RevenueExportRow {
  received_date: string
  amount: number
  platform_fee_amount: number
  net_amount: number
  entry_type: string
  currency: string
  notes: string
  platforms: { name: string } | null
  service_pillars: { name: string } | null
}

// ---------------------------------------------------------------------------
// GET /api/export/revenue
// ---------------------------------------------------------------------------

/**
 * Export revenue entries as a downloadable CSV file.
 *
 * Query params:
 *   from  - Start date (YYYY-MM-DD, defaults to 90 days ago)
 *   to    - End date (YYYY-MM-DD, defaults to today)
 *
 * Returns a CSV file with headers:
 *   date, platform, pillar, amount, fee, net, type, notes
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)

    const now = new Date()
    const defaultFrom = format(
      new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      "yyyy-MM-dd",
    )
    const defaultTo = format(now, "yyyy-MM-dd")

    const dateFrom = searchParams.get("from") ?? defaultFrom
    const dateTo = searchParams.get("to") ?? defaultTo

    const { data, error } = await supabase
      .from("revenue_entries")
      .select(
        "received_date, amount, platform_fee_amount, net_amount, entry_type, currency, notes, platforms(name), service_pillars(name)",
      )
      .gte("received_date", dateFrom)
      .lte("received_date", dateTo)
      .order("received_date", { ascending: false })

    if (error) {
      console.error("Failed to fetch revenue for export:", error)
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 },
      )
    }

    const rows = (data ?? []) as unknown as RevenueExportRow[]

    // Build CSV content
    const csvHeaders = [
      "date",
      "platform",
      "pillar",
      "amount",
      "fee",
      "net",
      "type",
      "currency",
      "notes",
    ]

    const csvLines: string[] = [csvHeaders.join(",")]

    for (const row of rows) {
      const line = [
        csvEscape(row.received_date),
        csvEscape(row.platforms?.name ?? ""),
        csvEscape(row.service_pillars?.name ?? ""),
        row.amount.toFixed(2),
        row.platform_fee_amount.toFixed(2),
        row.net_amount.toFixed(2),
        csvEscape(row.entry_type),
        csvEscape(row.currency),
        csvEscape(row.notes ?? ""),
      ].join(",")
      csvLines.push(line)
    }

    const csvContent = csvLines.join("\n")
    const fileName = `prettyfly-revenue_${dateFrom}_to_${dateTo}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (err) {
    console.error("Unexpected error exporting revenue:", err)
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    )
  }
}
