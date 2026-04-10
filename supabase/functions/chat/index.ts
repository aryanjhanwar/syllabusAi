import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatRequest = {
  messages: ChatMessage[];
  /** Optional syllabus context — concepts extracted from the graph */
  syllabusContext?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, syllabusContext } = (await req.json()) as ChatRequest;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No messages provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({
          reply: "I'm sorry, the AI service is not configured. Please contact the administrator to set up the LOVABLE_API_KEY.",
          source: "fallback",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context-aware system prompt
    const syllabusSection = syllabusContext
      ? `\n\nThe user has uploaded a syllabus and the following concepts were extracted into a knowledge graph:\n${syllabusContext}\n\nUse this context to provide accurate, syllabus-specific answers when relevant. Reference specific concepts, prerequisites, and relationships from the graph when helpful.`
      : "";

    const systemPrompt = `You are SyllabusMap AI — an intelligent academic assistant built into a knowledge graph platform.

Your capabilities:
• Answer questions about academic concepts, subjects, and topics
• Explain syllabus content in simple, student-friendly language
• Help with exam preparation, study strategies, and learning paths
• Provide examples, analogies, and real-world applications for concepts
• Compare and contrast related topics
• Generate practice questions and quiz material
• Explain prerequisites and learning dependencies between topics

Your personality:
• Friendly, encouraging, and patient — like the best tutor a student could have
• Concise but thorough — aim for clear explanations, not walls of text
• Use simple language first, then introduce technical terms with definitions
• Break complex topics into digestible steps
• Use bullet points and structured formatting when it helps clarity

Rules:
• If asked about something outside the syllabus context, you can still help — you're a general academic AI
• Always be academically accurate
• When you don't know something, say so honestly
• Keep responses focused and avoid unnecessary filler
• Use markdown formatting: **bold** for emphasis, \`code\` for technical terms, bullet lists for steps${syllabusSection}`;

    // Prepare messages for the API
    const apiMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-20), // Keep last 20 messages for context window
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: apiMessages,
        temperature: 0.5,
        max_tokens: 1200,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("LLM API error:", response.status, errorBody);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            reply: "I'm receiving too many requests right now. Please wait a moment and try again.",
            source: "error",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          reply: "I encountered an issue processing your request. Please try again in a moment.",
          source: "error",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content;

    if (typeof content === "string" && content.trim().length > 0) {
      return new Response(
        JSON.stringify({ reply: content.trim(), source: "ai" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        reply: "I wasn't able to generate a response. Please try rephrasing your question.",
        source: "error",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(
      JSON.stringify({
        reply: "Something went wrong. Please try again.",
        source: "error",
        error: e instanceof Error ? e.message : "Unknown",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
