import { History, Download, Trash2, FolderOpen } from 'lucide-react';
import type { SavedSession, StudyPlanData } from '../types/result';

interface SessionHistoryProps {
  sessions: SavedSession[];
  activeSessionId?: string;
  onSelectSession: (session: SavedSession) => void;
  onDeleteSession: (id: string) => void;
  currentData?: StudyPlanData | null;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  currentData,
}) => {
  const exportAsMarkdown = () => {
    if (!currentData) return;

    let md = `# Study Plan & Knowledge Deck: ${currentData.topic}\n\n`;
    md += `**Difficulty:** ${currentData.difficultyLevel} | **Estimated Time:** ${currentData.estimatedStudyTimeMinutes} minutes\n\n`;
    md += `## Executive Summary\n${currentData.summary}\n\n`;

    md += `## Key Concepts\n`;
    currentData.keyConcepts.forEach((kc, i) => {
      md += `### ${i + 1}. ${kc.title} [${kc.importance}]\n`;
      md += `${kc.definition}\n`;
      if (kc.pitfallOrTip) {
        md += `> **Tip/Pitfall:** ${kc.pitfallOrTip}\n`;
      }
      md += `\n`;
    });

    md += `## Flashcards (${currentData.cards.length})\n`;
    currentData.cards.forEach((c, i) => {
      md += `**Card ${i + 1} (${c.category || 'General'}):** ${c.question}\n`;
      md += `*Answer:* ${c.answer}\n\n`;
    });

    md += `## Quiz Questions (${currentData.quiz.length})\n`;
    currentData.quiz.forEach((q, i) => {
      md += `**Q${i + 1}: ${q.question}**\n`;
      q.options.forEach((opt, idx) => {
        md += `- [${idx === q.correctAnswerIndex ? 'x' : ' '}] ${opt}\n`;
      });
      md += `*Explanation:* ${q.explanation}\n\n`;
    });

    md += `## Phased Roadmap\n`;
    currentData.studyPlan.forEach((phase) => {
      md += `### ${phase.phase} (~${phase.durationMinutes}m)\n`;
      phase.tasks.forEach((t) => {
        md += `- [${t.isCompleted ? 'x' : ' '}] **${t.task}**${t.description ? `: ${t.description}` : ''}\n`;
      });
      md += `\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentData.topic.toLowerCase().replace(/[^a-z0-9]/g, '-')}-study-deck.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = () => {
    if (!currentData) return;
    const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentData.topic.toLowerCase().replace(/[^a-z0-9]/g, '-')}-study-deck.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={17} style={{ color: 'var(--emerald-400)' }} />
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Saved Sessions & Export
          </span>
          <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
            {sessions.length} Saved
          </span>
        </div>

        {currentData && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={exportAsMarkdown} className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
              <Download size={13} />
              Export Markdown
            </button>
            <button onClick={exportAsJSON} className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
              <Download size={13} />
              Export JSON
            </button>
          </div>
        )}
      </div>

      {sessions.length === 0 ? (
        <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem' }}>
          No previous sessions stored yet. Sessions are auto-saved to local browser storage upon generation.
        </p>
      ) : (
        <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {sessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            const dateStr = new Date(sess.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={sess.id}
                style={{
                  minWidth: '220px',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--bg-subtle)' : 'var(--bg-app)',
                  border: `1px solid ${isActive ? 'var(--emerald-500)' : 'var(--border-subtle)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{dateStr}</span>
                    <button
                      onClick={() => onDeleteSession(sess.id)}
                      title="Delete saved session"
                      style={{ color: 'var(--text-faint)', padding: '2px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: isActive ? 'var(--emerald-400)' : 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '0.2rem',
                    }}
                  >
                    {sess.topic}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {sess.data.cards.length} cards • {sess.data.quiz.length} questions
                  </div>
                </div>

                <button
                  onClick={() => onSelectSession(sess)}
                  className={isActive ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', width: '100%' }}
                >
                  <FolderOpen size={12} />
                  {isActive ? 'Current Active Session' : 'Load Session'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
