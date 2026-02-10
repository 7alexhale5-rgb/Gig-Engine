import { cn } from "@/lib/utils"
import { PILLAR_COLORS } from "@/lib/utils/constants"

interface PillarBadgeProps {
  pillar: string
  className?: string
}

export function PillarBadge({ pillar, className }: PillarBadgeProps) {
  const color = PILLAR_COLORS[pillar] || "#6B7280"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderColor: `${color}30`,
        borderWidth: "1px",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {pillar}
    </span>
  )
}
