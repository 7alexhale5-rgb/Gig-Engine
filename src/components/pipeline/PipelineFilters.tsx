"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search, X, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  OPPORTUNITY_STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
  SERVICE_PILLARS,
  CONTRACT_TYPES,
} from "@/lib/utils/constants"
import { SEED_PLATFORMS } from "@/data/seed-platforms"
import type { OpportunityStage, ContractType } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PipelineFilterValues {
  search: string
  platform: string
  pillar: string
  stage: string
  contractType: string
}

interface PipelineFiltersProps {
  filters: PipelineFilterValues
  onFiltersChange: (filters: PipelineFilterValues) => void
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_FILTERS: PipelineFilterValues = {
  search: "",
  platform: "",
  pillar: "",
  stage: "",
  contractType: "",
}

// ---------------------------------------------------------------------------
// Helper: read filters from URLSearchParams
// ---------------------------------------------------------------------------

export function filtersFromSearchParams(
  params: URLSearchParams
): PipelineFilterValues {
  return {
    search: params.get("q") ?? "",
    platform: params.get("platform") ?? "",
    pillar: params.get("pillar") ?? "",
    stage: params.get("stage") ?? "",
    contractType: params.get("contract") ?? "",
  }
}

// ---------------------------------------------------------------------------
// Helper: check if any filters are active
// ---------------------------------------------------------------------------

export function hasActiveFilters(filters: PipelineFilterValues): boolean {
  return (
    filters.search !== "" ||
    filters.platform !== "" ||
    filters.pillar !== "" ||
    filters.stage !== "" ||
    filters.contractType !== ""
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PipelineFilters({
  filters,
  onFiltersChange,
}: PipelineFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Persist filter state to URL search params so filters survive refreshes
  const updateFilter = useCallback(
    (key: keyof PipelineFilterValues, value: string) => {
      const next = { ...filters, [key]: value }
      onFiltersChange(next)

      // Sync to URL
      const params = new URLSearchParams(searchParams.toString())
      const urlKey =
        key === "search"
          ? "q"
          : key === "contractType"
            ? "contract"
            : key
      if (value) {
        params.set(urlKey, value)
      } else {
        params.delete(urlKey)
      }
      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
    },
    [filters, onFiltersChange, router, pathname, searchParams]
  )

  const clearAll = useCallback(() => {
    onFiltersChange(DEFAULT_FILTERS)
    router.replace(pathname, { scroll: false })
  }, [onFiltersChange, router, pathname])

  const isActive = hasActiveFilters(filters)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search opportunities..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className={cn(
            "h-8 w-48 rounded-md border border-input bg-background pl-8 pr-3 text-xs",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-1 focus:ring-ring",
            "lg:w-56"
          )}
        />
      </div>

      {/* Platform filter */}
      <FilterSelect
        value={filters.platform}
        onChange={(v) => updateFilter("platform", v)}
        placeholder="Platform"
        icon={<Filter className="h-3 w-3" />}
      >
        <option value="">All platforms</option>
        {SEED_PLATFORMS.map((p) => (
          <option key={p.name} value={p.name}>
            {p.name}
          </option>
        ))}
      </FilterSelect>

      {/* Pillar filter */}
      <FilterSelect
        value={filters.pillar}
        onChange={(v) => updateFilter("pillar", v)}
        placeholder="Pillar"
      >
        <option value="">All pillars</option>
        {SERVICE_PILLARS.map((p) => (
          <option key={p.name} value={p.name}>
            {p.name}
          </option>
        ))}
      </FilterSelect>

      {/* Stage filter */}
      <FilterSelect
        value={filters.stage}
        onChange={(v) => updateFilter("stage", v)}
        placeholder="Stage"
      >
        <option value="">All stages</option>
        {OPPORTUNITY_STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </FilterSelect>

      {/* Contract type filter */}
      <FilterSelect
        value={filters.contractType}
        onChange={(v) => updateFilter("contractType", v)}
        placeholder="Type"
      >
        <option value="">All types</option>
        {CONTRACT_TYPES.map((t) => (
          <option key={t} value={t}>
            {t === "fixed" ? "Fixed Price" : "Hourly"}
          </option>
        ))}
      </FilterSelect>

      {/* Clear all */}
      {isActive && (
        <button
          onClick={clearAll}
          className={cn(
            "flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-medium",
            "text-muted-foreground hover:text-foreground",
            "border border-transparent hover:border-border",
            "transition-colors"
          )}
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// FilterSelect — compact native select styled for the filter bar
// ---------------------------------------------------------------------------

interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  icon?: React.ReactNode
  children: React.ReactNode
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  icon,
  children,
}: FilterSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-8 appearance-none rounded-md border border-input bg-background pr-7 text-xs",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          "cursor-pointer",
          icon ? "pl-7" : "pl-2.5",
          value ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {children}
      </select>
      {icon && (
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
      )}
      <svg
        className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}
