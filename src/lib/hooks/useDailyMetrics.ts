"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { DailyMetrics } from "@/lib/supabase/types"
import { format } from "date-fns"

const supabase = createClient()

interface DateRange {
  from: string // ISO date string (YYYY-MM-DD)
  to: string // ISO date string (YYYY-MM-DD)
}

export function useDailyMetrics() {
  const [metrics, setMetrics] = useState<DailyMetrics[]>([])
  const [loading, setLoading] = useState(false)

  const fetchMetrics = useCallback(
    async (dateRange?: DateRange) => {
      setLoading(true)
      try {
        let query = supabase
          .from("daily_metrics")
          .select("*")
          .order("date", { ascending: false })

        if (dateRange?.from) {
          query = query.gte("date", dateRange.from)
        }
        if (dateRange?.to) {
          query = query.lte("date", dateRange.to)
        }

        const { data, error } = await query

        if (error) throw error
        setMetrics((data as DailyMetrics[]) ?? [])
      } catch (err) {
        console.error("Failed to fetch daily metrics:", err)
        setMetrics([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * Upsert metrics for a given date + platform combination.
   * If an entry already exists for the same date and platform, it will be updated.
   */
  const logMetrics = useCallback(
    async (
      data: Partial<DailyMetrics> & Pick<DailyMetrics, "date"> & { platform_id?: string }
    ) => {
      setLoading(true)
      try {
        const { data: upserted, error } = await supabase
          .from("daily_metrics")
          .upsert(
            {
              ...data,
            },
            {
              onConflict: "date,platform_id",
            }
          )
          .select()
          .single()

        if (error) throw error

        const result = upserted as DailyMetrics

        setMetrics((prev) => {
          const existingIndex = prev.findIndex(
            (m) =>
              m.date === result.date && m.platform_id === result.platform_id
          )
          if (existingIndex >= 0) {
            const updated = [...prev]
            updated[existingIndex] = result
            return updated
          }
          return [result, ...prev]
        })

        return result
      } catch (err) {
        console.error("Failed to log daily metrics:", err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * Get the total number of proposals sent today across all platforms.
   */
  const getTodayProposalCount = useCallback((): number => {
    const today = format(new Date(), "yyyy-MM-dd")
    return metrics
      .filter((m) => m.date === today)
      .reduce((sum, m) => sum + m.proposals_sent, 0)
  }, [metrics])

  return {
    metrics,
    loading,
    fetchMetrics,
    logMetrics,
    getTodayProposalCount,
  }
}
