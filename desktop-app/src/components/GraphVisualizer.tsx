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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Toolbar */}
      <div className="tool-toolbar">
        <Network style={{ width: 13, height: 13, color: 'var(--primary)' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Pattern Graph</span>

        <div className="vert-divider" style={{ height: 18, margin: '0 4px' }} />

        {/* Layout selector */}
        <div style={{ display: 'flex', gap: 2 }}>
          {(['force', 'circular', 'grid'] as const).map((l) => (
            <button key={l} onClick={() => setGraphLayout(l)}
              className={`btn btn-sm ${graphLayout === l ? 'btn-primary' : 'btn-ghost'}`}>
              {l === 'force' ? 'Force' : l === 'circular' ? 'Circular' : 'Radial'}
            </button>
          ))}
        </div>

        <div className="vert-divider" style={{ height: 18, margin: '0 4px' }} />

        {/* Edge filter */}
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Filter style={{ width: 11, height: 11, color: 'var(--text-dim)' }} />
          {(['all', 'patterns', 'tags'] as const).map((f) => (
            <button key={f} onClick={() => setEdgeFilter(f)}
              className={`btn btn-sm ${edgeFilter === f ? 'btn-primary' : 'btn-ghost'}`}>
              {f === 'all' ? 'All' : f === 'patterns' ? `Clusters (${patterns.length})` : 'Tags'}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <button onClick={onOpenLinkModal} disabled={errors.length === 0} className="btn btn-primary">
            <Link style={{ width: 12, height: 12 }} />
            Link Errors
          </button>
        </div>
      </div>

      {/* Main: Graph + Inspector */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Graph (main) */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Share2 style={{ width: 12, height: 12, color: 'var(--text-dim)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>Graph Topology</span>
              <span className="badge badge-muted mono">{graphLayout.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-dim)' }}>
                <span style={{ width: 16, height: 2, background: '#388bfd', display: 'inline-block' }} />
                Patterns
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-dim)' }}>
                <span style={{ width: 16, height: 2, background: '#3fb950', display: 'inline-block' }} />
                Tags
              </span>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ErrorGraphEChart
              patterns={patterns}
              errors={errors}
              edgeFilter={edgeFilter}
              graphLayout={graphLayout}
              onNodeClick={handleNodeClick}
            />
          </div>
        </div>

        {/* Inspector panel */}
        <div style={{ width: 340, flexShrink: 0, overflowY: 'auto', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {selectedError ? (
            <>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span className="badge badge-blue">#{selectedError.id}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{selectedError.project}</span>
                  {loadingRelated && <RefreshCw style={{ width: 10, height: 10, color: 'var(--primary)' }} className="spin" />}
                </div>
                <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: '#58a6ff', wordBreak: 'break-all' }}>
                  {selectedError.signature}
                </div>
              </div>

              <div>
                <div className="section-label" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GitCommit style={{ width: 11, height: 11 }} />
                  BFS Neighborhood (depth ≤ 2)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {relatedErrors.length > 0 ? (
                    relatedErrors.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => handleNodeClick(rel.id)}
                        className="tool-card"
                        style={{ padding: '14px 16px', cursor: 'pointer' }}
                      >
                        <div className="mono" style={{ fontSize: 10.5, fontWeight: 600, color: '#58a6ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                          #{rel.id} {rel.signature}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rel.message}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                      No direct edges. Use "Link Errors" to connect nodes.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="section-label" style={{ marginBottom: 10 }}>
                  Pattern Clusters ({patterns.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {patterns.length > 0 ? (
                    patterns.map((pat) => (
                      <div key={pat.id} className="tool-card" style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{pat.name}</span>
                          <span className="badge badge-green">{pat.projectCount}p</span>
                        </div>
                        <p style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{pat.description}</p>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                      No clusters yet. Log errors across 2+ projects to auto-cluster.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-dim)', paddingTop: 40 }}>
              <Network style={{ width: 28, height: 28, opacity: 0.2 }} />
              <span style={{ fontSize: 11, textAlign: 'center' }}>Click a node to inspect its BFS neighborhood</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
