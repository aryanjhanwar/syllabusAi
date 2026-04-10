import { motion } from "framer-motion";
import { Brain, ChevronRight, Sparkles, BookOpen, Lightbulb, Link2, ScrollText, Zap } from "lucide-react";
import type { ConceptNode, GraphData } from "@/types/graph";

/* ── AI section parser ─────────────────────────────────────────────────────── */

type Section = { icon: React.ReactNode; title: string; body: string; accent: string };

const PATTERNS: { re: RegExp; icon: React.ReactNode; title: string; accent: string }[] = [
  { re: /📌\s*Definition/i,  icon: <ScrollText className="w-3 h-3" />, title: "Definition",  accent: "border-primary/15 bg-primary/[0.04]" },
  { re: /💡\s*Intuition/i,   icon: <Lightbulb  className="w-3 h-3" />, title: "Intuition",   accent: "border-amber-500/15 bg-amber-500/[0.04]" },
  { re: /🔗\s*Connections/i, icon: <Link2      className="w-3 h-3" />, title: "Connections",  accent: "border-accent/15 bg-accent/[0.04]" },
  { re: /📝\s*Study/i,       icon: <BookOpen   className="w-3 h-3" />, title: "Study Tips",   accent: "border-emerald-500/15 bg-emerald-500/[0.04]" },
];
const ICON_COLORS = ["text-primary", "text-amber-500", "text-accent", "text-emerald-500"];

function parseSummary(text: string): Section[] {
  if (!text) return [];
  const hits: { idx: number; p: typeof PATTERNS[0] }[] = [];
  for (const p of PATTERNS) { const m = p.re.exec(text); if (m) hits.push({ idx: m.index, p }); }
  hits.sort((a, b) => a.idx - b.idx);
  if (!hits.length) return [{ icon: <Sparkles className="w-3 h-3" />, title: "Summary", body: text.trim(), accent: "border-primary/15 bg-primary/[0.04]" }];
  return hits.map(({ idx, p }, i) => {
    const start = text.indexOf("\n", idx);
    const end = i + 1 < hits.length ? hits[i + 1].idx : text.length;
    return { icon: p.icon, title: p.title, body: text.slice(start === -1 ? idx : start, end).trim(), accent: p.accent };
  });
}

/* ── Relationship chips ────────────────────────────────────────────────────── */

function RelChips({ title, items, color }: { title: string; items: ConceptNode[]; color: string }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[11px] font-semibold ${color}`}>{title}</span>
        <span className="text-[10px] text-muted-foreground/40 bg-secondary/60 px-1.5 rounded font-medium">{items.length}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((d) => (
          <span key={d.id} className="text-[11px] font-medium px-2 py-0.5 rounded-md sf-2 border border-border/30 text-foreground/70">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Badge configs ─────────────────────────────────────────────────────────── */

const CAT: Record<string, { label: string; cls: string }> = {
  foundation:   { label: "FOUNDATION",   cls: "text-primary bg-primary/8 border-primary/15" },
  intermediate: { label: "INTERMEDIATE", cls: "text-accent bg-accent/8 border-accent/15" },
  advanced:     { label: "ADVANCED",     cls: "text-rose-400 bg-rose-400/8 border-rose-400/15" },
};
const IMP: Record<string, string> = {
  high: "text-rose-400 bg-rose-400/8 border-rose-400/15",
  medium: "text-primary bg-primary/8 border-primary/15",
  low: "text-muted-foreground bg-muted/40 border-border/30",
};

/* ── Component ─────────────────────────────────────────────────────────────── */

interface Props { selectedNode: ConceptNode | null; graphData: GraphData; explanation: string; loading: boolean; }

export default function InsightsPanel({ selectedNode, graphData, explanation, loading }: Props) {
  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/8 border border-primary/12 flex items-center justify-center mb-3">
          <Brain className="w-6 h-6 text-primary/50" />
        </div>
        <h3 className="text-[13px] font-semibold text-foreground/70 mb-1">AI Insights</h3>
        <p className="text-[12px] text-muted-foreground/50 max-w-[200px] leading-relaxed">Select a concept node to see AI-powered analysis.</p>
      </div>
    );
  }

  const prereqs = graphData.nodes.filter((n) => selectedNode.prerequisites.includes(n.id));
  const byRel = (rel: string) => graphData.edges.filter((e) => e.source === selectedNode.id && e.relationship === rel).map((e) => graphData.nodes.find((n) => n.id === e.target)).filter(Boolean) as ConceptNode[];
  const related = graphData.edges.filter((e) => e.relationship === "related_to" && (e.source === selectedNode.id || e.target === selectedNode.id)).map((e) => graphData.nodes.find((n) => n.id === (e.source === selectedNode.id ? e.target : e.source))).filter(Boolean) as ConceptNode[];
  const catCfg = CAT[selectedNode.category] ?? CAT.foundation;

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border/30">
        <div className="flex items-center gap-1.5 mb-3">
          <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border ${catCfg.cls}`}>{catCfg.label}</span>
          <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border ${IMP[selectedNode.importance] ?? IMP.low}`}>{selectedNode.importance.toUpperCase()}</span>
          {selectedNode.group && <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border border-border/20 text-muted-foreground bg-secondary/40">{selectedNode.group}</span>}
        </div>
        <h2 className="text-lg font-bold text-foreground leading-snug tracking-tight">{selectedNode.label}</h2>
        <p className="text-[12px] text-muted-foreground/60 mt-1 leading-relaxed">{selectedNode.description}</p>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* AI Summary */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">AI Analysis</span>
            {!loading && explanation && <span className="ml-auto text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/8 text-primary border border-primary/12">AI</span>}
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground/40">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span>AI is analyzing…</span>
              </div>
              {[100, 90, 78, 65, 50].map((w, i) => (
                <div key={i} className="h-2 sf-2 rounded animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : explanation ? (
            <div className="space-y-2">
              {parseSummary(explanation).map((s, i) => (
                <motion.div key={s.title} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`rounded-lg border p-3 ${s.accent}`}>
                  <div className={`flex items-center gap-1.5 mb-1 text-[9px] font-bold uppercase tracking-wider ${ICON_COLORS[i % ICON_COLORS.length]}`}>{s.icon} {s.title}</div>
                  <p className="text-[12px] text-foreground/60 leading-relaxed">{s.body}</p>
                </motion.div>
              ))}
            </div>
          ) : <p className="text-[11px] text-muted-foreground/40 italic">Loading…</p>}
        </div>

        {/* Relationships */}
        <div className="space-y-3">
          <RelChips title="Prerequisites" items={prereqs} color="text-primary" />
          <RelChips title="Leads To" items={byRel("prerequisite")} color="text-accent" />
          <RelChips title="Depends On" items={byRel("depends_on")} color="text-amber-400" />
          <RelChips title="Related To" items={related} color="text-accent" />
          <RelChips title="Part Of" items={byRel("part_of")} color="text-emerald-400" />
        </div>

        {/* Learning Path */}
        <div className="sf-2 rounded-lg border border-border/20 p-3">
          <div className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-2">Learning Path</div>
          <div className="flex items-center gap-1">
            {(["Foundation", "Intermediate", "Advanced"] as const).map((lv, i) => {
              const isActive = lv.toLowerCase() === selectedNode.category;
              return (
                <div key={lv} className="flex items-center gap-1">
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all ${isActive ? "bg-primary/10 text-primary ring-1 ring-primary/15 font-semibold" : "text-muted-foreground/40"}`}>{lv}</span>
                  {i < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground/20" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
