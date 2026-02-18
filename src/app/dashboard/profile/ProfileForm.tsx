"use client"

import { useState } from "react"
import { ExternalLink, CheckCircle2, AlertCircle, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { updateProfile } from "./actions"

interface ProfileFormProps {
  initialData: {
    display_name: string | null
    tagline: string | null
    bio: string | null
    avatar_url: string | null
    slug: string | null
  }
  saved?: boolean
  errorMessage?: string
}

export function ProfileForm({ initialData, saved, errorMessage }: ProfileFormProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatar_url ?? "")
  const [avatarError, setAvatarError] = useState(false)

  const initials = (initialData.display_name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Profile updated successfully.
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      <form action={updateProfile} className="space-y-6">
        {/* Avatar Preview + URL */}
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            {avatarUrl && !avatarError ? (
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="h-16 w-16 rounded-full object-cover border border-border"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent border border-border">
                {initials ? (
                  <span className="text-sm font-semibold text-accent-foreground">{initials}</span>
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input
              id="avatar_url"
              name="avatar_url"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              defaultValue={initialData.avatar_url ?? ""}
              onChange={(e) => {
                setAvatarUrl(e.target.value)
                setAvatarError(false)
              }}
            />
            <p className="text-xs text-muted-foreground">
              Enter a URL to a public image. Leave blank to use initials.
            </p>
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-1.5">
          <Label htmlFor="display_name">
            Display Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="display_name"
            name="display_name"
            placeholder="Your name or business name"
            defaultValue={initialData.display_name ?? ""}
            required
            maxLength={100}
          />
        </div>

        {/* Tagline */}
        <div className="space-y-1.5">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            name="tagline"
            placeholder="A short sentence describing what you do"
            defaultValue={initialData.tagline ?? ""}
            maxLength={200}
          />
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            placeholder="Tell clients about yourself..."
            defaultValue={initialData.bio ?? ""}
            maxLength={2000}
            className="min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground">Max 2000 characters.</p>
        </div>

        <Button type="submit">Save Profile</Button>
      </form>

      {/* Public Catalog Link */}
      {initialData.slug && (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Your public catalog:{" "}
            <a
              href={`/${initialData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-2 hover:text-primary"
            >
              /{initialData.slug}
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
