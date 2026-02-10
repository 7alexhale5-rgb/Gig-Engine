"use client"

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { cn } from "@/lib/utils"
import { formatCurrency, formatHours } from "@/lib/utils/formatters"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EffectiveRateDataPoint {
  period: string
  revenue: number
  hours: number
  effectiveRate: number
}

export interface EffectiveRateChartProps {
  data: EffectiveRateDataPoint[]
  targetRate?: number
  height?: number
  className?: string
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

interface RateTooltipPayloadItem {
  value: number
  dataKey: string
  color: string
  name: string
}

interface RateTooltipProps {
  active?: boolean
  payload?: RateTooltipPayloadItem[]
  label?: string
}

function RateTooltip({ active, payload, label }: RateTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const revenue = payload.find((p) => p.dataKey === "revenue")
  const hours = payload.find((p) => p.dataKey === "hours")
  const rate = payload.find((p) => p.dataKey === "effectiveRate")

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-xl">
      <p className="mb-2 text-xs font-medium text-zinc-400">{label}</p>
      {revenue && (
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: revenue.color }}
          />
          <span className="text-xs text-zinc-400">Revenue:</span>
          <span className="text-sm font-semibold text-zinc-100">
            {formatCurrency(revenue.value)}
          </span>
        </div>
      )}
      {hours && (
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: hours.color }}
          />
          <span className="text-xs text-zinc-400">Hours:</span>
          <span className="text-sm font-semibold text-zinc-100">
            {formatHours(hours.value)}
          </span>
        </div>
      )}
      {rate && (
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: rate.color }}
          />
          <span className="text-xs text-zinc-400">Effective Rate:</span>
          <span className="text-sm font-semibold text-zinc-100">
            {formatCurrency(rate.value)}/hr
          </span>
        </div>
      )}
    </div>
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

function formatAxisRate(value: number): string {
  return `$${value}`
}

// ---------------------------------------------------------------------------
// Legend text formatter
// ---------------------------------------------------------------------------

function renderLegendText(value: string) {
  const labels: Record<string, string> = {
    revenue: "Revenue",
    hours: "Hours",
    effectiveRate: "Effective Rate ($/hr)",
  }
  return (
    <span className="text-xs text-zinc-400">{labels[value] ?? value}</span>
  )
}

// ---------------------------------------------------------------------------
// Gradient ID
// ---------------------------------------------------------------------------

const GRADIENT_REVENUE_ID = "effectiveRateRevenueGradient"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EffectiveRateChart({
  data,
  targetRate = 100,
  height = 320,
  className,
}: EffectiveRateChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-6",
          className
        )}
      >
        <h3 className="text-sm font-semibold">Effective Hourly Rate</h3>
        <div
          className="mt-4 flex items-center justify-center text-sm text-muted-foreground"
          style={{ height }}
        >
          No rate data available yet.
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
      <h3 className="text-sm font-semibold">Effective Hourly Rate</h3>

      <div className="mt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 16, left: -12, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={GRADIENT_REVENUE_ID}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#3f3f46"
              vertical={false}
            />

            <XAxis
              dataKey="period"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
              dy={8}
              interval="preserveStartEnd"
              minTickGap={40}
            />

            {/* Left Y-axis: Revenue ($) */}
            <YAxis
              yAxisId="currency"
              tickFormatter={formatAxisCurrency}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dx={-4}
              width={56}
            />

            {/* Right Y-axis: Effective Rate ($/hr) */}
            <YAxis
              yAxisId="rate"
              orientation="right"
              tickFormatter={formatAxisRate}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dx={4}
              width={52}
            />

            <Tooltip
              content={<RateTooltip />}
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

            {/* Target rate reference line */}
            <ReferenceLine
              yAxisId="rate"
              y={targetRate}
              stroke="#10B981"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: `Target $${targetRate}/hr`,
                position: "insideTopRight",
                fill: "#10B981",
                fontSize: 10,
              }}
            />

            {/* Revenue bars */}
            <Bar
              yAxisId="currency"
              dataKey="revenue"
              name="Revenue"
              fill={`url(#${GRADIENT_REVENUE_ID})`}
              radius={[3, 3, 0, 0]}
              animationDuration={800}
              barSize={28}
            />

            {/* Effective rate line overlay */}
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="effectiveRate"
              name="Effective Rate ($/hr)"
              stroke="#F59E0B"
              strokeWidth={2.5}
              dot={{ fill: "#F59E0B", r: 3, strokeWidth: 0 }}
              activeDot={{
                r: 5,
                fill: "#F59E0B",
                stroke: "#1e1e2e",
                strokeWidth: 2,
              }}
              animationDuration={800}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
