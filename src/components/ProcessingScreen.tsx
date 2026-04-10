import { motion } from "framer-motion";
import { Brain, Check } from "lucide-react";

const steps = [
  { label: "Extracting text from PDFs", icon: "📄" },
  { label: "Identifying key concepts", icon: "🔍" },
  { label: "Mapping relationships", icon: "🔗" },
  { label: "Building knowledge graph", icon: "✨" },
];

export default function ProcessingScreen({ step }: { step: number }) {
  return (
    <div className="min-h-screen gradient-bg mesh-bg flex items-center justify-center relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <motion.div animate={{ opacity: [0.12, 0.25, 0.12], scale: [1, 1.06, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-primary/12 blur-[120px]" />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 text-center max-w-sm">
        <div className="relative inline-flex mb-8">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Brain className="w-7 h-7 text-primary" />
          </motion.div>
        </div>

        <h2 className="text-xl font-bold text-foreground mb-1">Analyzing your syllabus</h2>
        <p className="text-xs text-muted-foreground/60 mb-7">AI is processing your documents…</p>

        <div className="space-y-2.5 text-left mx-auto w-fit">
          {steps.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: i <= step ? 1 : 0.3, x: 0 }} transition={{ delay: i * 0.08 }}
              className="flex items-center gap-2.5">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] shrink-0 border transition-all ${
                i < step ? "bg-accent/10 border-accent/25 text-accent" : i === step ? "bg-primary/10 border-primary/25 text-primary animate-pulse" : "surface-2 border-border/30 text-muted-foreground/50"
              }`}>
                {i < step ? <Check className="w-3 h-3" /> : s.icon}
              </div>
              <span className={`text-xs font-medium ${i < step ? "text-accent" : i === step ? "text-foreground" : "text-muted-foreground/50"}`}>{s.label}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-7 w-full h-1 surface-2 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, hsl(250,80%,64%), hsl(174,72%,52%))" }}
            initial={{ width: "0%" }} animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
        </div>
      </motion.div>
    </div>
  );
}
