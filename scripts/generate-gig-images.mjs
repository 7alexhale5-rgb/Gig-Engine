import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const outputDir = join(projectRoot, 'images', 'fiverr');

const fontRegular = readFileSync('/System/Library/Fonts/Supplemental/Arial.ttf');
const fontBold = readFileSync('/System/Library/Fonts/Supplemental/Arial Bold.ttf');

const WIDTH = 1280;
const HEIGHT = 769;

const PILLAR_COLORS = {
  'Automation & Workflows': { primary: '#3B82F6', dark: '#1E3A5F', bg: '#0B1929' },
  'AI & Chatbots':          { primary: '#8B5CF6', dark: '#3B1F6E', bg: '#110B24' },
  'CRM & GoHighLevel':      { primary: '#10B981', dark: '#0A4F3A', bg: '#081F17' },
  'Dashboards & Analytics':  { primary: '#F59E0B', dark: '#6B4106', bg: '#1A1200' },
  'Web & Landing Pages':     { primary: '#EF4444', dark: '#6B1616', bg: '#1A0808' },
};

const gigs = [
  {
    id: 'AW-01', pillar: 'Automation & Workflows',
    headline: 'Workflow Automation', sub: 'n8n & Make',
    features: ['Connect any business apps', 'Self-hosted, no per-task fees', 'Error handling & monitoring'],
    tiers: { basic: '$47', standard: '$297', premium: '$797' },
  },
  {
    id: 'AW-02', pillar: 'Automation & Workflows',
    headline: 'Automation Audit', sub: 'Process & ROI Analysis',
    features: ['Full tech stack review', 'ROI-prioritized roadmap', 'Implementation timeline'],
    tiers: { basic: '$127', standard: '$497', premium: '$997' },
  },
  {
    id: 'AW-03', pillar: 'Automation & Workflows',
    headline: 'API Integration', sub: 'REST / GraphQL / Webhooks',
    features: ['Connect 2+ business systems', 'Bi-directional data sync', 'Production-grade reliability'],
    tiers: { basic: '$77', standard: '$397', premium: '$797' },
  },
  {
    id: 'AI-01', pillar: 'AI & Chatbots',
    headline: 'AI Chatbot', sub: 'GPT / Claude / RAG',
    features: ['Trained on your business data', 'CRM & helpdesk integration', 'Human handoff built in'],
    tiers: { basic: '$127', standard: '$497', premium: '$1,297' },
  },
  {
    id: 'AI-02', pillar: 'AI & Chatbots',
    headline: 'AI Lead Scoring', sub: 'Qualify / Route / Convert',
    features: ['Score leads automatically', 'CRM routing & alerts', 'Sales pipeline intelligence'],
    tiers: { basic: '$197', standard: '$697', premium: '$1,497' },
  },
  {
    id: 'CRM-01', pillar: 'CRM & GoHighLevel',
    headline: 'GoHighLevel Setup', sub: 'Pipelines / Automations / SMS',
    features: ['Complete GHL configuration', 'Automated follow-ups', 'Review generation system'],
    tiers: { basic: '$127', standard: '$497', premium: '$997' },
  },
  {
    id: 'CRM-02', pillar: 'CRM & GoHighLevel',
    headline: 'CRM Migration', sub: 'HubSpot / Salesforce / Pipedrive',
    features: ['Zero data loss guarantee', 'Field mapping & cleanup', 'Team training included'],
    tiers: { basic: '$197', standard: '$797', premium: '$1,497' },
  },
  {
    id: 'DA-01', pillar: 'Dashboards & Analytics',
    headline: 'Custom Dashboard', sub: 'Real-Time KPI Tracking',
    features: ['Live data connections', 'Interactive charts & filters', 'Mobile responsive design'],
    tiers: { basic: '$197', standard: '$697', premium: '$1,297' },
  },
  {
    id: 'WL-01', pillar: 'Web & Landing Pages',
    headline: 'Landing Page', sub: 'High-Conversion Design',
    features: ['Mobile-first responsive', 'A/B test ready', 'Speed optimized, under 2s load'],
    tiers: { basic: '$97', standard: '$347', premium: '$697' },
  },
  {
    id: 'WL-02', pillar: 'Web & Landing Pages',
    headline: 'Client Portal', sub: 'Full-Stack MVP',
    features: ['Secure login & auth', 'Custom dashboard & data', 'Built to scale with you'],
    tiers: { basic: '$397', standard: '$1,297', premium: '$2,497' },
  },
  {
    id: 'AI-07', pillar: 'AI & Chatbots',
    headline: 'AI Cost Savings', sub: 'Vendor Audit & Renegotiation',
    features: ['Find where AI changed the economics', 'Dollar-figure savings report', 'Vendor negotiation playbook'],
    tiers: { basic: '$297', standard: '$997', premium: '$2,497' },
  },
];

// Helper: create a div element (Satori-compatible)
// Satori requires display:flex on ANY container with array children
function d(style, children) {
  if (typeof children === 'string') {
    return { type: 'div', props: { style: { display: 'flex', ...style }, children } };
  }
  if (!style.display) {
    style.display = 'flex';
  }
  return { type: 'div', props: { style, children: children || [] } };
}

function createGigImage(gig) {
  const c = PILLAR_COLORS[gig.pillar];

  // Feature rows
  const featureRows = gig.features.map(text =>
    d({ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 14 }, [
      d({ width: 8, height: 8, borderRadius: 2, backgroundColor: c.primary, marginRight: 14, flexShrink: 0 }, []),
      d({ color: '#CBD5E1', fontSize: 22, lineHeight: 1.4 }, text),
    ])
  );

  // Tier boxes
  const tierBoxes = [
    { label: 'BASIC', price: gig.tiers.basic, opacity: 0.65 },
    { label: 'STANDARD', price: gig.tiers.standard, opacity: 0.82 },
    { label: 'PREMIUM', price: gig.tiers.premium, opacity: 1 },
  ].map(t =>
    d({
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '12px 20px', borderRadius: 10,
      border: `1.5px solid ${c.primary}`, opacity: t.opacity, minWidth: 110,
    }, [
      d({ color: c.primary, fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }, t.label),
      d({ color: '#FFFFFF', fontSize: 22, fontWeight: 700, marginTop: 4 }, t.price),
    ])
  );

  // Right-side decorative bars (abstract graphic)
  const barCount = 5;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const w = 80 + Math.sin(i * 1.3) * 50;
    const op = 0.15 + (i / barCount) * 0.5;
    return d({
      width: w,
      height: 18,
      borderRadius: 9,
      backgroundColor: c.primary,
      opacity: op,
      marginBottom: 12,
    }, []);
  });

  // Large accent circle in top-right area
  const accentCircle = d({
    width: 280,
    height: 280,
    borderRadius: 140,
    border: `3px solid ${c.primary}`,
    opacity: 0.08,
  }, []);

  // Smaller filled circle
  const smallCircle = d({
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: c.primary,
    opacity: 0.12,
    marginTop: 20,
  }, []);

  // Main layout
  return d({
    width: WIDTH,
    height: HEIGHT,
    display: 'flex',
    flexDirection: 'row',
    backgroundImage: `linear-gradient(135deg, ${c.bg} 0%, #0A0A12 50%, ${c.dark}33 100%)`,
    fontFamily: 'Arial',
    overflow: 'hidden',
  }, [
    // Left content (62%)
    d({
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      width: '62%',
      padding: '50px 40px 50px 60px',
    }, [
      // Pillar label
      d({ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 20 }, [
        d({ width: 10, height: 10, borderRadius: 5, backgroundColor: c.primary, marginRight: 10 }, []),
        d({ color: c.primary, fontSize: 16, fontWeight: 700, letterSpacing: 2 }, gig.pillar.toUpperCase()),
      ]),
      // Headline
      d({ color: '#FFFFFF', fontSize: 62, fontWeight: 700, lineHeight: 1.1, marginBottom: 8 }, gig.headline),
      // Subheadline
      d({ color: '#94A3B8', fontSize: 26, marginBottom: 32 }, gig.sub),
      // Features
      d({ display: 'flex', flexDirection: 'column', marginBottom: 36 }, featureRows),
      // Tiers
      d({ display: 'flex', flexDirection: 'row', gap: 16 }, tierBoxes),
    ]),
    // Right decorative area (38%)
    d({
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: '38%',
      padding: 40,
    }, [
      accentCircle,
      d({ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: -200 }, bars),
      smallCircle,
    ]),
  ]);
}

async function generateImage(gig) {
  const jsx = createGigImage(gig);

  const svg = await satori(jsx, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: 'Arial', data: fontRegular, weight: 400, style: 'normal' },
      { name: 'Arial', data: fontBold, weight: 700, style: 'normal' },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  const filename = `${gig.id.toLowerCase()}-${gig.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}.png`;
  const outputPath = join(outputDir, filename);
  writeFileSync(outputPath, pngBuffer);

  const sizeKB = (pngBuffer.length / 1024).toFixed(0);
  console.log(`  ${gig.id} ${gig.headline.padEnd(20)} → ${filename} (${sizeKB} KB)`);
  return { filename, size: pngBuffer.length };
}

async function main() {
  mkdirSync(outputDir, { recursive: true });

  console.log('');
  console.log('Generating Fiverr Gig Images');
  console.log('═'.repeat(50));
  console.log(`  Output:     ${outputDir}`);
  console.log(`  Dimensions: ${WIDTH} x ${HEIGHT} px`);
  console.log(`  Format:     PNG`);
  console.log('');

  const results = [];
  for (const gig of gigs) {
    try {
      const result = await generateImage(gig);
      results.push({ ...result, id: gig.id, status: 'ok' });
    } catch (err) {
      console.error(`  FAILED: ${gig.id} — ${err.message}`);
      results.push({ id: gig.id, status: 'error', error: err.message });
    }
  }

  const ok = results.filter(r => r.status === 'ok');
  const totalKB = ok.reduce((sum, r) => sum + r.size, 0) / 1024;

  console.log('');
  console.log('═'.repeat(50));
  console.log(`  ${ok.length}/${gigs.length} images generated`);
  console.log(`  Total: ${(totalKB / 1024).toFixed(2)} MB`);
  console.log('');
}

main().catch(console.error);
