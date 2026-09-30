import React, { useState } from 'react';
import { GitMerge, Check, ShieldAlert, Award } from 'lucide-react';
import { ConflictCandidate, ReconciliationDecision } from '../types';
import { resolveConflict } from '../api';

interface ReconciliationViewProps {
  conflicts: ConflictCandidate[];
  decisions: ReconciliationDecision[];
  onRefresh: () => void;
}

export const ReconciliationView: React.FC<ReconciliationViewProps> = ({
  conflicts,
  decisions,
  onRefresh,
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<ConflictCandidate | null>(
    conflicts.length > 0 ? conflicts[0] : null
  );
  const [selectedDecision, setSelectedDecision] = useState<ReconciliationDecision | null>(
    decisions.length > 0 ? decisions[0] : null
  );
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const handleResolve = async (groupId: string, action: string) => {
    setResolvingId(groupId);
    try {
      await resolveConflict(groupId, action);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#05070B] p-5 gap-5 overflow-hidden">
      {/* Header */}
      <div className="glass-card rounded-xl p-5 flex items-center justify-between flex-wrap gap-3 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <GitMerge className="w-5 h-5" />
            </div>
            RECONCILIATION CENTER & SEMANTIC DIFF
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Eventual consistency reconciliation engine using transparent multi-factor scoring
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
            {decisions.length} RESOLVED DECISIONS
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300">
            {conflicts.filter((c) => c.status !== 'RESOLVED').length} PENDING REVIEW
          </span>
        </div>
      </div>

      {/* Main Split Screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 overflow-hidden">
        {/* Left: Active Decisions & Conflicts List */}
        <div className="flex flex-col glass-card rounded-xl overflow-hidden shadow-xl">
          <div className="border-b border-slate-800 bg-[#0C101A] px-4 py-3 text-xs font-bold text-white flex items-center justify-between">
            <span>RECONCILIATION EVENTS & CONFLICT GROUPS</span>
            <span className="text-[11px] text-slate-400 font-medium">Select item to inspect diff</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
            {/* Show Decisions */}
            {decisions.map((dec) => {
              const isSelected = selectedDecision?.decision_id === dec.decision_id;
              const isMerge = dec.action === 'MERGE';

              return (
                <div
                  key={dec.decision_id}
                  onClick={() => {
                    setSelectedDecision(dec);
                    setSelectedCandidate(null);
                  }}
                  className={`p-4 cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-600/10 border-l-4 border-blue-500'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-blue-400">
                      {dec.decision_id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                        isMerge
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {dec.action}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 line-clamp-2 mb-2 font-medium">
                    {dec.explanation}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Score: {(dec.reconciliation_score * 100).toFixed(0)}%</span>
                    <span>Sources: {dec.provenance.map((p) => p.device_id.toUpperCase()).join(', ')}</span>
                  </div>
                </div>
              );
            })}

            {/* Show Conflict Candidates */}
            {conflicts
              .filter((c) => c.status !== 'RESOLVED')
              .map((cand) => {
                const isSelected = selectedCandidate?.conflict_group_id === cand.conflict_group_id;
                return (
                  <div
                    key={cand.conflict_group_id}
                    onClick={() => {
                      setSelectedCandidate(cand);
                      setSelectedDecision(null);
                    }}
                    className={`p-4 cursor-pointer transition ${
                      isSelected
                        ? 'bg-amber-600/10 border-l-4 border-amber-500'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {cand.conflict_group_id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                        {cand.proposed_action}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 line-clamp-2 mb-2 font-medium">
                      {cand.explanation}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>Match: {(cand.semantic_similarity * 100).toFixed(1)}%</span>
                      <span>Devices: {cand.devices.join(', ')}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right: Semantic Diff & Scoring Inspector */}
        <div className="flex flex-col glass-card rounded-xl overflow-y-auto p-5 gap-4 shadow-xl">
          {selectedDecision ? (
            <div className="flex flex-col gap-4">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Reconciliation Audit
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                    AUTO-RESOLVED
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1">
                  Decision {selectedDecision.decision_id} ({selectedDecision.action})
                </h3>
                <p className="text-xs text-slate-300 mt-1 font-medium">{selectedDecision.explanation}</p>
              </div>

              {/* Semantic Observation Evidence Diff */}
              <div className="bg-[#0A0E18] border border-slate-800 rounded-xl p-4 text-xs">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5">
                  Semantic Observation Evidence Diff
                </div>
                <div className="space-y-2">
                  {selectedDecision.provenance.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/30 text-slate-200"
                    >
                      <span className="text-rose-400 font-bold mr-2 font-mono">
                        + [{p.device_id.toUpperCase()}]
                      </span>
                      <span className="font-medium">"{p.original_content}"</span>
                      <span className="text-slate-400 text-[10px] block mt-1 font-medium">
                        Confidence: {(p.confidence * 100).toFixed(0)}% | Time: {p.timestamp.split('T')[1]?.slice(0, 8)}
                      </span>
                    </div>
                  ))}

                  {selectedDecision.canonical_content && (
                    <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-600/40 text-emerald-200 font-medium mt-2">
                      <span className="text-emerald-400 font-bold mr-2">→ [CANONICAL MEMORY]:</span>
                      <span>"{selectedDecision.canonical_content}"</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Multi-Factor Transparent Scoring */}
              <div className="bg-[#0A0E18] border border-slate-800 rounded-xl p-4 text-xs">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>GhostMesh Multi-Factor Scoring</span>
                  <span className="text-blue-400 font-bold text-xs">
                    Composite: {(selectedDecision.reconciliation_score * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-[#0D121F] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-medium uppercase">Semantic Match (40%)</span>
                    <span className="text-blue-400 font-bold text-xs">
                      {((selectedDecision.scores_breakdown?.semantic_score ?? 0.85) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="bg-[#0D121F] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-medium uppercase">Temporal Decay (25%)</span>
                    <span className="text-emerald-400 font-bold text-xs">
                      {((selectedDecision.scores_breakdown?.temporal_score ?? 0.92) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="bg-[#0D121F] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-medium uppercase">Confidence Weight (20%)</span>
                    <span className="text-purple-400 font-bold text-xs">
                      {((selectedDecision.scores_breakdown?.confidence_score ?? 0.88) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="bg-[#0D121F] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-medium uppercase">Conflict Risk (15%)</span>
                    <span className="text-slate-200 font-bold text-xs">
                      {((selectedDecision.scores_breakdown?.contradiction_penalty ?? 0.05) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedCandidate ? (
            <div className="flex flex-col gap-4">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Conflict Candidate Group
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                    PENDING RESOLUTION
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1">
                  Group {selectedCandidate.conflict_group_id} ({selectedCandidate.status})
                </h3>
                <p className="text-xs text-amber-300 mt-1 font-medium">{selectedCandidate.explanation}</p>
              </div>

              {/* Contradictory Observations */}
              <div className="bg-[#0A0E18] border border-slate-800 rounded-xl p-4 text-xs">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5">
                  Incompatible Spatial Observations
                </div>
                <div className="space-y-2">
                  {selectedCandidate.memory_ids.map((id, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/30 text-slate-200"
                    >
                      <span className="text-amber-400 font-bold mr-2 font-mono">
                        [{selectedCandidate.devices[idx] ? selectedCandidate.devices[idx].toUpperCase() : 'NODE'}]
                      </span>
                      <span className="font-mono text-xs">{id}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explainability / Why Not Merge */}
              <div className="bg-[#0A0E18] border border-amber-900/40 rounded-xl p-4 text-xs">
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Why Not Merge? (Anti-Hallucination Guardrail)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {selectedCandidate.explanation} GhostMesh prevents forced unification of mutually exclusive physical states ("on chair" vs "on floor").
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleResolve(selectedCandidate.conflict_group_id, 'KEEP_BOTH')}
                  disabled={resolvingId !== null}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Preserve Both Separate
                </button>
                <button
                  onClick={() => handleResolve(selectedCandidate.conflict_group_id, 'FORCE_MERGE')}
                  disabled={resolvingId !== null}
                  className="py-2 px-3 rounded-lg bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Award className="w-3.5 h-3.5" />
                  Synthesize Canonical
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8">
              <GitMerge className="w-10 h-10 text-slate-600 mb-3" />
              <p className="font-semibold text-white">Select a reconciliation event</p>
              <p className="text-xs text-slate-400 mt-1">
                Choose an item on the left to inspect evidence, git-style diffs, and transparent multi-factor scoring.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ReconciliationView;
