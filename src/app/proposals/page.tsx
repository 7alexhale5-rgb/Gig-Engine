"use client"

import { Header } from "@/components/layout"
import { PageContainer } from "@/components/layout"
import { Zap, Copy, FileText } from "lucide-react"
import Link from "next/link"

export default function ProposalsPage() {
  return (
    <>
      <Header
        title="Proposal Engine"
        description="Generate, manage, and track proposals"
      />
      <PageContainer>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick-Fire Mode */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-pillar-automation" />
              <h2 className="text-base font-semibold">Quick-Fire Mode</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Paste a job description and generate a personalized proposal in seconds.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Job Description
                </label>
                <textarea
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={6}
                  placeholder="Paste the job posting here..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Template
                </label>
                <select className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option>Select a proposal template...</option>
                </select>
              </div>

              <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Zap className="h-4 w-4" />
                Generate Proposal
              </button>
            </div>

            {/* Generated Output */}
            <div className="mt-4 rounded-lg border border-dashed border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Generated Proposal
                </span>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <Copy className="h-3 w-3" />
                  Copy
                </button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Generated proposal will appear here...
              </p>
            </div>
          </div>

          {/* Template Library */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-pillar-ai" />
                <h2 className="text-base font-semibold">Template Library</h2>
              </div>
              <Link
                href="/proposals/templates"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View All
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                7 proposal templates ready. Connect Supabase to load them.
              </p>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  )
}
