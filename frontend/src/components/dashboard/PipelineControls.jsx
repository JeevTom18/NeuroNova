/** Pipeline Controls — failure simulator dropdown + trigger button (Design.md §3.1) */
import { useState, useRef, useEffect } from 'react';

const STAGES = ['INGESTING', 'NORMALIZING', 'VALIDATING', 'DEDUPLICATING', 'ARCHIVING'];
const FAILURE_SOURCES = [
  { id: null,          label: 'No Failure Simulation',       color: 'var(--success)' },
  { id: 'customer',    label: 'Fail Customer Source',        color: 'var(--danger)'  },
  { id: 'product',     label: 'Fail Product Source',         color: 'var(--danger)'  },
  { id: 'transaction', label: 'Fail Transaction Source',     color: 'var(--danger)'  },
];

export default function PipelineControls({ isRunning, status, onRun, simFailure, setSimFailure }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const stageIdx = STAGES.indexOf(status?.stage || 'IDLE');
  const progress = isRunning ? Math.min(95, ((stageIdx + 1) / STAGES.length) * 100) : 0;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = FAILURE_SOURCES.find(f => f.id === simFailure) || FAILURE_SOURCES[0];

  return (
    <div className="flex-center gap-3" style={{ flexWrap: 'wrap' }}>
      {/* Failure Simulator Dropdown */}
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setOpen(o => !o)}
          style={{
            gap: 7,
            borderColor: simFailure ? 'rgba(245,158,11,0.35)' : undefined,
            color: simFailure ? 'var(--warning)' : undefined,
            background: simFailure ? 'rgba(245,158,11,0.08)' : undefined,
          }}
          aria-haspopup="true"
          aria-expanded={open}
          data-testid="failure-toggle"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {simFailure ? `⚠ Fail: ${simFailure}` : 'Simulate Failure'}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: 'var(--surface-1)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            minWidth: 220, zIndex: 200, padding: 6,
            animation: 'slideUp 0.15s ease',
          }}>
            {FAILURE_SOURCES.map(src => (
              <button
                key={String(src.id)}
                onClick={() => { setSimFailure(src.id); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '9px 12px', border: 'none', borderRadius: 'var(--radius)',
                  background: simFailure === src.id ? 'rgba(255,255,255,0.05)' : 'none',
                  color: src.color, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = simFailure === src.id ? 'rgba(255,255,255,0.05)' : 'none'}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: src.color, flexShrink: 0 }} />
                {src.label}
                {simFailure === src.id && <span style={{ marginLeft: 'auto', opacity: 0.8 }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Progress / Trigger */}
      {isRunning ? (
        <div className="flex-center gap-3" style={{ minWidth: 260 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'JetBrains Mono, monospace' }}>
                {status?.stage || 'INGESTING'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <span className="spinner" style={{ color: 'var(--accent)' }} />
        </div>
      ) : (
        <button
          className="btn btn-primary"
          onClick={() => onRun(simFailure)}
          disabled={isRunning}
          data-testid="pipeline-trigger-btn"
          style={{ fontSize: 13.5, padding: '9px 22px' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Run Pipeline
        </button>
      )}
    </div>
  );
}