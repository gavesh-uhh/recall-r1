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
  ChevronRight,
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="tool-toolbar">
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <Search style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search signatures…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tool-input mono"
            style={{ width: '100%', paddingLeft: 24 }}
          />
        </div>

        <div className="vert-divider" style={{ height: 18, margin: '0 8px' }} />

        {/* Project filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Filter style={{ width: 11, height: 11, color: 'var(--text-dim)' }} />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="tool-select"
          >
            <option value="">All Projects ({projects.length})</option>
            {projects.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Language filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Code style={{ width: 11, height: 11, color: 'var(--text-dim)' }} />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="tool-select mono"
          >
            <option value="">All Languages</option>
            {languages.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <span className="section-label">{errors.length} record{errors.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* ── Content: List + Detail ───────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Error List */}
        <div style={{
          width: 380,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {!isOnline ? (
            <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
              <AlertCircle style={{ width: 24, height: 24, color: 'var(--danger)' }} />
              <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text)' }}>Backend Offline</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Start Spring Boot at<br />
                <span style={{ color: 'var(--primary)' }}>localhost:8080</span>
              </div>
            </div>
          ) : errors.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
              <Database style={{ width: 24, height: 24, color: 'var(--text-dim)' }} />
              <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text)' }}>No Records</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No errors match this filter</div>
              <button onClick={onOpenLogError} className="btn btn-success btn-sm" style={{ marginTop: 4 }}>
                <Plus style={{ width: 12, height: 12 }} />
                Log Error
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
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(56,139,253,0.06)' : 'transparent',
                    borderLeft: `3px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--hover)'; }}
                  onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  {/* Signature row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                    <Terminal style={{ width: 11, height: 11, color: 'var(--primary)', flexShrink: 0 }} />
                    <span className="mono" style={{
                      fontSize: 11,
                      color: isSelected ? '#58a6ff' : 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      fontWeight: 600,
                    }}>
                      {err.signature}
                    </span>
                    <span className="badge badge-blue">{err.language}</span>
                  </div>

                  {/* Message preview */}
                  <div className="mono" style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: 8,
                  }}>
                    {err.message}
                  </div>

                  {/* Meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{err.project}</span>
                    {err.tags.slice(0, 2).map((t) => (
                      <span key={t} className="badge badge-muted" style={{ fontSize: 9 }}>#{t}</span>
                    ))}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Zap style={{ width: 10, height: 10, color: 'var(--success)' }} />
                      <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                        {err.solutions?.length || 0}
                      </span>
                      {topSolution?.decayScore !== undefined && (
                        <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                          · {topSolution.decayScore.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Pane */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {selectedError ? (
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Detail Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className="badge badge-blue">#{selectedError.id}</span>
                    <span className="badge badge-blue">{selectedError.language}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{selectedError.project}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: '#58a6ff', wordBreak: 'break-all', lineHeight: 1.4 }}>
                    {selectedError.signature}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => onLinkError(selectedError.id)}
                    className="btn btn-ghost btn-icon"
                    title="Link to another error"
                  >
                    <Link style={{ width: 13, height: 13 }} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(selectedError.id)}
                    className="btn btn-ghost btn-icon"
                    title="Delete"
                  >
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>

              <div className="tool-divider" />

              {/* Exception Message */}
              <div>
                <div className="section-label" style={{ marginBottom: 5 }}>Exception Message</div>
                <div className="code-block">{selectedError.message}</div>
              </div>

              {/* Tags */}
              {selectedError.tags.length > 0 && (
                <div>
                  <div className="section-label" style={{ marginBottom: 5 }}>Tags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {selectedError.tags.map((t) => (
                      <span key={t} className="badge badge-muted">#{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Solutions */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Zap style={{ width: 11, height: 11, color: 'var(--success)' }} />
                    Ranked Fix Strategies
                    <span className="badge badge-muted">{selectedError.solutions?.length || 0}</span>
                  </div>
                  <button onClick={() => onAddSolution(selectedError.id)} className="btn btn-success btn-sm">
                    <Plus style={{ width: 10, height: 10 }} />
                    Attach Fix
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedError.solutions && selectedError.solutions.length > 0 ? (
                    selectedError.solutions.map((sol, index) => (
                      <div key={sol.id} className="tool-card" style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="badge badge-green">#{index + 1}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <ChevronRight style={{ width: 10, height: 10, color: 'var(--text-dim)' }} />
                            </span>
                          </div>
                          <span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            score {sol.decayScore?.toFixed(4) ?? 'N/A'}
                          </span>
                        </div>
                        <p style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>
                          {sol.description}
                        </p>
                        <div className="tool-divider" style={{ margin: '8px 0' }} />
                        <div className="mono" style={{ display: 'flex', gap: 14, fontSize: 10, color: 'var(--text-dim)' }}>
                          <span>✓ {sol.successCount} success</span>
                          <span>✗ {sol.failureCount} fail</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="tool-card" style={{ padding: '16px 10px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 11 }}>
                      No solutions attached. Click "Attach Fix" to log one.
                    </div>
                  )}
                </div>
              </div>

              {/* Delete Confirm */}
              {deleteConfirmId && (
                <div style={{ background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 7, padding: '14px 16px' }}>
                  <p style={{ fontSize: 11.5, color: '#f85149', fontWeight: 600, marginBottom: 10 }}>
                    Delete error record #{deleteConfirmId}?
                  </p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => setDeleteConfirmId(null)} className="btn btn-ghost btn-sm">Cancel</button>
                    <button
                      onClick={async () => { await onDeleteError(deleteConfirmId); setDeleteConfirmId(null); }}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-dim)' }}>
              <Terminal style={{ width: 28, height: 28, opacity: 0.3 }} />
              <span style={{ fontSize: 11 }}>Select an error to inspect</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
