import React, { useState, useEffect, useMemo } from 'react';
import { Network, Link, Share2, Layers, GitCommit, Filter, Sparkles, RefreshCw, Folder } from 'lucide-react';
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
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [edgeFilter, setEdgeFilter] = useState<'all' | 'patterns' | 'tags' | 'projects'>('all');
  const [graphLayout, setGraphLayout] = useState<'force' | 'circular' | 'grid'>('force');
  const [selectedErrorId, setSelectedErrorId] = useState<number | null>(null);
  const [relatedErrors, setRelatedErrors] = useState<ErrorRecord[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const projectsList = useMemo(() => {
    return Array.from(new Set(errors.map((e) => e.project).filter(Boolean)));
  }, [errors]);

  const filteredErrors = useMemo(() => {
    if (selectedProject === 'all') return errors;
    return errors.filter((e) => e.project.toLowerCase() === selectedProject.toLowerCase());
  }, [errors, selectedProject]);

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

  const selectedError = filteredErrors.find((e) => e.id === selectedErrorId) || filteredErrors[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      <div className="tool-toolbar" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Network style={{ width: 13, height: 13, color: 'var(--primary)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Pattern Graph</span>
        </div>

        <div className="vert-divider" style={{ height: 18 }} />

        {/* Project Selection Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Folder style={{ width: 11, height: 11, color: 'var(--text-dim)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Project:</span>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="tool-select"
            style={{ minWidth: 130 }}
          >
            <option value="all">All Projects ({errors.length})</option>
            {projectsList.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Edge Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter style={{ width: 11, height: 11, color: 'var(--text-dim)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Edges:</span>
          <select
            value={edgeFilter}
            onChange={(e) => setEdgeFilter(e.target.value as any)}
            className="tool-select"
          >
            <option value="all">All Connections</option>
            <option value="patterns">Patterns Only</option>
            <option value="tags">Shared Tags Only</option>
            <option value="projects">Same Project Only</option>
          </select>
        </div>

        {/* Layout Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Layers style={{ width: 11, height: 11, color: 'var(--text-dim)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Layout:</span>
          <select
            value={graphLayout}
            onChange={(e) => setGraphLayout(e.target.value as any)}
            className="tool-select"
          >
            <option value="force">Force Directed</option>
            <option value="circular">Circular</option>
            <option value="grid">Radial Grid</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <button onClick={onOpenLinkModal} disabled={errors.length === 0} className="btn btn-primary btn-sm">
            <Link style={{ width: 11, height: 11 }} />
            Link Errors
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Share2 style={{ width: 12, height: 12, color: 'var(--text-dim)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>Graph Topology</span>
              <span className="badge badge-muted mono">{selectedProject.toUpperCase()}</span>
              <span className="badge badge-blue mono">{graphLayout.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-dim)' }}>
                <span style={{ width: 16, height: 2, background: '#d8871d', display: 'inline-block' }} />
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
              errors={filteredErrors}
              edgeFilter={edgeFilter}
              graphLayout={graphLayout}
              onNodeClick={handleNodeClick}
            />
          </div>
        </div>

        <div style={{ width: 340, flexShrink: 0, overflowY: 'auto', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {selectedError ? (
            <>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span className="badge badge-blue">#{selectedError.id}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{selectedError.project}</span>
                  {loadingRelated && <RefreshCw style={{ width: 10, height: 10, color: 'var(--primary)' }} className="spin" />}
                </div>
                <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: '#fdad00', wordBreak: 'break-all' }}>
                  {selectedError.signature}
                </div>
              </div>

              <div>
                <div className="section-label" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GitCommit style={{ width: 11, height: 11 }} />
                  Related Error Network
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
                        <div className="mono" style={{ fontSize: 10.5, fontWeight: 600, color: '#fdad00', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
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
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-dim)', paddingTop: 40 }}>
              <Network style={{ width: 28, height: 28, opacity: 0.2 }} />
              <span style={{ fontSize: 11, textAlign: 'center' }}>Click a node to inspect its related error network</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
