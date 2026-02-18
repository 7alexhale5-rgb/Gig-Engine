"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { updateSettings } from "./actions"

interface SettingsFormProps {
  email: string
  currentSlug: string
  displayName: string | null
  saved?: boolean
  errorMessage?: string
}

export function SettingsForm({
  email,
  currentSlug,
  saved,
  errorMessage,
}: SettingsFormProps) {
  const [slug, setSlug] = useState(currentSlug)
  const slugChanged = slug !== currentSlug

  const catalogUrl = `gig-engine.vercel.app/${slug}`

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Success Banner */}
      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Settings saved successfully.
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Account Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              readOnly
              className="bg-muted text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              To change your email, contact support.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Catalog URL Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catalog URL</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateSettings} className="space-y-4">
            {/* URL Preview */}
            <div className="rounded-md bg-muted px-3 py-2">
              <p className="text-xs text-muted-foreground">Your catalog URL</p>
              <p className="mt-0.5 font-mono text-sm text-foreground break-all">
                {catalogUrl}
              </p>
            </div>

            {/* Slug field */}
            <div className="space-y-1.5">
              <Label htmlFor="slug">Catalog slug</Label>
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="your-slug"
                minLength={3}
                maxLength={50}
                pattern="^[a-z0-9-]+$"
                required
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only. Min 3 characters.
              </p>
            </div>

            {/* Warning when slug is being changed */}
            {slugChanged && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Changing your slug will break existing links</p>
                  <p className="mt-0.5">
                    Anyone with the old URL will see a 404 page. Make sure to update any links you&apos;ve shared.
                  </p>
                </div>
              </div>
            )}

            <Button type="submit">Save Settings</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
