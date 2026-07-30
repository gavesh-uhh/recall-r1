import React from 'react';
import {
  FolderSearch,
  Award,
  GitFork,
  History,
  Plus,
  RefreshCw,
  Server,
  Layers,
  Database,
  Trash2,
  Activity,
} from 'lucide-react';
import { HealthStatus } from '../types/api';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: HealthStatus;
  onOpenLogError: () => void;
  onRebuildIndex: () => void;
  onSeedData?: () => void;
  onClearData?: () => void;
  isRebuilding: boolean;
}

export const Header: React.FC<HeaderProps> = () => {
  return (
    <div className="tool-titlebar" />
  );
};

/* ── Sidebar Nav ──────────────────────────────────────────────────── */

export interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  errorCount?: number;
  health: HealthStatus;
  onOpenLogError: () => void;
  onRebuildIndex: () => void;
  onSeedData?: () => void;
  onClearData?: () => void;
  isRebuilding: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  health,
  onOpenLogError,
  onRebuildIndex,
  onSeedData,
  onClearData,
  isRebuilding,
}) => {
  const items = [
    { id: 'explorer',  label: 'Error Explorer',  icon: FolderSearch, badge: 'AVL' },
    { id: 'solutions', label: 'Solution Ranker', icon: Award,        badge: 'Heap' },
    { id: 'patterns',  label: 'Pattern Graph',   icon: GitFork,      badge: 'Graph' },
    { id: 'sessions',  label: 'Debug Sessions',  icon: History,      badge: 'Log' },
  ];

  const isOnline = health.status === 'ok';

  return (
    <div className="tool-sidebar">
      {/* Prominent Sidebar Brand Header */}
      <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-900 flex items-center justify-center border border-blue-400/50 shadow-lg shadow-blue-500/25 flex-shrink-0">
          <Layers className="h-5 w-5 text-white" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="text-base font-extrabold text-white tracking-tight">Recall</span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 select-none">
              R1
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-dim)] font-mono">Solution Engine</span>
        </div>
      </div>

      {/* Primary Log Error Action */}
      <div style={{ padding: '12px 12px 4px' }}>
        <button
          onClick={onOpenLogError}
          className="btn btn-success"
          style={{ width: '100%', justifyContent: 'center', padding: '7px 12px' }}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Log Error</span>
        </button>
      </div>

      {/* Navigation Views */}
      <div className="sidebar-section-label">Views</div>

      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <div
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
            <span className={`item-badge ${isActive ? 'active' : ''}`}>{item.badge}</span>
          </div>
        );
      })}

      {/* Data Tools */}
      {(onSeedData || onClearData) && (
        <>
          <div className="sidebar-section-label" style={{ marginTop: 12 }}>Data Tools</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 4px' }}>
            {onSeedData && (
              <button onClick={onSeedData} title="Seed sample data" className="sidebar-item" style={{ width: 'calc(100% - 8px)', margin: '0 4px' }}>
                <Database className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">Seed Sample Data</span>
              </button>
            )}
            {onClearData && (
              <button onClick={onClearData} title="Clear all data" className="sidebar-item" style={{ width: 'calc(100% - 8px)', margin: '0 4px' }}>
                <Trash2 className="h-3.5 w-3.5 text-rose-400 flex-shrink-0" />
                <span className="truncate">Clear Database</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* Sidebar Footer Status */}
      <div className="sidebar-footer" style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Server className="h-3 w-3 text-[var(--text-dim)]" />
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
            <span className="mono text-[10px] text-[var(--text-muted)] uppercase">
              {isOnline ? 'online' : 'offline'}
            </span>
          </div>
          {health.indexStale && (
            <button
              onClick={onRebuildIndex}
              disabled={isRebuilding}
              title="Index stale – click to rebuild"
              className="btn btn-warning btn-sm"
            >
              {isRebuilding
                ? <RefreshCw className="h-3 w-3 spin" />
                : <Activity className="h-3 w-3 pulse" />
              }
              Stale
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
