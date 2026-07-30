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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="pro-panel w-full max-w-lg rounded-xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Attach Solution Strategy</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Solution Description *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Detailed resolution steps, code guard, or configuration fix..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="pro-input w-full px-3 py-2 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Initial Success Count
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={successCount}
                onChange={(e) => setSuccessCount(Number(e.target.value))}
                className="pro-input w-full px-3 py-2 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Feedback Score (1.0 - 5.0)
              </label>
              <input
                type="number"
                step="0.1"
                min={1.0}
                max={5.0}
                value={feedbackScore}
                onChange={(e) => setFeedbackScore(Number(e.target.value))}
                className="pro-input w-full px-3 py-2 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="pro-button-primary text-xs font-semibold px-4 py-2 rounded-lg"
            >
              {isSubmitting ? 'Attaching...' : 'Attach Solution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
