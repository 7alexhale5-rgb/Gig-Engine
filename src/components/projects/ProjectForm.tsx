"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { PROJECT_STATUSES } from "@/lib/utils/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Project, ProjectStatus } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------

const projectFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  status: z.enum(["active", "paused", "completed", "cancelled"] as const, {
    message: "Status is required",
  }),
  start_date: z.string().optional(),
  target_delivery_date: z.string().optional(),
  opportunity_id: z.string().uuid("Must be a valid UUID").optional().or(z.literal("")),
})

type ProjectFormValues = z.infer<typeof projectFormSchema>

// ---------------------------------------------------------------------------
// Status labels for display
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ProjectFormProps {
  initialData?: Partial<Project>
  onSubmit: (data: ProjectFormValues) => void
  onCancel: () => void
  className?: string
}

export function ProjectForm({
  initialData,
  onSubmit,
  onCancel,
  className,
}: ProjectFormProps) {
  const isEditing = !!initialData?.id

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      status: initialData?.status ?? "active",
      start_date: initialData?.start_date ?? "",
      target_delivery_date: initialData?.target_delivery_date ?? "",
      opportunity_id: initialData?.opportunity_id ?? "",
    },
  })

  const currentStatus = watch("status")

  const onFormSubmit = (data: ProjectFormValues) => {
    // Clean up empty optional strings
    const cleaned: ProjectFormValues = {
      ...data,
      start_date: data.start_date || undefined,
      target_delivery_date: data.target_delivery_date || undefined,
      opportunity_id: data.opportunity_id || undefined,
    }
    onSubmit(cleaned)
  }

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className={cn("space-y-5", className)}
    >
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="project-title">
          Title <span className="text-red-400">*</span>
        </Label>
        <Input
          id="project-title"
          {...register("title")}
          placeholder="Project title..."
          autoFocus
        />
        {errors.title && (
          <p className="text-xs text-red-400">{errors.title.message}</p>
        )}
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <Label htmlFor="project-status">
          Status <span className="text-red-400">*</span>
        </Label>
        <Select
          value={currentStatus}
          onValueChange={(val) =>
            setValue("status", val as ProjectStatus, { shouldValidate: true })
          }
        >
          <SelectTrigger id="project-status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {PROJECT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.status && (
          <p className="text-xs text-red-400">{errors.status.message}</p>
        )}
      </div>

      {/* Dates row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="project-start-date">Start Date</Label>
          <Input
            id="project-start-date"
            type="date"
            {...register("start_date")}
          />
          {errors.start_date && (
            <p className="text-xs text-red-400">{errors.start_date.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="project-target-date">Target Delivery Date</Label>
          <Input
            id="project-target-date"
            type="date"
            {...register("target_delivery_date")}
          />
          {errors.target_delivery_date && (
            <p className="text-xs text-red-400">
              {errors.target_delivery_date.message}
            </p>
          )}
        </div>
      </div>

      {/* Opportunity link (optional UUID) */}
      <div className="space-y-1.5">
        <Label htmlFor="project-opportunity">
          Linked Opportunity ID (optional)
        </Label>
        <Input
          id="project-opportunity"
          {...register("opportunity_id")}
          placeholder="UUID of linked opportunity..."
          className="font-mono text-xs"
        />
        {errors.opportunity_id && (
          <p className="text-xs text-red-400">
            {errors.opportunity_id.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save Changes"
              : "Create Project"}
        </Button>
      </div>
    </form>
  )
}

export { projectFormSchema }
export type { ProjectFormValues }
