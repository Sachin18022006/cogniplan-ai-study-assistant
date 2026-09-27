import { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Sparkles,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import type {
  StudyPlanData,
  SavedSession,
  ParseValidationFailure,
} from './types/result';
import { callGenerateApi, callRefineApi, checkBackendHealth } from './lib/api';
import { validateAndParseAIResponse } from './lib/validateResult';
import { PromptInput } from './components/PromptInput';
import { ResultView } from './components/ResultView';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { SessionHistory } from './components/SessionHistory';

const SESSIONS_STORAGE_KEY = 'cogniplan_saved_sessions_v1';
const THEME_STORAGE_KEY = 'cogniplan_theme_v1';

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [studyData, setStudyData] = useState<StudyPlanData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [error, setError] = useState<ParseValidationFailure | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [lastPrompt, setLastPrompt] = useState<string>('');
  const [backendHealth, setBackendHealth] = useState<{ status: string; geminiKeyConfigured: boolean }>({
    status: 'checking',
    geminiKeyConfigured: false,
  });

  // Guard against stale asynchronous responses so older requests never overwrite newer results.
  const requestId = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const refineAbortControllerRef = useRef<AbortController | null>(null);

  // Initialize theme and load sessions from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    try {
      const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (stored) {
        setSavedSessions(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse saved sessions from localStorage:', e);
    }

    // Check backend health
    checkBackendHealth().then(setBackendHealth);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  /**
   * Save a newly generated or refined session to localStorage
   */
  const persistSession = (data: StudyPlanData, rawPrompt: string) => {
    const newSession: SavedSession = {
      id: data.id || `session-${Date.now()}`,
      timestamp: Date.now(),
      topic: data.topic,
      data,
      rawInput: rawPrompt,
    };

    setSavedSessions((prev) => {
      // Avoid duplicate topic sessions at top
      const filtered = prev.filter((s) => s.topic !== data.topic);
      const updated = [newSession, ...filtered].slice(0, 15);
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  /**
   * Primary Generation Flow with Stale Response Guard & Defensive Parsing
   */
  const handleGenerate = async (prompt: string) => {
    // 1. Stale Guard: Increment request ID so any pending older request is ignored
    const currentId = ++requestId.current;

    // 2. Abort prior ongoing request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    setLastPrompt(prompt);

    try {
      // 3. Call backend proxy (never the LLM directly)
      const rawText = await callGenerateApi({
        prompt,
        signal: abortControllerRef.current.signal,
      });

      // 4. Stale Guard Check: If another request started while this was pending, drop it!
      if (currentId !== requestId.current) {
        console.warn(`[Stale Request Guard] Ignored resolved response for request #${currentId}. Current is #${requestId.current}`);
        return;
      }

      // 5. Defensive Parsing & Schema Validation before passing to state
      const validationResult = validateAndParseAIResponse(rawText);

      if (validationResult.success === false) {
        setError(validationResult);
        setIsLoading(false);
        return;
      }

      // Success: safely set interactive state
      setStudyData(validationResult.data);
      persistSession(validationResult.data, prompt);
    } catch (err: unknown) {
      // Stale Guard Check on error
      if (currentId !== requestId.current) return;

      const errMsg = (err as Error).message || 'An unexpected error occurred.';
      if (errMsg.includes('canceled')) {
        setIsLoading(false);
        return;
      }

      setError({
        success: false,
        errorType: 'NETWORK_ERROR',
        message: errMsg,
        debugDetails: (err as Error).stack,
      });
    } finally {
      if (currentId === requestId.current) {
        setIsLoading(false);
      }
    }
  };

  /**
   * Refinement Loop: updates current study data according to follow-up instruction
   */
  const handleRefine = async (instruction: string) => {
    if (!studyData || isRefining) return;

    const currentId = ++requestId.current;
    refineAbortControllerRef.current?.abort();
    const controller = new AbortController();
    refineAbortControllerRef.current = controller;

    setIsRefining(true);
    setError(null);

    try {
      const rawText = await callRefineApi({
        currentData: studyData,
        refinementInstruction: instruction,
        signal: controller.signal,
      });

      if (currentId !== requestId.current) return;

      const validationResult = validateAndParseAIResponse(rawText);
      if (validationResult.success === false) {
        setError(validationResult);
        return;
      }

      setStudyData(validationResult.data);
      persistSession(validationResult.data, `${lastPrompt} [Refined: ${instruction}]`);
    } catch (err: unknown) {
      if (currentId !== requestId.current) return;
      const errMsg = (err as Error).message || 'Failed to refine existing study material.';
      if (errMsg.includes('canceled')) return;
      setError({
        success: false,
        errorType: 'NETWORK_ERROR',
        message: errMsg,
        debugDetails: (err as Error).stack,
      });
    } finally {
      if (currentId === requestId.current) {
        setIsRefining(false);
      }
      if (refineAbortControllerRef.current === controller) {
        refineAbortControllerRef.current = null;
      }
    }
  };

  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  const handleSelectSavedSession = (session: SavedSession) => {
    setError(null);
    setStudyData(session.data);
    setLastPrompt(session.rawInput);
  };

  const handleDeleteSavedSession = (id: string) => {
    setSavedSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetToNew = () => {
    setStudyData(null);
    setError(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Executive Header Bar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-subtle)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          {/* Brand Logo & Name */}
          <div
            onClick={handleResetToNew}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--emerald-500), var(--emerald-700))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 10px var(--emerald-glow)',
              }}
            >
              <GraduationCap size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                  CogniPlan
                </span>
                <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                  Enterprise AI
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Structured Study & Mastery System
              </div>
            </div>
          </div>

          {/* Status & Utility Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Backend Proxy Health Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '9999px',
                background: backendHealth.geminiKeyConfigured ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                border: `1px solid ${backendHealth.geminiKeyConfigured ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                color: backendHealth.geminiKeyConfigured ? 'var(--emerald-400)' : 'var(--rose-400)',
              }}
              title="API Key securely encapsulated on server proxy (never shipped to browser)"
            >
              <ShieldCheck size={13} />
              <span>{backendHealth.geminiKeyConfigured ? 'Secure AI Connection' : 'Connecting...'}</span>
            </div>

            {studyData && (
              <button
                onClick={handleResetToNew}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                + New Topic
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn-ghost"
              style={{ padding: '0.45rem', borderRadius: '50%' }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Corporate Theme`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={17} style={{ color: 'var(--amber-400)' }} /> : <Moon size={17} style={{ color: 'var(--emerald-600)' }} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem', flex: 1, width: '100%' }}>
        {/* Top Hero / Context Banner (When no active deck) */}
        {!studyData && !isLoading && !error && (
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1
              style={{
                fontSize: '2.25rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                letterSpacing: '-0.03em',
                lineHeight: '1.2',
                marginBottom: '0.75rem',
              }}
            >
              Turn Free-Form Notes into an Interactive Learning Machine
            </h1>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '1rem',
                maxWidth: '680px',
                margin: '0 auto',
                lineHeight: '1.6',
              }}
            >
              Paste any topic or syllabus. Our AI compiler generates 3D active-recall flashcards,
              multi-choice quizzes with mistake re-testing, and a milestone study schedule.
            </p>
          </div>
        )}

        {/* Saved Sessions Bar (Always Accessible) */}
        <div style={{ marginBottom: '1.75rem' }}>
          <SessionHistory
            sessions={savedSessions}
            activeSessionId={studyData?.id}
            onSelectSession={handleSelectSavedSession}
            onDeleteSession={handleDeleteSavedSession}
            currentData={studyData}
          />
        </div>

        {/* Free-form Input Area (Always available or collapsible when deck loaded) */}
        <div style={{ marginBottom: '2rem' }}>
          <PromptInput
            onSubmit={handleGenerate}
            isLoading={isLoading}
          />
        </div>

        {/* Loading State with Progress Steps & Cancel Guard */}
        {isLoading && (
          <LoadingState onCancel={handleCancelRequest} />
        )}

        {/* Error State with Diagnostic Details & Retry */}
        {error && !isLoading && (
          <ErrorState
            error={error}
            onRetry={() => handleGenerate(lastPrompt)}
          />
        )}

        {/* Active Study Tool View */}
        {studyData && !isLoading && (
          <ResultView
            data={studyData}
            onRefine={handleRefine}
            isRefining={isRefining}
          />
        )}
      </main>

      {/* Corporate Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-faint)',
          background: 'var(--bg-subtle)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <strong>CogniPlan AI</strong> · Frontend Technical Assessment Submission (Study Assistant)
          </div>
          <div>
            React-based structured learning workspace
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
