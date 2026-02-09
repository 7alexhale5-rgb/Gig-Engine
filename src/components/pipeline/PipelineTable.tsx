"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { STAGE_LABELS, STAGE_COLORS } from "@/lib/utils/constants"
import { formatCurrency, formatDate, formatRelativeDate } from "@/lib/utils/formatters"
import { PlatformBadge, PillarBadge } from "@/components/shared"
import type { OpportunityWithRelations } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortField =
  | "job_title"
  | "platform"
  | "pillar"
  | "stage"
  | "client"
  | "budget"
  | "contract_type"
  | "created_at"
  | "updated_at"

type SortDirection = "asc" | "desc"

interface PipelineTableProps {
  opportunities: OpportunityWithRelations[]
}

// ---------------------------------------------------------------------------
// Sort comparators
// ---------------------------------------------------------------------------

function getSortValue(
  opp: OpportunityWithRelations,
  field: SortField
): string | number {
  switch (field) {
    case "job_title":
      return opp.job_title.toLowerCase()
    case "platform":
      return (opp.platforms?.name ?? "").toLowerCase()
    case "pillar":
      return (opp.service_pillars?.name ?? "").toLowerCase()
    case "stage":
      return opp.stage
    case "client":
      return (opp.client_company || opp.client_name || "").toLowerCase()
    case "budget":
      return opp.contract_value ?? opp.budget_max ?? opp.budget_min ?? 0
    case "contract_type":
      return opp.contract_type
    case "created_at":
      return new Date(opp.created_at).getTime()
    case "updated_at":
      return new Date(opp.updated_at).getTime()
    default:
      return ""
  }
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

interface ColumnDef {
  key: SortField
  label: string
  className?: string
  sortable: boolean
}

const COLUMNS: ColumnDef[] = [
  { key: "job_title", label: "Title", sortable: true },
  { key: "platform", label: "Platform", sortable: true },
  { key: "pillar", label: "Pillar", sortable: true },
  { key: "stage", label: "Stage", sortable: true },
  { key: "client", label: "Client", sortable: true },
  { key: "budget", label: "Budget", className: "text-right", sortable: true },
  { key: "contract_type", label: "Type", sortable: true },
  { key: "created_at", label: "Created", sortable: true },
  { key: "updated_at", label: "Updated", sortable: true },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PipelineTable({ opportunities }: PipelineTableProps) {
  const router = useRouter()

  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortDir, setSortDir] = useState<SortDirection>("desc")

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
      } else {
        setSortField(field)
        setSortDir("asc")
      }
    },
    [sortField]
  )

  const sorted = useMemo(() => {
    const arr = [...opportunities]
    arr.sort((a, b) => {
      const aVal = getSortValue(a, sortField)
      const bVal = getSortValue(b, sortField)
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal))
      return sortDir === "asc" ? cmp : -cmp
    })
    return arr
  }, [opportunities, sortField, sortDir])

  function formatBudget(opp: OpportunityWithRelations): string {
    if (opp.contract_value !== null) {
      return formatCurrency(opp.contract_value)
    }
    if (opp.budget_min !== null && opp.budget_max !== null && opp.budget_min > 0 && opp.budget_max > 0) {
      if (opp.budget_min === opp.budget_max) return formatCurrency(opp.budget_min)
      return `${formatCurrency(opp.budget_min)} - ${formatCurrency(opp.budget_max)}`
    }
    if (opp.budget_min !== null && opp.budget_min > 0) return `From ${formatCurrency(opp.budget_min)}`
    if (opp.budget_max !== null && opp.budget_max > 0) return `Up to ${formatCurrency(opp.budget_max)}`
    return "-"
  }

  if (opportunities.length === 0) {
    return (
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={COLUMNS.length}
                className="h-32 text-center text-sm text-muted-foreground"
              >
                No opportunities yet. Add your first one to get started.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  col.className,
                  col.sortable && "cursor-pointer select-none hover:text-foreground"
                )}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <SortIcon
                      active={sortField === col.key}
                      direction={sortField === col.key ? sortDir : null}
                    />
                  )}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((opp) => (
            <TableRow
              key={opp.id}
              className="cursor-pointer"
              onClick={() => router.push(`/pipeline/${opp.id}`)}
            >
              {/* Title */}
              <TableCell className="max-w-[240px] font-medium">
                <span className="block truncate">{opp.job_title}</span>
              </TableCell>

              {/* Platform */}
              <TableCell>
                {opp.platforms?.name ? (
                  <PlatformBadge platform={opp.platforms.name} />
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>

              {/* Pillar */}
              <TableCell>
                {opp.service_pillars?.name ? (
                  <PillarBadge pillar={opp.service_pillars.name} />
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>

              {/* Stage */}
              <TableCell>
                <StageBadge stage={opp.stage} />
              </TableCell>

              {/* Client */}
              <TableCell className="max-w-[160px]">
                <span className="block truncate text-sm">
                  {opp.client_company || opp.client_name || "-"}
                </span>
              </TableCell>

              {/* Budget */}
              <TableCell className="text-right text-sm">
                {formatBudget(opp)}
              </TableCell>

              {/* Contract type */}
              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                    opp.contract_type === "hourly"
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  )}
                >
                  {opp.contract_type}
                </span>
              </TableCell>

              {/* Created */}
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(opp.created_at)}
              </TableCell>

              {/* Updated */}
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatRelativeDate(opp.updated_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SortIcon({
  active,
  direction,
}: {
  active: boolean
  direction: "asc" | "desc" | null
}) {
  if (!active || !direction) {
    return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
  }
  return direction === "asc" ? (
    <ArrowUp className="h-3 w-3 text-foreground" />
  ) : (
    <ArrowDown className="h-3 w-3 text-foreground" />
  )
}

function StageBadge({ stage }: { stage: string }) {
  const stageKey = stage as keyof typeof STAGE_LABELS
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span
        className={cn(
          "h-2 w-2 rounded-full flex-shrink-0",
          STAGE_COLORS[stageKey] ?? "bg-muted"
        )}
      />
      <span className="text-xs font-medium">
        {STAGE_LABELS[stageKey] ?? stage}
      </span>
    </span>
  )
}
