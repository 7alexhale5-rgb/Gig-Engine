/**
 * Auth layout — renders full-screen over the root layout's sidebar.
 * Uses fixed positioning to cover the entire viewport.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background">
      {children}
    </div>
  )
}
