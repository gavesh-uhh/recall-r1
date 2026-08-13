import React from 'react';
import {
  FolderSearch,
  Award,
  GitFork,
  Plus,
  RefreshCw,
  Server,
  Database,
  Trash2,
  Activity,
  Boxes,
} from 'lucide-react';
import logoImage from '../assets/logo1.png';
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
  return null;
};

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
    { id: 'projects',  label: 'Projects & Stack',     icon: Boxes },
    { id: 'explorer',  label: 'Error Explorer',       icon: FolderSearch },
    { id: 'solutions', label: 'Solution Ranker',      icon: Award },
    { id: 'patterns',  label: 'Pattern Graph',        icon: GitFork },
  ];

  const isOnline = health.status === 'ok';

  return (
    <div className="tool-sidebar">
      <div style={{ padding: '18px 18px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="h-14 w-14 flex-shrink-0 flex items-center justify-center">
          <img src={logoImage} alt="Recall logo" className="h-full w-full" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span className="text-lg font-extrabold text-white tracking-tight">Recall</span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#3b2a00] text-[#fdad00] border border-[#fdad00] select-none">
              R1
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-dim)] font-mono">Solution Engine</span>
        </div>
      </div>

      <div style={{ padding: '16px 16px 8px' }}>
        <button
          onClick={onOpenLogError}
          className="btn btn-success"
          style={{ width: '100%', justifyContent: 'center', padding: '10px 12px' }}
        >
          <Plus className="h-4 w-4" />
          <span>Log Error</span>
        </button>
      </div>

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
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </div>
        );
      })}

      {(onSeedData || onClearData) && (
        <>
          <div className="sidebar-section-label" style={{ marginTop: 12 }}>Data Tools</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 4px' }}>
            {onSeedData && (
              <button onClick={onSeedData} title="Seed sample data" className="sidebar-item" style={{ width: 'calc(100% - 8px)', margin: '0 4px' }}>
                <Database className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span className="truncate">Seed Sample Data</span>
              </button>
            )}
            {onClearData && (
              <button onClick={onClearData} title="Clear all data" className="sidebar-item" style={{ width: 'calc(100% - 8px)', margin: '0 4px' }}>
                <Trash2 className="h-4 w-4 text-rose-400 flex-shrink-0" />
                <span className="truncate">Clear Database</span>
              </button>
            )}
          </div>
        </>
      )}

      <div className="sidebar-footer" style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server className="h-3.5 w-3.5 text-[var(--text-dim)]" />
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
            <span className="mono text-[11px] text-[var(--text-muted)] uppercase">
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
                ? <RefreshCw className="h-3.5 w-3.5 spin" />
                : <Activity className="h-3.5 w-3.5 pulse" />
              }
              Stale
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
