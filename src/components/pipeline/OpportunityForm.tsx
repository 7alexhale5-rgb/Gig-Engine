"use client"

import * as React from "react"
import { useCallback } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  opportunitySchema,
  type OpportunityFormData,
} from "@/lib/schemas/opportunity"
import {
  OPPORTUNITY_STAGES,
  STAGE_LABELS,
  SERVICE_PILLARS,
} from "@/lib/utils/constants"
import { SEED_PLATFORMS } from "@/data/seed-platforms"
import type { Opportunity } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OpportunityFormProps {
  initialData?: Partial<Opportunity>
  onSubmit: (data: OpportunityFormData) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

// ---------------------------------------------------------------------------
// NativeSelect
// ---------------------------------------------------------------------------

const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </select>
))
NativeSelect.displayName = "NativeSelect"

// ---------------------------------------------------------------------------
// Form layout helpers
// ---------------------------------------------------------------------------

function FormSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold text-foreground">{title}</legend>
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        {children}
      </div>
    </fieldset>
  )
}

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

function FormField({ label, error, required, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className={cn(error && "text-destructive")}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OpportunityForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save Opportunity",
}: OpportunityFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(opportunitySchema) as Resolver<OpportunityFormData>,
    defaultValues: {
      platform_id: initialData?.platform_id ?? "",
      pillar_id: initialData?.pillar_id ?? "",
      gig_id: initialData?.gig_id ?? "",
      stage: initialData?.stage ?? "discovered",
      job_title: initialData?.job_title ?? "",
      job_url: initialData?.job_url ?? "",
      job_description: initialData?.job_description ?? "",
      client_name: initialData?.client_name ?? "",
      client_company: initialData?.client_company ?? "",
      client_location: initialData?.client_location ?? "",
      budget_min: initialData?.budget_min ?? undefined,
      budget_max: initialData?.budget_max ?? undefined,
      contract_type: initialData?.contract_type ?? "fixed",
      proposal_text: initialData?.proposal_text ?? "",
      proposal_template_id: initialData?.proposal_template_id ?? "",
      contract_value: initialData?.contract_value ?? undefined,
      estimated_hours: initialData?.estimated_hours ?? undefined,
      actual_hours: initialData?.actual_hours ?? undefined,
      delivery_deadline: initialData?.delivery_deadline ?? "",
      notes: initialData?.notes ?? "",
    } satisfies OpportunityFormData,
  })

  const onFormSubmit = useCallback(
    async (data: OpportunityFormData) => {
      await onSubmit(data)
    },
    [onSubmit]
  )

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="space-y-8"
      noValidate
    >
      {/* Basic Information */}
      <FormSection title="Basic Information">
        <FormField label="Job Title" error={errors.job_title?.message} required>
          <Input
            {...register("job_title")}
            placeholder="e.g. Build n8n automation workflow for CRM"
            autoFocus
          />
        </FormField>

        <FormField label="Job URL" error={errors.job_url?.message}>
          <Input
            {...register("job_url")}
            placeholder="https://www.upwork.com/jobs/..."
            type="url"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Platform"
            error={errors.platform_id?.message}
            required
          >
            <NativeSelect {...register("platform_id")} defaultValue="">
              <option value="" disabled>
                Select platform...
              </option>
              {SEED_PLATFORMS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>

          <FormField label="Service Pillar" error={errors.pillar_id?.message}>
            <NativeSelect {...register("pillar_id")} defaultValue="">
              <option value="">None</option>
              {SERVICE_PILLARS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        </div>

        <FormField label="Stage" error={errors.stage?.message}>
          <NativeSelect {...register("stage")}>
            {OPPORTUNITY_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <FormField
          label="Job Description"
          error={errors.job_description?.message}
        >
          <Textarea
            {...register("job_description")}
            placeholder="Paste the full job description here..."
            rows={5}
          />
        </FormField>
      </FormSection>

      {/* Client Information */}
      <FormSection title="Client Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Client Name" error={errors.client_name?.message}>
            <Input
              {...register("client_name")}
              placeholder="Client display name"
            />
          </FormField>

          <FormField label="Company" error={errors.client_company?.message}>
            <Input
              {...register("client_company")}
              placeholder="Company name"
            />
          </FormField>
        </div>

        <FormField label="Location" error={errors.client_location?.message}>
          <Input
            {...register("client_location")}
            placeholder="City, Country or timezone"
          />
        </FormField>
      </FormSection>

      {/* Budget & Contract */}
      <FormSection title="Budget & Contract">
        <FormField
          label="Contract Type"
          error={errors.contract_type?.message}
        >
          <NativeSelect {...register("contract_type")}>
            <option value="fixed">Fixed Price</option>
            <option value="hourly">Hourly</option>
          </NativeSelect>
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Budget Min ($)" error={errors.budget_min?.message}>
            <Input
              {...register("budget_min", { valueAsNumber: true })}
              type="number"
              min="0"
              step="1"
              placeholder="0"
            />
          </FormField>

          <FormField label="Budget Max ($)" error={errors.budget_max?.message}>
            <Input
              {...register("budget_max", { valueAsNumber: true })}
              type="number"
              min="0"
              step="1"
              placeholder="0"
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            label="Contract Value ($)"
            error={errors.contract_value?.message}
          >
            <Input
              {...register("contract_value", { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.01"
              placeholder="Agreed value"
            />
          </FormField>

          <FormField
            label="Estimated Hours"
            error={errors.estimated_hours?.message}
          >
            <Input
              {...register("estimated_hours", { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.5"
              placeholder="0"
            />
          </FormField>

          <FormField
            label="Actual Hours"
            error={errors.actual_hours?.message}
          >
            <Input
              {...register("actual_hours", { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.5"
              placeholder="0"
            />
          </FormField>
        </div>
      </FormSection>

      {/* Proposal */}
      <FormSection title="Proposal">
        <FormField
          label="Proposal Text"
          error={errors.proposal_text?.message}
        >
          <Textarea
            {...register("proposal_text")}
            placeholder="Your proposal text..."
            rows={6}
          />
        </FormField>
      </FormSection>

      {/* Dates & Notes */}
      <FormSection title="Dates & Notes">
        <FormField
          label="Delivery Deadline"
          error={errors.delivery_deadline?.message}
        >
          <Input {...register("delivery_deadline")} type="date" />
        </FormField>

        <FormField label="Notes" error={errors.notes?.message}>
          <Textarea
            {...register("notes")}
            placeholder="Internal notes about this opportunity..."
            rows={3}
          />
        </FormField>
      </FormSection>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
