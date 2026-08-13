import React, { useState, useMemo } from 'react';
import { Clock, Plus, Calendar, CheckCircle, History, Filter, Folder, Search, X } from 'lucide-react';
import { DebugSession, ErrorRecord, CreateSessionRequest } from '../types/api';
import { formatSignatureTitle } from '../utils/formatters';

interface SessionLoggerProps {
  sessions: DebugSession[];
  errors: ErrorRecord[];
  onCreateSession: (req: CreateSessionRequest) => Promise<void>;
  availableProjects?: string[];
  availableLanguages?: string[];
}

export const SessionLogger: React.FC<SessionLoggerProps> = ({
  sessions,
  errors,
  onCreateSession,
  availableProjects = [],
}) => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [project, setProject] = useState(errors[0]?.project || availableProjects[0] || 'my-app');
  const [selectedErrorIds, setSelectedErrorIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const projectsList = useMemo(() => {
    const fromSessions = sessions.map((s) => s.project).filter(Boolean);
    const fromErrors = errors.map((e) => e.project).filter(Boolean);
    return Array.from(new Set([...fromSessions, ...fromErrors, ...availableProjects]));
  }, [sessions, errors, availableProjects]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesProj =
        !selectedProjectFilter ||
        (s.project && s.project.toLowerCase() === selectedProjectFilter.toLowerCase());
      const titleStr = s.title || s.actionsPerformed || `Session #${s.id}`;
      const notesStr = s.notes || s.feedback || s.actionsPerformed || '';
      const matchesSearch =
        !searchQuery ||
        titleStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notesStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.project && s.project.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesProj && matchesSearch;
    });
  }, [sessions, selectedProjectFilter, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !notes.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateSession({
        title: title.trim(),
        durationMinutes: duration,
        notes: notes.trim(),
        project: project.trim(),
        errorRecordIds: selectedErrorIds,
      });
      setTitle('');
      setNotes('');
      setSelectedErrorIds([]);
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleErrorSelect = (id: number) => {
    setSelectedErrorIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      <div className="tool-toolbar" style={{ flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <History style={{ width: 15, height: 15, color: 'var(--text-dim)' }} />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Debug Sessions</span>
          <span className="badge badge-muted" style={{ marginLeft: 4 }}>{filteredSessions.length}</span>
        </div>

        <div className="vert-divider" style={{ height: 20 }} />

        {/* Project Selection Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Folder style={{ width: 13, height: 13, color: 'var(--text-dim)' }} />
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="tool-select"
          >
            <option value="">All Projects ({projectsList.length})</option>
            {projectsList.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', minWidth: 220 }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tool-input mono"
            style={{ width: '100%', paddingLeft: 30, paddingRight: searchQuery ? 28 : 13 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', padding: 3
              }}
            >
              <X style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>

        {(selectedProjectFilter || searchQuery) && (
          <button
            onClick={() => {
              setSelectedProjectFilter('');
              setSearchQuery('');
            }}
            className="btn btn-ghost btn-xs"
          >
            <X style={{ width: 11, height: 11 }} />
            Clear Filters
          </button>
        )}

        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus style={{ width: 13, height: 13 }} />
            Log Session
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredSessions.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-dim)', paddingTop: 80 }}>
            <Clock style={{ width: 36, height: 36, opacity: 0.3 }} />
            <span style={{ fontSize: 12.5 }}>No debug sessions found</span>
            {(selectedProjectFilter || searchQuery) ? (
              <button
                onClick={() => { setSelectedProjectFilter(''); setSearchQuery(''); }}
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 6 }}
              >
                Reset Filters
              </button>
            ) : (
              <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ marginTop: 6 }}>
                <Plus style={{ width: 12, height: 12 }} />
                Log First Session
              </button>
            )}
          </div>
        ) : (
          filteredSessions.map((session) => {
            const sessionTitle = session.title || session.actionsPerformed || `Session #${session.id}`;
            const sessionNotes = session.notes || session.feedback || session.actionsPerformed || '—';
            const sessionDateStr = session.timestamp || session.sessionDate;
            const formattedDate = sessionDateStr
              ? new Date(sessionDateStr).toLocaleDateString()
              : 'Recent';
            const linkedCount = session.errorRecordIds?.length ?? (session.errorRecordId ? 1 : 0);

            return (
              <div key={session.id} className="tool-card" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="badge badge-blue">#{session.id}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{session.project || 'General'}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sessionTitle}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <Clock style={{ width: 12, height: 12, color: 'var(--text-dim)' }} />
                    <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {session.durationMinutes || 30}m
                    </span>
                  </div>
                </div>

                <div className="code-block" style={{ marginBottom: 12 }}>
                  {sessionNotes}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Calendar style={{ width: 11, height: 11, color: 'var(--text-dim)' }} />
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{formattedDate}</span>
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: linkedCount > 0 ? '#fdad00' : 'var(--text-dim)' }}>
                    {linkedCount} linked error{linkedCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(1,4,9,0.75)', backdropFilter: 'blur(4px)',
        }}
          className="fade-in"
        >
          <div className="tool-panel" style={{ width: '100%', maxWidth: 560, padding: '26px 30px', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <Clock style={{ width: 16, height: 16, color: 'var(--primary)' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Log Debug Session</span>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Investigating Auth Null Pointer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="tool-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    Duration (min) *
                  </label>
                  <input
                    type="number"
                    required
                    min={5} max={480}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="tool-input mono"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    Project *
                  </label>
                  <input
                    type="text"
                    required
                    list="session-project-suggestions"
                    placeholder="Select or enter project..."
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    className="tool-input"
                    style={{ width: '100%' }}
                  />
                  <datalist id="session-project-suggestions">
                    {projectsList.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>

                  {projectsList.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>Quick Pick:</span>
                      {projectsList.slice(0, 4).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setProject(p)}
                          className={`btn btn-xs ${project === p ? 'btn-primary' : 'btn-ghost'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Investigation Notes *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Steps taken, root cause, fix applied..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="tool-input"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Link Error Records
                </label>
                <div style={{
                  maxHeight: 170,
                  overflowY: 'auto',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}>
                  {errors.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', padding: '6px 2px' }}>No error records available</span>
                  ) : (
                    errors.map((err) => {
                      const isChecked = selectedErrorIds.includes(err.id);
                      return (
                        <div
                          key={err.id}
                          onClick={() => toggleErrorSelect(err.id)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            background: isChecked ? 'rgba(253, 173, 0, 0.15)' : 'transparent',
                            border: `1px solid ${isChecked ? 'rgba(253, 173, 0, 0.4)' : 'transparent'}`,
                          }}
                        >
                          <span className="mono" style={{ fontSize: 11, color: isChecked ? '#fdad00' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            #{err.id} {formatSignatureTitle(err.signature)}
                          </span>
                          {isChecked && <CheckCircle style={{ width: 13, height: 13, color: 'var(--primary)', flexShrink: 0 }} />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="tool-divider" />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? 'Saving…' : 'Save Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

