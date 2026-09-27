import { useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Copy, Check, FileQuestion, WifiOff } from 'lucide-react';
import type { ParseValidationFailure } from '../types/result';

interface ErrorStateProps {
  error: ParseValidationFailure | { message: string; errorType?: string; rawSnippet?: string; debugDetails?: string };
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const getErrorMeta = () => {
    switch (error.errorType) {
      case 'MALFORMED_JSON':
        return {
          title: 'Malformed AI Output (JSON Syntax Error)',
          badge: 'Parser Error',
          icon: <AlertTriangle size={24} className="text-amber-400" />,
          description: 'The AI model generated response text that could not be parsed as valid JSON. This typically happens if the model got cut off or included unescaped control characters.',
          color: 'var(--amber-500)',
          badgeClass: 'badge-amber',
        };
      case 'INVALID_SHAPE':
        return {
          title: 'Unexpected Data Structure (Schema Mismatch)',
          badge: 'Validation Guard',
          icon: <FileQuestion size={24} className="text-amber-400" />,
          description: 'The model returned JSON, but key fields like flashcard decks or quiz questions were missing or formatted incorrectly. Our structural validator safely stopped it before it could crash your UI.',
          color: 'var(--amber-500)',
          badgeClass: 'badge-amber',
        };
      case 'EMPTY_RESPONSE':
        return {
          title: 'Empty Response Received',
          badge: 'Zero Content',
          icon: <AlertTriangle size={24} className="text-rose-400" />,
          description: 'The AI model returned an empty body. This can occur if the prompt triggered a safety filter or an internal timeout.',
          color: 'var(--rose-500)',
          badgeClass: 'badge-rose',
        };
      case 'NETWORK_ERROR':
      default:
        return {
          title: 'Communication or Server Error',
          badge: 'Network / Proxy',
          icon: <WifiOff size={24} className="text-rose-400" />,
          description: error.message || 'Failed to reach the backend proxy or Gemini API. Please check server status.',
          color: 'var(--rose-500)',
          badgeClass: 'badge-rose',
        };
    }
  };

  const meta = getErrorMeta();

  const handleCopy = () => {
    const textToCopy = `Error Type: ${error.errorType}\nMessage: ${error.message}\nRaw Snippet: ${error.rawSnippet || 'N/A'}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        maxWidth: '720px',
        margin: '2rem auto',
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)',
      }}
      className="animate-fade-in"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div
          style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {meta.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {meta.title}
            </h3>
            <span className={`badge ${meta.badgeClass}`}>{meta.badge}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
            {meta.description}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <button onClick={onRetry} className="btn-primary">
              <RefreshCw size={16} />
              Retry Request
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="btn-ghost"
              style={{ marginLeft: 'auto' }}
            >
              {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showDetails ? 'Hide Diagnostics' : 'Inspect Diagnostic Details'}
            </button>
          </div>

          {showDetails && (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-medium)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-faint)', fontWeight: 600 }}>DIAGNOSTIC LOG</span>
                <button
                  onClick={handleCopy}
                  className="btn-ghost"
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                >
                  {copied ? <Check size={12} style={{ color: 'var(--emerald-400)' }} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ color: 'var(--rose-400)', marginBottom: '0.5rem' }}>
                <strong>Message:</strong> {error.message}
              </div>
              {error.rawSnippet && (
                <div>
                  <div style={{ color: 'var(--text-faint)', marginBottom: '0.25rem' }}>Raw Model Output (Snippet):</div>
                  <pre
                    style={{
                      maxHeight: '160px',
                      overflowY: 'auto',
                      padding: '0.75rem',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {error.rawSnippet}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
