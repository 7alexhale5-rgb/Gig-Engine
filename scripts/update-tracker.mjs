#!/usr/bin/env node

/**
 * update-tracker.mjs — Update tracker.md with fresh scraped metrics
 *
 * Reads scraped Fiverr + Upwork JSON data and patches the corresponding
 * rows in tracker.md (Impressions, Clicks, Orders, Revenue for Fiverr;
 * Proposals Sent, Interviews, Contracts, Revenue for Upwork).
 * Also updates deployment status counts and the "Last updated" date.
 *
 * Usage:
 *   node scripts/update-tracker.mjs                  # direct execution
 *   import { main } from './update-tracker.mjs'      # orchestrator import
 */

import { readFileSync, writeFileSync, existsSync, realpathSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

config({ path: join(PROJECT_ROOT, '.env.monitor') });

const GIG_ENGINE_ROOT = process.env.GIG_ENGINE_ROOT || PROJECT_ROOT;
const TRACKER_PATH = join(GIG_ENGINE_ROOT, 'tracker.md');
const DATA_DIR = join(PROJECT_ROOT, 'data');

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

/**
 * Split a markdown table row into cells, preserving padding.
 * Returns null if the line is not a table row.
 */
function parseTableRow(line) {
  if (!line.trim().startsWith('|')) return null;
  // Split by | and remove first/last empty entries
  const parts = line.split('|');
  // parts[0] is empty (before first |), parts[last] is empty (after last |)
  return parts;
}

/**
 * Replace a specific cell value in a table row, preserving column width.
 * cellIndex is 1-based (matching the | split where index 0 is empty).
 */
function updateCell(parts, cellIndex, newValue) {
  if (cellIndex < 1 || cellIndex >= parts.length - 1) return;
  if (newValue == null) return; // Don't overwrite with null

  const existing = parts[cellIndex];
  // Preserve the padding pattern: detect leading/trailing spaces
  const trimmed = existing.trim();
  const totalWidth = existing.length;
  const valueStr = String(newValue);

  // Pad to at least the same width
  if (valueStr.length >= totalWidth - 2) {
    parts[cellIndex] = ` ${valueStr} `;
  } else {
    // Right-pad to preserve alignment
    parts[cellIndex] = ` ${valueStr}${' '.repeat(totalWidth - valueStr.length - 2)} `;
    // Trim to exact original width
    parts[cellIndex] = parts[cellIndex].slice(0, totalWidth);
  }
}

/**
 * Reconstruct a table row from split parts.
 */
function joinRow(parts) {
  return parts.join('|');
}

// ---------------------------------------------------------------------------
// Fiverr table updater
// ---------------------------------------------------------------------------

/**
 * Build a lookup from gig data for Fiverr.
 * The scraper returns gigs as an array with title, impressions, clicks, orders.
 * We try to map them to tracker IDs by matching service names.
 */
function buildFiverrGigLookup(fiverr) {
  if (!fiverr || !fiverr.gigs || !Array.isArray(fiverr.gigs)) return {};

  // Map of keywords in gig titles -> tracker IDs
  const keywordMap = {
    'workflow': 'AW-01',
    'audit': 'AW-02',
    'api': 'AW-03',
    'chatbot': 'AI-01',
    'lead scor': 'AI-02',
    'gohighlevel': 'CRM-01',
    'highl': 'CRM-01',
    'migration': 'CRM-02',
    'dashboard': 'DA-01',
    'landing': 'WL-01',
    'portal': 'WL-02',
  };

  const lookup = {};
  for (const gig of fiverr.gigs) {
    if (!gig.title) continue;
    const lower = gig.title.toLowerCase();
    for (const [keyword, id] of Object.entries(keywordMap)) {
      if (lower.includes(keyword) && !lookup[id]) {
        lookup[id] = {
          impressions: gig.impressions,
          clicks: gig.clicks,
          orders: gig.orders,
          revenue: gig.revenue || null,
        };
        break;
      }
    }
  }

  return lookup;
}

/**
 * Update Fiverr table rows in the tracker lines.
 * Fiverr table columns (0-indexed from split):
 *   0: empty | 1: ID | 2: Service | 3: Pillar | 4: Launch Pricing |
 *   5: Image | 6: Status | 7: Posted | 8: URL | 9: Impressions |
 *   10: Clicks | 11: Orders | 12: Revenue | 13: empty
 */
function updateFiverrRows(lines, fiverr) {
  if (!fiverr) return { updated: 0 };

  const gigLookup = buildFiverrGigLookup(fiverr);
  let updated = 0;

  for (let i = 0; i < lines.length; i++) {
    const parts = parseTableRow(lines[i]);
    if (!parts) continue;

    const idCell = parts[1]?.trim();
    if (!idCell || !idCell.match(/^(AW|AI|CRM|DA|WL)-\d{2}$/)) continue;

    // Check if this is in the Fiverr section (has Image and URL columns = 13+ parts)
    if (parts.length < 13) continue;

    // Update status to "live" if gig data exists and it was "posted" or "generated"
    const currentStatus = parts[6]?.trim();
    const gigData = gigLookup[idCell];

    if (gigData) {
      // Update metrics
      updateCell(parts, 9, gigData.impressions);
      updateCell(parts, 10, gigData.clicks);
      updateCell(parts, 11, gigData.orders);
      if (gigData.revenue != null) {
        updateCell(parts, 12, gigData.revenue);
      }
      updated++;
    }

    // If gig has impressions/clicks, it must be live
    if (gigData && (gigData.impressions || gigData.clicks)) {
      if (currentStatus === 'generated' || currentStatus === 'posted') {
        updateCell(parts, 6, 'live');
      }
    }

    lines[i] = joinRow(parts);
  }

  return { updated };
}

// ---------------------------------------------------------------------------
// Upwork table updater
// ---------------------------------------------------------------------------

/**
 * Update Upwork table rows in the tracker lines.
 * Upwork table columns (0-indexed from split):
 *   0: empty | 1: ID | 2: Service | 3: Pillar | 4: Price Range |
 *   5: Hourly Rate | 6: Profile | 7: Status | 8: Proposals Sent |
 *   9: Interviews | 10: Contracts | 11: Revenue | 12: empty
 */
function updateUpworkRows(lines, upwork) {
  if (!upwork) return { updated: 0 };

  // Upwork scraper provides totals — distribute across rows if per-gig data exists
  const totals = upwork.totals || {};
  const perService = upwork.per_service || {};
  let updated = 0;

  for (let i = 0; i < lines.length; i++) {
    const parts = parseTableRow(lines[i]);
    if (!parts) continue;

    const idCell = parts[1]?.trim();
    if (!idCell || !idCell.match(/^(AW|AI|CRM|DA|WL)-\d{2}$/)) continue;

    // Upwork section has fewer columns (12 parts) — no Image/URL columns
    // Distinguish from Fiverr by column count
    if (parts.length >= 13) continue; // This is a Fiverr row

    // Check for per-service data
    const serviceData = perService[idCell];
    if (serviceData) {
      if (serviceData.proposals_sent != null) updateCell(parts, 8, serviceData.proposals_sent);
      if (serviceData.interviews != null) updateCell(parts, 9, serviceData.interviews);
      if (serviceData.contracts != null) updateCell(parts, 10, serviceData.contracts);
      if (serviceData.revenue != null) updateCell(parts, 11, `$${serviceData.revenue}`);
      updated++;
    }

    lines[i] = joinRow(parts);
  }

  return { updated };
}

// ---------------------------------------------------------------------------
// Deployment status updater
// ---------------------------------------------------------------------------

function updateDeploymentStatus(lines) {
  let posted = 0;
  let live = 0;
  let totalProposals = 0;

  // Count statuses from both tables
  for (const line of lines) {
    const parts = parseTableRow(line);
    if (!parts) continue;

    const idCell = parts[1]?.trim();
    if (!idCell || !idCell.match(/^(AW|AI|CRM|DA|WL)-\d{2}$/)) continue;

    // Find the status cell — check column 6 for Fiverr, column 7 for Upwork
    let status;
    if (parts.length >= 13) {
      // Fiverr row — status is column 6
      status = parts[6]?.trim();
    } else {
      // Upwork row — status is column 7
      status = parts[7]?.trim();
      // Track cumulative proposals sent (column 8 for Upwork)
      const proposals = parseInt(parts[8]?.trim(), 10);
      if (!isNaN(proposals)) totalProposals += proposals;
    }

    if (status === 'posted') posted++;
    if (status === 'live' || status === 'active') live++;
  }

  // Update the deployment status table
  for (let i = 0; i < lines.length; i++) {
    const parts = parseTableRow(lines[i]);
    if (!parts) continue;

    const metric = parts[1]?.trim();
    if (metric === '**Posted**') {
      updateCell(parts, 2, String(posted));
      lines[i] = joinRow(parts);
    } else if (metric === '**Live**') {
      updateCell(parts, 2, String(live));
      lines[i] = joinRow(parts);
    }
  }

  return { posted, live, totalProposals };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function main() {
  console.log('Updating tracker.md with fresh metrics...');

  // Read scraped data
  const fiverr = readJsonSafe(join(DATA_DIR, 'fiverr', 'metrics-latest.json'));
  const upwork = readJsonSafe(join(DATA_DIR, 'upwork', 'metrics-latest.json'));

  if (!fiverr && !upwork) {
    console.warn('No scraped data available. Nothing to update.');
    return { success: true, updated: { fiverr: 0, upwork: 0 } };
  }

  if (fiverr) console.log('  Fiverr data loaded');
  if (upwork) console.log('  Upwork data loaded');

  // Read tracker.md
  if (!existsSync(TRACKER_PATH)) {
    console.error(`tracker.md not found at ${TRACKER_PATH}`);
    return { success: false, error: 'tracker.md not found' };
  }

  const content = readFileSync(TRACKER_PATH, 'utf-8');
  const lines = content.split('\n');

  // Update "Last updated" date (line 3: "> Last updated: YYYY-MM-DD")
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (lines[i].startsWith('> Last updated:')) {
      lines[i] = `> Last updated: ${todayDate()}`;
      console.log('  Updated "Last updated" date');
      break;
    }
  }

  // Update Fiverr rows
  const fiverrResult = updateFiverrRows(lines, fiverr);
  if (fiverrResult.updated > 0) {
    console.log(`  Updated ${fiverrResult.updated} Fiverr row(s)`);
  }

  // Update Upwork rows
  const upworkResult = updateUpworkRows(lines, upwork);
  if (upworkResult.updated > 0) {
    console.log(`  Updated ${upworkResult.updated} Upwork row(s)`);
  }

  // Update deployment status counts
  const statusResult = updateDeploymentStatus(lines);
  console.log(`  Deployment status: ${statusResult.posted} posted, ${statusResult.live} live, ${statusResult.totalProposals} total proposals`);

  // Write back
  writeFileSync(TRACKER_PATH, lines.join('\n'));
  console.log(`  tracker.md written to ${TRACKER_PATH}`);

  return {
    success: true,
    updated: {
      fiverr: fiverrResult.updated,
      upwork: upworkResult.updated,
      posted: statusResult.posted,
      live: statusResult.live,
    },
  };
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
      console.log('Tracker update complete:', JSON.stringify(result.updated));
    } else {
      console.error('Tracker update failed:', result.error);
      process.exitCode = 1;
    }
  });
}
