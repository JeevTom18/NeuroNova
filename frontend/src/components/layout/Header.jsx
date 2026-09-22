/** Global header — brand, live backend status badge, pipeline trigger (Design.md §3.1) */
import { useEffect, useState } from 'react';
import PipelineControls from '../dashboard/PipelineControls';
import { api } from '../../api';

export default function Header({ isRunning, status, onRun, simulateFailureSource, onSimulateFailure }) {
  const [backendOnline, setBackendOnline] = useState(null); // null = checking

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        await api.health();
        if (!cancelled) setBackendOnline(true);
      } catch {
        if (!cancelled) setBackendOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <header className="glass" style={{ padding: '14px 24px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Acentra Ingestion Core</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '3px 10px', borderRadius: 999,
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px',
            background: backendOnline ? 'rgba(16,185,129,0.15)' : backendOnline === false ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.15)',
            color: backendOnline ? '#10b981' : backendOnline === false ? '#ef4444' : '#94a3b8',
            fontFamily: 'monospace',
          }} data-testid="backend-status">
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: backendOnline ? '#10b981' : backendOnline === false ? '#ef4444' : '#94a3b8',
              boxShadow: backendOnline ? '0 0 8px #10b981' : 'none',
              animation: backendOnline ? 'pulse 2s ease-in-out infinite' : 'none',
            }} />
            {backendOnline ? 'CONNECTED' : backendOnline === false ? 'OFFLINE' : 'CHECKING'}
          </span>
        </div>
        <PipelineControls
          isRunning={isRunning}
          status={status}
          onRun={onRun}
          simulateFailureSource={simulateFailureSource}
          onSimulateFailure={onSimulateFailure}
        />
      </div>
    </header>
  );
}