"use client"

import { useState, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/formatters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Mail,
  MessageSquare,
  Phone,
  MessagesSquare,
  FileText,
  Plus,
  Filter,
} from "lucide-react"
import type { CommunicationLog as CommunicationLogEntry } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Channel configuration
// ---------------------------------------------------------------------------

type Channel = CommunicationLogEntry["channel"]

const CHANNEL_CONFIG: Record<
  Channel,
  { label: string; icon: typeof Mail; color: string }
> = {
  email: {
    label: "Email",
    icon: Mail,
    color: "bg-blue-500/15 text-blue-400",
  },
  slack: {
    label: "Slack",
    icon: MessageSquare,
    color: "bg-purple-500/15 text-purple-400",
  },
  call: {
    label: "Call",
    icon: Phone,
    color: "bg-green-500/15 text-green-400",
  },
  platform_message: {
    label: "Platform",
    icon: MessagesSquare,
    color: "bg-amber-500/15 text-amber-400",
  },
  other: {
    label: "Other",
    icon: FileText,
    color: "bg-zinc-500/15 text-zinc-400",
  },
}

const ALL_CHANNELS: Channel[] = [
  "email",
  "slack",
  "call",
  "platform_message",
  "other",
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return crypto.randomUUID()
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0]
}

// ---------------------------------------------------------------------------
// Add Entry Form
// ---------------------------------------------------------------------------

interface AddEntryFormProps {
  onAdd: (entry: CommunicationLogEntry) => void
  onCancel: () => void
}

function AddEntryForm({ onAdd, onCancel }: AddEntryFormProps) {
  const [date, setDate] = useState(getTodayString)
  const [channel, setChannel] = useState<Channel>("email")
  const [summary, setSummary] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = summary.trim()
    if (!trimmed) return

    const entry: CommunicationLogEntry = {
      id: generateId(),
      date,
      channel,
      summary: trimmed,
    }
    onAdd(entry)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-[140px_160px]">
        <div className="space-y-1.5">
          <Label htmlFor="comm-date">Date</Label>
          <Input
            id="comm-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="comm-channel">Channel</Label>
          <Select
            value={channel}
            onValueChange={(val) => setChannel(val as Channel)}
          >
            <SelectTrigger id="comm-channel">
              <SelectValue placeholder="Select channel" />
            </SelectTrigger>
            <SelectContent>
              {ALL_CHANNELS.map((ch) => (
                <SelectItem key={ch} value={ch}>
                  {CHANNEL_CONFIG[ch].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="comm-summary">Summary</Label>
        <Textarea
          id="comm-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Brief summary of the communication..."
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={!summary.trim()}>
          <Plus className="mr-1 h-4 w-4" />
          Add Entry
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Communication Log Component
// ---------------------------------------------------------------------------

interface CommunicationLogProps {
  entries: CommunicationLogEntry[]
  onAdd: (entry: CommunicationLogEntry) => void
  className?: string
}

export function CommunicationLog({
  entries,
  onAdd,
  className,
}: CommunicationLogProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterChannel, setFilterChannel] = useState<Channel | "all">("all")

  // Sort entries by date descending
  const sortedEntries = useMemo(() => {
    const filtered =
      filterChannel === "all"
        ? entries
        : entries.filter((entry) => entry.channel === filterChannel)

    return [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [entries, filterChannel])

  const handleAdd = useCallback(
    (entry: CommunicationLogEntry) => {
      onAdd(entry)
      setShowAddForm(false)
    },
    [onAdd]
  )

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Communication Log ({entries.length})
        </span>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilterChannel("all")}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                filterChannel === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            {ALL_CHANNELS.map((ch) => {
              const config = CHANNEL_CONFIG[ch]
              const count = entries.filter((e) => e.channel === ch).length
              if (count === 0) return null
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setFilterChannel(ch)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                    filterChannel === ch
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {config.label} ({count})
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Entry list */}
      {sortedEntries.length > 0 ? (
        <ul className="space-y-3">
          {sortedEntries.map((entry) => {
            const config = CHANNEL_CONFIG[entry.channel]
            const IconComponent = config.icon
            return (
              <li
                key={entry.id}
                className="flex gap-3 rounded-lg border border-border bg-card p-3"
              >
                {/* Channel icon */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    config.color
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", config.color)}
                    >
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-foreground">
                    {entry.summary}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {filterChannel === "all"
            ? "No communication entries yet. Log your first client interaction."
            : `No ${CHANNEL_CONFIG[filterChannel].label.toLowerCase()} entries found.`}
        </p>
      )}

      {/* Add entry */}
      {showAddForm ? (
        <AddEntryForm
          onAdd={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Log Communication
        </Button>
      )}
    </div>
  )
}
