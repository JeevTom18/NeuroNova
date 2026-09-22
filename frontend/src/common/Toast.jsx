/** Lightweight glassmorphism toast banners for success/error/partial events (Design.md §5) */
import { useEffect } from 'react';

const TOAST_STYLES = {
  success: {
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.35)',
    color: '#10b981',
    icon: '✓',
    title: 'Success',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.14)',
    border: 'rgba(239, 68, 68, 0.35)',
    color: '#ef4444',
    icon: '✕',
    title: 'Error',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(245, 158, 11, 0.35)',
    color: '#f59e0b',
    icon: '⚠',
    title: 'Warning',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.14)',
    border: 'rgba(59, 130, 246, 0.35)',
    color: '#3b82f6',
    icon: 'ℹ',
    title: 'Info',
  },
};

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => {
      onDismiss(toast.id);
    }, 6000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  const s = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

  return (
    <div
      className="toast"
      role="status"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        animation: 'toastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'auto',
        minWidth: 300,
        maxWidth: 420,
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: 'rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {s.icon}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, color: '#f8fafc', lineHeight: 1.4 }}>{toast.message}</div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          fontSize: 18,
          cursor: 'pointer',
          lineHeight: 1,
          padding: 0,
          opacity: 0.6,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

export default function ToastStack({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 24,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}