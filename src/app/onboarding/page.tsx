"use client"

import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { generateSlug } from "@/lib/utils/slug"
import { checkSlugAvailability, completeOnboarding } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const onboardingSchema = z.object({
  display_name: z
    .string()
    .min(2, "Display name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(30, "Slug must be 30 characters or less")
    .regex(/^[a-z0-9]+$/, "Slug can only contain lowercase letters and numbers"),
  tagline: z.string().optional(),
  avatar_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
})

type OnboardingFormValues = z.infer<typeof onboardingSchema>

type SlugStatus = "idle" | "checking" | "available" | "taken"

const BASE_URL = "gig-engine.vercel.app"

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")

  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const nameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      display_name: "",
      slug: "",
      tagline: "",
      avatar_url: "",
    },
  })

  const slugValue = watch("slug")
  const displayNameValue = watch("display_name")

  // Guard: redirect if not authenticated or already onboarded
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login")
        return
      }
      if (user.user_metadata?.onboarding_complete) {
        router.push("/dashboard")
      }
    })
  }, [router])

  // Auto-generate slug from display name (debounced 300ms)
  useEffect(() => {
    if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current)

    if (!displayNameValue) return

    nameDebounceRef.current = setTimeout(() => {
      const generated = generateSlug(displayNameValue)
      if (generated) {
        setValue("slug", generated, { shouldValidate: true })
      }
    }, 300)

    return () => {
      if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current)
    }
  }, [displayNameValue, setValue])

  // Check slug availability (debounced 500ms)
  useEffect(() => {
    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current)

    if (!slugValue || slugValue.length < 2) {
      setSlugStatus("idle")
      return
    }

    // Only check if slug passes basic validation
    if (!/^[a-z0-9]+$/.test(slugValue)) {
      setSlugStatus("idle")
      return
    }

    setSlugStatus("checking")

    slugDebounceRef.current = setTimeout(async () => {
      try {
        const { available } = await checkSlugAvailability(slugValue)

        if (!available) {
          setSlugStatus("taken")
          // Auto-append incrementing number to find available slug
          let attempt = 1
          let foundSlug: string | null = null

          while (attempt <= 20) {
            const candidate = `${slugValue.replace(/\d+$/, "")}${attempt}`
            const { available: candidateAvailable } =
              await checkSlugAvailability(candidate)
            if (candidateAvailable) {
              foundSlug = candidate
              break
            }
            attempt++
          }

          if (foundSlug) {
            setValue("slug", foundSlug, { shouldValidate: true })
            setSlugStatus("available")
          }
        } else {
          setSlugStatus("available")
        }
      } catch {
        setSlugStatus("idle")
      }
    }, 500)

    return () => {
      if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current)
    }
  }, [slugValue, setValue])

  // Handle form submission via server action
  async function onSubmit(data: OnboardingFormValues) {
    setIsSubmitting(true)
    const formData = new FormData()
    formData.set("display_name", data.display_name)
    formData.set("slug", data.slug)
    formData.set("tagline", data.tagline ?? "")
    formData.set("avatar_url", data.avatar_url ?? "")
    await completeOnboarding(formData)
    // completeOnboarding redirects on completion; this line only runs on error paths
    setIsSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Claim your URL
          </h1>
          <p className="text-muted-foreground">
            Set up your public service catalog in seconds.
          </p>
        </div>

        {/* Error message from server */}
        {errorParam && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorParam === "slug_taken"
              ? "That slug is already taken — a new one has been suggested below."
              : decodeURIComponent(errorParam)}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Required fields */}
          <div className="space-y-5 rounded-lg border border-border bg-card p-6">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Required
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display_name">Your Name</Label>
              <Input
                id="display_name"
                placeholder="Alex Hale"
                {...register("display_name")}
              />
              {errors.display_name && (
                <p className="text-xs text-destructive">
                  {errors.display_name.message}
                </p>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="slug">Your URL Slug</Label>
                {slugStatus === "checking" && (
                  <span className="text-xs text-muted-foreground">
                    Checking...
                  </span>
                )}
                {slugStatus === "available" && (
                  <span className="text-xs font-medium text-green-500">
                    Available
                  </span>
                )}
                {slugStatus === "taken" && (
                  <span className="text-xs font-medium text-destructive">
                    Taken — finding alternative...
                  </span>
                )}
              </div>
              <Input
                id="slug"
                placeholder="alexhale"
                {...register("slug")}
              />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug.message}</p>
              )}

              {/* Live URL preview */}
              {slugValue && !errors.slug && (
                <div className="mt-2 flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    {BASE_URL}/
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {slugValue}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Optional fields */}
          <div className="space-y-5 rounded-lg border border-border/50 bg-card/50 p-6">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Optional
              </p>
              <p className="text-xs text-muted-foreground">
                You can add these later from your dashboard.
              </p>
            </div>

            {/* Tagline */}
            <div className="space-y-2">
              <Label htmlFor="tagline" className="text-muted-foreground">
                Tagline / Bio
              </Label>
              <Textarea
                id="tagline"
                placeholder="Automation expert helping teams save 10+ hours/week"
                rows={2}
                {...register("tagline")}
              />
            </div>

            {/* Avatar URL */}
            <div className="space-y-2">
              <Label htmlFor="avatar_url" className="text-muted-foreground">
                Profile Photo URL
              </Label>
              <Input
                id="avatar_url"
                type="url"
                placeholder="https://example.com/photo.jpg"
                {...register("avatar_url")}
              />
              {errors.avatar_url && (
                <p className="text-xs text-destructive">
                  {errors.avatar_url.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || slugStatus === "checking"}
          >
            {isSubmitting ? "Saving..." : "Claim Your Catalog"}
          </Button>
        </form>
      </div>
    </div>
  )
}
