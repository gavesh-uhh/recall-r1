import React, { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { CreateSolutionRequest } from '../types/api';

interface AddSolutionModalProps {
  isOpen: boolean;
  errorId: number | null;
  onClose: () => void;
  onSubmit: (errorId: number, req: CreateSolutionRequest) => Promise<void>;
}

export const AddSolutionModal: React.FC<AddSolutionModalProps> = ({
  isOpen,
  errorId,
  onClose,
  onSubmit,
}) => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || errorId === null) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      // A new solution starts with zero history; success/failure/rating come from real feedback.
      await onSubmit(errorId, {
        description: description.trim(),
      });
      setDescription('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(1,4,9,0.75)', backdropFilter: 'blur(4px)' }} className="fade-in">
      <div className="tool-panel" style={{ width: '100%', maxWidth: 520, padding: '24px 26px', borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap style={{ width: 15, height: 15, color: 'var(--success)' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Attach Solution Strategy</span>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X style={{ width: 15, height: 15 }} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Solution Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Resolution steps, code guard, or configuration fix..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="tool-input"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div className="tool-divider" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Attaching…' : 'Attach Solution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
