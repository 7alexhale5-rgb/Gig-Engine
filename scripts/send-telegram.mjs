#!/usr/bin/env node

/**
 * send-telegram.mjs — Send a message via Telegram Bot API
 *
 * Sends a text message to the configured Telegram chat.
 * Handles message chunking (>4096 chars) and Markdown parse errors.
 *
 * Usage:
 *   node scripts/send-telegram.mjs                  # sends today's report
 *   node scripts/send-telegram.mjs --file path.md   # sends specific file
 *   import { main } from './send-telegram.mjs'      # orchestrator import
 */

import { readFileSync, existsSync, realpathSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

config({ path: join(PROJECT_ROOT, '.env.monitor') });

const MAX_MESSAGE_LENGTH = 4096;
const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 2;

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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Split a message into chunks at newline boundaries,
 * each chunk no longer than MAX_MESSAGE_LENGTH.
 */
function splitMessage(text) {
  if (text.length <= MAX_MESSAGE_LENGTH) return [text];

  const chunks = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= MAX_MESSAGE_LENGTH) {
      chunks.push(remaining);
      break;
    }

    // Find the last newline within the limit
    let splitAt = remaining.lastIndexOf('\n', MAX_MESSAGE_LENGTH);
    if (splitAt <= 0) {
      // No newline found — split at the limit
      splitAt = MAX_MESSAGE_LENGTH;
    }

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).replace(/^\n/, '');
  }

  return chunks;
}

/**
 * Send a single message chunk to Telegram.
 * Retries up to MAX_RETRIES on failure.
 * Falls back to plain text if Markdown parse fails.
 */
async function sendChunk(token, chatId, text, parseMode) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      console.log(`  Retry ${attempt}/${MAX_RETRIES} after ${RETRY_DELAY_MS}ms...`);
      await sleep(RETRY_DELAY_MS);
    }

    try {
      const body = {
        chat_id: chatId,
        text,
      };
      if (parseMode) body.parse_mode = parseMode;

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.ok) return { success: true };

      // Handle Markdown parse error — retry without parse_mode
      if (
        parseMode &&
        data.description &&
        data.description.toLowerCase().includes('parse')
      ) {
        console.warn('  Telegram Markdown parse error, retrying as plain text...');
        return sendChunk(token, chatId, text, undefined);
      }

      lastError = data.description || `HTTP ${res.status}`;
    } catch (err) {
      lastError = err.message;
    }
  }

  return { success: false, error: lastError };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function main(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN not set in .env.monitor');
    return { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  if (!chatId) {
    console.error('TELEGRAM_CHAT_ID not set in .env.monitor');
    return { success: false, error: 'TELEGRAM_CHAT_ID not configured' };
  }

  if (!message || message.trim().length === 0) {
    console.error('No message content to send');
    return { success: false, error: 'Empty message' };
  }

  console.log(`Sending message to Telegram (${message.length} chars)...`);

  const chunks = splitMessage(message);
  if (chunks.length > 1) {
    console.log(`  Message split into ${chunks.length} chunks`);
  }

  for (let i = 0; i < chunks.length; i++) {
    if (chunks.length > 1) {
      console.log(`  Sending chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);
    }

    const result = await sendChunk(token, chatId, chunks[i], 'Markdown');
    if (!result.success) {
      console.error(`  Failed to send chunk ${i + 1}: ${result.error}`);
      return { success: false, error: result.error };
    }

    // Brief delay between chunks to avoid rate limiting
    if (i < chunks.length - 1) {
      await sleep(1000);
    }
  }

  console.log('Telegram message sent successfully.');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Direct execution
// ---------------------------------------------------------------------------

const self = realpathSync(fileURLToPath(import.meta.url));
const arg = process.argv[1] ? realpathSync(process.argv[1]) : '';

if (self === arg) {
  // Parse --file flag or default to today's report
  let message;

  const fileIdx = process.argv.indexOf('--file');
  if (fileIdx !== -1 && process.argv[fileIdx + 1]) {
    const filePath = process.argv[fileIdx + 1];
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    message = readFileSync(filePath, 'utf-8');
    console.log(`Read message from ${filePath}`);
  } else {
    // Default: today's report
    const reportPath = join(PROJECT_ROOT, 'data', 'reports', `${todayDate()}.md`);
    if (!existsSync(reportPath)) {
      console.error(`Today's report not found: ${reportPath}`);
      console.error('Run generate-report.mjs first, or use --file to specify a file.');
      process.exit(1);
    }
    message = readFileSync(reportPath, 'utf-8');
    console.log(`Read today's report from ${reportPath}`);
  }

  main(message).then((result) => {
    if (!result.success) {
      console.error('Send failed:', result.error);
      process.exitCode = 1;
    }
  });
}
