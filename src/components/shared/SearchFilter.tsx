"use client"

import { Search } from "lucide-react"

interface SearchFilterProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

export function SearchFilter({
  placeholder = "Search...",
  value,
  onChange,
}: SearchFilterProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}
