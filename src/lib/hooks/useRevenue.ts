"use client"

import { useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RevenueEntry } from "@/lib/supabase/types"

interface DateRange {
  from: string // ISO date string (YYYY-MM-DD)
  to: string // ISO date string (YYYY-MM-DD)
}

interface RevenueSummary {
  totalRevenue: number
  byPlatform: Record<string, number>
  byPillar: Record<string, number>
}

export function useRevenue() {
  const [entries, setEntries] = useState<RevenueEntry[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchRevenue = useCallback(
    async (dateRange?: DateRange) => {
      setLoading(true)
      try {
        let query = supabase
          .from("revenue_entries")
          .select("*")
          .order("received_date", { ascending: false })

        if (dateRange?.from) {
          query = query.gte("received_date", dateRange.from)
        }
        if (dateRange?.to) {
          query = query.lte("received_date", dateRange.to)
        }

        const { data, error } = await query

        if (error) throw error
        setEntries((data as RevenueEntry[]) ?? [])
      } catch (err) {
        console.error("Failed to fetch revenue entries:", err)
        setEntries([])
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  const addEntry = useCallback(
    async (
      data: Partial<RevenueEntry> &
        Pick<RevenueEntry, "amount" | "received_date">
    ) => {
      setLoading(true)
      try {
        const { data: created, error } = await supabase
          .from("revenue_entries")
          .insert(data)
          .select()
          .single()

        if (error) throw error

        setEntries((prev) => [created as RevenueEntry, ...prev])
        return created as RevenueEntry
      } catch (err) {
        console.error("Failed to add revenue entry:", err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  const summary: RevenueSummary = useMemo(() => {
    const totalRevenue = entries.reduce((sum, e) => sum + e.amount, 0)

    const byPlatform = entries.reduce(
      (acc, e) => {
        if (e.platform_id) {
          acc[e.platform_id] = (acc[e.platform_id] ?? 0) + e.amount
        }
        return acc
      },
      {} as Record<string, number>
    )

    const byPillar = entries.reduce(
      (acc, e) => {
        if (e.pillar_id) {
          acc[e.pillar_id] = (acc[e.pillar_id] ?? 0) + e.amount
        }
        return acc
      },
      {} as Record<string, number>
    )

    return { totalRevenue, byPlatform, byPillar }
  }, [entries])

  return {
    entries,
    loading,
    summary,
    fetchRevenue,
    addEntry,
  }
}
