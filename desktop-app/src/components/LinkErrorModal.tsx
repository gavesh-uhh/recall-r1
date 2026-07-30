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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="pro-panel w-full max-w-md rounded-xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Link className="h-4 w-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Manual Graph Error Edge</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <span className="text-xs text-slate-400">Source Error Record:</span>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-sky-300 mt-1">
              #{sourceErr?.id}: {sourceErr?.signature}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target Related Error *
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(Number(e.target.value))}
              className="pro-input w-full px-3 py-2 rounded-lg text-xs font-mono bg-slate-900"
            >
              {availableTargets.map((e) => (
                <option key={e.id} value={e.id} className="bg-slate-900 text-slate-200">
                  #{e.id} [{e.project}] {e.signature}
                </option>
              ))}
            </select>
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
              disabled={isSubmitting || !targetId}
              className="pro-button-primary text-xs font-semibold px-4 py-2 rounded-lg"
            >
              {isSubmitting ? 'Linking...' : 'Create Undirected Edge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
