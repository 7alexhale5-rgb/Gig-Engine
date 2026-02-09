"use client"

import { useState, useCallback } from "react"
import { Wand2, Copy, Check, Save, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { SERVICE_PILLARS } from "@/lib/utils/constants"
import { SEED_PLATFORMS } from "@/data/seed-platforms"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProposalTemplate {
  id: string
  name: string
  pillar_id: string | null
  platform_id: string | null
  template_text: string
  variables: string[]
}

export interface PlatformOption {
  id: string
  name: string
}

export type ProposalTone = "professional" | "casual" | "technical"

const DEFAULT_PLATFORMS: PlatformOption[] = SEED_PLATFORMS.map((p) => ({
  id: p.name,
  name: p.name,
}))

export interface ProposalGeneratorProps {
  templates: ProposalTemplate[]
  platforms?: PlatformOption[]
  onSaveAsTemplate?: (text: string) => void
  className?: string
}

// ---------------------------------------------------------------------------
// Tone options
// ---------------------------------------------------------------------------

const TONE_OPTIONS: { value: ProposalTone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "technical", label: "Technical" },
]

// ---------------------------------------------------------------------------
// Word count slider stops
// ---------------------------------------------------------------------------

const MIN_WORDS = 100
const MAX_WORDS = 500
const DEFAULT_WORDS = 200

// ---------------------------------------------------------------------------
// Mock generation (AI API not connected yet)
// ---------------------------------------------------------------------------

function generateMockProposal(
  jobDescription: string,
  template: ProposalTemplate | undefined,
  tone: ProposalTone,
  maxWords: number
): string {
  const toneNote =
    tone === "professional"
      ? "with a polished, professional tone"
      : tone === "casual"
        ? "in a friendly, conversational style"
        : "with deep technical detail"

  const templateNote = template
    ? `Based on template "${template.name}"`
    : "No template selected"

  return `[AI-Generated Proposal Preview]

${templateNote}, ${toneNote}, targeting ~${maxWords} words.

---

Hi there,

I reviewed your project requirements and I am confident I can deliver exactly what you need. Here is my approach:

${jobDescription.slice(0, 120)}${jobDescription.length > 120 ? "..." : ""}

Based on my experience, I would break this into clear phases:

1. Discovery & scoping to align on requirements
2. Implementation with regular check-ins
3. Testing, documentation, and handoff

I have delivered similar projects across multiple platforms and understand the nuances of this type of work. Happy to discuss timeline and specifics on a quick call.

Looking forward to hearing from you.

---

[This is a mock proposal. Connect the AI API (Anthropic Edge Function) to generate real proposals.]`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProposalGenerator({
  templates,
  platforms = DEFAULT_PLATFORMS,
  onSaveAsTemplate,
  className,
}: ProposalGeneratorProps) {
  // Form state
  const [jobDescription, setJobDescription] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [selectedPlatformId, setSelectedPlatformId] = useState("")
  const [selectedPillar, setSelectedPillar] = useState("")
  const [tone, setTone] = useState<ProposalTone>("professional")
  const [maxWords, setMaxWords] = useState(DEFAULT_WORDS)

  // Output state
  const [generatedText, setGeneratedText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  const handleGenerate = useCallback(async () => {
    if (!jobDescription.trim()) return

    setIsGenerating(true)
    setGeneratedText("")

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const result = generateMockProposal(
      jobDescription,
      selectedTemplate,
      tone,
      maxWords
    )
    setGeneratedText(result)
    setIsGenerating(false)
  }, [jobDescription, selectedTemplate, tone, maxWords])

  const handleCopy = useCallback(async () => {
    if (!generatedText) return
    try {
      await navigator.clipboard.writeText(generatedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API may fail in some environments
    }
  }, [generatedText])

  const handleSaveAsTemplate = useCallback(() => {
    if (generatedText && onSaveAsTemplate) {
      onSaveAsTemplate(generatedText)
    }
  }, [generatedText, onSaveAsTemplate])

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Wand2 className="h-5 w-5 text-pillar-ai" />
        <h2 className="text-base font-semibold">Proposal Generator</h2>
      </div>

      <div className="mt-4 space-y-4">
        {/* Job Description */}
        <div className="space-y-1.5">
          <Label htmlFor="job-description">Job Description</Label>
          <Textarea
            id="job-description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job posting here..."
            rows={6}
            className="resize-y"
          />
        </div>

        {/* Template Selection */}
        <div className="space-y-1.5">
          <Label>Template</Label>
          <Select
            value={selectedTemplateId}
            onValueChange={setSelectedTemplateId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a template..." />
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

        {/* Platform & Pillar Row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Platform</Label>
            <Select
              value={selectedPlatformId}
              onValueChange={setSelectedPlatformId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform..." />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Service Pillar</Label>
            <Select value={selectedPillar} onValueChange={setSelectedPillar}>
              <SelectTrigger>
                <SelectValue placeholder="Select pillar..." />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_PILLARS.map((pillar) => (
                  <SelectItem key={pillar.name} value={pillar.name}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: pillar.color }}
                      />
                      {pillar.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tone & Max Words Row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <Select
              value={tone}
              onValueChange={(v) => setTone(v as ProposalTone)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="max-words">
              Max Words: <span className="font-bold">{maxWords}</span>
            </Label>
            <input
              id="max-words"
              type="range"
              min={MIN_WORDS}
              max={MAX_WORDS}
              step={25}
              value={maxWords}
              onChange={(e) => setMaxWords(Number(e.target.value))}
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-primary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{MIN_WORDS}</span>
              <span>{MAX_WORDS}</span>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!jobDescription.trim() || isGenerating}
          className="w-full gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Generate Proposal
            </>
          )}
        </Button>
      </div>

      {/* Output Area */}
      <div className="mt-6 rounded-lg border border-dashed border-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Generated Proposal
          </span>
          <div className="flex gap-2">
            {onSaveAsTemplate && generatedText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveAsTemplate}
                className="h-7 gap-1 px-2 text-xs"
              >
                <Save className="h-3 w-3" />
                Save as Template
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={!generatedText}
              className="h-7 gap-1 px-2 text-xs"
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
        </div>

        {isGenerating ? (
          <div className="mt-4 flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : generatedText ? (
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {generatedText}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Generated proposal will appear here...
          </p>
        )}
      </div>
    </div>
  )
}
