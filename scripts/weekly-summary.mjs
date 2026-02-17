#!/usr/bin/env node

/**
 * weekly-summary.mjs — Weekly performance summary via Telegram
 *
 * Reads the last 7 days of scraped data from data/fiverr/history/ and
 * data/upwork/history/, computes week-over-week deltas, and sends a
 * summary report via Telegram. Designed to run Sundays via launchd.
 *
 * Usage:
 *   node scripts/weekly-summary.mjs               # send weekly summary
 *   node scripts/weekly-summary.mjs --dry-run     # print without sending
 *   import { main } from './weekly-summary.mjs'   # orchestrator import
 */

import { readFileSync, existsSync, realpathSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

config({ path: join(PROJECT_ROOT, '.env.monitor') });

const DATA_DIR = join(PROJECT_ROOT, 'data');
const LAUNCH_DATE = new Date('2026-02-11');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dateStr(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function dayCount() {
  const now = new Date();
  return Math.max(1, Math.ceil((now.getTime() - LAUNCH_DATE.getTime()) / (1000 * 60 * 60 * 24)));
}

function weekNumber() {
  return Math.ceil(dayCount() / 7);
}

function readJsonSafe(filepath) {
  try {
    if (!existsSync(filepath)) return null;
    return JSON.parse(readFileSync(filepath, 'utf-8'));
  } catch {
    return null;
  }
}

function lastNDays(n) {
  const dates = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(dateStr(d));
  }
  return dates;
}

function pctChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? '+new' : '--';
  const pct = ((current - previous) / previous * 100).toFixed(0);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

// ---------------------------------------------------------------------------
// Data aggregation
// ---------------------------------------------------------------------------

function aggregateWeek(platform, dates) {
  const snapshots = dates
    .map(d => readJsonSafe(join(DATA_DIR, platform, 'history', `${d}.json`)))
    .filter(Boolean);

  if (snapshots.length === 0) return null;

  const latest = snapshots[0];
  const earliest = snapshots[snapshots.length - 1];

  return { latest, earliest, days: snapshots.length };
}

// ---------------------------------------------------------------------------
// Report generation
// ---------------------------------------------------------------------------

function generateWeeklySummary() {
  const week = weekNumber();
  const day = dayCount();
  const today = new Date();
  const todayStr = dateStr(today);

  // This week = last 7 days, previous week = 7 days before that
  const thisWeekDates = lastNDays(7);
  const prevWeekDates = lastNDays(14).slice(7);

  const fiverrThis = aggregateWeek('fiverr', thisWeekDates);
  const fiverrPrev = aggregateWeek('fiverr', prevWeekDates);
  const upworkThis = aggregateWeek('upwork', thisWeekDates);
  const upworkPrev = aggregateWeek('upwork', prevWeekDates);

  let report = `PRETTYFLY WEEKLY SUMMARY
Week ${week} | Day ${day} of 90 | ${todayStr}
${'═'.repeat(40)}

`;

  // Fiverr section
  report += '--- FIVERR (this week) ---\n';
  if (fiverrThis) {
    const ft = fiverrThis.latest.totals || {};
    const fo = fiverrThis.latest.orders || {};
    const fe = fiverrThis.latest.earnings || {};
    report += `Active Gigs: ${ft.active_gigs ?? '--'}\n`;
    report += `Active Orders: ${fo.active ?? '--'}\n`;
    report += `Completed Orders: ${fo.completed ?? '--'}\n`;
    report += `Earnings Balance: $${fe.balance ?? '--'}\n`;
    report += `Data points: ${fiverrThis.days} days\n`;
  } else {
    report += '(No Fiverr data this week)\n';
  }

  report += '\n--- UPWORK (this week) ---\n';
  if (upworkThis) {
    const ut = upworkThis.latest.totals || {};
    report += `Active Proposals: ${ut.active_proposals ?? '--'}\n`;
    report += `Interviewing: ${ut.interviewing ?? '--'}\n`;
    report += `Active Contracts: ${ut.active_contracts ?? '--'}\n`;
    report += `This Month Earnings: $${ut.earnings_this_month ?? '--'}\n`;
    report += `Data points: ${upworkThis.days} days\n`;
  } else {
    report += '(No Upwork data this week)\n';
  }

  // Week-over-week comparison
  report += '\n--- WEEK-OVER-WEEK ---\n';
  if (fiverrThis && fiverrPrev) {
    const thisGigs = fiverrThis.latest.totals?.active_gigs ?? 0;
    const prevGigs = fiverrPrev.latest.totals?.active_gigs ?? 0;
    report += `Fiverr Active Gigs: ${prevGigs} -> ${thisGigs} (${pctChange(thisGigs, prevGigs)})\n`;
  }
  if (upworkThis && upworkPrev) {
    const thisProps = upworkThis.latest.totals?.active_proposals ?? 0;
    const prevProps = upworkPrev.latest.totals?.active_proposals ?? 0;
    report += `Upwork Proposals: ${prevProps} -> ${thisProps} (${pctChange(thisProps, prevProps)})\n`;

    const thisContracts = upworkThis.latest.totals?.active_contracts ?? 0;
    const prevContracts = upworkPrev.latest.totals?.active_contracts ?? 0;
    report += `Upwork Contracts: ${prevContracts} -> ${thisContracts} (${pctChange(thisContracts, prevContracts)})\n`;
  }
  if (!fiverrPrev && !upworkPrev) {
    report += '(No previous week data for comparison)\n';
  }

  // 90-day progress
  report += `\n--- 90-DAY PROGRESS ---\n`;
  const phase = day <= 14 ? 'Launch Sprint (Days 1-14)' :
                day <= 42 ? 'Volume & Optimize (Days 15-42)' :
                            'Scale & Systematize (Days 43-90)';
  const pctComplete = Math.min(100, Math.round(day / 90 * 100));
  const bar = '█'.repeat(Math.round(pctComplete / 5)) + '░'.repeat(20 - Math.round(pctComplete / 5));
  report += `Phase: ${phase}\n`;
  report += `Progress: [${bar}] ${pctComplete}%\n`;
  report += `Days remaining: ${Math.max(0, 90 - day)}\n`;

  // Action items
  report += '\n--- THIS WEEK\'S PRIORITIES ---\n';
  if (day <= 7) {
    report += '1. Post first 6 P1 Fiverr gigs\n';
    report += '2. Set up 3 Upwork specialized profiles\n';
    report += '3. Start daily proposal cadence (5-10/day)\n';
  } else if (day <= 14) {
    report += '1. Post remaining P1 Fiverr gigs\n';
    report += '2. Submit Toptal + Arc.dev applications\n';
    report += '3. Maintain 5-10 proposals/day\n';
  } else if (day <= 42) {
    report += '1. Deploy P2 Fiverr listings\n';
    report += '2. A/B test underperforming gig titles\n';
    report += '3. Promote top-converting gigs ($10-15/day)\n';
  } else {
    report += '1. Deploy P3 listings\n';
    report += '2. Raise prices on gigs with 10+ reviews\n';
    report += '3. Push retainer conversions\n';
  }

  return report;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const report = generateWeeklySummary();

  if (dryRun) {
    console.log(report);
    return { success: true, report, sent: false };
  }

  // Send via Telegram
  const { main: sendTelegram } = await import('./send-telegram.mjs');
  const result = await sendTelegram(report);

  if (result.success) {
    console.log('Weekly summary sent to Telegram.');
  } else {
    console.error('Failed to send weekly summary:', result.error);
  }

  return { success: result.success, report, sent: true };
}

// ---------------------------------------------------------------------------
// Direct execution
// ---------------------------------------------------------------------------

const self = realpathSync(fileURLToPath(import.meta.url));
const arg = process.argv[1] ? realpathSync(process.argv[1]) : '';

if (self === arg) {
  main().then((result) => {
    if (!result.success) {
      process.exitCode = 1;
    }
  });
}
