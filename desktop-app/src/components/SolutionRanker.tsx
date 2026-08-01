import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap,
  Award,
  CheckCircle2,
  XCircle,
  Star,
  Calculator,
  Sliders,
  Clock,
  Info,
  Filter,
  Code,
  Folder,
  X,
} from 'lucide-react';
import { ErrorRecord, Solution, SolutionFeedbackRequest } from '../types/api';
import { recallApi } from '../services/api';
import { SolutionDecayChart } from './SolutionDecayChart';

interface SolutionRankerProps {
  errors: ErrorRecord[];
  onFeedback: (solutionId: number, feedback: SolutionFeedbackRequest) => Promise<void>;
  availableProjects?: string[];
  availableLanguages?: string[];
}

export const SolutionRanker: React.FC<SolutionRankerProps> = ({
  errors,
  onFeedback,
  availableProjects = [],
  availableLanguages = [],
}) => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ranker' | 'simulator'>('ranker');
  const [fetchedSolutions, setFetchedSolutions] = useState<Solution[]>([]);

  const projects = useMemo(() => {
    return Array.from(
      new Set([...errors.map((e) => e.project).filter(Boolean), ...availableProjects])
    );
  }, [errors, availableProjects]);

  const languages = useMemo(() => {
    return Array.from(
      new Set([...errors.map((e) => e.language).filter(Boolean), ...availableLanguages])
    );
  }, [errors, availableLanguages]);

  const filteredErrors = useMemo(() => {
    return errors.filter((err) => {
      const matchesProject =
        !selectedProject || (err.project && err.project.toLowerCase() === selectedProject.toLowerCase());
      const matchesLanguage =
        !selectedLanguage || (err.language && err.language.toLowerCase() === selectedLanguage.toLowerCase());
      return matchesProject && matchesLanguage;
    });
  }, [errors, selectedProject, selectedLanguage]);

  const [selectedErrorId, setSelectedErrorId] = useState<number>(filteredErrors[0]?.id || 0);

  const [simSuccessCount, setSimSuccessCount] = useState<number>(10);
  const [simFailureCount, setSimFailureCount] = useState<number>(1);
  const [simDaysAgo, setSimDaysAgo] = useState<number>(4);
  const [simFeedbackScore, setSimFeedbackScore] = useState<number>(4.8);

  useEffect(() => {
    if (filteredErrors.length > 0) {
      if (!selectedErrorId || !filteredErrors.some((e) => e.id === selectedErrorId)) {
        setSelectedErrorId(filteredErrors[0].id);
      }
    } else {
      setSelectedErrorId(0);
    }
  }, [filteredErrors, selectedErrorId]);

  const selectedError = filteredErrors.find((e) => e.id === selectedErrorId) || filteredErrors[0];

  useEffect(() => {
    if (selectedErrorId) {
      let isMounted = true;
      recallApi.getRankedSolutions(selectedErrorId)
        .then((sols) => {
          if (isMounted && sols && sols.length > 0) {
            setFetchedSolutions(sols);
          }
        })
        .catch(() => {});
      return () => { isMounted = false; };
    }
  }, [selectedErrorId]);

  const activeSolutions = fetchedSolutions.length > 0
    ? fetchedSolutions
    : (selectedError?.solutions || []);

  const simSolution: Solution = {
    id: 9999,
    description: 'Simulated Solution Strategy',
    successCount: simSuccessCount,
    failureCount: simFailureCount,
    lastSuccessDate: new Date(Date.now() - simDaysAgo * 24 * 60 * 60 * 1000).toISOString(),
    feedbackScore: simFeedbackScore,
  };
  const simResult = recallApi.calculateDecayScore(simSolution);
  const baseScore = simResult.successRate * 0.5 + simResult.usageFreq * 0.3 + simResult.feedbackNorm * 0.2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="tool-toolbar" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap style={{ width: 13, height: 13, color: 'var(--primary)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Solution Ranker</span>
        </div>

        <div className="vert-divider" style={{ height: 18 }} />

        {/* Project Selection Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Folder style={{ width: 11, height: 11, color: 'var(--text-dim)' }} />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="tool-select"
          >
            <option value="">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Language Selection Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Code style={{ width: 11, height: 11, color: 'var(--text-dim)' }} />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="tool-select mono"
          >
            <option value="">All Languages ({languages.length})</option>
            {languages.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {(selectedProject || selectedLanguage) && (
          <button
            onClick={() => {
              setSelectedProject('');
              setSelectedLanguage('');
            }}
            className="btn btn-ghost btn-xs"
            style={{ fontSize: 10, gap: 4 }}
          >
            <X style={{ width: 10, height: 10 }} />
            Clear Filters
          </button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveTab('ranker')}
            className={`btn btn-sm ${activeTab === 'ranker' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Award style={{ width: 11, height: 11 }} />
            Rankings
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`btn btn-sm ${activeTab === 'simulator' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Calculator style={{ width: 11, height: 11 }} />
            Simulator
          </button>
        </div>
      </div>

      {activeTab === 'ranker' ? (
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="section-label" style={{ padding: '14px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Error Records ({filteredErrors.length})</span>
            </div>
            {filteredErrors.length === 0 ? (
              <div className="text-xs text-slate-500 p-4 text-center">
                No error records found matching filters.
                {(selectedProject || selectedLanguage) && (
                  <button
                    onClick={() => { setSelectedProject(''); setSelectedLanguage(''); }}
                    className="btn btn-ghost btn-xs block mx-auto mt-2"
                    style={{ fontSize: 10 }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              filteredErrors.map((err) => {
                const isSelected = err.id === (selectedError?.id || 0);
                return (
                  <div
                    key={err.id}
                    onClick={() => setSelectedErrorId(err.id)}
                    style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid var(--border-subtle)',
                      borderLeft: `4px solid ${isSelected ? '#fdad00' : 'transparent'}`,
                      background: isSelected ? 'rgba(253, 173, 0, 0.12)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="mono" style={{ fontSize: 11, fontWeight: 600, color: isSelected ? '#fdad00' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>
                      {err.signature}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{err.project}</span>
                      <span style={{ fontSize: 10, color: 'var(--success)', fontFamily: 'monospace' }}>{err.solutions?.length || 0} fixes</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {selectedError ? (
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                  <div className="section-label" style={{ marginBottom: 4 }}>Selected Signature</div>
                  <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: '#fdad00', wordBreak: 'break-all' }}>
                    {selectedError.signature}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {activeSolutions && activeSolutions.length > 0 ? (
                    activeSolutions.map((sol, index) => {
                      const math = recallApi.calculateDecayScore(sol);

                      return (
                        <div key={sol.id} className="tool-card" style={{ padding: '18px 22px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                              <span className="badge badge-blue mono" style={{ flexShrink: 0 }}>#{index + 1}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11.5, color: 'var(--text)', fontWeight: 500, lineHeight: 1.5, marginBottom: 5 }}>
                                  {sol.description}
                                </div>
                                <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <Clock style={{ width: 10, height: 10 }} />
                                  {math.daysSinceSuccess.toFixed(1)}d ago
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 14 }}>
                              <div className="section-label" style={{ marginBottom: 3 }}>Score</div>
                              <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                                {math.totalScore.toFixed(4)}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 18px', marginBottom: 14 }}>
                            <div>
                              <div className="section-label" style={{ marginBottom: 4 }}>Success Rate</div>
                              <div className="mono" style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>{(math.successRate * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="section-label" style={{ marginBottom: 4 }}>Usage Freq</div>
                              <div className="mono" style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>{(math.usageFreq * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="section-label" style={{ marginBottom: 4 }}>Decay</div>
                              <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{math.decayFactor.toFixed(3)}</div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                            <button onClick={() => onFeedback(sol.id, { success: false })} className="btn btn-danger btn-sm">
                              <XCircle style={{ width: 11, height: 11 }} />
                              Failed
                            </button>
                            <button onClick={() => onFeedback(sol.id, { success: true })} className="btn btn-success btn-sm">
                              <CheckCircle2 style={{ width: 11, height: 11 }} />
                              Worked
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 11 }}>
                    No solutions logged for this error record.
                  </div>
                )}
              </div>
            </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 11 }}>
                Select an error record on the left.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ width: 340, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders style={{ width: 13, height: 13, color: 'var(--primary)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Decay Controls</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Days Passed:</span>
                <span className="text-[#fdad00] font-bold">{simDaysAgo} days</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={simDaysAgo}
                onChange={(e) => setSimDaysAgo(Number(e.target.value))}
                className="w-full accent-[#fdad00] cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Success Count:</span>
                <span className="text-emerald-400 font-bold">{simSuccessCount}</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={simSuccessCount}
                onChange={(e) => setSimSuccessCount(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Failure Count:</span>
                <span className="text-rose-400 font-bold">{simFailureCount}</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={simFailureCount}
                onChange={(e) => setSimFailureCount(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Rating:</span>
                <span className="text-amber-300 font-bold">⭐ {simFeedbackScore.toFixed(1)} / 5.0</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={simFeedbackScore}
                onChange={(e) => setSimFeedbackScore(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-lg bg-black border border-[#fdad00]/40 text-[11px] text-slate-300 leading-relaxed font-mono">
              <div>Computed Score: <b className="text-[#fdad00]">{simResult.totalScore.toFixed(4)}</b></div>
              <div className="text-slate-500 text-[10px] mt-0.5">
                Multiplier: {simResult.decayFactor.toFixed(4)}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calculator style={{ width: 13, height: 13, color: 'var(--primary)' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Decay Trajectory</span>
              </div>
            </div>

            <div className="flex-1 min-h-0 mt-2">
              <SolutionDecayChart
                lambda={0.05}
                baseScore={baseScore}
                currentDaysAgo={simDaysAgo}
                currentScore={simResult.totalScore}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
