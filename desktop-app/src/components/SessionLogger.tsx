import React, { useState } from 'react';
import { Clock, Plus, Calendar, CheckCircle } from 'lucide-react';
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
    <div className="h-[calc(100vh-62px)] flex flex-col p-6 space-y-4 overflow-hidden">
      {/* Header */}
      <div className="pro-panel p-3.5 rounded-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-sky-950 text-sky-400 border border-sky-800">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Debug Session Logs</h2>
            <p className="text-xs text-slate-400">
              Track investigative debugging work, duration, notes, and link associated error records
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 pro-button-primary text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition"
        >
          <Plus className="h-4 w-4" />
          <span>Log Debug Session</span>
        </button>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-12 gap-5 flex-1 min-h-0 overflow-y-auto pr-1">
        {sessions.length === 0 ? (
          <div className="col-span-12 pro-panel p-10 rounded-xl text-center text-xs text-slate-500">
            No debugging sessions logged in backend database yet.
          </div>
        ) : (
          sessions.map((session) => {
            const sessionTitle = session.title || session.actionsPerformed || `Debug Session #${session.id}`;
            const sessionNotes = session.notes || session.feedback || session.actionsPerformed || 'No session notes provided.';
            const sessionDateStr = session.timestamp || session.sessionDate;
            const formattedDate = sessionDateStr
              ? new Date(sessionDateStr).toLocaleDateString()
              : 'Recent';
            const linkedCount = session.errorRecordIds?.length ?? (session.errorRecordId ? 1 : 0);

            return (
              <div
                key={session.id}
                className="col-span-6 pro-panel p-4 rounded-xl flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                        Session #{session.id} • {session.project || 'General'}
                      </span>
                      <h3 className="text-xs font-bold text-white mt-1">{sessionTitle}</h3>
                    </div>
                    <div className="flex items-center space-x-1 font-mono text-xs text-sky-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      <Clock className="h-3 w-3" />
                      <span>{session.durationMinutes || 30}m</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-800">
                    {sessionNotes}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400 font-mono">
                  <div className="flex items-center space-x-1 text-[11px]">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="text-[11px] text-sky-400">
                    Linked Errors: {linkedCount}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Log Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="pro-panel w-full max-w-lg rounded-xl shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock className="h-4 w-4 text-sky-400" />
              <span>Log Debugging Session</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Investigating User Auth Null Pointer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="pro-input w-full px-3 py-2 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Minutes) *</label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={480}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="pro-input w-full px-3 py-2 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    className="pro-input w-full px-3 py-2 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Investigation Notes *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Steps taken, root cause identified, fix applied..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="pro-input w-full px-3 py-2 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Link Error Records</label>
                <div className="max-h-24 overflow-y-auto space-y-1 p-2 bg-slate-950 rounded-lg border border-slate-800">
                  {errors.length === 0 ? (
                    <div className="text-[11px] text-slate-500">No error records available</div>
                  ) : (
                    errors.map((err) => {
                      const isChecked = selectedErrorIds.includes(err.id);
                      return (
                        <div
                          key={err.id}
                          onClick={() => toggleErrorSelect(err.id)}
                          className={`p-1.5 rounded text-xs font-mono cursor-pointer flex items-center justify-between ${
                            isChecked ? 'bg-sky-950 text-sky-200 border border-sky-800' : 'text-slate-400 hover:bg-slate-900'
                          }`}
                        >
                          <span className="truncate max-w-xs">#{err.id} {err.signature}</span>
                          {isChecked && <CheckCircle className="h-3.5 w-3.5 text-sky-400" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="pro-button-primary text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  {isSubmitting ? 'Saving...' : 'Save Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
