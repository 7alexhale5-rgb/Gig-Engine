"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate, formatHours } from "@/lib/utils/formatters"
import { calculateEffectiveHourlyRate } from "@/lib/utils/calculations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Clock,
  Plus,
  Trash2,
  DollarSign,
  Timer,
} from "lucide-react"
import type { TimeEntry } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Quick-add hour presets
// ---------------------------------------------------------------------------

const QUICK_HOURS: number[] = [0.5, 1, 2, 4, 8]

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
// Component
// ---------------------------------------------------------------------------

interface TimeTrackerProps {
  entries: TimeEntry[]
  contractValue?: number
  onAddEntry: (entry: TimeEntry) => void
  onRemoveEntry: (id: string) => void
  className?: string
}

export function TimeTracker({
  entries,
  contractValue,
  onAddEntry,
  onRemoveEntry,
  className,
}: TimeTrackerProps) {
  const [date, setDate] = useState(getTodayString)
  const [hours, setHours] = useState("")
  const [description, setDescription] = useState("")

  // Sort entries by date descending
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Total hours
  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0)

  // Effective hourly rate
  const effectiveRate =
    contractValue !== undefined
      ? calculateEffectiveHourlyRate(contractValue, totalHours)
      : null

  // Add entry from the form
  const addEntry = useCallback(() => {
    const parsedHours = parseFloat(hours)
    const trimmedDescription = description.trim()
    if (isNaN(parsedHours) || parsedHours <= 0 || !trimmedDescription) return

    const entry: TimeEntry = {
      id: generateId(),
      date,
      hours: parsedHours,
      description: trimmedDescription,
    }
    onAddEntry(entry)
    setHours("")
    setDescription("")
  }, [date, hours, description, onAddEntry])

  // Quick-add a preset number of hours
  const quickAdd = useCallback(
    (presetHours: number) => {
      setHours(String(presetHours))
    },
    []
  )

  // Handle Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        addEntry()
      }
    },
    [addEntry]
  )

  return (
    <div className={cn("space-y-5", className)}>
      {/* Summary header */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
          <Timer className="h-4 w-4 text-blue-400" />
          <div>
            <p className="text-xs text-muted-foreground">Total Hours</p>
            <p className="text-lg font-bold">{formatHours(totalHours)}</p>
          </div>
        </div>

        {contractValue !== undefined && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
            <DollarSign className="h-4 w-4 text-green-400" />
            <div>
              <p className="text-xs text-muted-foreground">Contract Value</p>
              <p className="text-lg font-bold">{formatCurrency(contractValue)}</p>
            </div>
          </div>
        )}

        {effectiveRate !== null && effectiveRate > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
            <Clock className="h-4 w-4 text-amber-400" />
            <div>
              <p className="text-xs text-muted-foreground">Effective Rate</p>
              <p className="text-lg font-bold">{formatCurrency(effectiveRate)}/hr</p>
            </div>
          </div>
        )}
      </div>

      {/* Add entry form */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">Log Time</p>

        <div className="grid gap-3 sm:grid-cols-[140px_100px_1fr]">
          <div className="space-y-1.5">
            <Label htmlFor="time-date">Date</Label>
            <Input
              id="time-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="time-hours">Hours</Label>
            <Input
              id="time-hours"
              type="number"
              step="0.25"
              min="0.25"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="time-description">Description</Label>
            <Input
              id="time-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What did you work on?"
            />
          </div>
        </div>

        {/* Quick-add buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Quick:</span>
          {QUICK_HOURS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={hours === String(preset) ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => quickAdd(preset)}
            >
              {formatHours(preset)}
            </Button>
          ))}
        </div>

        <Button
          type="button"
          size="sm"
          onClick={addEntry}
          disabled={
            !hours ||
            isNaN(parseFloat(hours)) ||
            parseFloat(hours) <= 0 ||
            !description.trim()
          }
        >
          <Plus className="mr-1 h-4 w-4" />
          Log Entry
        </Button>
      </div>

      {/* Entries table */}
      {sortedEntries.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="w-[80px]">Hours</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-muted-foreground">
                  {formatDate(entry.date)}
                </TableCell>
                <TableCell className="font-medium">
                  {formatHours(entry.hours)}
                </TableCell>
                <TableCell>{entry.description}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onRemoveEntry(entry.id)}
                    className="rounded p-1 text-muted-foreground transition-colors hover:text-red-400"
                    aria-label={`Remove time entry: ${entry.description}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No time entries yet. Log your first hours above.
        </p>
      )}
    </div>
  )
}
