"use client"

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  LabelList,
} from "recharts"
import { formatPercentage } from "@/lib/utils/formatters"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FunnelStage {
  stage: string
  count: number
  color: string
}

export interface ProposalFunnelProps {
  data: FunnelStage[]
  height?: number
  className?: string
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

interface FunnelTooltipPayloadItem {
  payload: FunnelStage & { conversionRate: string }
  value: number
}

interface FunnelTooltipProps {
  active?: boolean
  payload?: FunnelTooltipPayloadItem[]
}

function FunnelTooltip({ active, payload }: FunnelTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const item = payload[0]
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-xl">
      <p className="mb-1 text-xs font-medium text-zinc-400">
        {item.payload.stage}
      </p>
      <p className="text-sm font-semibold text-zinc-100">
        {item.payload.count} opportunities
      </p>
      {item.payload.conversionRate && (
        <p className="mt-1 text-xs text-zinc-500">
          Conversion: {item.payload.conversionRate}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Custom bar label
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderBarLabel(props: any) {
  const x = typeof props.x === "number" ? props.x : 0
  const y = typeof props.y === "number" ? props.y : 0
  const width = typeof props.width === "number" ? props.width : 0
  const height = typeof props.height === "number" ? props.height : 0
  const value = typeof props.value === "number" ? props.value : undefined
  if (value === undefined || value === 0) return null

  return (
    <text
      x={x + width + 8}
      y={y + height / 2}
      fill="#d4d4d8"
      fontSize={13}
      fontWeight={600}
      dominantBaseline="middle"
    >
      {value}
    </text>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProposalFunnel({
  data,
  height = 300,
  className,
}: ProposalFunnelProps) {
  // Enrich data with conversion rates
  const enrichedData = useMemo(() => {
    return data.map((item, index) => {
      let conversionRate = ""
      if (index > 0 && data[index - 1].count > 0) {
        const rate = (item.count / data[index - 1].count) * 100
        conversionRate = formatPercentage(rate, 0)
      }
      return { ...item, conversionRate }
    })
  }, [data])

  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-6",
          className
        )}
      >
        <h3 className="text-sm font-semibold">Proposal Funnel</h3>
        <div
          className="mt-4 flex items-center justify-center text-sm text-muted-foreground"
          style={{ height }}
        >
          No funnel data available.
        </div>
      </div>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6",
        className
      )}
    >
      <h3 className="text-sm font-semibold">Proposal Funnel</h3>

      <div className="mt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={enrichedData}
            layout="vertical"
            margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
            barCategoryGap="16%"
          >
            <XAxis
              type="number"
              hide
              domain={[0, maxCount * 1.15]}
            />

            <YAxis
              type="category"
              dataKey="stage"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={110}
            />

            <Tooltip
              content={<FunnelTooltip />}
              cursor={false}
            />

            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              animationDuration={1000}
              maxBarSize={32}
            >
              {enrichedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList
                dataKey="count"
                content={renderBarLabel}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion rate indicators between stages */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
        {enrichedData.map(
          (entry, index) =>
            index > 0 &&
            entry.conversionRate && (
              <span
                key={entry.stage}
                className="text-[11px] text-zinc-500"
              >
                {data[index - 1].stage} &rarr; {entry.stage}:{" "}
                <span className="font-medium text-zinc-400">
                  {entry.conversionRate}
                </span>
              </span>
            )
        )}
      </div>
    </div>
  )
}
