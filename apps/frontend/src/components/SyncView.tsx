import React from 'react';
import { Database, RefreshCw, Smartphone, Laptop, Camera } from 'lucide-react';
import { SyncQueueItem, DeviceState } from '../types';

interface SyncViewProps {
  queueItems: SyncQueueItem[];
  devices: DeviceState[];
  onTriggerSyncAll: () => void;
}

export const SyncView: React.FC<SyncViewProps> = ({ queueItems, devices: _devices, onTriggerSyncAll }) => {
  const pending = queueItems.filter((i) => i.status === 'PENDING_UPLOAD');
  const uploading = queueItems.filter((i) => i.status === 'UPLOADING');
  const blocked = queueItems.filter((i) => i.status === 'LOCAL_ONLY');
  const synced = queueItems.filter((i) => i.status === 'SYNCED');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080A0D] p-4 gap-4 overflow-hidden font-mono">
      {/* Header */}
      <div className="bg-[#0C0F15] border border-[#1E2533] p-4 rounded flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            OUTBOUND SYNCHRONIZATION QUEUE
          </h2>
          <p className="text-xs text-slate-500">
            Persistent SQLite queues per edge node controlling egress to Qdrant Cloud
          </p>
        </div>

        <button
          onClick={onTriggerSyncAll}
          className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          DRAIN ONLINE QUEUES
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#0E121A] border border-[#1E2533] p-3 rounded">
          <span className="text-slate-500 block text-[10px]">PENDING EGRESS</span>
          <span className="text-lg font-bold text-amber-400 mt-0.5 block">{pending.length}</span>
          <span className="text-[10px] text-slate-500">Awaiting network / connection</span>
        </div>

        <div className="bg-[#0E121A] border border-[#1E2533] p-3 rounded">
          <span className="text-slate-500 block text-[10px]">IN-FLIGHT UPLOADS</span>
          <span className="text-lg font-bold text-blue-400 mt-0.5 block">{uploading.length}</span>
          <span className="text-[10px] text-slate-500">Active transmission</span>
        </div>

        <div className="bg-[#0E121A] border border-[#1E2533] p-3 rounded">
          <span className="text-slate-500 block text-[10px]">QUARANTINED (BLOCKED)</span>
          <span className="text-lg font-bold text-rose-400 mt-0.5 block">{blocked.length}</span>
          <span className="text-[10px] text-slate-500">Local-Only policy gate</span>
        </div>

        <div className="bg-[#0E121A] border border-[#1E2533] p-3 rounded">
          <span className="text-slate-500 block text-[10px]">COMPLETED SYNC</span>
          <span className="text-lg font-bold text-emerald-400 mt-0.5 block">{synced.length}</span>
          <span className="text-[10px] text-slate-500">Acknowledged by cloud</span>
        </div>
      </div>

      {/* Queue Table */}
      <div className="flex-1 overflow-y-auto border border-[#1E2533] rounded bg-[#0A0D13]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1E2533] bg-[#0E121A] text-slate-400 sticky top-0 z-10">
              <th className="py-2.5 px-3">SYNC ID</th>
              <th className="py-2.5 px-3">NODE</th>
              <th className="py-2.5 px-3">MEMORY ID</th>
              <th className="py-2.5 px-3">OPERATION</th>
              <th className="py-2.5 px-3">POLICY DECISION</th>
              <th className="py-2.5 px-3">ATTEMPTS</th>
              <th className="py-2.5 px-3">STATUS</th>
              <th className="py-2.5 px-3">TIME</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#161B26]">
            {queueItems.map((item) => {
              const isPending = item.status === 'PENDING_UPLOAD';
              const isBlocked = item.status === 'LOCAL_ONLY';
              const isSynced = item.status === 'SYNCED';

              return (
                <tr key={item.sync_id} className="hover:bg-[#121622] transition">
                  <td className="py-2 px-3 text-slate-400 font-semibold">{item.sync_id}</td>
                  <td className="py-2 px-3">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      {item.device_id === 'device-a' && <Smartphone className="w-3 h-3 text-blue-400" />}
                      {item.device_id === 'device-b' && <Laptop className="w-3 h-3 text-emerald-400" />}
                      {item.device_id === 'device-c' && <Camera className="w-3 h-3 text-amber-400" />}
                      {item.device_id.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-blue-400">{item.memory_id}</td>
                  <td className="py-2 px-3 text-slate-300 font-bold">{item.operation}</td>
                  <td className="py-2 px-3 text-slate-400 max-w-[260px] truncate text-[11px]">
                    {item.privacy_decision}
                  </td>
                  <td className="py-2 px-3 text-slate-400">{item.attempt_count}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isBlocked
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-800'
                          : isPending
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800'
                          : isSynced
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                          : 'bg-blue-950/60 text-blue-400 border border-blue-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-500 text-[11px]">
                    {item.created_at.split('T')[1]?.slice(0, 8)}
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
