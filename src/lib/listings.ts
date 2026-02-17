import fs from "fs"
import path from "path"

export interface GigListing {
  id: string
  filename: string
  title: string
  pillar: string
  pillarSlug: string
  priority: string
  imagePath: string | null
  tiers: { name: string; price: string; delivery: string }[]
  description: string
  platform: "fiverr" | "upwork"
}

const PILLAR_MAP: Record<string, string> = {
  AW: "Automation & Workflows",
  AI: "AI & Chatbots",
  CRM: "CRM & GoHighLevel",
  DA: "Dashboards & Analytics",
  WL: "Web & Landing Pages",
}

const PRIORITY_MAP: Record<string, string[]> = {
  P1: [
    "AW-01", "AW-02", "AW-03", "AW-04",
    "AI-01", "AI-02", "AI-03", "AI-04",
    "CRM-01", "CRM-02", "CRM-03", "CRM-04",
  ],
  P2: [
    "AW-05", "AI-07", "AI-08",
    "DA-01", "DA-02", "DA-03",
    "WL-01", "WL-02", "WL-03", "WL-04",
  ],
  P3: [
    "AW-06", "AI-05", "AI-06",
    "CRM-05", "CRM-06",
    "DA-04", "DA-05",
    "WL-05", "WL-06",
  ],
}

function getPriority(id: string): string {
  for (const [priority, ids] of Object.entries(PRIORITY_MAP)) {
    if (ids.includes(id)) return priority
  }
  return "P3"
}

function parseTitle(content: string): string {
  const match = content.match(/^#\s+(.+?)(?:\s*—.*)?$/m)
  return match ? match[1].trim() : "Untitled"
}

function parseFiverrTiers(content: string): GigListing["tiers"] {
  const tiers: GigListing["tiers"] = []
  const tableMatch = content.match(/## Pricing Table\n\n\|[^\n]+\n\|[^\n]+\n([\s\S]*?)(?=\n##|\n$)/m)
  if (!tableMatch) return tiers

  const rows = tableMatch[1].trim().split("\n")
  for (const row of rows) {
    const cols = row.split("|").map((c) => c.trim()).filter(Boolean)
    if (cols.length >= 6) {
      tiers.push({
        name: cols[1],
        price: cols[5],
        delivery: cols[3],
      })
    }
  }
  return tiers
}

function parseDescription(content: string): string {
  const hookMatch = content.match(/### Hook\n\n([\s\S]*?)(?=\n###|\n##)/m)
  if (hookMatch) {
    const text = hookMatch[1].trim()
    return text.length > 200 ? text.substring(0, 200) + "..." : text
  }
  return ""
}

function findImage(id: string, listingsDir: string): string | null {
  const imagesDir = path.join(listingsDir, "..", "..", "images", "fiverr")
  if (!fs.existsSync(imagesDir)) return null

  const files = fs.readdirSync(imagesDir)
  const prefix = id.toLowerCase().replace("-", "-")
  const match = files.find((f) => f.startsWith(prefix.split("-").slice(0, 2).join("-").toLowerCase()))
  if (!match) {
    // Try broader match
    const idParts = id.toLowerCase().split("-")
    const broader = files.find((f) => f.startsWith(idParts[0] + "-" + idParts[1]))
    return broader ? `/images/fiverr/${broader}` : null
  }
  return `/images/fiverr/${match}`
}

export function getListings(): GigListing[] {
  const listingsDir = path.join(process.cwd(), "listings", "fiverr")
  if (!fs.existsSync(listingsDir)) return []

  const files = fs.readdirSync(listingsDir).filter((f) => f.endsWith(".md")).sort()
  const listings: GigListing[] = []

  for (const file of files) {
    const content = fs.readFileSync(path.join(listingsDir, file), "utf-8")
    const idMatch = file.match(/^([A-Z]+-\d+)/)
    if (!idMatch) continue

    const id = idMatch[1]
    const pillarKey = id.split("-")[0]

    listings.push({
      id,
      filename: file,
      title: parseTitle(content),
      pillar: PILLAR_MAP[pillarKey] || "Other",
      pillarSlug: pillarKey.toLowerCase(),
      priority: getPriority(id),
      imagePath: findImage(id, listingsDir),
      tiers: parseFiverrTiers(content),
      description: parseDescription(content),
      platform: "fiverr",
    })
  }

  return listings
}

export function getListingsByPillar(): Record<string, GigListing[]> {
  const listings = getListings()
  const grouped: Record<string, GigListing[]> = {}

  for (const listing of listings) {
    if (!grouped[listing.pillar]) grouped[listing.pillar] = []
    grouped[listing.pillar].push(listing)
  }

  return grouped
}

export function getStats() {
  const listings = getListings()
  const upworkDir = path.join(process.cwd(), "listings", "upwork")
  const upworkCount = fs.existsSync(upworkDir)
    ? fs.readdirSync(upworkDir).filter((f) => f.endsWith(".md")).length
    : 0

  const imagesDir = path.join(process.cwd(), "images", "fiverr")
  const imageCount = fs.existsSync(imagesDir)
    ? fs.readdirSync(imagesDir).filter((f) => f.endsWith(".png")).length
    : 0

  return {
    totalFiverr: listings.length,
    totalUpwork: upworkCount,
    totalImages: imageCount,
    byPriority: {
      P1: listings.filter((l) => l.priority === "P1").length,
      P2: listings.filter((l) => l.priority === "P2").length,
      P3: listings.filter((l) => l.priority === "P3").length,
    },
    byPillar: Object.entries(
      listings.reduce(
        (acc, l) => {
          acc[l.pillar] = (acc[l.pillar] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )
    ),
  }
}
