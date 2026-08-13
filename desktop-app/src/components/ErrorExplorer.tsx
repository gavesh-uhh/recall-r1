import { formatSignatureTitle } from "../utils/formatters";
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
  X,
} from 'lucide-react';
import { ErrorRecord } from '../types/api';
import { ConfirmModal } from './ConfirmModal';
import { SignatureMatchingPanel } from './SignatureMatchingPanel';

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
  availableProjects?: string[];
  availableLanguages?: string[];
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
  availableProjects = [],
  availableLanguages = [],
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const projects = Array.from(
    new Set([...errors.map((e) => e.project).filter(Boolean), ...availableProjects])
  );
  const languages = Array.from(
    new Set([...errors.map((e) => e.language).filter(Boolean), ...availableLanguages])
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      <div className="tool-toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search signatures, messages, projects, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tool-input mono"
            style={{ width: '100%', paddingLeft: 32, paddingRight: searchQuery ? 30 : 13 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 9,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: 3,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X style={{ width: 13, height: 13 }} />
            </button>
          )}
        </div>

        <div className="vert-divider" style={{ height: 20, margin: '0 10px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter style={{ width: 13, height: 13, color: 'var(--text-dim)' }} />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="tool-select"
          >
            <option value="">All Projects ({projects.length})</option>
            {projects.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Code style={{ width: 13, height: 13, color: 'var(--text-dim)' }} />
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

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        <div style={{
          width: 400,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {!isOnline ? (
            <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
              <AlertCircle style={{ width: 32, height: 32, color: 'var(--danger)' }} />
              <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>Backend Offline</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                Start Spring Boot at<br />
                <span style={{ color: 'var(--primary)' }}>localhost:8080</span>
              </div>
            </div>
          ) : errors.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
              <Database style={{ width: 32, height: 32, color: 'var(--text-dim)' }} />
              <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>No Records</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No errors match this filter</div>
              <button onClick={onOpenLogError} className="btn btn-success btn-sm" style={{ marginTop: 6 }}>
                <Plus style={{ width: 13, height: 13 }} />
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
                    padding: '18px 22px',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(253, 173, 0, 0.12)' : 'transparent',
                    borderLeft: `4px solid ${isSelected ? '#fdad00' : 'transparent'}`,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--hover)'; }}
                  onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Terminal style={{ width: 13, height: 13, color: 'var(--primary)', flexShrink: 0 }} />
                    <span className="mono" style={{
                      fontSize: 12,
                      color: isSelected ? '#fdad00' : 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      fontWeight: 600,
                    }}>
                      {formatSignatureTitle(err.signature)}
                    </span>
                    <span className="badge badge-blue">{err.language}</span>
                  </div>

                  <div className="mono" style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: 10,
                  }}>
                    {err.message}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', overflow: 'hidden' }}>
                    <span style={{
                      fontSize: 11,
                      color: 'var(--text-dim)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      minWidth: 0,
                      flexShrink: 1,
                    }}>
                      {err.project}
                    </span>
                    {err.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="badge badge-muted"
                        style={{
                          fontSize: 10,
                          flexShrink: 0,
                          maxWidth: 120,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <Zap style={{ width: 11, height: 11, color: 'var(--success)' }} />
                      <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        {err.solutions?.length || 0}
                      </span>
                      {topSolution?.decayScore !== undefined && (
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
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

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {selectedError ? (
            <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 920, width: '100%', margin: '0 auto' }}>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span className="badge badge-blue">#{selectedError.id}</span>
                    <span className="badge badge-blue">{selectedError.language}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{selectedError.project}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 13.5, fontWeight: 700, color: '#fdad00', wordBreak: 'break-all', lineHeight: 1.5 }}>
                    {selectedError.signature}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => onLinkError(selectedError.id)}
                    className="btn btn-ghost btn-icon"
                    title="Link to another error"
                  >
                    <Link style={{ width: 15, height: 15 }} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(selectedError.id)}
                    className="btn btn-ghost btn-icon"
                    title="Delete"
                  >
                    <Trash2 style={{ width: 15, height: 15 }} />
                  </button>
                </div>
              </div>

              <div className="tool-divider" />

              <div>
                <div className="section-label" style={{ marginBottom: 8 }}>Exception Message</div>
                <div className="code-block">{selectedError.message}</div>
              </div>

              {selectedError.tags.length > 0 && (
                <div>
                  <div className="section-label" style={{ marginBottom: 8 }}>Tags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedError.tags.map((t) => (
                      <span key={t} className="badge badge-muted">#{t}</span>
                    ))}
                  </div>
                </div>
              )}

              <SignatureMatchingPanel 
                errorId={selectedError.id} 
                allErrors={errors} 
                onSelectError={onSelectError} 
                onNavigateToPatterns={() => {}} 
              />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Ranked Fix Strategies
                    <span className="badge badge-muted">{selectedError.solutions?.length || 0}</span>
                  </div>
                  <button onClick={() => onAddSolution(selectedError.id)} className="btn btn-success btn-sm">
                    <Plus style={{ width: 12, height: 12 }} />
                    Attach Fix
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {selectedError.solutions && selectedError.solutions.length > 0 ? (
                    selectedError.solutions.map((sol, index) => (
                      <div key={sol.id} className="tool-card" style={{ padding: '20px 22px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="badge badge-green">#{index + 1}</span>
                          </div>
                          <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            score {sol.decayScore?.toFixed(4) ?? 'N/A'}
                          </span>
                        </div>
                        <p style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
                          {sol.description}
                        </p>
                        <div className="tool-divider" style={{ margin: '12px 0' }} />
                        <div className="mono" style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-dim)' }}>
                          <span>{sol.successCount} success</span>
                          <span>{sol.failureCount} fail</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="tool-card" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 12 }}>
                      No solutions attached. Click "Attach Fix" to log one.
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-dim)' }}>
              <Terminal style={{ width: 36, height: 36, opacity: 0.3 }} />
              <span style={{ fontSize: 12.5 }}>Select an error to inspect</span>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Delete Error Record"
        message={`Are you sure you want to delete Error #${deleteConfirmId}${selectedError ? ` (${selectedError.signature})` : ''}? All attached fix strategies and pattern linkages for this error will be permanently removed.`}
        confirmText="Delete Error"
        cancelText="Cancel"
        variant="danger"
        isSubmitting={isDeleting}
        onConfirm={async () => {
          if (!deleteConfirmId) return;
          setIsDeleting(true);
          try {
            await onDeleteError(deleteConfirmId);
            setDeleteConfirmId(null);
          } finally {
            setIsDeleting(false);
          }
        }}
        onClose={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
