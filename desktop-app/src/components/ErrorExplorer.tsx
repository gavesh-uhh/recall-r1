import React, { useState } from 'react';
import {
  Search,
  Filter,
  Code,
  Zap,
  Trash2,
  Plus,
  Link,
  Terminal,
  Database,
  AlertCircle,
} from 'lucide-react';
import { ErrorRecord } from '../types/api';

interface ErrorExplorerProps {
  errors: ErrorRecord[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedProject: string;
  setSelectedProject: (p: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (l: string) => void;
  onSelectError: (err: ErrorRecord) => void;
  selectedError: ErrorRecord | null;
  onDeleteError: (id: number) => Promise<void>;
  onAddSolution: (errorId: number) => void;
  onLinkError: (errorId: number) => void;
  onOpenLogError: () => void;
  isOnline: boolean;
}

export const ErrorExplorer: React.FC<ErrorExplorerProps> = ({
  errors,
  searchQuery,
  setSearchQuery,
  selectedProject,
  setSelectedProject,
  selectedLanguage,
  setSelectedLanguage,
  onSelectError,
  selectedError,
  onDeleteError,
  onAddSolution,
  onLinkError,
  onOpenLogError,
  isOnline,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const projects = Array.from(new Set(errors.map((e) => e.project)));
  const languages = Array.from(new Set(errors.map((e) => e.language)));

  return (
    <div className="h-[calc(100vh-62px)] flex flex-col p-6 space-y-4 overflow-hidden bg-transparent">
      {/* Search & Filter Bar */}
      <div className="pro-panel p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-4">
        {/* AVL Signature Search */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
          <input
            type="text"
            placeholder="Search error signatures (AVL O(log n) lookup)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pro-input w-full pl-10 pr-4 py-2 rounded-lg text-xs font-mono placeholder-slate-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-black px-3 py-1.5 rounded-lg border border-blue-950">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-black text-slate-200">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p} value={p} className="bg-black text-slate-200">
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-black px-3 py-1.5 rounded-lg border border-blue-950">
            <Code className="h-3.5 w-3.5 text-blue-400" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer uppercase font-mono"
            >
              <option value="" className="bg-black text-slate-200">All Languages</option>
              {languages.map((l) => (
                <option key={l} value={l} className="bg-black text-slate-200">
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Split Pane */}
      <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Error Cards List (7 Cols) */}
        <div className="col-span-7 flex flex-col space-y-2.5 overflow-y-auto pr-1">
          {!isOnline ? (
            <div className="pro-panel p-10 rounded-xl text-center flex flex-col items-center justify-center space-y-3">
              <AlertCircle className="h-8 w-8 text-rose-400" />
              <h3 className="text-sm font-semibold text-white">Backend Service Offline</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Could not connect to Spring Boot backend at <code className="text-blue-400 font-mono">http://localhost:8080/api</code>.
                Start the backend server using <code className="text-slate-200 font-mono">mvn spring-boot:run</code>.
              </p>
            </div>
          ) : errors.length === 0 ? (
            <div className="pro-panel p-10 rounded-xl text-center flex flex-col items-center justify-center space-y-3">
              <Database className="h-8 w-8 text-blue-500/50" />
              <h3 className="text-sm font-semibold text-white">No Errors Logged in Database</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                No error records were found in your Spring Boot H2 database matching this filter.
              </p>
              <button
                onClick={onOpenLogError}
                className="pro-button-primary text-xs font-semibold px-4 py-2 rounded-lg mt-2 flex items-center space-x-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Log First Error Record</span>
              </button>
            </div>
          ) : (
            errors.map((err) => {
              const isSelected = selectedError?.id === err.id;
              const topSolution = err.solutions?.[0];

              return (
                <div
                  key={err.id}
                  onClick={() => onSelectError(err)}
                  className={`pro-card p-4 rounded-xl cursor-pointer ${
                    isSelected ? 'border-blue-500 bg-blue-950/40 shadow-md shadow-blue-950' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Terminal className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      <h3 className="font-mono font-semibold text-xs text-blue-200 line-clamp-1">
                        {err.signature}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded badge-blue">
                      {err.language}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 font-mono line-clamp-2 bg-black p-2 rounded border border-blue-950">
                    {err.message}
                  </p>

                  <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-200 border border-blue-900/60 text-[11px]">
                        Project: {err.project}
                      </span>
                      {err.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] badge-dark px-1.5 py-0.5 rounded">
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] font-mono">
                      <span className="flex items-center space-x-1 text-emerald-400">
                        <Zap className="h-3.5 w-3.5" />
                        <span>{err.solutions?.length || 0} fixes</span>
                      </span>
                      {topSolution?.decayScore !== undefined && (
                        <span className="text-blue-300 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-900">
                          Score: {topSolution.decayScore.toFixed(3)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Error Detail Drawer (5 Cols) */}
        <div className="col-span-5 pro-panel rounded-xl p-5 flex flex-col justify-between overflow-y-auto">
          {selectedError ? (
            <div className="space-y-4">
              <div className="border-b border-blue-950 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded badge-blue">
                    ID #{selectedError.id}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onLinkError(selectedError.id)}
                      className="p-1 text-slate-400 hover:text-blue-400 hover:bg-blue-950 rounded transition"
                      title="Link to another error"
                    >
                      <Link className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(selectedError.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-blue-950 rounded transition"
                      title="Delete Error Record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h2 className="font-mono text-xs font-bold text-blue-200 break-all">
                  {selectedError.signature}
                </h2>
                <div className="flex items-center space-x-2 mt-1.5 text-xs text-slate-400">
                  <span>Project: {selectedError.project}</span>
                  <span>•</span>
                  <span className="font-mono text-blue-400">{selectedError.language}</span>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Exception Message
                </h4>
                <div className="bg-black p-3 rounded-lg border border-blue-950 font-mono text-xs text-slate-200 leading-relaxed">
                  {selectedError.message}
                </div>
              </div>

              {selectedError.tags.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Indexed Tags
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedError.tags.map((t) => (
                      <span key={t} className="text-xs badge-dark px-2 py-0.5 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Ranked Fix Strategies</span>
                  </h4>
                  <button
                    onClick={() => onAddSolution(selectedError.id)}
                    className="flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950 px-2 py-1 rounded border border-emerald-900 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Attach Fix</span>
                  </button>
                </div>

                <div className="space-y-2 mt-2">
                  {selectedError.solutions && selectedError.solutions.length > 0 ? (
                    selectedError.solutions.map((sol, index) => (
                      <div
                        key={sol.id}
                        className="bg-black p-3 rounded-lg border border-blue-950 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded badge-emerald">
                            Rank #{index + 1}
                          </span>
                          <span className="text-[11px] font-mono text-blue-300">
                            Decay Score: {sol.decayScore?.toFixed(4) ?? 'N/A'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 font-sans leading-relaxed">
                          {sol.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-blue-950 pt-1.5">
                          <span>Successes: {sol.successCount}</span>
                          <span>Rating: ⭐ {sol.feedbackScore?.toFixed(1) ?? 'N/A'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-black p-4 rounded text-center text-xs text-slate-500 border border-blue-950">
                      No solutions attached yet. Click "Attach Fix" to log one.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
              <Terminal className="h-8 w-8 text-blue-900" />
              <p className="text-xs">Select an error record on the left to inspect solutions.</p>
            </div>
          )}

          {deleteConfirmId && (
            <div className="mt-4 p-3 bg-rose-950/80 border border-rose-900 rounded-lg space-y-2 text-xs text-rose-200">
              <p className="font-semibold">Delete error record #{deleteConfirmId}?</p>
              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-2.5 py-1 rounded bg-black text-slate-300 hover:text-white border border-blue-950"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await onDeleteError(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  className="px-2.5 py-1 rounded bg-rose-700 text-white font-semibold hover:bg-rose-600"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
