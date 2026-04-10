import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NodeCategory = "foundation" | "intermediate" | "advanced";
type NodeImportance = "high" | "medium" | "low";
type EdgeRelationship = "prerequisite" | "depends_on" | "related_to" | "part_of";

type GraphNode = {
  id: string;
  label: string;
  category: NodeCategory;
  group: string;
  description: string;
  prerequisites: string[];
  importance: NodeImportance;
  sourceFile: string;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  relationship: EdgeRelationship;
};

type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

const CATEGORY_ORDER: NodeCategory[] = ["foundation", "intermediate", "advanced"];
const IMPORTANCE_ORDER: NodeImportance[] = ["low", "medium", "high"];
const RELATIONSHIP_ORDER: EdgeRelationship[] = ["prerequisite", "depends_on", "related_to", "part_of"];

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function cleanLabel(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\s+/g, " ")
    .replace(/^[\s\-:;,.()[\]{}]+|[\s\-:;,.()[\]{}]+$/g, "")
    .trim();
}

function categoryForIndex(index: number, total: number): NodeCategory {
  if (total <= 2) return "foundation";
  const ratio = index / Math.max(total - 1, 1);
  if (ratio < 0.34) return "foundation";
  if (ratio < 0.67) return "intermediate";
  return "advanced";
}

function importanceForIndex(index: number, total: number): NodeImportance {
  if (index < Math.max(2, Math.ceil(total * 0.25))) return "high";
  if (index < Math.max(4, Math.ceil(total * 0.6))) return "medium";
  return "low";
}

// ─────────────────────────────────────────────────────────
// Improved local fallback: semantic concept extraction
// ─────────────────────────────────────────────────────────

const GENERIC_STOP_WORDS = new Set([
  "module", "unit", "chapter", "topic", "topics", "introduction", "overview",
  "summary", "assignment", "exam", "week", "course", "syllabus", "credits",
  "marks", "hours", "lecture", "tutorial", "lab", "reference", "textbook",
  "objective", "objectives", "outcome", "outcomes", "assessment", "grading",
  "prerequisite", "the", "and", "for", "this", "that", "with", "from",
  "each", "will", "able", "students", "understand", "learn", "study",
]);

// Detect what "subject/module group" a chunk of text belongs to
function detectGroup(chunkContext: string): string {
  const lower = chunkContext.toLowerCase();
  if (/\bmodule\s*[:\-]?\s*([ivxlc\d]+|one|two|three|four|five|six)\b/i.test(lower)) {
    const match = lower.match(/\bmodule\s*[:\-]?\s*([ivxlc\d]+|one|two|three|four|five|six)\b/i);
    if (match) return `Module ${match[1].toUpperCase()}`;
  }
  if (/\bunit\s*[:\-]?\s*(\d+)/i.test(lower)) {
    const match = lower.match(/\bunit\s*[:\-]?\s*(\d+)/i);
    if (match) return `Unit ${match[1]}`;
  }
  return "General";
}

function extractConceptsLocally(syllabusText: string): Array<{ label: string; group: string }> {
  const seen = new Set<string>();
  const results: Array<{ label: string; group: string }> = [];

  // Split into labelled chunks by module/unit headings
  const sections = syllabusText.split(/\n(?=\s*(module|unit|chapter)\s*[\d:\-])/i);

  for (const section of sections) {
    const group = detectGroup(section.split("\n")[0] || "");
    const chunks = section
      .split(/[\r\n]+|[.;]/)
      .map((c) => c.trim())
      .filter(Boolean);

    for (const chunk of chunks) {
      const parts = chunk
        .replace(/\b(module|unit|week)\s*\d+\b/gi, "")
        .split(/,|\||\s*\/\s*|\band\b|\bwith\b|->/i)
        .map((p) =>
          p
            .replace(/^\d+[.)\-\s]*/, "")
            .replace(/["'`]/g, "")
            .trim()
        )
        .filter(Boolean);

      for (const part of parts) {
        const label = cleanLabel(part);
        if (!label || label.length < 4 || label.length > 70) continue;
        if (!/[a-zA-Z]/.test(label)) continue;

        const lowered = label.toLowerCase();
        if (GENERIC_STOP_WORDS.has(lowered)) continue;
        // Skip if all words are stop words
        const words = label.split(/\s+/);
        if (words.length > 8) continue;
        if (words.every((w) => GENERIC_STOP_WORDS.has(w.toLowerCase()))) continue;
        if (seen.has(lowered)) continue;

        seen.add(lowered);
        results.push({ label, group });
        if (results.length >= 25) return results;
      }
    }
  }

  return results;
}

// Build prerequisite chains based on order within groups + cross-group links
function buildEdgesLocally(nodes: GraphNode[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const edgeKeys = new Set<string>();
  let counter = 1;

  const addEdge = (source: string, target: string, rel: EdgeRelationship) => {
    const key = `${source}:${target}:${rel}`;
    if (!edgeKeys.has(key) && source !== target) {
      edgeKeys.add(key);
      edges.push({ id: `e-${counter++}`, source, target, relationship: rel });
    }
  };

  // Group nodes by their group label
  const byGroup = new Map<string, GraphNode[]>();
  for (const node of nodes) {
    const g = node.group || "General";
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(node);
  }

  // Within each group: sequential prerequisite chain
  for (const [, groupNodes] of byGroup) {
    for (let i = 1; i < groupNodes.length; i++) {
      addEdge(groupNodes[i - 1].id, groupNodes[i].id, "prerequisite");
      // Skip-level related edge every 3 nodes
      if (i >= 2 && i % 3 === 0) {
        addEdge(groupNodes[i - 2].id, groupNodes[i].id, "related_to");
      }
    }
  }

  // Cross-group: foundation nodes are part_of their group; advanced nodes depend_on foundation ones
  const foundationNodes = nodes.filter((n) => n.category === "foundation");
  const advancedNodes = nodes.filter((n) => n.category === "advanced");
  for (const adv of advancedNodes.slice(0, 3)) {
    for (const found of foundationNodes.slice(0, 2)) {
      addEdge(found.id, adv.id, "depends_on");
    }
  }

  return edges;
}

function createFallbackGraph(syllabusText: string, fileNames: string[] = []): Graph {
  const extracted = extractConceptsLocally(syllabusText);
  const defaultConcepts = [
    { label: "Fundamentals", group: "General" },
    { label: "Core Concepts", group: "General" },
    { label: "Problem Solving", group: "General" },
    { label: "Data Organization", group: "General" },
    { label: "Implementation Techniques", group: "General" },
    { label: "Analysis and Evaluation", group: "General" },
    { label: "Advanced Applications", group: "General" },
  ];

  const items = (extracted.length > 0 ? extracted : defaultConcepts).slice(0, 20);
  const primaryFile = fileNames[0] || "uploaded-syllabus.pdf";

  const idCounts = new Map<string, number>();
  const nodes: GraphNode[] = items.map(({ label, group }, index) => {
    const baseId = toSlug(label) || `concept-${index + 1}`;
    const nextCount = (idCounts.get(baseId) ?? 0) + 1;
    idCounts.set(baseId, nextCount);
    const id = nextCount > 1 ? `${baseId}-${nextCount}` : baseId;

    return {
      id,
      label,
      group: group || "General",
      category: categoryForIndex(index, items.length),
      description: `Key syllabus concept: ${label}.`,
      prerequisites: [],
      importance: importanceForIndex(index, items.length),
      sourceFile: primaryFile,
    };
  });

  const edges = buildEdgesLocally(nodes);

  // Back-fill prerequisites array from edges
  for (const edge of edges) {
    if (edge.relationship === "prerequisite") {
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (targetNode && !targetNode.prerequisites.includes(edge.source)) {
        targetNode.prerequisites.push(edge.source);
      }
    }
  }

  return { nodes, edges };
}

// ─────────────────────────────────────────────────────────
// Sanitize raw AI graph output
// ─────────────────────────────────────────────────────────

function sanitizeAIResponseGraph(rawGraph: unknown, fileNames: string[] = []): Graph | null {
  if (!rawGraph || typeof rawGraph !== "object") return null;

  const rawNodes = (rawGraph as { nodes?: unknown[] }).nodes;
  if (!Array.isArray(rawNodes) || rawNodes.length === 0) return null;

  const primaryFile = fileNames[0] || "uploaded-syllabus.pdf";
  const usedIds = new Set<string>();
  const nodes: GraphNode[] = [];

  rawNodes.forEach((rawNode, index) => {
    const n = rawNode as Record<string, unknown>;
    const label = cleanLabel(n?.label);
    if (!label) return;

    const requestedId = cleanLabel(n?.id);
    const idBase = toSlug(requestedId || label) || `concept-${index + 1}`;
    let id = idBase;
    let bump = 2;
    while (usedIds.has(id)) {
      id = `${idBase}-${bump++}`;
    }
    usedIds.add(id);

    const requestedCategory = cleanLabel(n?.category) as NodeCategory;
    const category = CATEGORY_ORDER.includes(requestedCategory)
      ? requestedCategory
      : categoryForIndex(index, rawNodes.length);

    const requestedImportance = cleanLabel(n?.importance) as NodeImportance;
    const importance = IMPORTANCE_ORDER.includes(requestedImportance)
      ? requestedImportance
      : importanceForIndex(index, rawNodes.length);

    const description = cleanLabel(n?.description) || `Key syllabus concept: ${label}.`;
    const group = cleanLabel(n?.group) || "General";
    const sourceFile = cleanLabel(n?.sourceFile) || primaryFile;
    const prerequisites = Array.isArray(n?.prerequisites)
      ? n.prerequisites
          .filter((value): value is string => typeof value === "string")
          .map((value) => cleanLabel(value))
          .filter(Boolean)
      : [];

    nodes.push({
      id,
      label,
      category,
      group,
      description,
      prerequisites,
      importance,
      sourceFile,
    });
  });

  if (nodes.length === 0) return null;

  // Build lookup by both id and label (lowercase)
  const sourceIdMap = new Map<string, string>();
  nodes.forEach((n) => {
    sourceIdMap.set(n.id, n.id);
    sourceIdMap.set(n.label.toLowerCase(), n.id);
  });

  // Normalize prerequisite IDs
  nodes.forEach((node, index) => {
    const normalized = new Set<string>();
    for (const candidate of node.prerequisites) {
      const mapped = sourceIdMap.get(candidate) || sourceIdMap.get(candidate.toLowerCase());
      if (mapped && mapped !== node.id) normalized.add(mapped);
    }
    if (normalized.size === 0 && index > 0) normalized.add(nodes[index - 1].id);
    node.prerequisites = [...normalized];
  });

  const rawEdges = (rawGraph as { edges?: unknown[] }).edges;
  const edges: GraphEdge[] = [];
  const edgeKeys = new Set<string>();
  let edgeCounter = 1;

  if (Array.isArray(rawEdges)) {
    for (const rawEdge of rawEdges) {
      const e = rawEdge as Record<string, unknown>;
      const sourceInput = cleanLabel(e?.source);
      const targetInput = cleanLabel(e?.target);
      const source = sourceIdMap.get(sourceInput) || sourceIdMap.get(sourceInput.toLowerCase());
      const target = sourceIdMap.get(targetInput) || sourceIdMap.get(targetInput.toLowerCase());
      if (!source || !target || source === target) continue;

      const labelInput = (cleanLabel(e?.label) || cleanLabel(e?.relationship)) as EdgeRelationship;
      const relationship = RELATIONSHIP_ORDER.includes(labelInput) ? labelInput : "related_to";

      const edgeKey = `${source}:${target}:${relationship}`;
      if (edgeKeys.has(edgeKey)) continue;
      edgeKeys.add(edgeKey);

      edges.push({
        id: `e-${edgeCounter++}`,
        source,
        target,
        relationship,
      });
    }
  }

  // Ensure prerequisite edges exist for every declared prerequisite
  for (const node of nodes) {
    for (const prerequisite of node.prerequisites) {
      const edgeKey = `${prerequisite}:${node.id}:prerequisite`;
      if (edgeKeys.has(edgeKey)) continue;
      edgeKeys.add(edgeKey);
      edges.push({
        id: `e-${edgeCounter++}`,
        source: prerequisite,
        target: node.id,
        relationship: "prerequisite",
      });
    }
  }

  return { nodes, edges };
}

// ─────────────────────────────────────────────────────────
// Enhanced AI prompt — multi-pass chain-of-thought reasoning
// ─────────────────────────────────────────────────────────

async function tryGenerateWithAI(syllabusText: string, fileNames: string[] = []): Promise<Graph | null> {
  const VITE_GEMINI_API_KEY = Deno.env.get("VITE_GEMINI_API_KEY");
  if (!VITE_GEMINI_API_KEY) return null;

  const truncated = syllabusText.slice(0, 9000);

  const systemPrompt = `You are an expert academic curriculum analyst and knowledge graph engineer.
Your job is to transform raw university syllabus text into a precise, structured knowledge graph.

REASONING PROCESS (follow each step before producing output):

STEP 1 — SUBJECT DETECTION
  Identify distinct subjects or modules present in the text.
  Assign each a short group name (e.g. "Data Structures", "Operating Systems", "Module I").

STEP 2 — CONCEPT EXTRACTION
  For each group, extract ONLY meaningful academic concepts explicitly present in the text.
  Rules:
  • Keep concept names concise: 1–3 words preferred, 5 words maximum.
  • Skip noise words: introduction, overview, summary, exam, assignment, tutorial, lecture, marks, hours, credits, week, unit, module, chapter, course, syllabus, objectives, outcomes.
  • Do NOT invent or add knowledge not in the text.
  • Normalise near-duplicates into one canonical concept (e.g. "Linked List" and "Linked Lists" → "Linked List").
  • Aim for 8–20 high-quality nodes total; decline to manufacture extras.

STEP 3 — CATEGORY CLASSIFICATION
  foundation  : core prerequisite knowledge assumed before this course, or introductory topics.
  intermediate: topics that build directly on foundational ones within the syllabus.
  advanced    : topics requiring solid intermediate knowledge; typically later in the syllabus.

STEP 4 — IMPORTANCE RATING
  high  : central, frequently referenced, core exam topics.
  medium: supporting topics; important but not standalone.
  low   : supplementary, optional, or rarely tested.

STEP 5 — RELATIONSHIP INFERENCE
  Use EXACTLY these four relationship types (no others):
    "prerequisite"  — concept A must be learned before concept B.
    "depends_on"    — concept B relies on concept A (similar to prerequisite but looser; A may not fully teach B).
    "related_to"    — concepts share subject matter or appear in the same module without strict dependency.
    "part_of"       — concept B is a sub-topic or component of concept A.
  Rules:
  • Only create an edge when the syllabus text strongly implies the connection.
  • Avoid over-connecting — prefer fewer, high-quality edges over a dense meaningless graph.
  • Prefer "prerequisite" only when one concept is explicitly listed before another in a learning sequence.
  • Use "part_of" for topics that are clearly sub-topics of a named parent concept.

STEP 6 — DEDUPLICATION & NOISE REDUCTION
  Review all nodes: remove near-duplicates, merge synonyms, drop purely generic labels.
  Review all edges: remove self-loops, duplicates, and spurious edges.

FINAL OUTPUT: Call the create_knowledge_graph function with the result of your reasoning.`;

  const userPrompt = `Analyze the following syllabus and generate a knowledge graph following all 6 reasoning steps precisely.

SYLLABUS TEXT:
"""
${truncated}
"""

Remember:
— Extract ONLY what is explicitly present.
— Use ONLY the four relationship types: prerequisite, depends_on, related_to, part_of.
— Keep concept labels to 1–3 words where possible.
— Avoid duplicate or near-duplicate nodes.
— Group concepts by their module/subject if multiple subjects are present.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VITE_GEMINI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "create_knowledge_graph",
            description:
              "Output the final structured knowledge graph after completing all 6 reasoning steps.",
            parameters: {
              type: "object",
              properties: {
                graph: {
                  type: "object",
                  required: ["nodes", "edges"],
                  additionalProperties: false,
                  properties: {
                    nodes: {
                      type: "array",
                      description: "Deduplicated list of academic concept nodes.",
                      items: {
                        type: "object",
                        required: [
                          "id",
                          "label",
                          "group",
                          "category",
                          "description",
                          "prerequisites",
                          "importance",
                          "sourceFile",
                        ],
                        additionalProperties: false,
                        properties: {
                          id: {
                            type: "string",
                            description:
                              "Unique slug derived from the concept label (e.g. 'linked-list').",
                          },
                          label: {
                            type: "string",
                            description:
                              "Concise concept name, 1–3 words where possible, exactly as it appears (or normalised) in the syllabus.",
                          },
                          group: {
                            type: "string",
                            description:
                              "Subject or module this concept belongs to (e.g. 'Data Structures', 'Module II').",
                          },
                          category: {
                            type: "string",
                            enum: ["foundation", "intermediate", "advanced"],
                            description: "Learning level of this concept.",
                          },
                          description: {
                            type: "string",
                            description:
                              "One-sentence description of the concept based solely on the syllabus context.",
                          },
                          prerequisites: {
                            type: "array",
                            items: { type: "string" },
                            description:
                              "IDs of prerequisite concept nodes (must be IDs of other nodes in this graph).",
                          },
                          importance: {
                            type: "string",
                            enum: ["high", "medium", "low"],
                          },
                          sourceFile: {
                            type: "string",
                            description: "Source PDF filename.",
                          },
                        },
                      },
                    },
                    edges: {
                      type: "array",
                      description:
                        "Clean, non-duplicate relationships between concept nodes.",
                      items: {
                        type: "object",
                        required: ["id", "source", "target", "label"],
                        additionalProperties: false,
                        properties: {
                          id: { type: "string" },
                          source: {
                            type: "string",
                            description: "ID of the source concept node.",
                          },
                          target: {
                            type: "string",
                            description: "ID of the target concept node.",
                          },
                          label: {
                            type: "string",
                            enum: ["prerequisite", "depends_on", "related_to", "part_of"],
                            description:
                              "Relationship type — MUST be one of: prerequisite, depends_on, related_to, part_of.",
                          },
                        },
                      },
                    },
                  },
                },
              },
              required: ["graph"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "create_knowledge_graph" } },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("AI generation failed:", response.status, body);
    return null;
  }

  const result = await response.json();
  const toolCall = result?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) return null;

  try {
    const parsed = JSON.parse(toolCall.function.arguments);
    return sanitizeAIResponseGraph(parsed?.graph, fileNames);
  } catch (parseError) {
    console.error("Failed to parse AI graph output:", parseError);
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// Edge function handler
// ─────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { syllabusText, fileNames } = await req.json();

    if (!syllabusText || syllabusText.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "No syllabus text provided. Please upload valid PDF files." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const safeFileNames = Array.isArray(fileNames)
      ? fileNames.filter((name: unknown): name is string => typeof name === "string")
      : [];

    const fallbackGraph = createFallbackGraph(syllabusText, safeFileNames);
    const aiGraph = await tryGenerateWithAI(syllabusText, safeFileNames);
    const graph = aiGraph ?? fallbackGraph;

    return new Response(
      JSON.stringify({ graph, source: aiGraph ? "ai" : "fallback" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Error:", e);
    const graph = createFallbackGraph("Fundamentals, Core Concepts, Applications", []);
    return new Response(
      JSON.stringify({
        graph,
        source: "fallback",
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
