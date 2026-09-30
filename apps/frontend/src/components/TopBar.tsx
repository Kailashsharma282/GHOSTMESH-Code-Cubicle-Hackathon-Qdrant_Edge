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
  Radio,
  Fingerprint,
  Info,
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

  const navItems = [
    { id: 'radar', label: 'Radar', icon: Radio },
    { id: 'memories', label: 'Memories', icon: Layers, count: stats?.local_memories_total },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'reconciliation', label: 'Reconcile', icon: GitMerge, count: stats?.conflicts_resolved },
    { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
    { id: 'sync', label: 'Queue', icon: Database, count: stats?.pending_sync_total },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'forensics', label: 'Forensics', icon: Fingerprint },
    { id: 'system', label: 'Specs', icon: Info },
  ];

  return (
    <header className="h-14 border-b border-slate-800/90 bg-[#070A12]/95 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between z-50 shrink-0 select-none shadow-md">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.5)] border border-blue-400/40">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-wider text-white">GHOSTMESH</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-cyan-300 font-extrabold uppercase tracking-wider">
                Qdrant Edge
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-medium block leading-tight">
              Code Cubicle 6.0 • Autonomous Fabric
            </span>
          </div>
        </div>
      </div>

      {/* Center: Sleek Segmented Pill Navigation */}
      <nav className="flex items-center gap-1 bg-[#090D18] border border-slate-800/80 p-1 rounded-xl shadow-inner shrink-0">
        {navItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count !== null && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: Quick Scenarios & Status Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Scenario Buttons Group */}
        <div className="flex items-center gap-1 bg-[#090D18] border border-slate-800/80 p-0.5 rounded-lg">
          <button
            onClick={() => onRunScenario('offline')}
            disabled={isScenarioRunning}
            className="px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition disabled:opacity-50"
            title="Sever Device A & test offline local search"
          >
            Offline
          </button>
          <button
            onClick={() => onRunScenario('conflict')}
            disabled={isScenarioRunning}
            className="px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition disabled:opacity-50"
            title="Trigger multi-node conflict & reconcile"
          >
            Reconcile
          </button>
          <button
            onClick={() => onRunScenario('privacy')}
            disabled={isScenarioRunning}
            className="px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition disabled:opacity-50"
            title="Test zero-leak privacy quarantine"
          >
            Privacy
          </button>
        </div>

        {/* Play Demo Button */}
        <button
          onClick={() => onRunScenario('full')}
          disabled={isScenarioRunning}
          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-[0_0_12px_rgba(59,130,246,0.4)] disabled:opacity-50 active:scale-95"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>{isScenarioRunning ? 'Running...' : 'Play Demo'}</span>
        </button>

        {/* Mesh Convergence Status */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#090D18] border border-slate-800/80 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isHealthy ? 'bg-emerald-400 shadow-[0_0_6px_#34D399]' : 'bg-amber-400'
            }`}
          />
          <span className="font-extrabold text-white text-[11px]">
            {stats ? `${stats.mesh_convergence_percentage}%` : '--'}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Converged</span>
        </div>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-lg transition"
          title="Reset system state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Live Indicator */}
        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 px-2 py-1.5 rounded-lg bg-[#090D18] border border-slate-800/80">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              wsConnected ? 'bg-emerald-400 shadow-[0_0_6px_#34D399]' : 'bg-rose-500'
            }`}
          />
          <span>{wsConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
