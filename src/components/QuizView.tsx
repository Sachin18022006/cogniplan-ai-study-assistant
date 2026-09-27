import { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Trophy,
  ChevronRight,
} from 'lucide-react';
import type { QuizQuestion } from '../types/result';

interface QuizViewProps {
  quiz: QuizQuestion[];
}

export const QuizView: React.FC<QuizViewProps> = ({ quiz: initialQuiz }) => {
  // Store user answers keyed by question ID
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  // Re-testing mode flag: whether we are currently testing only the questions the user got wrong
  const [isRetestingWrong, setIsRetestingWrong] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Active quiz pool (either full quiz or filtered wrong questions)
  const activeQuestions = isRetestingWrong
    ? initialQuiz.filter((q) => userAnswers[q.id] !== undefined && userAnswers[q.id] !== q.correctAnswerIndex)
    : initialQuiz;

  const currentQ = activeQuestions[currentIdx] || activeQuestions[0];
  const isAnswered = currentQ ? userAnswers[currentQ.id] !== undefined : false;
  const selectedAnswer = currentQ ? userAnswers[currentQ.id] : undefined;

  // Calculate overall performance
  const answeredTotal = Object.keys(userAnswers).length;
  const correctCount = initialQuiz.filter(
    (q) => userAnswers[q.id] === q.correctAnswerIndex
  ).length;
  const wrongCount = initialQuiz.filter(
    (q) => userAnswers[q.id] !== undefined && userAnswers[q.id] !== q.correctAnswerIndex
  ).length;
  const scorePercent = initialQuiz.length > 0 ? Math.round((correctCount / initialQuiz.length) * 100) : 0;

  const handleSelectOption = (qId: string, optionIdx: number) => {
    // If already answered, allow changing only if not in lock mode
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: optionIdx,
    }));
  };

  const handleNext = () => {
    if (currentIdx < activeQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setShowResults(true);
      if (scorePercent >= 70) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const handleRetestWrong = () => {
    setIsRetestingWrong(true);
    setCurrentIdx(0);
    setShowResults(false);
  };

  const handleResetFullQuiz = () => {
    setUserAnswers({});
    setIsRetestingWrong(false);
    setCurrentIdx(0);
    setShowResults(false);
  };

  if (!initialQuiz || initialQuiz.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        No quiz questions available for this module.
      </div>
    );
  }

  // Quiz Finished / Summary Screen
  if (showResults) {
    return (
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center',
        }}
        className="animate-fade-in"
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: scorePercent >= 75 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: `1px solid ${scorePercent >= 75 ? 'var(--emerald-500)' : 'var(--amber-500)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: scorePercent >= 75 ? 'var(--emerald-400)' : 'var(--amber-400)',
          }}
        >
          <Trophy size={32} />
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          {scorePercent === 100
            ? 'Flawless Mastery! 🌟'
            : scorePercent >= 75
            ? 'Exceptional Performance!'
            : 'Good Effort — Target Weak Areas'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          You scored <strong style={{ color: 'var(--emerald-400)' }}>{correctCount}</strong> out of{' '}
          <strong>{initialQuiz.length}</strong> questions ({scorePercent}%).
        </p>

        {/* Breakdown Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '2.5rem',
          }}
        >
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{initialQuiz.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase' }}>Total Questions</div>
          </div>
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--emerald-400)' }}>{correctCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase' }}>Correct</div>
          </div>
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: wrongCount > 0 ? 'var(--rose-400)' : 'var(--emerald-400)' }}>{wrongCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase' }}>Wrong Answers</div>
          </div>
        </div>

        {/* Action Buttons: Specially Highlighted "Re-Test Wrong Answers" */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {wrongCount > 0 && (
            <button
              onClick={handleRetestWrong}
              className="btn-primary"
              id="retest-wrong-answers-btn"
              style={{ background: 'linear-gradient(135deg, var(--amber-500), var(--amber-600))' }}
            >
              <RotateCcw size={16} />
              Re-Test {wrongCount} Wrong Answer{wrongCount > 1 ? 's' : ''} Only
            </button>
          )}

          <button onClick={handleResetFullQuiz} className="btn-secondary">
            <RotateCcw size={16} />
            Retake Full Quiz
          </button>
        </div>

        {/* Detailed Question Review List */}
        <div style={{ marginTop: '2.5rem', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
            Detailed Answers & Explanations Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {initialQuiz.map((q, idx) => {
              const uAns = userAnswers[q.id];
              const isCorrect = uAns === q.correctAnswerIndex;

              return (
                <div
                  key={q.id}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-subtle)',
                    border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    {isCorrect ? (
                      <CheckCircle size={18} style={{ color: 'var(--emerald-400)', marginTop: '2px', flexShrink: 0 }} />
                    ) : (
                      <XCircle size={18} style={{ color: 'var(--rose-400)', marginTop: '2px', flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                        {idx + 1}. {q.question}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Your choice: <strong style={{ color: isCorrect ? 'var(--emerald-400)' : 'var(--rose-400)' }}>
                          {uAns !== undefined ? q.options[uAns] : 'Not answered'}
                        </strong>
                      </div>
                      {!isCorrect && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--emerald-400)', marginTop: '0.2rem' }}>
                          Correct answer: <strong>{q.options[q.correctAnswerIndex]}</strong>
                        </div>
                      )}
                      <div
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.6rem 0.8rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-card)',
                          fontSize: '0.82rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        💡 <strong>Explanation:</strong> {q.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Active Interactive Question View
  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Quiz Progress Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-emerald">
            {isRetestingWrong ? 'Re-Testing Wrong Answers' : 'Active Quiz'}
          </span>
          <span className="badge badge-slate">
            Question {currentIdx + 1} of {activeQuestions.length}
          </span>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Answered: {answeredTotal} / {initialQuiz.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '4px',
          background: 'var(--bg-subtle)',
          borderRadius: '2px',
          marginBottom: '1.5rem',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((currentIdx + 1) / activeQuestions.length) * 100}%`,
            background: 'linear-gradient(90deg, var(--emerald-500), var(--emerald-400))',
            transition: 'width 0.25s ease',
          }}
        />
      </div>

      {/* Question Card */}
      <div
        style={{
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '1.5rem',
        }}
        className="animate-fade-in"
      >
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--emerald-400)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.75rem',
          }}
        >
          QUESTION {currentIdx + 1}
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.75rem', lineHeight: '1.5' }}>
          {currentQ.question}
        </h2>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {currentQ.options.map((option, optIdx) => {
            const isChosen = selectedAnswer === optIdx;
            const isCorrectOption = optIdx === currentQ.correctAnswerIndex;
            let optBackground = 'var(--bg-subtle)';
            let optBorder = 'var(--border-subtle)';
            let optTextColor = 'var(--text-main)';

            if (isAnswered) {
              if (isCorrectOption) {
                optBackground = 'rgba(16, 185, 129, 0.15)';
                optBorder = 'var(--emerald-500)';
                optTextColor = '#ffffff';
              } else if (isChosen) {
                optBackground = 'rgba(244, 63, 94, 0.15)';
                optBorder = 'var(--rose-500)';
                optTextColor = '#ffffff';
              }
            } else if (isChosen) {
              optBackground = 'var(--bg-card-hover)';
              optBorder = 'var(--emerald-500)';
            }

            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(currentQ.id, optIdx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: optBackground,
                  border: `1px solid ${optBorder}`,
                  color: optTextColor,
                  textAlign: 'left',
                  fontSize: '0.92rem',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: `1px solid ${isChosen ? 'var(--emerald-500)' : 'var(--border-medium)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: isChosen ? 'var(--emerald-600)' : 'transparent',
                    color: isChosen ? '#ffffff' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  {String.fromCharCode(65 + optIdx)}
                </div>
                <span style={{ flex: 1 }}>{option}</span>

                {isAnswered && isCorrectOption && (
                  <CheckCircle size={18} style={{ color: 'var(--emerald-400)', marginLeft: '0.5rem' }} />
                )}
                {isAnswered && isChosen && !isCorrectOption && (
                  <XCircle size={18} style={{ color: 'var(--rose-400)', marginLeft: '0.5rem' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Immediate Pedagogical Explanation */}
        {isAnswered && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: selectedAnswer === currentQ.correctAnswerIndex
                ? 'rgba(16, 185, 129, 0.08)'
                : 'rgba(244, 63, 94, 0.08)',
              border: `1px solid ${
                selectedAnswer === currentQ.correctAnswerIndex
                  ? 'rgba(16, 185, 129, 0.25)'
                  : 'rgba(244, 63, 94, 0.25)'
              }`,
            }}
            className="animate-fade-in"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              {selectedAnswer === currentQ.correctAnswerIndex ? (
                <span style={{ color: 'var(--emerald-400)', fontWeight: 700, fontSize: '0.85rem' }}>
                  ✓ CORRECT!
                </span>
              ) : (
                <span style={{ color: 'var(--rose-400)', fontWeight: 700, fontSize: '0.85rem' }}>
                  ✗ INCORRECT — REVIEW RATIONALE
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.55' }}>
              {currentQ.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
          disabled={currentIdx === 0}
          className="btn-secondary"
        >
          Previous Question
        </button>

        <button
          onClick={handleNext}
          disabled={!isAnswered}
          className="btn-primary"
          id="quiz-next-btn"
        >
          {currentIdx === activeQuestions.length - 1 ? 'View Final Results' : 'Next Question'}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};
