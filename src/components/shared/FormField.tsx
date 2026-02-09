"use client"

import { type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface FormFieldProps {
  label: string
  name: string
  error?: string
  required?: boolean
  description?: string
  children: ReactNode
  className?: string
}

export function FormField({
  label,
  name,
  error,
  required = false,
  description,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label
        htmlFor={name}
        className={cn(
          "flex items-center gap-1",
          error && "text-red-400"
        )}
      >
        {label}
        {required && (
          <span className="text-red-400" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
