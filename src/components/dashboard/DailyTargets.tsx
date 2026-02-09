import { Send, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface DailyTargetsProps {
  proposalsSent: number
  proposalTarget: number
  gigsUpdated: number
  gigTarget: number
}

function ProgressBar({
  value,
  max,
  color,
}: {
  value: number
  max: number
  color: string
}) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className={cn("h-2 rounded-full transition-all", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function DailyTargets({
  proposalsSent,
  proposalTarget,
  gigsUpdated,
  gigTarget,
}: DailyTargetsProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-sm font-semibold">Daily Targets</h3>

      <div className="mt-4 space-y-5">
        {/* Proposals */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-pillar-automation" />
              <span className="text-sm">Proposals Sent</span>
            </div>
            <span className="text-sm font-medium">
              {proposalsSent}/{proposalTarget}
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar
              value={proposalsSent}
              max={proposalTarget}
              color="bg-pillar-automation"
            />
          </div>
        </div>

        {/* Gig Updates */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-pillar-ai" />
              <span className="text-sm">Gigs Updated</span>
            </div>
            <span className="text-sm font-medium">
              {gigsUpdated}/{gigTarget}
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar
              value={gigsUpdated}
              max={gigTarget}
              color="bg-pillar-ai"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
