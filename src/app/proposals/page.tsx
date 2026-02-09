"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo } from "react"
import { Header, PageContainer } from "@/components/layout"
import { ProposalGenerator, QuickFirePanel } from "@/components/proposals"
import { TemplateCard } from "@/components/proposals/TemplateCard"
import type { TemplateCardData } from "@/components/proposals/TemplateCard"
import { useProposals } from "@/lib/hooks/useProposals"
import { Zap, FileText } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SERVICE_PILLARS } from "@/lib/utils/constants"
import { SEED_PLATFORMS } from "@/data/seed-platforms"

// ---------------------------------------------------------------------------
// Platform options derived from seed data
// ---------------------------------------------------------------------------

const PLATFORM_OPTIONS = SEED_PLATFORMS.map((p, i) => ({
  id: `platform-${i}`,
  name: p.name,
}))

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProposalsPage() {
  const { templates, loading, fetchTemplates } = useProposals()

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const templateCards: TemplateCardData[] = useMemo(
    () =>
      templates.map((t) => ({
        id: t.id,
        name: t.name,
        pillarName: t.pillar_id,
        platformName: t.platform_id,
        templateText: t.template_text,
        timesUsed: t.times_used,
        timesWon: t.times_won,
        winRate: t.win_rate,
        variables: t.variables,
        tags: t.tags,
      })),
    [templates]
  )

  const quickFireTemplates = useMemo(
    () =>
      templates.map((t) => ({
        id: t.id,
        name: t.name,
        pillar_id: t.pillar_id,
        template_text: t.template_text,
      })),
    [templates]
  )

  const generatorTemplates = useMemo(
    () =>
      templates.map((t) => ({
        id: t.id,
        name: t.name,
        pillar_id: t.pillar_id,
        platform_id: t.platform_id,
        template_text: t.template_text,
        variables: t.variables,
      })),
    [templates]
  )

  return (
    <>
      <Header
        title="Proposal Engine"
        description="Generate, manage, and track proposals"
      />
      <PageContainer>
        <Tabs defaultValue="quickfire" className="w-full">
          <TabsList>
            <TabsTrigger value="quickfire" className="gap-1.5">
              <Zap className="h-4 w-4" />
              Quick-Fire Mode
            </TabsTrigger>
            <TabsTrigger value="generator" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Full Generator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quickfire" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <QuickFirePanel
                  templates={quickFireTemplates}
                  platforms={PLATFORM_OPTIONS}
                  pillars={SERVICE_PILLARS}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Templates</h3>
                  <Link
                    href="/proposals/templates"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View All
                  </Link>
                </div>
                <div className="mt-3 space-y-3">
                  {templateCards.slice(0, 3).map((card) => (
                    <TemplateCard key={card.id} template={card} />
                  ))}
                  {templates.length === 0 && !loading && (
                    <p className="text-sm text-muted-foreground">
                      No templates yet. Create one to get started.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="generator" className="mt-6">
            <ProposalGenerator
              templates={generatorTemplates}
              platforms={PLATFORM_OPTIONS}
            />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  )
}
