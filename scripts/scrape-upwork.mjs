#!/usr/bin/env node

/**
 * Upwork Scraper — Headless Playwright
 *
 * Scrapes the Upwork freelancer dashboard:
 *   - Best-match job listings
 *   - Proposal counts
 *   - Active contracts
 *   - Unread messages
 *   - Earnings overview
 *
 * Uses playwright-extra + stealth plugin for anti-detection.
 * Loads auth from ~/.gig-engine/upwork-auth.json (created by upwork-login.mjs).
 *
 * Writes output to data/upwork/metrics-latest.json + data/upwork/history/YYYY-MM-DD.json
 *
 * Usage:
 *   node scripts/scrape-upwork.mjs       (direct execution)
 *   import { main } from './scrape-upwork.mjs'  (module import)
 */

import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { existsSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { config } from 'dotenv';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

config({ path: join(PROJECT_ROOT, '.env.monitor') });

chromium.use(StealthPlugin());

const AUTH_FILE = join(homedir(), '.gig-engine', 'upwork-auth.json');
const OUTPUT_DIR = join(PROJECT_ROOT, 'data', 'upwork');
const HISTORY_DIR = join(OUTPUT_DIR, 'history');
const LATEST_FILE = join(OUTPUT_DIR, 'metrics-latest.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Random delay between 3-8 seconds */
function randomDelay() {
  return 3000 + Math.random() * 5000;
}

/** Format current timestamp in ISO with timezone offset */
function timestamp() {
  return new Date().toISOString();
}

/** Today as YYYY-MM-DD */
function todayStr() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Safe text extraction — returns null if selector not found */
async function safeText(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    const el = await page.$(selector);
    if (!el) return null;
    const text = await el.innerText();
    return text?.trim() || null;
  } catch {
    return null;
  }
}

/** Safe number extraction from text */
async function safeNumber(page, selector, timeout = 5000) {
  const text = await safeText(page, selector, timeout);
  if (!text) return null;
  const num = parseFloat(text.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num;
}

/** Extract number from text content using regex pattern */
function extractNumber(text) {
  if (!text) return null;
  const match = text.match(/[\d,.]+/);
  if (!match) return null;
  const num = parseFloat(match[0].replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

// ---------------------------------------------------------------------------
// Page scrapers — each is independent; failures don't block others
// ---------------------------------------------------------------------------

async function scrapeJobMatches(page) {
  console.log('  Scraping Upwork job matches...');
  try {
    await page.goto('https://www.upwork.com/nx/find-work/best-matches', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for job listings to render — try multiple selectors
    const jobListSelectors = [
      '[data-test="job-tile-list"]',
      '[data-test="JobsList"]',
      'section.up-card-section',
      '.job-tile',
      'article',
    ];

    let loaded = false;
    for (const sel of jobListSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 10000 });
        loaded = true;
        break;
      } catch {
        // try next selector
      }
    }

    if (!loaded) {
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    }

    // Extract job cards
    const jobs = await page.evaluate(() => {
      const results = [];

      // Strategy 1: data-test attribute tiles
      let cards = document.querySelectorAll('[data-test="job-tile-list"] > div, [data-test="JobsList"] > div');

      // Strategy 2: section-based tiles
      if (!cards.length) {
        cards = document.querySelectorAll('section.up-card-section, .job-tile, article.job-tile');
      }

      // Strategy 3: broader card pattern
      if (!cards.length) {
        cards = document.querySelectorAll('[class*="job-tile"], [class*="JobTile"]');
      }

      const maxCards = Math.min(cards.length, 10);
      for (let i = 0; i < maxCards; i++) {
        const card = cards[i];

        // Title extraction — multiple strategies
        const titleEl =
          card.querySelector('[data-test="job-tile-title"] a') ||
          card.querySelector('[data-test="UpLink"] a') ||
          card.querySelector('h2 a, h3 a, h4 a') ||
          card.querySelector('a[href*="/jobs/"]');

        const title = titleEl?.textContent?.trim() || null;
        const url = titleEl?.href || null;

        // Budget
        const budgetEl =
          card.querySelector('[data-test="budget"]') ||
          card.querySelector('[data-test="is-fixed-price"]') ||
          card.querySelector('[class*="budget"], [class*="Budget"]');
        const budget = budgetEl?.textContent?.trim() || null;

        // Proposals count
        const proposalEl =
          card.querySelector('[data-test="proposals"]') ||
          card.querySelector('[class*="proposals"]');
        let proposals = null;
        if (proposalEl) {
          const pText = proposalEl.textContent;
          const pMatch = pText?.match(/(\d+)/);
          proposals = pMatch ? parseInt(pMatch[1]) : null;
        }

        // Posted time
        const timeEl =
          card.querySelector('[data-test="posted-on"]') ||
          card.querySelector('[class*="posted"], time, [data-test="JobTileTimestamp"]');
        const posted = timeEl?.textContent?.trim() || null;

        if (title) {
          results.push({ title, budget, proposals, posted, url });
        }
      }

      return results;
    });

    console.log(`    Found ${jobs.length} job matches`);
    return jobs;
  } catch (err) {
    console.error(`    Error scraping job matches: ${err.message}`);
    return [];
  }
}

async function scrapeProposals(page) {
  console.log('  Navigating to proposals...');
  try {
    await page.waitForTimeout(randomDelay());
    await page.goto('https://www.upwork.com/nx/proposals/overview', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const proposals = await page.evaluate(() => {
      const data = { total_active: 0, pending: 0, interviewing: 0 };

      // Strategy 1: Look for tab/section headers with counts
      const allText = document.body.innerText || '';

      // Look for patterns like "Active (5)" or "Submitted (3)"
      const activeMatch = allText.match(/(?:Active|Submitted)\s*\(?(\d+)\)?/i);
      const pendingMatch = allText.match(/(?:Pending|Waiting)\s*\(?(\d+)\)?/i);
      const interviewMatch = allText.match(/(?:Interview|Interviewing)\s*\(?(\d+)\)?/i);

      if (activeMatch) data.total_active = parseInt(activeMatch[1]);
      if (pendingMatch) data.pending = parseInt(pendingMatch[1]);
      if (interviewMatch) data.interviewing = parseInt(interviewMatch[1]);

      // Strategy 2: data-test attributes
      const tabSelectors = [
        '[data-test="tab-active"]',
        '[data-test="tab-submitted"]',
        '[data-test="tab-interviewing"]',
      ];
      for (const sel of tabSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const numMatch = el.textContent?.match(/(\d+)/);
          if (numMatch) {
            const count = parseInt(numMatch[1]);
            if (sel.includes('active') || sel.includes('submitted')) data.total_active = count;
            if (sel.includes('interviewing')) data.interviewing = count;
          }
        }
      }

      // Strategy 3: Count list items on the page
      if (data.total_active === 0) {
        const items = document.querySelectorAll(
          '[data-test="ProposalItem"], .up-card-section, [class*="proposal-item"]'
        );
        if (items.length > 0) data.total_active = items.length;
      }

      return data;
    });

    console.log(`    Proposals — active: ${proposals.total_active}, pending: ${proposals.pending}, interviewing: ${proposals.interviewing}`);
    return proposals;
  } catch (err) {
    console.error(`    Error scraping proposals: ${err.message}`);
    return { total_active: 0, pending: 0, interviewing: 0 };
  }
}

async function scrapeContracts(page) {
  console.log('  Navigating to contracts...');
  try {
    await page.waitForTimeout(randomDelay());
    await page.goto('https://www.upwork.com/nx/contracts/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const contracts = await page.evaluate(() => {
      const items = [];

      // Strategy 1: Contract list items via data-test
      let cards = document.querySelectorAll(
        '[data-test="ContractTile"], [data-test="contract-tile"]'
      );

      // Strategy 2: table rows
      if (!cards.length) {
        cards = document.querySelectorAll('table tbody tr, .up-card-section');
      }

      // Strategy 3: broader patterns
      if (!cards.length) {
        cards = document.querySelectorAll('[class*="contract-tile"], [class*="ContractTile"]');
      }

      for (const card of cards) {
        const titleEl =
          card.querySelector('[data-test="contract-title"] a') ||
          card.querySelector('a[href*="/contracts/"]') ||
          card.querySelector('h3, h4');
        const title = titleEl?.textContent?.trim() || null;

        const clientEl =
          card.querySelector('[data-test="client-name"]') ||
          card.querySelector('[class*="client"]');
        const client = clientEl?.textContent?.trim() || null;

        // Value / rate
        const valueEl =
          card.querySelector('[data-test="contract-value"]') ||
          card.querySelector('[data-test="contract-rate"]') ||
          card.querySelector('[class*="rate"], [class*="budget"]');
        const value = valueEl?.textContent?.trim() || null;

        // Status
        const statusEl =
          card.querySelector('[data-test="contract-status"]') ||
          card.querySelector('.up-badge, [class*="status"]');
        const status = statusEl?.textContent?.trim() || 'active';

        if (title) {
          items.push({ title, client, value, status });
        }
      }

      return items;
    });

    console.log(`    Found ${contracts.length} active contracts`);
    return { active: contracts.length, items: contracts };
  } catch (err) {
    console.error(`    Error scraping contracts: ${err.message}`);
    return { active: 0, items: [] };
  }
}

async function scrapeMessages(page) {
  console.log('  Navigating to messages...');
  try {
    await page.waitForTimeout(randomDelay());
    await page.goto('https://www.upwork.com/ab/messages', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const messages = await page.evaluate(() => {
      let unread = 0;

      // Strategy 1: Badge count on navigation or message list
      const badgeSelectors = [
        '[data-test="unread-count"]',
        '.nav-badge',
        '[class*="unread-count"]',
        '[class*="badge"]',
      ];
      for (const sel of badgeSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const numMatch = el.textContent?.match(/(\d+)/);
          if (numMatch) {
            unread = parseInt(numMatch[1]);
            break;
          }
        }
      }

      // Strategy 2: Count unread message indicators
      if (unread === 0) {
        const unreadItems = document.querySelectorAll(
          '[data-test="unread"], .is-unread, [class*="unread"]'
        );
        unread = unreadItems.length;
      }

      // Strategy 3: Text pattern
      if (unread === 0) {
        const allText = document.body.innerText || '';
        const unreadMatch = allText.match(/(\d+)\s*unread/i);
        if (unreadMatch) unread = parseInt(unreadMatch[1]);
      }

      return { unread };
    });

    console.log(`    Unread messages: ${messages.unread}`);
    return messages;
  } catch (err) {
    console.error(`    Error scraping messages: ${err.message}`);
    return { unread: 0 };
  }
}

async function scrapeEarnings(page) {
  console.log('  Navigating to earnings/reports...');
  try {
    await page.waitForTimeout(randomDelay());
    await page.goto('https://www.upwork.com/nx/reports/overview', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const earnings = await page.evaluate(() => {
      const data = { this_month: null, in_progress: null, available: null };

      // Strategy 1: data-test attributes for earnings sections
      const earningSelectors = {
        this_month: ['[data-test="earnings-this-month"]', '[data-test="billings-this-month"]'],
        in_progress: ['[data-test="in-progress"]', '[data-test="pending"]'],
        available: ['[data-test="available"]', '[data-test="available-balance"]'],
      };

      for (const [key, selectors] of Object.entries(earningSelectors)) {
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
            const text = el.textContent;
            const numMatch = text?.match(/\$?([\d,.]+)/);
            if (numMatch) {
              data[key] = parseFloat(numMatch[1].replace(/,/g, ''));
              break;
            }
          }
        }
      }

      // Strategy 2: Text pattern matching across the page
      const allText = document.body.innerText || '';

      if (data.this_month === null) {
        const monthMatch = allText.match(
          /(?:this month|monthly|billings?)\s*[:.]?\s*\$?([\d,.]+)/i
        );
        if (monthMatch) data.this_month = parseFloat(monthMatch[1].replace(/,/g, ''));
      }

      if (data.in_progress === null) {
        const progressMatch = allText.match(
          /(?:in progress|pending|processing)\s*[:.]?\s*\$?([\d,.]+)/i
        );
        if (progressMatch) data.in_progress = parseFloat(progressMatch[1].replace(/,/g, ''));
      }

      if (data.available === null) {
        const availMatch = allText.match(
          /(?:available|balance|withdraw)\s*[:.]?\s*\$?([\d,.]+)/i
        );
        if (availMatch) data.available = parseFloat(availMatch[1].replace(/,/g, ''));
      }

      // Strategy 3: Look for dollar amounts in card-like containers
      if (data.this_month === null && data.in_progress === null && data.available === null) {
        const cards = document.querySelectorAll(
          '.up-card-section, [class*="earnings"], [class*="balance"]'
        );
        const amounts = [];
        for (const card of cards) {
          const numMatch = card.textContent?.match(/\$?([\d,.]+)/);
          if (numMatch) amounts.push(parseFloat(numMatch[1].replace(/,/g, '')));
        }
        if (amounts.length >= 1) data.this_month = amounts[0];
        if (amounts.length >= 2) data.in_progress = amounts[1];
        if (amounts.length >= 3) data.available = amounts[2];
      }

      return data;
    });

    console.log(`    Earnings — month: $${earnings.this_month ?? '?'}, progress: $${earnings.in_progress ?? '?'}, available: $${earnings.available ?? '?'}`);
    return earnings;
  } catch (err) {
    console.error(`    Error scraping earnings: ${err.message}`);
    return { this_month: null, in_progress: null, available: null };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function main() {
  console.log('');
  console.log('Upwork Dashboard Scraper');
  console.log('='.repeat(45));
  console.log(`  Time: ${timestamp()}`);
  console.log(`  Auth: ${AUTH_FILE}`);
  console.log('');

  // Validate auth file exists
  if (!existsSync(AUTH_FILE)) {
    const msg = `Auth file not found: ${AUTH_FILE}\nRun "node scripts/upwork-login.mjs" first to create it.`;
    console.error(msg);
    return { success: false, error: msg, platform: 'upwork' };
  }

  let browser = null;

  try {
    // Launch browser
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

    // Auth check — navigate to best matches and see if we get redirected to login
    console.log('  Checking authentication...');
    await page.goto('https://www.upwork.com/nx/find-work/best-matches', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const currentUrl = page.url();
    if (
      currentUrl.includes('/login') ||
      currentUrl.includes('/account-security') ||
      currentUrl.includes('/signup')
    ) {
      const msg = 'Session expired — redirected to login page. Re-run upwork-login.mjs to refresh auth.';
      console.error(`  ${msg}`);
      await browser.close();
      return { success: false, error: msg, platform: 'upwork' };
    }

    console.log('  Auth OK. Starting scrape...');
    console.log('');

    // Scrape each section independently
    const jobMatches = await scrapeJobMatches(page);

    const proposals = await scrapeProposals(page);

    const contracts = await scrapeContracts(page);

    const messages = await scrapeMessages(page);

    const earnings = await scrapeEarnings(page);

    // Re-save storage state to keep session fresh
    console.log('');
    console.log('  Re-saving auth state...');
    await context.storageState({ path: AUTH_FILE });

    await browser.close();
    browser = null;

    // Build output
    const result = {
      fetched_at: timestamp(),
      platform: 'upwork',
      success: true,
      profile: {
        name: null,
        title: null,
        availability: null,
      },
      proposals,
      contracts,
      messages,
      earnings,
      job_matches: jobMatches,
    };

    // Write output files
    mkdirSync(OUTPUT_DIR, { recursive: true });
    mkdirSync(HISTORY_DIR, { recursive: true });

    writeFileSync(LATEST_FILE, JSON.stringify(result, null, 2));
    console.log(`  Wrote: ${LATEST_FILE}`);

    const historyFile = join(HISTORY_DIR, `${todayStr()}.json`);
    copyFileSync(LATEST_FILE, historyFile);
    console.log(`  Wrote: ${historyFile}`);

    console.log('');
    console.log('  Upwork scrape complete.');
    console.log('');

    return { success: true, data: result };
  } catch (err) {
    console.error(`  Fatal scraper error: ${err.message}`);
    if (browser) await browser.close().catch(() => {});
    return { success: false, error: err.message, platform: 'upwork' };
  }
}

// ---------------------------------------------------------------------------
// Direct execution
// ---------------------------------------------------------------------------

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('scrape-upwork.mjs') ||
    process.argv[1].includes('scrape-upwork'));

if (isDirectRun) {
  main()
    .then((result) => {
      if (!result.success) {
        console.error(`Scraper failed: ${result.error}`);
        process.exitCode = 1;
      }
    })
    .catch((err) => {
      console.error('Unhandled error:', err);
      process.exitCode = 1;
    });
}
