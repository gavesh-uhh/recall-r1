import React, { useEffect, useState } from 'react';
import { Network, Activity, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { recallApi } from '../services/api';
import { SignatureMatchDto, SignatureCandidate, ErrorRecord } from '../types/api';

interface SignatureMatchingPanelProps {
  errorId: number;
  allErrors: ErrorRecord[];
  onSelectError: (err: ErrorRecord) => void;
  onNavigateToPatterns: () => void;
}

export const SignatureMatchingPanel: React.FC<SignatureMatchingPanelProps> = ({ 
  errorId, 
  allErrors,
  onSelectError,
  onNavigateToPatterns
}) => {
  const [matchData, setMatchData] = useState<SignatureMatchDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await recallApi.getSignatureMatching(errorId);
        if (mounted) {
          if (data) {
            setMatchData(data);
          } else {
            setError('No signature matching data available.');
          }
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load matching data');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [errorId]);

  if (loading) {
    return <div style={{ fontSize: 12, color: 'var(--text-dim)', padding: 16 }}>Loading signature matching data...</div>;
  }

  if (error || !matchData) {
    return (
      <div className="tool-card" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 12 }}>
        {error || 'No matching data found.'}
      </div>
    );
  }

  const renderCandidate = (label: string, candidate: SignatureCandidate | null) => {
    if (!candidate) {
      return (
        <div style={{ flex: 1, padding: 16, border: '1px solid var(--border-subtle)', borderRadius: 6, background: 'rgba(255, 255, 255, 0.02)' }}>
          <div className="section-label" style={{ marginBottom: 8, color: 'var(--text-dim)' }}>{label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>None found</div>
        </div>
      );
    }
    
    const isMatched = matchData.matchOccurred && matchData.matchedErrorId === candidate.errorId;
    const isSelf = candidate.errorId === errorId;

    return (
      <div style={{ 
        flex: 1, 
        padding: 16, 
        border: `1px solid ${isMatched ? '#fdad00' : 'var(--border-subtle)'}`, 
        borderRadius: 6, 
        background: isMatched ? 'rgba(253, 173, 0, 0.05)' : 'rgba(255, 255, 255, 0.02)',
        position: 'relative'
      }}>
        {isMatched && (
          <div style={{ position: 'absolute', top: -8, right: 12, background: '#fdad00', color: '#000', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
            MATCHED
          </div>
        )}
        <div className="section-label" style={{ marginBottom: 8 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span className="badge badge-blue">#{candidate.errorId}</span>
          <span style={{ fontSize: 11, color: isSelf ? 'var(--text-dim)' : (candidate.similarity >= matchData.prefixThreshold ? 'var(--success)' : 'var(--warning)') }}>
            Similarity: {candidate.similarity}%
          </span>
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', wordBreak: 'break-all', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {candidate.errorSignature}
        </div>
        
        {isSelf && (
          <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-dim)', fontStyle: 'italic' }}>(Self Reference)</div>
        )}
      </div>
    );
  };

  const handleNavigateToMatch = () => {
    if (matchData.matchedErrorId) {
      const target = allErrors.find(e => e.id === matchData.matchedErrorId);
      if (target) onSelectError(target);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Network style={{ width: 14, height: 14, color: 'var(--primary)' }} />
        <div className="section-label" style={{ margin: 0 }}>Signature Matching</div>
      </div>
      
      <div className="tool-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        <div>
          <div className="section-label" style={{ marginBottom: 6, fontSize: 10 }}>Current Signature</div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--text)', wordBreak: 'break-all', background: 'var(--hover)', padding: '8px 12px', borderRadius: 6 }}>
            {matchData.currentSignature}
          </div>
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: 12, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity style={{ width: 12, height: 12 }} />
            BST Candidates
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {renderCandidate('Predecessor', matchData.predecessor)}
            {renderCandidate('Successor', matchData.successor)}
          </div>
        </div>

        <div className="tool-divider" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {matchData.matchOccurred ? (
                <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--success)' }} />
              ) : (
                <XCircle style={{ width: 16, height: 16, color: 'var(--text-dim)' }} />
              )}
              <span style={{ fontSize: 13, fontWeight: 600, color: matchData.matchOccurred ? 'var(--text)' : 'var(--text-dim)' }}>
                {matchData.matchOccurred ? 'Match Found' : 'No Match Found'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Threshold: {matchData.prefixThreshold}% similarity required
            </div>
          </div>

          {matchData.matchOccurred && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Relationship created</div>
                <div className="mono" style={{ fontSize: 11, color: '#fdad00', fontWeight: 600 }}>{matchData.relationshipType}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button 
                  onClick={handleNavigateToMatch}
                  className="btn btn-ghost btn-sm" 
                  style={{ display: 'flex', gap: 4 }}
                >
                  View Error #{matchData.matchedErrorId}
                  <ArrowRight style={{ width: 12, height: 12 }} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
