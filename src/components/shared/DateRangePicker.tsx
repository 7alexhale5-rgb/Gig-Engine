"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"

type RangePreset = "7d" | "30d" | "90d"

export interface DateRangePickerProps {
  /** Controlled value (optional). */
  value?: RangePreset
  /** Controlled change handler (optional). */
  onChange?: (range: RangePreset) => void
  /** Callback with computed date boundaries (optional). */
  onRangeChange?: (range: { from: string; to: string }) => void
}

export function DateRangePicker({ value, onChange, onRangeChange }: DateRangePickerProps) {
  const [internalRange, setInternalRange] = useState<RangePreset>("30d")
  const range = value ?? internalRange

  const handleChange = (r: RangePreset) => {
    if (onChange) {
      onChange(r)
    } else {
      setInternalRange(r)
    }
    onRangeChange?.({ from: "", to: "" })
  }

  return (
    <div className="flex items-center gap-1.5">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      {(["7d", "30d", "90d"] as const).map((r) => (
        <button
          key={r}
          onClick={() => handleChange(r)}
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
