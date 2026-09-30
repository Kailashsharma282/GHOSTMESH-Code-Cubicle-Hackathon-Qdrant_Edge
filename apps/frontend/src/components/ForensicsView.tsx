import React, { useState } from 'react';
import { Fingerprint, Smartphone, Laptop, Camera, GitFork } from 'lucide-react';
import { ReconciliationDecision } from '../types';

interface ForensicsViewProps {
  decisions: ReconciliationDecision[];
}

export const ForensicsView: React.FC<ForensicsViewProps> = ({ decisions }) => {
  const mergedDecisions = decisions.filter((d) => d.canonical_content);
  const [selectedDecision, setSelectedDecision] = useState<ReconciliationDecision | null>(
    mergedDecisions.length > 0 ? mergedDecisions[0] : null
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#05070B] p-5 gap-5 overflow-hidden">
      {/* Header */}
      <div className="glass-card rounded-xl p-5 flex items-center justify-between flex-wrap gap-3 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Fingerprint className="w-5 h-5" />
            </div>
            MEMORY FORENSICS & EVIDENCE GRAPH
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Cryptographic and multi-node lineage proving every canonical memory is grounded in original evidence
          </p>
        </div>
        <span className="text-xs text-emerald-300 font-semibold px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30">
          {mergedDecisions.length} CANONICAL RECORDS ANALYZED
        </span>
      </div>

      {/* Main Forensic View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 overflow-hidden">
        {/* Canonical Memory Selector */}
        <div className="glass-card rounded-xl overflow-y-auto p-3 space-y-2.5 shadow-xl">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 border-b border-slate-800 tracking-wider uppercase">
            Select Canonical Synthesis
          </div>

          {mergedDecisions.map((dec) => {
            const isSelected = selectedDecision?.decision_id === dec.decision_id;
            return (
              <div
                key={dec.decision_id}
                onClick={() => setSelectedDecision(dec)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-[#0A0E18] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-emerald-400 font-bold font-mono">{dec.canonical_memory_id}</span>
                  <span className="text-slate-400 font-semibold text-[11px]">
                    Score: {(dec.reconciliation_score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-slate-200 line-clamp-2 font-medium">
                  "{dec.canonical_content}"
                </p>
                <span className="text-[11px] text-slate-400 font-medium block mt-2">
                  {dec.provenance.length} independent source nodes
                </span>
              </div>
            );
          })}
        </div>

        {/* Forensics Tree Graph */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6 overflow-y-auto flex flex-col gap-5 shadow-xl">
          {selectedDecision ? (
            <div>
              {/* Canonical Record Node */}
              <div className="bg-[#0B1320] border-2 border-emerald-500/70 p-5 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold tracking-wide">
                    CANONICAL MEMORY RECORD
                  </span>
                  <span className="text-xs text-slate-300 font-mono font-bold">
                    {selectedDecision.canonical_memory_id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  "{selectedDecision.canonical_content}"
                </h3>
                <div className="flex flex-wrap gap-5 text-xs text-slate-300 mt-3.5 pt-3 border-t border-slate-800 font-medium">
                  <span>Method: <strong className="text-white">{selectedDecision.action}</strong></span>
                  <span>Confidence: <strong className="text-emerald-400">{(selectedDecision.reconciliation_score * 100).toFixed(1)}%</strong></span>
                  <span>Timestamp: <strong className="text-slate-300 font-mono">{selectedDecision.timestamp.split('T')[1]?.slice(0, 8)}</strong></span>
                </div>
              </div>

              {/* Connecting Tree Branch Visualizer */}
              <div className="flex flex-col items-center my-4">
                <div className="w-[2px] h-6 bg-gradient-to-b from-emerald-500 to-blue-500" />
                <span className="text-[11px] font-semibold text-slate-300 bg-[#0C111C] px-3 py-1 rounded-full border border-slate-700/80 shadow-md flex items-center gap-1.5 my-1">
                  <GitFork className="w-3.5 h-3.5 text-blue-400 rotate-180" />
                  Synthesized from 3 Independent Edge Observations
                </span>
                <div className="w-[2px] h-6 bg-gradient-to-b from-blue-500 to-indigo-500" />
              </div>

              {/* Source Evidence Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {selectedDecision.provenance.map((src, i) => {
                  return (
                    <div
                      key={i}
                      className="bg-[#0A0E18] border border-slate-800/90 p-4 rounded-xl flex flex-col gap-2.5 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                          {src.device_id === 'device-a' && <Smartphone className="w-4 h-4 text-blue-400" />}
                          {src.device_id === 'device-b' && <Laptop className="w-4 h-4 text-emerald-400" />}
                          {src.device_id === 'device-c' && <Camera className="w-4 h-4 text-amber-400" />}
                          {src.device_id.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{src.timestamp.split('T')[1]?.slice(0, 8)}</span>
                      </div>

                      <p className="text-xs text-white font-medium">
                        "{src.original_content}"
                      </p>

                      <div className="mt-auto pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <span className="font-medium">Confidence:</span>
                        <span className="font-bold text-emerald-400">{(src.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Decision Explanation Footer */}
              <div className="mt-5 p-4 rounded-xl bg-[#090D17] border border-slate-800/80 text-xs text-slate-300">
                <span className="text-white font-bold block mb-1 uppercase tracking-wide">Reconciliation Rationale:</span>
                <p className="font-medium leading-relaxed">{selectedDecision.explanation}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 font-medium">
              Select a canonical synthesis on the left to inspect evidence provenance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ForensicsView;
