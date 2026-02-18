/**
 * Auth layout — centered full-height layout for login/signup pages.
 * Root layout no longer has a sidebar, so no overlay needed.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
