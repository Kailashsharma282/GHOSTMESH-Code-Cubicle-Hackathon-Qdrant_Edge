import React from 'react';
import { Database, RefreshCw, Smartphone, Laptop, Camera, Layers, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
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
      {/* Header */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg border border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2 tracking-wide">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Database className="w-4 h-4" />
            </div>
            OUTBOUND EGRESS SYNCHRONIZATION QUEUE
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Persistent SQLite queues per edge shard controlling egress to central Qdrant Server :6333
          </p>
        </div>

        <button
          onClick={onTriggerSyncAll}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          DRAIN ALL ONLINE QUEUES
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="glass-card rounded-xl p-3.5 border border-slate-800 border-t-2 border-t-amber-400">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pending Egress</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{pending.length}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Awaiting network or re-sync</span>
        </div>

        <div className="glass-card rounded-xl p-3.5 border border-slate-800 border-t-2 border-t-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">In-Flight Uploads</span>
            <Layers className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="text-2xl font-extrabold text-blue-400 mt-1 block">{uploading.length}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Active streaming channel</span>
        </div>

        <div className="glass-card rounded-xl p-3.5 border border-slate-800 border-t-2 border-t-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Quarantined (Blocked)</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <span className="text-2xl font-extrabold text-rose-400 mt-1 block">{blocked.length}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Zero-leak privacy gate</span>
        </div>

        <div className="glass-card rounded-xl p-3.5 border border-slate-800 border-t-2 border-t-emerald-400">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Completed Sync</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">{synced.length}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Acknowledged by Qdrant</span>
        </div>
      </div>

      {/* Queue Table */}
      <div className="flex-1 overflow-y-auto glass-card rounded-2xl border border-slate-800 shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800/90 bg-[#090D17]/90 text-slate-400 font-semibold uppercase tracking-wider text-[11px] sticky top-0 z-10 backdrop-blur-md">
              <th className="py-3 px-4">Queue Item ID</th>
              <th className="py-3 px-4">Source Node</th>
              <th className="py-3 px-4">Target Memory ID</th>
              <th className="py-3 px-4">Operation</th>
              <th className="py-3 px-4">Privacy Policy</th>
              <th className="py-3 px-4">Attempts</th>
              <th className="py-3 px-4">Queue Status</th>
              <th className="py-3 px-4 text-right">Queued Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 font-medium">
            {queueItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                  Outbound queue is currently empty.
                </td>
              </tr>
            ) : (
              queueItems.map((item) => {
                const isPending = item.status === 'PENDING_UPLOAD';
                const isBlocked = item.status === 'LOCAL_ONLY';

                return (
                  <tr key={item.sync_id} className="hover:bg-blue-600/5 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400">
                        {item.sync_id.slice(0, 12)}...
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {getDeviceIcon(item.device_id)}
                        <span className="text-white font-semibold">{getDeviceLabel(item.device_id)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                        {item.memory_id.slice(0, 12)}...
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">
                        {item.operation}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isBlocked
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                        }`}
                      >
                        {item.privacy_decision || 'SYNC_ALLOWED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-bold">{item.attempt_count}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPending
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800 animate-pulse'
                            : isBlocked
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                      {item.created_at ? item.created_at.split('T')[1]?.slice(0, 8) : '--'}
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

export default SyncView;
