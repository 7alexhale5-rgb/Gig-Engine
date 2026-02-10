"use client"

import { useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils/formatters"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeeklyDataPoint {
  day: string
  proposals: number
  revenue: number
}

export interface WeeklyTrendProps {
  currentWeek: WeeklyDataPoint[]
  previousWeek: WeeklyDataPoint[]
  height?: number
  className?: string
}

type ViewMode = "proposals" | "revenue"

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

interface TrendTooltipPayloadItem {
  value: number
  dataKey: string
  stroke: string
  strokeDasharray?: string
}

interface TrendTooltipProps {
  active?: boolean
  payload?: TrendTooltipPayloadItem[]
  label?: string
  viewMode: ViewMode
}

function TrendTooltip({ active, payload, label, viewMode }: TrendTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-xl">
      <p className="mb-2 text-xs font-medium text-zinc-400">{label}</p>
      {payload.map((entry) => {
        const isCurrent = entry.dataKey === "currentValue"
        const formattedValue =
          viewMode === "revenue"
            ? formatCurrency(entry.value)
            : String(entry.value)
        return (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.stroke }}
            />
            <span className="text-xs text-zinc-400">
              {isCurrent ? "This week" : "Last week"}:
            </span>
            <span className="text-sm font-semibold text-zinc-100">
              {formattedValue}
              {viewMode === "proposals" ? " proposals" : ""}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAxisValue(value: number, viewMode: ViewMode): string {
  if (viewMode === "revenue") {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
    }
    return `$${value}`
  }
  return String(value)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WeeklyTrend({
  currentWeek,
  previousWeek,
  height = 300,
  className,
}: WeeklyTrendProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("proposals")

  const hasData = currentWeek.length > 0 || previousWeek.length > 0

  if (!hasData) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-6",
          className
        )}
      >
        <h3 className="text-sm font-semibold">Weekly Trend</h3>
        <div
          className="mt-4 flex items-center justify-center text-sm text-muted-foreground"
          style={{ height }}
        >
          No weekly data available.
        </div>
      </div>
    )
  }

  // Merge both weeks into a unified dataset
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const mergedData = days.map((day) => {
    const current = currentWeek.find((d) => d.day === day)
    const previous = previousWeek.find((d) => d.day === day)

    const currentValue =
      viewMode === "proposals"
        ? current?.proposals ?? 0
        : current?.revenue ?? 0
    const previousValue =
      viewMode === "proposals"
        ? previous?.proposals ?? 0
        : previous?.revenue ?? 0

    return { day, currentValue, previousValue }
  })

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Weekly Trend</h3>
        <div className="flex rounded-md border border-zinc-700 overflow-hidden">
          <button
            onClick={() => setViewMode("proposals")}
            className={cn(
              "px-3 py-1 text-xs font-medium transition-colors",
              viewMode === "proposals"
                ? "bg-zinc-700 text-zinc-100"
                : "bg-transparent text-zinc-400 hover:text-zinc-300"
            )}
          >
            Proposals
          </button>
          <button
            onClick={() => setViewMode("revenue")}
            className={cn(
              "px-3 py-1 text-xs font-medium transition-colors",
              viewMode === "revenue"
                ? "bg-zinc-700 text-zinc-100"
                : "bg-transparent text-zinc-400 hover:text-zinc-300"
            )}
          >
            Revenue
          </button>
        </div>
      </div>

      <div className="mt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={mergedData}
            margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#3f3f46"
              vertical={false}
            />

            <XAxis
              dataKey="day"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
              dy={8}
            />

            <YAxis
              tickFormatter={(value: number) =>
                formatAxisValue(value, viewMode)
              }
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dx={-4}
              width={56}
              allowDecimals={false}
            />

            <Tooltip
              content={
                <TrendTooltip viewMode={viewMode} />
              }
              cursor={{ stroke: "#52525b", strokeWidth: 1 }}
            />

            {/* Previous week - dashed line */}
            <Line
              type="monotone"
              dataKey="previousValue"
              stroke="#71717a"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{
                r: 3,
                fill: "#3f3f46",
                stroke: "#71717a",
                strokeWidth: 1.5,
              }}
              activeDot={{
                r: 4,
                fill: "#71717a",
                stroke: "#1e1e2e",
                strokeWidth: 2,
              }}
              animationDuration={1000}
            />

            {/* Current week - solid line */}
            <Line
              type="monotone"
              dataKey="currentValue"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{
                r: 3,
                fill: "#1e1e2e",
                stroke: "#3B82F6",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill: "#3B82F6",
                stroke: "#1e1e2e",
                strokeWidth: 2,
              }}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-zinc-400">
        <span className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-5 rounded bg-[#3B82F6]" />
          This week
        </span>
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-0.5 w-5 rounded"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, #71717a 0, #71717a 4px, transparent 4px, transparent 7px)",
            }}
          />
          Last week
        </span>
      </div>
    </div>
  )
}
