import { useCallback, useMemo, memo } from "react";
import ReactFlow, {
  Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  Handle, Position,
  type Node, type Edge, type NodeProps,
  MarkerType, ConnectionLineType, getBezierPath, type EdgeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import type { GraphData, ConceptNode } from "@/types/graph";

/* ═══ Color tokens ══════════════════════════════════════════════════════════ */

type NodeToken = { label: string; text: string; bg: string; fill: string; border: string; glow: string; gradFrom: string; gradTo: string; ring: string };

const DARK: Record<string, NodeToken> = {
  foundation:   { label: "Foundation",   text: "#e0e7ff", bg: "rgba(99,102,241,0.07)",  fill: "rgba(99,102,241,0.55)", border: "rgba(129,140,248,0.40)", glow: "rgba(99,102,241,0.30)", gradFrom: "#6366f1", gradTo: "#818cf8", ring: "rgba(99,102,241,0.25)" },
  intermediate: { label: "Intermediate", text: "#d1fae5", bg: "rgba(16,185,129,0.07)",  fill: "rgba(16,185,129,0.55)", border: "rgba(52,211,153,0.40)", glow: "rgba(16,185,129,0.30)", gradFrom: "#10b981", gradTo: "#34d399", ring: "rgba(16,185,129,0.25)" },
  advanced:     { label: "Advanced",     text: "#ffe4e6", bg: "rgba(244,63,94,0.07)",   fill: "rgba(244,63,94,0.55)",  border: "rgba(251,113,133,0.40)", glow: "rgba(244,63,94,0.30)", gradFrom: "#f43f5e", gradTo: "#fb7185", ring: "rgba(244,63,94,0.25)" },
};

const LIGHT: Record<string, NodeToken> = {
  foundation:   { label: "Foundation",   text: "#312e81", bg: "rgba(99,102,241,0.06)",  fill: "rgba(79,70,229,0.75)", border: "rgba(99,102,241,0.35)", glow: "rgba(99,102,241,0.18)", gradFrom: "#4f46e5", gradTo: "#6366f1", ring: "rgba(99,102,241,0.15)" },
  intermediate: { label: "Intermediate", text: "#064e3b", bg: "rgba(16,185,129,0.06)",  fill: "rgba(4,120,87,0.75)",  border: "rgba(5,150,105,0.35)", glow: "rgba(5,150,105,0.18)", gradFrom: "#047857", gradTo: "#059669", ring: "rgba(5,150,105,0.15)" },
  advanced:     { label: "Advanced",     text: "#881337", bg: "rgba(244,63,94,0.06)",   fill: "rgba(190,18,60,0.75)", border: "rgba(225,29,72,0.35)", glow: "rgba(225,29,72,0.18)", gradFrom: "#be123c", gradTo: "#e11d48", ring: "rgba(225,29,72,0.15)" },
};

const EDGES: Record<string, { dark: string; light: string; dash?: string; arrow: boolean; label: string }> = {
  prerequisite: { dark: "#818cf8", light: "#4338ca", arrow: true,  label: "prerequisite" },
  depends_on:   { dark: "#fbbf24", light: "#b45309", dash: "8 4", arrow: true,  label: "depends on" },
  related_to:   { dark: "#6ee7b7", light: "#047857", dash: "4 4", arrow: false, label: "related" },
  part_of:      { dark: "#86efac", light: "#15803d", dash: "10 3", arrow: true,  label: "part of" },
};

/* ═══ Custom Node ════════════════════════════════════════════════════════════ */

const ConceptNodeComponent = memo(({ data }: NodeProps) => {
  const { label, token, isSelected, isHighlighted, isDark, importance } = data as {
    label: string; token: NodeToken; isSelected: boolean; isHighlighted: boolean; isDark: boolean; importance: string;
  };
  const impColor = importance === "high" ? "#f43f5e" : importance === "medium" ? "#6366f1" : "#64748b";

  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !rounded-full !border-[1.5px] !bg-background" style={{ borderColor: token.border, opacity: 0.8 }} />
      <div style={{
        background: isSelected ? `linear-gradient(145deg, ${token.gradFrom}, ${token.gradTo})` : token.bg,
        border: `1px solid ${isSelected ? token.gradTo : isHighlighted ? token.border : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        borderRadius: "12px", padding: "10px 18px", minWidth: "120px", textAlign: "center", cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
        transform: isSelected ? "scale(1.05)" : isHighlighted ? "scale(1.02)" : "scale(1)",
        boxShadow: isSelected
          ? `0 0 32px ${token.glow}, 0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)`
          : isHighlighted
          ? `0 0 20px ${token.ring}, 0 4px 12px rgba(0,0,0,0.12)`
          : isDark ? "0 1px 4px rgba(0,0,0,0.25)" : "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        {/* Importance indicator */}
        <div className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full border-2" style={{ backgroundColor: impColor, borderColor: isDark ? "hsl(220,20%,4%)" : "hsl(220,14%,96%)", opacity: isSelected || isHighlighted ? 1 : 0.5 }} />

        {/* Label */}
        <div style={{ color: isSelected ? "#ffffff" : token.text, fontSize: "13px", fontWeight: 600, fontFamily: "Inter, system-ui", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
          {label}
        </div>

        {/* Category */}
        <div style={{ fontSize: "9px", fontWeight: 500, color: isSelected ? "rgba(255,255,255,0.65)" : token.text, opacity: isSelected ? 1 : 0.4, marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {token.label}
        </div>

        {/* Pulse ring on selected */}
        {isSelected && (
          <div className="absolute inset-0 rounded-[12px] pointer-events-none pulse-ring" />
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !rounded-full !border-[1.5px] !bg-background" style={{ borderColor: token.border, opacity: 0.8 }} />
    </>
  );
});
ConceptNodeComponent.displayName = "ConceptNode";

/* ═══ Custom Edge ════════════════════════════════════════════════════════════ */

const GlowEdge = memo(({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, style, markerEnd }: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const { label: edgeLabel, isActive, color, dash, isDark } = data as { label: string; isActive: boolean; color: string; dash?: string; isDark: boolean };
  const dimColor = `${color}${isDark ? "35" : "30"}`;

  return (
    <>
      {isActive && <path d={edgePath} fill="none" stroke={color} strokeWidth={5} strokeOpacity={0.10} strokeDasharray={dash} style={{ filter: "blur(3px)" }} />}
      <path id={id} d={edgePath} fill="none" stroke={isActive ? color : dimColor} strokeWidth={isActive ? 2 : 1.2} strokeDasharray={dash} strokeLinecap="round" style={{ ...style, transition: "stroke 0.2s, stroke-width 0.2s" }} markerEnd={markerEnd} />
      <foreignObject x={labelX - 36} y={labelY - 9} width={72} height={18} requiredExtensions="http://www.w3.org/1999/xhtml">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
          <span style={{
            fontSize: "8px", fontFamily: "Inter, system-ui", fontWeight: 600,
            color: isActive ? color : `${color}${isDark ? "55" : "60"}`,
            background: isDark ? "rgba(11,15,26,0.85)" : "rgba(244,247,250,0.9)",
            padding: "1px 5px", borderRadius: "3px",
            border: `1px solid ${color}${isActive ? "30" : "12"}`,
            whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            {edgeLabel}
          </span>
        </div>
      </foreignObject>
    </>
  );
});
GlowEdge.displayName = "GlowEdge";

const nodeTypes = { concept: ConceptNodeComponent };
const edgeTypes = { glow: GlowEdge };

/* ═══ Main Component ═════════════════════════════════════════════════════════ */

interface Props { data: GraphData; selectedNode: string | null; highlightedNodes: string[]; onNodeClick: (node: ConceptNode) => void; isDark: boolean; }

export default function KnowledgeGraph({ data, selectedNode, highlightedNodes, onNodeClick, isDark }: Props) {
  const T = isDark ? DARK : LIGHT;

  const initialNodes: Node[] = useMemo(() => {
    const colMap: Record<string, number> = { foundation: 0, intermediate: 1, advanced: 2 };
    const rows: Record<string, number> = {};
    return data.nodes.map((n) => {
      const col = colMap[n.category] ?? 1;
      const row = (rows[n.category] = (rows[n.category] || 0) + 1) - 1;
      return {
        id: n.id, type: "concept",
        position: { x: col * 380 + 80, y: row * 130 + 50 },
        data: { label: n.label, token: T[n.category] ?? T.foundation, isSelected: selectedNode === n.id, isHighlighted: highlightedNodes.includes(n.id), isDark, importance: n.importance },
      };
    });
  }, [data.nodes, selectedNode, highlightedNodes, T, isDark]);

  const initialEdges: Edge[] = useMemo(() =>
    data.edges.map((e) => {
      const et = EDGES[e.relationship] ?? EDGES.related_to;
      const isActive = highlightedNodes.includes(e.source) || highlightedNodes.includes(e.target);
      const color = isDark ? et.dark : et.light;
      return {
        id: e.id, source: e.source, target: e.target, type: "glow",
        animated: isActive && e.relationship === "prerequisite",
        markerEnd: et.arrow ? { type: MarkerType.ArrowClosed, width: 12, height: 12, color: isActive ? color : `${color}40` } : undefined,
        data: { label: et.label, isActive, color, dash: et.dash, isDark },
      };
    }), [data.edges, highlightedNodes, isDark]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const concept = data.nodes.find((n) => n.id === node.id);
    if (concept) onNodeClick(concept);
  }, [data.nodes, onNodeClick]);

  const graphBg = isDark ? "#070a14" : "#f4f7fa";
  const dotColor = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)";
  const mapBg = isDark ? "#0d1117" : "#ebeef2";
  const mapMask = isDark ? "rgba(7,10,20,0.88)" : "rgba(244,247,250,0.88)";

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-border/30 relative" style={{ background: graphBg }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView fitViewOptions={{ padding: 0.18 }}
        minZoom={0.15} maxZoom={3}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={dotColor} gap={24} size={1} />
        <Controls className="!rounded-lg !border-border/30 !shadow-lg [&>button]:!border-border/20 [&>button]:!text-muted-foreground [&>button]:!bg-card [&>button:hover]:!bg-secondary [&>button]:!w-7 [&>button]:!h-7" />
        <MiniMap
          nodeColor={(node) => { const t = node.data?.token as NodeToken | undefined; return t ? t.gradFrom : mapBg; }}
          maskColor={mapMask} className="!rounded-lg !border-border/30" style={{ background: mapBg }}
          pannable zoomable
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-3 left-14 glass-panel rounded-xl px-3.5 py-2.5 pointer-events-none select-none">
        <div className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1.5">Relationships</div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-1">
          {Object.entries(EDGES).map(([rel, et]) => {
            const c = isDark ? et.dark : et.light;
            return (
              <div key={rel} className="flex items-center gap-1.5">
                <svg width={18} height={6}><line x1={0} y1={3} x2={14} y2={3} stroke={c} strokeWidth={1.5} strokeDasharray={et.dash ?? "none"} />{et.arrow && <polygon points="14,0 18,3 14,6" fill={c} />}</svg>
                <span className="text-[9px] text-muted-foreground/50 font-medium capitalize">{rel.replace(/_/g, " ")}</span>
              </div>
            );
          })}
        </div>
        <div className="h-px bg-border/20 my-1.5" />
        <div className="flex gap-3">
          {Object.values(T).map((t) => (
            <div key={t.label} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: `linear-gradient(135deg, ${t.gradFrom}, ${t.gradTo})` }} />
              <span className="text-[8px] text-muted-foreground/40 font-medium">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
