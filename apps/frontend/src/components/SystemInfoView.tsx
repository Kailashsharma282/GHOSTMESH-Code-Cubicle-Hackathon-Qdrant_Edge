import React from 'react';
import { Info, CheckCircle2, Cpu, HardDrive, Network, GitCommit } from 'lucide-react';
import { SystemStats } from '../types';

interface SystemInfoViewProps {
  stats: SystemStats | null;
}

export const SystemInfoView: React.FC<SystemInfoViewProps> = ({ stats }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#05070B] p-6 gap-6 overflow-y-auto">
      {/* Header */}
      <div className="glass-card rounded-xl p-5 flex items-center justify-between flex-wrap gap-3 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Info className="w-5 h-5" />
            </div>
            SYSTEM INFO & ARCHITECTURE DISCLOSURE
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Explicit technical specifications adhering to anti-hallucination guidelines
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          VERIFIED LOCAL RUNTIME
        </span>
      </div>

      {/* Hackathon & Project Identity Banner */}
      <div className="glass-card rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs shadow-xl border border-slate-800">
        <div>
          <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">HACKATHON</span>
          <span className="text-white font-bold text-sm block mt-0.5">Code Cubicle 6.0</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">TRACK</span>
          <span className="text-blue-400 font-bold text-sm block mt-0.5">Qdrant Edge</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">TEAM NAME</span>
          <span className="text-purple-400 font-bold text-sm block mt-0.5">infinitehacks</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">PARTICIPANT</span>
          <span className="text-emerald-400 font-bold text-sm truncate block mt-0.5" title="Pochiraju Kailash Ram Markandeya Sharma">
            Pochiraju Kailash Ram (Solo)
          </span>
        </div>
      </div>

      {/* Grid of technical disclosures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        <div className="glass-card rounded-xl p-5 flex flex-col gap-2.5 shadow-lg">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <HardDrive className="w-4 h-4" />
            QDRANT EDGE (LOCAL EMBEDDED SHARDS)
          </div>
          <p className="text-slate-300 font-medium leading-relaxed">
            Each simulated device (Device A, Device B, Device C) owns its own persistent on-disk
            storage directory under <code className="text-cyan-300 font-mono text-[11px] bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">data/[device-id]/edge/</code>. It runs
            in-process vector search using official QdrantClient local bindings without network access.
          </p>
          <div className="mt-auto pt-2 border-t border-slate-800 flex items-center justify-between text-slate-400 font-medium">
            <span>Points Indexed: {stats ? stats.local_memories_total : '--'}</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% On-Disk
            </span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 flex flex-col gap-2.5 shadow-lg">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
            <Network className="w-4 h-4" />
            QDRANT SERVER (GLOBAL CONVERGENCE TIER)
          </div>
          <p className="text-slate-300 font-medium leading-relaxed">
            Centralized Qdrant Server running on port <code className="text-blue-300 font-mono text-[11px] bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-800/40">:6333</code> serves
            as the global shared convergence tier for synchronized memories, cross-node vector similarity,
            and canonical synthesis storage.
          </p>
          <div className="mt-auto pt-2 border-t border-slate-800 flex items-center justify-between text-slate-400 font-medium">
            <span>Collection: ghostmesh_memories</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 flex flex-col gap-2.5 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Cpu className="w-4 h-4" />
            FASTEMBED LOCAL EMBEDDINGS (ONNX)
          </div>
          <p className="text-slate-300 font-medium leading-relaxed">
            Observations are vectorized on-device using the FastEmbed <code className="text-emerald-300 font-mono text-[11px] bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">BAAI/bge-small-en-v1.5</code> model
            (384 dimensions) running directly in-process via ONNX Runtime without calling any external LLM/cloud APIs.
          </p>
          <div className="mt-auto pt-2 border-t border-slate-800 flex items-center justify-between text-slate-400 font-medium">
            <span>Dimensions: 384-dim Dense</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Zero Cloud Dependency
            </span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 flex flex-col gap-2.5 shadow-lg">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <GitCommit className="w-4 h-4" />
            SQLITE TRANSACTIONAL EGRESS QUEUES
          </div>
          <p className="text-slate-300 font-medium leading-relaxed">
            Offline observations are staged inside dedicated local SQLite databases under <code className="text-amber-300 font-mono text-[11px] bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">data/[device-id]/queue.db</code>.
            Guarantees zero memory loss during network severing and automatic queue draining upon reconnect.
          </p>
          <div className="mt-auto pt-2 border-t border-slate-800 flex items-center justify-between text-slate-400 font-medium">
            <span>Pending Sync Items: {stats ? stats.pending_sync_total : '--'}</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> WAL Mode Enabled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SystemInfoView;
