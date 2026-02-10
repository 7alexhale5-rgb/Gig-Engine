import type { OpportunityStage } from "@/lib/supabase/types"
import { startOfWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns"

/**
 * Calculate proposal win rate as a percentage.
 * Returns 0 when no proposals have been sent.
 */
export function calculateWinRate(sent: number, won: number): number {
  if (sent <= 0) return 0
  return (won / sent) * 100
}

/**
 * Calculate the effective hourly rate for a contract.
 * Returns 0 when no hours have been logged.
 */
export function calculateEffectiveHourlyRate(
  contractValue: number,
  actualHours: number
): number {
  if (actualHours <= 0) return 0
  return contractValue / actualHours
}

/**
 * Calculate the conversion rate from impressions to orders.
 * Returns 0 when there are no impressions.
 */
export function calculateConversionRate(
  impressions: number,
  orders: number
): number {
  if (impressions <= 0) return 0
  return (orders / impressions) * 100
}

/**
 * Calculate net revenue after deducting a platform fee.
 * Both amount and platformFee are in the same currency units.
 */
export function calculateNetRevenue(
  amount: number,
  platformFee: number
): number {
  return amount - platformFee
}

/**
 * Calculate pipeline value -- the sum of contract_value for opportunities
 * in active stages between "contracted" and "delivered" (inclusive).
 */
const ACTIVE_PIPELINE_STAGES: OpportunityStage[] = [
  "contracted",
  "in_progress",
  "delivered",
]

export function calculatePipelineValue(
  opportunities: { contract_value: number | null; stage: string }[]
): number {
  return opportunities.reduce((total, opp) => {
    if (
      ACTIVE_PIPELINE_STAGES.includes(opp.stage as OpportunityStage) &&
      opp.contract_value !== null
    ) {
      return total + opp.contract_value
    }
    return total
  }, 0)
}

/**
 * Calculate total revenue for the current calendar week (Mon-Sun).
 */
export function calculateWeeklyRevenue(
  entries: { amount: number; received_date: string }[]
): number {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }) // Sunday

  return entries.reduce((total, entry) => {
    const entryDate = parseISO(entry.received_date)
    if (isWithinInterval(entryDate, { start: weekStart, end: weekEnd })) {
      return total + entry.amount
    }
    return total
  }, 0)
}
