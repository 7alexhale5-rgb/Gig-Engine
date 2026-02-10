"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ProposalTemplate } from "@/lib/supabase/types"

const supabase = createClient()

interface ProposalFilters {
  pillar_id?: string
  platform_id?: string
  tag?: string
}

export function useProposals() {
  const [templates, setTemplates] = useState<ProposalTemplate[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTemplates = useCallback(
    async (filters?: ProposalFilters) => {
      setLoading(true)
      try {
        let query = supabase
          .from("proposal_templates")
          .select("*")
          .order("times_used", { ascending: false })

        if (filters?.pillar_id) {
          query = query.eq("pillar_id", filters.pillar_id)
        }
        if (filters?.platform_id) {
          query = query.eq("platform_id", filters.platform_id)
        }
        if (filters?.tag) {
          query = query.contains("tags", [filters.tag])
        }

        const { data, error } = await query

        if (error) throw error
        setTemplates((data as ProposalTemplate[]) ?? [])
      } catch (err) {
        console.error("Failed to fetch proposal templates:", err)
        setTemplates([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const createTemplate = useCallback(
    async (data: Partial<ProposalTemplate> & Pick<ProposalTemplate, "name">) => {
      setLoading(true)
      try {
        const { data: created, error } = await supabase
          .from("proposal_templates")
          .insert(data)
          .select()
          .single()

        if (error) throw error

        setTemplates((prev) => [created as ProposalTemplate, ...prev])
        return created as ProposalTemplate
      } catch (err) {
        console.error("Failed to create proposal template:", err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const updateTemplate = useCallback(
    async (id: string, data: Partial<ProposalTemplate>) => {
      setLoading(true)
      try {
        const { data: updated, error } = await supabase
          .from("proposal_templates")
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single()

        if (error) throw error

        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? (updated as ProposalTemplate) : t))
        )
        return updated as ProposalTemplate
      } catch (err) {
        console.error("Failed to update proposal template:", err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const incrementUsed = useCallback(
    async (id: string) => {
      try {
        const template = templates.find((t) => t.id === id)
        if (!template) throw new Error(`Template ${id} not found in local state`)

        const { error } = await supabase
          .from("proposal_templates")
          .update({
            times_used: template.times_used + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)

        if (error) throw error

        setTemplates((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, times_used: t.times_used + 1 } : t
          )
        )
      } catch (err) {
        console.error("Failed to increment times_used:", err)
        throw err
      }
    },
    [templates]
  )

  const incrementWon = useCallback(
    async (id: string) => {
      try {
        const template = templates.find((t) => t.id === id)
        if (!template) throw new Error(`Template ${id} not found in local state`)

        const { error } = await supabase
          .from("proposal_templates")
          .update({
            times_won: template.times_won + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)

        if (error) throw error

        setTemplates((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, times_won: t.times_won + 1 } : t
          )
        )
      } catch (err) {
        console.error("Failed to increment times_won:", err)
        throw err
      }
    },
    [templates]
  )

  return {
    templates,
    loading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    incrementUsed,
    incrementWon,
  }
}
