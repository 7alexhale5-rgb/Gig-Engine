import { formatCurrency } from "@/lib/utils/formatters"

interface PricingTierDisplayProps {
  service: {
    pricing_basic: number | null
    pricing_standard: number | null
    pricing_premium: number | null
    delivery_days_basic: number | null
    delivery_days_standard: number | null
    delivery_days_premium: number | null
    contact_for_pricing: boolean
  }
}

interface Tier {
  label: string
  price: number
  deliveryDays: number | null
}

export default function PricingTierDisplay({ service }: PricingTierDisplayProps) {
  const {
    pricing_basic,
    pricing_standard,
    pricing_premium,
    delivery_days_basic,
    delivery_days_standard,
    delivery_days_premium,
    contact_for_pricing,
  } = service

  if (contact_for_pricing) {
    return (
      <p className="mt-3 text-sm text-muted-foreground italic">Contact for pricing</p>
    )
  }

  // Collect defined tiers
  const tiers: Tier[] = []
  if (pricing_basic != null) {
    tiers.push({ label: "Basic", price: pricing_basic, deliveryDays: delivery_days_basic })
  }
  if (pricing_standard != null) {
    tiers.push({ label: "Standard", price: pricing_standard, deliveryDays: delivery_days_standard })
  }
  if (pricing_premium != null) {
    tiers.push({ label: "Premium", price: pricing_premium, deliveryDays: delivery_days_premium })
  }

  if (tiers.length === 0) {
    return null
  }

  // Single tier: show "From $X"
  if (tiers.length === 1) {
    return (
      <p className="mt-3 text-sm font-medium text-foreground">
        From {formatCurrency(tiers[0].price, "USD").replace(".00", "")}
      </p>
    )
  }

  // Multiple tiers: responsive grid
  return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
      {tiers.map((tier) => (
        <div
          key={tier.label}
          className="rounded border border-border bg-muted/40 px-3 py-2 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tier.label}
          </p>
          <p className="mt-0.5 text-sm font-bold text-foreground">
            {formatCurrency(tier.price, "USD").replace(".00", "")}
          </p>
          {tier.deliveryDays != null && (
            <p className="text-xs text-muted-foreground">
              {tier.deliveryDays} day{tier.deliveryDays !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
