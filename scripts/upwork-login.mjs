#!/usr/bin/env node

/**
 * Upwork Login — One-time setup
 *
 * Launches a headed browser so Alex can log into Upwork manually.
 * Saves session storage state to ~/.gig-engine/upwork-auth.json
 * for use by the headless scraper.
 *
 * Usage: node scripts/upwork-login.mjs
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const AUTH_DIR = join(homedir(), '.gig-engine');
const AUTH_FILE = join(AUTH_DIR, 'upwork-auth.json');
const LOGIN_URL = 'https://www.upwork.com/ab/account-security/login';

// URL patterns that indicate a successful login
const LOGGED_IN_PATTERNS = ['/nx/', '/ab/find-work', '/home'];

async function main() {
  mkdirSync(AUTH_DIR, { recursive: true });

  console.log('');
  console.log('Upwork Login — Session Setup');
  console.log('='.repeat(45));
  console.log('');
  console.log('A browser window will open to the Upwork login page.');
  console.log('Log in to Upwork in the browser window.');
  console.log('The script will detect when you are logged in.');
  console.log('');
  console.log(`Auth will be saved to: ${AUTH_FILE}`);
  console.log('');

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    timezoneId: 'America/Chicago',
  });

  const page = await context.newPage();
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

  console.log('Waiting for successful login (5 minute timeout)...');

  try {
    await page.waitForFunction(
      (patterns) => patterns.some((p) => window.location.href.includes(p)),
      LOGGED_IN_PATTERNS,
      { timeout: 300_000 }
    );

    // Give the page a moment to fully settle after redirect
    await page.waitForTimeout(3000);

    await context.storageState({ path: AUTH_FILE });

    console.log('');
    console.log('Login detected. Session saved.');
    console.log(`Auth file: ${AUTH_FILE}`);
    console.log('');
    console.log('You can now run: node scripts/scrape-upwork.mjs');
    console.log('');
  } catch (err) {
    if (err.message.includes('Timeout')) {
      console.error('');
      console.error('Timed out waiting for login (5 minutes).');
      console.error('Please re-run this script and try again.');
    } else {
      console.error('Error during login wait:', err.message);
    }
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
