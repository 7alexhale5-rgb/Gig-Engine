import type { Metadata } from "next"
import "./globals.css"

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
        {children}
      </body>
    </html>
  )
}
