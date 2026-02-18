"use client"

import { useState } from "react"
import { X } from "lucide-react"

export function VerificationBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="flex items-center justify-between gap-4 border-b border-amber-500/30 bg-amber-900/20 px-6 py-3">
      <p className="text-sm text-amber-200">
        <span className="font-medium">Verify your email</span> to make your catalog page live.{" "}
        Check your inbox for a verification link.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 text-amber-400 hover:bg-amber-500/20 hover:text-amber-200"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
