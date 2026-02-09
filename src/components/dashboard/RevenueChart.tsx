"use client"

import {
  AreaChart,
  Area,
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

export interface RevenueDataPoint {
  date: string
  revenue: number
  netRevenue: number
}

export interface RevenueChartProps {
  data: RevenueDataPoint[]
  height?: number
  className?: string
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

interface RevenueTooltipPayloadItem {
  value: number
  dataKey: string
  color: string
}

interface RevenueTooltipProps {
  active?: boolean
  payload?: RevenueTooltipPayloadItem[]
  label?: string
}

function RevenueTooltip({ active, payload, label }: RevenueTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-xl">
      <p className="mb-2 text-xs font-medium text-zinc-400">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-zinc-400">
            {entry.dataKey === "revenue" ? "Gross" : "Net"}:
          </span>
          <span className="text-sm font-semibold text-zinc-100">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Format helpers for axes
// ---------------------------------------------------------------------------

function formatAxisDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date)
}

function formatAxisCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  }
  return `$${value}`
}

// ---------------------------------------------------------------------------
// Chart gradient IDs (stable across renders)
// ---------------------------------------------------------------------------

const GRADIENT_GROSS_ID = "revenueGradientGross"
const GRADIENT_NET_ID = "revenueGradientNet"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RevenueChart({
  data,
  height = 320,
  className,
}: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-6",
          className
        )}
      >
        <h3 className="text-sm font-semibold">Revenue (30 Day)</h3>
        <div
          className="mt-4 flex items-center justify-center text-sm text-muted-foreground"
          style={{ height }}
        >
          No revenue data available.
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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Revenue (30 Day)</h3>
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-3 rounded-sm bg-[#3B82F6]/60" />
            Gross
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-3 rounded-sm bg-[#8B5CF6]/80" />
            Net
          </span>
        </div>
      </div>

      <div className="mt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={GRADIENT_GROSS_ID}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient
                id={GRADIENT_NET_ID}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#3f3f46"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tickFormatter={formatAxisDate}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
              dy={8}
              interval="preserveStartEnd"
              minTickGap={40}
            />

            <YAxis
              tickFormatter={formatAxisCurrency}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dx={-4}
              width={56}
            />

            <Tooltip
              content={<RevenueTooltip />}
              cursor={{ stroke: "#52525b", strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={2}
              fill={`url(#${GRADIENT_GROSS_ID})`}
              animationDuration={1000}
              dot={false}
              activeDot={{
                r: 4,
                fill: "#3B82F6",
                stroke: "#1e1e2e",
                strokeWidth: 2,
              }}
            />

            <Area
              type="monotone"
              dataKey="netRevenue"
              stroke="#8B5CF6"
              strokeWidth={2}
              fill={`url(#${GRADIENT_NET_ID})`}
              animationDuration={1000}
              dot={false}
              activeDot={{
                r: 4,
                fill: "#8B5CF6",
                stroke: "#1e1e2e",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
