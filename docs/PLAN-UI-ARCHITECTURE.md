# UI/UX Component Architecture Plan

> PrettyFly Acquisition Engine -- Next.js 14 + Tailwind + shadcn/ui
>
> This document is the authoritative reference for all component design decisions
> from Phase 2 onward. Every new component, form, chart, and interaction described
> here should be implemented exactly as specified unless a concrete technical
> blocker is discovered during development.

---

## Table of Contents

1. [Kanban Board Design](#1-kanban-board-design)
2. [Form Architecture](#2-form-architecture)
3. [Dashboard Visualization](#3-dashboard-visualization)
4. [State Management](#4-state-management)
5. [Component Hierarchy per Page](#5-component-hierarchy-per-page)
6. [Mobile Responsive Strategy](#6-mobile-responsive-strategy)
7. [Missing Shared Components](#7-missing-shared-components)

---

## 1. Kanban Board Design

The pipeline Kanban is the single most-used view in the application. It must feel
immediate: drag starts with zero perceptible delay, columns scroll independently,
and stage changes persist optimistically before the network round-trip completes.

### 1.1 Component Tree

```
PipelinePage ("use client")
  |-- PipelineControls
  |     |-- ViewToggle (kanban | table)
  |     |-- PipelineFilters
  |     |     |-- PlatformFilterChips
  |     |     |-- PillarFilterChips
  |     |     |-- SearchFilter (shared)
  |     |-- Button "Add Opportunity" -> opens OpportunityFormDialog
  |
  |-- KanbanBoard ("use client")
  |     |-- DndContext
  |     |     |-- SortableContext (per column -- vertical list strategy)
  |     |     |     |-- KanbanColumn  (one per visible OPPORTUNITY_STAGE)
  |     |     |     |     |-- KanbanColumnHeader (stage dot, label, count)
  |     |     |     |     |-- SortableItem (wrapper for drag handle)
  |     |     |     |     |     |-- OpportunityCard
  |     |     |     |     |          |-- PlatformBadge
  |     |     |     |     |          |-- PillarBadge
  |     |     |     |     |          |-- currency + deadline
  |     |     |     |     |-- EmptyColumnDropZone (when column has 0 items)
  |     |     |
  |     |     |-- DragOverlay (portal -- renders OpportunityCard clone)
  |
  |-- PipelineTable (alternative view, reuses same data)
```

### 1.2 File Locations

```
src/components/pipeline/
  KanbanBoard.tsx          # DndContext wrapper + column layout
  KanbanColumn.tsx         # Single stage column with SortableContext
  KanbanColumnHeader.tsx   # Stage color dot, label, card count
  OpportunityCard.tsx      # Card rendered inside sortable item
  SortableItem.tsx         # useSortable wrapper, exposes drag handle
  PipelineControls.tsx     # View toggle + filters bar
  PipelineFilters.tsx      # Platform/pillar chip filters
  PipelineTable.tsx        # Table alternative view
  index.ts                 # Barrel exports
```

### 1.3 @dnd-kit Configuration

```typescript
// KanbanBoard.tsx
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

// --- Sensors -----------------------------------------------------------

// PointerSensor with 5px activation distance prevents accidental drags
// when the user just clicks to open a card detail.
const pointerSensor = useSensor(PointerSensor, {
  activationConstraint: { distance: 5 },
})

// TouchSensor with 250ms delay + 5px tolerance prevents scroll-hijacking
// on mobile. The user must press-and-hold before the drag activates.
const touchSensor = useSensor(TouchSensor, {
  activationConstraint: { delay: 250, tolerance: 5 },
})

const keyboardSensor = useSensor(KeyboardSensor)

const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor)
```

### 1.4 Drag State Machine

```typescript
interface KanbanBoardProps {
  opportunities: Opportunity[]
  onStageChange: (id: string, newStage: OpportunityStage) => Promise<void>
  onReorder: (id: string, newIndex: number, stage: OpportunityStage) => void
}

// Internal state: map from stage -> ordered array of opportunity IDs.
// Built from props on mount and kept in sync via onDragEnd.
type ColumnMap = Record<OpportunityStage, string[]>

const [columns, setColumns] = useState<ColumnMap>(buildColumnMap(opportunities))
const [activeCard, setActiveCard] = useState<Opportunity | null>(null)

function handleDragStart(event: DragStartEvent) {
  const opp = opportunities.find((o) => o.id === event.active.id)
  setActiveCard(opp ?? null)
}

function handleDragOver(event: DragOverEvent) {
  // When dragging over a different column, move the card ID from the
  // source column array to the target column array immediately.
  // This gives real-time visual feedback as the card crosses columns.
  const { active, over } = event
  if (!over) return

  const activeStage = findStageForId(active.id as string, columns)
  const overStage = findStageForId(over.id as string, columns)
    ?? (over.id as OpportunityStage)  // over.id is the column droppable ID

  if (activeStage && overStage && activeStage !== overStage) {
    setColumns((prev) => moveCardBetweenColumns(prev, active.id as string, activeStage, overStage))
  }
}

async function handleDragEnd(event: DragEndEvent) {
  setActiveCard(null)
  const { active, over } = event
  if (!over) return

  const targetStage = findStageForId(active.id as string, columns)
  if (!targetStage) return

  const originalStage = opportunities.find((o) => o.id === active.id)?.stage
  if (originalStage && targetStage !== originalStage) {
    // Optimistic update already applied in handleDragOver.
    // Now persist to Supabase. On failure, useOpportunities.updateStage
    // reverts by re-fetching.
    await onStageChange(active.id as string, targetStage)
  }
}
```

### 1.5 DragOverlay (Portal Card)

The `DragOverlay` renders a styled clone of the card being dragged. This
avoids layout shifts in the source column during the drag and allows the
overlay to float above all columns and the sidebar.

```tsx
<DragOverlay dropAnimation={null}>
  {activeCard ? (
    <OpportunityCard
      opportunity={activeCard}
      isDragOverlay
      className="rotate-2 shadow-xl ring-2 ring-primary/30"
    />
  ) : null}
</DragOverlay>
```

`dropAnimation={null}` disables the default return animation because the
optimistic state update means the card is already in its new position by the
time the drag ends.

### 1.6 OpportunityCard Props

```typescript
interface OpportunityCardProps {
  opportunity: Opportunity
  isDragOverlay?: boolean
  className?: string
  onClick?: () => void
}
```

The card displays:
- **Title** (job_title, truncated to 2 lines)
- **PlatformBadge** (top-right)
- **PillarBadge** (below title)
- **Budget** (formatCurrency of budget_min -- budget_max, or contract_value if contracted+)
- **Deadline** (formatRelativeDate of delivery_deadline, shown in amber if < 3 days)
- **Client** (client_name, truncated)

Clicking the card (when not dragging) navigates to `/pipeline/[id]`.

### 1.7 Optimistic Update Pattern

The `useOpportunities` hook already has an `updateStage` method with optimistic
local-state mutation and Supabase rollback on error. The Kanban board calls this
directly. No additional optimistic logic is needed at the board level beyond the
`columns` state shuffling described above.

Rollback flow:
1. `updateStage` sets local state immediately.
2. Supabase `.update()` fires.
3. On error, `fetchOpportunities()` re-fetches the full list, which resets
   both the hook state and (via prop change) the board `columns` state.

### 1.8 Droppable Column IDs

Each `KanbanColumn` registers a droppable with `id={stage}`. Cards use
`id={opportunity.id}`. The collision detection algorithm `closestCorners`
resolves which column a card is hovering over when it crosses boundaries.

### 1.9 Accessibility

- Keyboard sensor allows Tab to focus cards, Space/Enter to pick up, arrow keys
  to move between positions, Space/Enter to drop.
- Each card has `role="listitem"`, each column has `role="list"`.
- `aria-label` on each column: e.g. "Discovered stage, 3 opportunities".
- Screen reader announcements via `DndContext` `announcements` prop.

---

## 2. Form Architecture

All forms use React Hook Form for state management and Zod for validation.
The pattern is consistent across every entity.

### 2.1 Shared Form Utilities

```
src/components/forms/
  FormField.tsx        # Label + input + error message wrapper
  FormSection.tsx      # Collapsible form section with title
  FormActions.tsx      # Submit + Cancel button row
  index.ts
src/lib/schemas/
  opportunity.ts       # Zod schema for Opportunity
  gig.ts               # Zod schema for GigListing (with pricing tiers)
  proposal.ts          # Zod schema for ProposalTemplate + generation request
  revenue.ts           # Zod schema for RevenueEntry
  project.ts           # Zod schema for Project
  portfolio.ts         # Zod schema for PortfolioItem
  content-block.ts     # Zod schema for ContentBlock
  shared.ts            # Shared refinements (uuid, isoDate, positiveNumber)
  index.ts
```

### 2.2 FormField Component

```typescript
interface FormFieldProps {
  label: string
  name: string
  error?: string
  description?: string
  required?: boolean
  children: React.ReactNode
}

// Usage:
<FormField label="Job Title" name="job_title" error={errors.job_title?.message} required>
  <Input {...register("job_title")} placeholder="e.g. Build n8n automation workflow" />
</FormField>
```

```tsx
// FormField.tsx
export function FormField({
  label,
  name,
  error,
  description,
  required,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
```

### 2.3 FormActions Component

```typescript
interface FormActionsProps {
  submitLabel?: string
  onCancel: () => void
  isSubmitting: boolean
  isDirty: boolean
}
```

```tsx
export function FormActions({
  submitLabel = "Save",
  onCancel,
  isSubmitting,
  isDirty,
}: FormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
      <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </div>
  )
}
```

### 2.4 Zod Schemas

#### 2.4.1 Shared Refinements (`src/lib/schemas/shared.ts`)

```typescript
import { z } from "zod"

export const uuidSchema = z.string().uuid("Must be a valid UUID")
export const isoDateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  "Must be YYYY-MM-DD format"
)
export const isoDateTimeSchema = z.string().datetime("Must be a valid ISO datetime")
export const positiveNumber = z.number().positive("Must be a positive number")
export const nonNegativeNumber = z.number().min(0, "Cannot be negative")
export const urlSchema = z.string().url("Must be a valid URL").or(z.literal(""))
export const optionalUuid = uuidSchema.nullable().optional()
```

#### 2.4.2 Opportunity Schema (`src/lib/schemas/opportunity.ts`)

```typescript
import { z } from "zod"
import { uuidSchema, optionalUuid, urlSchema, isoDateSchema } from "./shared"

export const opportunityFormSchema = z.object({
  // Required
  platform_id: uuidSchema,
  job_title: z.string().min(3, "Title must be at least 3 characters").max(200),

  // Optional identifiers
  pillar_id: optionalUuid,
  gig_id: optionalUuid,

  // Job details
  job_url: urlSchema.default(""),
  job_description: z.string().max(10000).default(""),
  client_name: z.string().max(200).default(""),
  client_company: z.string().max(200).default(""),
  client_location: z.string().max(200).default(""),

  // Financial
  budget_min: z.number().nullable().default(null),
  budget_max: z.number().nullable().default(null),
  contract_type: z.enum(["fixed", "hourly"]).default("fixed"),
  contract_value: z.number().nullable().default(null),
  estimated_hours: z.number().nullable().default(null),

  // Proposal
  proposal_text: z.string().max(50000).default(""),
  proposal_template_id: optionalUuid,

  // Timeline
  delivery_deadline: isoDateSchema.nullable().default(null),

  // Notes
  notes: z.string().max(10000).default(""),
}).refine(
  (data) => {
    if (data.budget_min !== null && data.budget_max !== null) {
      return data.budget_max >= data.budget_min
    }
    return true
  },
  { message: "Max budget must be >= min budget", path: ["budget_max"] }
)

export type OpportunityFormValues = z.infer<typeof opportunityFormSchema>

// Subset schema for the quick-add form (minimal fields)
export const opportunityQuickAddSchema = z.object({
  platform_id: uuidSchema,
  job_title: z.string().min(3).max(200),
  job_url: urlSchema.default(""),
  budget_min: z.number().nullable().default(null),
  budget_max: z.number().nullable().default(null),
  contract_type: z.enum(["fixed", "hourly"]).default("fixed"),
  notes: z.string().max(2000).default(""),
})

export type OpportunityQuickAddValues = z.infer<typeof opportunityQuickAddSchema>
```

#### 2.4.3 Gig Schema with Pricing Tiers (`src/lib/schemas/gig.ts`)

```typescript
import { z } from "zod"
import { uuidSchema, urlSchema, nonNegativeNumber } from "./shared"

const pricingTierSchema = z.object({
  price: z.number().positive("Price must be positive").nullable().default(null),
  delivery_days: z.number().int().positive("Must be at least 1 day").nullable().default(null),
})

export const gigFormSchema = z.object({
  // Required
  platform_id: uuidSchema,
  pillar_id: uuidSchema,
  title: z.string().min(5, "Title must be at least 5 characters").max(200),

  // Content
  description: z.string().min(50, "Description should be at least 50 characters").max(10000),
  tags: z.array(z.string().max(50)).max(20, "Maximum 20 tags"),

  // Status
  status: z.enum(["draft", "active", "paused", "archived"]).default("draft"),

  // Pricing tiers (all optional -- a gig can have partial tiers)
  pricing_basic: pricingTierSchema.nullable().default(null),
  pricing_standard: pricingTierSchema.nullable().default(null),
  pricing_premium: pricingTierSchema.nullable().default(null),

  // URL
  gig_url: urlSchema.default(""),
})

// Flatten pricing for DB insert (the DB stores flat columns, not nested objects)
export function flattenGigPricing(values: GigFormValues): Record<string, number | null> {
  return {
    pricing_basic: values.pricing_basic?.price ?? null,
    pricing_standard: values.pricing_standard?.price ?? null,
    pricing_premium: values.pricing_premium?.price ?? null,
    delivery_days_basic: values.pricing_basic?.delivery_days ?? null,
    delivery_days_standard: values.pricing_standard?.delivery_days ?? null,
    delivery_days_premium: values.pricing_premium?.delivery_days ?? null,
  }
}

export type GigFormValues = z.infer<typeof gigFormSchema>
```

#### 2.4.4 Proposal Generation Schema (`src/lib/schemas/proposal.ts`)

```typescript
import { z } from "zod"
import { uuidSchema, optionalUuid } from "./shared"

// Template CRUD form
export const proposalTemplateSchema = z.object({
  name: z.string().min(3).max(200),
  pillar_id: optionalUuid,
  platform_id: optionalUuid,
  template_text: z.string().min(20, "Template must be at least 20 characters").max(50000),
  variables: z.array(z.string().max(100)).default([]),
  tags: z.array(z.string().max(50)).max(10).default([]),
})

export type ProposalTemplateFormValues = z.infer<typeof proposalTemplateSchema>

// AI generation request (sent to Edge Function)
export const proposalGenerationSchema = z.object({
  job_description: z.string().min(20, "Paste at least 20 characters of the job posting"),
  template_id: uuidSchema.optional(),
  pillar_id: optionalUuid,
  platform_id: optionalUuid,
  tone: z.enum(["professional", "conversational", "technical"]).default("professional"),
  max_length: z.number().int().min(100).max(5000).default(1500),
})

export type ProposalGenerationValues = z.infer<typeof proposalGenerationSchema>
```

#### 2.4.5 Revenue Entry Schema (`src/lib/schemas/revenue.ts`)

```typescript
import { z } from "zod"
import { optionalUuid, isoDateSchema, positiveNumber } from "./shared"

export const revenueEntrySchema = z.object({
  // Required
  amount: positiveNumber,
  received_date: isoDateSchema,

  // Associations
  opportunity_id: optionalUuid,
  platform_id: optionalUuid,
  pillar_id: optionalUuid,

  // Details
  currency: z.string().length(3, "Currency code must be 3 characters").default("USD"),
  entry_type: z.enum(["gig_payment", "retainer", "bonus", "tip"]).default("gig_payment"),
  platform_fee_amount: z.number().min(0).default(0),
  notes: z.string().max(2000).default(""),
}).transform((data) => ({
  ...data,
  net_amount: data.amount - data.platform_fee_amount,
}))

export type RevenueEntryFormValues = z.input<typeof revenueEntrySchema>
export type RevenueEntryPayload = z.output<typeof revenueEntrySchema>
```

#### 2.4.6 Project Schema (`src/lib/schemas/project.ts`)

```typescript
import { z } from "zod"
import { optionalUuid, isoDateSchema } from "./shared"

const milestoneSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  due_date: isoDateSchema.nullable(),
  completed: z.boolean().default(false),
  completed_at: z.string().datetime().nullable().default(null),
})

const checklistItemSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1).max(500),
  completed: z.boolean().default(false),
})

const timeEntrySchema = z.object({
  id: z.string().uuid(),
  date: isoDateSchema,
  hours: z.number().positive().max(24),
  description: z.string().max(500).default(""),
})

export const projectFormSchema = z.object({
  title: z.string().min(3).max(200),
  opportunity_id: optionalUuid,
  status: z.enum(["active", "paused", "completed", "cancelled"]).default("active"),
  start_date: isoDateSchema.nullable().default(null),
  target_delivery_date: isoDateSchema.nullable().default(null),
  milestones_json: z.array(milestoneSchema).default([]),
  checklist_json: z.array(checklistItemSchema).default([]),
  time_entries_json: z.array(timeEntrySchema).default([]),
})

export type ProjectFormValues = z.infer<typeof projectFormSchema>
export type Milestone = z.infer<typeof milestoneSchema>
export type ChecklistItem = z.infer<typeof checklistItemSchema>
export type TimeEntry = z.infer<typeof timeEntrySchema>
```

### 2.5 Form Integration Pattern

Every entity form follows this structure:

```typescript
// Example: OpportunityForm.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { opportunityFormSchema, type OpportunityFormValues } from "@/lib/schemas/opportunity"
import { FormField } from "@/components/forms/FormField"
import { FormActions } from "@/components/forms/FormActions"

interface OpportunityFormProps {
  defaultValues?: Partial<OpportunityFormValues>
  onSubmit: (values: OpportunityFormValues) => Promise<void>
  onCancel: () => void
}

export function OpportunityForm({ defaultValues, onSubmit, onCancel }: OpportunityFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    control,
  } = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: {
      contract_type: "fixed",
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Form sections here */}
      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} isDirty={isDirty} />
    </form>
  )
}
```

### 2.6 PricingTierEditor Component

A specialized form sub-component for gig listings. Renders three columns
(Basic / Standard / Premium) with price and delivery-days inputs.

```typescript
interface PricingTierEditorProps {
  control: Control<GigFormValues>
  errors: FieldErrors<GigFormValues>
}
```

```
PricingTierEditor
  |-- div.grid.grid-cols-3
  |     |-- TierColumn "Basic"
  |     |     |-- Input (price, type="number", step="0.01")
  |     |     |-- Input (delivery_days, type="number", min=1)
  |     |-- TierColumn "Standard"
  |     |     |-- same inputs
  |     |-- TierColumn "Premium"
  |           |-- same inputs
```

Each column header shows the tier name with a colored top border:
- Basic: `border-t-2 border-muted-foreground`
- Standard: `border-t-2 border-pillar-automation`
- Premium: `border-t-2 border-pillar-ai`

---

## 3. Dashboard Visualization

All charts use Recharts and follow the dark-mode-first color strategy defined
in `globals.css` and `tailwind.config.ts`.

### 3.1 Color Strategy

#### Pillar Colors (used for pillar-segmented charts)

```typescript
// src/lib/utils/chart-colors.ts
export const PILLAR_CHART_COLORS: Record<string, string> = {
  "Automation & Workflows": "#3B82F6",  // pillar.automation
  "AI & Chatbots":          "#8B5CF6",  // pillar.ai
  "CRM & GoHighLevel":      "#10B981",  // pillar.architecture
  "Dashboards & Analytics":  "#F59E0B",  // pillar.webdev
  "Web & Landing Pages":     "#EF4444",  // pillar.strategy
}
```

#### Platform Colors (used for platform-segmented charts)

```typescript
export const PLATFORM_CHART_COLORS: Record<string, string> = {
  Upwork:              "#14A800",
  Fiverr:              "#1DBF73",
  Toptal:              "#3B82F6",
  "Arc.dev":           "#7C3AED",
  PeoplePerHour:       "#F97316",
  Guru:                "#0EA5E9",
  "LinkedIn Services": "#2563EB",
  "Direct/Referral":   "#71717A",
}
```

#### Chart Theme Constants

```typescript
export const CHART_THEME = {
  axisColor:      "hsl(240 5% 64.9%)",   // --muted-foreground in dark mode
  gridColor:      "hsl(240 3.7% 15.9%)", // --border in dark mode
  tooltipBg:      "hsl(240 10% 3.9%)",   // --background in dark mode
  tooltipBorder:  "hsl(240 3.7% 15.9%)", // --border in dark mode
  tooltipText:    "hsl(0 0% 98%)",        // --foreground in dark mode
  fontSize:       12,
}
```

### 3.2 RevenueChart (Bar Chart -- Dashboard Home)

**File:** `src/components/dashboard/RevenueChart.tsx`

Replaces the current placeholder. Shows daily revenue for the selected period
(default 7 days). Each bar is segmented by platform using stacked bars.

```typescript
interface RevenueChartProps {
  data: Array<{
    date: string          // "Mon", "Tue", etc. or "Jan 15"
    [platformName: string]: number | string  // revenue per platform
  }>
  dateRange: "7d" | "30d" | "90d"
  onDateRangeChange: (range: "7d" | "30d" | "90d") => void
}
```

```tsx
<ResponsiveContainer width="100%" height={200}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridColor} />
    <XAxis dataKey="date" tick={{ fontSize: 11, fill: CHART_THEME.axisColor }} />
    <YAxis tick={{ fontSize: 11, fill: CHART_THEME.axisColor }} tickFormatter={(v) => `$${v}`} />
    <Tooltip
      contentStyle={{
        backgroundColor: CHART_THEME.tooltipBg,
        border: `1px solid ${CHART_THEME.tooltipBorder}`,
        borderRadius: 8,
        color: CHART_THEME.tooltipText,
        fontSize: 12,
      }}
      formatter={(value: number) => formatCurrency(value)}
    />
    {platforms.map((platform) => (
      <Bar
        key={platform}
        dataKey={platform}
        stackId="revenue"
        fill={PLATFORM_CHART_COLORS[platform]}
        radius={[2, 2, 0, 0]}
      />
    ))}
  </BarChart>
</ResponsiveContainer>
```

### 3.3 WinRateChart (Line Chart -- Analytics)

**File:** `src/components/analytics/WinRateChart.tsx`

Shows proposal win rate over time, with one line per platform.

```typescript
interface WinRateChartProps {
  data: Array<{
    week: string            // "W1 Jan", "W2 Jan", etc.
    [platformName: string]: number | string  // win rate percentage
  }>
}
```

```tsx
<ResponsiveContainer width="100%" height={250}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridColor} />
    <XAxis dataKey="week" tick={{ fontSize: 11, fill: CHART_THEME.axisColor }} />
    <YAxis
      tick={{ fontSize: 11, fill: CHART_THEME.axisColor }}
      tickFormatter={(v) => `${v}%`}
      domain={[0, 100]}
    />
    <Tooltip
      contentStyle={tooltipStyle}
      formatter={(value: number) => `${value.toFixed(1)}%`}
    />
    {platforms.map((platform) => (
      <Line
        key={platform}
        dataKey={platform}
        stroke={PLATFORM_CHART_COLORS[platform]}
        strokeWidth={2}
        dot={{ r: 3 }}
        activeDot={{ r: 5 }}
      />
    ))}
    <Legend
      wrapperStyle={{ fontSize: 11, color: CHART_THEME.axisColor }}
    />
  </LineChart>
</ResponsiveContainer>
```

### 3.4 PillarDistribution (Donut Chart -- Analytics + Dashboard)

**File:** `src/components/analytics/PillarDistribution.tsx`

Revenue or opportunity count breakdown by service pillar.

```typescript
interface PillarDistributionProps {
  data: Array<{
    name: string    // pillar name
    value: number   // revenue or count
    color: string   // pillar hex color
  }>
  metric: "revenue" | "count"
  centerLabel?: string  // e.g. "$12,450" or "47"
}
```

```tsx
<ResponsiveContainer width="100%" height={250}>
  <PieChart>
    <Pie
      data={data}
      dataKey="value"
      nameKey="name"
      cx="50%"
      cy="50%"
      innerRadius={60}
      outerRadius={90}
      paddingAngle={2}
      strokeWidth={0}
    >
      {data.map((entry) => (
        <Cell key={entry.name} fill={entry.color} />
      ))}
    </Pie>
    <Tooltip
      contentStyle={tooltipStyle}
      formatter={(value: number) =>
        metric === "revenue" ? formatCurrency(value) : value.toString()
      }
    />
    {/* Center text rendered as a custom label */}
    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-foreground text-lg font-bold"
    >
      {centerLabel}
    </text>
  </PieChart>
</ResponsiveContainer>
```

### 3.5 EffectiveRateChart (Bar Chart -- Analytics)

**File:** `src/components/analytics/EffectiveRateChart.tsx`

Horizontal bar chart comparing effective hourly rate across completed projects.

```typescript
interface EffectiveRateChartProps {
  data: Array<{
    project: string       // truncated project title
    rate: number          // effective $/hr
    pillar: string        // pillar name (for coloring)
  }>
  targetRate?: number     // reference line (e.g. $150/hr target)
}
```

```tsx
<ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
  <BarChart data={data} layout="vertical">
    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridColor} />
    <XAxis
      type="number"
      tick={{ fontSize: 11, fill: CHART_THEME.axisColor }}
      tickFormatter={(v) => `$${v}/hr`}
    />
    <YAxis
      type="category"
      dataKey="project"
      tick={{ fontSize: 11, fill: CHART_THEME.axisColor }}
      width={150}
    />
    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `$${v.toFixed(0)}/hr`} />
    <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
      {data.map((entry) => (
        <Cell key={entry.project} fill={PILLAR_CHART_COLORS[entry.pillar] || "#6B7280"} />
      ))}
    </Bar>
    {targetRate && (
      <ReferenceLine
        x={targetRate}
        stroke="#EF4444"
        strokeDasharray="4 4"
        label={{ value: `Target: $${targetRate}/hr`, fontSize: 11, fill: "#EF4444" }}
      />
    )}
  </BarChart>
</ResponsiveContainer>
```

### 3.6 RevenueTrendChart (Area Chart -- Revenue Dashboard)

**File:** `src/components/analytics/RevenueTrendChart.tsx`

Monthly revenue trend with area fill. Single series or segmented by pillar.

```typescript
interface RevenueTrendChartProps {
  data: Array<{
    month: string
    total: number
    [pillarName: string]: number | string
  }>
  segmented?: boolean  // if true, stacked area by pillar
}
```

### 3.7 Shared Chart Wrapper

All charts live inside a consistent card wrapper.

```typescript
interface ChartCardProps {
  title: string
  action?: React.ReactNode        // e.g. DateRangePicker
  children: React.ReactNode
  className?: string
  isEmpty?: boolean
  emptyMessage?: string
}
```

```tsx
export function ChartCard({ title, action, children, className, isEmpty, emptyMessage }: ChartCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-6", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      <div className="mt-4">
        {isEmpty ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            {emptyMessage || "No data available yet"}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
```

---

## 4. State Management

### 4.1 Decision Matrix

| Data Type | Storage | Rationale |
|-----------|---------|-----------|
| Opportunity list + pipeline | `useOpportunities` hook (React state) + Supabase real-time subscription | Must be reactive for drag-and-drop; real-time ensures multi-tab consistency |
| Filter selections (platform, pillar, stage, search) | URL search params via `useSearchParams` | Shareable, bookmarkable, survives refresh |
| View mode (kanban/table) | URL search param `?view=kanban` | Survives refresh, linkable |
| Date range picker selection | React state (local) | Does not need persistence; resets on page load |
| Form state (draft values) | React Hook Form internal state | Transient by nature; no persistence needed |
| Dialog open/closed | React state (`useState`) | Ephemeral UI state |
| Sidebar collapsed | React state + `localStorage` | Persists across sessions via `localStorage` |
| Toast notifications | React context (ToastProvider) | Global, ephemeral |
| Active drag card | React state in KanbanBoard | Ephemeral, local to drag interaction |
| Proposal generation streaming output | React state + server-sent events | Transient, consumed once |

### 4.2 Filter State via URL Search Params

```typescript
// src/lib/hooks/useFilterParams.ts
"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useCallback } from "react"

interface FilterState {
  platform?: string
  pillar?: string
  stage?: string
  search?: string
  view?: string
  dateRange?: string
}

export function useFilterParams() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filters: FilterState = {
    platform: searchParams.get("platform") ?? undefined,
    pillar: searchParams.get("pillar") ?? undefined,
    stage: searchParams.get("stage") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    view: searchParams.get("view") ?? undefined,
    dateRange: searchParams.get("range") ?? undefined,
  }

  const setFilter = useCallback(
    (key: keyof FilterState, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key === "dateRange" ? "range" : key, value)
      } else {
        params.delete(key === "dateRange" ? "range" : key)
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname]
  )

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [router, pathname])

  return { filters, setFilter, clearFilters }
}
```

### 4.3 Supabase Real-Time Subscription

```typescript
// Inside useOpportunities or a separate useRealtimePipeline hook
import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function useRealtimePipeline(onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("pipeline-changes")
      .on(
        "postgres_changes",
        {
          event: "*",           // INSERT, UPDATE, DELETE
          schema: "public",
          table: "opportunities",
        },
        () => {
          onUpdate()            // Re-fetch the full list
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onUpdate])
}
```

### 4.4 Loading / Error / Empty State Pattern

Every data-driven component handles three non-happy states:

```typescript
interface DataStateProps {
  loading: boolean
  error: string | null
  isEmpty: boolean
}
```

Convention:
- **Loading**: Show `<LoadingSkeleton />` that matches the shape of the expected content.
- **Error**: Show `<ErrorState message={error} onRetry={refetch} />` inside the content area.
- **Empty**: Show `<EmptyState icon={...} title={...} description={...} action={...} />`.

The page itself orchestrates:

```tsx
{loading && <LoadingSkeleton variant="kanban" />}
{error && <ErrorState message={error} onRetry={fetchOpportunities} />}
{!loading && !error && opportunities.length === 0 && (
  <EmptyState
    icon={Kanban}
    title="No opportunities yet"
    description="Add your first opportunity to start building your pipeline."
    action={{ label: "Add Opportunity", onClick: openForm }}
  />
)}
{!loading && !error && opportunities.length > 0 && (
  <KanbanBoard opportunities={opportunities} ... />
)}
```

---

## 5. Component Hierarchy per Page

### 5.1 Dashboard Home (`/` -- `src/app/page.tsx`)

**Server component** (current). Fetches data on server, passes to client sub-components.

```
DashboardHome (server)
  |-- Header title="Dashboard"
  |-- PageContainer
  |     |-- div.grid.lg:grid-cols-4
  |     |     |-- MetricCard "Weekly Revenue" (server-compatible)
  |     |     |-- MetricCard "Active Pipeline" (server-compatible)
  |     |     |-- MetricCard "Proposal Win Rate" (server-compatible)
  |     |     |-- MetricCard "Avg Effective Rate" (server-compatible)
  |     |
  |     |-- div.grid.lg:grid-cols-3
  |     |     |-- RevenueChart (client -- Recharts)
  |     |     |     |-- ChartCard
  |     |     |     |-- DateRangePicker
  |     |     |     |-- BarChart (Recharts)
  |     |     |-- DailyTargets (server-compatible)
  |     |     |     |-- ProgressBar x2
  |     |
  |     |-- PipelineSnapshot (server-compatible)
  |           |-- stage count cards (one per stage)
```

**Data flow**: Server component fetches from Supabase server client. Passes
computed metrics as props. `RevenueChart` hydrates client-side for interactivity.

### 5.2 Revenue Dashboard (`/dashboard` -- `src/app/dashboard/page.tsx`)

**Convert to client component** to support date range filtering and chart interactions.

```
RevenueDashboard ("use client")
  |-- Header title="Revenue Dashboard"
  |-- PageContainer
  |     |-- DateRangePicker (controls all charts)
  |     |-- div.grid.md:grid-cols-2
  |     |     |-- ChartCard "Revenue by Platform"
  |     |     |     |-- PillarDistribution (donut) or stacked BarChart
  |     |     |-- ChartCard "Revenue by Service Pillar"
  |     |     |     |-- PillarDistribution (donut)
  |     |     |-- ChartCard "Effective Hourly Rate"
  |     |     |     |-- EffectiveRateChart (horizontal bar)
  |     |     |-- ChartCard "Monthly Revenue Trend"
  |     |           |-- RevenueTrendChart (area)
```

**Data flow**: `useRevenue` hook fetches entries. `useMemo` computes chart data
shapes from raw entries. `DateRangePicker` controls the date window.

### 5.3 Pipeline (`/pipeline` -- `src/app/pipeline/page.tsx`)

**Client component** (current).

```
PipelinePage ("use client")
  |-- Header title="Pipeline"
  |-- PageContainer
  |     |-- PipelineControls
  |     |     |-- ViewToggle [kanban | table]
  |     |     |-- PipelineFilters
  |     |     |     |-- PlatformFilterChips
  |     |     |     |-- PillarFilterChips
  |     |     |     |-- SearchFilter
  |     |     |-- Button "Add Opportunity" -> Dialog
  |     |
  |     |-- (if kanban view)
  |     |     |-- KanbanBoard
  |     |           |-- DndContext -> SortableContext per column
  |     |                 |-- KanbanColumn x8 (excluding "lost")
  |     |                 |     |-- KanbanColumnHeader
  |     |                 |     |-- SortableItem -> OpportunityCard (per opp)
  |     |                 |-- DragOverlay -> OpportunityCard clone
  |     |
  |     |-- (if table view)
  |     |     |-- PipelineTable
  |     |           |-- Table (shadcn)
  |     |                 |-- TableRow -> PlatformBadge, StatusBadge, currency, date
  |     |
  |     |-- OpportunityFormDialog (conditionally rendered)
  |           |-- Dialog -> DialogContent
  |                 |-- OpportunityForm (React Hook Form + Zod)
```

**Data flow**: `useOpportunities` hook is the single source of truth.
`useFilterParams` drives URL-based filtering. `useRealtimePipeline` triggers
re-fetches on DB changes from other tabs. Kanban drag-end calls
`updateStage()` which applies optimistic updates.

**Key interactions**:
- Drag card between columns -> stage update
- Click card -> navigate to `/pipeline/[id]`
- Click "Add Opportunity" -> open dialog with form
- Filter chips -> update URL params -> re-filter displayed data

### 5.4 Pipeline Detail (`/pipeline/[id]` -- `src/app/pipeline/[id]/page.tsx`)

**Convert to client component** for form editing.

```
OpportunityDetailPage ("use client")
  |-- Header title={opportunity.job_title}
  |-- PageContainer
  |     |-- div.grid.lg:grid-cols-3
  |     |     |-- div.lg:col-span-2
  |     |     |     |-- OpportunityForm (full form, pre-populated)
  |     |     |
  |     |     |-- div (sidebar panel)
  |     |           |-- StageProgressIndicator
  |     |           |     |-- vertical step list showing current stage
  |     |           |-- Card "Quick Actions"
  |     |           |     |-- Button "Send Proposal"
  |     |           |     |-- Button "Mark Won"
  |     |           |     |-- Button "Mark Lost"
  |     |           |-- Card "Activity Timeline"
  |     |                 |-- list of timestamps (proposal_sent_at, contracted_at, etc.)
```

### 5.5 Proposals (`/proposals` -- `src/app/proposals/page.tsx`)

**Client component** (current).

```
ProposalsPage ("use client")
  |-- Header title="Proposal Engine"
  |-- PageContainer
  |     |-- div.grid.lg:grid-cols-2
  |     |     |-- Card "Quick-Fire Mode"
  |     |     |     |-- QuickFirePanel
  |     |     |           |-- Textarea (job description paste)
  |     |     |           |-- Select (template picker)
  |     |     |           |-- Select (tone: professional/conversational/technical)
  |     |     |           |-- Button "Generate Proposal"
  |     |     |           |-- ProposalOutput
  |     |     |                 |-- generated text (streaming)
  |     |     |                 |-- Button "Copy to Clipboard"
  |     |     |                 |-- Button "Save to Opportunity"
  |     |     |
  |     |     |-- Card "Template Library"
  |     |           |-- SearchFilter
  |     |           |-- PillarFilterChips
  |     |           |-- TemplateList
  |     |                 |-- TemplateCard (per template)
  |     |                 |     |-- name, pillar badge, win rate, times used
  |     |                 |     |-- Button "Use" / "Edit"
  |     |                 |-- EmptyState (if no templates)
  |     |
  |     |-- ProposalStats (below the grid)
  |           |-- MetricCard "Proposals Sent Today"
  |           |-- MetricCard "This Week Win Rate"
  |           |-- MetricCard "Best Performing Template"
```

**Data flow**: `useProposals` for template list. AI generation calls a Supabase
Edge Function via `fetch()`. Streaming response updates local state character by
character. `incrementUsed` fires when a proposal is copied.

### 5.6 Gig Manager (`/gigs` -- `src/app/gigs/page.tsx`)

**Client component** (current).

```
GigsPage ("use client")
  |-- Header title="Gig Manager"
  |-- PageContainer
  |     |-- PillarFilterChips (existing)
  |     |-- div.flex.justify-between
  |     |     |-- SearchFilter
  |     |     |-- div.flex.gap-2
  |     |           |-- StatusFilterChips (draft/active/paused/archived)
  |     |           |-- Button "New Gig" -> Dialog
  |     |
  |     |-- div.grid.md:grid-cols-2.lg:grid-cols-3
  |     |     |-- GigCard (per gig)
  |     |     |     |-- gig title
  |     |     |     |-- PlatformBadge + PillarBadge
  |     |     |     |-- StatusBadge
  |     |     |     |-- pricing summary (Basic $X / Standard $X / Premium $X)
  |     |     |     |-- performance micro-stats (impressions, clicks, orders)
  |     |     |     |-- Button "Edit" / "Duplicate"
  |     |     |-- EmptyState (if no gigs)
  |     |
  |     |-- GigFormDialog
  |           |-- Dialog -> DialogContent (max-w-2xl for wider form)
  |                 |-- GigForm
  |                       |-- FormSection "Details"
  |                       |     |-- title, description, platform, pillar, tags, URL
  |                       |-- FormSection "Pricing"
  |                       |     |-- PricingTierEditor
  |                       |-- FormActions
```

### 5.7 Gig Detail (`/gigs/[id]` -- `src/app/gigs/[id]/page.tsx`)

```
GigDetailPage ("use client")
  |-- Header title={gig.title}
  |-- PageContainer
  |     |-- div.grid.lg:grid-cols-3
  |     |     |-- div.lg:col-span-2
  |     |     |     |-- GigForm (pre-populated, edit mode)
  |     |     |
  |     |     |-- div (sidebar)
  |     |           |-- Card "Performance"
  |     |           |     |-- impressions, clicks, orders, conversion_rate, revenue_total
  |     |           |-- Card "Version History"
  |     |           |     |-- GigVersionList
  |     |           |           |-- GigVersionItem (per version)
  |     |           |                 |-- version_number, change_notes, created_at
  |     |           |                 |-- Button "Restore"
  |     |           |-- Card "Actions"
  |     |                 |-- Button "Duplicate to Platform"
  |     |                 |-- Button "Archive"
```

### 5.8 Projects (`/projects` -- `src/app/projects/page.tsx`)

**Server component** (current -- convert to client for interactivity).

```
ProjectsPage ("use client")
  |-- Header title="Active Projects"
  |-- PageContainer
  |     |-- div.grid.md:grid-cols-4 (status summary, existing)
  |     |     |-- MetricCard "Active"
  |     |     |-- MetricCard "Due This Week"
  |     |     |-- MetricCard "Completed"
  |     |     |-- MetricCard "Hours Logged"
  |     |
  |     |-- div.flex.justify-between
  |     |     |-- StatusFilterChips
  |     |     |-- Button "New Project" -> Dialog
  |     |
  |     |-- div.space-y-4
  |     |     |-- ProjectCard (per project)
  |     |     |     |-- title, status badge
  |     |     |     |-- progress bar (checklist completion %)
  |     |     |     |-- deadline (relative date, colored if overdue)
  |     |     |     |-- hours logged / estimated
  |     |     |     |-- milestone count (completed/total)
  |     |     |-- EmptyState (if no projects)
```

### 5.9 Project Detail (`/projects/[id]` -- `src/app/projects/[id]/page.tsx`)

```
ProjectDetailPage ("use client")
  |-- Header title={project.title}
  |-- PageContainer
  |     |-- Tabs
  |     |     |-- TabsTrigger "Overview"
  |     |     |-- TabsTrigger "Milestones"
  |     |     |-- TabsTrigger "Checklist"
  |     |     |-- TabsTrigger "Time Log"
  |     |
  |     |-- TabsContent "Overview"
  |     |     |-- ProjectForm (status, dates, linked opportunity)
  |     |     |-- EffectiveRateDisplay (contract_value / logged hours)
  |     |
  |     |-- TabsContent "Milestones"
  |     |     |-- MilestoneList
  |     |           |-- MilestoneItem (title, due date, completed checkbox)
  |     |           |-- Button "Add Milestone"
  |     |
  |     |-- TabsContent "Checklist"
  |     |     |-- DeliveryChecklist
  |     |           |-- ChecklistItem (text, completed checkbox)
  |     |           |-- Button "Add Item"
  |     |
  |     |-- TabsContent "Time Log"
  |           |-- TimeTracker
  |                 |-- TimeEntryRow (date, hours, description)
  |                 |-- Button "Log Time"
  |                 |-- summary: total hours, effective rate
```

### 5.10 Analytics (`/analytics` -- `src/app/analytics/page.tsx`)

**Convert to client component** for chart interactions and date range filtering.

```
AnalyticsPage ("use client")
  |-- Header title="Analytics & Optimizer"
  |-- PageContainer
  |     |-- DateRangePicker (global for page)
  |     |
  |     |-- div.grid.md:grid-cols-4 (top metrics, existing)
  |     |     |-- MetricCard "Total Revenue (90d)"
  |     |     |-- MetricCard "Best Platform"
  |     |     |-- MetricCard "Top Gig"
  |     |     |-- MetricCard "Recommendations"
  |     |
  |     |-- div.grid.md:grid-cols-2
  |     |     |-- ChartCard "Proposal Win Rate by Platform"
  |     |     |     |-- WinRateChart (line)
  |     |     |-- ChartCard "Effective Hourly Rate Trend"
  |     |     |     |-- EffectiveRateChart (horizontal bar)
  |     |     |-- ChartCard "Revenue by Pillar"
  |     |     |     |-- PillarDistribution (donut)
  |     |     |-- ChartCard "Platform Comparison"
  |     |           |-- PlatformComparisonChart (grouped bar)
  |     |
  |     |-- Card "Optimization Recommendations"
  |           |-- RecommendationList
  |                 |-- RecommendationCard (per recommendation)
  |                       |-- icon, title, description, impact estimate
  |                       |-- Button "Dismiss" / "Act on this"
```

### 5.11 Portfolio (`/portfolio` -- `src/app/portfolio/page.tsx`)

**Server component** (current). Add client sub-components for CRUD dialogs.

```
PortfolioPage (server -- wraps client sections)
  |-- Header title="Portfolio & Content Library"
  |-- PageContainer
  |     |-- div.grid.lg:grid-cols-2
  |     |     |-- CaseStudySection (client)
  |     |     |     |-- Card header + "Add" button -> Dialog
  |     |     |     |-- CaseStudyCard (per item)
  |     |     |     |     |-- title, client, pillar badge
  |     |     |     |     |-- truncated results_description
  |     |     |     |-- EmptyState
  |     |     |
  |     |     |-- ContentBlockSection (client)
  |     |     |     |-- Card header + "Add" button -> Dialog
  |     |     |     |-- CategoryTabs (headline/overview/case_study/faq/skill_description/testimonial)
  |     |     |     |-- ContentBlockCard (per block)
  |     |     |     |-- EmptyState
  |     |     |
  |     |     |-- TestimonialSection (client)
  |     |     |-- ImageAssetSection (client, Phase 5)
```

### 5.12 Settings (`/settings` -- `src/app/settings/page.tsx`)

**Convert to client component** for form interactions.

```
SettingsPage ("use client")
  |-- Header title="Settings"
  |-- PageContainer
  |     |-- Card "Platform Profiles"
  |     |     |-- PlatformProfileList
  |     |           |-- PlatformProfileRow (per platform)
  |     |                 |-- platform name, StatusBadge
  |     |                 |-- Button "Edit" -> Sheet (side drawer)
  |     |                       |-- PlatformProfileForm
  |     |                             |-- headline, overview, hourly_rate, skills_tags, profile_url
  |     |
  |     |-- Card "Preferences"
  |           |-- PreferencesForm
  |                 |-- daily proposal target (number input)
  |                 |-- daily gig update target (number input)
  |                 |-- default contract type (select)
  |                 |-- FormActions
```

---

## 6. Mobile Responsive Strategy

### 6.1 Breakpoints (Tailwind defaults)

| Breakpoint | Min width | Usage |
|------------|-----------|-------|
| `sm` | 640px | Single-column adjustments |
| `md` | 768px | 2-column grids, table shows |
| `lg` | 1024px | 3-4 column grids, full sidebar |
| `xl` | 1280px | Max content width considerations |

### 6.2 Sidebar Behavior

**Desktop (lg+):** Fixed sidebar, 256px wide, collapsible to 64px (icon-only).
Controlled by `collapsed` state persisted in `localStorage`.

**Tablet (md to lg):** Sidebar auto-collapses to icon-only mode.

**Mobile (< md):** Sidebar is hidden by default. Accessible via a hamburger
menu button in the Header. Opens as a `Sheet` (side drawer) overlay that
slides in from the left. Clicking a nav link closes the sheet.

Implementation changes to `layout.tsx` and `Sidebar.tsx`:

```typescript
// layout.tsx -- add MobileSidebarProvider
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <MobileSidebarProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Desktop sidebar -- hidden on mobile */}
            <div className="hidden md:block">
              <Sidebar />
            </div>
            <main className="flex flex-1 flex-col overflow-hidden">
              {children}
            </main>
          </div>
          {/* Mobile sidebar -- Sheet overlay */}
          <MobileSidebar />
        </MobileSidebarProvider>
      </body>
    </html>
  )
}
```

```typescript
// Header.tsx -- add hamburger on mobile
interface HeaderProps {
  title: string
  description?: string
}

export function Header({ title, description }: HeaderProps) {
  const { open: openMobileSidebar } = useMobileSidebar()

  return (
    <header className="...">
      <button
        className="mr-3 md:hidden"
        onClick={openMobileSidebar}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>
      {/* existing title + description */}
    </header>
  )
}
```

### 6.3 Kanban on Mobile

On screens < 768px (below `md`), the Kanban switches to a **single-column
stacked view** with a stage selector dropdown at the top. The user selects a
stage from the dropdown, and sees only that stage's cards in a vertical list.

Drag-and-drop is still functional via `TouchSensor` with the 250ms hold
activation delay. Cards can be dragged up/down to reorder within the visible
stage. Cross-stage movement uses a "Move to..." action menu on each card
instead of column-to-column dragging (which is awkward on narrow screens).

```tsx
// In KanbanBoard.tsx
const isMobile = useMediaQuery("(max-width: 767px)")

{isMobile ? (
  <MobileKanbanView
    stages={stages}
    selectedStage={mobileStage}
    onStageChange={setMobileStage}
    opportunities={columns[mobileStage]}
    onMoveToStage={handleMoveToStage}
  />
) : (
  <DesktopKanbanView ... />
)}
```

```typescript
// src/lib/hooks/useMediaQuery.ts
"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches)
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [query])

  return matches
}
```

### 6.4 Forms on Mobile

- All form dialogs switch to **full-screen sheets** on mobile (< `md`). The
  `DialogContent` component detects viewport width and applies
  `className="h-full w-full max-w-full rounded-none"` on mobile.

- `FormSection` components are fully stacked (single column).

- `PricingTierEditor` switches from 3-column grid to a stacked vertical layout
  with tier tabs (Basic / Standard / Premium) instead of side-by-side columns.

- Textarea and text inputs use `min-h-[44px]` for comfortable touch targets
  (Apple's 44pt minimum).

### 6.5 Charts on Mobile

- All charts use `<ResponsiveContainer width="100%" height={...}>` and resize
  automatically.
- On mobile, chart heights reduce from 250px to 200px.
- `PillarDistribution` donut chart reduces `innerRadius` and `outerRadius`.
- Legend moves from inline to below the chart.
- Bar charts with many items switch to horizontal scrolling or reduce to top-5.
- `ChartCard` stacks action elements (date picker) below the title on mobile.

### 6.6 Responsive Grid Summary

| Component | Desktop (lg+) | Tablet (md) | Mobile (< md) |
|-----------|---------------|-------------|----------------|
| Sidebar | 256px / 64px collapsible | 64px icon-only | Sheet overlay |
| Metric cards | 4 columns | 2 columns | 1 column (2 on wider phones) |
| Kanban | Horizontal scroll, all columns | Horizontal scroll | Stage dropdown + single column |
| Charts grid | 2 columns | 2 columns | 1 column |
| Gig grid | 3 columns | 2 columns | 1 column |
| Forms | 2-column sections | 2-column sections | Single column |
| Pipeline table | Full table | Horizontal scroll | Card list (no table) |

---

## 7. Missing Shared Components

These components are referenced throughout the architecture but do not yet
exist in the codebase. All should live in `src/components/shared/`.

### 7.1 EmptyState

Displayed when a data list has zero items after loading completes.

```typescript
// src/components/shared/EmptyState.tsx

import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: "default" | "outline" | "secondary"
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: EmptyStateAction
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center",
        className
      )}
    >
      <Icon className="h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant={action.variant ?? "default"}
          size="sm"
          className="mt-4"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

### 7.2 ConfirmDialog

Used for destructive actions: deleting gigs, archiving opportunities, removing
templates.

```typescript
// src/components/shared/ConfirmDialog.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "destructive" | "default"
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={async () => {
              await onConfirm()
              onOpenChange(false)
            }}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### 7.3 LoadingSkeleton

Provides content-shaped loading placeholders. Supports variants that match
the layout of different page sections.

```typescript
// src/components/shared/LoadingSkeleton.tsx

import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
    />
  )
}

type SkeletonVariant =
  | "card"          // single card placeholder
  | "metric-row"   // row of 4 metric cards
  | "kanban"        // kanban column headers + card placeholders
  | "table"         // table header + row placeholders
  | "chart"         // chart card with rectangular placeholder
  | "form"          // form field placeholders

interface LoadingSkeletonProps {
  variant: SkeletonVariant
  count?: number       // number of items for list-based variants
  className?: string
}

export function LoadingSkeleton({
  variant,
  count = 3,
  className,
}: LoadingSkeletonProps) {
  switch (variant) {
    case "metric-row":
      return (
        <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-16" />
              <Skeleton className="mt-2 h-3 w-20" />
            </div>
          ))}
        </div>
      )

    case "kanban":
      return (
        <div className={cn("flex gap-4 overflow-x-auto pb-4", className)}>
          {Array.from({ length: 5 }).map((_, col) => (
            <div key={col} className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-2 p-2">
                {Array.from({ length: count }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )

    case "table":
      return (
        <div className={cn("rounded-lg border border-border", className)}>
          <div className="border-b border-border px-4 py-3">
            <div className="flex gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-20" />
              ))}
            </div>
          </div>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="border-b border-border px-4 py-4 last:border-0">
              <div className="flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      )

    case "chart":
      return (
        <div className={cn("rounded-lg border border-border bg-card p-6", className)}>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-48 w-full" />
        </div>
      )

    case "card":
      return (
        <div className={cn("rounded-lg border border-border bg-card p-6", className)}>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-3/4" />
          <Skeleton className="mt-4 h-8 w-24" />
        </div>
      )

    case "form":
      return (
        <div className={cn("space-y-6", className)}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      )

    default:
      return <Skeleton className={cn("h-32 w-full", className)} />
  }
}
```

### 7.4 ErrorBoundary

Catches React rendering errors and displays a recovery UI.

```typescript
// src/components/shared/ErrorBoundary.tsx
"use client"

import React from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-12 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">
            Something went wrong
          </h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
```

Additionally, an `ErrorState` component for inline (non-boundary) error display:

```typescript
// src/components/shared/ErrorState.tsx
"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center",
        className
      )}
    >
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}
```

### 7.5 Toast System

A lightweight toast notification system using React context. Toasts appear
in the bottom-right corner of the viewport.

```typescript
// src/components/shared/toast/
//   ToastProvider.tsx    # Context provider + toast container
//   Toast.tsx            # Individual toast component
//   useToast.ts          # Hook to trigger toasts
//   index.ts             # Barrel exports

// ---------- Types ----------

type ToastVariant = "default" | "success" | "error" | "warning"

interface ToastData {
  id: string
  title: string
  description?: string
  variant: ToastVariant
  duration?: number      // ms, default 5000
}

interface ToastContextValue {
  toasts: ToastData[]
  addToast: (toast: Omit<ToastData, "id">) => void
  removeToast: (id: string) => void
}

// ---------- useToast hook ----------

// src/components/shared/toast/useToast.ts
"use client"

import { useContext } from "react"
import { ToastContext } from "./ToastProvider"

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }

  return {
    toast: context.addToast,
    dismiss: context.removeToast,
  }
}

// ---------- Usage ----------

const { toast } = useToast()

// Success toast after saving
toast({
  title: "Opportunity created",
  description: "Added to the Discovered stage.",
  variant: "success",
})

// Error toast on failure
toast({
  title: "Failed to update stage",
  description: error.message,
  variant: "error",
  duration: 8000,
})
```

```typescript
// ---------- Toast component ----------

// src/components/shared/toast/Toast.tsx

interface ToastProps {
  data: ToastData
  onDismiss: (id: string) => void
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: "border-border bg-card text-foreground",
  success: "border-pillar-architecture/30 bg-pillar-architecture/10 text-pillar-architecture",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  warning: "border-pillar-webdev/30 bg-pillar-webdev/10 text-pillar-webdev",
}

export function Toast({ data, onDismiss }: ToastProps) {
  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(data.id), data.duration ?? 5000)
    return () => clearTimeout(timer)
  }, [data.id, data.duration, onDismiss])

  return (
    <div
      className={cn(
        "pointer-events-auto w-80 rounded-lg border p-4 shadow-lg",
        "animate-in slide-in-from-bottom-5 fade-in duration-200",
        VARIANT_STYLES[data.variant]
      )}
      role="alert"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">{data.title}</p>
          {data.description && (
            <p className="mt-1 text-xs opacity-80">{data.description}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(data.id)}
          className="ml-3 opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
```

```typescript
// ---------- ToastProvider ----------

// src/components/shared/toast/ToastProvider.tsx
"use client"

import React, { createContext, useState, useCallback } from "react"
import { Toast } from "./Toast"

export const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback((toast: Omit<ToastData, "id">) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast viewport -- fixed to bottom-right */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} data={t} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
```

The `ToastProvider` must wrap the app in `layout.tsx`:

```tsx
// layout.tsx
import { ToastProvider } from "@/components/shared/toast"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <ToastProvider>
          {/* existing layout */}
        </ToastProvider>
      </body>
    </html>
  )
}
```

### 7.6 Updated Shared Component Index

After implementing all missing shared components, the barrel export becomes:

```typescript
// src/components/shared/index.ts
export { PlatformBadge } from "./PlatformBadge"
export { PillarBadge } from "./PillarBadge"
export { StatusBadge } from "./StatusBadge"
export { DateRangePicker } from "./DateRangePicker"
export { SearchFilter } from "./SearchFilter"
export { EmptyState } from "./EmptyState"
export { ConfirmDialog } from "./ConfirmDialog"
export { LoadingSkeleton, Skeleton } from "./LoadingSkeleton"
export { ErrorBoundary } from "./ErrorBoundary"
export { ErrorState } from "./ErrorState"
export { ToastProvider, useToast } from "./toast"
```

---

## Appendix A: New File Inventory

Complete list of files to be created across Phases 2-4:

```
# Schemas
src/lib/schemas/shared.ts
src/lib/schemas/opportunity.ts
src/lib/schemas/gig.ts
src/lib/schemas/proposal.ts
src/lib/schemas/revenue.ts
src/lib/schemas/project.ts
src/lib/schemas/portfolio.ts
src/lib/schemas/content-block.ts
src/lib/schemas/index.ts

# Chart utilities
src/lib/utils/chart-colors.ts

# Hooks
src/lib/hooks/useFilterParams.ts
src/lib/hooks/useRealtimePipeline.ts
src/lib/hooks/useMediaQuery.ts

# Forms
src/components/forms/FormField.tsx
src/components/forms/FormSection.tsx
src/components/forms/FormActions.tsx
src/components/forms/index.ts

# Pipeline components
src/components/pipeline/KanbanBoard.tsx
src/components/pipeline/KanbanColumn.tsx
src/components/pipeline/KanbanColumnHeader.tsx
src/components/pipeline/OpportunityCard.tsx
src/components/pipeline/SortableItem.tsx
src/components/pipeline/PipelineControls.tsx
src/components/pipeline/PipelineFilters.tsx
src/components/pipeline/PipelineTable.tsx
src/components/pipeline/OpportunityForm.tsx
src/components/pipeline/StageProgressIndicator.tsx
src/components/pipeline/index.ts

# Proposal components
src/components/proposals/QuickFirePanel.tsx
src/components/proposals/ProposalOutput.tsx
src/components/proposals/TemplateCard.tsx
src/components/proposals/TemplateList.tsx
src/components/proposals/TemplateForm.tsx
src/components/proposals/index.ts

# Gig components
src/components/gigs/GigCard.tsx
src/components/gigs/GigForm.tsx
src/components/gigs/PricingTierEditor.tsx
src/components/gigs/GigVersionList.tsx
src/components/gigs/GigVersionItem.tsx
src/components/gigs/index.ts

# Project components
src/components/projects/ProjectCard.tsx
src/components/projects/ProjectForm.tsx
src/components/projects/MilestoneList.tsx
src/components/projects/MilestoneItem.tsx
src/components/projects/DeliveryChecklist.tsx
src/components/projects/ChecklistItem.tsx
src/components/projects/TimeTracker.tsx
src/components/projects/TimeEntryRow.tsx
src/components/projects/index.ts

# Analytics components
src/components/analytics/WinRateChart.tsx
src/components/analytics/PillarDistribution.tsx
src/components/analytics/EffectiveRateChart.tsx
src/components/analytics/RevenueTrendChart.tsx
src/components/analytics/PlatformComparisonChart.tsx
src/components/analytics/RecommendationCard.tsx
src/components/analytics/ChartCard.tsx
src/components/analytics/index.ts

# Shared components (missing)
src/components/shared/EmptyState.tsx
src/components/shared/ConfirmDialog.tsx
src/components/shared/LoadingSkeleton.tsx
src/components/shared/ErrorBoundary.tsx
src/components/shared/ErrorState.tsx
src/components/shared/toast/ToastProvider.tsx
src/components/shared/toast/Toast.tsx
src/components/shared/toast/useToast.ts
src/components/shared/toast/index.ts

# Layout additions
src/components/layout/MobileSidebar.tsx
src/components/layout/MobileSidebarProvider.tsx
```

**Total new files:** ~65 component/hook/schema files across Phases 2-4.

---

## Appendix B: Implementation Priority Order

1. **Shared infrastructure first**: schemas, form components, EmptyState, LoadingSkeleton, ErrorBoundary, Toast system, useFilterParams, useMediaQuery.
2. **Pipeline (Phase 2)**: KanbanBoard + OpportunityCard + OpportunityForm + PipelineTable. This is the most-used view.
3. **Gig Manager (Phase 3a)**: GigCard + GigForm + PricingTierEditor.
4. **Proposals (Phase 3b)**: QuickFirePanel + TemplateCard + TemplateForm.
5. **Charts (Phase 4a)**: RevenueChart (real), WinRateChart, PillarDistribution, EffectiveRateChart.
6. **Projects (Phase 4b)**: ProjectCard + ProjectForm + MilestoneList + TimeTracker.
7. **Mobile polish (Phase 5)**: MobileSidebar, mobile Kanban view, responsive chart adjustments.
