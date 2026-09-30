import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Laptop,
  Camera,
  Wifi,
  WifiOff,
  Search,
  HardDrive,
  Layers,
  Zap,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { DeviceState, MemoryRecord, SyncQueueItem } from '../types';
import { fetchDeviceMemories, fetchDeviceSyncQueue, searchDeviceLocal } from '../api';

interface DeviceDetailModalProps {
  device: DeviceState | null;
  onClose: () => void;
  onToggleConnect: (deviceId: string, currentStatus: string) => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  onClose,
  onToggleConnect,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'memories' | 'sync' | 'search'>('memories');
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (!device) return;

    let isMounted = true;
    const loadData = async () => {
      try {
        const [mems, q] = await Promise.all([
          fetchDeviceMemories(device.device_id),
          fetchDeviceSyncQueue(device.device_id),
        ]);
        if (isMounted) {
          setMemories(mems);
          setQueue(q);
        }
      } catch (e) {
        console.error('Error loading device shard data:', e);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [device?.device_id]);

  if (!device) return null;

  const handleLocalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await searchDeviceLocal(device.device_id, searchQuery);
      setSearchResults(res);
    } catch (e) {
      console.error(e);
    }
  };

  const isOnline = device.status === 'ONLINE';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="glass-card rounded-2xl border border-slate-800 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#090D17]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              {device.device_id === 'device-a' && <Smartphone className="w-5 h-5 text-cyan-400" />}
              {device.device_id === 'device-b' && <Laptop className="w-5 h-5 text-blue-400" />}
              {device.device_id === 'device-c' && <Camera className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">{device.name}</h2>
              <span className="text-xs text-slate-400 font-medium">
                {device.device_id.toUpperCase()} • QDRANT EDGE SHARD • ROLE: {device.role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onToggleConnect(device.device_id, device.status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                isOnline
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 hover:bg-rose-950 hover:text-rose-400'
                  : 'bg-rose-950/80 text-rose-400 border border-rose-500/40 hover:bg-emerald-950 hover:text-emerald-400'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {device.status}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Telemetry bar */}
        <div className="grid grid-cols-4 gap-3 p-3 bg-[#070A12] border-b border-slate-800 text-xs">
          <div className="bg-[#090D17] p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Local Shard</span>
            <span className="text-white font-bold text-sm mt-0.5 block">{device.memory_count} vectors</span>
          </div>
          <div className="bg-[#090D17] p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Search Speed</span>
            <span className="text-emerald-400 font-bold text-sm mt-0.5 block flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              {device.edge_search_latency_ms.toFixed(1)} ms
            </span>
          </div>
          <div className="bg-[#090D17] p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Pending Sync</span>
            <span className="text-amber-400 font-bold text-sm mt-0.5 block">{device.pending_sync_count} items</span>
          </div>
          <div className="bg-[#090D17] p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Quarantined</span>
            <span className="text-rose-400 font-bold text-sm mt-0.5 block">{device.local_only_count} local-only</span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-slate-800 bg-[#090D17] text-xs px-4">
          <button
            onClick={() => setActiveSubTab('memories')}
            className={`py-2.5 px-3 border-b-2 font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'memories'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            LOCAL SHARD MEMORIES ({memories.length})
          </button>
          <button
            onClick={() => setActiveSubTab('sync')}
            className={`py-2.5 px-3 border-b-2 font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'sync'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            EGRESS QUEUE ({queue.length})
          </button>
          <button
            onClick={() => setActiveSubTab('search')}
            className={`py-2.5 px-3 border-b-2 font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'search'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            OFFLINE VECTOR SEARCH
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#05070B]">
          {activeSubTab === 'memories' && (
            <div className="space-y-2">
              {memories.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">No memories in this local shard.</div>
              ) : (
                memories.map((m) => (
                  <div
                    key={m.memory_id}
                    className="p-3 rounded-xl bg-[#090D17] border border-slate-800 text-xs flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-cyan-400">{m.memory_id}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${
                          m.privacy_tier === 'LOCAL_ONLY'
                            ? 'text-rose-300 bg-rose-950/80 border border-rose-800'
                            : 'text-cyan-300 bg-cyan-950/80 border border-cyan-800'
                        }`}
                      >
                        {m.privacy_tier === 'LOCAL_ONLY' ? (
                          <ShieldAlert className="w-2.5 h-2.5 text-rose-400" />
                        ) : (
                          <ShieldCheck className="w-2.5 h-2.5 text-cyan-400" />
                        )}
                        {m.privacy_tier}
                      </span>
                    </div>
                    <p className="text-white font-semibold">"{m.content}"</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/80">
                      <span>Vector Match Confidence: {(m.confidence * 100).toFixed(0)}%</span>
                      <span className="font-medium">Status: {m.sync_state}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeSubTab === 'sync' && (
            <div className="space-y-2">
              {queue.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">Outbound queue is clean.</div>
              ) : (
                queue.map((q) => (
                  <div
                    key={q.sync_id}
                    className="p-3 rounded-xl bg-[#090D17] border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono text-xs text-white">{q.memory_id}</div>
                      <span className="text-[10px] text-slate-400">{q.privacy_decision}</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        q.status === 'LOCAL_ONLY'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                          : q.status === 'SYNCED'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeSubTab === 'search' && (
            <div className="space-y-3">
              <form onSubmit={handleLocalSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Test offline vector similarity against this local Qdrant Edge shard..."
                  className="flex-1 bg-[#090D17] border border-slate-800 px-3.5 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  SEARCH OFFLINE
                </button>
              </form>

              {searchResults.map((r) => (
                <div
                  key={r.memory_id}
                  className="p-3 rounded-xl bg-[#090D17] border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-emerald-400 font-bold">LOCAL SHARD HIT ({r.memory_id.slice(0, 12)}...)</span>
                    <span className="text-blue-400 font-bold">
                      Cosine Match: {(r.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-white font-semibold">"{r.content}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceDetailModal;
