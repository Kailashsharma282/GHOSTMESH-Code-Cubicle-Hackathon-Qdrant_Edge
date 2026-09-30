import React, { useState } from 'react';
import { Layers, Smartphone, Laptop, Camera, Search, Filter, ShieldCheck, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { MemoryRecord } from '../types';

interface MemoriesViewProps {
  memories: MemoryRecord[];
  cloudMemories: any[];
  onSelectMemory: (mem: MemoryRecord) => void;
}

export const MemoriesView: React.FC<MemoriesViewProps> = ({
  memories,
  cloudMemories,
  onSelectMemory,
}) => {
  const [deviceFilter, setDeviceFilter] = useState<string>('ALL');
  const [privacyFilter, setPrivacyFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const filtered = memories.filter((m) => {
    if (deviceFilter !== 'ALL' && m.device_id !== deviceFilter) return false;
    if (privacyFilter !== 'ALL' && m.privacy_tier !== privacyFilter) return false;
    if (
      searchFilter &&
      !m.content.toLowerCase().includes(searchFilter.toLowerCase()) &&
      !m.memory_id.toLowerCase().includes(searchFilter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getDeviceIcon = (deviceId: string) => {
    if (deviceId === 'device-a') return <Smartphone className="w-3.5 h-3.5 text-cyan-400" />;
    if (deviceId === 'device-b') return <Laptop className="w-3.5 h-3.5 text-blue-400" />;
    return <Camera className="w-3.5 h-3.5 text-emerald-400" />;
  };

  const getDeviceLabel = (deviceId: string) => {
    if (deviceId === 'device-a') return 'Pixel 9 Pro';
    if (deviceId === 'device-b') return 'MacBook Pro M3';
    return 'OmniCam 4K';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#05070B] p-4 lg:p-5 gap-3.5 overflow-hidden">
      {/* Header and Filter Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg border border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2 tracking-wide">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
            DISTRIBUTED EVIDENCE MEMORY EXPLORER
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            <span className="text-white font-bold">{memories.length}</span> local vectors across 3 isolated Qdrant Edge shards • <span className="text-blue-400 font-bold">{cloudMemories.length}</span> shared records in Qdrant Server Hub
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search observations..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-[#090D17] border border-slate-800 pl-8 pr-3 py-1.5 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48 text-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#090D17] border border-slate-800 rounded-xl px-2 py-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs font-medium cursor-pointer"
            >
              <option value="ALL" className="bg-[#090D17]">All Shards</option>
              <option value="device-a" className="bg-[#090D17]">Pixel 9 Pro (A)</option>
              <option value="device-b" className="bg-[#090D17]">MacBook Pro (B)</option>
              <option value="device-c" className="bg-[#090D17]">OmniCam 4K (C)</option>
            </select>
          </div>

          <select
            value={privacyFilter}
            onChange={(e) => setPrivacyFilter(e.target.value)}
            className="bg-[#090D17] border border-slate-800 px-3 py-1.5 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 text-xs font-medium cursor-pointer"
          >
            <option value="ALL" className="bg-[#090D17]">All Privacy Tiers</option>
            <option value="LOCAL_ONLY" className="bg-[#090D17]">LOCAL_ONLY (Quarantined)</option>
            <option value="SYNC_ALLOWED" className="bg-[#090D17]">SYNC_ALLOWED</option>
            <option value="PUBLIC_SYNC" className="bg-[#090D17]">PUBLIC_SYNC</option>
          </select>
        </div>
      </div>

      {/* Modern High-Density Table */}
      <div className="flex-1 overflow-y-auto glass-card rounded-2xl border border-slate-800 shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800/90 bg-[#090D17]/90 text-slate-400 font-semibold uppercase tracking-wider text-[11px] sticky top-0 z-10 backdrop-blur-md">
              <th className="py-3 px-4">Memory ID</th>
              <th className="py-3 px-4">Source Shard</th>
              <th className="py-3 px-4">Semantic Observation Content</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">Privacy Policy</th>
              <th className="py-3 px-4">Egress Status</th>
              <th className="py-3 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                  No memories match the active filters.
                </td>
              </tr>
            ) : (
              filtered.map((mem) => {
                const isLocalOnly = mem.privacy_tier === 'LOCAL_ONLY';
                const isSynced = mem.sync_state === 'SYNCED';

                return (
                  <tr
                    key={mem.memory_id}
                    onClick={() => onSelectMemory(mem)}
                    className="hover:bg-blue-600/5 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 group-hover:border-blue-500/40">
                        {mem.memory_id.slice(0, 12)}...
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {getDeviceIcon(mem.device_id)}
                        <span className="text-white font-semibold">{getDeviceLabel(mem.device_id)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <div className="text-slate-100 font-semibold text-xs leading-relaxed">
                        {mem.content}
                      </div>
                      {mem.memory_type && (
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                          {mem.memory_type}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">
                          {(mem.confidence * 100).toFixed(0)}%
                        </span>
                        <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${mem.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isLocalOnly
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            : mem.privacy_tier === 'PUBLIC_SYNC'
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                            : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                        }`}
                      >
                        {isLocalOnly ? (
                          <ShieldAlert className="w-3 h-3 text-rose-400" />
                        ) : (
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        )}
                        {mem.privacy_tier}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isSynced
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/80'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-800/80'
                        }`}
                      >
                        {isSynced ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-400" />
                        )}
                        {mem.sync_state}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-medium text-[11px]">
                      {mem.created_at ? mem.created_at.split('T')[1]?.slice(0, 8) : '--'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemoriesView;
