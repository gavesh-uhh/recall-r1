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
  Database,
  Trash2,
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
    { id: 'explorer', label: 'Error Explorer', icon: FolderSearch, badge: 'AVL Index' },
    { id: 'solutions', label: 'Solution Ranker', icon: Award, badge: 'MaxHeap' },
    { id: 'patterns', label: 'Cross-Project Graph', icon: GitFork, badge: 'Topology' },
    { id: 'sessions', label: 'Debug Sessions', icon: History, badge: 'Journal' },
  ];

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-700 px-5 flex items-center justify-between shadow-xl relative z-40 flex-nowrap shrink-0 overflow-hidden">
      {/* Brand / Logo */}
      <div className="flex items-center space-x-2.5 shrink-0">
        <div className="h-8 w-8 rounded-xl bg-blue-950 border border-blue-600/40 flex items-center justify-center shadow-md shrink-0">
          <Layers className="h-4.5 w-4.5 text-blue-400" />
        </div>
        <div className="shrink-0">
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-sm tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-blue-200">
              Recall
            </h1>
            <span className="text-[9px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-700/60 shadow-sm whitespace-nowrap">
              R1 Engine
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Pages */}
      <nav className="flex items-center space-x-1 bg-slate-950/70 p-1 rounded-xl border border-slate-700 shadow-inner shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30 border border-blue-400/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {isActive && (
                <span className="text-[9px] font-mono uppercase bg-blue-950 text-blue-200 px-1 py-0.5 rounded border border-blue-700/60">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Status & Primary Actions */}
      <div className="flex items-center space-x-2.5 shrink-0">
        {/* Seed & Clear Data Action Buttons */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {onSeedData && (
            <button
              onClick={onSeedData}
              title="Populate database with rich multi-project sample errors, fix strategies & debug logs"
              className="flex items-center space-x-1 text-xs text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-700/60 hover:bg-emerald-900 transition font-medium whitespace-nowrap"
            >
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              <span>Seed DB</span>
            </button>
          )}

          {onClearData && (
            <button
              onClick={onClearData}
              title="Clear all error records, solutions, relations, and debug sessions"
              className="flex items-center space-x-1 text-xs text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-800/80 hover:bg-rose-900 transition font-medium whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              <span>Clear DB</span>
            </button>
          )}
        </div>

        {/* Backend Status Badge */}
        <div className="flex items-center space-x-1.5 bg-slate-950/60 px-2.5 py-1 rounded-xl border border-slate-700/50 text-xs shadow-inner shrink-0">
          <Server className="h-3.5 w-3.5 text-slate-400" />
          <div className="flex items-center space-x-1">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                health.status === 'ok' ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-rose-500'
              }`}
            />
            <span className="font-mono text-[11px] text-slate-300 uppercase whitespace-nowrap">
              {health.status === 'ok' ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {health.indexStale && (
            <button
              onClick={onRebuildIndex}
              disabled={isRebuilding}
              title="In-memory AVL/Graph index is stale. Click to rebuild."
              className="ml-1.5 flex items-center space-x-1 text-[10px] text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded-md border border-amber-800/80 hover:bg-amber-900/80 transition whitespace-nowrap"
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
