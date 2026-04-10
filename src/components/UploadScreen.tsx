import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileText, Sparkles, Brain, Network, LogOut, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UploadedFile } from "@/types/graph";

interface Props {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onGenerate: () => void;
  onSignOut: () => void;
}

export default function UploadScreen({ files, onFilesChange, onGenerate, onSignOut }: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      const remaining = 5 - files.length;
      const newFiles = accepted.slice(0, remaining).map((f) => ({
        id: crypto.randomUUID(), name: f.name, size: f.size, file: f,
      }));
      onFilesChange([...files, ...newFiles]);
    },
    [files, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 5 - files.length,
    disabled: files.length >= 5,
  });

  const removeFile = (id: string) => onFilesChange(files.filter((f) => f.id !== id));
  const fmtSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="min-h-screen gradient-bg mesh-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Sign out */}
      <div className="fixed top-5 right-6 z-20">
        <Button variant="ghost" size="sm" onClick={onSignOut} className="text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-lg gap-1.5 text-xs">
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </Button>
      </div>

      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/[0.06] blur-[140px] animate-float" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent/[0.04] blur-[160px] animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card mb-6">
            <Brain className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase">AI-Powered Knowledge Mapping</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.08] mb-4">
            <span className="gradient-text">Turn Syllabi into</span><br />
            <span className="text-foreground">Smart Learning Maps</span>
          </h1>
          <p className="text-sm text-muted-foreground/70 max-w-md mx-auto leading-relaxed">
            Upload your PDFs and let AI build interactive knowledge graphs with concepts, relationships, and learning paths.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {[
            { icon: Network, label: "Knowledge Graph", c: "text-primary" },
            { icon: Sparkles, label: "AI Insights", c: "text-accent" },
            { icon: Zap, label: "Learning Paths", c: "text-yellow-400" },
          ].map(({ icon: I, label, c }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md surface-2 border border-border/30 text-[10px] font-medium text-muted-foreground/70">
              <I className={`w-3 h-3 ${c}`} /> {label}
            </div>
          ))}
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`glass-strong rounded-2xl p-8 text-center cursor-pointer card-interactive ${isDragActive ? "border-primary/40 glow-md" : ""} ${files.length >= 5 ? "opacity-40 pointer-events-none" : ""}`}
        >
          <input {...getInputProps()} />
          <motion.div animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/15 mb-3">
            <Upload className="w-5 h-5 text-primary" />
          </motion.div>
          <p className="font-semibold text-foreground text-sm mb-0.5">{isDragActive ? "Drop here" : "Drag & drop PDF files"}</p>
          <p className="text-[11px] text-muted-foreground/50">or click to browse • Max 5 files</p>
        </div>

        {/* File list */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2.5 space-y-1.5">
              {files.map((f, i) => (
                <motion.div key={f.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="glass-card rounded-xl px-3.5 py-2.5 flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-primary/8 border border-primary/12 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-primary/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-foreground/90">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground/40">{fmtSize(f.size)}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                    className="p-1 rounded-md hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100">
                    <X className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-destructive" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4">
          <Button onClick={onGenerate} disabled={files.length === 0}
            className="w-full h-12 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground glow-btn disabled:opacity-30 disabled:shadow-none">
            <Sparkles className="w-4 h-4 mr-2" /> Generate Knowledge Graph <ChevronRight className="w-4 h-4 ml-1 opacity-50" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
