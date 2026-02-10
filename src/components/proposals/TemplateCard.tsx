import { Copy, Edit, Trash2, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PillarBadge } from "@/components/shared/PillarBadge"
import { PlatformBadge } from "@/components/shared/PlatformBadge"
import { formatPercentage } from "@/lib/utils/formatters"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TemplateCardData {
  id: string
  name: string
  pillarName: string | null
  platformName: string | null
  templateText: string
  timesUsed: number
  timesWon: number
  winRate: number
  variables: string[]
  tags: string[]
}

export interface TemplateCardProps {
  template: TemplateCardData
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onCopy?: (text: string) => void
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TemplateCard({
  template,
  onEdit,
  onDelete,
  onCopy,
  className,
}: TemplateCardProps) {
  const preview =
    template.templateText.length > 200
      ? `${template.templateText.slice(0, 200)}...`
      : template.templateText

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5 transition-colors hover:border-zinc-600",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-tight">
          {template.name}
        </h3>
        <div className="flex gap-1">
          {onCopy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(template.templateText)}
              className="h-7 w-7 p-0"
              title="Copy template text"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(template.id)}
              className="h-7 w-7 p-0"
              title="Edit template"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(template.id)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
              title="Delete template"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {template.pillarName && (
          <PillarBadge pillar={template.pillarName} />
        )}
        {template.platformName && (
          <PlatformBadge platform={template.platformName} />
        )}
      </div>

      {/* Preview text */}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {preview}
      </p>

      {/* Usage stats */}
      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {template.timesUsed}
          </span>
          used
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Trophy className="h-3 w-3 text-amber-400" />
          <span className="font-medium text-foreground">
            {template.timesWon}
          </span>
          won
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          Win rate:
          <span
            className={cn(
              "font-medium",
              template.winRate >= 30
                ? "text-emerald-400"
                : template.winRate >= 15
                  ? "text-amber-400"
                  : "text-muted-foreground"
            )}
          >
            {formatPercentage(template.winRate)}
          </span>
        </div>
      </div>

      {/* Variables */}
      {template.variables.length > 0 && (
        <div className="mt-3">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Variables
          </span>
          <div className="mt-1 flex flex-wrap gap-1">
            {template.variables.map((v) => (
              <span
                key={v}
                className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400"
              >
                {`{{${v}}}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {template.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {template.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px]"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
