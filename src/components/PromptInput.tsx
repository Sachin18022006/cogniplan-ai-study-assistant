import { useState } from 'react';
import { Sparkles, BookOpen, RotateCcw } from 'lucide-react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const PRESET_TOPICS = [
  {
    title: 'React Fiber & Concurrent Engine',
    desc: 'Reconciliation, WorkLoop, lane-based scheduling, and state queue',
    text: `React Fiber Architecture and Concurrent Features:
Explain the internal workings of React Fiber. Cover how React moved from stack-based reconciliation to a cooperative scheduling model using Fibers. Detail the workLoopConcurrent, time slicing, expiration times, lane priorities, render phase vs commit phase, and how React handles interruptions and high-priority user events like typing. Include key terms like alternate fibers, effect tags, workInProgress tree, and memory implications.`,
  },
  {
    title: 'Distributed Systems & Eventual Consistency',
    desc: 'CAP theorem, PACELC, 2PC vs Saga, and distributed consensus',
    text: `Distributed Systems Design & Consistency Models:
Provide a rigorous study guide covering the CAP Theorem, PACELC, Eventual Consistency, Linearizability, and Strong Eventual Consistency. Explain two-phase commit (2PC) versus the Saga pattern (choreography vs orchestration) for distributed transactions. Detail consensus algorithms (Raft leadership election, log replication) and conflict resolution techniques like Vector Clocks and CRDTs.`,
  },
  {
    title: 'PostgreSQL Indexing & Query Execution',
    desc: 'B-Trees, GiST, GIN, BRIN, WAL, and MVCC internals',
    text: `Database Internals & PostgreSQL Performance Optimization:
Deep dive into database engine internals. Compare B-Tree index structures, GIN, GiST, and BRIN indexes with specific use cases. Explain Multi-Version Concurrency Control (MVCC), transaction isolation anomalies (dirty reads, non-repeatable reads, phantom reads, write skew), Write-Ahead Logging (WAL), VACUUM processes, and EXPLAIN ANALYZE execution plans.`,
  },
  {
    title: 'Machine Learning: Transformer Architecture',
    desc: 'Self-attention, Positional Encodings, Multi-Head projection',
    text: `Foundations of the Transformer Architecture:
Comprehensive technical study guide for Transformers (Vaswani et al. "Attention Is All You Need"). Explain Scaled Dot-Product Attention: Q, K, V matrices, why scaling factor sqrt(d_k) is required. Detail Multi-Head Attention, rotary vs sinusoidal positional encodings, layer normalization (Pre-LN vs Post-LN), feedforward networks, encoder-decoder cross-attention, and training efficiency techniques like FlashAttention.`,
  },
];

export const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [promptText, setPromptText] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || isLoading) return;
    onSubmit(promptText.trim());
  };

  const handleApplyPreset = (text: string) => {
    setPromptText(text);
  };

  return (
    <div
      style={{
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <label
            htmlFor="study-prompt-input"
            style={{
              fontSize: '0.92rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <BookOpen size={17} style={{ color: 'var(--emerald-400)' }} />
            Free-Form Study Notes, Syllabus, or Technical Topic
          </label>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-faint)', fontFamily: 'JetBrains Mono, monospace' }}>
            {promptText.length} characters
          </span>
        </div>

        <textarea
          id="study-prompt-input"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Paste lecture notes, interview topics, code documentation, or syllabus here... e.g., 'Kubernetes networking: CNI, kube-proxy, CoreDNS, and ingress controllers'"
          rows={5}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-main)',
            fontSize: '0.92rem',
            lineHeight: '1.6',
            resize: 'vertical',
            outline: 'none',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--emerald-500)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border-medium)')}
        />

        {/* Quick Presets for Evaluator */}
        <div style={{ marginTop: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>
            Suggested Topics:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {PRESET_TOPICS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset.text)}
                disabled={isLoading}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--emerald-400)';
                  e.currentTarget.style.borderColor = 'var(--emerald-600)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {promptText && (
              <button
                type="button"
                onClick={() => setPromptText('')}
                className="btn-ghost"
                style={{ fontSize: '0.8rem' }}
                disabled={isLoading}
              >
                <RotateCcw size={13} />
                Clear
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !promptText.trim()}
            className="btn-primary"
            id="generate-study-plan-btn"
          >
            <Sparkles size={17} />
            Generate Structured Study System
          </button>
        </div>
      </form>
    </div>
  );
};
