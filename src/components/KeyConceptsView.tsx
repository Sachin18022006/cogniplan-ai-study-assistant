import { Lightbulb, Bookmark } from 'lucide-react';
import type { KeyConcept } from '../types/result';

interface KeyConceptsViewProps {
  concepts: KeyConcept[];
  summary: string;
}

export const KeyConceptsView: React.FC<KeyConceptsViewProps> = ({ concepts, summary }) => {
  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* Executive Summary Card */}
      {summary && (
        <div
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Bookmark size={18} style={{ color: 'var(--emerald-400)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Executive Conceptual Overview
            </h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.65' }}>
            {summary}
          </p>
        </div>
      )}

      {/* Concepts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {concepts.map((concept) => {
          let badgeClass = 'badge-slate';
          if (concept.importance === 'Essential') badgeClass = 'badge-emerald';
          if (concept.importance === 'High') badgeClass = 'badge-amber';

          return (
            <div
              key={concept.id}
              style={{
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {concept.title}
                  </h4>
                  <span className={`badge ${badgeClass}`}>{concept.importance}</span>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.55', marginBottom: '1.25rem' }}>
                  {concept.definition}
                </p>
              </div>

              {concept.pitfallOrTip && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                  }}
                >
                  <Lightbulb size={16} style={{ color: 'var(--amber-400)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--amber-400)' }}>High-Yield Tip / Pitfall:</strong>{' '}
                    {concept.pitfallOrTip}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
