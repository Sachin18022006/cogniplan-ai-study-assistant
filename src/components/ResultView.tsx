import { useState } from 'react';
import {
  Layers,
  HelpCircle,
  Calendar,
  Lightbulb,
  Clock,
  Gauge,
} from 'lucide-react';
import type { StudyPlanData } from '../types/result';
import { FlashcardDeck } from './FlashcardDeck';
import { QuizView } from './QuizView';
import { StudyPlanView } from './StudyPlanView';
import { KeyConceptsView } from './KeyConceptsView';
import { RefinementBar } from './RefinementBar';

interface ResultViewProps {
  data: StudyPlanData;
  onRefine: (instruction: string) => void;
  isRefining: boolean;
}

type TabType = 'cards' | 'quiz' | 'plan' | 'concepts';

export const ResultView: React.FC<ResultViewProps> = ({
  data,
  onRefine,
  isRefining,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('cards');

  const getDifficultyBadge = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'badge-emerald';
      case 'Advanced':
        return 'badge-rose';
      case 'Intermediate':
      default:
        return 'badge-amber';
    }
  };

  return (
    <div className="animate-fade-in" style={{ marginTop: '2rem' }}>
      {/* Topic Header & Meta Strip */}
      <div
        style={{
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span className={`badge ${getDifficultyBadge(data.difficultyLevel)}`}>
                <Gauge size={12} />
                {data.difficultyLevel} Level
              </span>
              <span className="badge badge-slate">
                <Clock size={12} />
                {data.estimatedStudyTimeMinutes} Mins Suggested
              </span>
              <span className="badge badge-emerald">
                {data.cards.length} Flashcards
              </span>
              <span className="badge badge-amber">
                {data.quiz.length} Quiz Questions
              </span>
            </div>
            <h1
              style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                letterSpacing: '-0.02em',
                lineHeight: '1.25',
              }}
            >
              {data.topic}
            </h1>
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '880px' }}>
          {data.summary}
        </p>

        {/* View Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.2rem',
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => setActiveTab('cards')}
            id="tab-flashcards"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.92rem',
              color: activeTab === 'cards' ? 'var(--emerald-400)' : 'var(--text-muted)',
              borderBottom: `2px solid ${activeTab === 'cards' ? 'var(--emerald-400)' : 'transparent'}`,
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={17} />
            Interactive Flashcards ({data.cards.length})
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            id="tab-quiz"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.92rem',
              color: activeTab === 'quiz' ? 'var(--emerald-400)' : 'var(--text-muted)',
              borderBottom: `2px solid ${activeTab === 'quiz' ? 'var(--emerald-400)' : 'transparent'}`,
              transition: 'all 0.15s ease',
            }}
          >
            <HelpCircle size={17} />
            Mastery Quiz ({data.quiz.length})
          </button>

          <button
            onClick={() => setActiveTab('plan')}
            id="tab-plan"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.92rem',
              color: activeTab === 'plan' ? 'var(--emerald-400)' : 'var(--text-muted)',
              borderBottom: `2px solid ${activeTab === 'plan' ? 'var(--emerald-400)' : 'transparent'}`,
              transition: 'all 0.15s ease',
            }}
          >
            <Calendar size={17} />
            Milestone Roadmap ({data.studyPlan.length} Phases)
          </button>

          <button
            onClick={() => setActiveTab('concepts')}
            id="tab-concepts"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.92rem',
              color: activeTab === 'concepts' ? 'var(--emerald-400)' : 'var(--text-muted)',
              borderBottom: `2px solid ${activeTab === 'concepts' ? 'var(--emerald-400)' : 'transparent'}`,
              transition: 'all 0.15s ease',
            }}
          >
            <Lightbulb size={17} />
            Key Concepts & Tips ({data.keyConcepts.length})
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div style={{ minHeight: '400px', marginBottom: '2rem' }}>
        {activeTab === 'cards' && <FlashcardDeck cards={data.cards} />}
        {activeTab === 'quiz' && <QuizView quiz={data.quiz} />}
        {activeTab === 'plan' && (
          <StudyPlanView
            studyPlan={data.studyPlan}
            totalEstimatedMinutes={data.estimatedStudyTimeMinutes}
          />
        )}
        {activeTab === 'concepts' && (
          <KeyConceptsView concepts={data.keyConcepts} summary={data.summary} />
        )}
      </div>

      {/* Iterative AI Refinement Loop (Stretch Goal #3) */}
      <RefinementBar onRefine={onRefine} isLoading={isRefining} />
    </div>
  );
};
