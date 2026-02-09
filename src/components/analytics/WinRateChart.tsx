"use client"

import {
  LineChart,
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
import { formatPercentage } from "@/lib/utils/formatters"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WinRateDataPoint {
  week: string
  winRate: number
  proposalsSent: number
  contractsWon: number
}

export interface WinRateChartProps {
  data: WinRateDataPoint[]
  targetWinRate?: number
  height?: number
  className?: string
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

interface WinRateTooltipPayloadItem {
  value: number
  dataKey: string
  color: string
  name: string
}

interface WinRateTooltipProps {
  active?: boolean
  payload?: WinRateTooltipPayloadItem[]
  label?: string
}

function WinRateTooltip({ active, payload, label }: WinRateTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const winRate = payload.find((p) => p.dataKey === "winRate")
  const sent = payload.find((p) => p.dataKey === "proposalsSent")
  const won = payload.find((p) => p.dataKey === "contractsWon")

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-xl">
      <p className="mb-2 text-xs font-medium text-zinc-400">{label}</p>
      {winRate && (
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: winRate.color }}
          />
          <span className="text-xs text-zinc-400">Win Rate:</span>
          <span className="text-sm font-semibold text-zinc-100">
            {formatPercentage(winRate.value)}
          </span>
        </div>
      )}
      {sent && (
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: sent.color }}
          />
          <span className="text-xs text-zinc-400">Proposals Sent:</span>
          <span className="text-sm font-semibold text-zinc-100">
            {sent.value}
          </span>
        </div>
      )}
      {won && (
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: won.color }}
          />
          <span className="text-xs text-zinc-400">Contracts Won:</span>
          <span className="text-sm font-semibold text-zinc-100">
            {won.value}
          </span>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Legend formatter
// ---------------------------------------------------------------------------

function renderLegendText(value: string) {
  const labels: Record<string, string> = {
    winRate: "Win Rate (%)",
    proposalsSent: "Proposals Sent",
    contractsWon: "Contracts Won",
  }
  return (
    <span className="text-xs text-zinc-400">{labels[value] ?? value}</span>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WinRateChart({
  data,
  targetWinRate = 25,
  height = 320,
  className,
}: WinRateChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-6",
          className
        )}
      >
        <h3 className="text-sm font-semibold">Proposal Win Rate</h3>
        <div
          className="mt-4 flex items-center justify-center text-sm text-muted-foreground"
          style={{ height }}
        >
          No win rate data available yet.
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
      <h3 className="text-sm font-semibold">Proposal Win Rate</h3>

      <div className="mt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, left: -12, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#3f3f46"
              vertical={false}
            />

            {/* Left Y-axis: Win Rate (%) */}
            <YAxis
              yAxisId="left"
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dx={-4}
              width={48}
              domain={[0, 100]}
            />

            {/* Right Y-axis: Volume (count) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dx={4}
              width={40}
              allowDecimals={false}
            />

            <XAxis
              dataKey="week"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
              dy={8}
              interval="preserveStartEnd"
              minTickGap={40}
            />

            <Tooltip
              content={<WinRateTooltip />}
              cursor={{ stroke: "#52525b", strokeWidth: 1 }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              height={32}
              formatter={renderLegendText}
              iconType="circle"
              iconSize={8}
            />

            {/* Target win rate reference line */}
            <ReferenceLine
              yAxisId="left"
              y={targetWinRate}
              stroke="#F59E0B"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: `Target ${targetWinRate}%`,
                position: "insideTopRight",
                fill: "#F59E0B",
                fontSize: 10,
              }}
            />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="winRate"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={{ fill: "#10B981", r: 3, strokeWidth: 0 }}
              activeDot={{
                r: 5,
                fill: "#10B981",
                stroke: "#1e1e2e",
                strokeWidth: 2,
              }}
              animationDuration={800}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="proposalsSent"
              stroke="#3B82F6"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#3B82F6",
                stroke: "#1e1e2e",
                strokeWidth: 2,
              }}
              animationDuration={800}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="contractsWon"
              stroke="#8B5CF6"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#8B5CF6",
                stroke: "#1e1e2e",
                strokeWidth: 2,
              }}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
