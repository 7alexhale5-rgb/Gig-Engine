#!/usr/bin/env node

/**
 * scrape-fiverr.mjs — Headless Fiverr dashboard scraper
 *
 * Scrapes seller dashboard, orders, and inbox from Fiverr using a
 * previously saved session (from fiverr-login.mjs).
 *
 * Outputs structured JSON to data/fiverr/metrics-latest.json
 * and archives a dated copy to data/fiverr/history/YYYY-MM-DD.json.
 *
 * Usage:
 *   node scripts/scrape-fiverr.mjs        # direct execution
 *   import { main } from './scrape-fiverr.mjs'  # orchestrator import
 */

import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { existsSync, writeFileSync, mkdirSync, realpathSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { config } from 'dotenv';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

// Load .env.monitor
config({ path: join(PROJECT_ROOT, '.env.monitor') });

const AUTH_FILE = join(homedir(), '.gig-engine', 'fiverr-auth.json');
const DATA_DIR = join(PROJECT_ROOT, 'data', 'fiverr');
const HISTORY_DIR = join(DATA_DIR, 'history');
const LATEST_FILE = join(DATA_DIR, 'metrics-latest.json');

// ---------------------------------------------------------------------------
// Selectors — PROVISIONAL, may need updating after first real run
// ---------------------------------------------------------------------------

// SELECTOR: May need updating — dashboard seller level
const SELLER_LEVEL_SELECTORS = [
  '[data-testid="seller-level"]',
  '.seller-level',
  '.seller-level-label',
  '.level-title',
  '.seller-card .level',
];

// SELECTOR: May need updating — response rate
const RESPONSE_RATE_SELECTORS = [
  '[data-testid="response-rate"]',
  '.response-rate .value',
  '.stats-card .response-rate',
];

// SELECTOR: May need updating — response time
const RESPONSE_TIME_SELECTORS = [
  '[data-testid="response-time"]',
  '.response-time .value',
  '.stats-card .response-time',
];

// SELECTOR: May need updating — earnings balance
const EARNINGS_BALANCE_SELECTORS = [
  '[data-testid="earnings-balance"]',
  '.balance-amount',
  '.earnings .balance',
  '.revenue-card .total',
];

// SELECTOR: May need updating — pending clearance
const PENDING_CLEARANCE_SELECTORS = [
  '[data-testid="pending-clearance"]',
  '.pending-clearance .amount',
  '.clearance-amount',
];

// SELECTOR: May need updating — available for withdrawal
const AVAILABLE_WITHDRAWAL_SELECTORS = [
  '[data-testid="available-funds"]',
  '.available-funds .amount',
  '.withdrawal-amount',
];

// SELECTOR: May need updating — active gigs count
const ACTIVE_GIGS_SELECTORS = [
  '[data-testid="active-gigs"]',
  '.active-gigs .count',
  '.gigs-count',
  '.manage-gigs .count',
];

// SELECTOR: May need updating — order counts
const ORDER_SELECTORS = {
  active: [
    '[data-testid="active-orders"]',
    '.active-orders .count',
    '.orders-active',
  ],
  delivered: [
    '[data-testid="delivered-orders"]',
    '.delivered-orders .count',
    '.orders-delivered',
  ],
  completed: [
    '[data-testid="completed-orders"]',
    '.completed-orders .count',
    '.orders-completed',
  ],
  late: [
    '[data-testid="late-orders"]',
    '.late-orders .count',
    '.orders-late',
  ],
};

// SELECTOR: May need updating — inbox unread count
const INBOX_UNREAD_SELECTORS = [
  '[data-testid="unread-count"]',
  '.unread-count',
  '.inbox-count',
  '.nav-inbox .badge',
  '.messages-count',
];

// ---------------------------------------------------------------------------
// Stealth setup
// ---------------------------------------------------------------------------

chromium.use(StealthPlugin());

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Random delay between 3-8 seconds */
const delay = () => new Promise((r) => setTimeout(r, 3000 + Math.random() * 5000));

/**
 * Try multiple selector strategies to extract a text value from the page.
 * Falls back to regex search in the page body for `label` near a number.
 */
async function extractMetric(page, label, selectors) {
  // Strategy 1: Try each CSS selector
  for (const selector of selectors) {
    try {
      const el = await page.$(selector);
      if (el) {
        const text = await el.textContent();
        if (text && text.trim()) return text.trim();
      }
    } catch {
      // Selector didn't match, try next
    }
  }

  // Strategy 2: Search page text for label + nearby number
  try {
    const content = await page.textContent('body');
    const regex = new RegExp(`${label}[:\\s]*([\\d,.]+)`, 'i');
    const match = content.match(regex);
    if (match) return match[1];
  } catch {
    // Body text extraction failed
  }

  return null;
}

/**
 * Parse a string like "$1,234.56" or "1234" into a number, or return null.
 */
function parseNumber(val) {
  if (val == null) return null;
  const cleaned = String(val).replace(/[$,]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Today's date as YYYY-MM-DD in local timezone.
 */
function todayDate() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

// ---------------------------------------------------------------------------
// Page scrapers
// ---------------------------------------------------------------------------

async function scrapeDashboard(page) {
  console.log('Scraping Fiverr dashboard...');

  try {
    await page.goto('https://www.fiverr.com/seller_dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
  } catch (err) {
    console.error('Failed to load dashboard:', err.message);
    return { redirectedToLogin: false };
  }

  // Check for login redirect
  if (page.url().includes('/login')) {
    return { redirectedToLogin: true };
  }

  // Wait for main content to appear
  try {
    await page.waitForSelector('main, .dashboard, [role="main"], #main', {
      timeout: 15000,
    });
  } catch {
    console.warn('Warning: Could not confirm dashboard content loaded, continuing anyway...');
  }

  const sellerLevel = await extractMetric(page, 'Level', SELLER_LEVEL_SELECTORS);
  const responseRate = await extractMetric(page, 'Response rate', RESPONSE_RATE_SELECTORS);
  const responseTime = await extractMetric(page, 'Response time', RESPONSE_TIME_SELECTORS);
  const balance = await extractMetric(page, 'Balance', EARNINGS_BALANCE_SELECTORS);
  const pendingClearance = await extractMetric(page, 'Pending clearance', PENDING_CLEARANCE_SELECTORS);
  const availableWithdrawal = await extractMetric(page, 'Available for withdrawal', AVAILABLE_WITHDRAWAL_SELECTORS);
  const activeGigs = await extractMetric(page, 'Active gigs', ACTIVE_GIGS_SELECTORS);

  // Try to extract gig list from dashboard
  let gigs = [];
  try {
    gigs = await page.evaluate(() => {
      const gigElements = document.querySelectorAll(
        '.gig-card, [data-testid="gig-card"], .seller-gig, .manage-gigs .gig'
      );
      return Array.from(gigElements).map((el) => {
        const title = el.querySelector('.gig-title, h3, h4, a')?.textContent?.trim() || null;
        const impressions = el.querySelector('.impressions, [data-testid="impressions"]')?.textContent?.trim() || null;
        const clicks = el.querySelector('.clicks, [data-testid="clicks"]')?.textContent?.trim() || null;
        const orders = el.querySelector('.orders, [data-testid="orders"]')?.textContent?.trim() || null;
        return { title, impressions, clicks, orders };
      });
    });
  } catch {
    console.warn('Warning: Could not extract gig list from dashboard');
  }

  return {
    redirectedToLogin: false,
    sellerLevel: sellerLevel || 'new_seller',
    responseRate,
    responseTime,
    earnings: {
      balance: parseNumber(balance),
      pending_clearance: parseNumber(pendingClearance),
      available_for_withdrawal: parseNumber(availableWithdrawal),
    },
    activeGigs: parseNumber(activeGigs) || 0,
    gigs,
  };
}

async function scrapeOrders(page) {
  console.log('Navigating to orders...');

  try {
    await page.goto('https://www.fiverr.com/manage_orders', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
  } catch (err) {
    console.error('Failed to load orders page:', err.message);
    return { active: 0, delivered: 0, completed: 0, late: 0 };
  }

  // Wait for orders content
  try {
    await page.waitForSelector('main, .orders, [role="main"], #main', {
      timeout: 15000,
    });
  } catch {
    console.warn('Warning: Could not confirm orders content loaded, continuing anyway...');
  }

  const active = parseNumber(
    await extractMetric(page, 'Active', ORDER_SELECTORS.active)
  ) || 0;
  const delivered = parseNumber(
    await extractMetric(page, 'Delivered', ORDER_SELECTORS.delivered)
  ) || 0;
  const completed = parseNumber(
    await extractMetric(page, 'Completed', ORDER_SELECTORS.completed)
  ) || 0;
  const late = parseNumber(
    await extractMetric(page, 'Late', ORDER_SELECTORS.late)
  ) || 0;

  return { active, delivered, completed, late };
}

async function scrapeInbox(page) {
  console.log('Navigating to inbox...');

  try {
    await page.goto('https://www.fiverr.com/inbox', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
  } catch (err) {
    console.error('Failed to load inbox:', err.message);
    return { unread: 0 };
  }

  // Wait for inbox content
  try {
    await page.waitForSelector('main, .inbox, [role="main"], #main', {
      timeout: 15000,
    });
  } catch {
    console.warn('Warning: Could not confirm inbox content loaded, continuing anyway...');
  }

  const unread = parseNumber(
    await extractMetric(page, 'Unread', INBOX_UNREAD_SELECTORS)
  ) || 0;

  return { unread };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function main() {
  // Verify auth file exists
  if (!existsSync(AUTH_FILE)) {
    const msg = `Auth file not found at ${AUTH_FILE}. Run fiverr-login.mjs first.`;
    console.error(msg);
    return { success: false, error: 'no_auth_file', message: msg };
  }

  let browser;
  try {
    console.log('Launching browser...');

    browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled'],
    });

    const context = await browser.newContext({
      storageState: AUTH_FILE,
      viewport: { width: 1440, height: 900 },
      locale: 'en-US',
      timezoneId: 'America/Chicago',
    });

    const page = await context.newPage();

    // ---- Dashboard ----
    const dashboard = await scrapeDashboard(page);

    if (dashboard.redirectedToLogin) {
      console.error('Fiverr session expired — redirected to login.');
      await browser.close();
      return {
        success: false,
        error: 'auth_expired',
        message: 'Fiverr session expired. Run fiverr-login.mjs to re-authenticate.',
      };
    }

    await delay();

    // ---- Orders ----
    const orders = await scrapeOrders(page);

    await delay();

    // ---- Inbox ----
    const inbox = await scrapeInbox(page);

    // ---- Re-save session state ----
    console.log('Saving updated session state...');
    await context.storageState({ path: AUTH_FILE });

    await browser.close();
    browser = null;

    // ---- Build output ----
    const result = {
      scraped_at: new Date().toISOString(),
      platform: 'fiverr',
      success: true,
      seller_level: dashboard.sellerLevel,
      response_rate: dashboard.responseRate,
      response_time: dashboard.responseTime,
      gigs: dashboard.gigs,
      inbox,
      orders,
      earnings: dashboard.earnings,
      totals: {
        active_gigs: dashboard.activeGigs,
      },
    };

    // ---- Write output files ----
    mkdirSync(HISTORY_DIR, { recursive: true });

    writeFileSync(LATEST_FILE, JSON.stringify(result, null, 2));
    console.log(`Wrote metrics to ${LATEST_FILE}`);

    const historyFile = join(HISTORY_DIR, `${todayDate()}.json`);
    writeFileSync(historyFile, JSON.stringify(result, null, 2));
    console.log(`Archived to ${historyFile}`);

    console.log('Fiverr scrape complete.');
    return { success: true, data: result };
  } catch (err) {
    console.error('Fiverr scrape failed:', err.message);
    return { success: false, error: 'scrape_error', message: err.message };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

// ---------------------------------------------------------------------------
// Direct execution — runs when invoked via `node scripts/scrape-fiverr.mjs`
// ---------------------------------------------------------------------------

const self = realpathSync(fileURLToPath(import.meta.url));
const arg = process.argv[1] ? realpathSync(process.argv[1]) : '';

if (self === arg) {
  main().then((result) => {
    if (result.success) {
      console.log('');
      console.log('Result:', JSON.stringify(result.data, null, 2));
    } else {
      console.error('');
      console.error('Error:', result.error, '-', result.message);
      process.exitCode = 1;
    }
  });
}
