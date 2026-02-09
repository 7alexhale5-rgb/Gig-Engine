"use client"

import { BarChart3 } from "lucide-react"

export function RevenueChart() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Revenue (7 Day)</h3>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-4 flex h-48 items-center justify-center text-sm text-muted-foreground">
        Revenue chart renders here with Recharts once Supabase is connected.
      </div>
    </div>
  )
}
