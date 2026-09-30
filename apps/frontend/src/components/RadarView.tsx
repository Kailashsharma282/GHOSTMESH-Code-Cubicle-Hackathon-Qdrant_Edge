import React, { useState } from 'react';
import {
  Smartphone,
  Laptop,
  Camera,
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  PlusCircle,
  HardDrive,
  GitMerge,
  Layers,
  Activity,
  Radio,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { DeviceState, LiveEvent, SystemStats } from '../types';

interface RadarViewProps {
  devices: DeviceState[];
  events: LiveEvent[];
  stats: SystemStats | null;
  onToggleConnect: (deviceId: string, currentStatus: string) => void;
  onTriggerSync: (deviceId: string) => void;
  onOpenDeviceModal: (device: DeviceState) => void;
  onOpenNewMemoryModal: (deviceId: string) => void;
}

export const RadarView: React.FC<RadarViewProps> = ({
  devices,
  events,
  stats,
  onToggleConnect,
  onTriggerSync,
  onOpenDeviceModal,
  onOpenNewMemoryModal,
}) => {
  const [hoveredMemory, setHoveredMemory] = useState<string | null>(null);

  const devA = devices.find((d) => d.device_id === 'device-a');
  const devB = devices.find((d) => d.device_id === 'device-b');
  const devC = devices.find((d) => d.device_id === 'device-c');

  const isOnlineA = devA?.status === 'ONLINE';
  const isOnlineB = devB?.status === 'ONLINE';
  const isOnlineC = devC?.status === 'ONLINE';

  // Real semantic memories mapped to vector coordinates
  const floatingMemories = [
    {
      id: 'mem-1',
      label: 'USB-C charger on desk',
      device: 'device-a',
      tier: 'SYNC_ALLOWED',
      x: 34,
      y: 44,
      score: 0.94,
      color: 'cyan',
    },
    {
      id: 'mem-2',
      label: 'Lab master password',
      device: 'device-a',
      tier: 'LOCAL_ONLY',
      x: 28,
      y: 68,
      score: 0.99,
      color: 'rose',
      quarantined: true,
    },
    {
      id: 'mem-3',
      label: 'Black 65W GaN charger',
      device: 'device-b',
      tier: 'SYNC_ALLOWED',
      x: 66,
      y: 32,
      score: 0.91,
      color: 'cyan',
    },
    {
      id: 'mem-4',
      label: 'Charger near MacBook',
      device: 'device-c',
      tier: 'SYNC_ALLOWED',
      x: 65,
      y: 68,
      score: 0.89,
      color: 'cyan',
    },
    {
      id: 'mem-5',
      label: 'Reconciled: Desk Multi-Port Charger',
      device: 'CORE',
      tier: 'RECONCILED_CLUSTER',
      x: 50,
      y: 35,
      score: 0.98,
      color: 'purple',
      cluster: true,
    },
    {
      id: 'mem-6',
      label: 'Ambient lab temp: 21.5°C',
      device: 'device-b',
      tier: 'PUBLIC_SYNC',
      x: 58,
      y: 46,
      score: 0.96,
      color: 'emerald',
    },
    {
      id: 'mem-7',
      label: 'Field sketches: mesh topology',
      device: 'device-a',
      tier: 'SYNC_ALLOWED',
      x: 32,
      y: 58,
      score: 0.87,
      color: 'amber',
    },
    {
      id: 'mem-8',
      label: 'Security camera motion: Hallway',
      device: 'device-c',
      tier: 'SYNC_ALLOWED',
      x: 72,
      y: 84,
      score: 0.85,
      color: 'amber',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#05070B] p-4 lg:p-5 gap-4 overflow-hidden">
      {/* Upper KPI Metric Cards with Glowing Top Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Edge Memories */}
        <div className="glass-card glass-card-hover rounded-xl p-4 flex flex-col justify-between relative overflow-hidden shadow-lg border border-slate-800/80 border-t-2 border-t-cyan-400">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
              Edge Memories
            </span>
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.25)]">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
              {stats ? stats.local_memories_total : '--'}
              <span className="text-xs text-cyan-400 font-semibold uppercase">vectors</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE]" />
              Across 3 isolated Qdrant Edge Shards
            </div>
          </div>
        </div>

        {/* Card 2: Cloud Memories */}
        <div className="glass-card glass-card-hover rounded-xl p-4 flex flex-col justify-between relative overflow-hidden shadow-lg border border-slate-800/80 border-t-2 border-t-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
              Cloud Memories
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.25)]">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-3xl font-extrabold text-blue-400 tracking-tight flex items-baseline gap-2">
              {stats ? stats.cloud_memories_total : '--'}
              <span className="text-xs text-blue-400 font-semibold uppercase">shared</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60A5FA]" />
              Qdrant Server :6333 collection
            </div>
          </div>
        </div>

        {/* Card 3: Pending Egress Queue */}
        <div className="glass-card glass-card-hover rounded-xl p-4 flex flex-col justify-between relative overflow-hidden shadow-lg border border-slate-800/80 border-t-2 border-t-amber-400">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
              Pending Egress Queue
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-3xl font-extrabold text-amber-400 tracking-tight flex items-baseline gap-2">
              {stats ? stats.pending_sync_total : '--'}
              <span className="text-xs text-amber-400 font-semibold uppercase">queued</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#FBBF24]" />
              Queued in local SQLite tables
            </div>
          </div>
        </div>

        {/* Card 4: Reconciled Conflicts */}
        <div className="glass-card glass-card-hover rounded-xl p-4 flex flex-col justify-between relative overflow-hidden shadow-lg border border-slate-800/80 border-t-2 border-t-emerald-400">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
              Mesh Convergence
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <GitMerge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight flex items-baseline gap-2">
              {stats ? `${stats.conflicts_resolved} Resolved` : '--'}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
              {stats ? `${stats.conflicts_unresolved} unresolved candidates` : '0 unresolved candidates'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Command Center (Radar 8 cols | Telemetry & Live Stream 4 cols) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden min-h-0">
        {/* Left: The Semantic Memory Radar & Vector Fabric (8 cols) */}
        <div className="lg:col-span-8 relative rounded-2xl border border-slate-800/80 bg-[#040711] instrument-grid flex items-center justify-center overflow-hidden shadow-2xl">
          {/* Radar Scanner Sweep Effect */}
          <div className="absolute w-[700px] h-[700px] rounded-full radar-sweep pointer-events-none opacity-40 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(59,130,246,0.25)_360deg)]" />

          {/* Tactical Concentric Radar Rings */}
          <div className="absolute w-[220px] h-[220px] rounded-full border border-blue-500/25 pointer-events-none" />
          <div className="absolute w-[440px] h-[440px] rounded-full border border-blue-500/20 pointer-events-none" />
          <div className="absolute w-[660px] h-[660px] rounded-full border border-blue-500/15 pointer-events-none" />
          <div className="absolute w-[880px] h-[880px] rounded-full border border-blue-500/10 pointer-events-none" />

          {/* Coordinate Crosshairs with Degree Markings */}
          <div className="absolute w-full h-[1px] bg-slate-800/50 pointer-events-none" />
          <div className="absolute h-full w-[1px] bg-slate-800/50 pointer-events-none" />
          <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-semibold tracking-wider">
            000° NORTH
          </span>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-semibold tracking-wider">
            180° SOUTH
          </span>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-semibold tracking-wider">
            270° WEST
          </span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-semibold tracking-wider">
            090° EAST
          </span>

          {/* Scaled SVG Real-Time Mesh Connection Pipelines */}
          <svg
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          >
            <defs>
              <linearGradient id="pipelineOnline" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="pipelinePeer" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818CF8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#C084FC" stopOpacity="0.4" />
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Peer-to-Peer Inter-Device Constellation Mesh (True Decentralized Overlay) */}
            <path
              d="M 200 500 Q 480 200 800 240"
              stroke="url(#pipelinePeer)"
              strokeWidth="1.5"
              strokeDasharray="4,6"
              fill="none"
            />
            <path
              d="M 200 500 Q 480 800 800 760"
              stroke="url(#pipelinePeer)"
              strokeWidth="1.5"
              strokeDasharray="4,6"
              fill="none"
            />
            <path
              d="M 800 240 L 800 760"
              stroke="url(#pipelinePeer)"
              strokeWidth="1.5"
              strokeDasharray="4,6"
              fill="none"
            />

            {/* Pipeline: Device A to Core (200, 500) -> (500, 500) */}
            <path
              id="pathA"
              d="M 200 500 L 500 500"
              stroke={isOnlineA ? 'url(#pipelineOnline)' : '#EF4444'}
              strokeWidth={isOnlineA ? '3' : '2'}
              strokeDasharray={isOnlineA ? 'none' : '6,6'}
              fill="none"
              filter="url(#neonGlow)"
            />
            {isOnlineA ? (
              <>
                <circle r="5" fill="#22D3EE" filter="url(#neonGlow)">
                  <animateMotion dur="2.2s" repeatCount="indefinite" path="M 200 500 L 500 500" />
                </circle>
                <circle r="4" fill="#34D399" filter="url(#neonGlow)">
                  <animateMotion dur="2.2s" begin="1.1s" repeatCount="indefinite" path="M 200 500 L 500 500" />
                </circle>
              </>
            ) : (
              <text x="220" y="535" fill="#F87171" fontSize="11" fontWeight="700" letterSpacing="0.06em">
                ⚡ OFFLINE PARTITION — SYNC FROZEN
              </text>
            )}

            {/* Pipeline: Device B to Core (800, 240) -> (500, 500) */}
            <path
              id="pathB"
              d="M 800 240 Q 640 340 500 500"
              stroke={isOnlineB ? 'url(#pipelineOnline)' : '#EF4444'}
              strokeWidth="3"
              strokeDasharray={isOnlineB ? 'none' : '6,6'}
              fill="none"
              filter="url(#neonGlow)"
            />
            {isOnlineB && (
              <circle r="5" fill="#60A5FA" filter="url(#neonGlow)">
                <animateMotion dur="2.8s" repeatCount="indefinite" path="M 800 240 Q 640 340 500 500" />
              </circle>
            )}

            {/* Pipeline: Device C to Core (800, 760) -> (500, 500) */}
            <path
              id="pathC"
              d="M 800 760 Q 640 660 500 500"
              stroke={isOnlineC ? 'url(#pipelineOnline)' : '#EF4444'}
              strokeWidth="3"
              strokeDasharray={isOnlineC ? 'none' : '6,6'}
              fill="none"
              filter="url(#neonGlow)"
            />
            {isOnlineC && (
              <circle r="5" fill="#FBBF24" filter="url(#neonGlow)">
                <animateMotion dur="2.6s" repeatCount="indefinite" path="M 800 760 Q 640 660 500 500" />
              </circle>
            )}
          </svg>

          {/* Floating Semantic Memory Vector Points */}
          {floatingMemories.map((m) => {
            const isHovered = hoveredMemory === m.id;

            return (
              <div
                key={m.id}
                onMouseEnter={() => setHoveredMemory(m.id)}
                onMouseLeave={() => setHoveredMemory(null)}
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              >
                {/* Glowing Marker */}
                <div className="relative flex items-center justify-center">
                  {m.quarantined ? (
                    <div className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center shadow-[0_0_15px_#F43F5E] animate-pulse">
                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                    </div>
                  ) : m.cluster ? (
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center shadow-[0_0_15px_#A855F7] animate-bounce">
                      <Sparkles className="w-3 h-3 text-purple-300" />
                    </div>
                  ) : (
                    <div
                      className={`w-3.5 h-3.5 rounded-full transition-all flex items-center justify-center ${
                        m.color === 'emerald'
                          ? 'bg-emerald-400 shadow-[0_0_10px_#34D399]'
                          : m.color === 'amber'
                          ? 'bg-amber-400 shadow-[0_0_10px_#FBBF24]'
                          : 'bg-cyan-400 shadow-[0_0_10px_#22D3EE]'
                      } ${isHovered ? 'scale-150' : 'hover:scale-125'}`}
                    />
                  )}

                  {/* Micro Pill Tag */}
                  <span className="hidden md:inline-block absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700/60 text-[9px] font-semibold text-slate-300 backdrop-blur-sm pointer-events-none group-hover:border-blue-400">
                    {m.label}
                  </span>
                </div>

                {/* Rich Hover Tooltip Card */}
                <div
                  className={`absolute left-6 top-1/2 -translate-y-1/2 z-30 transition-all pointer-events-none ${
                    isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}
                >
                  <div className="bg-[#0D1322] border border-slate-700 rounded-xl p-3 shadow-2xl w-60 text-xs backdrop-blur-md">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                      <span className="font-bold text-cyan-400">{m.device.toUpperCase()}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                          m.quarantined
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : m.cluster
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {m.tier}
                      </span>
                    </div>
                    <p className="text-white font-semibold">"{m.label}"</p>
                    <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Vector Match Score:</span>
                      <span className="font-bold text-emerald-400">{(m.score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Center Hub: GHOSTMESH CORE (Qdrant Cloud Hub) */}
          <div className="z-20 flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              {/* Outer Pulsing Glow Aura */}
              <div className="absolute w-28 h-28 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
              {/* Server Orb */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0F1B36] to-[#0A1122] border-2 border-blue-400/80 shadow-[0_0_40px_rgba(59,130,246,0.5)] flex flex-col items-center justify-center relative group">
                <Server className="w-8 h-8 text-blue-400 mb-0.5 group-hover:scale-110 transition-transform" />
                <div className="w-3 h-3 rounded-full bg-blue-400 animate-ping absolute top-2 right-2" />
              </div>
            </div>
            <div className="mt-2.5 text-center">
              <span className="text-xs font-extrabold text-white tracking-wider block">
                GHOSTMESH CORE
              </span>
              <span className="text-[11px] font-bold text-blue-400 block font-mono">
                Qdrant Server :6333
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                Global Convergence Tier
              </span>
            </div>
          </div>

          {/* Device A: Pixel 9 Pro (Left Orbit: 20%, 50%) */}
          {devA && (
            <div className="absolute left-3 lg:left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
              <DeviceNodeCard
                device={devA}
                icon={Smartphone}
                onToggleConnect={onToggleConnect}
                onTriggerSync={onTriggerSync}
                onOpenDetails={onOpenDeviceModal}
                onOpenNewMemory={onOpenNewMemoryModal}
              />
            </div>
          )}

          {/* Device B: MacBook Pro M3 (Top Right Orbit: 80%, 24%) */}
          {devB && (
            <div className="absolute right-3 lg:right-6 top-6 z-20 flex flex-col items-center">
              <DeviceNodeCard
                device={devB}
                icon={Laptop}
                onToggleConnect={onToggleConnect}
                onTriggerSync={onTriggerSync}
                onOpenDetails={onOpenDeviceModal}
                onOpenNewMemory={onOpenNewMemoryModal}
              />
            </div>
          )}

          {/* Device C: OmniCam 4K (Bottom Right Orbit: 80%, 76%) */}
          {devC && (
            <div className="absolute right-3 lg:right-6 bottom-6 z-20 flex flex-col items-center">
              <DeviceNodeCard
                device={devC}
                icon={Camera}
                onToggleConnect={onToggleConnect}
                onTriggerSync={onTriggerSync}
                onOpenDetails={onOpenDeviceModal}
                onOpenNewMemory={onOpenNewMemoryModal}
              />
            </div>
          )}
        </div>

        {/* Right: Mission Telemetry & Live Event Console (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
          {/* Node Fleet Health Monitor */}
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-3 shadow-xl border border-slate-800/80">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wider uppercase">
                <Radio className="w-4 h-4 text-cyan-400" />
                Fleet Telemetry & Status
              </div>
              <span className="text-[11px] font-semibold text-slate-400">3 Edge Shards</span>
            </div>

            <div className="space-y-2">
              {devices.map((d) => {
                const isOnline = d.status === 'ONLINE';
                return (
                  <div
                    key={d.device_id}
                    className="p-3 rounded-xl bg-[#090D17] border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          isOnline
                            ? 'bg-emerald-400 shadow-[0_0_8px_#34D399]'
                            : 'bg-rose-500 shadow-[0_0_8px_#F43F5E] animate-pulse'
                        }`}
                      />
                      <div>
                        <div className="font-bold text-white text-xs">{d.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{d.device_id}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-white">{d.memory_count} pts</div>
                      <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        {d.edge_search_latency_ms.toFixed(1)} ms
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Live Event Console */}
          <div className="glass-card rounded-2xl p-4 flex-1 flex flex-col gap-2.5 shadow-xl border border-slate-800/80 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wider uppercase">
                <Activity className="w-4 h-4 text-blue-400" />
                Mesh Event Stream
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 text-[10px] font-bold border border-emerald-700/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE BUS
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {events.slice(-10).reverse().map((evt, idx) => {
                const isPrivacy = evt.event_type.includes('privacy');
                const isConflict = evt.event_type.includes('conflict') || evt.event_type.includes('reconciliation');
                const isSync = evt.event_type.includes('sync');
                const isDisc = evt.event_type.includes('disconnect') || evt.event_type.includes('offline');

                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#090D17] border border-slate-800/90 text-xs flex flex-col gap-1 transition-colors hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-cyan-400 font-mono">{evt.device_id || 'CORE'}</span>
                      <span className="font-mono text-slate-500">
                        {evt.timestamp.split('T')[1]?.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          isPrivacy
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : isConflict
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : isSync
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : isDisc
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {evt.event_type.split('.')[0]}
                      </span>
                      <span className="font-bold text-white text-[11px]">{evt.event_type}</span>
                    </div>
                    {evt.details?.canonical_content && (
                      <p className="text-[11px] text-emerald-300 font-medium line-clamp-1">
                        → Merged: "{evt.details.canonical_content}"
                      </p>
                    )}
                    {evt.details?.status && (
                      <span className="text-[10px] text-amber-400 font-medium">
                        Status: {evt.details.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DeviceNodeCardProps {
  device: DeviceState;
  icon: React.ElementType;
  onToggleConnect: (deviceId: string, currentStatus: string) => void;
  onTriggerSync: (deviceId: string) => void;
  onOpenDetails: (device: DeviceState) => void;
  onOpenNewMemory: (deviceId: string) => void;
}

const DeviceNodeCard: React.FC<DeviceNodeCardProps> = ({
  device,
  icon: Icon,
  onToggleConnect,
  onTriggerSync,
  onOpenDetails,
  onOpenNewMemory,
}) => {
  const isOnline = device.status === 'ONLINE';

  return (
    <div
      className={`w-64 rounded-2xl p-3.5 glass-card glass-card-hover transition-all shadow-2xl ${
        isOnline
          ? 'border-slate-800 hover:border-blue-500/60'
          : 'border-rose-800/80 bg-rose-950/30 shadow-[0_0_25px_rgba(244,63,94,0.2)]'
      }`}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-xl ${
              isOnline
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                : 'bg-rose-900/30 text-rose-400 border border-rose-500/30'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">{device.name}</div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">{device.device_id}</div>
          </div>
        </div>

        {/* Online / Offline status toggle */}
        <button
          onClick={() => onToggleConnect(device.device_id, device.status)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition ${
            isOnline
              ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/50 hover:bg-rose-950 hover:text-rose-400 hover:border-rose-500'
              : 'bg-rose-950 text-rose-300 border border-rose-500 hover:bg-emerald-950 hover:text-emerald-400 hover:border-emerald-500 animate-pulse'
          }`}
          title={isOnline ? 'Sever Network Link (Test Offline Mode)' : 'Restore Network Link (Test Re-sync)'}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3" />
              ONLINE
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              OFFLINE
            </>
          )}
        </button>
      </div>

      {/* Shard Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="bg-[#090D17] p-2 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[9px] font-semibold uppercase">Shard Data</span>
          <span className="text-white font-bold text-xs">{device.memory_count} memories</span>
        </div>
        <div className="bg-[#090D17] p-2 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[9px] font-semibold uppercase">Pending Sync</span>
          <span
            className={
              device.pending_sync_count > 0 ? 'text-amber-400 font-bold text-xs' : 'text-slate-300 font-medium text-xs'
            }
          >
            {device.pending_sync_count} queued
          </span>
        </div>
        <div className="bg-[#090D17] p-2 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[9px] font-semibold uppercase">Search Speed</span>
          <span className="text-emerald-400 font-bold text-xs">
            {device.edge_search_latency_ms.toFixed(1)} ms
          </span>
        </div>
        <div className="bg-[#090D17] p-2 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[9px] font-semibold uppercase">Quarantined</span>
          <span className="text-slate-300 font-medium text-xs">{device.local_only_count} local-only</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 text-xs">
        <button
          onClick={() => onOpenNewMemory(device.device_id)}
          className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center justify-center gap-1 font-semibold transition"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Ingest
        </button>
        <button
          onClick={() => onTriggerSync(device.device_id)}
          disabled={!isOnline}
          className="py-1.5 px-2.5 rounded-lg bg-[#141A28] hover:bg-[#1E2538] text-slate-300 border border-slate-700/60 flex items-center justify-center gap-1 font-medium transition disabled:opacity-40"
          title={isOnline ? 'Manually drain sync queue' : 'Cannot sync while node is offline'}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync
        </button>
        <button
          onClick={() => onOpenDetails(device)}
          className="py-1.5 px-2.5 rounded-lg bg-[#141A28] hover:bg-[#1E2538] text-slate-300 border border-slate-700/60 font-medium transition"
          title="Inspect device shard & metadata"
        >
          Inspect
        </button>
      </div>
    </div>
  );
};

export default RadarView;
