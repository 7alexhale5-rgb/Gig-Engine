"use client"

import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  Copy,
  Pencil,
  Archive,
  Trash2,
  Eye,
  MousePointerClick,
  ShoppingCart,
  TrendingUp,
  DollarSign,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { PlatformBadge } from "@/components/shared"
import { PillarBadge } from "@/components/shared"
import { StatusBadge } from "@/components/shared"
import { cn } from "@/lib/utils"
import { formatCurrency, formatPercentage } from "@/lib/utils/formatters"
import type { GigListingWithRelations } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Status accent color map
// ---------------------------------------------------------------------------

const STATUS_ACCENT: Record<string, string> = {
  draft: "bg-zinc-500",
  active: "bg-green-500",
  paused: "bg-amber-500",
  archived: "bg-red-500",
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GigCardProps {
  gig: GigListingWithRelations
  onEdit?: (id: string) => void
  onDuplicate?: (id: string) => void
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GigCard({
  gig,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
}: GigCardProps) {
  const router = useRouter()

  const pillarColor = gig.service_pillars?.color ?? "#6B7280"
  const platformName = gig.platforms?.name ?? "Unknown"
  const pillarName = gig.service_pillars?.name ?? "Uncategorized"

  const hasPricing =
    gig.pricing_basic !== null ||
    gig.pricing_standard !== null ||
    gig.pricing_premium !== null

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden transition-colors hover:border-muted-foreground/30"
      onClick={() => router.push(`/gigs/${gig.id}`)}
    >
      {/* Pillar color accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: pillarColor }} />

      {/* Status dot indicator (top-right) */}
      <div className="absolute right-10 top-4">
        <span
          className={cn(
            "inline-block h-2.5 w-2.5 rounded-full",
            STATUS_ACCENT[gig.status] ?? "bg-zinc-500"
          )}
          title={gig.status}
        />
      </div>

      {/* Dropdown menu (top-right) */}
      <div
        className="absolute right-2 top-2.5 z-10 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent"
            aria-label="Gig actions"
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(gig.id)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate?.(gig.id)}>
              <Copy className="mr-2 h-3.5 w-3.5" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onArchive?.(gig.id)}>
              <Archive className="mr-2 h-3.5 w-3.5" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete?.(gig.id)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardContent className="space-y-4 p-5">
        {/* Title */}
        <h3 className="line-clamp-2 pr-8 text-sm font-semibold leading-snug">
          {gig.title}
        </h3>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <PlatformBadge platform={platformName} />
          <PillarBadge pillar={pillarName} />
          <StatusBadge status={gig.status} />
        </div>

        {/* 3-tier pricing */}
        {hasPricing && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <PricingCell label="Basic" price={gig.pricing_basic} />
            <PricingCell label="Standard" price={gig.pricing_standard} />
            <PricingCell label="Premium" price={gig.pricing_premium} />
          </div>
        )}

        {/* Performance metrics */}
        <div className="grid grid-cols-4 gap-1 rounded-md bg-muted/50 px-2 py-2 text-center">
          <MetricCell
            icon={<Eye className="h-3 w-3" />}
            value={compactNumber(gig.impressions)}
            label="Views"
          />
          <MetricCell
            icon={<MousePointerClick className="h-3 w-3" />}
            value={compactNumber(gig.clicks)}
            label="Clicks"
          />
          <MetricCell
            icon={<ShoppingCart className="h-3 w-3" />}
            value={gig.orders.toString()}
            label="Orders"
          />
          <MetricCell
            icon={<TrendingUp className="h-3 w-3" />}
            value={formatPercentage(gig.conversion_rate)}
            label="Conv."
          />
        </div>

        {/* Revenue */}
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-4 w-4 text-green-400" />
          <span className="text-lg font-bold text-green-400">
            {formatCurrency(gig.revenue_total)}
          </span>
          <span className="text-xs text-muted-foreground">total revenue</span>
        </div>

        {/* Tags */}
        {gig.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {gig.tags.slice(0, 5).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-1.5 py-0 text-[10px] font-normal"
              >
                {tag}
              </Badge>
            ))}
            {gig.tags.length > 5 && (
              <span className="px-1 text-[10px] text-muted-foreground">
                +{gig.tags.length - 5}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PricingCell({
  label,
  price,
}: {
  label: string
  price: number | null
}) {
  return (
    <div className="rounded-md bg-muted/40 px-1.5 py-1.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold">
        {price !== null ? formatCurrency(price) : "--"}
      </p>
    </div>
  )
}

function MetricCell({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs font-semibold">{value}</span>
      <span className="text-[9px] text-muted-foreground">{label}</span>
    </div>
  )
}
