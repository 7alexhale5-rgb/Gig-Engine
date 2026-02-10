import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

function SkeletonBlock({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-zinc-800", className)}
    />
  )
}

export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800 bg-zinc-900/50 p-6",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-5 w-16 rounded-full" />
      </div>
      <SkeletonBlock className="mt-4 h-8 w-32" />
      <SkeletonBlock className="mt-3 h-3 w-48" />
      <SkeletonBlock className="mt-2 h-3 w-36" />
    </div>
  )
}

interface TableRowSkeletonProps {
  columns?: number
  rows?: number
  className?: string
}

export function TableRowSkeleton({
  columns = 5,
  rows = 5,
  className,
}: TableRowSkeletonProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="flex gap-4 border-b border-zinc-800 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBlock
            key={`header-${i}`}
            className={cn(
              "h-3",
              i === 0 ? "w-40" : i === columns - 1 ? "w-20" : "w-28"
            )}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className="flex items-center gap-4 border-b border-zinc-800/50 px-4 py-4"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <SkeletonBlock
              key={`cell-${rowIdx}-${colIdx}`}
              className={cn(
                "h-3",
                colIdx === 0
                  ? "w-36"
                  : colIdx === columns - 1
                    ? "w-16"
                    : "w-24"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface KanbanSkeletonProps {
  columns?: number
  cardsPerColumn?: number
  className?: string
}

export function KanbanSkeleton({
  columns = 4,
  cardsPerColumn = 3,
  className,
}: KanbanSkeletonProps) {
  return (
    <div className={cn("flex gap-4 overflow-x-auto", className)}>
      {Array.from({ length: columns }).map((_, colIdx) => (
        <div
          key={`col-${colIdx}`}
          className="flex w-72 shrink-0 flex-col rounded-lg border border-zinc-800 bg-zinc-900/50"
        >
          {/* Column header */}
          <div className="flex items-center gap-2 border-b border-zinc-800 p-3">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-5 w-6 rounded-full" />
          </div>
          {/* Cards */}
          <div className="flex flex-col gap-3 p-3">
            {Array.from({ length: cardsPerColumn }).map((_, cardIdx) => (
              <div
                key={`card-${colIdx}-${cardIdx}`}
                className="rounded-md border border-zinc-800 bg-zinc-900 p-3"
              >
                <SkeletonBlock className="h-3.5 w-full" />
                <SkeletonBlock className="mt-2.5 h-3 w-3/4" />
                <div className="mt-3 flex items-center gap-2">
                  <SkeletonBlock className="h-5 w-14 rounded-full" />
                  <SkeletonBlock className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

interface FormSkeletonProps {
  fields?: number
  className?: string
}

export function FormSkeleton({ fields = 4, className }: FormSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={`field-${i}`} className="space-y-2">
          <SkeletonBlock className="h-3.5 w-20" />
          <SkeletonBlock
            className={cn(
              "w-full rounded-md",
              i === fields - 1 ? "h-24" : "h-10"
            )}
          />
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-2">
        <SkeletonBlock className="h-10 w-20 rounded-md" />
        <SkeletonBlock className="h-10 w-24 rounded-md" />
      </div>
    </div>
  )
}
