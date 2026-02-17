import type { Metadata } from "next"
import "./globals.css"
import { Sidebar } from "@/components/layout"

export const metadata: Metadata = {
  title: "PrettyFly Service Catalog",
  description: "31 freelance services across 5 pillars — Fiverr & Upwork",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
