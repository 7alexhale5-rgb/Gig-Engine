import {
  Eye,
  MousePointerClick,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  formatCurrency,
  formatPercentage,
} from "@/lib/utils/formatters"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PerformanceMetric {
  label: string
  value: string
  icon: React.ReactNode
  change?: number
  changeLabel?: string
  accentColor?: string
}

interface GigPerformanceStatsProps {
  impressions: number
  clicks: number
  orders: number
  conversionRate: number
  revenueTotal: number
  /** Optional previous-period data for trend indicators */
  previousPeriod?: {
    impressions?: number
    clicks?: number
    orders?: number
    conversionRate?: number
    revenueTotal?: number
  }
  className?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calculateClickThroughRate(
  impressions: number,
  clicks: number
): number {
  if (impressions <= 0) return 0
  return (clicks / impressions) * 100
}

function calculateOrderConversion(clicks: number, orders: number): number {
  if (clicks <= 0) return 0
  return (orders / clicks) * 100
}

function computeChange(current: number, previous: number | undefined): number | undefined {
  if (previous === undefined || previous === 0) return undefined
  return ((current - previous) / previous) * 100
}

function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GigPerformanceStats({
  impressions,
  clicks,
  orders,
  conversionRate,
  revenueTotal,
  previousPeriod,
  className,
}: GigPerformanceStatsProps) {
  const ctr = calculateClickThroughRate(impressions, clicks)
  const orderConversion = calculateOrderConversion(clicks, orders)

  const metrics: PerformanceMetric[] = [
    {
      label: "Impressions",
      value: compactNumber(impressions),
      icon: <Eye className="h-4 w-4" />,
      change: computeChange(impressions, previousPeriod?.impressions),
      accentColor: "text-blue-400",
    },
    {
      label: "Clicks",
      value: compactNumber(clicks),
      icon: <MousePointerClick className="h-4 w-4" />,
      change: computeChange(clicks, previousPeriod?.clicks),
      changeLabel: `CTR: ${formatPercentage(ctr)}`,
      accentColor: "text-cyan-400",
    },
    {
      label: "Orders",
      value: orders.toLocaleString(),
      icon: <ShoppingCart className="h-4 w-4" />,
      change: computeChange(orders, previousPeriod?.orders),
      changeLabel: `Order conv.: ${formatPercentage(orderConversion)}`,
      accentColor: "text-amber-400",
    },
    {
      label: "Conversion Rate",
      value: formatPercentage(conversionRate),
      icon: <TrendingUp className="h-4 w-4" />,
      change: computeChange(conversionRate, previousPeriod?.conversionRate),
      accentColor: "text-purple-400",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(revenueTotal),
      icon: <DollarSign className="h-4 w-4" />,
      change: computeChange(revenueTotal, previousPeriod?.revenueTotal),
      accentColor: "text-green-400",
    },
  ]

  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
        className
      )}
    >
      {metrics.map((metric) => (
        <MetricStatCard key={metric.label} metric={metric} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

function MetricStatCard({ metric }: { metric: PerformanceMetric }) {
  const { label, value, icon, change, changeLabel, accentColor } = metric

  const changeType: "positive" | "negative" | "neutral" =
    change === undefined || change === 0
      ? "neutral"
      : change > 0
        ? "positive"
        : "negative"

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
          <span className={cn("opacity-60", accentColor)}>{icon}</span>
        </div>

        <p className={cn("mt-2 text-2xl font-bold tracking-tight", accentColor)}>
          {value}
        </p>

        <div className="mt-1 flex flex-col gap-0.5">
          {change !== undefined && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                changeType === "positive" && "text-green-400",
                changeType === "negative" && "text-red-400",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {changeType === "positive" && (
                <ArrowUpRight className="h-3 w-3" />
              )}
              {changeType === "negative" && (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {changeType === "neutral" && <Minus className="h-3 w-3" />}
              {change >= 0 ? "+" : ""}
              {formatPercentage(Math.abs(change))}
            </span>
          )}
          {changeLabel && (
            <span className="text-[10px] text-muted-foreground">
              {changeLabel}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
