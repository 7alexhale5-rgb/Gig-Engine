import { cn } from "@/lib/utils"

const PLATFORM_STYLES: Record<string, string> = {
  Upwork: "bg-green-500/15 text-green-400 border-green-500/20",
  Fiverr: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Toptal: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  "Arc.dev": "bg-violet-500/15 text-violet-400 border-violet-500/20",
  PeoplePerHour: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  Guru: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  "LinkedIn Services": "bg-blue-600/15 text-blue-300 border-blue-600/20",
  "Direct/Referral": "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
}

interface PlatformBadgeProps {
  platform: string
  className?: string
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        PLATFORM_STYLES[platform] || "bg-muted text-muted-foreground border-border",
        className
      )}
    >
      {platform}
    </span>
  )
}
