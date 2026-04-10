import { useState, useMemo } from "react";
import { Search, FileText, SlidersHorizontal, ChevronDown, Sun, Moon, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { UploadedFile, ConceptNode } from "@/types/graph";

interface Props {
  files: UploadedFile[];
  nodes: ConceptNode[];
  onNodeSelect: (node: ConceptNode) => void;
  selectedNode: string | null;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

const LEVELS = [
  { key: "foundation",   label: "Foundation",   dot: "bg-primary" },
  { key: "intermediate", label: "Intermediate", dot: "bg-accent" },
  { key: "advanced",     label: "Advanced",     dot: "bg-rose-500" },
] as const;

const IMP: Record<string, string> = {
  high:   "text-rose-400 bg-rose-500/10",
  medium: "text-primary bg-primary/10",
  low:    "text-muted-foreground bg-muted",
};

export default function DashboardSidebar({ files, nodes, onNodeSelect, selectedNode, theme, onToggleTheme }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [filesOpen, setFilesOpen] = useState(true);

  const filtered = useMemo(() =>
    nodes.filter((n) => {
      if (search && !n.label.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter && n.category !== filter) return false;
      return true;
    }), [nodes, search, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const n of nodes) c[n.category] = (c[n.category] || 0) + 1;
    return c;
  }, [nodes]);

  return (
    <aside className="w-[260px] shrink-0 h-full flex flex-col border-r border-border/60" style={{ background: "hsl(var(--sidebar-background))" }}>
      {/* ── Brand ─────────────────────────────────────────── */}
      <div className="px-4 h-12 flex items-center justify-between border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/12 border border-primary/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-[13px] font-semibold text-foreground tracking-tight">SyllabusMap</span>
        </div>
        <button onClick={onToggleTheme} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Toggle theme">
          {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── Search ────────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-1.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Search concepts…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-[13px] bg-secondary/50 border-border/50 rounded-lg placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-1 focus:ring-primary/15"
          />
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────── */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-1.5 mb-1.5 px-1">
          <SlidersHorizontal className="w-3 h-3 text-muted-foreground/50" />
          <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Filter</span>
        </div>
        <div className="flex gap-1">
          {LEVELS.map(({ key, label, dot }) => (
            <button key={key} onClick={() => setFilter(filter === key ? null : key)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                filter === key
                  ? "bg-primary/12 text-primary ring-1 ring-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${dot} ${filter === key ? "" : "opacity-50"}`} />
              {label}
              {counts[key] ? <span className="text-muted-foreground/40 text-[10px]">{counts[key]}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {/* ── Files ─────────────────────────────────────────── */}
      <div className="px-3 py-2 border-t border-border/40">
        <button onClick={() => setFilesOpen(!filesOpen)} className="flex items-center justify-between w-full px-1 mb-1.5 group">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Sources ({files.length})</span>
          </div>
          <ChevronDown className={`w-3 h-3 text-muted-foreground/40 transition-transform duration-200 ${filesOpen ? "" : "-rotate-90"}`} />
        </button>
        {filesOpen && (
          <div className="space-y-1">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md sf-2 text-[12px] text-muted-foreground/80">
                <FileText className="w-3.5 h-3.5 text-primary/50 shrink-0" />
                <span className="truncate">{f.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-border/40 mx-3" />

      {/* ── Concept List ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-px">
        {filtered.length === 0 && <p className="text-xs text-muted-foreground/40 text-center py-8">No concepts match</p>}
        {filtered.map((n) => {
          const isActive = selectedNode === n.id;
          const levelCfg = LEVELS.find((l) => l.key === n.category) ?? LEVELS[0];
          return (
            <button key={n.id} onClick={() => onNodeSelect(n)}
              className={`w-full text-left px-2.5 py-2 rounded-md text-[13px] transition-all duration-150 group relative ${
                isActive
                  ? "bg-primary/8 text-foreground active-bar"
                  : "text-foreground/80 hover:bg-secondary/60 hover:text-foreground"
              }`}>
              <div className="font-medium truncate leading-snug">{n.label}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${levelCfg.dot} opacity-60`} />
                  <span className="text-[10px] text-muted-foreground/50">{levelCfg.label}</span>
                </span>
                <span className={`text-[10px] px-1.5 py-px rounded-sm font-medium ${IMP[n.importance] ?? IMP.low}`}>{n.importance}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Footer ────────────────────────────────────────── */}
      <div className="px-4 py-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground/40">
        <span>{nodes.length} concepts</span>
        <span>{filtered.length} shown</span>
      </div>
    </aside>
  );
}
