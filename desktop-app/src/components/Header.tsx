import React from 'react';
import {
  FolderSearch,
  Award,
  GitFork,
  History,
  Plus,
  PlusCircle,
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

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  health,
  onOpenLogError,
  onRebuildIndex,
  onSeedData,
  onClearData,
  isRebuilding,
}) => {
  const tabs = [
    { id: 'explorer',  label: 'Error Explorer',       icon: FolderSearch, badge: 'AVL' },
    { id: 'solutions', label: 'Solution Ranker',      icon: Award,        badge: 'Heap' },
    { id: 'patterns',  label: 'Pattern Graph',        icon: GitFork,      badge: 'Graph' },
    { id: 'sessions',  label: 'Debug Sessions',       icon: History,      badge: 'Log' },
  ];

  const isOnline = health.status === 'ok';

  return (
    <>
      {/* ── Title Bar ─────────────────────────────────────────────── */}
      <div className="tool-titlebar">
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div className="h-7.5 w-7.5 rounded-lg bg-gradient-to-br from-blue-500 via-blue-600 to-blue-900 flex items-center justify-center border border-blue-400/50 shadow-md shadow-blue-500/20 flex-shrink-0">
            <Layers className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-sm font-extrabold text-white tracking-tight">Recall</span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-700 select-none">
            R1
          </span>
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {onSeedData && (
            <button onClick={onSeedData} title="Seed sample data" className="btn btn-success btn-sm">
              <Database className="h-3 w-3" />
              Seed
            </button>
          )}
          {onClearData && (
            <button onClick={onClearData} title="Clear all data" className="btn btn-danger btn-sm">
              <Trash2 className="h-3 w-3" />
              Clear
            </button>
          )}

          <div className="vert-divider mx-1" style={{ height: '18px' }} />

          {/* Status */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--card)] border border-[var(--border)]">
            <Server className="h-3 w-3 text-[var(--text-dim)]" />
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
            <span className="mono text-[10px] text-[var(--text-muted)] uppercase">
              {isOnline ? 'online' : 'offline'}
            </span>
            {health.indexStale && (
              <button
                onClick={onRebuildIndex}
                disabled={isRebuilding}
                title="Index stale – click to rebuild"
                className="btn btn-warning btn-sm ml-1"
              >
                {isRebuilding
                  ? <RefreshCw className="h-3 w-3 spin" />
                  : <Activity className="h-3 w-3 pulse" />
                }
                Stale
              </button>
            )}
          </div>

          <div className="vert-divider mx-1" style={{ height: '18px' }} />

          {/* Log Error CTA */}
          <button
            onClick={onOpenLogError}
            className="btn btn-success btn-sm"
          >
            <Plus className="h-3 w-3" />
            Log Error
          </button>
        </div>
      </div>

      {/* ── Sidebar nav is rendered inside App layout, but tab data lives here ─ */}
      {/* Sidebar is provided via the `tabs` export below */}
    </>
  );
};

/* ── Sidebar Nav ──────────────────────────────────────────────────── */

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  errorCount: number;
  health: HealthStatus;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const items = [
    { id: 'explorer',  label: 'Error Explorer',  icon: FolderSearch, badge: 'AVL' },
    { id: 'solutions', label: 'Solution Ranker', icon: Award,        badge: 'Heap' },
    { id: 'patterns',  label: 'Pattern Graph',   icon: GitFork,      badge: 'Graph' },
    { id: 'sessions',  label: 'Debug Sessions',  icon: History,      badge: 'Log' },
  ];

  return (
    <div className="tool-sidebar">
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

    </div>
  );
};
