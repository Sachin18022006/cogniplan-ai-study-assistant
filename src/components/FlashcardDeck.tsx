import { useState, useEffect, useCallback } from 'react';
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  CheckCircle2,
} from 'lucide-react';
import type { Flashcard } from '../types/result';

interface FlashcardDeckProps {
  cards: Flashcard[];
  onToggleMastered?: (cardId: string) => void;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards: initialCards }) => {
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unmastered' | 'mastered'>('all');

  // Keep cards in sync when props change
  useEffect(() => {
    setCards(initialCards);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [initialCards]);

  const filteredCards = cards.filter((card) => {
    if (filter === 'mastered') return Boolean(card.mastered);
    if (filter === 'unmastered') return !card.mastered;
    return true;
  });

  const activeCard = filteredCards[currentIndex] || filteredCards[0];
  const totalInFilter = filteredCards.length;
  const masteredCount = cards.filter((c) => c.mastered).length;

  const handleNext = useCallback(() => {
    if (totalInFilter <= 1) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % totalInFilter);
    }, 150);
  }, [totalInFilter]);

  const handlePrev = useCallback(() => {
    if (totalInFilter <= 1) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + totalInFilter) % totalInFilter);
    }, 150);
  }, [totalInFilter]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleToggleCurrentMastered = () => {
    if (!activeCard) return;
    setCards((prev) =>
      prev.map((c) =>
        c.id === activeCard.id ? { ...c, mastered: !c.mastered } : c
      )
    );
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
  };

  // Keyboard navigation support: Arrow Left/Right to browse, Space/Enter to flip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev]);

  if (!cards || cards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        No flashcards generated for this topic.
      </div>
    );
  }

  if (totalInFilter === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '3rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          No cards match the selected filter ({filter}).
        </p>
        <button onClick={() => setFilter('all')} className="btn-secondary">
          Reset Filter to All ({cards.length})
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Deck Controls Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-emerald">
            Card {currentIndex + 1} of {totalInFilter}
          </span>
          <span className="badge badge-slate">
            {masteredCount}/{cards.length} Mastered
          </span>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            onClick={() => { setFilter('all'); setCurrentIndex(0); setIsFlipped(false); }}
            style={{
              fontSize: '0.78rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '9999px',
              background: filter === 'all' ? 'var(--emerald-600)' : 'var(--bg-card)',
              color: filter === 'all' ? '#ffffff' : 'var(--text-muted)',
              border: `1px solid ${filter === 'all' ? 'var(--emerald-500)' : 'var(--border-subtle)'}`,
            }}
          >
            All ({cards.length})
          </button>
          <button
            onClick={() => { setFilter('unmastered'); setCurrentIndex(0); setIsFlipped(false); }}
            style={{
              fontSize: '0.78rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '9999px',
              background: filter === 'unmastered' ? 'var(--amber-600)' : 'var(--bg-card)',
              color: filter === 'unmastered' ? '#ffffff' : 'var(--text-muted)',
              border: `1px solid ${filter === 'unmastered' ? 'var(--amber-500)' : 'var(--border-subtle)'}`,
            }}
          >
            Review ({cards.length - masteredCount})
          </button>
          <button
            onClick={() => { setFilter('mastered'); setCurrentIndex(0); setIsFlipped(false); }}
            style={{
              fontSize: '0.78rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '9999px',
              background: filter === 'mastered' ? 'var(--emerald-700)' : 'var(--bg-card)',
              color: filter === 'mastered' ? '#ffffff' : 'var(--text-muted)',
              border: `1px solid ${filter === 'mastered' ? 'var(--emerald-500)' : 'var(--border-subtle)'}`,
            }}
          >
            Mastered ({masteredCount})
          </button>

          <button
            onClick={handleShuffle}
            title="Shuffle flashcards"
            className="btn-ghost"
            style={{ padding: '0.3rem 0.5rem' }}
          >
            <Shuffle size={14} />
          </button>
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
            width: `${((currentIndex + 1) / totalInFilter) * 100}%`,
            background: 'linear-gradient(90deg, var(--emerald-500), var(--emerald-400))',
            transition: 'width 0.25s ease',
          }}
        />
      </div>

      {/* 3D Interactive Flip Card */}
      <div className="flip-card-perspective">
        <div
          className={`flip-card-inner ${isFlipped ? 'is-flipped' : ''}`}
          onClick={handleFlip}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          aria-label="Flashcard. Click or press Space to flip."
        >
          {/* Front Face (Question) */}
          <div className="flip-card-face">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                {activeCard.category || 'Core Question'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <RotateCw size={12} /> Click or Space to reveal
              </span>
            </div>

            <div style={{ margin: 'auto 0', padding: '1.5rem 0' }}>
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
                PROMPT
              </div>
              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  lineHeight: '1.45',
                  color: 'var(--text-main)',
                }}
              >
                {activeCard.question}
              </h2>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                Difficulty: <strong style={{ color: 'var(--amber-400)' }}>{activeCard.difficulty || 'Medium'}</strong>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {activeCard.mastered ? '★ Marked as Mastered' : '○ Still Learning'}
              </span>
            </div>
          </div>

          {/* Back Face (Answer) */}
          <div className="flip-card-face flip-card-back">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                ANSWER & EXPLANATION
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <RotateCw size={12} /> Click to flip back
              </span>
            </div>

            <div style={{ margin: 'auto 0', padding: '1.5rem 0' }}>
              <p
                style={{
                  fontSize: '1.15rem',
                  lineHeight: '1.6',
                  color: 'var(--text-main)',
                  fontWeight: 500,
                }}
              >
                {activeCard.answer}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                Concept ID: {activeCard.id}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--emerald-400)', fontWeight: 600 }}>
                Active Recall Reinforced
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Action Controls & Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <button
          onClick={handlePrev}
          className="btn-secondary"
          disabled={totalInFilter <= 1}
          style={{ padding: '0.6rem 1.1rem' }}
        >
          <ChevronLeft size={18} />
          Previous
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            onClick={handleFlip}
            className="btn-secondary"
            style={{ padding: '0.6rem 1.25rem' }}
          >
            <RotateCw size={16} />
            Flip Card
          </button>
          <button
            onClick={handleToggleCurrentMastered}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              fontWeight: 600,
              background: activeCard?.mastered ? 'var(--emerald-700)' : 'var(--bg-subtle)',
              color: activeCard?.mastered ? '#ffffff' : 'var(--text-muted)',
              border: `1px solid ${activeCard?.mastered ? 'var(--emerald-500)' : 'var(--border-medium)'}`,
              transition: 'all 0.2s ease',
            }}
          >
            <CheckCircle2 size={16} />
            {activeCard?.mastered ? 'Mastered ✓' : 'Mark as Mastered'}
          </button>
        </div>

        <button
          onClick={handleNext}
          className="btn-primary"
          disabled={totalInFilter <= 1}
          style={{ padding: '0.6rem 1.25rem' }}
        >
          Next
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Keyboard Shortcuts Helper */}
      <div
        style={{
          marginTop: '1.25rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-faint)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        <span><kbd style={{ background: 'var(--bg-card)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>Space</kbd> Flip</span>
        <span><kbd style={{ background: 'var(--bg-card)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>←</kbd> Prev</span>
        <span><kbd style={{ background: 'var(--bg-card)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>→</kbd> Next</span>
      </div>
    </div>
  );
};
