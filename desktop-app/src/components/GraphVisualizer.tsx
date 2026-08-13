import React, { useState, useEffect, useMemo } from 'react';
import { Network, Link, Share2, Layers, GitCommit, Filter, Sparkles, RefreshCw, Folder, Tags } from 'lucide-react';
import { PatternCluster, ErrorRecord, ErrorRelation } from '../types/api';
import { recallApi } from '../services/api';
import { ErrorGraphEChart } from './ErrorGraphEChart';

interface GraphVisualizerProps {
  errors: ErrorRecord[];
  onOpenLinkModal: () => void;
}

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({ errors, onOpenLinkModal }) => {
  const [patterns, setPatterns] = useState<PatternCluster[]>([]);
  const [relations, setRelations] = useState<ErrorRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [edgeFilter, setEdgeFilter] = useState<'all' | 'patterns' | 'tags' | 'projects' | 'persisted'>('all');
  const [graphLayout, setGraphLayout] = useState<'force' | 'circular' | 'grid'>('force');
  const [showReasons, setShowReasons] = useState<boolean>(true);
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

  const fetchPatternsAndRelations = async () => {
    setLoading(true);
    try {
      const [data, rels] = await Promise.all([
        recallApi.getPatterns(),
        recallApi.getRelations(),
      ]);
      setPatterns(data);
      setRelations(rels);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatternsAndRelations();
  }, [errors]);

  const selectedError = filteredErrors.find((e) => e.id === selectedErrorId) || filteredErrors[0];

  useEffect(() => {
    if (!selectedError) {
      setRelatedErrors([]);
      return;
    }

    const relatedIds = new Set<number>();

    if (edgeFilter === 'all' || edgeFilter === 'persisted') {
      relations.forEach(r => {
        if (r.errorAId === selectedError.id) relatedIds.add(r.errorBId);
        if (r.errorBId === selectedError.id) relatedIds.add(r.errorAId);
      });
    }

    if (edgeFilter === 'all' || edgeFilter === 'patterns') {
      patterns.forEach((pat: any) => {
        if (pat.examples && pat.examples.length > 1) {
          const inPattern = pat.examples.some((e: any) => e.id === selectedError.id);
          if (inPattern) {
            pat.examples.forEach((e: any) => {
              if (e.id !== selectedError.id) relatedIds.add(e.id);
            });
          }
        }
      });
    }

    if (edgeFilter === 'all' || edgeFilter === 'tags') {
      errors.forEach(e => {
        if (e.id !== selectedError.id) {
          const sharedTags = selectedError.tags.filter(t => e.tags.includes(t));
          if (sharedTags.length > 0) relatedIds.add(e.id);
        }
      });
    }

    if (edgeFilter === 'all' || edgeFilter === 'projects') {
      errors.forEach(e => {
        if (e.id !== selectedError.id) {
          if (selectedError.project.toLowerCase() === e.project.toLowerCase()) {
            relatedIds.add(e.id);
          }
        }
      });
    }

    setRelatedErrors(errors.filter(e => relatedIds.has(e.id)));
    setLoadingRelated(false);
  }, [selectedError?.id, relations, patterns, edgeFilter, errors]);

  const handleNodeClick = (errorId: number) => {
    setSelectedErrorId(errorId);
  };

  // Explains why a related error is connected to the selected one
  const getLinkReasons = (other: ErrorRecord): string[] => {
    if (!selectedError) return [];
    const reasons: string[] = [];
    
    // Check actual persisted relations
    const actualRels = relations.filter(r => 
      (r.errorAId === selectedError.id && r.errorBId === other.id) ||
      (r.errorAId === other.id && r.errorBId === selectedError.id)
    );
    
    actualRels.forEach(r => {
      if (r.relationType === 'SIGNATURE_MATCH') reasons.push(`SIGNATURE MATCH: Similar error signature`);
      else if (r.relationType === 'TAG_MATCH') reasons.push(`TAG MATCH: Shared explicit tags`);
      else if (r.relationType === 'MANUAL') reasons.push(`MANUAL: Manually linked by user`);
      else reasons.push(`Relationship: ${r.relationType}`);
    });

    const sharedTags = selectedError.tags.filter((t) => other.tags.includes(t));
    if (sharedTags.length > 0) reasons.push(`Shared tags (derived): ${sharedTags.join(', ')}`);
    if (selectedError.project.toLowerCase() === other.project.toLowerCase()) {
      reasons.push(`Same project (derived): ${selectedError.project}`);
    }
    const sharedPattern = patterns.find(
      (p: any) => p.examples?.some((e: any) => e.id === selectedError.id) && 
                  p.examples?.some((e: any) => e.id === other.id)
    );
    if (sharedPattern) reasons.push(`Pattern (derived): ${sharedPattern.tag}`);
    if (reasons.length === 0) reasons.push('Indirectly related (Depth 2+)');
    return reasons;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      <div className="tool-toolbar" style={{ flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Network style={{ width: 15, height: 15, color: 'var(--primary)' }} />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Pattern Graph</span>
        </div>

        <div className="vert-divider" style={{ height: 20 }} />

        {/* Project Selection Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Folder style={{ width: 13, height: 13, color: 'var(--text-dim)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Project:</span>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="tool-select"
            style={{ minWidth: 150 }}
          >
            <option value="all">All Projects ({errors.length})</option>
            {projectsList.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Edge Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter style={{ width: 13, height: 13, color: 'var(--text-dim)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Edges:</span>
          <select
            value={edgeFilter}
            onChange={(e) => setEdgeFilter(e.target.value as any)}
            className="tool-select"
          >
            <option value="all">All Connections</option>
            <option value="persisted">Actual Backend Relations</option>
            <option value="patterns">Patterns Only (Derived)</option>
            <option value="tags">Shared Tags Only (Derived)</option>
            <option value="projects">Same Project Only (Derived)</option>
          </select>
        </div>

        {/* Layout Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers style={{ width: 13, height: 13, color: 'var(--text-dim)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Layout:</span>
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

        {/* Edge Reason Labels Toggle */}
        <button
          onClick={() => setShowReasons((v) => !v)}
          className={`btn btn-sm ${showReasons ? 'btn-primary' : 'btn-ghost'}`}
          title="Show or hide link reasons on graph edges"
        >
          <Tags style={{ width: 12, height: 12 }} />
          Reasons
        </button>

        <div style={{ marginLeft: 'auto' }}>
          <button onClick={onOpenLinkModal} disabled={errors.length === 0} className="btn btn-primary">
            <Link style={{ width: 13, height: 13 }} />
            Link Errors
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Share2 style={{ width: 14, height: 14, color: 'var(--text-dim)' }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>Graph Topology</span>
              <span className="badge badge-muted mono">{selectedProject.toUpperCase()}</span>
              <span className="badge badge-blue mono">{graphLayout.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)' }}>
                <span style={{ width: 18, height: 2, background: '#fdad00', display: 'inline-block' }} />
                Patterns
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)' }}>
                <span style={{ width: 18, height: 2, background: '#3fb950', display: 'inline-block' }} />
                Tags
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)' }}>
                <span style={{ width: 18, height: 2, background: '#5d6670', display: 'inline-block' }} />
                Projects
              </span>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ErrorGraphEChart
              patterns={patterns}
              errors={filteredErrors}
              relations={relations}
              edgeFilter={edgeFilter}
              graphLayout={graphLayout}
              showEdgeLabels={showReasons}
              onNodeClick={handleNodeClick}
            />
          </div>
        </div>

        <div style={{ width: 360, flexShrink: 0, overflowY: 'auto', padding: '28px 30px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {selectedError ? (
            <>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className="badge badge-blue">#{selectedError.id}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{selectedError.project}</span>
                  {loadingRelated && <RefreshCw style={{ width: 12, height: 12, color: 'var(--primary)' }} className="spin" />}
                </div>
                <div className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: '#fdad00', wordBreak: 'break-all', lineHeight: 1.5 }}>
                  {selectedError.signature}
                </div>
              </div>

              <div>
                <div className="section-label" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GitCommit style={{ width: 12, height: 12 }} />
                  Related Error Network
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {relatedErrors.length > 0 ? (
                    relatedErrors.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => handleNodeClick(rel.id)}
                        className="tool-card"
                        style={{ padding: '16px 18px', cursor: 'pointer' }}
                      >
                        <div className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: '#fdad00', wordBreak: 'break-all', lineHeight: 1.5, marginBottom: 4 }}>
                          #{rel.id} {rel.signature}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                          {rel.message}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                          {getLinkReasons(rel).map((reason) => {
                            let iconColor = 'var(--text-dim)';
                            if (reason.startsWith('SIGNATURE MATCH')) iconColor = '#fdad00';
                            else if (reason.startsWith('TAG MATCH') || reason.startsWith('Shared tags')) iconColor = '#3fb950';
                            else if (reason.startsWith('Same project')) iconColor = '#5d6670';
                            else if (reason.startsWith('MANUAL')) iconColor = '#f85149';
                            
                            return (
                              <div key={reason} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                <Link style={{ width: 10, height: 10, color: iconColor, flexShrink: 0, marginTop: 3 }} />
                                <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                                  {reason}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                      No direct edges. Use "Link Errors" to connect nodes.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-dim)', paddingTop: 60 }}>
              <Network style={{ width: 36, height: 36, opacity: 0.2 }} />
              <span style={{ fontSize: 12.5, textAlign: 'center', lineHeight: 1.6 }}>Click a node to inspect its related error network</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
