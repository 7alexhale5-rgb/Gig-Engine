"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { cn } from "@/lib/utils"
import { formatCurrency, formatPercentage } from "@/lib/utils/formatters"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlatformComparisonDataPoint {
  platform: string
  revenue: number
  winRate: number
  avgContract: number
  proposals: number
}

export interface PlatformComparisonProps {
  data: PlatformComparisonDataPoint[]
  height?: number
  className?: string
}

// ---------------------------------------------------------------------------
// Platform color map — consistent with PlatformBadge
// ---------------------------------------------------------------------------

const PLATFORM_COLORS: Record<string, string> = {
  Upwork: "#22c55e",
  Fiverr: "#10b981",
  Toptal: "#3b82f6",
  "Arc.dev": "#8b5cf6",
  PeoplePerHour: "#f97316",
  Guru: "#0ea5e9",
  "LinkedIn Services": "#60a5fa",
  "Direct/Referral": "#a1a1aa",
}

// Bar colors for grouped metrics
const METRIC_COLORS = {
  revenue: "#3B82F6",
  winRate: "#10B981",
  avgContract: "#8B5CF6",
  proposals: "#F59E0B",
} as const

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

interface ComparisonTooltipPayloadItem {
  value: number
  dataKey: string
  name: string
  color: string
}

interface ComparisonTooltipProps {
  active?: boolean
  payload?: ComparisonTooltipPayloadItem[]
  label?: string
}

function ComparisonTooltip({
  active,
  payload,
  label,
}: ComparisonTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-xl">
      <p className="mb-2 text-xs font-semibold text-zinc-300">{label}</p>
      {payload.map((entry) => {
        let formattedValue: string
        if (entry.dataKey === "revenue" || entry.dataKey === "avgContract") {
          formattedValue = formatCurrency(entry.value)
        } else if (entry.dataKey === "winRate") {
          formattedValue = formatPercentage(entry.value)
        } else {
          formattedValue = String(entry.value)
        }

        return (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-zinc-400">{entry.name}:</span>
            <span className="text-sm font-semibold text-zinc-100">
              {formattedValue}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Legend text formatter
// ---------------------------------------------------------------------------

function renderLegendText(value: string) {
  const labels: Record<string, string> = {
    revenue: "Revenue",
    winRate: "Win Rate (%)",
    avgContract: "Avg Contract",
    proposals: "Proposals",
  }
  return (
    <span className="text-xs text-zinc-400">{labels[value] ?? value}</span>
  )
}

// ---------------------------------------------------------------------------
// Axis formatters
// ---------------------------------------------------------------------------

function formatAxisCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  }
  return `$${value}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlatformComparison({
  data,
  height = 360,
  className,
}: PlatformComparisonProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-6",
          className
        )}
      >
        <h3 className="text-sm font-semibold">Platform Comparison</h3>
        <div
          className="mt-4 flex items-center justify-center text-sm text-muted-foreground"
          style={{ height }}
        >
          No platform data available yet.
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6",
        className
      )}
    >
      <h3 className="text-sm font-semibold">Platform Comparison</h3>

      <div className="mt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: -4, bottom: 0 }}
            barCategoryGap="20%"
            barGap={2}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#3f3f46"
              vertical={false}
            />

            <XAxis
              dataKey="platform"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
              dy={8}
              interval={0}
              angle={-15}
            />

            <YAxis
              yAxisId="currency"
              tickFormatter={formatAxisCurrency}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dx={-4}
              width={56}
            />

            <YAxis
              yAxisId="count"
              orientation="right"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dx={4}
              width={40}
              allowDecimals={false}
            />

            <Tooltip
              content={<ComparisonTooltip />}
              cursor={{ fill: "#27272a", opacity: 0.5 }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              height={32}
              formatter={renderLegendText}
              iconType="rect"
              iconSize={10}
            />

            <Bar
              yAxisId="currency"
              dataKey="revenue"
              name="Revenue"
              fill={METRIC_COLORS.revenue}
              radius={[3, 3, 0, 0]}
              animationDuration={800}
            />

            <Bar
              yAxisId="count"
              dataKey="winRate"
              name="Win Rate (%)"
              fill={METRIC_COLORS.winRate}
              radius={[3, 3, 0, 0]}
              animationDuration={800}
            />

            <Bar
              yAxisId="currency"
              dataKey="avgContract"
              name="Avg Contract"
              fill={METRIC_COLORS.avgContract}
              radius={[3, 3, 0, 0]}
              animationDuration={800}
            />

            <Bar
              yAxisId="count"
              dataKey="proposals"
              name="Proposals"
              fill={METRIC_COLORS.proposals}
              radius={[3, 3, 0, 0]}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
