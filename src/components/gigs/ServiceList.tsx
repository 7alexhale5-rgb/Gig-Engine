"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  LayoutGrid,
  CheckCircle2,
  Circle,
  User,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { deleteService } from "@/app/dashboard/services/actions"
import type { GigListing, ServicePillar } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Tenant {
  display_name: string | null
  bio: string | null
  email_verified: boolean | null
  slug: string | null
}

interface ServiceListProps {
  services: (GigListing & {
    service_pillars?: Pick<ServicePillar, "id" | "name" | "color" | "sort_order"> | null
  })[]
  pillars: Pick<ServicePillar, "id" | "name" | "color" | "sort_order">[]
  tenant: Tenant
}

// ---------------------------------------------------------------------------
// Onboarding checklist step
// ---------------------------------------------------------------------------

function ChecklistStep({
  done,
  label,
  href,
  value,
}: {
  done: boolean
  label: string
  href?: string
  value?: string
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      {done ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
      ) : (
        <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/40" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              done ? "text-sm font-medium" : "text-sm font-medium text-muted-foreground"
            }
          >
            {label}
          </span>
          {!done && href && (
            <Link
              href={href}
              className="text-xs text-primary underline underline-offset-2 hover:no-underline"
            >
              Go →
            </Link>
          )}
        </div>
        {done && value && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{value}</p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Service card (simplified, dashboard-focused)
// ---------------------------------------------------------------------------

function ServiceCard({
  service,
  onDelete,
}: {
  service: GigListing & {
    service_pillars?: Pick<ServicePillar, "id" | "name" | "color" | "sort_order"> | null
  }
  onDelete: (id: string) => void
}) {
  const pillarColor = service.service_pillars?.color ?? "#6B7280"
  const pillarName = service.service_pillars?.name ?? "Uncategorized"

  const hasPricing =
    service.pricing_basic !== null ||
    service.pricing_standard !== null ||
    service.pricing_premium !== null

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-muted-foreground/30">
      {/* Pillar accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: pillarColor }} />

      <div className="p-5">
        {/* Thumbnail */}
        {service.thumbnail_url && (
          <div className="mb-4 aspect-video overflow-hidden rounded-md bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={service.thumbnail_url}
              alt={service.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = "none"
              }}
            />
          </div>
        )}

        {/* Title + pillar */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
          {service.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{pillarName}</p>

        {/* Pricing */}
        <div className="mt-3">
          {service.contact_for_pricing ? (
            <span className="text-xs text-muted-foreground">Contact for pricing</span>
          ) : hasPricing ? (
            <div className="flex flex-wrap gap-2">
              {service.pricing_basic !== null && (
                <span className="text-xs">
                  Basic{" "}
                  <strong className="text-foreground">
                    ${service.pricing_basic}
                  </strong>
                </span>
              )}
              {service.pricing_standard !== null && (
                <span className="text-xs">
                  Standard{" "}
                  <strong className="text-foreground">
                    ${service.pricing_standard}
                  </strong>
                </span>
              )}
              {service.pricing_premium !== null && (
                <span className="text-xs">
                  Premium{" "}
                  <strong className="text-foreground">
                    ${service.pricing_premium}
                  </strong>
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">No pricing set</span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Link href={`/dashboard/services/${service.id}/edit`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              Edit
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(service.id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ServiceList({ services, tenant }: ServiceListProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const profileDone = Boolean(tenant.display_name && tenant.bio)
  const servicesDone = services.length > 0
  const catalogUrl = tenant.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/${tenant.slug}`
    : null
  const shareDone = Boolean(tenant.email_verified && catalogUrl)

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteService(deleteId)
      router.refresh()
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {services.length === 0
              ? "Create your first service to get started"
              : `${services.length} service${services.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/dashboard/services/new">
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Service
          </Button>
        </Link>
      </div>

      {/* Empty state: onboarding checklist */}
      {services.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 px-6 py-8">
          <div className="mx-auto max-w-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
              <LayoutGrid className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-semibold">
              Set up your freelance catalog
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Complete these steps to launch your public service catalog.
            </p>

            <div className="mt-6 divide-y divide-border">
              <ChecklistStep
                done={profileDone}
                label="Complete your profile"
                href="/dashboard/profile"
              />
              <ChecklistStep
                done={servicesDone}
                label="Add your first service"
                href="/dashboard/services/new"
              />
              <ChecklistStep
                done={shareDone}
                label="Share your catalog link"
                value={catalogUrl ?? undefined}
              />
            </div>

            {!shareDone && tenant.email_verified === false && (
              <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-400">
                <User className="h-3.5 w-3.5" />
                <span>Verify your email to make your catalog public.</span>
              </div>
            )}

            {shareDone && catalogUrl && (
              <a
                href={catalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-2 hover:no-underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View your catalog
              </a>
            )}
          </div>
        </div>
      )}

      {/* Service card grid */}
      {services.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null)
        }}
        title="Delete service"
        description="This will permanently delete the service listing. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
