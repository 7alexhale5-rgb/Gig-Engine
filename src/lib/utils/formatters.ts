import { formatDistanceToNow, parseISO, isValid } from "date-fns"

/**
 * Format a number as USD currency (e.g. $1,234.56).
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a date as "Jan 15, 2026".
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  if (!isValid(d)) return "Invalid date"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d)
}

/**
 * Format a date in short form as "1/15".
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  if (!isValid(d)) return "--"
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
  }).format(d)
}

/**
 * Format a number as a percentage (e.g. "45.2%").
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format hours with a trailing "h" (e.g. "12.5h").
 */
export function formatHours(hours: number): string {
  // Drop unnecessary trailing zeros: 12.0 -> "12h", 12.5 -> "12.5h"
  const formatted = hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)
  return `${formatted}h`
}

/**
 * Format a date as a relative string (e.g. "2 days ago", "just now").
 * Uses date-fns formatDistanceToNow under the hood.
 */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  if (!isValid(d)) return "Invalid date"

  const now = new Date()
  const diffMs = now.getTime() - d.getTime()

  // Anything within the last 60 seconds counts as "just now"
  if (diffMs >= 0 && diffMs < 60_000) {
    return "just now"
  }

  return formatDistanceToNow(d, { addSuffix: true })
}
