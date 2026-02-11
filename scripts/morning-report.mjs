#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env.monitor', import.meta.url).pathname });

import { readFile } from 'fs/promises';
import { main as scrapeFiverr } from './scrape-fiverr.mjs';
import { main as scrapeUpwork } from './scrape-upwork.mjs';
import { main as generateReport } from './generate-report.mjs';
import { main as sendTelegram } from './send-telegram.mjs';
import { main as updateTracker } from './update-tracker.mjs';

const startTime = Date.now();
const timestamp = () => new Date().toLocaleTimeString('en-US', { hour12: false });

const results = {
  fiverr: false,
  upwork: false,
  report: false,
  telegram: false,
  tracker: false,
};

console.log(`Morning report starting at ${timestamp()}`);

// Step 1: Scrape Fiverr
try {
  const fiverrResult = await scrapeFiverr();
  results.fiverr = fiverrResult.success;
  console.log(`Fiverr scrape: ${fiverrResult.success ? 'OK' : 'FAILED'}`);
  if (!fiverrResult.success && fiverrResult.error) {
    console.error(`  Fiverr error: ${fiverrResult.error}`);
  }
} catch (err) {
  console.error(`Fiverr scrape error: ${err.message}`);
}

// Step 2: Scrape Upwork
try {
  const upworkResult = await scrapeUpwork();
  results.upwork = upworkResult.success;
  console.log(`Upwork scrape: ${upworkResult.success ? 'OK' : 'FAILED'}`);
  if (!upworkResult.success && upworkResult.error) {
    console.error(`  Upwork error: ${upworkResult.error}`);
  }
} catch (err) {
  console.error(`Upwork scrape error: ${err.message}`);
}

// Step 3: If both scrapers failed, alert and exit
if (!results.fiverr && !results.upwork) {
  console.error('Both Fiverr and Upwork scrapers failed. Sending alert.');
  try {
    await sendTelegram('Morning report: Both Fiverr and Upwork scrapers failed. Check logs.');
  } catch (err) {
    console.error(`Failed to send alert: ${err.message}`);
  }
  process.exit(1);
}

// Step 4: Generate report
try {
  const reportResult = await generateReport();
  results.report = reportResult.success;
  console.log(`Report generation: ${reportResult.success ? 'OK' : 'FAILED'}`);
} catch (err) {
  console.error(`Report generation error: ${err.message}`);
}

// Step 5: Update tracker
try {
  const trackerResult = await updateTracker();
  results.tracker = trackerResult.success;
  console.log(`Tracker update: ${trackerResult.success ? 'OK' : 'FAILED'}`);
} catch (err) {
  console.error(`Tracker update error: ${err.message}`);
}

// Step 6: Read and send the report
const today = new Date().toISOString().split('T')[0];
const reportPath = new URL(`../data/reports/${today}.md`, import.meta.url).pathname;

try {
  const reportContent = await readFile(reportPath, 'utf-8');
  const telegramResult = await sendTelegram(reportContent);
  results.telegram = telegramResult.success;
  console.log(`Telegram delivery: ${telegramResult.success ? 'OK' : 'FAILED'}`);
} catch (err) {
  console.error(`Telegram delivery error: ${err.message}`);
}

// Step 7: Log completion
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`Morning report complete at ${timestamp()} (took ${elapsed}s)`);
console.log(
  `Fiverr: ${results.fiverr ? 'ok' : 'failed'}, ` +
  `Upwork: ${results.upwork ? 'ok' : 'failed'}, ` +
  `Report: ${results.report ? 'ok' : 'failed'}, ` +
  `Telegram: ${results.telegram ? 'ok' : 'failed'}`
);

process.exit(results.telegram ? 0 : 1);
