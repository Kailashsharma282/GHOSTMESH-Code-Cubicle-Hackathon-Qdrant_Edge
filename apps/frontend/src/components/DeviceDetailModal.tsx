import React, { useState, useEffect, useCallback } from 'react';
import { X, Smartphone, Laptop, Camera, Wifi, WifiOff } from 'lucide-react';
import { DeviceState, MemoryRecord, SyncQueueItem, SearchResultItem } from '../types';
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
  const [searchQuery, setSearchQuery] = useState('charger');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);

  const loadData = useCallback(async () => {
    if (!device) return;
    try {
      const [mems, q] = await Promise.all([
        fetchDeviceMemories(device.device_id),
        fetchDeviceSyncQueue(device.device_id),
      ]);
      setMemories(mems);
      setQueue(q);
    } catch (e) {
      console.error(e);
    }
  }, [device]);

  useEffect(() => {
    if (device) {
      loadData();
    }
  }, [device, loadData]);

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
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm font-mono">
      <div className="bg-[#0C0F15] border border-[#1E2533] rounded w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#1E2533] flex items-center justify-between bg-[#0F131D]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-blue-600/20 text-blue-400">
              {device.device_id === 'device-a' && <Smartphone className="w-5 h-5" />}
              {device.device_id === 'device-b' && <Laptop className="w-5 h-5 text-emerald-400" />}
              {device.device_id === 'device-c' && <Camera className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">{device.name}</h2>
              <span className="text-xs text-slate-500 uppercase">
                {device.device_id} • ROLE: {device.role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleConnect(device.device_id, device.status)}
              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition ${
                isOnline
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {device.status}
            </button>

            <button onClick={onClose} className="p-1 hover:bg-[#1E2533] text-slate-400 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Telemetry bar */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-[#0A0D13] border-b border-[#1E2533] text-xs">
          <div>
            <span className="text-slate-500 block text-[10px]">LOCAL SHARD</span>
            <span className="text-slate-200 font-bold">{device.memory_count} memories</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">SEARCH LATENCY</span>
            <span className="text-emerald-400 font-bold">{device.edge_search_latency_ms.toFixed(1)} ms</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">PENDING EGRESS</span>
            <span className="text-amber-400 font-bold">{device.pending_sync_count} items</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">ESTIMATED RAM</span>
            <span className="text-slate-300 font-bold">{device.ram_usage_mb} MB</span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-[#1E2533] bg-[#0E121A] text-xs px-4">
          <button
            onClick={() => setActiveSubTab('memories')}
            className={`py-2 px-3 border-b-2 font-bold transition ${
              activeSubTab === 'memories'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            LOCAL MEMORIES ({memories.length})
          </button>
          <button
            onClick={() => setActiveSubTab('sync')}
            className={`py-2 px-3 border-b-2 font-bold transition ${
              activeSubTab === 'sync'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            OUTBOUND QUEUE ({queue.length})
          </button>
          <button
            onClick={() => setActiveSubTab('search')}
            className={`py-2 px-3 border-b-2 font-bold transition ${
              activeSubTab === 'search'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            OFFLINE SEARCH
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#080A0D]">
          {activeSubTab === 'memories' && (
            <div className="space-y-2">
              {memories.map((m) => (
                <div
                  key={m.memory_id}
                  className="p-2.5 rounded bg-[#0E121A] border border-[#1E2533] text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="text-blue-400 font-bold">{m.memory_id}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-bold ${
                        m.privacy_tier === 'LOCAL_ONLY'
                          ? 'text-rose-400 bg-rose-950/60'
                          : 'text-blue-400 bg-blue-950/60'
                      }`}
                    >
                      {m.privacy_tier}
                    </span>
                  </div>
                  <p className="text-slate-200 font-sans">"{m.content}"</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-[#1E2533]/50">
                    <span>Confidence: {(m.confidence * 100).toFixed(0)}%</span>
                    <span>State: {m.sync_state}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSubTab === 'sync' && (
            <div className="space-y-2">
              {queue.map((q) => (
                <div
                  key={q.sync_id}
                  className="p-2.5 rounded bg-[#0E121A] border border-[#1E2533] text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-200">{q.memory_id}</div>
                    <span className="text-[10px] text-slate-500">{q.privacy_decision}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      q.status === 'LOCAL_ONLY'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : q.status === 'SYNCED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {q.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeSubTab === 'search' && (
            <div className="space-y-3">
              <form onSubmit={handleLocalSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Offline query to this device's Qdrant Edge shard..."
                  className="flex-1 bg-[#121622] border border-[#1E2533] px-3 py-1.5 rounded text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold"
                >
                  SEARCH OFFLINE
                </button>
              </form>

              {searchResults.map((r) => (
                <div
                  key={r.memory_id}
                  className="p-3 rounded bg-[#0E121A] border border-[#1E2533] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-emerald-400 font-bold">LOCAL HIT ({r.memory_id})</span>
                    <span className="text-blue-400 font-bold">
                      Match: {(r.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-slate-100 font-sans">"{r.content}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
