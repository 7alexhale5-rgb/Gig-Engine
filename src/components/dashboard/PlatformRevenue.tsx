"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils/formatters"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlatformRevenueDataPoint {
  name: string
  revenue: number
  color: string
}

export interface PlatformRevenueProps {
  data: PlatformRevenueDataPoint[]
  height?: number
  className?: string
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

interface PlatformTooltipPayloadItem {
  payload: PlatformRevenueDataPoint
  value: number
}

interface PlatformTooltipProps {
  active?: boolean
  payload?: PlatformTooltipPayloadItem[]
}

function PlatformTooltip({ active, payload }: PlatformTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const item = payload[0]
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-xl">
      <p className="mb-1 text-xs font-medium text-zinc-400">
        {item.payload.name}
      </p>
      <p className="text-sm font-semibold text-zinc-100">
        {formatCurrency(item.value)}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Format helper
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

export function PlatformRevenue({
  data,
  height = 300,
  className,
}: PlatformRevenueProps) {
  // Sort descending by revenue
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue)

  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-6",
          className
        )}
      >
        <h3 className="text-sm font-semibold">Revenue by Platform</h3>
        <div
          className="mt-4 flex items-center justify-center text-sm text-muted-foreground"
          style={{ height }}
        >
          No platform data available.
        </div>
      </div>
    )
  }

  // Compute the dynamic height: each bar needs ~44px, with a minimum
  const dynamicHeight = Math.max(sorted.length * 44, height)

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6",
        className
      )}
    >
      <h3 className="text-sm font-semibold">Revenue by Platform</h3>

      <div className="mt-4" style={{ height: dynamicHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
            barCategoryGap="20%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#3f3f46"
              horizontal={false}
            />

            <XAxis
              type="number"
              tickFormatter={formatAxisCurrency}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
            />

            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "#d4d4d8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={90}
            />

            <Tooltip
              content={<PlatformTooltip />}
              cursor={{ fill: "#27272a", opacity: 0.5 }}
            />

            <Bar
              dataKey="revenue"
              radius={[0, 4, 4, 0]}
              animationDuration={1000}
              maxBarSize={28}
            >
              {sorted.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
