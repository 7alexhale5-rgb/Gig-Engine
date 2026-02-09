"use client"

import { Header } from "@/components/layout"
import { PageContainer } from "@/components/layout"
import { Plus, Filter } from "lucide-react"
import { SERVICE_PILLARS } from "@/lib/utils/constants"
import { cn } from "@/lib/utils"
import { useState } from "react"

export default function GigsPage() {
  const [activePillar, setActivePillar] = useState<string | null>(null)

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
              Showing all gigs
            </span>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Gig
          </button>
        </div>

        {/* Gig Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            10 priority gigs seeded. Connect Supabase to display.
          </div>
        </div>
      </PageContainer>
    </>
  )
}
