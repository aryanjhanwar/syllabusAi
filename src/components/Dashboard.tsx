import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Layers, GitFork, X } from "lucide-react";
import KnowledgeGraph from "./KnowledgeGraph";
import InsightsPanel from "./InsightsPanel";
import DashboardSidebar from "./DashboardSidebar";
import ChatPanel from "./ChatPanel";
import type { GraphData, ConceptNode, UploadedFile } from "@/types/graph";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

interface Props {
  files: UploadedFile[];
  graphData: GraphData;
  onSignOut: () => void;
}

export default function Dashboard({ files, graphData, onSignOut }: Props) {
  const { theme, toggleTheme, isDark } = useTheme();
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);
  const [nodeExplanations, setNodeExplanations] = useState<Record<string, string>>({});
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const explanationCacheRef = useRef<Record<string, string>>({});
  const inFlightRef = useRef<Map<string, Promise<string>>>(new Map());

  useEffect(() => { explanationCacheRef.current = nodeExplanations; }, [nodeExplanations]);

  const getNodeContext = useCallback((node: ConceptNode) => {
    const prerequisiteLabels = node.prerequisites
      .map((pid) => graphData.nodes.find((n) => n.id === pid)?.label || pid)
      .filter(Boolean) as string[];
    const edgesByRel = (rel: string) =>
      graphData.edges.filter((e) => e.source === node.id && e.relationship === rel)
        .map((e) => graphData.nodes.find((n) => n.id === e.target)?.label)
        .filter((l): l is string => Boolean(l));
    return {
      prerequisiteLabels,
      dependentLabels: edgesByRel("prerequisite"),
      dependsOnLabels: [...new Set(edgesByRel("depends_on"))],
      relatedLabels: [...new Set(
        graphData.edges.filter((e) => e.relationship === "related_to" && (e.source === node.id || e.target === node.id))
          .map((e) => graphData.nodes.find((n) => n.id === (e.source === node.id ? e.target : e.source))?.label)
          .filter((l): l is string => Boolean(l))
      )],
      partOfLabels: [...new Set(edgesByRel("part_of"))],
    };
  }, [graphData.edges, graphData.nodes]);

  const fetchNodeExplanation = useCallback(async (node: ConceptNode, setActiveLoading = true) => {
    const cached = explanationCacheRef.current[node.id];
    if (cached) return cached;
    const existing = inFlightRef.current.get(node.id);
    if (existing) {
      if (setActiveLoading) setLoadingNodeId(node.id);
      try { return await existing; } finally { if (setActiveLoading) setLoadingNodeId((c) => c === node.id ? null : c); }
    }
    const promise = (async () => {
      const ctx = getNodeContext(node);
      try {
        const { data, error } = await supabase.functions.invoke("explain-concept", {
          body: { concept: node.label, description: node.description, group: (node as ConceptNode & { group?: string }).group, category: node.category, importance: node.importance, prerequisites: ctx.prerequisiteLabels, dependents: ctx.dependentLabels, dependsOn: ctx.dependsOnLabels, relatedConcepts: ctx.relatedLabels, partOf: ctx.partOfLabels, graphSize: graphData.nodes.length },
        });
        if (error) throw error;
        const text = typeof data?.explanation === "string" && data.explanation.trim() ? data.explanation.trim() : node.description;
        setNodeExplanations((prev) => prev[node.id] ? prev : { ...prev, [node.id]: text });
        return text;
      } catch (e) {
        console.error(e);
        setNodeExplanations((prev) => prev[node.id] ? prev : { ...prev, [node.id]: node.description });
        if (setActiveLoading) toast({ title: "AI explanation unavailable", description: "Showing default description.", variant: "destructive" });
        return node.description;
      } finally { inFlightRef.current.delete(node.id); }
    })();
    inFlightRef.current.set(node.id, promise);
    if (setActiveLoading) setLoadingNodeId(node.id);
    try { return await promise; } finally { if (setActiveLoading) setLoadingNodeId((c) => c === node.id ? null : c); }
  }, [getNodeContext, graphData.nodes.length]);

  const handleNodeClick = useCallback((node: ConceptNode) => {
    setSelectedNode(node);
    const deps = graphData.edges.filter((e) => e.source === node.id || e.target === node.id).flatMap((e) => [e.source, e.target]);
    setHighlightedNodes([...new Set([node.id, ...node.prerequisites, ...deps])]);
    if (!explanationCacheRef.current[node.id]) void fetchNodeExplanation(node, true);
  }, [fetchNodeExplanation, graphData.edges]);

  useEffect(() => {
    let cancelled = false;
    const warm = async () => { for (const node of graphData.nodes) { if (cancelled || explanationCacheRef.current[node.id]) continue; await fetchNodeExplanation(node, false); } };
    void warm();
    return () => { cancelled = true; };
  }, [fetchNodeExplanation, graphData.nodes]);

  const selectedExplanation = selectedNode ? nodeExplanations[selectedNode.id] || "" : "";
  const selectedNodeLoading = selectedNode ? loadingNodeId === selectedNode.id : false;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="h-screen flex bg-background overflow-hidden">
      {/* ── Sidebar ────────────────────────────────────────── */}
      <DashboardSidebar
        files={files} nodes={graphData.nodes} onNodeSelect={handleNodeClick}
        selectedNode={selectedNode?.id || null} theme={theme} onToggleTheme={toggleTheme}
      />

      {/* ── Main area: stats bar + graph + floating panel ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Stats bar */}
        <header className="h-12 flex items-center justify-between px-5 border-b border-border/60 sf-1 shrink-0 z-20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[13px]">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold text-foreground">{graphData.nodes.length}</span>
              <span className="text-muted-foreground">concepts</span>
            </div>
            <div className="w-px h-4 bg-border/60" />
            <div className="flex items-center gap-2 text-[13px]">
              <GitFork className="w-3.5 h-3.5 text-accent" />
              <span className="font-semibold text-foreground">{graphData.edges.length}</span>
              <span className="text-muted-foreground">connections</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onSignOut} className="text-muted-foreground hover:text-foreground text-xs gap-2 h-8 rounded-md hover:bg-secondary">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </Button>
        </header>

        {/* Graph canvas with generous padding */}
        <div className="flex-1 p-4">
          <KnowledgeGraph
            data={graphData} selectedNode={selectedNode?.id || null}
            highlightedNodes={highlightedNodes} onNodeClick={handleNodeClick} isDark={isDark}
          />
        </div>

        {/* ── Floating Insights Panel ─────────────────────── */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: 24, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.97 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="absolute top-14 right-5 bottom-5 w-[380px] z-30 glass-panel rounded-2xl overflow-hidden flex flex-col"
            >
              {/* Close button */}
              <button
                onClick={() => { setSelectedNode(null); setHighlightedNodes([]); }}
                className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <InsightsPanel
                selectedNode={selectedNode} graphData={graphData}
                explanation={selectedExplanation} loading={selectedNodeLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ChatPanel graphData={graphData} />
    </motion.div>
  );
}
