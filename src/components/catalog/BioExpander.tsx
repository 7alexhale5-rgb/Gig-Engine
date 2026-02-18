"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"

interface BioExpanderProps {
  bio: string
}

export default function BioExpander({ bio }: BioExpanderProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="text-center">
      <div
        className={
          expanded
            ? "prose prose-sm max-w-none text-muted-foreground"
            : "prose prose-sm max-w-none text-muted-foreground sm:block"
        }
      >
        {/* On mobile, clamp to 3 lines unless expanded */}
        <div className={!expanded ? "line-clamp-3 sm:line-clamp-none" : ""}>
          <ReactMarkdown>{bio}</ReactMarkdown>
        </div>
      </div>
      {/* Read more button: only shown on mobile (hidden on sm+) */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-1 text-sm text-primary underline-offset-2 hover:underline sm:hidden"
        type="button"
      >
        {expanded ? "Read less" : "Read more"}
      </button>
    </div>
  )
}
