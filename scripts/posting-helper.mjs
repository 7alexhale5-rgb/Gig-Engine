#!/usr/bin/env node

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

// ── ANSI Colors ──────────────────────────────────────────────────────────────

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  white: '\x1b[37m',
};

// ── Priority & Ordering ──────────────────────────────────────────────────────

const P1_POSTING_ORDER = [
  'AI-07', 'AI-08', 'AI-01', 'AW-01', 'CRM-01', 'DA-01',
  'AW-02', 'AW-03', 'AI-02', 'CRM-02', 'WL-01', 'WL-02',
];

const PRIORITY_MAP = {
  P1: ['AW-01', 'AW-02', 'AW-03', 'AI-01', 'AI-02', 'AI-07', 'AI-08', 'CRM-01', 'CRM-02', 'DA-01', 'WL-01', 'WL-02'],
  P2: ['AW-04', 'AW-05', 'AI-03', 'AI-04', 'CRM-03', 'CRM-04', 'DA-02', 'DA-03', 'WL-03', 'WL-04'],
  P3: ['AW-06', 'AI-05', 'AI-06', 'CRM-05', 'CRM-06', 'DA-04', 'DA-05', 'WL-05', 'WL-06'],
};

function getPriority(id) {
  for (const [priority, ids] of Object.entries(PRIORITY_MAP)) {
    if (ids.includes(id)) return priority;
  }
  return 'P?';
}

// ── Help ─────────────────────────────────────────────────────────────────────

const HELP = `
${C.bold}${C.cyan}Gig Posting Helper${C.reset}
Copy-paste formatted listing content for Fiverr / Upwork gig creation.

${C.bold}Usage:${C.reset}
  node scripts/posting-helper.mjs                       Show all P1 gigs in posting order
  node scripts/posting-helper.mjs AI-01                  Show a specific gig
  node scripts/posting-helper.mjs AI-01 AI-07            Show multiple gigs
  node scripts/posting-helper.mjs --platform upwork      Show Upwork listings (default: fiverr)
  node scripts/posting-helper.mjs --all                  Show all gigs
  node scripts/posting-helper.mjs --help                 Show this help

${C.bold}P1 Posting Order:${C.reset}
  ${P1_POSTING_ORDER.join(', ')}
`;

// ── Argument Parsing ─────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { platform: 'fiverr', ids: [], all: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      console.log(HELP);
      process.exit(0);
    } else if (arg === '--platform') {
      i++;
      result.platform = (args[i] || 'fiverr').toLowerCase();
    } else if (arg === '--all') {
      result.all = true;
    } else {
      result.ids.push(arg.toUpperCase());
    }
  }

  return result;
}

// ── File Discovery ───────────────────────────────────────────────────────────

function discoverListings(platform) {
  const dir = join(PROJECT_ROOT, 'listings', platform);
  if (!existsSync(dir)) {
    console.error(`${C.bold}Error:${C.reset} Listings directory not found: ${dir}`);
    process.exit(1);
  }

  const files = readdirSync(dir).filter(f => f.endsWith('.md'));
  const listings = [];

  for (const file of files) {
    const match = file.match(/^([A-Z]+-\d+)-(.+)\.md$/);
    if (match) {
      listings.push({ id: match[1], slug: match[2], file: join(dir, file) });
    }
  }

  return listings;
}

// ── Markdown Parsing ─────────────────────────────────────────────────────────

function extractSection(md, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^## ${escaped}\\s*\\n([\\s\\S]*?)(?=^## |$)`, 'm');
  const m = md.match(re);
  return m ? m[1].trim() : null;
}

function extractSubSection(md, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^### ${escaped}\\s*\\n([\\s\\S]*?)(?=^###? |$)`, 'm');
  const m = md.match(re);
  return m ? m[1].trim() : null;
}

function extractTitle(md) {
  const m = md.match(/^# (.+)$/m);
  return m ? m[1].replace(/ — (?:Fiverr|Upwork) Listing$/, '') : 'Unknown';
}

function parseTable(text) {
  if (!text) return [];
  const lines = text.split('\n').filter(l => l.trim().startsWith('|'));
  if (lines.length < 3) return [];

  const parseRow = (line) => line.split('|').slice(1, -1).map(c => c.trim());
  const headers = parseRow(lines[0]);
  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = parseRow(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] || ''; });
    rows.push(row);
  }
  return rows;
}

// ── Fiverr Parser ────────────────────────────────────────────────────────────

function parseFiverr(md) {
  const result = {};

  result.title = extractSection(md, 'Gig Title') || '';

  const catSection = extractSection(md, 'Category') || '';
  const catMatch = catSection.match(/\*\*Category:\*\*\s*(.+)/);
  const subMatch = catSection.match(/\*\*Subcategory:\*\*\s*(.+)/);
  result.category = catMatch ? catMatch[1].trim() : '';
  result.subcategory = subMatch ? subMatch[1].trim() : '';

  const tagsSection = extractSection(md, 'Search Tags') || '';
  result.tags = tagsSection.split('\n').map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);

  const pricingSection = extractSection(md, 'Pricing Table') || '';
  result.pricing = parseTable(pricingSection);

  const descSection = extractSection(md, 'Gig Description') || '';

  // Extract FAQ from within description
  const faqRaw = extractSubSection(descSection, 'FAQ');
  result.faq = [];
  if (faqRaw) {
    const pairs = faqRaw.split(/^\d+\.\s+/m).filter(Boolean);
    for (const pair of pairs) {
      const qm = pair.match(/\*\*Q:\s*(.+?)\*\*/);
      const am = pair.match(/\n\s+A:\s*([\s\S]+)/);
      if (qm && am) {
        result.faq.push({ q: qm[1].trim(), a: am[1].trim() });
      }
    }
  }

  // Strip subsection headers for clean description
  result.description = descSection.replace(/^### .+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();

  // Image path
  const imgSection = extractSection(md, 'Gig Images') || '';
  const imgRows = parseTable(imgSection);
  result.image = null;
  for (const row of imgRows) {
    const file = (row['File'] || '').replace(/`/g, '').trim();
    if (file && !file.startsWith('_')) {
      result.image = file;
      break;
    }
  }

  result.requirements = extractSection(md, 'Requirements') || '';

  return result;
}

// ── Upwork Parser ────────────────────────────────────────────────────────────

function parseUpwork(md) {
  return {
    headline: extractSubSection(md, 'Headline') || '',
    overview: extractSubSection(md, 'Overview') || '',
    skills: extractSubSection(md, 'Skills') || '',
    hourlyRate: extractSubSection(md, 'Hourly Rate') || '',
    serviceDescription: extractSection(md, 'Service Description') || '',
    sampleProposal: extractSection(md, 'Sample Proposal') || '',
    pricingTable: parseTable(extractSection(md, 'Pricing Guide') || ''),
  };
}

// ── Formatters ───────────────────────────────────────────────────────────────

const LINE = '\u2500'.repeat(54);

function formatHeader(id, name, platform, priority) {
  const top = '\u2554' + '\u2550'.repeat(58) + '\u2557';
  const bot = '\u255A' + '\u2550'.repeat(58) + '\u255D';
  const pad = (s, len) => s + ' '.repeat(Math.max(0, len - s.length));

  const line1 = `  ${id}: ${name}`;
  const line2 = `  Platform: ${platform.charAt(0).toUpperCase() + platform.slice(1)} | Priority: ${priority}`;

  return [
    '',
    `${C.bold}${C.cyan}${top}${C.reset}`,
    `${C.bold}${C.cyan}\u2551${C.reset}${C.bold}${C.white}${pad(line1, 58)}${C.reset}${C.bold}${C.cyan}\u2551${C.reset}`,
    `${C.bold}${C.cyan}\u2551${C.reset}${C.dim}${pad(line2, 58)}${C.reset}${C.bold}${C.cyan}\u2551${C.reset}`,
    `${C.bold}${C.cyan}${bot}${C.reset}`,
    '',
  ].join('\n');
}

function sectionHeader(label, hint) {
  const hintStr = hint ? ` ${C.dim}(${hint})${C.reset}` : '';
  return `${C.bold}${C.yellow}${label}${C.reset}${hintStr}\n${C.dim}${LINE}${C.reset}`;
}

function formatFiverr(id, data, name, priority) {
  const parts = [];
  parts.push(formatHeader(id, name, 'fiverr', priority));

  parts.push(sectionHeader('GIG TITLE', 'copy to Fiverr title field'));
  parts.push(data.title);
  parts.push('');

  parts.push(sectionHeader('CATEGORY', ''));
  parts.push(`Category: ${data.category}`);
  parts.push(`Subcategory: ${data.subcategory}`);
  parts.push('');

  parts.push(sectionHeader('SEARCH TAGS', 'copy each tag'));
  data.tags.forEach((tag, i) => parts.push(`${i + 1}. ${tag}`));
  parts.push('');

  parts.push(sectionHeader('PRICING', 'copy to each tier'));
  for (const row of data.pricing) {
    const tier = (row['Tier'] || '').toUpperCase();
    parts.push(`${tier}: ${row['Price']} | ${row['Name']} | ${row['Delivery']} | ${row['Revisions']} rev`);
  }
  parts.push('');

  parts.push(sectionHeader('DESCRIPTION', 'copy to description box'));
  parts.push(data.description);
  parts.push('');

  if (data.image) {
    parts.push(sectionHeader('IMAGE', ''));
    parts.push(`Thumbnail: ${data.image}`);
    parts.push('');
  }

  if (data.requirements) {
    parts.push(sectionHeader('REQUIREMENTS', 'copy to buyer requirements'));
    parts.push(data.requirements);
    parts.push('');
  }

  if (data.faq.length > 0) {
    parts.push(sectionHeader('FAQ', 'add each Q&A pair'));
    for (const { q, a } of data.faq) {
      parts.push(`Q: ${q}`);
      parts.push(`A: ${a}`);
      parts.push('');
    }
  }

  return parts.join('\n');
}

function formatUpwork(id, data, name, priority) {
  const parts = [];
  parts.push(formatHeader(id, name, 'upwork', priority));

  parts.push(sectionHeader('HEADLINE', 'copy to profile headline'));
  parts.push(data.headline);
  parts.push('');

  parts.push(sectionHeader('OVERVIEW', 'copy to profile overview'));
  parts.push(data.overview);
  parts.push('');

  parts.push(sectionHeader('SKILLS', 'comma separated'));
  parts.push(data.skills);
  parts.push('');

  parts.push(sectionHeader('HOURLY RATE', ''));
  parts.push(data.hourlyRate);
  parts.push('');

  parts.push(sectionHeader('SERVICE DESCRIPTION', ''));
  parts.push(data.serviceDescription);
  parts.push('');

  parts.push(sectionHeader('SAMPLE PROPOSAL', 'customize [BRACKETED] text per job'));
  parts.push(data.sampleProposal);
  parts.push('');

  if (data.pricingTable.length > 0) {
    parts.push(sectionHeader('PRICING GUIDE', 'reference for quoting'));
    for (const row of data.pricingTable) {
      parts.push(`${(row['Scope'] || '').toUpperCase()}: ${row['Price Range']} | ${row['Timeline']} | ${row['Includes']}`);
    }
    parts.push('');
  }

  return parts.join('\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const opts = parseArgs(process.argv);
  const listings = discoverListings(opts.platform);

  if (listings.length === 0) {
    console.error(`No listings found for platform: ${opts.platform}`);
    process.exit(1);
  }

  let selectedIds;

  if (opts.ids.length > 0) {
    selectedIds = opts.ids;
  } else if (opts.all) {
    selectedIds = listings.map(l => l.id);
  } else {
    const availableIds = new Set(listings.map(l => l.id));
    selectedIds = P1_POSTING_ORDER.filter(id => availableIds.has(id));
  }

  const listingMap = new Map(listings.map(l => [l.id, l]));
  let found = 0;

  for (const id of selectedIds) {
    const listing = listingMap.get(id);
    if (!listing) {
      console.error(`${C.yellow}Warning:${C.reset} Listing ${id} not found, skipping.`);
      continue;
    }

    const md = readFileSync(listing.file, 'utf-8');
    const name = extractTitle(md);
    const priority = getPriority(id);

    if (opts.platform === 'upwork') {
      console.log(formatUpwork(id, parseUpwork(md), name, priority));
    } else {
      console.log(formatFiverr(id, parseFiverr(md), name, priority));
    }
    found++;
  }

  if (found === 0) {
    console.error('No matching listings found.');
    process.exit(1);
  }

  console.log(`${C.dim}${'─'.repeat(58)}${C.reset}`);
  console.log(`${C.green}${C.bold}Done.${C.reset} ${found} listing${found === 1 ? '' : 's'} formatted for ${opts.platform}.`);
}

main();
