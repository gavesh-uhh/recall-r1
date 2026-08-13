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
import { formatSignatureTitle } from '../utils/formatters';
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

  const activeSolutions = selectedError?.solutions || [];

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
      <div className="tool-toolbar" style={{ flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap style={{ width: 15, height: 15, color: 'var(--primary)' }} />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Solution Ranker</span>
        </div>

        <div className="vert-divider" style={{ height: 20 }} />

        {/* Project Selection Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Folder style={{ width: 13, height: 13, color: 'var(--text-dim)' }} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Code style={{ width: 13, height: 13, color: 'var(--text-dim)' }} />
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
          >
            <X style={{ width: 11, height: 11 }} />
            Clear Filters
          </button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button
            onClick={() => setActiveTab('ranker')}
            className={`btn ${activeTab === 'ranker' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Award style={{ width: 13, height: 13 }} />
            Rankings
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`btn ${activeTab === 'simulator' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Calculator style={{ width: 13, height: 13 }} />
            Simulator
          </button>
        </div>
      </div>

      {activeTab === 'ranker' ? (
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="section-label" style={{ padding: '18px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Error Records ({filteredErrors.length})</span>
            </div>
            {filteredErrors.length === 0 ? (
              <div className="text-xs text-slate-500 p-6 text-center">
                No error records found matching filters.
                {(selectedProject || selectedLanguage) && (
                  <button
                    onClick={() => { setSelectedProject(''); setSelectedLanguage(''); }}
                    className="btn btn-ghost btn-xs block mx-auto mt-3"
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
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--border-subtle)',
                      borderLeft: `4px solid ${isSelected ? '#fdad00' : 'transparent'}`,
                      background: isSelected ? 'rgba(253, 173, 0, 0.12)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="mono" style={{ fontSize: 12, fontWeight: 600, color: isSelected ? '#fdad00' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                      {formatSignatureTitle(err.signature)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{err.project}</span>
                      <span style={{ fontSize: 11, color: 'var(--success)', fontFamily: 'monospace' }}>{err.solutions?.length || 0} fixes</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {selectedError ? (
              <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 920, width: '100%', margin: '0 auto' }}>
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 18 }}>
                  <div className="section-label" style={{ marginBottom: 6 }}>Selected Signature</div>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: '#fdad00', wordBreak: 'break-all', lineHeight: 1.5 }}>
                    {selectedError.signature}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {activeSolutions && activeSolutions.length > 0 ? (
                    activeSolutions.map((sol, index) => {
                      const math = recallApi.calculateDecayScore(sol);

                      return (
                        <div key={sol.id} className="tool-card" style={{ padding: '22px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                              <span className="badge badge-blue mono" style={{ flexShrink: 0 }}>#{index + 1}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500, lineHeight: 1.6, marginBottom: 6 }}>
                                  {sol.description}
                                </div>
                                <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Clock style={{ width: 11, height: 11 }} />
                                  {sol.lastSuccessDate ? `${math.daysSinceSuccess.toFixed(1)}d ago` : 'never tried'}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                              <div className="section-label" style={{ marginBottom: 4 }}>Score</div>
                              <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>
                                {math.totalScore.toFixed(4)}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, background: 'var(--bg)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '16px 22px', marginBottom: 16 }}>
                            <div>
                              <div className="section-label" style={{ marginBottom: 5 }}>Success Rate</div>
                              <div className="mono" style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>{(math.successRate * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="section-label" style={{ marginBottom: 5 }}>Usage Freq</div>
                              <div className="mono" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>{(math.usageFreq * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="section-label" style={{ marginBottom: 5 }}>Decay</div>
                              <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{math.decayFactor.toFixed(3)}</div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginRight: 'auto' }}>
                              <span style={{ fontSize: 11, color: 'var(--text-dim)', marginRight: 4 }}>Rate this fix</span>
                              {[1, 2, 3, 4, 5].map((n) => {
                                const active = n <= Math.round(sol.feedbackScore || 0);
                                return (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => onFeedback(sol.id, { rating: n })}
                                    title={`Rate ${n}/5 (optional)`}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
                                  >
                                    <Star
                                      style={{ width: 14, height: 14 }}
                                      fill={active ? '#fdad00' : 'none'}
                                      color={active ? '#fdad00' : 'var(--text-dim)'}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                            <button onClick={() => onFeedback(sol.id, { success: false })} className="btn btn-danger btn-sm">
                              <XCircle style={{ width: 12, height: 12 }} />
                              Didn't work
                            </button>
                            <button onClick={() => onFeedback(sol.id, { success: true })} className="btn btn-success btn-sm">
                              <CheckCircle2 style={{ width: 12, height: 12 }} />
                              Worked
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 12 }}>
                    No solutions logged for this error record.
                  </div>
                )}
              </div>
            </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 12.5 }}>
                Select an error record on the left.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ width: 360, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '28px 26px', display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders style={{ width: 14, height: 14, color: 'var(--primary)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Decay Controls</span>
            </div>

            <div className="space-y-2.5">
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

            <div className="space-y-2.5">
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

            <div className="space-y-2.5">
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

            <div className="space-y-2.5">
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

            <div className="p-4 rounded-lg bg-black border border-[#fdad00]/40 text-[12px] text-slate-300 leading-relaxed font-mono">
              <div>Computed Score: <b className="text-[#fdad00]">{simResult.totalScore.toFixed(4)}</b></div>
              <div className="text-slate-500 text-[11px] mt-1">
                Multiplier: {simResult.decayFactor.toFixed(4)}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calculator style={{ width: 14, height: 14, color: 'var(--primary)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Decay Trajectory</span>
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
