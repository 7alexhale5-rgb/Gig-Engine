#!/usr/bin/env node

/**
 * fiverr-login.mjs — One-time manual login to Fiverr
 *
 * Launches a headed browser so you can log in manually.
 * Saves the authenticated session (cookies + localStorage) to
 * ~/.gig-engine/fiverr-auth.json for headless scraping later.
 *
 * Usage:
 *   node scripts/fiverr-login.mjs
 */

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const AUTH_DIR = join(homedir(), '.gig-engine');
const AUTH_FILE = join(AUTH_DIR, 'fiverr-auth.json');
const LOGIN_URL = 'https://www.fiverr.com/login';
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

async function main() {
  // Ensure auth directory exists
  mkdirSync(AUTH_DIR, { recursive: true });

  console.log('');
  console.log('=== Fiverr Login Helper ===');
  console.log('');
  console.log('A browser window will open to the Fiverr login page.');
  console.log('Log in to Fiverr in the browser window.');
  console.log('The script will detect when you are logged in.');
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

  try {
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

    console.log('Waiting for you to complete login (up to 5 minutes)...');
    console.log('');

    // Wait until URL no longer contains /login
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: LOGIN_TIMEOUT_MS,
    });

    console.log('Login detected! Saving session...');

    // Save the full browser state (cookies + localStorage)
    await context.storageState({ path: AUTH_FILE });

    console.log('');
    console.log(`Session saved to: ${AUTH_FILE}`);
    console.log('You can now run the headless scraper:');
    console.log('  npm run scrape:fiverr');
    console.log('');
  } catch (err) {
    if (err.name === 'TimeoutError') {
      console.error('');
      console.error('Timed out waiting for login. Please try again.');
      console.error('');
    } else {
      console.error('Error during login:', err.message);
    }
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
