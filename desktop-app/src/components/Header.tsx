import React from 'react';
import {
  FolderSearch,
  Award,
  GitFork,
  History,
  PlusCircle,
  Activity,
  RefreshCw,
  Server,
  Layers,
} from 'lucide-react';
import { HealthStatus } from '../types/api';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: HealthStatus;
  onOpenLogError: () => void;
  onRebuildIndex: () => void;
  isRebuilding: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  health,
  onOpenLogError,
  onRebuildIndex,
  isRebuilding,
}) => {
  const tabs = [
    { id: 'explorer', label: 'Error Explorer', icon: FolderSearch, badge: 'AVL Index' },
    { id: 'solutions', label: 'Solution Ranker', icon: Award, badge: 'MaxHeap' },
    { id: 'patterns', label: 'Cross-Project Graph', icon: GitFork, badge: 'Topology' },
    { id: 'sessions', label: 'Debug Sessions', icon: History, badge: 'Journal' },
  ];

  return (
    <header className="bg-black border-b border-blue-950 px-6 py-3 flex items-center justify-between shadow-lg">
      {/* Brand / Logo */}
      <div className="flex items-center space-x-3">
        <div className="h-9 w-9 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center shadow-inner">
          <Layers className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-base tracking-tight text-white font-sans">Recall</h1>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900">
              R1 Engine
            </span>
          </div>
          <p className="text-xs text-blue-300/60">Error Memory Hub & Solution Index</p>
        </div>
      </div>

      {/* Navigation Pages */}
      <nav className="flex items-center space-x-1.5 bg-dark-navy p-1 rounded-xl border border-blue-950">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-blue-950/40'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {isActive && (
                <span className="text-[9px] font-mono uppercase bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Status & Primary Actions */}
      <div className="flex items-center space-x-3">
        {/* Backend Status Badge */}
        <div className="flex items-center space-x-2 bg-dark-navy px-3 py-1.5 rounded-lg border border-blue-950 text-xs">
          <Server className="h-3.5 w-3.5 text-slate-400" />
          <div className="flex items-center space-x-1.5">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                health.status === 'ok' ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span className="font-mono text-[11px] text-slate-300">
              {health.status === 'ok' ? 'API Online' : 'API Offline'}
            </span>
          </div>

          {health.indexStale && (
            <button
              onClick={onRebuildIndex}
              disabled={isRebuilding}
              title="In-memory AVL/Graph index is stale. Click to rebuild."
              className="ml-2 flex items-center space-x-1 text-[11px] text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800 hover:bg-amber-900"
            >
              <Activity className="h-3 w-3 animate-pulse" />
              <span>Stale Index</span>
              <RefreshCw className={`h-3 w-3 ${isRebuilding ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Log Error Primary Button */}
        <button
          onClick={onOpenLogError}
          className="flex items-center space-x-2 pro-button-primary text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-md transition"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Log Error</span>
        </button>
      </div>
    </header>
  );
};
