import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ExplainRequest = {
  concept?: string;
  description?: string;
  group?: string;
  category?: string;
  importance?: string;
  prerequisites?: string[];
  dependents?: string[];
  relatedConcepts?: string[];
  dependsOn?: string[];
  partOf?: string[];
  /** Optional: total nodes in the graph for contextual framing */
  graphSize?: number;
};

function formatList(items: string[] | undefined): string {
  if (!Array.isArray(items) || items.length === 0) return "None";
  return items.filter((item) => typeof item === "string" && item.trim().length > 0).join(", ");
}

function buildFallbackExplanation(req: Required<Pick<ExplainRequest, "concept" | "description">> & Omit<ExplainRequest, "concept" | "description">): string {
  const { concept, description, category, group, prerequisites, dependents, relatedConcepts, dependsOn, partOf } = req;

  const levelText = category
    ? `This is a ${category}-level concept${group && group !== "General" ? ` in the "${group}" module` : " in the syllabus"}.`
    : "This concept appears in the syllabus roadmap.";
  const prereqText =
    Array.isArray(prerequisites) && prerequisites.length > 0
      ? `Before mastering ${concept}, review: ${prerequisites.join(", ")} — these provide the foundations needed to approach this topic.`
      : `${concept} can be approached directly, though reviewing foundational topics around it will help.`;
  const dependentText =
    Array.isArray(dependents) && dependents.length > 0
      ? `Understanding ${concept} unlocks downstream topics: ${dependents.join(", ")}.`
      : "";
  const relatedText =
    Array.isArray(relatedConcepts) && relatedConcepts.length > 0
      ? `It is closely related to ${relatedConcepts.join(", ")} — compare these side-by-side to avoid confusion.`
      : "";
  const dependsOnText =
    Array.isArray(dependsOn) && dependsOn.length > 0
      ? `${concept} also relies on knowledge of ${dependsOn.join(", ")} at a deeper level.`
      : "";
  const partOfText =
    Array.isArray(partOf) && partOf.length > 0
      ? `This concept is a component of the broader topic: ${partOf.join(", ")}.`
      : "";

  return [
    `${concept} is a key academic concept.`,
    description,
    levelText,
    prereqText,
    dependentText,
    dependsOnText,
    relatedText,
    partOfText,
    `For revision: explain ${concept} in your own words, work through one core example, and connect it to adjacent topics in the knowledge graph.`,
  ]
    .filter(Boolean)
    .join(" ");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as ExplainRequest;
    const {
      concept,
      description,
      group,
      category,
      importance,
      prerequisites,
      dependents,
      relatedConcepts,
      dependsOn,
      partOf,
      graphSize,
    } = body;

    const safeConcept =
      typeof concept === "string" && concept.trim().length > 0
        ? concept.trim()
        : "This concept";
    const safeDescription =
      typeof description === "string" && description.trim().length > 0
        ? description.trim()
        : `${safeConcept} is an important concept from the syllabus.`;

    // ── Fallback path (no API key) ──────────────────────────────────────────
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      const explanation = buildFallbackExplanation({
        concept: safeConcept,
        description: safeDescription,
        group,
        category,
        importance,
        prerequisites,
        dependents,
        relatedConcepts,
        dependsOn,
        partOf,
        graphSize,
      });
      return new Response(JSON.stringify({ explanation, source: "fallback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Build rich context string ────────────────────────────────────────────
    const groupCtx = group && group !== "General" ? `Module / Group: ${group}\n` : "";
    const importanceCtx = importance ? `Importance: ${importance}\n` : "";
    const graphCtx = graphSize && graphSize > 1 ? `(This concept is one of ${graphSize} nodes in the knowledge graph)\n` : "";
    const relSection = [
      prerequisites?.length ? `• Prerequisite of this concept: ${formatList(prerequisites)}` : "",
      dependsOn?.length ? `• This concept depends on: ${formatList(dependsOn)}` : "",
      dependents?.length ? `• Leads to / unlocks: ${formatList(dependents)}` : "",
      relatedConcepts?.length ? `• Related concepts: ${formatList(relatedConcepts)}` : "",
      partOf?.length ? `• Part of broader topic: ${formatList(partOf)}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    // ── Prompt engineered for structured, deep, student-friendly output ──────
    const systemPrompt = `You are an expert academic tutor specializing in explaining university-level syllabus concepts to students preparing for exams.

Your summaries must be:
- Accurate and grounded in the provided context (do NOT add external knowledge beyond the concept itself)
- Structured in exactly four clearly separated sections using these exact headers:
  📌 Definition
  💡 Intuition & Why It Matters
  🔗 Connections in the Learning Path
  📝 Study & Exam Tips
- Each section: 2–4 sentences, plain text, no bullet points inside sections
- Total length: 180–260 words
- Tone: clear, academic, encouraging`;

    const userPrompt = `Generate a deep student summary for the concept: "${safeConcept}"

${groupCtx}${importanceCtx}${graphCtx}Description from syllabus: ${safeDescription}

Graph relationships:
${relSection || "• No explicit relationships found — treat this as a standalone concept"}

Write the four-section summary now.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.25,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error("Lovable AI error:", response.status, await response.text());

      if (response.status === 429) {
        const explanation = buildFallbackExplanation({
          concept: safeConcept,
          description: safeDescription,
          group, category, importance, prerequisites, dependents, relatedConcepts, dependsOn, partOf,
        });
        return new Response(JSON.stringify({ explanation, source: "fallback", reason: "rate_limited" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const explanation = buildFallbackExplanation({
        concept: safeConcept,
        description: safeDescription,
        group, category, importance, prerequisites, dependents, relatedConcepts, dependsOn, partOf,
      });
      return new Response(JSON.stringify({ explanation, source: "fallback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content;
    const explanation =
      typeof content === "string" && content.trim().length > 0
        ? content.trim()
        : buildFallbackExplanation({
            concept: safeConcept,
            description: safeDescription,
            group, category, importance, prerequisites, dependents, relatedConcepts, dependsOn, partOf,
          });

    return new Response(JSON.stringify({ explanation, source: "ai" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({
        explanation:
          "A deep explanation could not be generated right now. Please retry this concept in a moment.",
        source: "fallback",
        error: e instanceof Error ? e.message : "Unknown",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
