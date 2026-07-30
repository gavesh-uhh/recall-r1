import React, { useState, useEffect } from 'react';
import { Network, Link, Share2, Layers, GitCommit, Filter, Sparkles, RefreshCw } from 'lucide-react';
import { PatternCluster, ErrorRecord } from '../types/api';
import { recallApi } from '../services/api';
import { ErrorGraphEChart } from './ErrorGraphEChart';

interface GraphVisualizerProps {
  errors: ErrorRecord[];
  onOpenLinkModal: () => void;
}

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({ errors, onOpenLinkModal }) => {
  const [patterns, setPatterns] = useState<PatternCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [edgeFilter, setEdgeFilter] = useState<'all' | 'patterns' | 'tags' | 'projects'>('all');
  const [graphLayout, setGraphLayout] = useState<'force' | 'circular' | 'grid'>('force');
  const [selectedErrorId, setSelectedErrorId] = useState<number | null>(null);
  const [relatedErrors, setRelatedErrors] = useState<ErrorRecord[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const fetchPatterns = async () => {
    setLoading(true);
    try {
      const data = await recallApi.getPatterns();
      setPatterns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatterns();
  }, [errors]);

  const handleNodeClick = async (errorId: number) => {
    setSelectedErrorId(errorId);
    setLoadingRelated(true);
    try {
      const related = await recallApi.getRelatedErrors(errorId, 2);
      setRelatedErrors(related);
    } catch (err) {
      console.error(err);
      setRelatedErrors([]);
    } finally {
      setLoadingRelated(false);
    }
  };

  const selectedError = errors.find((e) => e.id === selectedErrorId) || errors[0];

  return (
    <div className="h-[calc(100vh-62px)] flex flex-col p-6 space-y-4 overflow-hidden">
      {/* Header */}
      <div className="pro-panel p-3.5 rounded-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-950 text-blue-400 border border-blue-800">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Cross-Project Error Graph & Network Topology</h2>
            <p className="text-xs text-slate-400 font-mono">
              In-memory Graph adjacency index with BFS traversals & Jaccard/Levenshtein pattern clustering
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Graph Layout Mode Selector */}
          <div className="flex items-center space-x-1 bg-black p-1 rounded-lg border border-blue-955 text-xs">
            <Layers className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
            <button
              onClick={() => setGraphLayout('force')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                graphLayout === 'force' ? 'bg-blue-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Force Layout
            </button>
            <button
              onClick={() => setGraphLayout('circular')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                graphLayout === 'circular' ? 'bg-blue-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Circular Ring
            </button>
            <button
              onClick={() => setGraphLayout('grid')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                graphLayout === 'grid' ? 'bg-blue-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Radial Ring
            </button>
          </div>

          {/* Edge Filter Toggle */}
          <div className="flex items-center space-x-1 bg-black p-1 rounded-lg border border-blue-955 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
            <button
              onClick={() => setEdgeFilter('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                edgeFilter === 'all' ? 'bg-blue-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Edges
            </button>
            <button
              onClick={() => setEdgeFilter('patterns')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                edgeFilter === 'patterns' ? 'bg-blue-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Patterns ({patterns.length})
            </button>
            <button
              onClick={() => setEdgeFilter('tags')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                edgeFilter === 'tags' ? 'bg-blue-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Shared Tags
            </button>
          </div>

          <button
            onClick={onOpenLinkModal}
            disabled={errors.length === 0}
            className="flex items-center space-x-2 pro-button-primary text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow transition disabled:opacity-50"
          >
            <Link className="h-4 w-4" />
            <span>Link Errors Manually</span>
          </button>
        </div>
      </div>

      {/* Main Split Content */}
      <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Interactive ECharts Network Graph (7 cols) */}
        <div className="col-span-7 pro-panel p-4 rounded-xl flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between border-b border-blue-955 pb-2">
            <h3 className="text-xs font-bold text-white flex items-center space-x-2">
              <Share2 className="h-4 w-4 text-blue-400" />
              <span>Interactive Graph Topology ({graphLayout.toUpperCase()})</span>
            </h3>
            <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-0.5 bg-blue-500 inline-block"></span>
                <span>Patterns</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-0.5 bg-emerald-500 inline-block"></span>
                <span>Tags</span>
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 mt-2">
            <ErrorGraphEChart
              patterns={patterns}
              errors={errors}
              edgeFilter={edgeFilter}
              graphLayout={graphLayout}
              onNodeClick={handleNodeClick}
            />
          </div>
        </div>

        {/* BFS Neighborhood & Node Detail Inspector (5 cols) */}
        <div className="col-span-5 pro-panel p-4 rounded-xl flex flex-col space-y-4 overflow-y-auto">
          {selectedError ? (
            <div className="space-y-4">
              <div className="border-b border-blue-955 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900">
                    Selected Node #{selectedError.id}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Project: {selectedError.project}
                  </span>
                </div>
                <h3 className="font-mono text-xs font-bold text-white mt-1.5">
                  {selectedError.signature}
                </h3>
              </div>

              {/* BFS Graph Neighborhood */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <GitCommit className="h-3.5 w-3.5 text-blue-400" />
                    <span>BFS Traversal Neighborhood (Depth ≤ 2)</span>
                  </h4>
                  {loadingRelated && <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />}
                </div>

                <div className="space-y-2">
                  {relatedErrors.length > 0 ? (
                    relatedErrors.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => handleNodeClick(rel.id)}
                        className="bg-black p-3 rounded-lg border border-blue-955 cursor-pointer hover:border-blue-500 transition"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-semibold text-blue-300">
                            #{rel.id} {rel.signature}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-blue-950 px-1.5 py-0.5 rounded">
                            {rel.project}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-1 line-clamp-1">
                          {rel.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-black p-4 rounded text-center text-xs text-slate-500 border border-blue-955">
                      No direct graph edges linked to this node yet. Click "Link Errors Manually" above to create an edge.
                    </div>
                  )}
                </div>
              </div>

              {/* Pattern Clusters Summary */}
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Cross-Project Pattern Clusters ({patterns.length})
                </h4>
                {patterns.length > 0 ? (
                  patterns.map((pat) => (
                    <div key={pat.id} className="pro-card p-3 rounded-lg space-y-1 mb-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-white">
                        <span>{pat.name}</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          {pat.projectCount} Projects
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {pat.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 bg-black p-3 rounded border border-blue-955">
                    No multi-project pattern clusters registered. Log errors across 2 different projects with similar signatures or manual links to auto-cluster.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-500 text-xs">
              <Network className="h-8 w-8 text-blue-900" />
              <p>Click any node in the graph to inspect its BFS traversal neighborhood.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
