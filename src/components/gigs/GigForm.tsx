"use client"

import { useState, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  PricingTierEditor,
  validatePricingTiers,
  type PricingTierValues,
} from "./PricingTierEditor"
import { GIG_STATUSES, SERVICE_PILLARS } from "@/lib/utils/constants"
import { SEED_PLATFORMS } from "@/data/seed-platforms"
import { cn } from "@/lib/utils"
import type { GigListing, GigStatus } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const gigFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  platform_id: z.string().min(1, "Platform is required"),
  pillar_id: z.string().min(1, "Service pillar is required"),
  status: z.enum(["draft", "active", "paused", "archived"] as const),
  gig_url: z.string().url("Must be a valid URL").or(z.literal("")),
  description: z.string().max(5000, "Description is too long"),
  tags: z.array(z.string()),
  pricing_basic: z.number().min(0).nullable(),
  pricing_standard: z.number().min(0).nullable(),
  pricing_premium: z.number().min(0).nullable(),
  delivery_days_basic: z.number().int().min(1).nullable(),
  delivery_days_standard: z.number().int().min(1).nullable(),
  delivery_days_premium: z.number().int().min(1).nullable(),
})

type GigFormValues = z.infer<typeof gigFormSchema>

// ---------------------------------------------------------------------------
// Platform option type (passed from parent)
// ---------------------------------------------------------------------------

export interface PlatformOption {
  id: string
  name: string
}

export interface PillarOption {
  id: string
  name: string
  color: string
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

// Default options derived from seed data (used until Supabase is connected)
const DEFAULT_PLATFORMS: PlatformOption[] = SEED_PLATFORMS.map((p) => ({
  id: p.name,
  name: p.name,
}))

const DEFAULT_PILLARS: PillarOption[] = SERVICE_PILLARS.map((p) => ({
  id: p.name,
  name: p.name,
  color: p.color,
}))

interface GigFormProps {
  initialData?: Partial<GigListing>
  platforms?: PlatformOption[]
  pillars?: PillarOption[]
  onSubmit: (data: GigFormValues) => Promise<void>
  onCancel: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toFormValues(data?: Partial<GigListing>): GigFormValues {
  return {
    title: data?.title ?? "",
    platform_id: data?.platform_id ?? "",
    pillar_id: data?.pillar_id ?? "",
    status: data?.status ?? "draft",
    gig_url: data?.gig_url ?? "",
    description: data?.description ?? "",
    tags: data?.tags ?? [],
    pricing_basic: data?.pricing_basic ?? null,
    pricing_standard: data?.pricing_standard ?? null,
    pricing_premium: data?.pricing_premium ?? null,
    delivery_days_basic: data?.delivery_days_basic ?? null,
    delivery_days_standard: data?.delivery_days_standard ?? null,
    delivery_days_premium: data?.delivery_days_premium ?? null,
  }
}

function toPricingValues(data: GigFormValues): PricingTierValues {
  return {
    basic: {
      price: data.pricing_basic,
      deliveryDays: data.delivery_days_basic,
      description: "",
    },
    standard: {
      price: data.pricing_standard,
      deliveryDays: data.delivery_days_standard,
      description: "",
    },
    premium: {
      price: data.pricing_premium,
      deliveryDays: data.delivery_days_premium,
      description: "",
    },
  }
}

// ---------------------------------------------------------------------------
// Status labels
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<GigStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  archived: "Archived",
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GigForm({
  initialData,
  platforms = DEFAULT_PLATFORMS,
  pillars = DEFAULT_PILLARS,
  onSubmit,
  onCancel,
}: GigFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [tagInput, setTagInput] = useState("")

  const isEditing = Boolean(initialData?.id)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GigFormValues>({
    resolver: zodResolver(gigFormSchema),
    defaultValues: toFormValues(initialData),
  })

  const tags = watch("tags")

  // ---- Tag management ----

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim().toLowerCase()
    if (!trimmed) return
    if (tags.includes(trimmed)) {
      setTagInput("")
      return
    }
    setValue("tags", [...tags, trimmed], { shouldValidate: true })
    setTagInput("")
  }, [tagInput, tags, setValue])

  const removeTag = useCallback(
    (tag: string) => {
      setValue(
        "tags",
        tags.filter((t) => t !== tag),
        { shouldValidate: true }
      )
    },
    [tags, setValue]
  )

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        addTag()
      }
      if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
        removeTag(tags[tags.length - 1])
      }
    },
    [addTag, tagInput, tags, removeTag]
  )

  // ---- Pricing sync ----

  const handlePricingChange = useCallback(
    (pricing: PricingTierValues) => {
      setValue("pricing_basic", pricing.basic.price, { shouldValidate: true })
      setValue("pricing_standard", pricing.standard.price, {
        shouldValidate: true,
      })
      setValue("pricing_premium", pricing.premium.price, {
        shouldValidate: true,
      })
      setValue("delivery_days_basic", pricing.basic.deliveryDays, {
        shouldValidate: true,
      })
      setValue("delivery_days_standard", pricing.standard.deliveryDays, {
        shouldValidate: true,
      })
      setValue("delivery_days_premium", pricing.premium.deliveryDays, {
        shouldValidate: true,
      })
    },
    [setValue]
  )

  // ---- Submit handler ----

  const onFormSubmit = useCallback(
    async (data: GigFormValues) => {
      // Validate pricing tier ordering
      const pricingTiers = toPricingValues(data)
      const pricingError = validatePricingTiers(pricingTiers)
      if (pricingError) {
        // Pricing validation is handled visually in PricingTierEditor
        // but also block submission
        return
      }

      setSubmitting(true)
      try {
        await onSubmit(data)
      } finally {
        setSubmitting(false)
      }
    },
    [onSubmit]
  )

  // ---- Current pricing values for the editor ----

  const currentPricing = toPricingValues({
    pricing_basic: watch("pricing_basic"),
    pricing_standard: watch("pricing_standard"),
    pricing_premium: watch("pricing_premium"),
    delivery_days_basic: watch("delivery_days_basic"),
    delivery_days_standard: watch("delivery_days_standard"),
    delivery_days_premium: watch("delivery_days_premium"),
  } as GigFormValues)

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
      {/* ----------------------------------------------------------------- */}
      {/* Section: Basic Info                                                */}
      {/* ----------------------------------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Basic Information
        </h3>
        <Separator />

        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="e.g. GoHighLevel Setup & Automation"
            {...register("title")}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* Platform & Pillar row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Platform */}
          <div className="space-y-1.5">
            <Label>
              Platform <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="platform_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.platform_id && (
              <p className="text-xs text-destructive">
                {errors.platform_id.message}
              </p>
            )}
          </div>

          {/* Pillar */}
          <div className="space-y-1.5">
            <Label>
              Service Pillar <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="pillar_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pillar" />
                  </SelectTrigger>
                  <SelectContent>
                    {pillars.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.pillar_id && (
              <p className="text-xs text-destructive">
                {errors.pillar_id.message}
              </p>
            )}
          </div>
        </div>

        {/* Status & URL row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {GIG_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Gig URL */}
          <div className="space-y-1.5">
            <Label htmlFor="gig_url">Gig URL</Label>
            <Input
              id="gig_url"
              type="url"
              placeholder="https://fiverr.com/..."
              {...register("gig_url")}
            />
            {errors.gig_url && (
              <p className="text-xs text-destructive">
                {errors.gig_url.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Section: Description                                               */}
      {/* ----------------------------------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Description
        </h3>
        <Separator />

        <div className="space-y-1.5">
          <Label htmlFor="description">Gig Description</Label>
          <Textarea
            id="description"
            placeholder="Detailed gig description including deliverables, process, and value proposition..."
            className="min-h-[160px]"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Section: Tags                                                      */}
      {/* ----------------------------------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Tags
        </h3>
        <Separator />

        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 pr-1 text-xs"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="max-w-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTag}
              disabled={!tagInput.trim()}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Press Enter to add. Backspace to remove last tag.
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Section: Pricing                                                   */}
      {/* ----------------------------------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Pricing & Delivery
        </h3>
        <Separator />

        <PricingTierEditor
          value={currentPricing}
          onChange={handlePricingChange}
        />
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Form actions                                                       */}
      {/* ----------------------------------------------------------------- */}
      <Separator />
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Gig" : "Create Gig"}
        </Button>
      </div>
    </form>
  )
}
