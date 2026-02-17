# Technology Stack

**Analysis Date:** 2026-02-17

## Languages

**Primary:**
- TypeScript 5.9.3 - Frontend components, type safety across application
- JavaScript (ESM) - Node.js scripts for automation (`.mjs` files)

**Secondary:**
- CSS/PostCSS - Styling via Tailwind CSS pipeline

## Runtime

**Environment:**
- Node.js 24.13.0
- Browser (React 18.3.1 SSR via Next.js)

**Package Manager:**
- npm 11.8.0
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 14.2.35 - Full-stack React framework with App Router
- React 18.3.1 - UI component library
- React DOM 18.3.1 - DOM rendering

**UI & Styling:**
- Tailwind CSS 3.4.19 - Utility-first CSS framework
- tailwind-merge 3.4.0 - Class merging utility
- @tailwindcss/typography 0.5.19 - Typography plugin
- Autoprefixer 10.4.24 - CSS vendor prefixing
- PostCSS 8.5.6 - CSS transformation pipeline
- shadcn/ui - Component library (via `src/components/ui/`)
- class-variance-authority 0.7.1 - Component variant management
- lucide-react 0.563.0 - Icon library

**Forms & Validation:**
- React Hook Form 7.71.1 - Form state management
- @hookform/resolvers 5.2.2 - Form validation resolvers
- Zod 4.3.6 - Schema validation and type inference

**Data Visualization:**
- Recharts 3.7.0 - React charting library

**Drag & Drop:**
- @dnd-kit/core 6.3.1 - Headless drag-and-drop toolkit
- @dnd-kit/sortable 10.0.0 - Sortable preset
- @dnd-kit/utilities 3.2.2 - Utility functions

**Image Generation:**
- Satori 0.19.2 - HTML to SVG converter
- @resvg/resvg-js 2.6.2 - SVG to PNG rasterizer

**Scraping & Automation:**
- Playwright 1.58.2 - Headless browser automation
- playwright-extra 4.3.6 - Playwright plugin system
- puppeteer-extra-plugin-stealth 2.11.2 - Headless browser detection evasion

**Utilities:**
- date-fns 4.1.0 - Date manipulation
- clsx 2.1.1 - Conditional class management
- dotenv 17.2.4 - Environment variable loading

**Testing:**
- Built into Next.js 14 (ESLint)

**Build/Dev:**
- TypeScript 5.9.3 - Type compilation
- Prettier 3.8.1 - Code formatting
- ESLint 9.39.2 - Code linting
- eslint-config-next 16.1.6 - Next.js ESLint rules

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.95.3 - Backend client (not actively used in current state; frontend prepared for future integration)
- @supabase/ssr 0.8.0 - Server-side auth helpers (prepared for future use)
- @anthropic-ai/sdk 0.74.0 - Claude AI API for morning report synthesis via Haiku 4.5

**Infrastructure:**
- Next.js ecosystem (@next/env, @next/swc-darwin-arm64) - Build tooling

**Type Definitions:**
- @types/node 25.2.2 - Node.js types
- @types/react 19.2.13 - React types
- @types/react-dom 19.2.3 - React DOM types

## Configuration

**Environment:**
- Configuration via `.env.local` (development)
- Production env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Monitoring env vars: Stored in `.env.monitor` (separate config file for scripts)

**Build:**
- `tsconfig.json` - TypeScript configuration with path alias `@/*` → `./src/*`
- `next.config.js` - Next.js configuration (minimal, only reactStrictMode)
- `postcss.config.js` - PostCSS plugins (tailwindcss, autoprefixer)
- `.eslintrc.json` - ESLint extends `next/core-web-vitals`
- No `.prettierrc` detected - Uses Prettier defaults

## Platform Requirements

**Development:**
- macOS (darwin-arm64 specific builds via @next/swc)
- Terminal access for Node.js scripts
- Playwright/Chromium browser binary

**Production:**
- Vercel deployment (GitHub auto-deploy from main branch)
- Vercel project ID: `prj_RGYurFzF1tt8aVJbGPdce2gJHFEZ`
- Requires Node.js 24.13.0+ compatible runtime
- PostgreSQL 15 (Supabase backend, local dev via Docker)

---

*Stack analysis: 2026-02-17*
