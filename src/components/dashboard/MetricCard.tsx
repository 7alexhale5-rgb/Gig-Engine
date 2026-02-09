import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
}

export function MetricCard({
  title,
  value,
  subtitle,
  change,
  changeType = "neutral",
}: MetricCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {change && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              changeType === "positive" && "text-pillar-architecture",
              changeType === "negative" && "text-pillar-strategy",
              changeType === "neutral" && "text-muted-foreground"
            )}
          >
            {changeType === "positive" && <TrendingUp className="h-3 w-3" />}
            {changeType === "negative" && <TrendingDown className="h-3 w-3" />}
            {changeType === "neutral" && <Minus className="h-3 w-3" />}
            {change}
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </div>
  )
}
