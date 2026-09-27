# CogniPlan — AI-Powered Interactive Study Planner & Mastery Assistant

> **Frontend Internship Assignment Submission for Flam**  
> **Project Choice:** Study Assistant & Planner  
> **Stack:** React 19 (Hooks, Functional Components, TypeScript), Node.js / Express Proxy Backend, Google Gemini 2.5 Flash API, Lucide Icons, Canvas Confetti.  
> **Design Theme:** Executive Obsidian Slate, Forest Emerald (`#10b981`), and Warm Amber (`#f59e0b`) — *specifically designed with zero generic Gemini blue shades for enterprise readiness*.

---

## 🚀 Quick Start (One Command)

As specified in the assignment submission guidelines, running locally requires only:

```bash
# 1. Clone repository and navigate to root
cd study-planner-assistant

# 2. Install dependencies
npm install

# 3. Start both backend proxy (port 3001) and frontend Vite app (port 5173)
npm start
```

Visit **`http://localhost:5173`** in your browser.

**Environment setup:**

Create a local `.env` file from `.env.example` and add your own Gemini API key. The real key is intentionally **not included** in the submission package.

**Windows:**
```bash
copy .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

Then set `GEMINI_API_KEY` in `.env`. The key is read only by the Express backend and is never exposed to the browser.

---

## 🎯 Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                       BROWSER (CLIENT)                      │
│                                                             │
│  [PromptInput]  ──>  [requestId Guard]  ──>  [lib/api.ts]   │
│         ▲                                          │        │
│         │                                          ▼        │
│  [ResultView]   <──  [lib/validateResult.ts] <── Fetch API  │
│    ├── Flashcards Deck (3D CSS perspective)                 │
│    ├── Mastery Quiz (Mistake Re-testing Mode)               │
│    ├── Milestone Study Roadmap (Checkable)                  │
│    └── Key Concepts & High-Yield Pitfalls                   │
└───────────────────────────┬─────────────────────────────────┘
                            │ /api/generate (POST)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 NODE.JS / EXPRESS PROXY                     │
│                                                             │
│  • Holds GEMINI_API_KEY securely (Never leaked to client)   │
│  • Enforces responseMimeType: "application/json"            │
│  • Defensive response validation and recovery states        │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API (server-side API key)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  GOOGLE GEMINI 2.5 FLASH                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Handling Bad AI Output (20% Evaluation Weight)

Handling unpredictable model failures gracefully is the core focus of this assignment. CogniPlan implements dedicated defensive systems for all realistic failure modes:

| Failure Mode | How It Is Triggered | How CogniPlan Handles It |
|---|---|---|
| **1. Malformed JSON** | The model/provider returns invalid JSON or unexpected text. | `validateAndParseAIResponse` rejects the payload before it reaches interactive state and displays a clear retryable error. |
| **2. Wrong Schema Shape** | The model returns valid JSON with missing or invalid required fields. | Structural validation checks the required schema and rejects incomplete data with a clear remediation message. |
| **3. Empty Response** | Model returns empty string or null payload. | Treated explicitly as a failure rather than rendering an empty UI. The error view prompts the user to adjust the input or retry. |
| **4. Slow Response / Hangs** | Model takes longer than expected due to network latency. | Animated `LoadingState` shows active progress milestones, live timer elapsed, and an explicit **"Cancel Generation"** button wired to an `AbortController`. |
| **5. Stale Responses (Race Condition)** | User triggers generation, changes mind, and triggers a second one while the first is in flight. | Guarded with a `useRef(0)` incrementing `requestId`. If Request #1 completes after Request #2, Request #1 is discarded silently and **never overwrites** newer state. |

---

## ✨ Features & Rubric Highlights

### 1. Free-Form Text Input & Quick Presets
- Accepts arbitrary lecture notes, textbook excerpts, or technical topics.
- Includes 4 optional suggested technical topics (*React Fiber Internals*, *Distributed Systems*, *PostgreSQL Indexing*, *Transformers Architecture*). Presets only populate the required free-form input; generation still goes through the real AI flow.

### 2. Interactive 3D Flashcards (`FlashcardDeck.tsx`)
- Smooth CSS 3D perspective flip card (`preserve-3d`, `backface-visibility: hidden`).
- **Active Recall Controls**: Mark cards as "Mastered" vs "Need Review".
- **Filter Pills**: View All, Unmastered Only, or Mastered Only.
- **Keyboard Shortcuts**: `Space`/`Enter` to flip, `←`/`→` arrows to navigate.
- Shuffle cards mode.

### 3. Mastery Quiz with "Re-Test Wrong Answers" (`QuizView.tsx`)
- Multi-choice conceptual questions with 4 distinct options.
- Immediate color-coded feedback and detailed pedagogical explanation.
- Final Score summary with celebratory confetti.
- **Dedicated "Re-Test Wrong Answers" button**: filters the quiz so students can drill only the specific questions they got wrong until reaching 100% score!

### 4. Phased Milestone Study Roadmap (`StudyPlanView.tsx`)
- Chronological phases (Foundations, Deep Dive, Active Mastery).
- Checkable interactive tasks with live progress percentage bar.
- Estimated study minutes per phase and total.

### 5. Key Concepts & Interview Pitfalls (`KeyConceptsView.tsx`)
- Structured breakdown with importance badges (`Essential`, `High`, `Medium`).
- High-yield interview tips and common conceptual pitfalls.

### 6. Refinement Loop (`RefinementBar.tsx`)
- Follow-up prompts modify the active study deck (e.g. *"Add 3 harder edge-case questions"* or *"Condense roadmap into a 45-min sprint"*) while preserving context.

### 7. Session History & Local Storage (`SessionHistory.tsx`)
- Auto-saves decks to browser `localStorage`.
- Switch between previous study sessions with 1 click.
- Export as formatted **Markdown (`.md`)** notes or **JSON**.

---

## 🎨 Design System & Aesthetic Choices

Per user instructions, CogniPlan strictly avoids the default Gemini blue palette:
- **Primary Brand:** Deep Forest Emerald (`#10B981`, `#059669`) for focus and learning efficiency.
- **Warm Accent:** Sunlit Amber (`#F59E0B`) for callouts, difficulty badges, and review states.
- **Base Surfaces:** Obsidian Charcoal (`#0C1017`, `#121822`, `#18202D`) with subtle frosted borders (`#242F40`).
- **Theme Support:** Header toggle supports **Executive Dark** and **Corporate Alabaster Light** modes.
- **Typography:** `Plus Jakarta Sans` for clean, professional executive readability.

---

## 🤖 AI Usage Note

In accordance with Section 8 of the assignment brief:
- **AI Model Integration:** Google Gemini 2.5 Flash (`gemini-2.5-flash`) was used via direct REST calls inside the Express proxy backend.
- **Prompt Engineering:** Structured JSON schema instructions with `responseMimeType: "application/json"` were configured to maximize deterministic outputs.
- **AI Coding Assistance:** Antigravity AI was used as a pair-programmer for scaffolding TypeScript definitions, writing boilerplate CSS transforms, and generating test presets. All business logic, defensive validators, stale guards, and error states were deliberately designed and verified.

---

## ⏱️ Time Spent

| Phase | Description | Time Spent |
|---|---|---|
| **Phase 1** | Schema design, type definitions, and backend proxy setup | ~1.5 hours |
| **Phase 2** | Defensive JSON parsing (`validateResult.ts`) and failure modes sandbox | ~1.5 hours |
| **Phase 3** | Core UI (PromptInput, 3D Flashcards, Mistake Re-testing Quiz) | ~2.5 hours |
| **Phase 4** | Stretch goals (Roadmap, Refinement Loop, Session Storage, Markdown Export) | ~1.5 hours |
| **Phase 5** | Design system polish, mobile responsiveness, and documentation | ~1.0 hour |
| **Total** | | **~8.0 hours** |

---

## 📦 Submission Safety Checklist

Before submitting:

- Do **not** commit or upload `.env` or any real API key.
- Keep `.env.example` with placeholder values only.
- Do **not** upload `node_modules/` or `dist/`; the evaluator should run `npm install` locally.
- Verify `npm run build` completes successfully.
- Verify `npm start` launches both the Express proxy and Vite frontend.
- Exercise the normal generation flow and verify the application's natural error, retry, loading, cancel, and validation states during development.
- Record the required short demo showing the core study flow and natural loading/error/retry handling.

The project intentionally uses strict client-side validation: incomplete top-level data, invalid flashcards, non-4-option quiz questions, duplicate choices, and incomplete study-plan phases are rejected before they reach the interactive UI.

---

## ⚠️ Known Limitations & Future Roadmap

1. **OCR / File Attachment Uploads:** Currently accepts free-form text input; adding native PDF or image parsing directly to the backend proxy would allow uploading full textbook chapters.
2. **Audio Pronunciation:** Future iteration could integrate Web Speech API to read flashcard prompts aloud for auditory learners.
3. **Spaced Repetition Algorithm (SM-2):** Integrate SuperMemo-2 interval scheduling across multi-day review sessions.
