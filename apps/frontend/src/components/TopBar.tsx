import React from 'react';
import {
  RotateCcw,
  Play,
  Layers,
  Database,
  ShieldCheck,
  Search,
  GitMerge,
  Clock,
  Fingerprint,
  Info,
  Radio,
  WifiOff,
} from 'lucide-react';
import { SystemStats } from '../types';

interface TopBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: SystemStats | null;
  wsConnected: boolean;
  onReset: () => void;
  onRunScenario: (scenario: 'offline' | 'conflict' | 'privacy' | 'full') => void;
  isScenarioRunning: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  stats,
  wsConnected,
  onReset,
  onRunScenario,
  isScenarioRunning,
}) => {
  const isHealthy = stats && stats.conflicts_unresolved === 0;

  return (
    <header className="border-b border-slate-800/90 bg-[#070A12]/95 backdrop-blur-md px-4 py-2 flex flex-col gap-2 z-50 shadow-md shrink-0">
      {/* Upper header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_0_16px_rgba(59,130,246,0.45)] border border-blue-400/50">
              <Radio className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-wider text-white">
                  GHOSTMESH
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-400 uppercase tracking-wide">
                  Code Cubicle 6.0 • Qdrant Edge
                </span>
              </div>
            </div>
          </div>
          <span className="hidden xl:inline text-xs text-slate-400 italic pl-3 border-l border-slate-800 font-medium">
            "Every device remembers alone. Together, they remember everything."
          </span>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mesh status badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-[#0A0F1D] text-xs">
            <span className="text-slate-400 font-medium">MESH CONVERGENCE:</span>
            <span
              className={`flex items-center gap-1.5 font-bold ${
                isHealthy ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isHealthy ? 'bg-emerald-400 shadow-[0_0_8px_#34D399]' : 'bg-amber-400'
                }`}
              />
              {stats ? `${stats.mesh_convergence_percentage}% CONVERGED` : 'INITIALIZING'}
            </span>
            {stats && stats.conflicts_unresolved > 0 && (
              <span className="text-rose-400 font-medium text-[11px]">
                ({stats.conflicts_unresolved} unresolved)
              </span>
            )}
          </div>

          {/* Scenario quick triggers */}
          <div className="flex items-center gap-1.5 bg-[#0A0F1D] border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => onRunScenario('offline')}
              disabled={isScenarioRunning}
              className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition font-medium flex items-center gap-1 disabled:opacity-50"
              title="Scenario 1: Sever Device A link & verify offline edge vector search"
            >
              <WifiOff className="w-3 h-3 text-rose-400" />
              1. Offline
            </button>
            <button
              onClick={() => onRunScenario('conflict')}
              disabled={isScenarioRunning}
              className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition font-medium flex items-center gap-1 disabled:opacity-50"
              title="Scenario 2: Trigger multi-device charger memory conflict & reconcile"
            >
              <GitMerge className="w-3 h-3 text-cyan-400" />
              2. Reconcile
            </button>
            <button
              onClick={() => onRunScenario('privacy')}
              disabled={isScenarioRunning}
              className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition font-medium flex items-center gap-1 disabled:opacity-50"
              title="Scenario 3: Verify local-only zero-leak privacy quarantine block"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              3. Privacy
            </button>
            <button
              onClick={() => onRunScenario('full')}
              disabled={isScenarioRunning}
              className="px-3 py-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.35)] disabled:opacity-50 active:scale-95"
              title="Run 90-Second Guided Hackathon Demo Sequence"
            >
              <Play className="w-3 h-3 fill-current" />
              {isScenarioRunning ? 'RUNNING DEMO...' : 'PLAY 90s DEMO'}
            </button>
          </div>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl transition"
            title="Reset system state to clean baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* WebSocket live status indicator */}
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-[#0A0F1D] border border-slate-800">
            <span
              className={`w-2 h-2 rounded-full ${
                wsConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]' : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-400 text-[11px] font-semibold">
              {wsConnected ? 'LIVE FEED' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation tabs row */}
      <nav className="flex items-center gap-1 overflow-x-auto text-xs border-t border-slate-800/80 pt-1.5 pr-1">
        {[
          { id: 'radar', label: 'RADAR HUD', icon: Radio, count: null },
          { id: 'memories', label: 'MEMORIES', icon: Layers, count: stats?.local_memories_total },
          { id: 'search', label: 'VECTOR SEARCH', icon: Search, count: null },
          { id: 'reconciliation', label: 'RECONCILIATION', icon: GitMerge, count: stats?.conflicts_resolved },
          { id: 'privacy', label: 'PRIVACY GUARD', icon: ShieldCheck, count: null },
          { id: 'sync', label: 'SYNC QUEUE', icon: Database, count: stats?.pending_sync_total },
          { id: 'timeline', label: 'TIMELINE DAG', icon: Clock, count: null },
          { id: 'forensics', label: 'FORENSICS', icon: Fingerprint, count: null },
          { id: 'system', label: 'SYSTEM INFO', icon: Info, count: null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all whitespace-nowrap text-[11px] ${
                isActive
                  ? 'bg-blue-600/25 text-blue-400 border border-blue-500/50 font-semibold shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent font-medium'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== null && tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-blue-500/30 text-blue-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};

export default TopBar;
