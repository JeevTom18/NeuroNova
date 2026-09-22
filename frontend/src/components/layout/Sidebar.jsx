/** Sidebar navigation — brand logo, nav items, status footer */
import { useState, useEffect } from 'react';
import { api } from '../../api';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )},
  { id: 'pipeline', label: 'Pipeline', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )},
  { id: 'sources', label: 'Sources', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M2 12h4M18 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
    </svg>
  )},
  { id: 'records', label: 'Records', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )},
];

export default function Sidebar({ activeTab, onTabChange }) {
  const [backendOnline, setBackendOnline] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const check = async () => {
      try { await api.health(); setBackendOnline(true); }
      catch { setBackendOnline(false); }
    };
    check();
    const hi = setInterval(check, 15000);
    return () => clearInterval(hi);
  }, []);

  useEffect(() => {
    const ti = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(ti);
  }, []);

  const statusColor = backendOnline === null ? 'unknown' : backendOnline ? 'healthy' : 'offline';
  const statusLabel = backendOnline === null ? 'Checking…' : backendOnline ? 'Connected' : 'Offline';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
            boxShadow: '0 4px 12px rgba(59,130,246,0.4)'
          }}>⚡</div>
          <div>
            <div className="wordmark">Acentra</div>
            <div className="tagline">Ingestion Core</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item${activeTab === item.id ? ' active' : ''}`}
            onClick={() => onTabChange(item.id)}
            style={{ width: '100%', background: activeTab === item.id ? undefined : 'none', border: activeTab === item.id ? undefined : '1px solid transparent', cursor: 'pointer' }}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div className={`status-dot ${statusColor}`} />
          <span style={{ fontSize: 12, color: backendOnline ? 'var(--success)' : 'var(--text-muted)', fontWeight: 500 }}>
            {statusLabel}
          </span>
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
          {time.toLocaleTimeString()}
        </div>
      </div>
    </aside>
  );
}
