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

const C = { primary: '#8B5CF6', dark: '#3B1F6E', bg: '#110B24' };

function d(style, children) {
  if (typeof children === 'string') {
    return { type: 'div', props: { style: { display: 'flex', ...style }, children } };
  }
  if (!style.display) style.display = 'flex';
  return { type: 'div', props: { style, children: children || [] } };
}

// ── Image 2: Sample Savings Report ──────────────────────────────

function createSavingsReport() {
  const rows = [
    { vendor: 'Zendesk (12 seats)',       current: '$2,160',  adjusted: '$890',   savings: '$1,270',  action: 'Replace' },
    { vendor: 'Jasper AI (Team)',          current: '$990',    adjusted: '$0',     savings: '$990',    action: 'Replace' },
    { vendor: 'Outside Counsel (Legal)',   current: '$4,500',  adjusted: '$3,150', savings: '$1,350',  action: 'Renegotiate' },
    { vendor: 'HubSpot (Pro, 8 seats)',    current: '$3,200',  adjusted: '$2,400', savings: '$800',    action: 'Renegotiate' },
    { vendor: 'Fiverr Contractors (Ops)',  current: '$1,800',  adjusted: '$600',   savings: '$1,200',  action: 'Replace' },
    { vendor: 'Canva (Teams)',             current: '$390',    adjusted: '$390',   savings: '$0',      action: 'Keep' },
  ];

  const headerRow = d({
    display: 'flex', flexDirection: 'row', paddingBottom: 12, marginBottom: 8,
    borderBottom: '1.5px solid #334155',
  }, [
    d({ color: '#64748B', fontSize: 13, fontWeight: 700, letterSpacing: 1.2, width: '30%' }, 'VENDOR / SERVICE'),
    d({ color: '#64748B', fontSize: 13, fontWeight: 700, letterSpacing: 1.2, width: '17%', justifyContent: 'flex-end' }, 'CURRENT /MO'),
    d({ color: '#64748B', fontSize: 13, fontWeight: 700, letterSpacing: 1.2, width: '17%', justifyContent: 'flex-end' }, 'AI-ADJUSTED'),
    d({ color: '#64748B', fontSize: 13, fontWeight: 700, letterSpacing: 1.2, width: '17%', justifyContent: 'flex-end' }, 'SAVINGS'),
    d({ color: '#64748B', fontSize: 13, fontWeight: 700, letterSpacing: 1.2, width: '19%', justifyContent: 'flex-end' }, 'ACTION'),
  ]);

  const dataRows = rows.map((r, i) => {
    const actionColor = r.action === 'Replace' ? '#EF4444' : r.action === 'Renegotiate' ? '#F59E0B' : '#10B981';
    const savingsColor = r.savings === '$0' ? '#475569' : '#10B981';
    return d({
      display: 'flex', flexDirection: 'row', alignItems: 'center',
      padding: '10px 0',
      borderBottom: i < rows.length - 1 ? '1px solid #1E293B' : 'none',
    }, [
      d({ color: '#E2E8F0', fontSize: 16, width: '30%' }, r.vendor),
      d({ color: '#94A3B8', fontSize: 16, width: '17%', justifyContent: 'flex-end' }, r.current),
      d({ color: '#CBD5E1', fontSize: 16, fontWeight: 700, width: '17%', justifyContent: 'flex-end' }, r.adjusted),
      d({ color: savingsColor, fontSize: 16, fontWeight: 700, width: '17%', justifyContent: 'flex-end' }, r.savings),
      d({ color: actionColor, fontSize: 14, fontWeight: 700, width: '19%', justifyContent: 'flex-end', letterSpacing: 0.5 }, r.action.toUpperCase()),
    ]);
  });

  return d({
    width: WIDTH, height: HEIGHT, display: 'flex', flexDirection: 'column',
    backgroundImage: `linear-gradient(160deg, ${C.bg} 0%, #0A0A12 60%, ${C.dark}33 100%)`,
    fontFamily: 'Arial', padding: '44px 56px',
  }, [
    // Top bar
    d({ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }, [
      d({ display: 'flex', flexDirection: 'row', alignItems: 'center' }, [
        d({ width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary, marginRight: 10 }, []),
        d({ color: C.primary, fontSize: 14, fontWeight: 700, letterSpacing: 2 }, 'AI COST SAVINGS ASSESSMENT'),
      ]),
      d({ color: '#475569', fontSize: 13 }, 'SAMPLE REPORT — CONFIDENTIAL'),
    ]),
    // Title
    d({ color: '#FFFFFF', fontSize: 36, fontWeight: 700, marginBottom: 4 }, 'Vendor & SaaS Savings Analysis'),
    d({ color: '#64748B', fontSize: 17, marginBottom: 28 }, 'Acme Corp — February 2026 | Prepared by PrettyFly.ai'),
    // Table
    headerRow,
    d({ display: 'flex', flexDirection: 'column' }, dataRows),
    // Bottom summary bar
    d({
      display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginTop: 20, padding: '18px 24px', borderRadius: 12,
      backgroundColor: '#0F172A', border: `1.5px solid ${C.primary}44`,
    }, [
      d({ display: 'flex', flexDirection: 'column' }, [
        d({ color: '#64748B', fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }, 'TOTAL MONTHLY SPEND'),
        d({ color: '#94A3B8', fontSize: 24, fontWeight: 700, marginTop: 2 }, '$13,040'),
      ]),
      d({ display: 'flex', flexDirection: 'column', alignItems: 'center' }, [
        d({ color: '#64748B', fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }, 'AI-ADJUSTED'),
        d({ color: '#CBD5E1', fontSize: 24, fontWeight: 700, marginTop: 2 }, '$7,430'),
      ]),
      d({ display: 'flex', flexDirection: 'column', alignItems: 'center' }, [
        d({ color: '#64748B', fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }, 'MONTHLY SAVINGS'),
        d({ color: '#10B981', fontSize: 24, fontWeight: 700, marginTop: 2 }, '$5,610'),
      ]),
      d({ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }, [
        d({ color: '#64748B', fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }, 'ANNUAL IMPACT'),
        d({ color: '#10B981', fontSize: 24, fontWeight: 700, marginTop: 2 }, '$67,320'),
      ]),
    ]),
  ]);
}

// ── Image 3: Before / After Cost Comparison ─────────────────────

function createBeforeAfter() {
  const categories = [
    { label: 'SaaS Subscriptions',      before: 6340,  after: 3280 },
    { label: 'Professional Services',    before: 4500,  after: 3150 },
    { label: 'Contractors & Freelance',  before: 1800,  after: 600 },
    { label: 'Per-Seat Licenses',        before: 2200,  after: 890 },
  ];
  const totalBefore = categories.reduce((s, c) => s + c.before, 0);
  const totalAfter = categories.reduce((s, c) => s + c.after, 0);
  const savings = totalBefore - totalAfter;
  const pct = Math.round((savings / totalBefore) * 100);
  const maxVal = Math.max(...categories.map(c => c.before));

  const barRows = categories.map(c => {
    const beforeW = Math.round((c.before / maxVal) * 380);
    const afterW = Math.round((c.after / maxVal) * 380);
    return d({ display: 'flex', flexDirection: 'column', marginBottom: 22 }, [
      d({ color: '#CBD5E1', fontSize: 15, marginBottom: 8 }, c.label),
      d({ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 4 }, [
        d({ width: beforeW, height: 22, borderRadius: 4, backgroundColor: '#EF444466' }, []),
        d({ color: '#EF4444', fontSize: 14, fontWeight: 700, marginLeft: 10 }, `$${c.before.toLocaleString()}`),
      ]),
      d({ display: 'flex', flexDirection: 'row', alignItems: 'center' }, [
        d({ width: afterW, height: 22, borderRadius: 4, backgroundColor: '#10B98166' }, []),
        d({ color: '#10B981', fontSize: 14, fontWeight: 700, marginLeft: 10 }, `$${c.after.toLocaleString()}`),
      ]),
    ]);
  });

  return d({
    width: WIDTH, height: HEIGHT, display: 'flex', flexDirection: 'row',
    backgroundImage: `linear-gradient(160deg, ${C.bg} 0%, #0A0A12 50%, ${C.dark}33 100%)`,
    fontFamily: 'Arial', overflow: 'hidden',
  }, [
    // Left: bar chart
    d({
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      width: '58%', padding: '44px 30px 44px 56px',
    }, [
      d({ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 10 }, [
        d({ width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary, marginRight: 10 }, []),
        d({ color: C.primary, fontSize: 14, fontWeight: 700, letterSpacing: 2 }, 'AI COST SAVINGS ASSESSMENT'),
      ]),
      d({ color: '#FFFFFF', fontSize: 38, fontWeight: 700, lineHeight: 1.15, marginBottom: 6 }, 'Before & After'),
      d({ color: '#64748B', fontSize: 17, marginBottom: 30 }, 'Monthly vendor spend comparison'),
      // Legend
      d({ display: 'flex', flexDirection: 'row', marginBottom: 20 }, [
        d({ display: 'flex', flexDirection: 'row', alignItems: 'center', marginRight: 24 }, [
          d({ width: 14, height: 14, borderRadius: 3, backgroundColor: '#EF444466', marginRight: 8 }, []),
          d({ color: '#94A3B8', fontSize: 13 }, 'Before (current spend)'),
        ]),
        d({ display: 'flex', flexDirection: 'row', alignItems: 'center' }, [
          d({ width: 14, height: 14, borderRadius: 3, backgroundColor: '#10B98166', marginRight: 8 }, []),
          d({ color: '#94A3B8', fontSize: 13 }, 'After (AI-adjusted)'),
        ]),
      ]),
      d({ display: 'flex', flexDirection: 'column' }, barRows),
    ]),
    // Right: summary cards
    d({
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      width: '42%', padding: '44px 48px',
    }, [
      // Savings card (hero)
      d({
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '32px 40px', borderRadius: 16,
        border: `2px solid ${C.primary}`, backgroundColor: '#0F172A',
        marginBottom: 24, width: '100%',
      }, [
        d({ color: '#64748B', fontSize: 13, fontWeight: 700, letterSpacing: 2 }, 'MONTHLY SAVINGS'),
        d({ color: '#10B981', fontSize: 56, fontWeight: 700, marginTop: 4 }, `$${savings.toLocaleString()}`),
        d({ color: C.primary, fontSize: 22, fontWeight: 700, marginTop: 2 }, `${pct}% reduction`),
      ]),
      // Before / After cards side by side
      d({ display: 'flex', flexDirection: 'row', width: '100%', gap: 16 }, [
        d({
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '20px 16px', borderRadius: 12, border: '1.5px solid #334155',
          width: '50%',
        }, [
          d({ color: '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }, 'BEFORE'),
          d({ color: '#EF4444', fontSize: 28, fontWeight: 700, marginTop: 4 }, `$${totalBefore.toLocaleString()}`),
          d({ color: '#475569', fontSize: 13, marginTop: 2 }, '/month'),
        ]),
        d({
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '20px 16px', borderRadius: 12, border: '1.5px solid #334155',
          width: '50%',
        }, [
          d({ color: '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }, 'AFTER'),
          d({ color: '#10B981', fontSize: 28, fontWeight: 700, marginTop: 4 }, `$${totalAfter.toLocaleString()}`),
          d({ color: '#475569', fontSize: 13, marginTop: 2 }, '/month'),
        ]),
      ]),
      // Annual impact
      d({
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '18px 24px', borderRadius: 12, backgroundColor: '#10B98112',
        border: '1.5px solid #10B98133', marginTop: 16, width: '100%',
      }, [
        d({ color: '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }, 'ANNUAL IMPACT'),
        d({ color: '#10B981', fontSize: 32, fontWeight: 700, marginTop: 2 }, `$${(savings * 12).toLocaleString()}`),
      ]),
    ]),
  ]);
}

// ── Render ───────────────────────────────────────────────────────

async function render(jsx, filename) {
  const svg = await satori(jsx, {
    width: WIDTH, height: HEIGHT,
    fonts: [
      { name: 'Arial', data: fontRegular, weight: 400, style: 'normal' },
      { name: 'Arial', data: fontBold, weight: 700, style: 'normal' },
    ],
  });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
  const png = resvg.render().asPng();
  const out = join(outputDir, filename);
  writeFileSync(out, png);
  const kb = (png.length / 1024).toFixed(0);
  console.log(`  ${filename} (${kb} KB)`);
  return png.length;
}

async function main() {
  mkdirSync(outputDir, { recursive: true });
  console.log('\nGenerating AI-07 Supplementary Images\n' + '═'.repeat(44));

  let total = 0;
  total += await render(createSavingsReport(), 'ai-07-savings-report.png');
  total += await render(createBeforeAfter(), 'ai-07-before-after.png');

  console.log('\n' + '═'.repeat(44));
  console.log(`  2 images generated (${(total / 1024).toFixed(0)} KB total)\n`);
}

main().catch(console.error);
