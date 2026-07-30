import React, { useState } from 'react';
import { X, Code, Terminal, Tag, FileText, CheckCircle2, Layers } from 'lucide-react';
import { CreateErrorRequest } from '../types/api';

interface LogErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CreateErrorRequest) => Promise<void>;
}

export const LogErrorModal: React.FC<LogErrorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [signature, setSignature] = useState('');
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState('java');
  const [project, setProject] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [initialSolution, setInitialSolution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature.trim() || !message.trim() || !project.trim()) return;

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      await onSubmit({
        signature: signature.trim(),
        message: message.trim(),
        language,
        project: project.trim(),
        tags,
        initialSolution: initialSolution.trim() || undefined,
      });

      setSignature('');
      setMessage('');
      setProject('');
      setTagsInput('');
      setInitialSolution('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="pro-panel w-full max-w-xl rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Log Error & Fix Strategy</h2>
              <p className="text-xs text-slate-400">Save error signature for indexing into O(log n) AVL Tree</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
              <Terminal className="h-3.5 w-3.5 text-sky-400" />
              <span>Error Signature *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. NullPointerException:userService.load"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="pro-input w-full px-3 py-2 rounded-lg text-xs font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">Signature indexed in backend AVL Tree.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span>Detailed Exception Message *</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Cannot invoke getName() because user is null"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="pro-input w-full px-3 py-2 rounded-lg text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <Code className="h-3.5 w-3.5 text-sky-400" />
                <span>Language / Framework *</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="pro-input w-full px-3 py-2 rounded-lg text-xs bg-slate-900"
              >
                <option value="java">Java (Spring Boot)</option>
                <option value="typescript">TypeScript / Node</option>
                <option value="python">Python</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="csharp">C# / .NET</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. user-service-v2"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="pro-input w-full px-3 py-2 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              <span>Tags (comma separated)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. npe, auth, spring-boot"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="pro-input w-full px-3 py-2 rounded-lg text-xs"
            />
          </div>

          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-emerald-400 mb-1 flex items-center space-x-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Initial Successful Fix Strategy (Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="What fix worked?"
              value={initialSolution}
              onChange={(e) => setInitialSolution(e.target.value)}
              className="pro-input w-full px-3 py-2 rounded-lg text-xs text-slate-200"
            />
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
              className="pro-button-primary text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Indexing...' : 'Log & Index Error'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
