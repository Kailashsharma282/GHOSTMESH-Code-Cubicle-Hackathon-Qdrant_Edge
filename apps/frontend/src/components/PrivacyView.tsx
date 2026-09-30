import React, { useState } from 'react';
import { ShieldCheck, Lock, Globe, ShieldAlert, CheckCircle } from 'lucide-react';
import { MemoryRecord } from '../types';
import { previewPrivacyClassification } from '../api';

interface PrivacyViewProps {
  memories: MemoryRecord[];
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ memories }) => {
  const [testContent, setTestContent] = useState('Hardware Lab master password and passport backup in drawer lockbox');
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const localOnly = memories.filter((m) => m.privacy_tier === 'LOCAL_ONLY');
  const syncAllowed = memories.filter((m) => m.privacy_tier === 'SYNC_ALLOWED');
  const publicSync = memories.filter((m) => m.privacy_tier === 'PUBLIC_SYNC');

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testContent.trim()) return;
    setIsTesting(true);
    try {
      const res = await previewPrivacyClassification(testContent);
      setPreviewResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#05070B] p-5 gap-5 overflow-y-auto">
      {/* Header */}
      <div className="glass-card rounded-xl p-5 flex flex-col gap-2 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">
              PRIVACY POLICY ENGINE & QUARANTINE CONSOLE
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800 text-xs font-semibold">
            Zero-Leak Edge Quarantine
          </span>
        </div>
        <p className="text-xs text-slate-400 font-medium max-w-4xl">
          Deterministic classification enforcing strict edge quarantine before any data traverses
          network boundaries. Quarantined memories NEVER leave local storage.
        </p>
      </div>

      {/* Interactive Policy Tester */}
      <div className="glass-card rounded-xl p-5 flex flex-col gap-3.5 shadow-xl">
        <div className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          REAL-TIME POLICY CLASSIFIER TESTER
        </div>
        <form onSubmit={handleTest} className="flex gap-2.5">
          <input
            type="text"
            value={testContent}
            onChange={(e) => setTestContent(e.target.value)}
            placeholder="Type sample observation to test policy rules (e.g. 'Door PIN code', 'passport', 'office lamp')..."
            className="flex-1 bg-[#090D17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
          />
          <button
            type="submit"
            disabled={isTesting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-[0_0_12px_rgba(59,130,246,0.3)] disabled:opacity-50"
          >
            {isTesting ? 'EVALUATING...' : 'TEST POLICY'}
          </button>
        </form>

        {previewResult && (
          <div className="bg-[#0A0E18] border border-slate-800/90 p-4 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-medium uppercase">Tier Decision:</span>
              <span
                className={`font-extrabold text-sm block mt-0.5 ${
                  previewResult.tier === 'LOCAL_ONLY'
                    ? 'text-rose-400'
                    : previewResult.tier === 'PUBLIC_SYNC'
                    ? 'text-purple-400'
                    : 'text-blue-400'
                }`}
              >
                {previewResult.tier}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-medium uppercase">Reason:</span>
              <span className="text-white font-medium block mt-0.5">{previewResult.reason}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-medium uppercase">Action:</span>
              <span className="text-slate-300 font-medium block mt-0.5">{previewResult.action}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-medium uppercase">Cloud Sync:</span>
              <span
                className={`font-extrabold text-sm flex items-center gap-1 mt-0.5 ${
                  previewResult.sync_blocked ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {previewResult.sync_blocked ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    BLOCKED AT EDGE
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    PERMITTED
                  </>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Three Policy Tiers Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
        {/* LOCAL ONLY */}
        <div className="flex flex-col border border-rose-900/40 rounded-xl bg-[#090D16] p-4 gap-2.5 shadow-lg">
          <div className="flex items-center justify-between border-b border-rose-950/60 pb-2.5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <Lock className="w-4 h-4" />
              LOCAL ONLY ({localOnly.length})
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 text-[10px] font-semibold border border-rose-800">
              Quarantined
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Security keys, passwords, biometric face data, passports. Cloud egress is
            physically blocked at edge runtime.
          </p>

          <div className="flex-1 overflow-y-auto space-y-2 mt-2">
            {localOnly.map((m) => (
              <div
                key={m.memory_id}
                className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/30 text-xs"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
                  <span className="text-rose-400 font-bold">{m.memory_id}</span>
                  <span className="font-semibold text-slate-300">{m.device_id.toUpperCase()}</span>
                </div>
                <p className="text-xs text-white font-medium">"{m.content}"</p>
                <div className="text-[10px] text-rose-400 font-semibold mt-1">Never transmitted to cloud</div>
              </div>
            ))}
          </div>
        </div>

        {/* SYNC ALLOWED */}
        <div className="flex flex-col border border-blue-900/40 rounded-xl bg-[#090D16] p-4 gap-2.5 shadow-lg">
          <div className="flex items-center justify-between border-b border-blue-950/60 pb-2.5">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              SYNC ALLOWED ({syncAllowed.length})
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 text-[10px] font-semibold border border-blue-800">
              Encrypted Sync
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Standard observations, hardware placements, and notes. Authorized for Qdrant Cloud
            synchronization upon connectivity.
          </p>

          <div className="flex-1 overflow-y-auto space-y-2 mt-2">
            {syncAllowed.slice(0, 15).map((m) => (
              <div
                key={m.memory_id}
                className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/30 text-xs"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
                  <span className="text-blue-400 font-bold">{m.memory_id}</span>
                  <span className="font-semibold text-slate-300">{m.device_id.toUpperCase()}</span>
                </div>
                <p className="text-xs text-white font-medium truncate">"{m.content}"</p>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1">Status: {m.sync_state}</div>
              </div>
            ))}
          </div>
        </div>

        {/* PUBLIC SYNC */}
        <div className="flex flex-col border border-purple-900/40 rounded-xl bg-[#090D16] p-4 gap-2.5 shadow-lg">
          <div className="flex items-center justify-between border-b border-purple-950/60 pb-2.5">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
              <Globe className="w-4 h-4" />
              PUBLIC SYNC ({publicSync.length})
            </div>
            <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 text-[10px] font-semibold border border-purple-800">
              Universal Mesh
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Generic facility metadata, temperature, ambient light levels, office layout telemetry.
            Shared openly across all mesh participants.
          </p>

          <div className="flex-1 overflow-y-auto space-y-2 mt-2">
            {publicSync.map((m) => (
              <div
                key={m.memory_id}
                className="p-3 rounded-lg bg-purple-950/20 border border-purple-900/30 text-xs"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
                  <span className="text-purple-400 font-bold">{m.memory_id}</span>
                  <span className="font-semibold text-slate-300">{m.device_id.toUpperCase()}</span>
                </div>
                <p className="text-xs text-white font-medium">"{m.content}"</p>
                <div className="text-[10px] text-purple-400 font-semibold mt-1">Mesh-wide broadcast permitted</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default PrivacyView;
