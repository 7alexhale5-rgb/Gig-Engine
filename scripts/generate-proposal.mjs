#!/usr/bin/env node

/**
 * generate-proposal.mjs — Upwork proposal generator
 *
 * Takes a job description and matches it against Upwork listings
 * by keyword overlap, then outputs a customized proposal from the best
 * matching listing's Sample Proposal template.
 *
 * No API calls or external dependencies — pure keyword matching + templates.
 *
 * Usage:
 *   node scripts/generate-proposal.mjs --job "Need someone to build AI chatbot"
 *   node scripts/generate-proposal.mjs --file job-posting.txt
 *   node scripts/generate-proposal.mjs --interactive
 *   pbpaste | node scripts/generate-proposal.mjs
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const LISTINGS_DIR = join(PROJECT_ROOT, 'listings', 'upwork');

// ── ANSI Colors ──────────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// ── Help ─────────────────────────────────────────────────────────────────────

const HELP = `
${c.bold}generate-proposal.mjs${c.reset} -- Upwork proposal generator

${c.bold}USAGE${c.reset}
  node scripts/generate-proposal.mjs --job "Job description text"
  node scripts/generate-proposal.mjs --file path/to/job-posting.txt
  node scripts/generate-proposal.mjs --interactive
  pbpaste | node scripts/generate-proposal.mjs

${c.bold}OPTIONS${c.reset}
  --job <text>      Job description as a string argument
  --file <path>     Read job description from a file
  --interactive     Prompt for job description interactively
  --help, -h        Show this help message

${c.bold}HOW IT WORKS${c.reset}
  1. Tokenizes the job description into keywords
  2. Scores each Upwork listing by keyword overlap
  3. Picks the best match and reads its Sample Proposal template
  4. Replaces [BRACKETED] placeholders with extracted job details
  5. Outputs a ready-to-paste proposal with pricing guidance
`;

// ── Stop Words ───────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'some', 'them',
  'than', 'its', 'over', 'such', 'that', 'this', 'with', 'will', 'each',
  'from', 'they', 'into', 'more', 'other', 'their', 'about', 'would',
  'make', 'like', 'just', 'also', 'should', 'could', 'which', 'these',
  'after', 'what', 'need', 'want', 'looking', 'someone', 'help',
  'work', 'able', 'well', 'very', 'when', 'your', 'who', 'how', 'get',
  'know', 'use', 'using', 'used', 'any', 'does', 'done', 'being',
  'most', 'only', 'must', 'where', 'there', 'here', 'then', 'those',
  'were', 'did', 'doing', 'please', 'thanks', 'thank',
]);

// ── Listing Parser ───────────────────────────────────────────────────────────

function parseListing(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const fileName = basename(filePath, '.md');

  const idMatch = fileName.match(/^([A-Z]+-\d+)-(.+)$/);
  const id = idMatch ? idMatch[1] : fileName;
  const slug = idMatch ? idMatch[2] : fileName;

  const titleMatch = content.match(/^#\s+(.+)/m);
  const title = titleMatch
    ? titleMatch[1].replace(/\s*[—-]+\s*Upwork Listing\s*$/, '').trim()
    : slug;

  // Extract Skills
  const skillsMatch = content.match(/###\s*Skills\s*\n+([\s\S]*?)(?=\n###|\n##|\n---|\n\n\n)/);
  const skills = (skillsMatch ? skillsMatch[1].trim() : '')
    .split(/[,\n]/)
    .map(s => s.replace(/^[-*\d.]+\s*/, '').trim().toLowerCase())
    .filter(Boolean);

  // Extract Saved Search Keywords
  const keywordsMatch = content.match(/##\s*Saved Search Keywords\s*\n+([\s\S]*?)(?=\n##|$)/);
  const searchKeywords = (keywordsMatch ? keywordsMatch[1].trim() : '')
    .split('\n')
    .map(line => line.replace(/^[-*\d.]+\s*"?/, '').replace(/"?\s*$/, '').trim().toLowerCase())
    .filter(Boolean);

  // Extract headline
  const headlineMatch = content.match(/###\s*Headline\s*\n+([\s\S]*?)(?=\n###|\n##|\n---)/);
  const headline = headlineMatch ? headlineMatch[1].trim() : '';

  // Extract Sample Proposal sections
  const proposalSections = {};
  const proposalMatch = content.match(/##\s*Sample Proposal\s*\n+([\s\S]*?)(?=\n##\s+[^#]|$)/);
  if (proposalMatch) {
    const subSections = proposalMatch[1].split(/###\s+/);
    for (const section of subSections) {
      if (!section.trim()) continue;
      const lines = section.split('\n');
      const name = lines[0].trim().toLowerCase();
      const body = lines.slice(1).join('\n').trim();
      if (['hook', 'credibility', 'approach', 'differentiator', 'cta'].includes(name)) {
        proposalSections[name] = body;
      }
    }
  }

  // Extract Pricing Guide table
  const pricingMatch = content.match(/##\s*Pricing Guide\s*\n+([\s\S]*?)(?=\n##|$)/);
  const pricingRows = [];
  if (pricingMatch) {
    const tableLines = pricingMatch[1].split('\n').filter(l => l.includes('|') && !l.match(/^\s*\|?\s*[-:]+/));
    for (const line of tableLines) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 4 && cells[0].toLowerCase() !== 'scope') {
        pricingRows.push({ scope: cells[0], price: cells[1], timeline: cells[2], includes: cells[3] });
      }
    }
  }

  // Hourly rate
  const hourlyMatch = content.match(/###?\s*Hourly Rate\s*\n+(.+)/);
  const hourlyRate = hourlyMatch ? hourlyMatch[1].trim() : '';

  // Build combined keyword tokens
  const allKeywordTokens = new Set();
  for (const skill of skills) {
    for (const token of skill.split(/\s+/)) {
      if (token.length > 2) allKeywordTokens.add(token);
    }
  }
  for (const kw of searchKeywords) {
    for (const token of kw.split(/\s+/)) {
      if (token.length > 2) allKeywordTokens.add(token);
    }
  }
  for (const token of headline.toLowerCase().split(/[\s,|&]+/)) {
    if (token.length > 2) allKeywordTokens.add(token);
  }

  return { id, slug, title, headline, skills, searchKeywords, keywordTokens: allKeywordTokens, proposalSections, pricingRows, hourlyRate, filePath };
}

// ── Job Description Analysis ─────────────────────────────────────────────────

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function extractIndustry(jobText) {
  const industries = [
    'healthcare', 'medical', 'fintech', 'finance', 'banking', 'real estate',
    'construction', 'ecommerce', 'e-commerce', 'retail', 'saas', 'education',
    'legal', 'insurance', 'travel', 'hospitality', 'restaurant', 'fitness',
    'beauty', 'automotive', 'logistics', 'manufacturing', 'recruiting',
    'marketing', 'agency', 'consulting', 'nonprofit', 'crypto', 'blockchain',
    'gaming', 'media', 'energy', 'solar', 'agriculture',
  ];
  const lower = jobText.toLowerCase();
  const found = industries.filter(ind => lower.includes(ind));
  return found.length > 0 ? found[0] : '';
}

function extractSpecificNeed(jobText) {
  const sentences = jobText.split(/[.!?\n]/).filter(s => s.trim().length > 10);
  if (sentences.length > 0) {
    const first = sentences[0].trim();
    return first.length > 120 ? first.slice(0, 117) + '...' : first;
  }
  return jobText.slice(0, 120).trim();
}

function extractTimeline(jobText) {
  const patterns = [
    /(\d+\s*[-–]\s*\d+\s*(?:weeks?|months?|days?))/i,
    /(within\s+\d+\s+(?:weeks?|months?|days?))/i,
    /(asap|as soon as possible|urgent|immediately)/i,
    /(\d+\s+(?:week|month|day)s?\s+(?:timeline|deadline))/i,
  ];
  for (const pattern of patterns) {
    const match = jobText.match(pattern);
    if (match) return match[1].trim();
  }
  return '';
}

// ── Scoring & Matching ───────────────────────────────────────────────────────

function scoreListing(listing, jobTokens) {
  const jobSet = new Set(jobTokens);
  const matched = [];
  for (const token of listing.keywordTokens) {
    if (jobSet.has(token)) matched.push(token);
  }
  return { score: matched.length, matched, total: listing.keywordTokens.size };
}

function replaceBrackets(text, context) {
  return text.replace(/\[([^\]]+)\]/g, (_match, inner) => {
    const key = inner.toUpperCase();
    if (key.includes('INDUSTRY') || key.includes('PRODUCT')) {
      return context.industry || '[YOUR INDUSTRY - customize this]';
    }
    if (key.includes('SPECIFIC NEED') || key.includes('THEIR SPECIFIC NEED')) {
      return context.specificNeed || '[SPECIFIC NEED - customize this]';
    }
    if (key.includes('TIMELINE')) {
      return context.timeline || inner;
    }
    return '[' + inner + ' - customize this]';
  });
}

// ── Output ───────────────────────────────────────────────────────────────────

function formatOutput({ bestListing, bestResult, runnerUp, context }) {
  const { id, title, proposalSections, pricingRows, hourlyRate } = bestListing;

  const boxWidth = 60;
  const top = '\u2554' + '\u2550'.repeat(boxWidth) + '\u2557';
  const bot = '\u255a' + '\u2550'.repeat(boxWidth) + '\u255d';
  const pad = (s) => '\u2551  ' + s.padEnd(boxWidth - 2) + '\u2551';

  const runnerUpText = runnerUp
    ? `${runnerUp.listing.id} (${runnerUp.result.score}/${runnerUp.result.total})`
    : 'none';

  console.log('');
  console.log(c.cyan + top + c.reset);
  console.log(c.cyan + pad('PROPOSAL GENERATOR') + c.reset);
  console.log(c.cyan + pad(`Best Match: ${id} -- ${title}`) + c.reset);
  console.log(c.cyan + pad(`Score: ${bestResult.score}/${bestResult.total} keywords | Runner-up: ${runnerUpText}`) + c.reset);
  console.log(c.cyan + bot + c.reset);

  console.log('');
  console.log(c.dim + 'Matched: ' + bestResult.matched.join(', ') + c.reset);

  const divider = '\u2500'.repeat(42);
  console.log('');
  console.log(c.bold + 'PROPOSAL (copy to Upwork)' + c.reset);
  console.log(c.dim + divider + c.reset);
  console.log('');

  for (const section of ['hook', 'credibility', 'approach', 'differentiator', 'cta']) {
    const text = proposalSections[section];
    if (text) {
      console.log(replaceBrackets(text, context));
      console.log('');
    }
  }

  console.log(c.dim + divider + c.reset);

  if (pricingRows.length > 0) {
    console.log('');
    console.log(c.bold + 'SUGGESTED PRICING' + c.reset);
    console.log(c.dim + divider + c.reset);
    const small = pricingRows.find(r => r.scope.toLowerCase() === 'small');
    const medium = pricingRows.find(r => r.scope.toLowerCase() === 'medium');
    if (small) console.log(`Recommend: ${c.green}${small.price}${c.reset} (Small, ${small.timeline})`);
    if (medium) console.log(`Upgrade: ${c.yellow}${medium.price}${c.reset} (Medium, ${medium.timeline})`);
    if (hourlyRate) console.log(`Hourly: ${c.cyan}${hourlyRate}${c.reset}`);
    console.log('');
    console.log(c.dim + 'All tiers:' + c.reset);
    for (const row of pricingRows) {
      console.log(`  ${c.dim}${row.scope}:${c.reset} ${row.price} | ${row.timeline} | ${row.includes}`);
    }
  }

  if (runnerUp) {
    console.log('');
    console.log(c.bold + 'RELATED SERVICES' + c.reset);
    console.log(c.dim + divider + c.reset);
    console.log(`- ${runnerUp.listing.id}: ${runnerUp.listing.title}`);
  }

  console.log('');
}

// ── Input Handling ───────────────────────────────────────────────────────────

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) { resolve(''); return; }
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => resolve(data.trim()));
    process.stdin.on('error', () => resolve(''));
  });
}

function promptInteractive() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    console.log(c.cyan + 'Paste job description (press Enter twice to finish):' + c.reset);
    let lines = [];
    let emptyCount = 0;
    rl.on('line', (line) => {
      if (line.trim() === '') {
        emptyCount++;
        if (emptyCount >= 2) { rl.close(); resolve(lines.join('\n').trim()); return; }
      } else {
        emptyCount = 0;
      }
      lines.push(line);
    });
    rl.on('close', () => resolve(lines.join('\n').trim()));
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function main(jobDescription) {
  if (!jobDescription || !jobDescription.trim()) {
    console.error(c.bold + 'Error:' + c.reset + ' No job description provided.');
    console.error('Run with --help for usage.');
    process.exit(1);
  }

  const listingFiles = readdirSync(LISTINGS_DIR).filter(f => f.endsWith('.md'));
  const listings = listingFiles.map(f => parseListing(join(LISTINGS_DIR, f)));
  const jobTokens = tokenize(jobDescription);

  if (jobTokens.length === 0) {
    console.error('Could not extract keywords from job description.');
    process.exit(1);
  }

  const scored = listings
    .map(listing => ({ listing, result: scoreListing(listing, jobTokens) }))
    .sort((a, b) => b.result.score - a.result.score);

  const best = scored[0];
  const runnerUp = scored.length > 1 && scored[1].result.score > 0 ? scored[1] : null;

  const context = {
    industry: extractIndustry(jobDescription),
    specificNeed: extractSpecificNeed(jobDescription),
    timeline: extractTimeline(jobDescription),
  };

  formatOutput({ bestListing: best.listing, bestResult: best.result, runnerUp, context });

  return {
    bestMatch: { id: best.listing.id, title: best.listing.title, score: best.result.score },
    pricing: best.listing.pricingRows,
  };
}

// ── CLI Entry ────────────────────────────────────────────────────────────────

async function cli() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP);
    process.exit(0);
  }

  let jobDescription = '';

  const jobIdx = args.indexOf('--job');
  if (jobIdx !== -1 && args[jobIdx + 1]) {
    jobDescription = args[jobIdx + 1];
  }

  const fileIdx = args.indexOf('--file');
  if (!jobDescription && fileIdx !== -1 && args[fileIdx + 1]) {
    try {
      jobDescription = readFileSync(args[fileIdx + 1], 'utf-8').trim();
    } catch (err) {
      console.error('Could not read file:', err.message);
      process.exit(1);
    }
  }

  if (!jobDescription && args.includes('--interactive')) {
    jobDescription = await promptInteractive();
  }

  if (!jobDescription) {
    jobDescription = await readStdin();
  }

  if (!jobDescription) {
    console.error(c.bold + 'Error:' + c.reset + ' No job description provided.');
    console.error('Run with ' + c.cyan + '--help' + c.reset + ' for usage.');
    process.exit(1);
  }

  main(jobDescription);
}

cli();
