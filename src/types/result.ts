export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type ImportanceLevel = 'Essential' | 'High' | 'Medium';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  mastered?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  userAnswerIndex?: number | null;
}

export interface StudyTask {
  id: string;
  task: string;
  description: string;
  isCompleted: boolean;
}

export interface StudyPhase {
  id: string;
  phase: string;
  durationMinutes: number;
  tasks: StudyTask[];
}

export interface KeyConcept {
  id: string;
  title: string;
  definition: string;
  importance: ImportanceLevel;
  pitfallOrTip: string;
}

export interface StudyPlanData {
  id?: string;
  topic: string;
  summary: string;
  estimatedStudyTimeMinutes: number;
  difficultyLevel: DifficultyLevel;
  keyConcepts: KeyConcept[];
  cards: Flashcard[];
  quiz: QuizQuestion[];
  studyPlan: StudyPhase[];
  createdAt?: string;
}

export interface SavedSession {
  id: string;
  timestamp: number;
  topic: string;
  data: StudyPlanData;
  rawInput: string;
}

export interface ParseValidationSuccess {
  success: true;
  data: StudyPlanData;
}

export interface ParseValidationFailure {
  success: false;
  errorType: 'MALFORMED_JSON' | 'INVALID_SHAPE' | 'EMPTY_RESPONSE' | 'NETWORK_ERROR';
  message: string;
  rawSnippet?: string;
  debugDetails?: string;
}

export type ParseValidationResult = ParseValidationSuccess | ParseValidationFailure;
