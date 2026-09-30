import React, { useState } from 'react';
import { Layers, Smartphone, Laptop, Camera } from 'lucide-react';
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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080A0D] p-4 gap-4 overflow-hidden">
      {/* Header and Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0C0F15] border border-[#1E2533] p-3 rounded">
        <div>
          <h2 className="font-mono text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            EVIDENCE MEMORY EXPLORER
          </h2>
          <p className="font-mono text-xs text-slate-500">
            {memories.length} local memories indexed across 3 Qdrant Edge shards | {cloudMemories.length} records in Qdrant Server
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <input
            type="text"
            placeholder="Filter memories..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="bg-[#141924] border border-[#1E2533] px-2.5 py-1 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44"
          />

          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            className="bg-[#141924] border border-[#1E2533] px-2 py-1 rounded text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Nodes</option>
            <option value="device-a">Device A (Phone)</option>
            <option value="device-b">Device B (Laptop)</option>
            <option value="device-c">Device C (Camera)</option>
          </select>

          <select
            value={privacyFilter}
            onChange={(e) => setPrivacyFilter(e.target.value)}
            className="bg-[#141924] border border-[#1E2533] px-2 py-1 rounded text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Privacy Tiers</option>
            <option value="LOCAL_ONLY">LOCAL_ONLY (Quarantined)</option>
            <option value="SYNC_ALLOWED">SYNC_ALLOWED</option>
            <option value="PUBLIC_SYNC">PUBLIC_SYNC</option>
          </select>
        </div>
      </div>

      {/* Memory Table / Cards */}
      <div className="flex-1 overflow-y-auto border border-[#1E2533] rounded bg-[#0A0D13]">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1E2533] bg-[#0E121A] text-slate-400 sticky top-0 z-10">
              <th className="py-2.5 px-3">MEMORY ID</th>
              <th className="py-2.5 px-3">NODE / DEVICE</th>
              <th className="py-2.5 px-3">SEMANTIC OBSERVATION CONTENT</th>
              <th className="py-2.5 px-3">CONFIDENCE</th>
              <th className="py-2.5 px-3">PRIVACY TIER</th>
              <th className="py-2.5 px-3">SYNC STATUS</th>
              <th className="py-2.5 px-3">TIMESTAMP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#161B26]">
            {filtered.map((mem) => {
              const isLocalOnly = mem.privacy_tier === 'LOCAL_ONLY';
              const isSynced = mem.sync_state === 'SYNCED';

              return (
                <tr
                  key={mem.memory_id}
                  onClick={() => onSelectMemory(mem)}
                  className="hover:bg-[#121622] cursor-pointer transition"
                >
                  <td className="py-2.5 px-3 text-blue-400 font-semibold">{mem.memory_id}</td>
                  <td className="py-2.5 px-3">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      {mem.device_id === 'device-a' && <Smartphone className="w-3.5 h-3.5 text-blue-400" />}
                      {mem.device_id === 'device-b' && <Laptop className="w-3.5 h-3.5 text-emerald-400" />}
                      {mem.device_id === 'device-c' && <Camera className="w-3.5 h-3.5 text-amber-400" />}
                      {mem.device_id.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-200 max-w-[420px] truncate">
                    {mem.content}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-[#161B26] border border-[#283244] text-slate-300">
                      {(mem.confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isLocalOnly
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                          : mem.privacy_tier === 'PUBLIC_SYNC'
                          ? 'bg-purple-950/60 text-purple-400 border border-purple-800/60'
                          : 'bg-blue-950/60 text-blue-400 border border-blue-800/60'
                      }`}
                    >
                      {mem.privacy_tier}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isLocalOnly
                          ? 'bg-slate-900 text-slate-400 border border-slate-700'
                          : isSynced
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      {mem.sync_state}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                    {mem.created_at.split('T')[1]?.slice(0, 8)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
