import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { GraphData } from "@/types/graph";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Props {
  graphData: GraphData;
}

// ─── Markdown-lite renderer ──────────────────────────────────────────────────

function renderMarkdown(text: string) {
  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((para, pi) => {
    // Check if it's a bullet list
    const lines = para.split("\n");
    const isList = lines.every((l) => /^[\s]*[-•*]\s/.test(l) || l.trim() === "");
    if (isList) {
      return (
        <ul key={pi} className="list-disc list-inside space-y-0.5 my-1">
          {lines
            .filter((l) => l.trim())
            .map((l, li) => (
              <li key={li} className="text-xs leading-relaxed">
                {renderInline(l.replace(/^[\s]*[-•*]\s*/, ""))}
              </li>
            ))}
        </ul>
      );
    }
    return (
      <p key={pi} className="text-xs leading-relaxed mb-1.5 last:mb-0">
        {renderInline(para.replace(/\n/g, " "))}
      </p>
    );
  });
}

function renderInline(text: string) {
  // Handle **bold**, `code`, and *italic*
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`|\*(.+?)\*)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={keyIdx++} className="font-semibold text-foreground">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(
        <code key={keyIdx++} className="px-1 py-0.5 rounded bg-secondary/60 text-[10px] font-mono text-primary/90">
          {match[3]}
        </code>
      );
    } else if (match[4]) {
      parts.push(<em key={keyIdx++}>{match[4]}</em>);
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }
  return parts.length > 0 ? parts : text;
}

// ─── Quick Prompts ──────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "Explain the most important concept",
  "What should I study first?",
  "Create a quick quiz",
  "Summarize the syllabus",
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function ChatPanel({ graphData }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Build syllabus context string from graph data
  const syllabusContext = useCallback(() => {
    if (!graphData.nodes.length) return "";
    const conceptList = graphData.nodes
      .map((n) => {
        const prereqs = n.prerequisites.length
          ? ` (prerequisites: ${n.prerequisites.join(", ")})`
          : "";
        return `• ${n.label} [${n.category}, ${n.importance} importance]${prereqs}`;
      })
      .join("\n");

    const relationships = graphData.edges
      .slice(0, 30)
      .map((e) => {
        const src = graphData.nodes.find((n) => n.id === e.source)?.label || e.source;
        const tgt = graphData.nodes.find((n) => n.id === e.target)?.label || e.target;
        return `• ${src} → ${tgt} (${e.relationship.replace(/_/g, " ")})`;
      })
      .join("\n");

    return `Concepts:\n${conceptList}\n\nRelationships:\n${relationships}`;
  }, [graphData]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  // Handle scroll position to show/hide scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;
    setShowScrollBtn(!isNearBottom);
  }, []);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // ── Gemini API call with retry + model fallback ─────────────────────────────
  const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCzHi2IYlyF0X-AjfSvLxafMS0_cIOE9ZA";
  const GEMINI_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash-lite"];

  const callGemini = useCallback(
    async (apiMessages: { role: string; content: string }[], context: string) => {
      const syllabusSection = context
        ? `\n\nThe user has uploaded a syllabus and the following concepts were extracted into a knowledge graph:\n${context}\n\nUse this context to provide accurate, syllabus-specific answers when relevant.`
        : "";

      const systemInstruction = `You are SyllabusMap AI — an intelligent academic assistant built into a knowledge graph platform.

Your capabilities:
• Answer questions about ANY topic — academic, technical, general knowledge, coding, science, math, history, etc.
• Explain syllabus content in simple, student-friendly language
• Help with exam preparation, study strategies, and learning paths
• Provide examples, analogies, and real-world applications for concepts
• Compare and contrast related topics
• Generate practice questions and quiz material
• Help with coding, debugging, and technical concepts

Your personality:
• Friendly, encouraging, and patient — like the best tutor a student could have
• Concise but thorough — aim for clear explanations, not walls of text
• Use simple language first, then introduce technical terms with definitions
• Break complex topics into digestible steps

Rules:
• You can answer questions about ANY topic, not just the syllabus
• Always be academically accurate
• When you don't know something, say so honestly
• Use markdown formatting: **bold** for emphasis, \`code\` for technical terms, bullet lists for steps
• Keep responses focused and avoid unnecessary filler${syllabusSection}`;

      // Convert messages to Gemini format
      let contents = apiMessages.slice(-20).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      // Gemini requires the first message to be from "user"
      if (contents.length > 0 && contents[0].role !== "user") {
        contents = contents.filter((c) => c.role === "user" || c.role === "model");
        if (contents.length === 0 || contents[0].role !== "user") {
          contents = [{ role: "user", parts: [{ text: "Hello" }] }, ...contents];
        }
      }

      const requestBody = JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048, topP: 0.95, topK: 40 },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      });

      // Try each model with retries
      for (const model of GEMINI_MODELS) {
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
            console.log(`[Gemini] Model: ${model}, Attempt: ${attempt}`);

            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: requestBody,
            });

            if (response.status === 429) {
              console.warn(`[Gemini] Rate limited (429) on ${model}, attempt ${attempt}`);
              if (attempt < 3) {
                await new Promise((r) => setTimeout(r, 2000 * attempt)); // wait 2s, 4s
                continue;
              }
              break; // try next model
            }

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`[Gemini] Error ${response.status}:`, errorText);
              break; // try next model
            }

            const result = await response.json();
            const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (typeof text === "string" && text.trim()) {
              console.log(`[Gemini] Success with ${model}`);
              return text.trim();
            }

            if (result?.candidates?.[0]?.finishReason === "SAFETY") {
              return "I can't respond to that due to content safety policies. Please try rephrasing.";
            }

            console.warn(`[Gemini] Empty response from ${model}:`, JSON.stringify(result).slice(0, 200));
            break; // try next model
          } catch (fetchErr) {
            console.error(`[Gemini] Fetch error on ${model}:`, fetchErr);
            if (attempt < 3) {
              await new Promise((r) => setTimeout(r, 1500));
              continue;
            }
            break;
          }
        }
      }

      throw new Error("All Gemini models failed");
    },
    [GEMINI_KEY]
  );

  // ── Send message — Gemini primary, edge function fallback ─────────────────
  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const context = syllabusContext();

      try {
        let reply: string | null = null;

        // Strategy 1: Gemini API (primary)
        try {
          reply = await callGemini(apiMessages, context);
        } catch (geminiError) {
          console.warn("Gemini API failed:", geminiError);
        }

        // Strategy 2: Supabase edge function (fallback)
        if (!reply) {
          try {
            const { data, error } = await supabase.functions.invoke("chat", {
              body: { messages: apiMessages, syllabusContext: context },
            });
            if (error) throw error;
            if (typeof data?.reply === "string" && data.reply.trim()) {
              reply = data.reply;
            }
          } catch (edgeFnError) {
            console.warn("Edge function also failed:", edgeFnError);
          }
        }

        if (!reply) {
          reply = "I'm sorry, I couldn't connect to the AI service. Please check that your VITE_GEMINI_API_KEY is set correctly in the .env file.";
        }

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (e) {
        console.error("Chat error:", e);
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, syllabusContext, callGemini]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <>
      {/* ── Floating trigger button ──────────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-shadow"
            aria-label="Open AI Chat"
          >
            <MessageSquare className="w-6 h-6" />
            {/* Notification dot */}
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent border-2 border-background" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat window ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-5 right-5 z-50 w-[400px] h-[580px] rounded-2xl border border-border/40 flex flex-col overflow-hidden glass-panel"
          >
            {/* ── Header ─────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground leading-tight">SyllabusMap AI</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-destructive transition-colors"
                    title="Clear chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Messages area ──────────────────────────── */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            >
              {/* Welcome state */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center pt-8 pb-4"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/15 mb-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground mb-1">How can I help you?</h4>
                  <p className="text-[11px] text-muted-foreground mb-5 max-w-[260px] mx-auto leading-relaxed">
                    Ask me anything about your syllabus, concepts, exam prep, or study strategies.
                  </p>

                  {/* Quick prompts */}
                  <div className="space-y-1.5">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="w-full text-left px-3 py-2 rounded-xl bg-secondary/40 border border-border/30 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:border-primary/20 transition-all"
                      >
                        <span className="text-primary mr-1.5">→</span>
                        {prompt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Message bubbles */}
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i === messages.length - 1 ? 0.05 : 0 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      msg.role === "user"
                        ? "bg-primary/15 border border-primary/20"
                        : "bg-accent/12 border border-accent/20"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="w-3 h-3 text-primary" />
                    ) : (
                      <Bot className="w-3 h-3 text-accent" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 ${
                      msg.role === "user"
                        ? "bg-primary/15 border border-primary/20 text-foreground"
                        : "bg-secondary/50 border border-border/30 text-foreground/90"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose-sm">{renderMarkdown(msg.content)}</div>
                    ) : (
                      <p className="text-xs leading-relaxed">{msg.content}</p>
                    )}
                    <div className="text-[9px] text-muted-foreground/40 mt-1 text-right">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2.5"
                >
                  <div className="w-6 h-6 rounded-lg bg-accent/12 border border-accent/20 flex items-center justify-center shrink-0">
                    <Bot className="w-3 h-3 text-accent" />
                  </div>
                  <div className="bg-secondary/50 border border-border/30 rounded-xl px-3 py-2.5 flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                    <span className="text-[11px] text-muted-foreground">Thinking…</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll-to-bottom button */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-[70px] left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-secondary border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground shadow-lg transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* ── Input area ─────────────────────────────── */}
            <div className="border-t border-border/30 px-3 py-2.5">
              <div className="flex items-end gap-2 bg-secondary/30 border border-border/30 rounded-xl px-3 py-2 focus-within:border-primary/30 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your syllabus…"
                  rows={1}
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none resize-none max-h-[120px] leading-relaxed"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="p-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 disabled:opacity-30 disabled:hover:bg-primary/15 transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-1.5 px-1">
                <span className="text-[9px] text-muted-foreground/30">Powered by AI</span>
                <span className="text-[9px] text-muted-foreground/30">Shift+Enter for new line</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
