import React, { useState } from 'react';
import { X, Code, Terminal, Tag, FileText, CheckCircle2, Layers, Zap, ArrowLeft } from 'lucide-react';
import { CreateErrorRequest } from '../types/api';

interface LogErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: CreateErrorRequest) => Promise<void>;
  initialProject?: string;
  initialLanguage?: string;
  availableProjects?: string[];
  availableLanguages?: string[];
}


export const LogErrorModal: React.FC<LogErrorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialProject,
  initialLanguage,
  availableProjects = [],
  availableLanguages = [],
}) => {
  const [signature, setSignature] = useState('');
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [project, setProject] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [initialSolution, setInitialSolution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (initialProject) setProject(initialProject);
      if (initialLanguage) setLanguage(initialLanguage.toLowerCase());
    }
  }, [isOpen, initialProject, initialLanguage]);

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

  const addTagSuggestion = (tag: string) => {
    const currentTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (!currentTags.includes(tag)) {
      const updated = [...currentTags, tag].join(', ');
      setTagsInput(updated);
    }
  };

  const parsedTags = tagsInput
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg)] text-[var(--text)] flex flex-col h-screen w-screen overflow-hidden select-none animate-fade-in">
      <header className="bg-[var(--surface)] border-b border-[var(--border)] px-6 py-3.5 flex items-center justify-between shadow-xl flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--card)] px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--hover)] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Workspace</span>
          </button>

          <div className="h-5 w-[1px] bg-[var(--border)]" />

          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-xl bg-[#3b2a00] text-[#fdad00] border border-[#fdad00]/40 shadow-md">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-white tracking-tight">Log Exception & Fix Strategy</h1>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-[#3b2a00] text-[#fdad00] border border-[#fdad00]">
                  Recall Indexer
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          title="Close Full Screen"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 min-h-0 p-6 overflow-y-auto flex flex-col justify-center">
        <form onSubmit={handleSubmit} className="max-w-7xl mx-auto w-full grid grid-cols-12 gap-6 h-full min-h-0 items-stretch">
          <div className="col-span-7 flex flex-col space-y-5 min-h-0">
            <div className="pro-panel p-5 rounded-2xl space-y-3.5 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center space-x-2">
                  <Terminal className="h-3.5 w-3.5 text-[#fdad00]" />
                  <span>1. Exception Signature & Stack Trace</span>
                </h3>
                <span className="text-[10px] font-mono text-[#fdad00] bg-[#3b2a00]/60 px-2.5 py-0.5 rounded-md border border-[#fdad00]">
                  Required
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Error Signature / Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NullPointerException in UserAuthService.authenticate"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="pro-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono text-white placeholder-slate-500"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>Detailed Exception Message & Stack Trace *</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. java.lang.NullPointerException: Cannot invoke getPasswordHash() because user is null at UserAuthService.java:42"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="pro-input w-full flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono text-white placeholder-slate-500 leading-relaxed resize-none"
                />
              </div>
            </div>

            <div className="pro-panel p-5 rounded-2xl space-y-3.5 flex-shrink-0">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center space-x-2">
                  <Code className="h-3.5 w-3.5 text-[#fdad00]" />
                  <span>2. Project & Tech Stack Categorization</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400 bg-[var(--card)] px-2.5 py-0.5 rounded-md border border-[var(--border)]">
                  Metadata
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    Language / Runtime *
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="pro-input w-full px-3.5 py-2.5 rounded-xl text-xs font-medium cursor-pointer capitalize"
                  >
                    <option value="typescript">TypeScript / Node.js</option>
                    <option value="javascript">JavaScript / React</option>
                    <option value="java">Java (Spring Boot)</option>
                    <option value="python">Python (FastAPI / Django)</option>
                    <option value="go">Go (Golang)</option>
                    <option value="rust">Rust</option>
                    <option value="csharp">C# / .NET</option>
                    <option value="cpp">C++</option>
                    <option value="php">PHP</option>
                    <option value="ruby">Ruby</option>
                    <option value="kotlin">Kotlin</option>
                    {availableLanguages
                      .filter(
                        (l) =>
                          !['typescript', 'javascript', 'java', 'python', 'go', 'rust', 'csharp', 'cpp', 'php', 'ruby', 'kotlin'].includes(
                            l.toLowerCase()
                          )
                      )
                      .map((lang) => (
                        <option key={lang} value={lang.toLowerCase()}>
                          {lang}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    list="project-suggestions-list"
                    placeholder="Select or type project name…"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    className="pro-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono text-white placeholder-slate-500"
                  />
                  <datalist id="project-suggestions-list">
                    {availableProjects.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>

                  {availableProjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                      <span className="text-[10px] text-slate-400 font-mono">Quick Pick:</span>
                      {availableProjects.slice(0, 6).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setProject(p)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md transition ${
                            project === p
                              ? 'bg-[#fdad00] text-slate-950 border border-[#fdad00] font-bold'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-750'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1.5">
                    <Tag className="h-3.5 w-3.5 text-slate-400" />
                    <span>Search Tags (comma separated)</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="e.g. null-pointer, auth, spring-boot, security"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="pro-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono text-white placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          <div className="col-span-5 flex flex-col h-full min-h-0">
            <div className="pro-panel p-5 rounded-2xl flex-1 flex flex-col justify-between space-y-4 min-h-0">
              <div className="space-y-3.5 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                  <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Initial Fix Strategy (Optional)</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <textarea
                    rows={4}
                    placeholder="e.g. Add null check on user repository lookup before attempting password verification. Return Optional.empty() for unknown users."
                    value={initialSolution}
                    onChange={(e) => setInitialSolution(e.target.value)}
                    className="pro-input w-full flex-1 px-3.5 py-2.5 rounded-xl text-xs text-slate-100 placeholder-slate-500 leading-relaxed resize-none"
                  />
                </div>

                <div className="bg-[var(--bg)] p-3.5 rounded-xl border border-[var(--border)] space-y-2 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#fdad00] uppercase tracking-wider font-bold">
                      Indexing Live Preview
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white font-mono truncate">
                      {signature || 'Error Signature Preview'}
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                      <span>Project: {project || 'project-name'}</span>
                      <span>•</span>
                      <span className="uppercase text-emerald-400 font-semibold">{language}</span>
                    </div>
                  </div>

                  {parsedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {parsedTags.map((tag) => (
                        <span key={tag} className="text-[10px] bg-slate-900 border border-slate-700 text-[#fdad00] px-2 py-0.5 rounded font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-[var(--border)] flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--card)] hover:bg-[var(--hover)] transition border border-[var(--border)] text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 pro-button-primary py-2.5 rounded-xl text-xs font-bold shadow-lg transition disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Zap className="h-4 w-4" />
                  <span>{isSubmitting ? 'Indexing Record...' : 'Log & Index Error'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
