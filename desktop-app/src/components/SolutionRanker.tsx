import React, { useState } from 'react';
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
} from 'lucide-react';
import { ErrorRecord, Solution, SolutionFeedbackRequest } from '../types/api';
import { recallApi } from '../services/api';
import { SolutionDecayChart } from './SolutionDecayChart';

interface SolutionRankerProps {
  errors: ErrorRecord[];
  onFeedback: (solutionId: number, feedback: SolutionFeedbackRequest) => Promise<void>;
}

export const SolutionRanker: React.FC<SolutionRankerProps> = ({ errors, onFeedback }) => {
  const [selectedErrorId, setSelectedErrorId] = useState<number>(errors[0]?.id || 0);
  const [activeTab, setActiveTab] = useState<'ranker' | 'simulator'>('ranker');
  const [fetchedSolutions, setFetchedSolutions] = useState<Solution[]>([]);

  // Simulator state
  const [simSuccessCount, setSimSuccessCount] = useState<number>(10);
  const [simFailureCount, setSimFailureCount] = useState<number>(1);
  const [simDaysAgo, setSimDaysAgo] = useState<number>(4);
  const [simFeedbackScore, setSimFeedbackScore] = useState<number>(4.8);

  const selectedError = errors.find((e) => e.id === selectedErrorId) || errors[0];

  React.useEffect(() => {
    if (errors.length > 0 && (!selectedErrorId || !errors.some((e) => e.id === selectedErrorId))) {
      setSelectedErrorId(errors[0].id);
    }
  }, [errors, selectedErrorId]);

  React.useEffect(() => {
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

  // Use freshly fetched solutions if available, else immediately render in-memory solutions with ZERO flicker
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
    <div className="h-[calc(100vh-62px)] flex flex-col p-6 space-y-4 overflow-hidden">
      {/* Header */}
      <div className="pro-panel p-3.5 rounded-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-950 text-blue-400 border border-blue-800">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Solution Decay & MaxHeap Ranking Engine</h2>
            <p className="text-xs text-slate-400 font-mono">
              score = (successRate*w1 + usageFreq*w2 + feedbackNorm*w3) * exp(-λ * days)
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center space-x-1 bg-black p-1 rounded-lg border border-blue-950">
          <button
            onClick={() => setActiveTab('ranker')}
            className={`flex items-center space-x-2 px-3 py-1 rounded text-xs font-medium transition ${
              activeTab === 'ranker'
                ? 'bg-blue-700 text-white font-semibold shadow-md shadow-blue-900/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>Ranked Solutions</span>
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center space-x-2 px-3 py-1 rounded text-xs font-medium transition ${
              activeTab === 'simulator'
                ? 'bg-blue-700 text-white font-semibold shadow-md shadow-blue-900/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>Decay Simulator</span>
          </button>
        </div>
      </div>

      {activeTab === 'ranker' ? (
        <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
          {/* Error Selector List (4 cols) */}
          <div className="col-span-4 pro-panel p-4 rounded-xl flex flex-col space-y-2 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-1">
              Select Error Record
            </h3>
            {errors.length === 0 ? (
              <div className="text-xs text-slate-500 p-4 text-center">
                No error records found in database.
              </div>
            ) : (
              errors.map((err) => {
                const isSelected = err.id === (selectedError?.id || 0);
                return (
                  <div
                    key={err.id}
                    onClick={() => setSelectedErrorId(err.id)}
                    className={`p-3 rounded-lg cursor-pointer border transition ${
                      isSelected
                        ? 'bg-slate-800 border-blue-500'
                        : 'bg-slate-900/90 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <h4 className="font-mono text-xs font-semibold text-blue-200 line-clamp-1">
                      {err.signature}
                    </h4>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                      <span>{err.project}</span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        {err.solutions?.length || 0} fixes
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Solutions & Feedback Panel (8 cols) */}
          <div className="col-span-8 pro-panel p-5 rounded-xl flex flex-col space-y-4 overflow-y-auto">
            {selectedError ? (
              <>
                <div className="border-b border-slate-700 pb-3">
                  <div className="text-[10px] font-mono text-blue-400 uppercase">Selected Signature</div>
                  <h3 className="font-mono text-xs font-bold text-white mt-0.5">
                    {selectedError.signature}
                  </h3>
                </div>

                <div className="space-y-3">
                  {activeSolutions && activeSolutions.length > 0 ? (
                    activeSolutions.map((sol, index) => {
                      const math = recallApi.calculateDecayScore(sol);

                      return (
                        <div key={sol.id} className="pro-card p-4 rounded-xl space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="h-7 w-7 rounded bg-slate-800 text-blue-300 border border-slate-700 font-bold font-mono text-xs flex items-center justify-center">
                                #{index + 1}
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-white leading-tight">
                                  {sol.description}
                                </h4>
                                <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    Last success: {math.daysSinceSuccess.toFixed(1)} days ago
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-[10px] font-mono text-slate-400 uppercase">
                                Decay Score
                              </div>
                              <div className="text-base font-mono font-bold text-blue-400">
                                {math.totalScore.toFixed(4)}
                              </div>
                            </div>
                          </div>

                          {/* Formula Breakdown Progress Bars */}
                          <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-700 text-xs font-mono">
                            <div>
                              <div className="text-[10px] text-slate-400">Success Rate</div>
                              <div className="font-semibold text-emerald-400">
                                {(math.successRate * 100).toFixed(0)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 font-mono">Usage Freq</div>
                              <div className="font-semibold text-blue-400">
                                {(math.usageFreq * 100).toFixed(0)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 font-mono">Decay Factor</div>
                              <div className="font-semibold text-slate-300">
                                {math.decayFactor.toFixed(3)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-700/80">
                            <button
                              onClick={() => onFeedback(sol.id, { success: false })}
                              className="flex items-center space-x-1 text-xs text-rose-400 bg-rose-950 px-2.5 py-1 rounded border border-rose-800 transition"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Failed</span>
                            </button>
                            <button
                              onClick={() => onFeedback(sol.id, { success: true })}
                              className="flex items-center space-x-1 text-xs text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800 transition font-semibold"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Worked (+1 Success)</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No solutions logged for this error record.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-xs p-6 text-center">
                Select an error record on the left.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Simulator View with Apache ECharts */
        <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
          <div className="col-span-5 pro-panel p-5 rounded-xl space-y-4 overflow-y-auto">
            <h3 className="text-xs font-bold text-white flex items-center space-x-2">
              <Sliders className="h-4 w-4 text-blue-400" />
              <span>Decay Math Controls</span>
            </h3>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Days Passed:</span>
                <span className="text-blue-400 font-bold">{simDaysAgo} days</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={simDaysAgo}
                onChange={(e) => setSimDaysAgo(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
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

            <div className="p-3 rounded-lg bg-black border border-blue-955 text-[11px] text-slate-300 leading-relaxed font-mono">
              <div>Computed Score: <b className="text-blue-400">{simResult.totalScore.toFixed(4)}</b></div>
              <div className="text-slate-500 text-[10px] mt-0.5">
                Multiplier: {simResult.decayFactor.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Apache ECharts Dynamic Decay Plot */}
          <div className="col-span-7 pro-panel p-4 rounded-xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-blue-955 pb-2 flex items-center justify-between">
              <div className="text-xs font-bold text-white flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-blue-400" />
                <span>Apache ECharts — Solution Decay Trajectory</span>
              </div>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900">
                λ = 0.05
              </span>
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
