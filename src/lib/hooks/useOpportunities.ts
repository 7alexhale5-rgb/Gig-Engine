"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Opportunity, OpportunityStage } from "@/lib/supabase/types"

const supabase = createClient()

interface OpportunityFilters {
  stage?: string
  platform_id?: string
  pillar_id?: string
}

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(false)

  const fetchOpportunities = useCallback(
    async (filters?: OpportunityFilters) => {
      setLoading(true)
      try {
        let query = supabase
          .from("opportunities")
          .select("*")
          .order("created_at", { ascending: false })

        if (filters?.stage) {
          query = query.eq("stage", filters.stage)
        }
        if (filters?.platform_id) {
          query = query.eq("platform_id", filters.platform_id)
        }
        if (filters?.pillar_id) {
          query = query.eq("pillar_id", filters.pillar_id)
        }

        const { data, error } = await query

        if (error) throw error
        setOpportunities((data as Opportunity[]) ?? [])
      } catch (err) {
        console.error("Failed to fetch opportunities:", err)
        setOpportunities([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const createOpportunity = useCallback(
    async (
      data: Partial<Opportunity> & Pick<Opportunity, "platform_id" | "job_title">
    ) => {
      setLoading(true)
      try {
        const { data: created, error } = await supabase
          .from("opportunities")
          .insert(data)
          .select()
          .single()

        if (error) throw error

        setOpportunities((prev) => [created as Opportunity, ...prev])
        return created as Opportunity
      } catch (err) {
        console.error("Failed to create opportunity:", err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const updateOpportunity = useCallback(
    async (id: string, data: Partial<Opportunity>) => {
      setLoading(true)
      try {
        const { data: updated, error } = await supabase
          .from("opportunities")
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single()

        if (error) throw error

        setOpportunities((prev) =>
          prev.map((opp) => (opp.id === id ? (updated as Opportunity) : opp))
        )
        return updated as Opportunity
      } catch (err) {
        console.error("Failed to update opportunity:", err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * Lightweight stage-only update optimised for drag-and-drop interactions.
   * Applies an optimistic update to local state before the network round-trip.
   */
  const updateStage = useCallback(
    async (id: string, newStage: OpportunityStage) => {
      // Optimistic update
      setOpportunities((prev) =>
        prev.map((opp) => (opp.id === id ? { ...opp, stage: newStage } : opp))
      )

      try {
        const { error } = await supabase
          .from("opportunities")
          .update({
            stage: newStage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)

        if (error) throw error
      } catch (err) {
        console.error("Failed to update opportunity stage:", err)
        // Revert optimistic update by re-fetching
        await fetchOpportunities()
        throw err
      }
    },
    [fetchOpportunities]
  )

  return {
    opportunities,
    loading,
    fetchOpportunities,
    createOpportunity,
    updateOpportunity,
    updateStage,
  }
}
