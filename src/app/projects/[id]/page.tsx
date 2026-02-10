"use client"

import { use, useState } from "react"
import { Header, PageContainer } from "@/components/layout"
import { DeliveryChecklist, MilestoneTracker, TimeTracker, CommunicationLog } from "@/components/projects"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CheckSquare, Clock, Milestone, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Project, ChecklistItem, Milestone as MilestoneType, TimeEntry, CommunicationLog as CommLogType } from "@/lib/supabase/types"

interface ProjectDetailProps {
  params: Promise<{ id: string }>
}

export default function ProjectDetail({ params }: ProjectDetailProps) {
  const { id } = use(params)
  const router = useRouter()

  // Placeholder data until Supabase is connected
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [milestones, setMilestones] = useState<MilestoneType[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [commLog, setCommLog] = useState<CommLogType[]>([])

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400",
    paused: "bg-amber-500/20 text-amber-400",
    completed: "bg-blue-500/20 text-blue-400",
    cancelled: "bg-red-500/20 text-red-400",
  }

  return (
    <>
      <Header
        title="Project Detail"
        description="Delivery checklist, time tracking, and client communication"
      />
      <PageContainer>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.push("/projects")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
            </Button>
            <Badge className={statusColors.active}>Active</Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Project: {id.slice(0, 8)}...</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Connect Supabase to load project details.
            </CardContent>
          </Card>

          <Tabs defaultValue="checklist">
            <TabsList>
              <TabsTrigger value="checklist" className="gap-1.5">
                <CheckSquare className="h-4 w-4" /> Checklist
              </TabsTrigger>
              <TabsTrigger value="milestones" className="gap-1.5">
                <Milestone className="h-4 w-4" /> Milestones
              </TabsTrigger>
              <TabsTrigger value="time" className="gap-1.5">
                <Clock className="h-4 w-4" /> Time
              </TabsTrigger>
              <TabsTrigger value="comms" className="gap-1.5">
                <MessageSquare className="h-4 w-4" /> Communication
              </TabsTrigger>
            </TabsList>

            <TabsContent value="checklist" className="mt-6">
              <DeliveryChecklist
                items={checklist}
                onUpdate={setChecklist}
              />
            </TabsContent>

            <TabsContent value="milestones" className="mt-6">
              <MilestoneTracker
                milestones={milestones}
                onUpdate={setMilestones}
              />
            </TabsContent>

            <TabsContent value="time" className="mt-6">
              <TimeTracker
                entries={timeEntries}
                onAddEntry={(entry) => setTimeEntries((prev) => [entry, ...prev])}
                onRemoveEntry={(id) => setTimeEntries((prev) => prev.filter((e) => e.id !== id))}
              />
            </TabsContent>

            <TabsContent value="comms" className="mt-6">
              <CommunicationLog
                entries={commLog}
                onAdd={(entry) => setCommLog((prev) => [entry, ...prev])}
              />
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </>
  )
}
