import { useState } from 'react';
import { Send, Wand2 } from 'lucide-react';

interface RefinementBarProps {
  onRefine: (instruction: string) => void;
  isLoading: boolean;
}

const QUICK_REFINEMENTS = [
  'Add 3 advanced scenario-based questions',
  'Make flashcard answers more concise and bulleted',
  'Condense study plan into a rapid 45-minute sprint',
  'Add a section focusing on common interview pitfalls',
];

export const RefinementBar: React.FC<RefinementBarProps> = ({ onRefine, isLoading }) => {
  const [instruction, setInstruction] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isLoading) return;
    onRefine(instruction.trim());
    setInstruction('');
  };

  return (
    <div
      style={{
        marginTop: '2rem',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Wand2 size={16} style={{ color: 'var(--emerald-400)' }} />
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Refine Your Study Material
        </span>
        <span className="badge badge-emerald" style={{ fontSize: '0.68rem', marginLeft: 'auto' }}>
          Keeps Your Current Content
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.85rem' }}>
        {QUICK_REFINEMENTS.map((quick, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onRefine(quick)}
            disabled={isLoading}
            style={{
              fontSize: '0.75rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '9999px',
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
            + {quick}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.65rem' }}>
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. 'Emphasize time complexity and memory overhead in flashcards...'"
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-main)',
            fontSize: '0.88rem',
            outline: 'none',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--emerald-500)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border-medium)')}
        />
        <button
          type="submit"
          disabled={isLoading || !instruction.trim()}
          className="btn-primary"
          style={{ padding: '0.65rem 1.2rem', fontSize: '0.88rem' }}
        >
          <Send size={15} />
          Apply Changes
        </button>
      </form>
    </div>
  );
};
