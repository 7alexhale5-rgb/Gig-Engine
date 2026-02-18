"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { GigListing, GigStatus } from "@/lib/supabase/types"

const supabase = createClient()

interface GigFilters {
  status?: GigStatus
  platform_id?: string
  pillar_id?: string
}

export function useGigs() {
  const [gigs, setGigs] = useState<GigListing[]>([])
  const [loading, setLoading] = useState(false)

  const fetchGigs = useCallback(
    async (filters?: GigFilters) => {
      setLoading(true)
      try {
        let query = supabase
          .from("gig_listings")
          .select("*")
          .order("created_at", { ascending: false })

        if (filters?.status) {
          query = query.eq("status", filters.status)
        }
        if (filters?.platform_id) {
          query = query.eq("platform_id", filters.platform_id)
        }
        if (filters?.pillar_id) {
          query = query.eq("pillar_id", filters.pillar_id)
        }

        const { data, error } = await query

        if (error) throw error
        setGigs((data as GigListing[]) ?? [])
      } catch (err) {
        console.error("Failed to fetch gigs:", err)
        setGigs([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const createGig = useCallback(
    async (
      data: Partial<GigListing> &
        Pick<GigListing, "platform_id" | "pillar_id" | "title">
    ) => {
      setLoading(true)
      try {
        const { data: created, error } = await supabase
          .from("gig_listings")
          .insert(data)
          .select()
          .single()

        if (error) throw error

        setGigs((prev) => [created as GigListing, ...prev])
        return created as GigListing
      } catch (err) {
        console.error("Failed to create gig:", err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const updateGig = useCallback(
    async (id: string, data: Partial<GigListing>) => {
      setLoading(true)
      try {
        const { data: updated, error } = await supabase
          .from("gig_listings")
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single()

        if (error) throw error

        setGigs((prev) =>
          prev.map((gig) => (gig.id === id ? (updated as GigListing) : gig))
        )
        return updated as GigListing
      } catch (err) {
        console.error("Failed to update gig:", err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const deleteGig = useCallback(
    async (id: string) => {
      setLoading(true)
      try {
        const { error } = await supabase
          .from("gig_listings")
          .delete()
          .eq("id", id)

        if (error) throw error

        setGigs((prev) => prev.filter((gig) => gig.id !== id))
      } catch (err) {
        console.error("Failed to delete gig:", err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    gigs,
    loading,
    fetchGigs,
    createGig,
    updateGig,
    deleteGig,
  }
}
