import React, { useState } from 'react';
import { X, Link } from 'lucide-react';
import { ErrorRecord } from '../types/api';

interface LinkErrorModalProps {
  isOpen: boolean;
  sourceErrorId: number | null;
  errors: ErrorRecord[];
  onClose: () => void;
  onSubmit: (sourceId: number, targetId: number) => Promise<void>;
}

export const LinkErrorModal: React.FC<LinkErrorModalProps> = ({
  isOpen,
  sourceErrorId,
  errors,
  onClose,
  onSubmit,
}) => {
  const availableTargets = errors.filter((e) => e.id !== sourceErrorId);
  const [targetId, setTargetId] = useState<number>(availableTargets[0]?.id || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || sourceErrorId === null) return null;

  const sourceErr = errors.find((e) => e.id === sourceErrorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;

    setIsSubmitting(true);
    try {
      await onSubmit(sourceErrorId, targetId);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(1,4,9,0.75)', backdropFilter: 'blur(4px)' }} className="fade-in">
      <div className="tool-panel" style={{ width: '100%', maxWidth: 400, padding: '14px 16px', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Link style={{ width: 13, height: 13, color: 'var(--primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Link Graph Edge</span>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X style={{ width: 14, height: 14 }} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 4 }}>Source Node</div>
            <div className="code-block" style={{ fontSize: 11 }}>
              #{sourceErr?.id}: {sourceErr?.signature}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Target Error *</label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(Number(e.target.value))}
              className="tool-select mono"
              style={{ width: '100%' }}
            >
              {availableTargets.map((e) => (
                <option key={e.id} value={e.id}>#{e.id} [{e.project}] {e.signature}</option>
              ))}
            </select>
          </div>

          <div className="tool-divider" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" disabled={isSubmitting || !targetId} className="btn btn-primary">
              {isSubmitting ? 'Linking…' : 'Create Edge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
