import { OPPORTUNITY_STAGES, STAGE_LABELS, STAGE_COLORS } from "@/lib/utils/constants"
import { cn } from "@/lib/utils"

export function PipelineSnapshot() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-sm font-semibold">Pipeline Snapshot</h3>
      <div className="mt-4 flex gap-3 overflow-x-auto">
        {OPPORTUNITY_STAGES.filter((s) => s !== "lost").map((stage) => (
          <div
            key={stage}
            className="flex min-w-[120px] flex-col items-center rounded-lg border border-border p-3"
          >
            <div className={cn("h-2 w-2 rounded-full", STAGE_COLORS[stage])} />
            <span className="mt-2 text-lg font-bold">0</span>
            <span className="mt-0.5 text-[11px] text-muted-foreground text-center">
              {STAGE_LABELS[stage]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
