import React, { useEffect, useState } from 'react';
import { Network, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { recallApi } from '../services/api';
import { SignatureMatchDto, SignatureCandidate, ErrorRecord } from '../types/api';
import { formatSignatureTitle } from '../utils/formatters';

interface SignatureMatchingPanelProps {
  errorId: number;
  allErrors: ErrorRecord[];
  onSelectError: (err: ErrorRecord) => void;
  onNavigateToPatterns: () => void;
}

export const SignatureMatchingPanel: React.FC<SignatureMatchingPanelProps> = ({ 
  errorId, 
  allErrors,
  onSelectError
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
    return <div style={{ fontSize: 11, color: 'var(--text-dim)', padding: '8px 0' }}>Loading signature matching data...</div>;
  }

  if (error || !matchData) {
    return (
      <div className="tool-card" style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: 11 }}>
        {error || 'No matching data found.'}
      </div>
    );
  }

  const renderCandidate = (label: string, candidate: SignatureCandidate | null) => {
    if (!candidate) return null;
    
    const isMatched = matchData.matchOccurred && matchData.matchedErrorId === candidate.errorId;
    const isSelf = candidate.errorId === errorId;

    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '6px 8px', 
        border: `1px solid ${isMatched ? '#fdad00' : 'transparent'}`, 
        borderRadius: 4, 
        background: isMatched ? 'rgba(253, 173, 0, 0.05)' : 'var(--hover)',
        marginBottom: 4
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <span className="badge badge-blue" style={{ flexShrink: 0 }}>#{candidate.errorId}</span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', flexShrink: 0 }}>{label}</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', title: candidate.errorSignature }}>
            {formatSignatureTitle(candidate.errorSignature)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: isSelf ? 'var(--text-dim)' : (candidate.similarity >= matchData.prefixThreshold ? 'var(--success)' : 'var(--warning)') }}>
            {candidate.similarity}%
          </span>
          {isMatched && <span style={{ fontSize: 9, fontWeight: 700, color: '#fdad00', background: 'rgba(253, 173, 0, 0.1)', padding: '2px 4px', borderRadius: 2 }}>MATCH</span>}
        </div>
      </div>
    );
  };

  const hasCandidates = matchData.predecessor || matchData.successor;

  const handleNavigateToMatch = () => {
    if (matchData.matchedErrorId) {
      const target = allErrors.find(e => e.id === matchData.matchedErrorId);
      if (target) onSelectError(target);
    }
  };

  return (
    <div className="tool-card" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Network style={{ width: 14, height: 14, color: 'var(--primary)' }} />
          <div className="section-label" style={{ margin: 0 }}>Signature Matching</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {matchData.matchOccurred ? (
            <CheckCircle2 style={{ width: 14, height: 14, color: 'var(--success)' }} />
          ) : (
            <XCircle style={{ width: 14, height: 14, color: 'var(--text-dim)' }} />
          )}
          <span style={{ fontSize: 11, color: matchData.matchOccurred ? 'var(--text)' : 'var(--text-dim)' }}>
            {matchData.matchOccurred ? 'Match Found' : 'No Match'} ({matchData.prefixThreshold}% req)
          </span>
        </div>
      </div>
      
      <div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: 4, title: matchData.currentSignature }}>
          {formatSignatureTitle(matchData.currentSignature)}
        </div>
      </div>

      <div>
        {!hasCandidates ? (
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic', paddingLeft: 4 }}>No BST candidates found</div>
        ) : (
          <div>
            {renderCandidate('Pred', matchData.predecessor)}
            {renderCandidate('Succ', matchData.successor)}
          </div>
        )}
      </div>

      {matchData.matchOccurred && matchData.matchedErrorId && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
          <button 
            onClick={handleNavigateToMatch}
            className="btn btn-ghost btn-sm" 
            style={{ display: 'flex', gap: 4, height: 24, padding: '0 8px', fontSize: 11 }}
          >
            View Error #{matchData.matchedErrorId}
            <ArrowRight style={{ width: 12, height: 12 }} />
          </button>
        </div>
      )}
    </div>
  );
};
