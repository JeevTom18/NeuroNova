/** Premium Source Health Card with animated glow indicator and stat breakdown */
import { memo, useEffect, useState } from 'react';

const SOURCE_META = {
  customer_source: {
    label: 'Customer Source',
    icon: '👤',
    description: 'CRM & identity records',
    color: '#10b981',
    varName: '--src-color',
  },
  product_source: {
    label: 'Product Source',
    icon: '📦',
    description: 'Product catalog data',
    color: '#3b82f6',
    varName: '--src-color',
  },
  transaction_source: {
    label: 'Transaction Source',
    icon: '💳',
    description: 'Payment & order events',
    color: '#f59e0b',
    varName: '--src-color',
  },
};

const DEFAULT_META = {
  label: 'Unknown Source',
  icon: '🔌',
  description: '',
  color: '#94a3b8',
};

function statusDotClass(status) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'FAILED')  return 'offline';
  if (status === 'RUNNING' || status === 'PENDING') return 'degraded';
  return 'unknown';
}

function statusLabel(status) {
  const map = {
    SUCCESS: 'Healthy', FAILED: 'Failed', RUNNING: 'Running',
    PENDING: 'Pending', null: 'No Data',
  };
  return map[status] ?? status ?? 'No Data';
}

const SourceCard = memo(function SourceCard({ name, status, records_received, last_error, latency_ms }) {
  const meta = SOURCE_META[name] || DEFAULT_META;
  const dotClass = statusDotClass(status);
  const [flash, setFlash] = useState(false);

  // Flash on status change
  useEffect(() => {
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 600);
    return () => clearTimeout(t);
  }, [status]);

  const badgeClass = {
    SUCCESS: 'badge-success', FAILED: 'badge-danger', RUNNING: 'badge-info',
    PENDING: 'badge-info',
  }[status] || 'badge-muted';

  return (
    <div
      className="card source-card"
      data-testid={`source-${name}`}
      style={{ '--src-color': meta.color }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `${meta.color}18`,
            border: `1px solid ${meta.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, transition: 'all 0.2s',
            boxShadow: flash ? `0 0 16px ${meta.color}55` : 'none',
          }}>
            {meta.icon}
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{meta.label}</h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{meta.description}</p>
          </div>
        </div>

        <div className="flex-center gap-2">
          <div className={`status-dot ${dotClass}`} />
          <span className={`badge ${badgeClass}`}>{statusLabel(status)}</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 8, marginBottom: last_error ? 12 : 0,
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px',
          border: '1px solid var(--border)',
        }}>
          <div className="label-xs" style={{ marginBottom: 4 }}>Records</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: meta.color }}>
            {records_received ?? 0}
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px',
          border: '1px solid var(--border)',
        }}>
          <div className="label-xs" style={{ marginBottom: 4 }}>Latency</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: latency_ms > 400 ? 'var(--warning)' : 'var(--text-primary)' }}>
            {latency_ms ? `${latency_ms}ms` : '—'}
          </div>
        </div>
      </div>

      {/* Error */}
      {last_error && (
        <div data-testid="source-error" style={{
          marginTop: 10,
          padding: '9px 12px',
          background: 'var(--danger-soft)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--danger)',
          display: 'flex', alignItems: 'flex-start', gap: 7,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ wordBreak: 'break-all' }}>{last_error}</span>
        </div>
      )}
    </div>
  );
});

export default SourceCard;