"use client"

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, X, Eye, EyeOff, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { SERVICE_PILLARS } from "@/lib/utils/constants"
import { SEED_PLATFORMS } from "@/data/seed-platforms"
import { PillarBadge } from "@/components/shared/PillarBadge"

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const templateFormSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(200, "Name must be under 200 characters"),
  pillarName: z.string().optional(),
  platformName: z.string().optional(),
  templateText: z
    .string()
    .min(10, "Template text must be at least 10 characters")
    .max(10000, "Template text must be under 10,000 characters"),
  variables: z.array(z.string()),
  tags: z.array(z.string()),
})

type TemplateFormValues = z.infer<typeof templateFormSchema>

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TemplateFormData {
  name: string
  pillarName?: string
  platformName?: string
  templateText: string
  variables: string[]
  tags: string[]
}

export interface PlatformOption {
  id: string
  name: string
}

const DEFAULT_PLATFORMS: PlatformOption[] = SEED_PLATFORMS.map((p) => ({
  id: p.name,
  name: p.name,
}))

export interface TemplateFormProps {
  initialData?: TemplateFormData
  platforms?: PlatformOption[]
  onSubmit: (data: TemplateFormData) => void
  onCancel?: () => void
  isSubmitting?: boolean
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TemplateForm({
  initialData,
  platforms = DEFAULT_PLATFORMS,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className,
}: TemplateFormProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [newVariable, setNewVariable] = useState("")
  const [newTag, setNewTag] = useState("")

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      pillarName: initialData?.pillarName ?? "",
      platformName: initialData?.platformName ?? "",
      templateText: initialData?.templateText ?? "",
      variables: initialData?.variables ?? [],
      tags: initialData?.tags ?? [],
    },
  })

  const watchedVariables = watch("variables")
  const watchedTags = watch("tags")
  const watchedText = watch("templateText")
  const watchedPillar = watch("pillarName")

  // -- Variable management --

  const handleAddVariable = useCallback(() => {
    const trimmed = newVariable.trim().replace(/\s+/g, "_").toLowerCase()
    if (!trimmed) return
    if (watchedVariables.includes(trimmed)) return
    setValue("variables", [...watchedVariables, trimmed])
    setNewVariable("")
  }, [newVariable, watchedVariables, setValue])

  const handleRemoveVariable = useCallback(
    (variable: string) => {
      setValue(
        "variables",
        watchedVariables.filter((v) => v !== variable)
      )
    },
    [watchedVariables, setValue]
  )

  // -- Tag management --

  const handleAddTag = useCallback(() => {
    const trimmed = newTag.trim().toLowerCase()
    if (!trimmed) return
    if (watchedTags.includes(trimmed)) return
    setValue("tags", [...watchedTags, trimmed])
    setNewTag("")
  }, [newTag, watchedTags, setValue])

  const handleRemoveTag = useCallback(
    (tag: string) => {
      setValue(
        "tags",
        watchedTags.filter((t) => t !== tag)
      )
    },
    [watchedTags, setValue]
  )

  // -- Preview rendering --

  function renderPreview(text: string): string {
    let rendered = text
    for (const v of watchedVariables) {
      const regex = new RegExp(`\\{\\{${v}\\}\\}`, "g")
      rendered = rendered.replace(
        regex,
        `[${v.replace(/_/g, " ").toUpperCase()}]`
      )
    }
    return rendered
  }

  // -- Form submit --

  const onFormSubmit = useCallback(
    (values: TemplateFormValues) => {
      onSubmit({
        name: values.name,
        pillarName: values.pillarName || undefined,
        platformName: values.platformName || undefined,
        templateText: values.templateText,
        variables: values.variables,
        tags: values.tags,
      })
    },
    [onSubmit]
  )

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className={cn(
        "rounded-lg border border-border bg-card p-6",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {initialData ? "Edit Template" : "New Template"}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview((p) => !p)}
          className="gap-1.5 text-xs"
        >
          {showPreview ? (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              Edit
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              Preview
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="template-name">Name</Label>
          <Input
            id="template-name"
            {...register("name")}
            placeholder="e.g. n8n Automation Proposal"
          />
          {errors.name && (
            <p className="text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>

        {/* Pillar & Platform */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Service Pillar</Label>
            <Select
              value={watchedPillar ?? ""}
              onValueChange={(v) => setValue("pillarName", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pillar..." />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_PILLARS.map((pillar) => (
                  <SelectItem key={pillar.name} value={pillar.name}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: pillar.color }}
                      />
                      {pillar.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Platform</Label>
            <Select
              value={watch("platformName") ?? ""}
              onValueChange={(v) => setValue("platformName", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform..." />
              </SelectTrigger>
              <SelectContent>
                {(platforms ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Template Text / Preview Toggle */}
        <div className="space-y-1.5">
          <Label htmlFor="template-text">
            {showPreview ? "Preview" : "Template Text"}
          </Label>

          {showPreview ? (
            <div className="min-h-[200px] rounded-lg border border-border bg-background p-4">
              {watchedPillar && (
                <div className="mb-3">
                  <PillarBadge pillar={watchedPillar} />
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {renderPreview(watchedText)}
              </div>
            </div>
          ) : (
            <>
              <Textarea
                id="template-text"
                {...register("templateText")}
                placeholder="Write your proposal template here. Use {{variable_name}} for dynamic content..."
                rows={12}
                className="resize-y font-mono text-xs"
              />
              {errors.templateText && (
                <p className="text-xs text-red-400">
                  {errors.templateText.message}
                </p>
              )}
            </>
          )}
        </div>

        {/* Variables Editor */}
        <div className="space-y-1.5">
          <Label>Variables</Label>
          <div className="flex gap-2">
            <Input
              value={newVariable}
              onChange={(e) => setNewVariable(e.target.value)}
              placeholder="e.g. client_name"
              className="flex-1 font-mono text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddVariable()
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddVariable}
              disabled={!newVariable.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {watchedVariables.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {watchedVariables.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 font-mono text-[10px] text-zinc-400"
                >
                  {`{{${v}}}`}
                  <button
                    type="button"
                    onClick={() => handleRemoveVariable(v)}
                    className="ml-0.5 rounded-sm hover:text-red-400"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tags Input */}
        <div className="space-y-1.5">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="e.g. automation"
              className="flex-1 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTag}
              disabled={!newTag.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {watchedTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {watchedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 text-[10px]"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-0.5 rounded-sm hover:text-red-400"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} className="gap-1.5">
            <Save className="h-4 w-4" />
            {isSubmitting
              ? "Saving..."
              : initialData
                ? "Update Template"
                : "Create Template"}
          </Button>
        </div>
      </div>
    </form>
  )
}
