"use client"

import { useCallback } from "react"
import { X, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/formatters"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PricingTier {
  price: number | null
  deliveryDays: number | null
  description: string
}

export interface PricingTierValues {
  basic: PricingTier
  standard: PricingTier
  premium: PricingTier
}

interface PricingTierEditorProps {
  value: PricingTierValues
  onChange: (value: PricingTierValues) => void
  errors?: {
    basic?: string
    standard?: string
    premium?: string
    tiers?: string
  }
}

// ---------------------------------------------------------------------------
// Tier visual configuration
// ---------------------------------------------------------------------------

type TierKey = "basic" | "standard" | "premium"

interface TierConfig {
  key: TierKey
  label: string
  color: string
  borderColor: string
  bgColor: string
  badgeBg: string
}

const TIER_CONFIGS: TierConfig[] = [
  {
    key: "basic",
    label: "Basic",
    color: "text-zinc-400",
    borderColor: "border-zinc-600",
    bgColor: "bg-zinc-900/50",
    badgeBg: "bg-zinc-700 text-zinc-200",
  },
  {
    key: "standard",
    label: "Standard",
    color: "text-blue-400",
    borderColor: "border-blue-600/50",
    bgColor: "bg-blue-950/30",
    badgeBg: "bg-blue-700 text-blue-100",
  },
  {
    key: "premium",
    label: "Premium",
    color: "text-purple-400",
    borderColor: "border-purple-600/50",
    bgColor: "bg-purple-950/30",
    badgeBg: "bg-purple-700 text-purple-100",
  },
]

// ---------------------------------------------------------------------------
// Validation helper
// ---------------------------------------------------------------------------

export function validatePricingTiers(
  tiers: PricingTierValues
): string | null {
  const prices = [
    tiers.basic.price,
    tiers.standard.price,
    tiers.premium.price,
  ]

  // Only validate ordering if all tiers have prices set
  const allSet = prices.every((p) => p !== null && p > 0)
  if (allSet) {
    const [basic, standard, premium] = prices as [number, number, number]
    if (standard <= basic || premium <= standard) {
      return "Prices must increase across tiers: Basic < Standard < Premium"
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PricingTierEditor({
  value,
  onChange,
  errors,
}: PricingTierEditorProps) {
  const updateTier = useCallback(
    (tier: TierKey, field: keyof PricingTier, fieldValue: string) => {
      const next = { ...value }
      const tierData = { ...next[tier] }

      if (field === "description") {
        tierData.description = fieldValue
      } else {
        const parsed = fieldValue === "" ? null : Number(fieldValue)
        if (field === "price") {
          tierData.price = parsed
        } else {
          tierData.deliveryDays = parsed
        }
      }

      next[tier] = tierData
      onChange(next)
    },
    [value, onChange]
  )

  const clearTier = useCallback(
    (tier: TierKey) => {
      const next = { ...value }
      next[tier] = { price: null, deliveryDays: null, description: "" }
      onChange(next)
    },
    [value, onChange]
  )

  const tierValidation = validatePricingTiers(value)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Pricing Tiers</Label>
        {tierValidation && (
          <p className="text-xs text-destructive">{tierValidation}</p>
        )}
        {errors?.tiers && (
          <p className="text-xs text-destructive">{errors.tiers}</p>
        )}
      </div>

      {/* Tier editor columns */}
      <div className="grid gap-4 md:grid-cols-3">
        {TIER_CONFIGS.map((config) => {
          const tier = value[config.key]
          const tierError = errors?.[config.key]

          return (
            <div
              key={config.key}
              className={cn(
                "relative rounded-lg border p-4 transition-colors",
                config.borderColor,
                config.bgColor
              )}
            >
              {/* Tier header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-semibold", config.color)}>
                    {config.label}
                  </span>
                  {config.key === "standard" && (
                    <Badge className="h-5 gap-1 border-0 bg-blue-600 px-1.5 text-[10px] text-white">
                      <Star className="h-2.5 w-2.5" />
                      Popular
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => clearTier(config.key)}
                  title={`Clear ${config.label} tier`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Price input */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Price (USD)
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    className="pl-7"
                    value={tier.price !== null ? tier.price : ""}
                    onChange={(e) =>
                      updateTier(config.key, "price", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Delivery days input */}
              <div className="mt-3 space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Delivery Days
                </Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Days"
                  value={tier.deliveryDays !== null ? tier.deliveryDays : ""}
                  onChange={(e) =>
                    updateTier(config.key, "deliveryDays", e.target.value)
                  }
                />
              </div>

              {/* Description textarea */}
              <div className="mt-3 space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Description
                </Label>
                <Textarea
                  placeholder={`What's included in ${config.label}...`}
                  className="min-h-[60px] resize-none text-xs"
                  value={tier.description}
                  onChange={(e) =>
                    updateTier(config.key, "description", e.target.value)
                  }
                />
              </div>

              {tierError && (
                <p className="mt-2 text-xs text-destructive">{tierError}</p>
              )}
            </div>
          )
        })}
      </div>

      <Separator />

      {/* Visual pricing preview cards */}
      <div>
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          Preview
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {TIER_CONFIGS.map((config) => {
            const tier = value[config.key]
            const hasData = tier.price !== null

            return (
              <div
                key={`preview-${config.key}`}
                className={cn(
                  "rounded-lg border p-4 text-center transition-all",
                  hasData ? config.borderColor : "border-dashed border-border",
                  hasData ? config.bgColor : "bg-transparent"
                )}
              >
                <Badge
                  className={cn(
                    "mb-2 border-0 text-[10px]",
                    hasData ? config.badgeBg : "bg-muted text-muted-foreground"
                  )}
                >
                  {config.label}
                </Badge>
                {config.key === "standard" && hasData && (
                  <div className="mb-1 flex items-center justify-center gap-1">
                    <Star className="h-3 w-3 text-blue-400" />
                    <span className="text-[10px] font-medium text-blue-400">
                      Most Popular
                    </span>
                  </div>
                )}
                <p
                  className={cn(
                    "text-2xl font-bold",
                    hasData ? config.color : "text-muted-foreground/50"
                  )}
                >
                  {tier.price !== null ? formatCurrency(tier.price) : "--"}
                </p>
                {tier.deliveryDays !== null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tier.deliveryDays} day{tier.deliveryDays !== 1 ? "s" : ""}{" "}
                    delivery
                  </p>
                )}
                {tier.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {tier.description}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
