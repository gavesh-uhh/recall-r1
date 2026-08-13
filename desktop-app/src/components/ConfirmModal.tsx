import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onClose,
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(1, 4, 9, 0.75)',
        backdropFilter: 'blur(4px)',
      }}
      className="fade-in"
    >
      <div
        className="tool-panel"
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '26px 28px',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: variant === 'danger' ? 'rgba(248, 81, 73, 0.12)' : 'rgba(210, 153, 34, 0.12)',
                border: `1px solid ${variant === 'danger' ? 'rgba(248, 81, 73, 0.35)' : 'rgba(210, 153, 34, 0.35)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle style={{ width: 20, height: 20, color: variant === 'danger' ? '#f85149' : '#d29922' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Action Confirmation Required</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ color: 'var(--text-dim)' }}
          >
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        <div
          style={{
            fontSize: 12.5,
            color: 'var(--text)',
            lineHeight: 1.7,
            padding: '2px 4px',
          }}
        >
          {message}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={isSubmitting} className="btn btn-ghost">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-warning'}`}
          >
            {isSubmitting ? 'Processing…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
