"use client"

import { useState } from "react"
import { Header, PageContainer } from "@/components/layout"
import { EmptyState } from "@/components/shared"
import { Briefcase, Plus, FileText, Image, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function PortfolioPage() {
  return (
    <>
      <Header
        title="Portfolio & Content Library"
        description="Case studies, testimonials, and reusable content blocks"
      />
      <PageContainer>
        <Tabs defaultValue="case-studies">
          <TabsList>
            <TabsTrigger value="case-studies" className="gap-1.5">
              <Briefcase className="h-4 w-4" />
              Case Studies
            </TabsTrigger>
            <TabsTrigger value="content-blocks" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Content Blocks
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="gap-1.5">
              <Award className="h-4 w-4" />
              Testimonials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="case-studies" className="mt-6">
            <div className="mb-4 flex justify-end">
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Case Study
              </Button>
            </div>
            <EmptyState
              icon={Briefcase}
              title="No case studies yet"
              description="Build case studies from completed projects. Structure: Problem, Solution, Result, Metrics."
            />
          </TabsContent>

          <TabsContent value="content-blocks" className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-2">
                {["bio", "credential", "process", "testimonial", "case_study"].map((cat) => (
                  <Badge key={cat} variant="outline" className="cursor-pointer">
                    {cat.replace("_", " ")}
                  </Badge>
                ))}
              </div>
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Block
              </Button>
            </div>
            <EmptyState
              icon={FileText}
              title="No content blocks yet"
              description="Create reusable bios, credentials, process descriptions, and testimonials."
            />
          </TabsContent>

          <TabsContent value="testimonials" className="mt-6">
            <EmptyState
              icon={Award}
              title="No testimonials yet"
              description="Reviews and testimonials will appear here as you collect them from clients."
            />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  )
}
