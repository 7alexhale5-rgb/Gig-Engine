"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  Zap,
  Copy,
  Check,
  Plus,
  Trash2,
  Loader2,
  Timer,
  Send,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { SERVICE_PILLARS, type ServicePillarDefinition } from "@/lib/utils/constants"
import { SEED_PLATFORMS } from "@/data/seed-platforms"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuickFireTemplate {
  id: string
  name: string
  pillar_id: string | null
  template_text: string
}

export interface QuickFirePlatform {
  id: string
  name: string
}

export interface QueueItem {
  id: string
  title: string
  url?: string
  pillar?: string
  status: "pending" | "generating" | "done"
  generatedText?: string
}

const DEFAULT_PLATFORMS: QuickFirePlatform[] = SEED_PLATFORMS.map((p) => ({
  id: p.name,
  name: p.name,
}))

export interface QuickFirePanelProps {
  templates: QuickFireTemplate[]
  platforms?: QuickFirePlatform[]
  pillars?: ServicePillarDefinition[]
  className?: string
}

// ---------------------------------------------------------------------------
// Session timer hook
// ---------------------------------------------------------------------------

function useSessionTimer() {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  const start = useCallback(() => setIsRunning(true), [])
  const stop = useCallback(() => setIsRunning(false), [])
  const reset = useCallback(() => {
    setIsRunning(false)
    setSeconds(0)
  }, [])

  const formatted = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`

  return { seconds, formatted, isRunning, start, stop, reset }
}

// ---------------------------------------------------------------------------
// Mock quick-fire generation
// ---------------------------------------------------------------------------

function generateQuickProposal(title: string, pillar?: string): string {
  const pillarNote = pillar ? ` specializing in ${pillar}` : ""
  return `Hi,

Your project "${title}" caught my attention. I am an experienced freelancer${pillarNote} and would love to help deliver this.

My approach:
1. Quick discovery to confirm requirements
2. Rapid implementation with daily updates
3. Testing, documentation, and handoff

Happy to discuss scope and timeline. Looking forward to hearing from you.

[Mock proposal - connect AI API for real generation]`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuickFirePanel({
  templates,
  platforms = DEFAULT_PLATFORMS,
  pillars = SERVICE_PILLARS,
  className,
}: QuickFirePanelProps) {
  // Input state
  const [jobTitle, setJobTitle] = useState("")
  const [jobUrl, setJobUrl] = useState("")
  const [selectedPillar, setSelectedPillar] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState("")

  // Queue
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [proposalsSentToday, setProposalsSentToday] = useState(0)

  // Current output
  const [currentOutput, setCurrentOutput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Session timer
  const timer = useSessionTimer()

  // Auto-select template based on pillar
  useEffect(() => {
    if (!selectedPillar) return
    const matchingTemplate = templates.find((t) => {
      // Match by pillar_id or name if pillar_id is null
      return t.pillar_id === selectedPillar || t.name.includes(selectedPillar)
    })
    if (matchingTemplate) {
      setSelectedTemplateId(matchingTemplate.id)
    }
  }, [selectedPillar, templates])

  const handleAddToQueue = useCallback(() => {
    if (!jobTitle.trim()) return
    const item: QueueItem = {
      id: crypto.randomUUID(),
      title: jobTitle.trim(),
      url: jobUrl.trim() || undefined,
      pillar: selectedPillar || undefined,
      status: "pending",
    }
    setQueue((prev) => [...prev, item])
    setJobTitle("")
    setJobUrl("")

    // Start timer on first queue addition
    if (!timer.isRunning) timer.start()
  }, [jobTitle, jobUrl, selectedPillar, timer])

  const handleRemoveFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const handleGenerateForItem = useCallback(
    async (id: string) => {
      setQueue((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "generating" as const } : item
        )
      )
      setIsGenerating(true)

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1200))

      const item = queue.find((q) => q.id === id)
      const text = generateQuickProposal(
        item?.title ?? "Untitled",
        item?.pillar
      )

      setQueue((prev) =>
        prev.map((q) =>
          q.id === id
            ? { ...q, status: "done" as const, generatedText: text }
            : q
        )
      )
      setCurrentOutput(text)
      setIsGenerating(false)
      setProposalsSentToday((c) => c + 1)
    },
    [queue]
  )

  const handleQuickGenerate = useCallback(async () => {
    if (!jobTitle.trim()) return

    setIsGenerating(true)
    if (!timer.isRunning) timer.start()

    await new Promise((resolve) => setTimeout(resolve, 1200))

    const text = generateQuickProposal(jobTitle, selectedPillar || undefined)
    setCurrentOutput(text)
    setIsGenerating(false)
    setProposalsSentToday((c) => c + 1)
    setJobTitle("")
    setJobUrl("")
  }, [jobTitle, selectedPillar, timer])

  const handleCopy = useCallback(async () => {
    if (!currentOutput) return
    try {
      await navigator.clipboard.writeText(currentOutput)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard may be unavailable
    }
  }, [currentOutput])

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6",
        className
      )}
    >
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-400" />
          <h2 className="text-base font-semibold">Quick-Fire Mode</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Send className="h-3.5 w-3.5" />
            <span className="font-mono font-bold text-foreground">
              {proposalsSentToday}
            </span>
            <span>sent today</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Timer className="h-3.5 w-3.5" />
            <span className="font-mono font-bold text-foreground">
              {timer.formatted}
            </span>
            {timer.isRunning ? (
              <button
                onClick={timer.stop}
                className="text-[10px] text-red-400 hover:text-red-300"
              >
                pause
              </button>
            ) : (
              <button
                onClick={timer.isRunning ? timer.stop : timer.start}
                className="text-[10px] text-emerald-400 hover:text-emerald-300"
              >
                {timer.seconds > 0 ? "resume" : "start"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compact Input */}
      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="qf-title" className="text-xs">
            Job Title
          </Label>
          <Input
            id="qf-title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. n8n Automation Expert Needed"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) {
                handleQuickGenerate()
              }
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qf-url" className="text-xs">
            Job URL (optional)
          </Label>
          <Input
            id="qf-url"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Pillar</Label>
            <Select
              value={selectedPillar}
              onValueChange={setSelectedPillar}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Auto-detect..." />
              </SelectTrigger>
              <SelectContent>
                {pillars.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Template</Label>
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Auto-select..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleQuickGenerate}
            disabled={!jobTitle.trim() || isGenerating}
            className="flex-1 gap-1.5"
            size="sm"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Generate
          </Button>
          <Button
            variant="outline"
            onClick={handleAddToQueue}
            disabled={!jobTitle.trim()}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Queue
          </Button>
        </div>
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Queue ({queue.length})
            </span>
          </div>
          <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
            {queue.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center justify-between rounded-md border px-3 py-2",
                  item.status === "done"
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : item.status === "generating"
                      ? "border-amber-500/20 bg-amber-500/5"
                      : "border-border bg-background"
                )}
              >
                <div className="flex-1 truncate">
                  <span className="text-xs font-medium">{item.title}</span>
                  {item.pillar && (
                    <span className="ml-2 text-[10px] text-muted-foreground">
                      {item.pillar}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 pl-2">
                  {item.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGenerateForItem(item.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Zap className="h-3 w-3" />
                    </Button>
                  )}
                  {item.status === "generating" && (
                    <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
                  )}
                  {item.status === "done" && (
                    <Check className="h-3 w-3 text-emerald-400" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFromQueue(item.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Output */}
      <div className="mt-4 rounded-lg border border-dashed border-border p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Output
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!currentOutput}
            className="h-6 gap-1 px-1.5 text-[10px]"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </Button>
        </div>

        {isGenerating ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : currentOutput ? (
          <div className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-foreground">
            {currentOutput}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Generate a proposal to see output here...
          </p>
        )}
      </div>
    </div>
  )
}
