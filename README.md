<![CDATA[<div align="center">

# 🧠 SyllabusMap

### AI-Powered Knowledge Graph & Learning Assistant

**Transform university syllabi into interactive, intelligent knowledge maps**

[![Built with React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Powered by Supabase](https://img.shields.io/badge/Supabase-Edge_Functions-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Styled with Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

---

*Upload a PDF syllabus → AI extracts concepts → Interactive knowledge graph → Personalized AI tutor*

</div>

---

## 📑 Table of Contents

1.  [Overview](#overview)
2.  [Key Features](#key-features)
3.  [Screenshots](#screenshots)
4.  [Architecture](#architecture)
5.  [Technology Stack](#technology-stack)
6.  [Project Structure](#project-structure)
7.  [Getting Started](#getting-started)
8.  [Environment Variables](#environment-variables)
9.  [Application Flow](#application-flow)
10. [Frontend Deep Dive](#frontend-deep-dive)
11. [Design System](#design-system)
12. [Component Reference](#component-reference)
13. [Backend Deep Dive](#backend-deep-dive)
14. [AI Pipeline](#ai-pipeline)
15. [Knowledge Graph Engine](#knowledge-graph-engine)
16. [AI Chatbot](#ai-chatbot)
17. [Authentication](#authentication)
18. [Theme System](#theme-system)
19. [Type System](#type-system)
20. [State Management](#state-management)
21. [PDF Processing](#pdf-processing)
22. [Error Handling & Fallbacks](#error-handling--fallbacks)
23. [Performance Optimizations](#performance-optimizations)
24. [Accessibility](#accessibility)
25. [Testing](#testing)
26. [Deployment](#deployment)
27. [Troubleshooting](#troubleshooting)
28. [Contributing](#contributing)
29. [License](#license)

---

## Overview

**SyllabusMap** is a full-stack, AI-driven web application that converts university course syllabi (PDF files) into interactive, explorable knowledge graphs. It uses a multi-pass chain-of-thought AI reasoning pipeline to extract academic concepts, classify them by difficulty and importance, infer relationships between them, and present the result as a beautiful, interactive graph with an integrated AI tutor chatbot.

### What Problem Does It Solve?

University students often receive dense, text-heavy syllabi that are difficult to navigate. SyllabusMap solves this by:

1.  **Visualizing the curriculum** as an interactive node-link graph — students can see how topics connect.
2.  **Classifying concepts** into Foundation, Intermediate, and Advanced tiers — students know what to learn first.
3.  **Highlighting prerequisites** — students understand learning dependencies before exams.
4.  **Providing AI explanations** — every concept gets a structured AI summary (Definition, Intuition, Connections, Study Tips).
5.  **Offering a personal AI tutor** — a context-aware chatbot that knows the uploaded syllabus and can answer questions, generate quizzes, and suggest study strategies.

### Who Is It For?

-   **University students** preparing for exams or planning study schedules.
-   **Professors and TAs** who want to visualize and validate their curriculum structure.
-   **Self-learners** who want to map out a learning path from a course outline.
-   **EdTech developers** building on top of AI-driven curriculum analysis.

---

## Key Features

### 🗺️ Interactive Knowledge Graph
-   **Custom node components** with gradient fills, category icons, and importance indicators.
-   **Custom edge components** with glow effects, directional arrows, and always-visible labels.
-   **Three-column layout** grouping nodes by difficulty: Foundation → Intermediate → Advanced.
-   **Click-to-select** with highlight propagation to connected nodes.
-   **Drag, zoom, and pan** with smooth animations via React Flow.
-   **Interactive minimap** for navigation in large graphs.
-   **Comprehensive legend** showing both relationship types and node categories.

### 🤖 AI-Powered Concept Extraction
-   **6-step chain-of-thought reasoning pipeline**: Subject Detection → Concept Extraction → Category Classification → Importance Rating → Relationship Inference → Deduplication.
-   **Structured function calling** via OpenAI-compatible tool use (not raw text parsing).
-   **Robust sanitization layer** that validates, deduplicates, and normalizes AI output.
-   **Graceful fallback** to local NLP-based extraction if AI is unavailable.

### 💬 AI Chatbot (SyllabusMap AI)
-   **Context-aware**: The chatbot receives all extracted concepts, relationships, and graph structure as context.
-   **Academic tutor personality**: Friendly, patient, encouraging — explains complex topics simply.
-   **Capabilities**: Concept explanations, exam prep, quiz generation, study strategies, prerequisite analysis.
-   **Markdown rendering**: Bold, italic, inline code, and bullet lists in responses.
-   **Quick prompts**: Pre-built buttons for common questions.
-   **Conversation history**: Maintains up to 20 messages for context continuity.

### 📊 AI Insights Panel
-   **Structured AI summaries** with 4 sections: 📌 Definition, 💡 Intuition, 🔗 Connections, 📝 Study Tips.
-   **Relationship chips**: Visual display of prerequisites, dependents, related concepts.
-   **Learning path indicator**: Shows current concept's position in Foundation → Intermediate → Advanced.
-   **Category and importance badges** with color-coded styling.

### 🎨 Premium Design System
-   **Dark mode (default)** with Slate Navy base, Indigo-Violet primary, Cyan-Teal accent.
-   **Light mode** with clean white surfaces, deep blue/green/red node colors.
-   **Theme toggle** (🌙/☀️) persisted to localStorage.
-   **Glassmorphism** effects with backdrop-filter blur and saturation boost.
-   **3-tier surface elevation** system for visual depth.
-   **Glow system** (sm/md/lg) for interactive feedback.
-   **Inter font** with OpenType features for premium typography.

### 🔐 Authentication
-   **Supabase Auth** with email/password.
-   **Protected routes** via `RequireAuth` HOC.
-   **Session persistence** across page reloads.
-   **Graceful loading states** with branded spinner.

### 📄 PDF Processing
-   **Primary extraction**: `pdfjs-dist` for standards-compliant PDF text extraction.
-   **Fallback parser**: Raw byte-level regex extraction for non-standard PDFs.
-   **Multi-file support**: Upload and process up to 5 PDFs simultaneously.
-   **Drag and drop** upload with visual feedback.

---

## Screenshots

| Screen | Description |
|--------|-------------|
| **Upload Screen** | Glassmorphic drag-and-drop zone with ambient gradient background |
| **Processing Screen** | Step-by-step progress animation with gradient progress bar |
| **Dashboard** | 3-panel layout: Sidebar + Knowledge Graph + Insights Panel |
| **Knowledge Graph** | Custom nodes with gradients, glow edges, interactive minimap |
| **AI Chat** | Floating ChatGPT-style panel with markdown rendering |
| **Login/Signup** | Glass forms with ambient orbs on dark gradient background |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           BROWSER (Client)                          │
│                                                                      │
│  ┌─────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │  Upload  │→│  Processing  │→│  Dashboard  │  │   Chat Panel  │  │
│  │  Screen  │  │    Screen    │  │  (3-panel)  │  │   (floating)  │  │
│  └─────────┘  └──────┬───────┘  └──────┬─────┘  └───────┬───────┘  │
│                      │                 │                 │          │
│               ┌──────▼─────┐   ┌───────▼──────┐  ┌──────▼───────┐  │
│               │ PDF.js     │   │ React Flow   │  │ Markdown     │  │
│               │ Extraction │   │ (Graph)      │  │ Renderer     │  │
│               └──────┬─────┘   └──────────────┘  └──────────────┘  │
│                      │                                              │
│  ┌───────────────────▼──────────────────────────────────────────┐   │
│  │               graph-from-text.ts (Local Fallback)            │   │
│  │  extractConcepts() → buildEdges() → generateGraphFromText()  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────────────┘
                           │  Supabase Client SDK
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend / Edge Functions)               │
│                                                                      │
│  ┌─────────────────────┐  ┌────────────────────┐  ┌──────────────┐  │
│  │  process-syllabus   │  │  explain-concept   │  │    chat      │  │
│  │  (623 lines)        │  │  (AI summaries)    │  │  (AI tutor)  │  │
│  │                     │  │                    │  │              │  │
│  │  • 6-step CoT AI    │  │  • 4-section       │  │  • Context-  │  │
│  │  • Function calling │  │    structured       │  │    aware     │  │
│  │  • Sanitization     │  │    output           │  │  • 20-msg    │  │
│  │  • Local fallback   │  │  • Fallback to      │  │    history   │  │
│  │                     │  │    description       │  │  • Markdown  │  │
│  └─────────┬───────────┘  └─────────┬──────────┘  └──────┬───────┘  │
│            │                        │                     │          │
│            └────────────────────────┼─────────────────────┘          │
│                                     │                                │
│                          ┌──────────▼──────────┐                    │
│                          │   Lovable AI API    │                    │
│                          │   (LLM Gateway)     │                    │
│                          └─────────────────────┘                    │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1.  **Upload**: User drops PDF file(s) into the upload zone.
2.  **Extract**: `pdfjs-dist` extracts text from each PDF page. Raw byte fallback if standard parsing fails.
3.  **Process**: Combined text is sent to the `process-syllabus` Supabase Edge Function.
4.  **AI Analysis**: The Edge Function runs a 6-step chain-of-thought prompt via function calling.
5.  **Sanitize**: Raw AI JSON output is validated, deduplicated, and normalized into a clean `GraphData` object.
6.  **Fallback**: If AI fails, local `graph-from-text.ts` extracts concepts using regex + stop-word filtering.
7.  **Render**: The sanitized `GraphData` is rendered as an interactive graph via custom React Flow components.
8.  **Explain**: When a node is clicked, `explain-concept` generates a 4-section AI summary.
9.  **Chat**: The floating chatbot receives all graph context and answers syllabus-specific questions.

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3 | UI framework with hooks-based architecture |
| **TypeScript** | 5.8 | Static typing for all components and utilities |
| **Vite** | 5.4 | Build tool with SWC for fast compilation |
| **React Flow** | 11.11 | Interactive graph rendering with custom nodes/edges |
| **Framer Motion** | 12.38 | Animations for page transitions and micro-interactions |
| **Tailwind CSS** | 3.4 | Utility-first styling with custom design tokens |
| **Lucide React** | 1.8 | Icon library (consistent line icons) |
| **React Dropzone** | 15.0 | File drag-and-drop upload |
| **pdfjs-dist** | 5.6 | Client-side PDF text extraction |
| **React Router DOM** | 6.30 | Client-side routing |
| **React Query** | 5.83 | Server state management |
| **Radix UI** | Various | Accessible headless UI primitives |

### Backend

| Technology | Purpose |
|-----------|---------|
| **Supabase** | Authentication, Edge Functions, and project infrastructure |
| **Deno** | Runtime for Supabase Edge Functions |
| **Lovable AI API** | LLM gateway for AI-powered graph generation and chat |

### Dev Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting with React hooks rules |
| **Vitest** | Unit testing framework |
| **Playwright** | End-to-end browser testing |
| **PostCSS + Autoprefixer** | CSS processing pipeline |

---

## Project Structure

```
syllabus-ai-mapper/
│
├── index.html                     # Entry HTML with meta tags and font imports
├── package.json                   # Dependencies and scripts
├── vite.config.ts                 # Vite configuration with path aliases
├── tailwind.config.ts             # Tailwind design tokens and animations
├── tsconfig.json                  # TypeScript base config
├── tsconfig.app.json              # App-specific TS config with path aliases
├── tsconfig.node.json             # Node/Vite TS config
├── postcss.config.js              # PostCSS with Tailwind and autoprefixer
├── eslint.config.js               # ESLint flat config
├── vitest.config.ts               # Test runner config
├── playwright.config.ts           # E2E test config
├── components.json                # shadcn/ui component configuration
├── .env                           # Environment variables (Supabase keys)
│
├── public/                        # Static assets served at root
│
├── src/                           # Application source code
│   ├── main.tsx                   # React DOM entry point
│   ├── App.tsx                    # Root component with routing
│   ├── App.css                    # Global app styles (minimal)
│   ├── index.css                  # Design system: CSS variables, glass, gradients, glows
│   ├── vite-env.d.ts              # Vite type declarations
│   │
│   ├── components/                # React components
│   │   ├── Dashboard.tsx          # Main 3-panel dashboard layout
│   │   ├── DashboardSidebar.tsx   # Left sidebar: files, search, filters, concept list
│   │   ├── KnowledgeGraph.tsx     # Interactive graph with custom nodes and edges
│   │   ├── InsightsPanel.tsx      # Right panel: AI summaries, relationships, learning path
│   │   ├── ChatPanel.tsx          # Floating AI chatbot widget
│   │   ├── UploadScreen.tsx       # Landing page with PDF upload zone
│   │   ├── ProcessingScreen.tsx   # Step-by-step processing animation
│   │   ├── NavLink.tsx            # Navigation link component
│   │   └── ui/                    # shadcn/ui primitives (Button, Input, Label, etc.)
│   │
│   ├── pages/                     # Route-level page components
│   │   ├── Index.tsx              # Main page: upload → process → dashboard state machine
│   │   ├── Login.tsx              # Login form with Supabase auth
│   │   ├── Signup.tsx             # Registration form
│   │   └── NotFound.tsx           # 404 page
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.tsx            # Authentication state + RequireAuth guard
│   │   ├── use-theme.ts           # Dark/light theme toggle with localStorage
│   │   ├── use-toast.ts           # Toast notification system
│   │   └── use-mobile.tsx         # Responsive breakpoint detection
│   │
│   ├── lib/                       # Utility libraries
│   │   ├── graph-from-text.ts     # Local fallback: extract concepts from text without AI
│   │   ├── mock-data.ts           # Sample graph data for development
│   │   └── utils.ts               # General utilities (cn classname merger)
│   │
│   ├── types/                     # TypeScript type definitions
│   │   └── graph.ts               # ConceptNode, ConceptEdge, GraphData, UploadedFile, AppState
│   │
│   ├── integrations/              # Third-party service integrations
│   │   └── supabase/              # Supabase client configuration
│   │
│   └── test/                      # Test files
│
└── supabase/                      # Supabase project configuration
    └── functions/                 # Edge Functions (Deno runtime)
        ├── process-syllabus/      # AI graph generation (623 lines)
        │   └── index.ts
        ├── explain-concept/       # AI concept explanations
        │   └── index.ts
        └── chat/                  # AI chatbot endpoint (147 lines)
            └── index.ts
```

---

## Getting Started

### Prerequisites

-   **Node.js** 18+ (LTS recommended)
-   **npm** 9+ or **bun** 1.0+
-   **Supabase account** (free tier works)
-   **Supabase CLI** for Edge Function deployment

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/syllabus-ai-mapper.git
cd syllabus-ai-mapper

# 2. Install dependencies
npm install

# 3. Set up environment variables (see next section)
cp .env.example .env

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:8080` (or the port Vite assigns).

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Vite dev server with HMR |
| `build` | `npm run build` | Production build to `dist/` |
| `build:dev` | `npm run build:dev` | Development build (no minification) |
| `preview` | `npm run preview` | Preview production build locally |
| `lint` | `npm run lint` | Run ESLint |
| `test` | `npm run test` | Run Vitest unit tests |
| `test:watch` | `npm run test:watch` | Run tests in watch mode |

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Edge Function Environment (set in Supabase dashboard)
LOVABLE_API_KEY=your-lovable-api-key-here
```

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | `.env` (client) | Supabase project URL for auth and function invocation |
| `VITE_SUPABASE_ANON_KEY` | `.env` (client) | Supabase anonymous key for client SDK |
| `LOVABLE_API_KEY` | Supabase Secrets | API key for the Lovable AI gateway (used in Edge Functions) |

> **Important**: `LOVABLE_API_KEY` must be set as a Supabase Secret, not in the `.env` file. Set it via:
> ```bash
> supabase secrets set LOVABLE_API_KEY=your-key-here
> ```

---

## Application Flow

SyllabusMap operates as a **state machine** with three states managed in `src/pages/Index.tsx`:

```
┌──────────┐    Generate    ┌─────────────┐    Complete    ┌───────────┐
│  upload   │──────────────→│  processing  │──────────────→│ dashboard │
│           │               │              │               │           │
│ Upload    │               │ Extract text │               │ Graph +   │
│ PDF files │               │ + AI process │               │ Insights  │
└──────────┘               └──────┬───────┘               └───────────┘
                                  │
                            On Error: fallback
                            to local extraction
                            then → dashboard
```

### State: `upload`
-   **Component**: `UploadScreen`
-   **Actions**: Drag-and-drop or click to select PDF files (max 5).
-   **Transition**: Click "Generate Knowledge Graph" → `processing`.

### State: `processing`
-   **Component**: `ProcessingScreen`
-   **Actions**: Automatic — displays 4-step progress animation.
-   **Steps**: Extracting text → Identifying concepts → Mapping relationships → Building graph.
-   **Transition**: On completion → `dashboard`. On error → fallback graph → `dashboard`.

### State: `dashboard`
-   **Component**: `Dashboard`
-   **Layout**: 3-panel grid (Sidebar 270px + Graph flex-1 + Insights 370px).
-   **Interactions**: Click nodes, search concepts, filter by category, chat with AI.

---

## Frontend Deep Dive

### Page Components

#### `Index.tsx` — Main Application Page
-   **Location**: `src/pages/Index.tsx` (140 lines)
-   **Role**: State machine controller. Manages the `upload → processing → dashboard` flow.
-   **Key logic**:
    -   `extractTextFromPDF(file)`: Uses `pdfjs-dist` for primary extraction, falls back to regex byte parsing.
    -   `handleGenerate()`: Orchestrates the full pipeline — extract text, call `process-syllabus`, handle errors.
    -   Passes `signOut` from `useAuth()` to child components.

#### `Login.tsx` — Authentication Login
-   **Location**: `src/pages/Login.tsx` (65 lines)
-   **Features**: Email/password form, glassmorphic card, ambient gradient background, link to signup.
-   **Auth**: `supabase.auth.signInWithPassword()` → redirect to `/` on success.

#### `Signup.tsx` — User Registration
-   **Location**: `src/pages/Signup.tsx` (80 lines)
-   **Features**: Email, password, confirm password. Password minimum 6 characters.
-   **Auth**: `supabase.auth.signUp()` with email redirect → navigate to `/login`.

#### `NotFound.tsx` — 404 Page
-   **Location**: `src/pages/NotFound.tsx`
-   **Simple**: Centered message with link back to home.

---

## Design System

The design system is defined in `src/index.css` and uses CSS custom properties for full theme support.

### Color Palette

#### Dark Mode (Default)

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--background` | `222 47% 6%` | Page background — deep slate navy |
| `--foreground` | `210 40% 96%` | Primary text — near-white |
| `--surface-1` | `222 40% 9%` | Sidebar and panel backgrounds |
| `--surface-2` | `222 35% 12%` | Cards, inputs, elevated surfaces |
| `--surface-3` | `222 30% 16%` | Hover states, active surfaces |
| `--primary` | `250 80% 64%` | Indigo-violet — CTAs, selected states |
| `--accent` | `174 72% 52%` | Cyan-teal — secondary highlights |
| `--muted-foreground` | `215 15% 50%` | Secondary text |
| `--border` | `222 20% 18%` | Subtle borders |

#### Light Mode

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--background` | `220 20% 97%` | Off-white background |
| `--foreground` | `222 47% 11%` | Dark text |
| `--surface-1` | `0 0% 100%` | Pure white panels |
| `--surface-2` | `220 16% 96%` | Slightly tinted cards |
| `--primary` | `250 80% 58%` | Deeper indigo for contrast |
| `--accent` | `174 72% 40%` | Deeper teal for contrast |

### Glass Effects

Three glass variants with increasing intensity:

```css
.glass          /* blur(16px) saturate(160%) — floating cards */
.glass-strong   /* blur(24px) saturate(180%) — modals, forms */
.glass-card     /* blur(12px) + inset highlight — info cards */
```

### Glow System

```css
.glow-sm     /* 12px, 10% opacity — subtle hover */
.glow-md     /* 24px + 8px — active elements */
.glow-lg     /* 40px + 12px — selected nodes */
.glow-btn    /* 20px + lift → hover: 32px + translateY(-1px) */
.glow-accent /* 20px teal glow */
```

### Typography

-   **Font**: Inter (loaded from Google Fonts)
-   **OpenType features**: `cv02`, `cv03`, `cv04`, `cv11` for improved readability
-   **Scale**: 9px (labels) → 10px (chips) → 11px (small body) → 12-13px (body) → 14px (UI) → 18-20px (headers) → 40px (hero)
-   **Weights**: 400 (regular) → 500 (medium) → 600 (semibold) → 700 (bold) → 800 (extrabold)

### Animations

Defined in `tailwind.config.ts`:

| Animation | Duration | Use |
|-----------|----------|-----|
| `accordion-down/up` | 0.2s ease-out | Collapsible sections |
| `pulse-glow` | 2s infinite | Pulsing glow effect |
| `float` | 3s infinite | Floating ambient orbs |

---

## Component Reference

### `Dashboard.tsx`
-   **Lines**: ~160
-   **Props**: `files`, `graphData`, `onSignOut`
-   **State**: `selectedNode`, `nodeExplanations`, `loadingNodeId`, `highlightedNodes`
-   **Theme**: Uses `useTheme()` hook, passes `theme` and `toggleTheme` to sidebar
-   **AI Warm-up**: On mount, pre-fetches explanations for all nodes in background
-   **Caching**: Uses `explanationCacheRef` (ref) to avoid duplicate API calls. Uses `inFlightRef` to deduplicate concurrent requests for the same node.

### `DashboardSidebar.tsx`
-   **Lines**: ~170
-   **Features**:
    -   **Brand header** with SyllabusMap logo + theme toggle button (☀️/🌙)
    -   **Files section** (collapsible) showing uploaded PDF names with file icons
    -   **Search bar** for filtering concepts by name
    -   **Category filters** with colored dots and count badges (Foundation/Intermediate/Advanced)
    -   **Concept list** with active state highlighting, importance badges, and category indicators
    -   **Footer** showing total/filtered concept counts

### `KnowledgeGraph.tsx`
-   **Lines**: ~500
-   **Custom Components**:
    -   `ConceptNodeComponent`: Gradient fills, category emoji, importance dot, styled handles, inner glow ring
    -   `GlowEdge`: Blurred glow path behind active edges, directional arrows, pill-shaped label badges
-   **Color System**:
    -   **Dark mode**: Bright vivid colors (white text, high-opacity fills) for maximum visibility
    -   **Light mode**: Deep dark/blue colors (dark text, saturated borders) for contrast
-   **Always-visible edges**: Inactive edges show their relationship color at 25% opacity (not invisible gray)
-   **Edge labels**: Always rendered with background pill and subtle border

### `InsightsPanel.tsx`
-   **Lines**: ~195
-   **Sections**:
    -   **Header**: Concept name (20px bold), category badge, importance badge, group badge
    -   **AI Summary**: Parsed into 4 color-coded cards (Definition, Intuition, Connections, Study Tips)
    -   **Relationships**: Chip-based lists for Prerequisites, Leads To, Depends On, Related To, Part Of
    -   **Learning Path**: 3-step stepper (Foundation → Intermediate → Advanced) with active highlight

### `ChatPanel.tsx`
-   **Lines**: ~454
-   **Architecture**:
    -   Floating trigger button (bottom-right) with notification dot
    -   Animated chat window (400×580px) with header, messages, and input area
    -   Welcome state with 4 quick prompt buttons
    -   Message bubbles with user/assistant avatars and timestamps
    -   Auto-resizing textarea with Shift+Enter for new lines
    -   Scroll-to-bottom button when scrolled up
    -   Clear chat functionality
-   **Context Injection**: Builds a summary string from `graphData.nodes` and `graphData.edges` containing concept names, categories, importance levels, prerequisites, and relationships. This context is sent to the `chat` Edge Function with every message.
-   **Markdown Rendering**: Custom `renderMarkdown()` function handling `**bold**`, `` `code` ``, `*italic*`, and bullet lists.

### `UploadScreen.tsx`
-   **Lines**: ~130
-   **Layout**: Centered hero with gradient background, mesh orbs, and floating particles
-   **Dropzone**: Glassmorphic card with `react-dropzone`. Accepts `.pdf` files, max 5.
-   **File Cards**: Animated list with file icon, name, size, and hover-reveal remove button
-   **CTA**: Purple "Generate Knowledge Graph" button with `glow-btn` effect

### `ProcessingScreen.tsx`
-   **Lines**: ~65
-   **Steps**: 4 animated steps with check/pending icons:
    1.  📄 Extracting text from PDFs
    2.  🔍 Identifying key concepts
    3.  🔗 Mapping relationships
    4.  ✨ Building knowledge graph
-   **Progress Bar**: Indigo→Teal gradient, width animated from 0% to 100%
-   **Brain Icon**: Rotating animation during processing

---

## Backend Deep Dive

### Edge Function: `process-syllabus`
-   **Location**: `supabase/functions/process-syllabus/index.ts` (623 lines)
-   **Endpoint**: `POST /functions/v1/process-syllabus`
-   **Input**: `{ syllabusText: string, fileNames: string[] }`
-   **Output**: `{ graph: GraphData, source: "ai" | "fallback" }`

#### Processing Pipeline

1.  **Validation**: Rejects input with fewer than 20 characters.
2.  **Local Fallback Generation**: Always pre-generates a fallback graph using `createFallbackGraph()` so there's always a result.
3.  **AI Generation**: Calls `tryGenerateWithAI()` which:
    -   Truncates input to 9000 characters (API limit management).
    -   Sends a 6-step chain-of-thought system prompt.
    -   Uses OpenAI function calling (`create_knowledge_graph` tool) for structured output.
    -   Parses the function call arguments as JSON.
4.  **Sanitization**: `sanitizeAIResponseGraph()`:
    -   Validates all node fields (id, label, category, importance, etc.).
    -   Generates unique slugified IDs, handling collisions.
    -   Normalizes categories and importance to valid enum values.
    -   Builds a bidirectional lookup map for ID resolution.
    -   Normalizes prerequisite references.
    -   Validates all edges (removes self-loops, duplicates, invalid references).
    -   Ensures prerequisite edges exist for declared prerequisites.
5.  **Response**: Returns AI graph if valid, otherwise the local fallback.

### Edge Function: `explain-concept`
-   **Location**: `supabase/functions/explain-concept/index.ts`
-   **Input**: Concept details + graph context (prerequisites, dependents, related concepts).
-   **Output**: Structured 4-section explanation: 📌 Definition, 💡 Intuition, 🔗 Connections, 📝 Study Tips.

### Edge Function: `chat`
-   **Location**: `supabase/functions/chat/index.ts` (147 lines)
-   **Input**: `{ messages: ChatMessage[], syllabusContext?: string }`
-   **Output**: `{ reply: string, source: "ai" | "error" | "fallback" }`
-   **System Prompt**: Defines SyllabusMap AI as an academic tutor with specific capabilities, personality traits, and formatting rules.
-   **Context Window**: Keeps last 20 messages for conversation continuity.
-   **Error Handling**: Returns friendly error messages for rate limits (429) and other failures.

---

## AI Pipeline

### 6-Step Chain-of-Thought Reasoning

The `process-syllabus` Edge Function uses an advanced prompt engineering approach:

| Step | Name | Description |
|------|------|-------------|
| 1 | **Subject Detection** | Identifies distinct subjects/modules in the text |
| 2 | **Concept Extraction** | Extracts meaningful academic concepts (1-3 words, skip noise) |
| 3 | **Category Classification** | Assigns foundation/intermediate/advanced tiers |
| 4 | **Importance Rating** | Rates high/medium/low based on centrality and exam relevance |
| 5 | **Relationship Inference** | Maps prerequisite, depends_on, related_to, part_of edges |
| 6 | **Deduplication** | Removes near-duplicates, merges synonyms, removes noise |

### Function Calling Schema

The AI is constrained to output via a structured function call (`create_knowledge_graph`), not free text. This ensures:
-   **Type safety**: All fields must be present and typed correctly.
-   **Enum constraints**: Categories, importance, and relationships are restricted to valid values.
-   **Structured output**: No need to parse markdown or free-form text.

### Sanitization Layer

Even with function calling, the output is fully validated:

```typescript
// Each node is checked for:
✓ Non-empty label
✓ Unique ID (auto-deduplicated with bump suffix)
✓ Valid category enum value (fallback to position-based)
✓ Valid importance enum value (fallback to position-based)
✓ Non-empty description (fallback to "Key syllabus concept: {label}")
✓ Valid prerequisite references (resolved by both ID and label)

// Each edge is checked for:
✓ Valid source and target node IDs
✓ No self-loops
✓ No duplicate edges (same source-target-relationship triple)
✓ Valid relationship type (fallback to "related_to")
```

---

## Knowledge Graph Engine

### Local Fallback (`graph-from-text.ts`)

When AI is unavailable, the local engine provides a deterministic graph:

1.  **Section Splitting**: Text is split at `module/unit/chapter` headings.
2.  **Group Detection**: Each section is assigned a group name (Module I, Unit 2, etc.).
3.  **Concept Extraction**:
    -   Split lines by commas, pipes, slashes, "and", "with", "->", colons.
    -   Clean each part: strip numbering, quotes, whitespace.
    -   Filter: 4-65 characters, contains letters, not a stop word, max 7 words.
    -   Deduplicate by lowercase.
    -   Limit to 25 concepts.
4.  **Category Assignment**: Based on position — first 34% are foundation, 34-67% are intermediate, rest are advanced.
5.  **Importance Assignment**: First 25% are high, 25-60% are medium, rest are low.
6.  **Edge Building**:
    -   **Within groups**: Sequential prerequisite chain. Every 3rd node gets a skip-level `related_to` edge.
    -   **Cross-group**: Advanced nodes `depends_on` foundation nodes. Last node of group A `related_to` first node of group B.
7.  **Prerequisites Backfill**: The `prerequisites` array on each node is populated from generated prerequisite edges.

### Node Layout

Nodes are laid out in a 3-column grid:
-   **Column 0** (x=60): Foundation nodes
-   **Column 1** (x=440): Intermediate nodes
-   **Column 2** (x=820): Advanced nodes
-   **Row spacing**: 140px vertical between nodes in the same column

---

## AI Chatbot

### Architecture

```
User Input → ChatPanel → supabase.functions.invoke("chat") → Edge Function → Lovable AI API
                                                                                    ↓
User ← renderMarkdown(reply) ← ChatPanel ← { reply: "..." } ← Edge Function ← AI Response
```

### Context Injection

Before every message, the ChatPanel builds a context string:

```typescript
// Example context sent to the API:
Concepts:
• Linked List [foundation, high importance] (prerequisites: Arrays)
• Binary Tree [intermediate, medium importance] (prerequisites: Linked List)
• Graph Traversal [advanced, high importance] (prerequisites: Binary Tree, Queue)

Relationships:
• Linked List → Binary Tree (prerequisite)
• Arrays → Linked List (prerequisite)
• Binary Tree → Graph Traversal (depends on)
```

This context is injected into the system prompt, making the chatbot aware of the specific syllabus.

### Quick Prompts

4 pre-built conversation starters:
1.  "Explain the most important concept"
2.  "What should I study first?"
3.  "Create a quick quiz"
4.  "Summarize the syllabus"

---

## Authentication

### Implementation

-   **Provider**: Supabase Auth (email/password)
-   **Hook**: `useAuth()` in `src/hooks/useAuth.tsx`
-   **Guard**: `RequireAuth` component wraps protected routes
-   **Session**: Supabase handles JWT tokens and refresh automatically

### Flow

```
/login → supabase.auth.signInWithPassword() → session stored → redirect to /
/signup → supabase.auth.signUp() → redirect to /login
/ → RequireAuth checks session → render Index or redirect to /login
Sign Out → supabase.auth.signOut() → redirect to /login
```

### Session Persistence

Supabase Auth automatically persists the session in `localStorage` and handles token refresh. The `onAuthStateChange` listener in `useAuth()` ensures the UI updates reactively.

---

## Theme System

### Implementation

-   **Hook**: `useTheme()` in `src/hooks/use-theme.ts`
-   **Storage**: `localStorage` key `syllabusmap-theme`
-   **Mechanism**: Adds/removes the `light` CSS class on `document.documentElement`
-   **Default**: Dark mode

### CSS Architecture

```css
:root { /* Dark mode variables */ }
.light { /* Light mode overrides */ }
```

All design tokens (glass, gradients, glows, surfaces) use CSS variables via `hsl(var(--token))`, so they automatically adapt to the active theme.

### Graph Theme Awareness

The `KnowledgeGraph` component receives an `isDark` prop and uses separate color palettes:
-   **Dark mode**: Bright, vivid node colors (white text, light borders, high-opacity glows)
-   **Light mode**: Deep, saturated node colors (near-black text, dark borders, subtle shadows)
-   **Edges**: Pastel colors in dark mode, deep saturated colors in light mode

---

## Type System

### Core Types (`src/types/graph.ts`)

```typescript
interface ConceptNode {
  id: string;                                           // Unique slug (e.g., "linked-list")
  label: string;                                        // Display name (e.g., "Linked List")
  group?: string;                                       // Module/subject group
  category: 'foundation' | 'intermediate' | 'advanced'; // Difficulty tier
  description: string;                                  // One-line description
  prerequisites: string[];                              // IDs of prerequisite nodes
  importance: 'high' | 'medium' | 'low';               // Exam/topic relevance
  sourceFile: string;                                   // Source PDF filename
}

interface ConceptEdge {
  id: string;                                          // Unique edge ID (e.g., "e-1")
  source: string;                                      // Source node ID
  target: string;                                      // Target node ID
  relationship: 'prerequisite' | 'depends_on' | 'related_to' | 'part_of';
}

interface GraphData {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

interface UploadedFile {
  id: string;       // UUID
  name: string;     // Original filename
  size: number;     // File size in bytes
  file: File;       // Browser File object
}

type AppState = 'upload' | 'processing' | 'dashboard';
```

---

## State Management

SyllabusMap uses **React hooks** for all state management — no external state library.

| State | Location | Type | Purpose |
|-------|----------|------|---------|
| `state` | `Index.tsx` | `AppState` | Current app screen |
| `files` | `Index.tsx` | `UploadedFile[]` | Uploaded PDF files |
| `graphData` | `Index.tsx` | `GraphData | null` | Processed graph data |
| `processingStep` | `Index.tsx` | `number` | Current processing step (0-3) |
| `selectedNode` | `Dashboard.tsx` | `ConceptNode | null` | Currently selected graph node |
| `nodeExplanations` | `Dashboard.tsx` | `Record<string, string>` | Cached AI explanations |
| `loadingNodeId` | `Dashboard.tsx` | `string | null` | Node currently being explained |
| `highlightedNodes` | `Dashboard.tsx` | `string[]` | Nodes to highlight (selected + connected) |
| `messages` | `ChatPanel.tsx` | `ChatMessage[]` | Chat conversation history |
| `isOpen` | `ChatPanel.tsx` | `boolean` | Chat panel open/closed |
| `theme` | `use-theme.ts` | `"dark" | "light"` | Current theme |
| `search` | `DashboardSidebar.tsx` | `string` | Concept search query |
| `filter` | `DashboardSidebar.tsx` | `string | null` | Active category filter |

---

## PDF Processing

### Primary Extraction (`pdfjs-dist`)

```typescript
const pdfjs = await import("pdfjs-dist");
const pdf = await pdfjs.getDocument({ data: buffer }).promise;

for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
  const page = await pdf.getPage(pageNum);
  const textContent = await page.getTextContent();
  // Extract and join text items
}
```

### Fallback Extraction (Raw Bytes)

For PDFs where standard text extraction fails (e.g., image-based or non-standard encoding):

```typescript
// Decode raw PDF bytes and extract text from parenthesized strings
const regex = /\(([^)]{2,})\)/g;
// This captures text content stored in PDF content streams
```

### Multi-File Processing

All uploaded files are processed in parallel using `Promise.all()`. Each file's text is prefixed with its filename for context:

```
--- Document1.pdf ---
[extracted text]

--- Document2.pdf ---
[extracted text]
```

---

## Error Handling & Fallbacks

SyllabusMap is designed to **never fail silently**. Every potential failure has a graceful fallback:

| Failure Point | Fallback | User Experience |
|---------------|----------|-----------------|
| PDF text extraction fails | Raw byte regex parser | Graph generated from partial text |
| AI service unavailable | Local `graph-from-text.ts` | Graph generated without AI (toast notification) |
| AI returns invalid JSON | Sanitization + local fallback | Valid graph always returned |
| AI returns empty graph | Pre-generated 7-concept default | Generic but functional graph |
| `explain-concept` fails | Node's `description` field | Basic description shown instead of AI summary |
| Chat API errors | Friendly error message + retry | "I encountered an issue. Please try again." |
| Rate limit (429) | Specific rate limit message | "Too many requests. Please wait." |
| Auth session expired | Redirect to `/login` | Seamless re-authentication |
| No `LOVABLE_API_KEY` | Full local-only mode | All features work except AI (local fallback) |

---

## Performance Optimizations

1.  **Explanation Pre-fetching**: On dashboard mount, all node explanations are fetched in the background sequentially (warm-up loop), so they're cached by the time the user clicks.
2.  **Request Deduplication**: `inFlightRef` (a `Map<string, Promise>`) prevents duplicate API calls for the same node. If a request is already in-flight, subsequent calls await the existing promise.
3.  **Memoized Components**: `ConceptNodeComponent` and `GlowEdge` are wrapped in `React.memo()` to prevent unnecessary re-renders during graph interactions.
4.  **Memoized Computations**: `useMemo()` for node/edge arrays, filtered concept lists, and category counts.
5.  **Lazy PDF.js Loading**: `pdfjs-dist` is dynamically imported (`import()`) only when needed, not bundled in the initial load.
6.  **Text Truncation**: Syllabus text is truncated to 9000 characters before sending to AI, preventing token limit issues.
7.  **Optimistic UI**: Processing animation runs independently of actual progress, providing smooth perceived performance.

---

## Accessibility

-   **Semantic HTML**: Proper `<header>`, `<aside>`, `<main>` structure.
-   **ARIA labels**: Theme toggle, chat button, and interactive elements have `aria-label` attributes.
-   **Keyboard navigation**: All buttons and form inputs are keyboard-accessible.
-   **Focus indicators**: `focus:ring` styles on all interactive elements.
-   **Color contrast**: Minimum 4.5:1 contrast ratio for text in both themes.
-   **Screen reader**: Form labels linked via `htmlFor`, meaningful button text.

---

## Testing

### Unit Tests (Vitest)

```bash
npm run test        # Run once
npm run test:watch  # Watch mode
```

### E2E Tests (Playwright)

```bash
npx playwright test
```

### Recommended Test Targets

-   `extractConcepts()` in `graph-from-text.ts` — test with various syllabus formats
-   `buildEdges()` — test edge generation rules and deduplication
-   `sanitizeAIResponseGraph()` — test with malformed AI outputs
-   `parseSummary()` in `InsightsPanel.tsx` — test section parsing

---

## Deployment

### Frontend (Vite Build)

```bash
npm run build
# Output in dist/ — deploy to Vercel, Netlify, Cloudflare Pages, etc.
```

### Edge Functions (Supabase)

```bash
# Deploy all functions
supabase functions deploy process-syllabus
supabase functions deploy explain-concept
supabase functions deploy chat

# Set secrets
supabase secrets set LOVABLE_API_KEY=your-key-here
```

### Environment Configuration

| Platform | Frontend URL | Edge Functions |
|----------|-------------|----------------|
| **Development** | `http://localhost:8080` | Local Supabase or remote project |
| **Staging** | Your staging URL | Same Supabase project |
| **Production** | Your production URL | Same Supabase project with production secrets |

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "AI explanation unavailable" toast | `LOVABLE_API_KEY` not set or rate limited | Set the key in Supabase Secrets; wait if rate limited |
| Empty/generic graph generated | PDF is image-based (scanned) | Use text-based PDFs or OCR the document first |
| Graph nodes overlap | Too many nodes for column layout | Zoom out or drag nodes to rearrange |
| Chat says "AI service not configured" | Missing `LOVABLE_API_KEY` | Set via `supabase secrets set LOVABLE_API_KEY=...` |
| Theme toggle doesn't work | JavaScript disabled or localStorage blocked | Ensure JS is enabled; check browser privacy settings |
| Deno linting warnings in IDE | Edge Functions use Deno runtime, not Node | These are expected — functions work correctly when deployed |
| Login redirect loop | Supabase project URL mismatch | Verify `VITE_SUPABASE_URL` matches your project |

---

## Contributing

### Development Workflow

1.  Fork the repository.
2.  Create a feature branch: `git checkout -b feature/my-feature`
3.  Make changes and ensure `npm run lint` passes.
4.  Run tests: `npm run test`
5.  Submit a pull request with a clear description.

### Code Style

-   **TypeScript strict mode** — no `any` except in error handlers.
-   **Functional components** with hooks — no class components.
-   **Named exports** for hooks and utilities, **default exports** for page/component files.
-   **Consistent naming**: PascalCase for components, camelCase for functions/variables, kebab-case for files.

---

## License

This project is private and proprietary. All rights reserved.

---

<div align="center">

**Built with ❤️ for HackNexus 2.0**

*SyllabusMap — Turn syllabi into smart learning maps*

</div>
]]>
