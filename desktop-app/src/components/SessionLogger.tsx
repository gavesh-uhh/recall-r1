import React, { useState } from 'react';
import { Clock, Plus, Calendar, CheckCircle, History } from 'lucide-react';
import { DebugSession, ErrorRecord, CreateSessionRequest } from '../types/api';

interface SessionLoggerProps {
  sessions: DebugSession[];
  errors: ErrorRecord[];
  onCreateSession: (req: CreateSessionRequest) => Promise<void>;
}

export const SessionLogger: React.FC<SessionLoggerProps> = ({
  sessions,
  errors,
  onCreateSession,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [project, setProject] = useState(errors[0]?.project || 'my-app');
  const [selectedErrorIds, setSelectedErrorIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      <div className="tool-toolbar">
        <History style={{ width: 13, height: 13, color: 'var(--text-dim)' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Debug Sessions</span>
        <span className="badge badge-muted" style={{ marginLeft: 4 }}>{sessions.length}</span>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus style={{ width: 12, height: 12 }} />
            Log Session
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sessions.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-dim)', paddingTop: 60 }}>
            <Clock style={{ width: 28, height: 28, opacity: 0.3 }} />
            <span style={{ fontSize: 11 }}>No sessions logged yet</span>
            <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ marginTop: 4 }}>
              <Plus style={{ width: 12, height: 12 }} />
              Log First Session
            </button>
          </div>
        ) : (
          sessions.map((session) => {
            const sessionTitle = session.title || session.actionsPerformed || `Session #${session.id}`;
            const sessionNotes = session.notes || session.feedback || session.actionsPerformed || '—';
            const sessionDateStr = session.timestamp || session.sessionDate;
            const formattedDate = sessionDateStr
              ? new Date(sessionDateStr).toLocaleDateString()
              : 'Recent';
            const linkedCount = session.errorRecordIds?.length ?? (session.errorRecordId ? 1 : 0);

            return (
              <div key={session.id} className="tool-card" style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span className="badge badge-blue">#{session.id}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{session.project || 'General'}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sessionTitle}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <Clock style={{ width: 11, height: 11, color: 'var(--text-dim)' }} />
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {session.durationMinutes || 30}m
                    </span>
                  </div>
                </div>

                <div className="code-block" style={{ fontSize: 11, marginBottom: 10 }}>
                  {sessionNotes}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar style={{ width: 10, height: 10, color: 'var(--text-dim)' }} />
                    <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>{formattedDate}</span>
                  </div>
                  <span className="mono" style={{ fontSize: 10, color: linkedCount > 0 ? '#3b82f6' : 'var(--text-dim)' }}>
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
          <div className="tool-panel" style={{ width: '100%', maxWidth: 520, padding: '20px 24px', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Clock style={{ width: 14, height: 14, color: 'var(--primary)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Log Debug Session</span>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
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
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Project *
                  </label>
                  <input
                    type="text"
                    required
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    className="tool-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Investigation Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Steps taken, root cause, fix applied..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="tool-input"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Link Error Records
                </label>
                <div style={{
                  maxHeight: 100,
                  overflowY: 'auto',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 5,
                  padding: '4px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}>
                  {errors.length === 0 ? (
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', padding: '4px 0' }}>No error records available</span>
                  ) : (
                    errors.map((err) => {
                      const isChecked = selectedErrorIds.includes(err.id);
                      return (
                        <div
                          key={err.id}
                          onClick={() => toggleErrorSelect(err.id)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '3px 6px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            background: isChecked ? 'rgba(29,78,216,0.15)' : 'transparent',
                            border: `1px solid ${isChecked ? 'rgba(29,78,216,0.4)' : 'transparent'}`,
                          }}
                        >
                          <span className="mono" style={{ fontSize: 10, color: isChecked ? '#3b82f6' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            #{err.id} {err.signature}
                          </span>
                          {isChecked && <CheckCircle style={{ width: 11, height: 11, color: 'var(--primary)', flexShrink: 0 }} />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="tool-divider" />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
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
