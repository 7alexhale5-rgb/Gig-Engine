import Image from "next/image"
import { getListingsByPillar, getStats } from "@/lib/listings"
import { Header, PageContainer } from "@/components/layout"

const PILLAR_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  "Automation & Workflows": { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-300" },
  "AI & Chatbots": { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", badge: "bg-violet-500/20 text-violet-300" },
  "CRM & GoHighLevel": { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-300" },
  "Dashboards & Analytics": { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", badge: "bg-amber-500/20 text-amber-300" },
  "Web & Landing Pages": { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", badge: "bg-rose-500/20 text-rose-300" },
}

const PRIORITY_BADGES: Record<string, string> = {
  P1: "bg-green-500/20 text-green-300 border-green-500/30",
  P2: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  P3: "bg-gray-500/20 text-gray-300 border-gray-500/30",
}

const PILLAR_ORDER = [
  "Automation & Workflows",
  "AI & Chatbots",
  "CRM & GoHighLevel",
  "Dashboards & Analytics",
  "Web & Landing Pages",
]

export default function ServiceCatalog() {
  const byPillar = getListingsByPillar()
  const stats = getStats()

  return (
    <>
      <Header
        title="Service Catalog"
        description={`${stats.totalFiverr} Fiverr + ${stats.totalUpwork} Upwork listings across 5 pillars`}
      />
      <PageContainer>
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          <StatCard label="Fiverr Listings" value={stats.totalFiverr} />
          <StatCard label="Upwork Listings" value={stats.totalUpwork} />
          <StatCard label="Gig Images" value={stats.totalImages} />
          <StatCard label="P1 (Core)" value={stats.byPriority.P1} color="text-green-400" />
          <StatCard label="P2 (Growth)" value={stats.byPriority.P2} color="text-yellow-400" />
          <StatCard label="P3 (Expand)" value={stats.byPriority.P3} color="text-gray-400" />
        </div>

        {/* Service Grid by Pillar */}
        {PILLAR_ORDER.map((pillar) => {
          const listings = byPillar[pillar] || []
          const colors = PILLAR_COLORS[pillar]
          if (!listings.length) return null

          return (
            <section key={pillar} className="mt-8">
              <div className="mb-4 flex items-center gap-3">
                <h2 className={`text-lg font-semibold ${colors.text}`}>{pillar}</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors.badge}`}>
                  {listings.length} services
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden transition-all hover:scale-[1.01] hover:shadow-lg`}
                  >
                    {/* Gig Image */}
                    {listing.imagePath && (
                      <div className="relative aspect-[1280/769] w-full">
                        <Image
                          src={listing.imagePath}
                          alt={listing.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        />
                      </div>
                    )}

                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-mono text-muted-foreground">{listing.id}</span>
                          <h3 className="text-sm font-semibold text-foreground leading-tight mt-0.5">
                            {listing.title}
                          </h3>
                        </div>
                        <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_BADGES[listing.priority]}`}>
                          {listing.priority}
                        </span>
                      </div>

                      {/* Description */}
                      {listing.description && (
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {listing.description}
                        </p>
                      )}

                      {/* Pricing Tiers */}
                      {listing.tiers.length > 0 && (
                        <div className="mt-3 flex gap-2">
                          {listing.tiers.map((tier) => (
                            <div
                              key={tier.name}
                              className="flex-1 rounded bg-background/50 px-2 py-1.5 text-center"
                            >
                              <div className="text-[10px] text-muted-foreground">{tier.name}</div>
                              <div className="text-xs font-semibold text-foreground">{tier.price}</div>
                              <div className="text-[10px] text-muted-foreground">{tier.delivery}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </PageContainer>
    </>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${color || "text-foreground"}`}>{value}</div>
    </div>
  )
}
