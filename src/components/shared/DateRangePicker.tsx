"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"

interface DateRangePickerProps {
  onRangeChange?: (range: { from: string; to: string }) => void
}

export function DateRangePicker({ onRangeChange }: DateRangePickerProps) {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "custom">("30d")

  return (
    <div className="flex items-center gap-1.5">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      {(["7d", "30d", "90d"] as const).map((r) => (
        <button
          key={r}
          onClick={() => setRange(r)}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            range === r
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  )
}
