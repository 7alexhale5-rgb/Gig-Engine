"use client"

import { useCallback, useState } from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency, formatPercentage } from "@/lib/utils/formatters"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PillarDataPoint {
  name: string
  value: number
  color: string
}

export interface PillarDistributionProps {
  data: PillarDataPoint[]
  height?: number
  className?: string
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

interface PillarTooltipPayloadItem {
  payload: PillarDataPoint
  value: number
}

interface PillarTooltipProps {
  active?: boolean
  payload?: PillarTooltipPayloadItem[]
  total: number
}

function PillarTooltip({ active, payload, total }: PillarTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const item = payload[0]
  const pct = total > 0 ? (item.value / total) * 100 : 0

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-xl">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.payload.color }}
        />
        <p className="text-xs font-medium text-zinc-300">
          {item.payload.name}
        </p>
      </div>
      <p className="text-sm font-semibold text-zinc-100">
        {formatCurrency(item.value)}
      </p>
      <p className="text-xs text-zinc-500">
        {formatPercentage(pct, 1)} of total
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PillarDistribution({
  data,
  height = 320,
  className,
}: PillarDistributionProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  const onPieEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index)
  }, [])

  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined)
  }, [])

  const total = data.reduce((sum, entry) => sum + entry.value, 0)

  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-6",
          className
        )}
      >
        <h3 className="text-sm font-semibold">Revenue by Pillar</h3>
        <div
          className="mt-4 flex items-center justify-center text-sm text-muted-foreground"
          style={{ height }}
        >
          No pillar data available.
        </div>
      </div>
    )
  }

  // Chart occupies the top portion, legend sits below
  const chartHeight = Math.max(height - 100, 180)

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6",
        className
      )}
    >
      <h3 className="text-sm font-semibold">Revenue by Pillar</h3>

      {/* Donut chart */}
      <div className="mt-2 relative" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="78%"
              dataKey="value"
              paddingAngle={2}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              animationDuration={1000}
              animationBegin={0}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={
                    activeIndex === undefined || activeIndex === index
                      ? 1
                      : 0.35
                  }
                  style={{
                    transition: "opacity 200ms ease",
                    filter:
                      activeIndex === index
                        ? "brightness(1.15)"
                        : "brightness(1)",
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              content={<PillarTooltip total={total} />}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center total label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">
            Total
          </span>
          <span className="text-xl font-bold text-zinc-100">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 space-y-2">
        {data.map((entry, index) => {
          const pct = total > 0 ? (entry.value / total) * 100 : 0
          return (
            <div
              key={entry.name}
              className={cn(
                "flex items-center justify-between rounded-md px-2 py-1.5 transition-colors",
                activeIndex === index && "bg-zinc-800/50"
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-zinc-300 truncate max-w-[140px]">
                  {entry.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-zinc-100">
                  {formatCurrency(entry.value)}
                </span>
                <span className="text-xs text-zinc-500 w-12 text-right">
                  {formatPercentage(pct, 0)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
