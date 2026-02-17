# Coding Conventions

**Analysis Date:** 2026-02-17

## Naming Patterns

**Files:**
- React components: PascalCase in subdirectories matching feature area
  - `src/components/pipeline/KanbanBoard.tsx`
  - `src/components/projects/ProjectCard.tsx`
  - `src/lib/hooks/useOpportunities.ts`
- Library/utility files: camelCase or dash-separated
  - `src/lib/utils.ts`, `src/lib/listings.ts`
  - `src/lib/utils/constants.ts`
- Scripts: kebab-case with .mjs extension
  - `scripts/morning-report.mjs`, `scripts/scrape-fiverr.mjs`

**Functions:**
- camelCase for all functions and methods
- Hooks prefixed with `use` (React convention)
- Async functions explicit with `async` keyword
- Examples: `useOpportunities()`, `fetchOpportunities()`, `createOpportunity()`, `handleDragEnd()`

**Variables:**
- camelCase for local variables and state
- UPPER_SNAKE_CASE for constants and configuration
- Examples: `const activeId`, `const KANBAN_STAGES`, `const OPPORTUNITY_STAGES`

**Types:**
- PascalCase for types and interfaces
- Suffix with `Props` for component prop types
- Suffix with `Filters` for filter configuration objects
- Examples: `interface OpportunityCardProps`, `interface OpportunityFilters`, `type OpportunityStage`

## Code Style

**Formatting:**
- ESLint via Next.js core configuration (`eslint-config-next`)
- Prettier enabled via npm scripts: `npm run format`
- Tab width: 2 spaces (inferred from codebase)
- No explicit .prettierrc found at project root — uses Next.js defaults

**Linting:**
- ESLint configuration: `.eslintrc.json` extends `"next/core-web-vitals"`
- Run: `npm run lint`
- Minimal custom rules — relies on Next.js recommended settings

## Import Organization

**Order:**
1. External dependencies (React, Next.js, libraries)
   ```typescript
   import { useState, useCallback } from "react"
   import { useRouter } from "next/navigation"
   import type { Metadata } from "next"
   import { chromium } from 'playwright-extra'
   import { Button } from "@/components/ui/button"
   ```

2. Internal utilities and constants
   ```typescript
   import { cn } from "@/lib/utils"
   import { OPPORTUNITY_STAGES } from "@/lib/utils/constants"
   import type { OpportunityWithRelations } from "@/lib/supabase/types"
   ```

3. Components and hooks (relative or aliased)
   ```typescript
   import { KanbanColumn } from "./KanbanColumn"
   import { useOpportunities } from "@/lib/hooks/useOpportunities"
   ```

**Path Aliases:**
- Configured in `tsconfig.json`: `"@/*": ["./src/*"]`
- Always use `@/` prefix for imports from src directory
- Never use relative imports across feature boundaries

## Error Handling

**Patterns:**

1. **React Hooks & Async Operations:**
   - Wrap in try-catch blocks
   - Set error state with `console.error()` logging
   - Example from `useOpportunities.ts`:
   ```typescript
   try {
     const { data, error } = await query
     if (error) throw error
     setOpportunities((data as Opportunity[]) ?? [])
   } catch (err) {
     console.error("Failed to fetch opportunities:", err)
     setOpportunities([])
   } finally {
     setLoading(false)
   }
   ```

2. **Node.js Scripts:**
   - Use try-catch in async orchestrators
   - Log structured results with status booleans
   - Example from `morning-report.mjs`:
   ```javascript
   const results = {
     fiverr: false,
     upwork: false,
     report: false,
   };

   try {
     const fiverrResult = await scrapeFiverr()
     results.fiverr = fiverrResult.success
     console.log(`Fiverr scrape: ${fiverrResult.success ? 'OK' : 'FAILED'}`)
   } catch (err) {
     console.error(`Fiverr scrape error: ${err.message}`)
   }
   ```

3. **Drag-and-Drop Error Handling:**
   - Catch promise rejections silently for UI operations
   - Example from `KanbanBoard.tsx`:
   ```typescript
   try {
     await onStageChange(draggedOpp.id, newStage)
   } catch {
     // The hook handles rollback via fetchOpportunities
   }
   ```

## Logging

**Framework:** `console` (no logging library)

**Patterns:**
- Use `console.log()` for informational messages
- Use `console.error()` for error/exception logging
- Node scripts include timestamps: `const timestamp = () => new Date().toLocaleTimeString('en-US', { hour12: false })`
- Log operation start/end with timing for background jobs
- Example from `morning-report.mjs`:
  ```javascript
  const startTime = Date.now()
  const timestamp = () => new Date().toLocaleTimeString('en-US', { hour12: false })

  console.log(`Morning report starting at ${timestamp()}`)
  // ... operations ...
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`Morning report complete at ${timestamp()} (took ${elapsed}s)`)
  ```

## Comments

**When to Comment:**
- Section headers using dashed comment blocks for visual organization
- Example pattern from `KanbanBoard.tsx`:
  ```typescript
  // -----------------------------------------------------------------------
  // Types
  // -----------------------------------------------------------------------

  // -----------------------------------------------------------------------
  // Stages visible as Kanban columns (exclude "lost")
  // -----------------------------------------------------------------------
  ```

- Explain non-obvious logic (deadline urgency calculation, drag event resolution)
- Mark provisional DOM selectors as "May need updating" in web scrapers
- Use inline comments for complex state management or event handling

**JSDoc/TSDoc:**
- Not consistently used — file-level documentation preferred for scripts
- Script headers include docstrings explaining purpose and usage
- Example from `scrape-fiverr.mjs`:
  ```javascript
  /**
   * scrape-fiverr.mjs — Headless Fiverr dashboard scraper
   * Outputs structured JSON to data/fiverr/metrics-latest.json
   * and archives a dated copy to data/fiverr/history/YYYY-MM-DD.json.
   */
  ```

## Function Design

**Size:**
- Functions typically 30-80 lines for React components
- Larger components (>300 lines) broken into sub-components or extracted logic
- Example: `KanbanBoard.tsx` (270 lines) splits drag handlers into separate `useCallback()` functions

**Parameters:**
- Component props typed with `interface ComponentNameProps`
- Data mutation functions accept `Partial<T>` for flexible updates
- Callbacks passed down as optional props with `?:` notation
- Example:
  ```typescript
  interface KanbanBoardProps {
    opportunities: OpportunityWithRelations[]
    loading: boolean
    onStageChange: (id: string, newStage: OpportunityStage) => Promise<void>
    onAddClick: () => void
  }
  ```

**Return Values:**
- Async functions return Promises with explicit typing
- Hooks return state and callback tuple or object
- Render methods implicitly return JSX
- Error-prone operations return `{ success: boolean, error?: string }` in scripts
- Example:
  ```typescript
  const createOpportunity = useCallback(
    async (data: Partial<Opportunity>): Promise<Opportunity> => {
      // ...
    },
    [supabase]
  )
  ```

## Module Design

**Exports:**
- Named exports for components and utilities
- Example from `components/pipeline/index.ts`:
  ```typescript
  export { KanbanBoard } from "./KanbanBoard"
  export { OpportunityCard } from "./OpportunityCard"
  ```

**Barrel Files:**
- Used in component subdirectories to simplify imports
- Centralize re-exports from `index.ts` or `index.ts` files
- Allow importing `from "@/components/layout"` instead of full path
- Pattern: `src/components/[feature]/index.ts` exports all public components

## Styling

**Framework:** Tailwind CSS with shadcn/ui components

**Patterns:**
- Use `clsx` + `twMerge` through `cn()` utility
- Apply via `className` prop with `cn()` merge
- Example from `Header.tsx`:
  ```typescript
  <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
    <div>
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
    </div>
  </header>
  ```

- Use CSS-in-JS for dynamic values via `style` prop
- Example from `OpportunityCard.tsx`:
  ```typescript
  <span
    style={{
      backgroundColor: `${color}18`,
      color,
    }}
  >
  ```

- Component variant patterns via class-variance-authority (CVA)
- Example from `button.tsx`:
  ```typescript
  const buttonVariants = cva("...", {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
    },
  })
  ```

## TypeScript

**Strict Mode:** Enabled in `tsconfig.json`
- `"strict": true` enforces all type checking options
- `"noEmit": true` prevents runtime output
- Types imported with `import type` to avoid circular dependencies

**Type Imports:**
- Use `import type` for types and interfaces
- Example:
  ```typescript
  import type { OpportunityWithRelations, OpportunityStage } from "@/lib/supabase/types"
  import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core"
  ```

---

*Convention analysis: 2026-02-17*
