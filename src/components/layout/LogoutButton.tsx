"use client"

import { logout } from "@/app/(auth)/login/actions"

export function LogoutButton() {
  return (
    <button
      onClick={() => logout()}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <span>Log out</span>
    </button>
  )
}
