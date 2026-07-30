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
  const [successCount, setSuccessCount] = useState(1);
  const [feedbackScore, setFeedbackScore] = useState(5.0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || errorId === null) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(errorId, {
        description: description.trim(),
        successCount,
        feedbackScore,
        lastSuccessDate: new Date().toISOString(),
      });
      setDescription('');
      setSuccessCount(1);
      setFeedbackScore(5.0);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(1,4,9,0.75)', backdropFilter: 'blur(4px)' }} className="fade-in">
      <div className="tool-panel" style={{ width: '100%', maxWidth: 440, padding: '14px 16px', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Zap style={{ width: 13, height: 13, color: 'var(--success)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Attach Solution Strategy</span>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X style={{ width: 14, height: 14 }} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Solution Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Resolution steps, code guard, or configuration fix..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="tool-input"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Success Count</label>
              <input type="number" min={1} max={100} value={successCount}
                onChange={(e) => setSuccessCount(Number(e.target.value))}
                className="tool-input mono" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Feedback Score (1–5)</label>
              <input type="number" step="0.1" min={1.0} max={5.0} value={feedbackScore}
                onChange={(e) => setFeedbackScore(Number(e.target.value))}
                className="tool-input mono" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="tool-divider" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
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
