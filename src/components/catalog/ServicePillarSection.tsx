import PublicServiceCard from "./PublicServiceCard"

interface ServicePillar {
  id: string
  name: string
  color: string
  sort_order: number
}

interface Service {
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

interface ServicePillarSectionProps {
  pillar: ServicePillar
  services: Service[]
}

export default function ServicePillarSection({ pillar, services }: ServicePillarSectionProps) {
  if (services.length === 0) return null

  return (
    <section>
      {/* Pillar heading with colored left border accent */}
      <h2
        className="mb-6 border-l-4 pl-3 text-xl font-semibold text-foreground"
        style={{ borderLeftColor: pillar.color }}
      >
        {pillar.name}
      </h2>

      {/* Responsive service card grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <PublicServiceCard key={service.id} service={service} />
        ))}
      </div>
    </section>
  )
}
