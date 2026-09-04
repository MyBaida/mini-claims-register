'use client';

import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="modal-panel bg-white w-full max-w-lg rounded-xl shadow-2xl border"
        style={{ borderColor: 'var(--color-line)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-line)' }}>
          <h2 className="font-serif-display text-xl" style={{ color: 'var(--color-ink)' }}>{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors" style={{ color: 'var(--color-ink-muted)' }}>
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}