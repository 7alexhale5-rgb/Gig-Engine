"use client"

import { useEffect, useState, useCallback } from "react"
import { Header, PageContainer } from "@/components/layout"
import { GigCard } from "@/components/gigs"
import { EmptyState } from "@/components/shared"
import { useGigs } from "@/lib/hooks/useGigs"
import { SERVICE_PILLARS } from "@/lib/utils/constants"
import { cn } from "@/lib/utils"
import { Plus, Filter, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { GigForm } from "@/components/gigs"
import type { GigListing } from "@/lib/supabase/types"

export default function GigsPage() {
  const [activePillar, setActivePillar] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { gigs, loading, fetchGigs, createGig } = useGigs()

  useEffect(() => {
    fetchGigs()
  }, [fetchGigs])

  const filteredGigs = activePillar
    ? gigs.filter((g) => g.pillar_id === activePillar)
    : gigs

  const handleCreate = useCallback(
    async (data: Partial<GigListing> & Pick<GigListing, "platform_id" | "pillar_id" | "title">) => {
      await createGig(data)
      setShowForm(false)
    },
    [createGig]
  )

  return (
    <>
      <Header
        title="Gig Manager"
        description="Manage listings across all platforms"
      />
      <PageContainer>
        {/* Pillar Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActivePillar(null)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              !activePillar
                ? "bg-foreground text-background"
                : "bg-accent text-muted-foreground hover:text-foreground"
            )}
          >
            All Pillars
          </button>
          {SERVICE_PILLARS.map((pillar) => (
            <button
              key={pillar.name}
              onClick={() => setActivePillar(pillar.name)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                activePillar === pillar.name
                  ? "text-white"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              )}
              style={
                activePillar === pillar.name
                  ? { backgroundColor: pillar.color }
                  : undefined
              }
            >
              {pillar.name}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Showing {filteredGigs.length} gig{filteredGigs.length !== 1 ? "s" : ""}
            </span>
          </div>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Gig
          </Button>
        </div>

        {/* Gig Grid */}
        {!loading && filteredGigs.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No gigs yet"
            description="Create your first gig listing to start tracking performance."
            action={{ label: "Create Gig", onClick: () => setShowForm(true) }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        )}

        {/* Create Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Gig Listing</DialogTitle>
            </DialogHeader>
            <GigForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  )
}
