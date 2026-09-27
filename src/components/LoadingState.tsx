import { useState, useEffect } from 'react';
import { Loader2, XCircle, Sparkles, Brain, CheckCircle2 } from 'lucide-react';

interface LoadingStateProps {
  onCancel?: () => void;
  statusText?: string;
}

const STAGES = [
  { id: 1, label: 'Reading and distilling core concepts...', icon: Brain },
  { id: 2, label: 'Generating active-recall flashcard deck...', icon: Sparkles },
  { id: 3, label: 'Formulating multi-choice quiz with explanations...', icon: CheckCircle2 },
  { id: 4, label: 'Synthesizing phased milestone study plan...', icon: Sparkles },
];

export const LoadingState: React.FC<LoadingStateProps> = ({ onCancel, statusText }) => {
  const [activeStage, setActiveStage] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    const stageTimer = setInterval(() => {
      setActiveStage((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 2500);

    return () => {
      clearInterval(timer);
      clearInterval(stageTimer);
    };
  }, []);

  return (
    <div
      style={{
        maxWidth: '720px',
        margin: '2.5rem auto',
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
          width: '56px',
          height: '56px',
          margin: '0 auto 1.5rem',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--emerald-400)',
        }}
      >
        <Loader2 size={28} className="animate-spin" />
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
        {statusText || 'Architecting Your Structured Study System...'}
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
        AI is extracting concepts and assembling your structured study system. ({seconds}s elapsed)
      </p>

      {/* Progress Stages */}
      <div
        style={{
          maxWidth: '460px',
          margin: '0 auto 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          textAlign: 'left',
        }}
      >
        {STAGES.map((stage, idx) => {
          const isDone = idx < activeStage;
          const isCurrent = idx === activeStage;
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: isCurrent ? 'var(--bg-subtle)' : 'transparent',
                border: `1px solid ${isCurrent ? 'var(--border-medium)' : 'transparent'}`,
                opacity: isDone || isCurrent ? 1 : 0.45,
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isDone
                    ? 'var(--emerald-500)'
                    : isCurrent
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'var(--border-subtle)',
                  color: isDone ? '#ffffff' : 'var(--emerald-400)',
                  fontSize: '0.75rem',
                }}
              >
                {isDone ? '✓' : <Icon size={12} />}
              </div>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent ? 'var(--text-main)' : 'var(--text-muted)',
                }}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="btn-secondary"
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          <XCircle size={15} />
          Cancel Generation
        </button>
      )}
    </div>
  );
};
