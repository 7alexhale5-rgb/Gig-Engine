#!/usr/bin/env node

/**
 * generate-report.mjs — Morning briefing synthesis via Haiku 4.5
 *
 * Reads scraped Fiverr + Upwork metrics, calls Anthropic Haiku 4.5
 * to generate a concise morning briefing, writes to data/reports/.
 * Falls back to a template-based report if the API call fails.
 *
 * Usage:
 *   node scripts/generate-report.mjs               # direct execution
 *   import { main } from './generate-report.mjs'    # orchestrator import
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { realpathSync } from 'fs';
import { config } from 'dotenv';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

config({ path: join(PROJECT_ROOT, '.env.monitor') });

const DATA_DIR = join(PROJECT_ROOT, 'data');
const REPORTS_DIR = join(DATA_DIR, 'reports');
const LAUNCH_DATE = new Date('2026-02-11');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayDate() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function yesterdayDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function dayOfWeek() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

function dayCount() {
  const now = new Date();
  const diff = now.getTime() - LAUNCH_DATE.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function readJsonSafe(filepath) {
  try {
    if (!existsSync(filepath)) return null;
    const raw = readFileSync(filepath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Warning: Could not read ${filepath}: ${err.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Template fallback (when Haiku unavailable)
// ---------------------------------------------------------------------------

function generateFallbackReport(fiverr, upwork, yesterdayFiverr, yesterdayUpwork) {
  const date = todayDate();
  const day = dayOfWeek();
  const n = dayCount();

  const f = fiverr || {};
  const u = upwork || {};
  const fTotals = f.totals || {};
  const fOrders = f.orders || {};
  const fInbox = f.inbox || {};
  const fEarnings = f.earnings || {};

  const uTotals = u.totals || {};
  const uInbox = u.inbox || {};
  const uMatches = u.job_matches || [];

  let report = `PRETTYFLY MORNING BRIEFING
${date} (${day}) | Day ${n} of 90

--- FIVERR ---
Active Gigs: ${fTotals.active_gigs ?? '--'}
Unread Messages: ${fInbox.unread ?? '--'}
Active Orders: ${fOrders.active ?? '--'}
Late Deliveries: ${fOrders.late ?? '--'}
Earnings Balance: $${fEarnings.balance ?? '--'}

--- UPWORK ---
Active Proposals: ${uTotals.active_proposals ?? '--'}
Interviewing: ${uTotals.interviewing ?? '--'}
Active Contracts: ${uTotals.active_contracts ?? '--'}
Unread Messages: ${uInbox.unread ?? '--'}
This Month: $${uTotals.earnings_this_month ?? '--'}

--- TOP JOB MATCHES ---
`;

  if (uMatches.length > 0) {
    for (const match of uMatches.slice(0, 5)) {
      const budget = match.budget || 'N/A';
      const proposals = match.proposals_count ?? match.proposals ?? '?';
      report += `- ${match.title} (${budget}, ${proposals} proposals)\n`;
    }
  } else {
    report += '(No job match data available)\n';
  }

  report += '\n[AI insights unavailable - raw metrics only]';

  return report;
}

// ---------------------------------------------------------------------------
// System prompt for Haiku
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are Alex's morning briefing assistant for PrettyFly.ai freelance operations.

Given today's Fiverr and Upwork metrics (and yesterday's for comparison if available), generate a concise morning briefing.

Rules:
- Start with "PRETTYFLY MORNING BRIEFING" header with date and day of week
- Show day count (calculate from launch date 2026-02-11)
- Platform sections: FIVERR and UPWORK with key metrics
- Show day-over-day percentage changes where yesterday's data exists
- Flag anomalies: >20% drops get a warning marker, new orders/messages get highlighted
- List top 3-5 Upwork job matches with title, budget, and proposal count
- End with "PRIORITIES" section: top 3 actionable items for the morning
- Keep under 300 words total
- Use plain text compatible with Telegram (no markdown links, no HTML)
- Only use a warning symbol for genuinely critical alerts`;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function main() {
  const date = todayDate();
  const yesterday = yesterdayDate();

  console.log(`Generating morning report for ${date}...`);

  // Read today's scraped data
  const fiverr = readJsonSafe(join(DATA_DIR, 'fiverr', 'metrics-latest.json'));
  const upwork = readJsonSafe(join(DATA_DIR, 'upwork', 'metrics-latest.json'));

  // Read yesterday's data for comparison
  const yesterdayFiverr = readJsonSafe(join(DATA_DIR, 'fiverr', 'history', `${yesterday}.json`));
  const yesterdayUpwork = readJsonSafe(join(DATA_DIR, 'upwork', 'history', `${yesterday}.json`));

  if (!fiverr && !upwork) {
    console.warn('No scraped data found for either platform. Generating empty report.');
  } else {
    if (fiverr) console.log('  Fiverr data loaded');
    if (upwork) console.log('  Upwork data loaded');
    if (yesterdayFiverr) console.log('  Yesterday Fiverr data loaded (day-over-day)');
    if (yesterdayUpwork) console.log('  Yesterday Upwork data loaded (day-over-day)');
  }

  // Build the user message payload
  const payload = {
    date,
    day_of_week: dayOfWeek(),
    day_number: dayCount(),
    today: {
      fiverr: fiverr || null,
      upwork: upwork || null,
    },
    yesterday: {
      fiverr: yesterdayFiverr || null,
      upwork: yesterdayUpwork || null,
    },
  };

  let report;

  // Attempt Haiku synthesis
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      console.log('Calling Haiku 4.5 for synthesis...');

      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: JSON.stringify(payload, null, 2),
          },
        ],
      });

      report = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n');

      console.log('Haiku synthesis complete.');
    } catch (err) {
      console.error(`Haiku API call failed: ${err.message}`);
      console.log('Falling back to template report...');
      report = generateFallbackReport(fiverr, upwork, yesterdayFiverr, yesterdayUpwork);
    }
  } else {
    console.log('No ANTHROPIC_API_KEY set. Using template fallback.');
    report = generateFallbackReport(fiverr, upwork, yesterdayFiverr, yesterdayUpwork);
  }

  // Write report to file
  mkdirSync(REPORTS_DIR, { recursive: true });
  const reportPath = join(REPORTS_DIR, `${date}.md`);
  writeFileSync(reportPath, report);
  console.log(`Report written to ${reportPath}`);

  return { success: true, report };
}

// ---------------------------------------------------------------------------
// Direct execution
// ---------------------------------------------------------------------------

const self = realpathSync(fileURLToPath(import.meta.url));
const arg = process.argv[1] ? realpathSync(process.argv[1]) : '';

if (self === arg) {
  main().then((result) => {
    if (result.success) {
      console.log('');
      console.log(result.report);
    } else {
      console.error('Report generation failed:', result.error);
      process.exitCode = 1;
    }
  });
}
