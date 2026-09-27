import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'StudyPlanner AI Backend Proxy',
    geminiKeyConfigured: Boolean(GEMINI_API_KEY),
    model: 'gemini-2.5-flash',
  });
});

const JSON_SCHEMA_INSTRUCTION = `
You are an expert curriculum architect, cognitive learning scientist, and study strategist.
Analyze the provided notes, topic, or syllabus text and output ONLY valid, parseable JSON conforming strictly to this TypeScript schema:

{
  "topic": string, // Clean concise title of the subject
  "summary": string, // Executive 2-3 sentence conceptual overview
  "estimatedStudyTimeMinutes": number, // Realistic total study time in minutes
  "difficultyLevel": "Beginner" | "Intermediate" | "Advanced",
  "keyConcepts": [
    {
      "id": string,
      "title": string,
      "definition": string,
      "importance": "High" | "Medium" | "Essential",
      "pitfallOrTip": string // Common pitfall or high-yield exam tip
    }
  ],
  "cards": [
    {
      "id": string,
      "question": string,
      "answer": string,
      "category": string,
      "difficulty": "Easy" | "Medium" | "Hard"
    }
  ],
  "quiz": [
    {
      "id": string,
      "question": string,
      "options": string[], // Exactly 4 distinct choices
      "correctAnswerIndex": number, // 0, 1, 2, or 3
      "explanation": string // Clear, pedagogical rationale explaining why the correct choice is right and others are wrong
    }
  ],
  "studyPlan": [
    {
      "id": string,
      "phase": string, // e.g. "Phase 1: Foundations", "Phase 2: Deep Dive", "Phase 3: Active Recall & Mastery"
      "durationMinutes": number,
      "tasks": [
        {
          "id": string,
          "task": string,
          "description": string,
          "isCompleted": false
        }
      ]
    }
  ]
}

CRITICAL RULES:
1. Return ONLY the raw JSON object. Do NOT wrap in markdown \`\`\`json or add conversational text.
2. Generate at least 5-8 high quality flashcards.
3. Generate at least 4-6 conceptual multiple-choice quiz questions with 4 options each.
4. Ensure the correct answer index is accurate (0 to 3) matching the options array.
5. Create a structured 3-phase study roadmap with actionable tasks.
`;

/**
 * Call Gemini REST API directly with responseMimeType: "application/json"
 */
async function callGemini(systemPrompt, userPrompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured on the backend server.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemPrompt}\n\nUSER INPUT/NOTES:\n${userPrompt}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.25,
      topP: 0.9,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json'
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API responded with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini returned an empty candidate or text part.');
  }

  return rawText;
}

// Main generation endpoint
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'A non-empty prompt is required.' });
  }

  try {
    const rawResult = await callGemini(JSON_SCHEMA_INSTRUCTION, prompt.trim());
    return res.json({ raw: rawResult });
  } catch (err) {
    console.error('Error generating study material:', err);
    return res.status(502).json({
      error: err.message || 'Failed to communicate with LLM provider.'
    });
  }
});

// Refinement endpoint
app.post('/api/refine', async (req, res) => {
  const { currentData, refinementInstruction } = req.body;

  if (!currentData || !refinementInstruction) {
    return res.status(400).json({ error: 'Both currentData and refinementInstruction are required.' });
  }

  // Strip UI-only state before sending the existing deck back to the model.
  // The model should refine the content schema, not React interaction state.
  const aiCurrentData = {
    topic: currentData.topic,
    summary: currentData.summary,
    estimatedStudyTimeMinutes: currentData.estimatedStudyTimeMinutes,
    difficultyLevel: currentData.difficultyLevel,
    keyConcepts: currentData.keyConcepts,
    cards: currentData.cards.map(({ mastered, ...card }) => card),
    quiz: currentData.quiz.map(({ userAnswerIndex, ...question }) => question),
    studyPlan: currentData.studyPlan.map((phase) => ({
      ...phase,
      tasks: phase.tasks.map(({ isCompleted, ...task }) => task),
    })),
  };

  const refinementPrompt = `
You are refining an existing study-learning dataset. The current dataset is already valid.
Apply ONLY the user's requested change while preserving useful existing content and the exact JSON schema.
If the user asks to add content, add it without deleting unrelated content.
If the user asks to shorten or reorganize content, make that change while keeping all required sections.
Always return the COMPLETE updated dataset, not a partial patch.

CURRENT DATASET:
${JSON.stringify(aiCurrentData, null, 2)}

USER REQUEST:
${refinementInstruction.trim()}

Return ONLY the complete JSON object required by the schema. No Markdown, no code fences, and no explanatory prose.
`;

  try {
    const rawResult = await callGemini(JSON_SCHEMA_INSTRUCTION, refinementPrompt);
    return res.json({ raw: rawResult });
  } catch (err) {
    console.error('Error refining study material:', err);
    return res.status(502).json({
      error: err.message || 'Failed to refine study material.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Backend Proxy] Study Planner Server running at http://localhost:${PORT}`);
  console.log(`[Backend Proxy] Gemini API configured: ${Boolean(GEMINI_API_KEY)}`);
});
