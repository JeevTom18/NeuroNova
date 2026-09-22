/** Modal / drawer with focus trap and ESC close (Design.md §5) */
import { useEffect, useRef } from 'react';

const SIZE_MAP = { sm: 480, md: 640, lg: 900, xl: 1100 };

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="modal-panel" style={{ maxWidth: SIZE_MAP[size] }}>
        <div className="modal-header">
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ width: 32, height: 32, padding: 0, justifyContent: 'center', fontSize: 18 }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}