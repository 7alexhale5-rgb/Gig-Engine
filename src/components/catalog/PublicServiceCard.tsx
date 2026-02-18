import ReactMarkdown from "react-markdown"
import PricingTierDisplay from "./PricingTierDisplay"

interface PublicServiceCardProps {
  service: {
    id: string
    title: string
    description: string
    thumbnail_url: string | null
    pricing_basic: number | null
    pricing_standard: number | null
    pricing_premium: number | null
    delivery_days_basic: number | null
    delivery_days_standard: number | null
    delivery_days_premium: number | null
    contact_for_pricing: boolean
  }
}

export default function PublicServiceCard({ service }: PublicServiceCardProps) {
  const { title, description, thumbnail_url, contact_for_pricing } = service

  return (
    <article className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
      {/* Thumbnail — 16:9 aspect ratio */}
      {thumbnail_url && (
        <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail_url}
            alt={title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      )}

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-base font-semibold text-foreground leading-snug">{title}</h3>

        {/* Description — markdown, 4-line preview */}
        <div className="mt-2 line-clamp-4 prose prose-sm max-w-none text-muted-foreground">
          <ReactMarkdown>{description}</ReactMarkdown>
        </div>

        {/* Pricing */}
        <div className="mt-auto">
          <PricingTierDisplay service={service} />

          {/* Contact CTA for contact-for-pricing services */}
          {contact_for_pricing && (
            <a
              href="mailto:hello@prettyfly.ai"
              className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Get in Touch
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
