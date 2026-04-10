import type { GraphData, ConceptNode, ConceptEdge } from "@/types/graph";

type NodeCategory = ConceptNode["category"];
type NodeImportance = ConceptNode["importance"];
type EdgeRelationship = "prerequisite" | "depends_on" | "related_to" | "part_of";

// ─── Stop words to skip ───────────────────────────────────────────────────────
const GENERIC_STOP_WORDS = new Set([
  "module", "unit", "chapter", "topic", "topics", "introduction", "overview",
  "summary", "assignment", "exam", "week", "course", "syllabus", "credits",
  "marks", "hours", "lecture", "lectures", "tutorial", "tutorials", "lab", "labs",
  "reference", "textbook", "objective", "objectives", "outcome", "outcomes",
  "assessment", "grading", "the", "and", "for", "this", "that", "with", "from",
  "each", "will", "able", "students", "understand", "learn", "study", "part",
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanLabel(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[\s\-:;,.()[\]{}]+|[\s\-:;,.()[\]{}]+$/g, "")
    .trim();
}

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
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

// ─── Group detection ──────────────────────────────────────────────────────────

function detectGroup(headingLine: string): string {
  const lower = headingLine.toLowerCase();
  const moduleMatch = lower.match(/\bmodule\s*[:\-]?\s*([ivxlc\d]+|one|two|three|four|five|six)\b/i);
  if (moduleMatch) return `Module ${moduleMatch[1].toUpperCase()}`;
  const unitMatch = lower.match(/\bunit\s*[:\-]?\s*(\d+)/i);
  if (unitMatch) return `Unit ${unitMatch[1]}`;
  const chapterMatch = lower.match(/\bchapter\s*[:\-]?\s*(\d+)/i);
  if (chapterMatch) return `Chapter ${chapterMatch[1]}`;
  return "General";
}

// ─── Concept extraction (local, no AI) ───────────────────────────────────────

interface RawConcept {
  label: string;
  group: string;
}

function extractConcepts(syllabusText: string): RawConcept[] {
  const seen = new Set<string>();
  const results: RawConcept[] = [];

  // Split the text into sections at module/unit/chapter headings
  const sections = syllabusText.split(/(?=(?:^|\n)\s*(?:module|unit|chapter)\s*[\d:\-])/i);

  for (const section of sections) {
    const lines = section.split(/\r?\n/);
    const group = detectGroup(lines[0] || "");

    for (const line of lines) {
      const parts = line
        .replace(/\b(module|unit|week)\s*\d+\b/gi, "")
        .split(/,|\||\s*\/\s*|\band\b|\bwith\b|->|:/i)
        .map((p) =>
          p
            .replace(/^\d+[.)\-\s]*/, "")
            .replace(/["'`]/g, "")
            .trim()
        )
        .filter(Boolean);

      for (const part of parts) {
        const label = cleanLabel(part);
        if (!label || label.length < 4 || label.length > 65) continue;
        if (!/[a-zA-Z]/.test(label)) continue;

        const lowered = label.toLowerCase();
        if (GENERIC_STOP_WORDS.has(lowered)) continue;

        const words = label.split(/\s+/);
        if (words.length > 7) continue;
        // Skip if all words are generic stop words
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

// ─── Edge builder (semantic groups + relationship types) ─────────────────────

function buildEdges(nodes: ConceptNode[]): ConceptEdge[] {
  const edges: ConceptEdge[] = [];
  const edgeKeys = new Set<string>();
  let counter = 1;

  const addEdge = (source: string, target: string, rel: EdgeRelationship) => {
    if (source === target) return;
    const key = `${source}:${target}:${rel}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ id: `e-${counter++}`, source, target, relationship: rel });
  };

  // Nodes grouped by their group label
  const byGroup = new Map<string, ConceptNode[]>();
  for (const node of nodes) {
    const g = (node as ConceptNode & { group?: string }).group || "General";
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(node);
  }

  // Within each group: sequential prerequisite chain
  for (const [, groupNodes] of byGroup) {
    for (let i = 1; i < groupNodes.length; i++) {
      addEdge(groupNodes[i - 1].id, groupNodes[i].id, "prerequisite");
      // Every 3rd node gets a "related_to" skip-link for graph density
      if (i >= 2 && i % 3 === 0) {
        addEdge(groupNodes[i - 2].id, groupNodes[i].id, "related_to");
      }
    }
  }

  // Cross-group links: advanced nodes depend_on foundation nodes
  const foundationNodes = nodes.filter((n) => n.category === "foundation");
  const advancedNodes = nodes.filter((n) => n.category === "advanced");
  for (const adv of advancedNodes.slice(0, 4)) {
    for (const found of foundationNodes.slice(0, 2)) {
      addEdge(found.id, adv.id, "depends_on");
    }
  }

  // Cross-group: intermediate nodes from different groups are "related_to"
  const groupKeys = [...byGroup.keys()];
  if (groupKeys.length > 1) {
    for (let gi = 0; gi < groupKeys.length - 1; gi++) {
      const groupA = byGroup.get(groupKeys[gi])!;
      const groupB = byGroup.get(groupKeys[gi + 1])!;
      // Connect the last node of group A to the first of group B as "related_to"
      if (groupA.length > 0 && groupB.length > 0) {
        addEdge(groupA[groupA.length - 1].id, groupB[0].id, "related_to");
      }
    }
  }

  return edges;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateGraphFromSyllabusText(
  syllabusText: string,
  fileNames: string[] = []
): GraphData {
  const extracted = extractConcepts(syllabusText);

  const fallbackConcepts: RawConcept[] = [
    { label: "Fundamentals", group: "General" },
    { label: "Core Concepts", group: "General" },
    { label: "Problem Solving", group: "General" },
    { label: "Data Organization", group: "General" },
    { label: "Implementation Techniques", group: "General" },
    { label: "Analysis and Evaluation", group: "General" },
    { label: "Advanced Applications", group: "General" },
  ];

  const concepts = (extracted.length > 0 ? extracted : fallbackConcepts).slice(0, 20);
  const primaryFile = fileNames[0] || "uploaded-syllabus.pdf";

  const idCounts = new Map<string, number>();
  const nodes: ConceptNode[] = concepts.map(({ label, group }, index) => {
    const base = toSlug(label) || `concept-${index + 1}`;
    const seen = (idCounts.get(base) ?? 0) + 1;
    idCounts.set(base, seen);
    const id = seen > 1 ? `${base}-${seen}` : base;

    return {
      id,
      label,
      // group is stored as an extra field for rendering; cast necessary due to
      // the shared GraphData type not including it natively.
      ...(group !== "General" ? { group } : {}),
      category: categoryForIndex(index, concepts.length),
      description: `Key syllabus concept: ${label}.`,
      prerequisites: [],
      importance: importanceForIndex(index, concepts.length),
      sourceFile: primaryFile,
    } as ConceptNode;
  });

  const edges = buildEdges(nodes);

  // Back-fill prerequisites from the generated edges
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
