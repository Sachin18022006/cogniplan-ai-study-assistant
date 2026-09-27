import type {
  StudyPlanData,
  Flashcard,
  QuizQuestion,
  StudyPhase,
  StudyTask,
  KeyConcept,
  ParseValidationResult,
} from '../types/result';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
const IMPORTANCE = ['Essential', 'High', 'Medium'] as const;

function failure(
  message: string,
  errorType: 'MALFORMED_JSON' | 'INVALID_SHAPE' | 'EMPTY_RESPONSE' = 'INVALID_SHAPE',
  raw?: unknown,
): ParseValidationResult {
  return {
    success: false,
    errorType,
    message,
    rawSnippet: raw === undefined ? undefined : JSON.stringify(raw).slice(0, 250),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Parse and strictly validate the structured AI response before it reaches React state.
 * Invalid or incomplete model output is rejected instead of silently normalized.
 */
export function validateAndParseAIResponse(raw: unknown): ParseValidationResult {
  if (raw === null || raw === undefined) {
    return failure('The AI model returned no response.', 'EMPTY_RESPONSE');
  }

  let text = '';

  if (typeof raw === 'string') {
    text = raw.trim();
  } else if (isRecord(raw)) {
    if (typeof raw.raw === 'string') {
      text = raw.raw.trim();
    } else {
      return validateDataObject(raw);
    }
  } else {
    return failure(`Expected a JSON string or object, received ${typeof raw}.`, 'MALFORMED_JSON', raw);
  }

  if (!text) {
    return failure('The AI model returned an empty response. Please retry.', 'EMPTY_RESPONSE');
  }

  // The production prompt asks for raw JSON, but accepting a single JSON code fence
  // makes the client resilient to providers that occasionally add Markdown fences.
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const clean = fenced ? fenced[1].trim() : text;

  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch (error) {
    return failure(
      `Model output is not valid JSON: ${error instanceof Error ? error.message : 'parse failed'}`,
      'MALFORMED_JSON',
      text,
    );
  }

  return validateDataObject(parsed, text);
}

function validateDataObject(obj: unknown, rawSnippet?: string): ParseValidationResult {
  if (!isRecord(obj)) {
    return failure('Expected a JSON object at the root of the response.', 'INVALID_SHAPE', obj);
  }

  const requiredTopLevel = [
    'topic',
    'summary',
    'estimatedStudyTimeMinutes',
    'difficultyLevel',
    'keyConcepts',
    'cards',
    'quiz',
    'studyPlan',
  ];

  const missing = requiredTopLevel.filter((key) => !(key in obj));
  if (missing.length) {
    return failure(
      `Response is missing required field(s): ${missing.join(', ')}.`,
      'INVALID_SHAPE',
      rawSnippet ?? obj,
    );
  }

  if (!nonEmptyString(obj.topic) || !nonEmptyString(obj.summary)) {
    return failure('"topic" and "summary" must be non-empty strings.', 'INVALID_SHAPE', rawSnippet ?? obj);
  }

  if (!isFiniteNumber(obj.estimatedStudyTimeMinutes) || obj.estimatedStudyTimeMinutes <= 0) {
    return failure('"estimatedStudyTimeMinutes" must be a positive number.', 'INVALID_SHAPE', rawSnippet ?? obj);
  }

  if (!LEVELS.includes(obj.difficultyLevel as typeof LEVELS[number])) {
    return failure('"difficultyLevel" must be Beginner, Intermediate, or Advanced.', 'INVALID_SHAPE', rawSnippet ?? obj);
  }

  if (!Array.isArray(obj.keyConcepts) || obj.keyConcepts.length < 3) {
    return failure('"keyConcepts" must contain at least 3 items.', 'INVALID_SHAPE', rawSnippet ?? obj);
  }
  if (!Array.isArray(obj.cards) || obj.cards.length < 5) {
    return failure('"cards" must contain at least 5 valid flashcards.', 'INVALID_SHAPE', rawSnippet ?? obj);
  }
  if (!Array.isArray(obj.quiz) || obj.quiz.length < 4) {
    return failure('"quiz" must contain at least 4 valid questions.', 'INVALID_SHAPE', rawSnippet ?? obj);
  }
  if (!Array.isArray(obj.studyPlan) || obj.studyPlan.length < 3) {
    return failure('"studyPlan" must contain at least 3 phases.', 'INVALID_SHAPE', rawSnippet ?? obj);
  }

  const keyConcepts: KeyConcept[] = [];
  for (let i = 0; i < obj.keyConcepts.length; i += 1) {
    const item = obj.keyConcepts[i];
    if (!isRecord(item) || !nonEmptyString(item.title) || !nonEmptyString(item.definition)) {
      return failure(`keyConcepts[${i}] has an invalid title or definition.`, 'INVALID_SHAPE', rawSnippet ?? obj);
    }
    if (!IMPORTANCE.includes(item.importance as typeof IMPORTANCE[number])) {
      return failure(`keyConcepts[${i}].importance is invalid.`, 'INVALID_SHAPE', rawSnippet ?? obj);
    }
    keyConcepts.push({
      id: nonEmptyString(item.id) ? item.id : `concept-${i + 1}`,
      title: item.title.trim(),
      definition: item.definition.trim(),
      importance: item.importance as KeyConcept['importance'],
      pitfallOrTip: nonEmptyString(item.pitfallOrTip) ? item.pitfallOrTip.trim() : '',
    });
  }

  const cards: Flashcard[] = [];
  for (let i = 0; i < obj.cards.length; i += 1) {
    const item = obj.cards[i];
    if (!isRecord(item) || !nonEmptyString(item.question) || !nonEmptyString(item.answer)) {
      return failure(`cards[${i}] must contain non-empty question and answer strings.`, 'INVALID_SHAPE', rawSnippet ?? obj);
    }
    if (item.difficulty !== undefined && !DIFFICULTIES.includes(item.difficulty as typeof DIFFICULTIES[number])) {
      return failure(`cards[${i}].difficulty is invalid.`, 'INVALID_SHAPE', rawSnippet ?? obj);
    }
    cards.push({
      id: nonEmptyString(item.id) ? item.id : `card-${i + 1}`,
      question: item.question.trim(),
      answer: item.answer.trim(),
      category: nonEmptyString(item.category) ? item.category.trim() : 'Core Concept',
      difficulty: (item.difficulty as Flashcard['difficulty']) ?? 'Medium',
      mastered: false,
    });
  }

  const quiz: QuizQuestion[] = [];
  for (let i = 0; i < obj.quiz.length; i += 1) {
    const item = obj.quiz[i];
    if (!isRecord(item) || !nonEmptyString(item.question) || !Array.isArray(item.options)) {
      return failure(`quiz[${i}] has an invalid question or options array.`, 'INVALID_SHAPE', rawSnippet ?? obj);
    }
    if (item.options.length !== 4 || item.options.some((option) => !nonEmptyString(option))) {
      return failure(`quiz[${i}].options must contain exactly 4 non-empty choices.`, 'INVALID_SHAPE', rawSnippet ?? obj);
    }
    const options = item.options.map((option) => option.trim());
    if (new Set(options.map((option) => option.toLowerCase())).size !== 4) {
      return failure(`quiz[${i}].options must contain 4 distinct choices.`, 'INVALID_SHAPE', rawSnippet ?? obj);
    }
    const correctAnswerIndex = item.correctAnswerIndex;
    if (!isFiniteNumber(correctAnswerIndex) || !Number.isInteger(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex > 3) {
      return failure(`quiz[${i}].correctAnswerIndex must be an integer from 0 to 3.`, 'INVALID_SHAPE', rawSnippet ?? obj);
    }
    if (!nonEmptyString(item.explanation)) {
      return failure(`quiz[${i}].explanation must be a non-empty string.`, 'INVALID_SHAPE', rawSnippet ?? obj);
    }
    quiz.push({
      id: nonEmptyString(item.id) ? item.id : `quiz-${i + 1}`,
      question: item.question.trim(),
      options,
      correctAnswerIndex,
      explanation: item.explanation.trim(),
      userAnswerIndex: null,
    });
  }

  const studyPlan: StudyPhase[] = [];
  for (let i = 0; i < obj.studyPlan.length; i += 1) {
    const phase = obj.studyPlan[i];
    if (!isRecord(phase) || !nonEmptyString(phase.phase) || !isFiniteNumber(phase.durationMinutes) || phase.durationMinutes <= 0 || !Array.isArray(phase.tasks) || phase.tasks.length === 0) {
      return failure(`studyPlan[${i}] must contain a phase, positive duration, and at least one task.`, 'INVALID_SHAPE', rawSnippet ?? obj);
    }

    const tasks: StudyTask[] = [];
    for (let j = 0; j < phase.tasks.length; j += 1) {
      const task = phase.tasks[j];
      if (!isRecord(task) || !nonEmptyString(task.task) || !nonEmptyString(task.description)) {
        return failure(`studyPlan[${i}].tasks[${j}] is invalid.`, 'INVALID_SHAPE', rawSnippet ?? obj);
      }
      tasks.push({
        id: nonEmptyString(task.id) ? task.id : `task-${i + 1}-${j + 1}`,
        task: task.task.trim(),
        description: task.description.trim(),
        isCompleted: false,
      });
    }

    studyPlan.push({
      id: nonEmptyString(phase.id) ? phase.id : `phase-${i + 1}`,
      phase: phase.phase.trim(),
      durationMinutes: phase.durationMinutes,
      tasks,
    });
  }

  const data: StudyPlanData = {
    id: `study-session-${Date.now()}`,
    topic: obj.topic.trim(),
    summary: obj.summary.trim(),
    estimatedStudyTimeMinutes: obj.estimatedStudyTimeMinutes,
    difficultyLevel: obj.difficultyLevel as StudyPlanData['difficultyLevel'],
    keyConcepts,
    cards,
    quiz,
    studyPlan,
    createdAt: new Date().toISOString(),
  };

  return { success: true, data };
}
