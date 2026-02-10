"use client"

import { useEffect, useState, useCallback } from "react"
import { Header, PageContainer } from "@/components/layout"
import { GigForm, GigVersionHistory, GigPerformanceStats } from "@/components/gigs"
import { CardSkeleton } from "@/components/shared"
import { useGigs } from "@/lib/hooks/useGigs"
import { SEED_PLATFORMS } from "@/data/seed-platforms"
import { SERVICE_PILLARS } from "@/lib/utils/constants"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils/formatters"
import {
  ArrowLeft,
  Edit,
  ExternalLink,
  BarChart3,
  History,
  Settings,
} from "lucide-react"
import type { GigListing } from "@/lib/supabase/types"

interface GigDetailProps {
  params: { id: string }
}

export default function GigDetail({ params }: GigDetailProps) {
  const router = useRouter()
  const { gigs, loading, fetchGigs, updateGig } = useGigs()
  const [editing, setEditing] = useState(false)
  const gig = gigs.find((g) => g.id === params.id)

  useEffect(() => {
    fetchGigs()
  }, [fetchGigs])

  const handleUpdate = useCallback(
    async (data: Record<string, unknown>) => {
      await updateGig(params.id, data as Partial<GigListing>)
      setEditing(false)
    },
    [params.id, updateGig]
  )

  if (loading && !gig) {
    return (
      <>
        <Header title="Gig Detail" description="Loading..." />
        <PageContainer>
          <div className="mx-auto max-w-4xl"><CardSkeleton /></div>
        </PageContainer>
      </>
    )
  }

  if (!gig) {
    return (
      <>
        <Header title="Gig Not Found" description="" />
        <PageContainer>
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-muted-foreground">This gig could not be found.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/gigs")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gigs
            </Button>
          </div>
        </PageContainer>
      </>
    )
  }

  if (editing) {
    return (
      <>
        <Header title="Edit Gig" description={gig.title} />
        <PageContainer>
          <div className="mx-auto max-w-2xl">
            <GigForm
              initialData={gig}
              platforms={SEED_PLATFORMS.map((p) => ({ id: p.name, name: p.name }))}
              pillars={SERVICE_PILLARS.map((p) => ({ id: p.name, name: p.name, color: p.color }))}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(false)}
            />
          </div>
        </PageContainer>
      </>
    )
  }

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400",
    draft: "bg-zinc-500/20 text-zinc-400",
    paused: "bg-amber-500/20 text-amber-400",
    archived: "bg-red-500/20 text-red-400",
  }

  return (
    <>
      <Header
        title={gig.title}
        description={`${gig.status.charAt(0).toUpperCase() + gig.status.slice(1)} — Last updated ${formatDate(gig.updated_at)}`}
      />
      <PageContainer>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.push("/gigs")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gigs
            </Button>
            <div className="flex gap-2">
              {gig.gig_url && (
                <a
                  href={gig.gig_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> View Listing
                </a>
              )}
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className={statusColors[gig.status]}>{gig.status}</Badge>
            {gig.tags.map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>

          <Tabs defaultValue="performance">
            <TabsList>
              <TabsTrigger value="performance" className="gap-1.5">
                <BarChart3 className="h-4 w-4" /> Performance
              </TabsTrigger>
              <TabsTrigger value="pricing" className="gap-1.5">
                <Settings className="h-4 w-4" /> Pricing
              </TabsTrigger>
              <TabsTrigger value="versions" className="gap-1.5">
                <History className="h-4 w-4" /> Version History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="mt-6">
              <GigPerformanceStats
                impressions={gig.impressions ?? 0}
                clicks={gig.clicks ?? 0}
                orders={gig.orders ?? 0}
                conversionRate={gig.clicks ? (gig.orders ?? 0) / gig.clicks : 0}
                revenueTotal={gig.revenue_total ?? 0}
              />
            </TabsContent>

            <TabsContent value="pricing" className="mt-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Pricing Tiers</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {(["basic", "standard", "premium"] as const).map((tier) => {
                      const price = gig[`pricing_${tier}`]
                      const days = gig[`delivery_days_${tier}`]
                      return (
                        <div key={tier} className="rounded-lg border border-border p-4">
                          <p className="text-xs font-medium uppercase text-muted-foreground">{tier}</p>
                          <p className="mt-1 text-2xl font-bold">
                            {price ? formatCurrency(price) : "—"}
                          </p>
                          {days && <p className="text-xs text-muted-foreground">{days} day delivery</p>}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="versions" className="mt-6">
              <GigVersionHistory versions={[]} />
            </TabsContent>
          </Tabs>

          {gig.description && (
            <Card>
              <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{gig.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </PageContainer>
    </>
  )
}
