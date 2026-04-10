import { useState, useCallback } from "react";
import UploadScreen from "@/components/UploadScreen";
import ProcessingScreen from "@/components/ProcessingScreen";
import Dashboard from "@/components/Dashboard";
import type { UploadedFile, GraphData, AppState } from "@/types/graph";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { generateGraphFromSyllabusText } from "@/lib/graph-from-text";

async function extractTextFromPDF(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();

  try {
    const pdfjs = await import("pdfjs-dist");
    const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

    const loadingTask = pdfjs.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    const pages: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (pageText) pages.push(pageText);
    }

    const extracted = pages.join("\n").trim();
    if (extracted.length >= 40) return extracted;
  } catch (err) {
    console.warn("pdfjs extraction failed, using fallback parser", err);
  }

  // Fallback parser for PDFs where standard extraction fails.
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const raw = decoder.decode(bytes);
  const textChunks: string[] = [];
  const regex = /\(([^)]{2,})\)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    const chunk = match[1].replace(/\\n/g, " ").replace(/\\/g, "").trim();
    if (chunk.length > 1 && /[a-zA-Z]/.test(chunk)) textChunks.push(chunk);
  }

  const fallbackText = textChunks.join(" ").trim();
  if (fallbackText.length >= 20) return fallbackText;

  return `File: ${file.name}. Extractable text was limited (possibly image-based PDF).`;
}

export default function Index() {
  const { signOut } = useAuth();
  const [state, setState] = useState<AppState>("upload");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [processingStep, setProcessingStep] = useState(0);

  const handleGenerate = useCallback(async () => {
    if (files.length === 0) return;
    setState("processing");
    setProcessingStep(0);
    let combinedText = "";

    const stepInterval = setInterval(() => {
      setProcessingStep((s) => {
        if (s >= 3) { clearInterval(stepInterval); return 3; }
        return s + 1;
      });
    }, 2000);

    try {
      // Extract text from all PDFs
      setProcessingStep(0);
      const textParts = await Promise.all(files.map(async (f) => {
        try {
          const text = await extractTextFromPDF(f.file);
          return `--- ${f.name} ---\n${text}`;
        } catch {
          return `--- ${f.name} ---\n(Could not extract text)`;
        }
      }));

      combinedText = textParts.join("\n\n");
      setProcessingStep(1);

      // Send to AI for processing
      const { data, error } = await supabase.functions.invoke("process-syllabus", {
        body: {
          syllabusText: combinedText,
          fileNames: files.map((f) => f.name),
        },
      });

      clearInterval(stepInterval);

      if (error) {
        throw new Error(error.message || "Could not reach graph generation service");
      }

      if (data?.graph) {
        setProcessingStep(3);
        setGraphData(data.graph);
        await new Promise((r) => setTimeout(r, 800));
        setState("dashboard");
        return;
      }

      throw new Error("No graph data returned");
    } catch (e: any) {
      clearInterval(stepInterval);
      console.error("Processing error:", e);
      const fallbackGraph = generateGraphFromSyllabusText(
        combinedText || files.map((f) => f.name).join("\n"),
        files.map((f) => f.name)
      );
      setGraphData(fallbackGraph);
      setProcessingStep(3);
      toast({
        title: "Generated graph from extracted text",
        description: e?.message || "Server analysis was unavailable, so local extraction was used.",
      });
      await new Promise((r) => setTimeout(r, 500));
      setState("dashboard");
    }
  }, [files]);

  if (state === "processing") return <ProcessingScreen step={processingStep} />;
  if (state === "dashboard" && graphData) return <Dashboard files={files} graphData={graphData} onSignOut={signOut} />;
  return <UploadScreen files={files} onFilesChange={setFiles} onGenerate={handleGenerate} onSignOut={signOut} />;
}
