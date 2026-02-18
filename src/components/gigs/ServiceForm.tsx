"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { PricingTierEditor } from "./PricingTierEditor"
import type { PricingTierValues } from "./PricingTierEditor"
import type { GigListing } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Client-side schema (same shape as server but does not validate pillar_id as
// UUID — select sends the raw ID string which may differ per environment)
// ---------------------------------------------------------------------------

const serviceFormSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or fewer"),
  pillar_id: z.string().min(1, "Service pillar is required"),
  description: z
    .string()
    .max(5000, "Description must be 5,000 characters or fewer")
    .optional()
    .or(z.literal("")),
  thumbnail_url: z
    .string()
    .url("Must be a valid image URL")
    .optional()
    .or(z.literal("")),
  contact_for_pricing: z.boolean().optional().default(false),
  // Pricing tiers — these are synced into the form state from PricingTierEditor
  pricing_basic: z.number().min(0).nullable().optional(),
  pricing_standard: z.number().min(0).nullable().optional(),
  pricing_premium: z.number().min(0).nullable().optional(),
  delivery_days_basic: z.number().int().min(1).nullable().optional(),
  delivery_days_standard: z.number().int().min(1).nullable().optional(),
  delivery_days_premium: z.number().int().min(1).nullable().optional(),
})

// zodResolver infers from the schema's INPUT type — z.input matches what hook-form expects.
// contact_for_pricing is optional on input (default fills it), but boolean on output.
type ServiceFormValues = z.input<typeof serviceFormSchema>

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PillarOption {
  id: string
  name: string
  color: string
}

interface ServiceFormProps {
  /** Pre-filled data when editing an existing service */
  initialData?: Partial<GigListing>
  /** Pillars available for the dropdown */
  pillars: PillarOption[]
  /** Server Action to call on submit */
  action: (formData: FormData) => Promise<void> | void
  /** Cancel destination — defaults to /dashboard/services */
  cancelHref?: string
}

// ---------------------------------------------------------------------------
// Helper: build form defaults from optional initialData
// ---------------------------------------------------------------------------

function toDefaultValues(data?: Partial<GigListing>): ServiceFormValues {
  return {
    title: data?.title ?? "",
    pillar_id: data?.pillar_id ?? "",
    description: data?.description ?? "",
    thumbnail_url: data?.thumbnail_url ?? "",
    contact_for_pricing: data?.contact_for_pricing ?? false,
    pricing_basic: data?.pricing_basic ?? null,
    pricing_standard: data?.pricing_standard ?? null,
    pricing_premium: data?.pricing_premium ?? null,
    delivery_days_basic: data?.delivery_days_basic ?? null,
    delivery_days_standard: data?.delivery_days_standard ?? null,
    delivery_days_premium: data?.delivery_days_premium ?? null,
  }
}

// ---------------------------------------------------------------------------
// Helper: build PricingTierValues from form values
// ---------------------------------------------------------------------------

function toPricingValues(values: ServiceFormValues): PricingTierValues {
  return {
    basic: {
      price: values.pricing_basic ?? null,
      deliveryDays: values.delivery_days_basic ?? null,
      description: "",
    },
    standard: {
      price: values.pricing_standard ?? null,
      deliveryDays: values.delivery_days_standard ?? null,
      description: "",
    },
    premium: {
      price: values.pricing_premium ?? null,
      deliveryDays: values.delivery_days_premium ?? null,
      description: "",
    },
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceForm({
  initialData,
  pillars,
  action,
  cancelHref = "/dashboard/services",
}: ServiceFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [thumbnailError, setThumbnailError] = useState(false)

  const isEditing = Boolean(initialData?.id)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: toDefaultValues(initialData),
  })

  const contactForPricing = watch("contact_for_pricing")
  const thumbnailUrl = watch("thumbnail_url")

  // ---- Pricing sync ----

  const currentPricing = toPricingValues({
    pricing_basic: watch("pricing_basic"),
    pricing_standard: watch("pricing_standard"),
    pricing_premium: watch("pricing_premium"),
    delivery_days_basic: watch("delivery_days_basic"),
    delivery_days_standard: watch("delivery_days_standard"),
    delivery_days_premium: watch("delivery_days_premium"),
  } as ServiceFormValues)

  const handlePricingChange = useCallback(
    (pricing: PricingTierValues) => {
      setValue("pricing_basic", pricing.basic.price, { shouldValidate: true })
      setValue("pricing_standard", pricing.standard.price, { shouldValidate: true })
      setValue("pricing_premium", pricing.premium.price, { shouldValidate: true })
      setValue("delivery_days_basic", pricing.basic.deliveryDays, { shouldValidate: true })
      setValue("delivery_days_standard", pricing.standard.deliveryDays, { shouldValidate: true })
      setValue("delivery_days_premium", pricing.premium.deliveryDays, { shouldValidate: true })
    },
    [setValue]
  )

  // ---- Submit: collect form values → build FormData → call Server Action ----

  const onFormSubmit = useCallback(
    async (values: ServiceFormValues) => {
      setSubmitting(true)
      try {
        const formData = new FormData()
        formData.set("title", values.title)
        formData.set("pillar_id", values.pillar_id)
        formData.set("description", values.description ?? "")
        formData.set("thumbnail_url", values.thumbnail_url ?? "")
        formData.set(
          "contact_for_pricing",
          values.contact_for_pricing ? "on" : ""
        )
        formData.set("status", "active")
        formData.set("gig_url", "")

        // Pricing — only send if contact_for_pricing is off
        if (!values.contact_for_pricing) {
          if (values.pricing_basic !== null && values.pricing_basic !== undefined) {
            formData.set("pricing_basic", String(values.pricing_basic))
          }
          if (values.pricing_standard !== null && values.pricing_standard !== undefined) {
            formData.set("pricing_standard", String(values.pricing_standard))
          }
          if (values.pricing_premium !== null && values.pricing_premium !== undefined) {
            formData.set("pricing_premium", String(values.pricing_premium))
          }
          if (values.delivery_days_basic !== null && values.delivery_days_basic !== undefined) {
            formData.set("delivery_days_basic", String(values.delivery_days_basic))
          }
          if (values.delivery_days_standard !== null && values.delivery_days_standard !== undefined) {
            formData.set("delivery_days_standard", String(values.delivery_days_standard))
          }
          if (values.delivery_days_premium !== null && values.delivery_days_premium !== undefined) {
            formData.set("delivery_days_premium", String(values.delivery_days_premium))
          }
        }

        await action(formData)
      } finally {
        setSubmitting(false)
      }
    },
    [action]
  )

  const showThumbnailPreview =
    !thumbnailError &&
    thumbnailUrl &&
    thumbnailUrl.length > 0 &&
    (thumbnailUrl.startsWith("http://") || thumbnailUrl.startsWith("https://"))

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
            placeholder="e.g. GoHighLevel CRM Setup & Automation"
            {...register("title")}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
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
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Select a pillar" />
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
          <Label htmlFor="description">Service Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your service — what's included, your process, and the value you deliver. Markdown is supported."
            className="min-h-[160px]"
            {...register("description")}
          />
          <p className="text-xs text-muted-foreground">
            Markdown is supported. Renders on your public catalog page.
          </p>
          {errors.description && (
            <p className="text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Section: Thumbnail                                                 */}
      {/* ----------------------------------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Thumbnail
        </h3>
        <Separator />

        <div className="space-y-1.5">
          <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
          <Input
            id="thumbnail_url"
            type="url"
            placeholder="https://example.com/image.png"
            {...register("thumbnail_url")}
            onChange={(e) => {
              setThumbnailError(false)
              register("thumbnail_url").onChange(e)
            }}
          />
          <p className="text-xs text-muted-foreground">
            Paste an image URL. Supports JPG, PNG, WebP.
          </p>
          {errors.thumbnail_url && (
            <p className="text-xs text-destructive">
              {errors.thumbnail_url.message}
            </p>
          )}
        </div>

        {/* Live preview */}
        {showThumbnailPreview && (
          <div className="relative max-w-xs overflow-hidden rounded-md border border-border bg-muted/30">
            {/* 16:9 aspect ratio box */}
            <div className="aspect-video w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailUrl}
                alt="Thumbnail preview"
                className="h-full w-full object-cover"
                onError={() => setThumbnailError(true)}
              />
            </div>
          </div>
        )}

        {thumbnailError && (
          <div className="flex max-w-xs items-center gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <ImageIcon className="h-4 w-4 shrink-0" />
            <span>Image could not be loaded. Check the URL and try again.</span>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Section: Pricing                                                   */}
      {/* ----------------------------------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Pricing &amp; Delivery
        </h3>
        <Separator />

        {/* Contact for pricing toggle */}
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <Controller
            control={control}
            name="contact_for_pricing"
            render={({ field }) => (
              <input
                id="contact_for_pricing"
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer rounded accent-primary"
              />
            )}
          />
          <div>
            <Label htmlFor="contact_for_pricing" className="cursor-pointer font-medium">
              Contact for pricing
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              When enabled, pricing fields are hidden and clients will be prompted to contact you for a quote.
            </p>
          </div>
        </div>

        {/* Pricing tiers — hidden when contact_for_pricing is on */}
        {!contactForPricing && (
          <PricingTierEditor
            value={currentPricing}
            onChange={handlePricingChange}
          />
        )}

        {contactForPricing && (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
            Clients will contact you for a quote. Pricing tiers are hidden on your public catalog.
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Form actions                                                       */}
      {/* ----------------------------------------------------------------- */}
      <Separator />
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(cancelHref)}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Service" : "Create Service"}
        </Button>
      </div>
    </form>
  )
}
