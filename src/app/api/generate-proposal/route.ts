export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import type { ProposalTemplate } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Request validation schema
// ---------------------------------------------------------------------------

const generateProposalSchema = z.object({
  /** The full job description to tailor the proposal to. */
  job_description: z
    .string()
    .min(10, "Job description must be at least 10 characters")
    .max(15000, "Job description must be 15,000 characters or fewer"),

  /** Optional template ID to base the proposal on. */
  template_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("")),

  /** Platform the proposal is for (e.g. "Upwork", "Fiverr"). */
  platform: z
    .string()
    .min(1, "Platform is required")
    .max(50),

  /** Service pillar category. */
  pillar: z
    .string()
    .min(1, "Pillar is required")
    .max(100),

  /** Additional context about the client or project. */
  client_context: z
    .string()
    .max(3000, "Client context must be 3,000 characters or fewer")
    .optional()
    .or(z.literal("")),

  /** Desired tone: professional, friendly, technical, casual. */
  tone: z
    .enum(["professional", "friendly", "technical", "casual"])
    .default("professional"),

  /** Approximate max word count for the generated proposal. */
  max_words: z.coerce
    .number()
    .int()
    .min(50, "Minimum 50 words")
    .max(2000, "Maximum 2,000 words")
    .default(300),
})

type GenerateProposalInput = z.infer<typeof generateProposalSchema>

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

interface ProposalResponse {
  proposal_text: string
  word_count: number
  template_used: string | null
  estimated_tokens_used: number
  mock: boolean
}

// ---------------------------------------------------------------------------
// POST /api/generate-proposal
// ---------------------------------------------------------------------------

/**
 * AI-powered proposal generation.
 *
 * Accepts a job description, optional template, and configuration.
 * If ANTHROPIC_API_KEY is not configured, returns a mock response.
 * Otherwise calls the Claude API to generate a tailored proposal.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: unknown = await req.json()

    // Validate input
    const result = generateProposalSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          data: null,
          error: "Validation failed",
          issues: result.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      )
    }

    const input = result.data

    // Fetch template text if template_id was provided
    let templateText: string | null = null
    let templateName: string | null = null
    if (input.template_id && input.template_id !== "") {
      const { data: template, error: templateError } = await supabase
        .from("proposal_templates")
        .select("name, template_text")
        .eq("id", input.template_id)
        .single()

      if (templateError) {
        console.error("Failed to fetch template:", templateError)
      } else if (template) {
        const tmpl = template as Pick<
          ProposalTemplate,
          "name" | "template_text"
        >
        templateText = tmpl.template_text
        templateName = tmpl.name
      }
    }

    // Check if Anthropic API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      const mockResponse: ProposalResponse = {
        proposal_text:
          "AI generation requires ANTHROPIC_API_KEY. Please add it to .env.local.",
        word_count: 0,
        template_used: templateName,
        estimated_tokens_used: 0,
        mock: true,
      }
      return NextResponse.json({ data: mockResponse, error: null })
    }

    // --- Real AI generation via Anthropic API ---
    const systemPrompt = buildSystemPrompt(input, templateText)
    const userMessage = buildUserMessage(input)

    const anthropicResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: Math.min(input.max_words * 3, 4096),
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        }),
      },
    )

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text()
      console.error("Anthropic API error:", errorText)
      return NextResponse.json(
        { data: null, error: "AI generation failed. Please try again." },
        { status: 502 },
      )
    }

    const aiResult = (await anthropicResponse.json()) as {
      content: Array<{ type: string; text: string }>
      usage: { input_tokens: number; output_tokens: number }
    }

    const generatedText =
      aiResult.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n") || ""

    const wordCount = generatedText
      .split(/\s+/)
      .filter((w) => w.length > 0).length

    const proposalResponse: ProposalResponse = {
      proposal_text: generatedText,
      word_count: wordCount,
      template_used: templateName,
      estimated_tokens_used:
        aiResult.usage.input_tokens + aiResult.usage.output_tokens,
      mock: false,
    }

    return NextResponse.json({ data: proposalResponse, error: null })
  } catch (err) {
    console.error("Unexpected error generating proposal:", err)
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function buildSystemPrompt(
  input: GenerateProposalInput,
  templateText: string | null,
): string {
  const parts: string[] = [
    "You are an expert freelance proposal writer for PrettyFly.ai, a technology consultancy specializing in automation, AI implementation, CRM systems, web development, and strategic consulting.",
    "",
    "Your task is to write a compelling, personalized proposal for a freelance opportunity.",
    "",
    `Platform: ${input.platform}`,
    `Service pillar: ${input.pillar}`,
    `Tone: ${input.tone}`,
    `Target length: approximately ${input.max_words} words`,
    "",
    "Guidelines:",
    "- Lead with understanding of the client's problem, not credentials",
    "- Reference specific details from the job description",
    "- Include a brief, relevant experience mention (1-2 sentences)",
    "- Propose a clear approach or next step",
    "- End with a soft call to action",
    "- Do NOT use generic filler or overly salesy language",
    "- Write in first person as Alex, founder of PrettyFly.ai",
    "- Keep paragraphs short (2-3 sentences max)",
  ]

  if (templateText) {
    parts.push(
      "",
      "Use the following template as a structural guide, but personalize it heavily based on the job description:",
      "",
      "--- TEMPLATE START ---",
      templateText,
      "--- TEMPLATE END ---",
    )
  }

  return parts.join("\n")
}

function buildUserMessage(input: GenerateProposalInput): string {
  const parts: string[] = [
    "Write a proposal for the following job posting:",
    "",
    "--- JOB DESCRIPTION ---",
    input.job_description,
    "--- END JOB DESCRIPTION ---",
  ]

  if (input.client_context && input.client_context.trim() !== "") {
    parts.push(
      "",
      "Additional client context:",
      input.client_context,
    )
  }

  parts.push(
    "",
    `Generate the proposal in a ${input.tone} tone, approximately ${input.max_words} words.`,
  )

  return parts.join("\n")
}
