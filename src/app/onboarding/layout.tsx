/**
 * Onboarding layout — full-height centered layout.
 * Root layout no longer has a sidebar, so no overlay needed.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
