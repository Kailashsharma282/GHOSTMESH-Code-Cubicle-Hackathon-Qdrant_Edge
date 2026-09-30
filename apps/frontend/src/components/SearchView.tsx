import React, { useState } from 'react';
import { Search, Sparkles, Filter } from 'lucide-react';
import { SearchResultItem } from '../types';
import { searchMesh } from '../api';

export const SearchView: React.FC = () => {
  const [query, setQuery] = useState('Where is the USB-C charger?');
  const [mode, setMode] = useState<'MERGED' | 'LOCAL' | 'CLOUD'>('MERGED');
  const [deviceId, setDeviceId] = useState<string>('device-a');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await searchMesh(query, mode, mode === 'LOCAL' ? deviceId : undefined);
      setResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#05070B] p-5 gap-5 overflow-y-auto">
      {/* Header and Search Controls */}
      <div className="glass-card rounded-xl p-5 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Search className="w-4 h-4" />
            </div>
            SEMANTIC MEMORY SEARCH
          </h2>
          <span className="text-xs text-slate-400 font-medium px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            Vector Similarity powered by FastEmbed BGE-small (384-dim)
          </span>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask memory fabric (e.g. 'Where is the charger?', 'Blue backpack', 'keys')..."
              className="w-full bg-[#090D17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            {isSearching ? 'SEARCHING...' : 'QUERY MESH'}
          </button>
        </form>

        {/* Search Mode Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <span className="text-slate-400 font-semibold uppercase text-[11px] tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Scope:
            </span>
            <div className="flex bg-[#0A0E18] rounded-lg border border-slate-800 p-0.5">
              {(['MERGED', 'LOCAL', 'CLOUD'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                    mode === m
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Local Device Selector */}
          {mode === 'LOCAL' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Target Edge Shard:</span>
              <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="bg-[#0A0E18] border border-slate-700/80 px-3 py-1.5 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="device-a">Device A (Phone)</option>
                <option value="device-b">Device B (Laptop)</option>
                <option value="device-c">Device C (Camera)</option>
              </select>
            </div>
          )}

          {/* Quick preset query pills */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-medium">Suggestions:</span>
            {['Where is the charger?', 'Blue backpack', 'keys on desk', 'password'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuery(s);
                  setTimeout(() => handleSearch(), 50);
                }}
                className="px-2.5 py-1 rounded-md bg-[#0F1524] hover:bg-[#182136] text-blue-300 border border-slate-800 hover:border-blue-500/40 font-medium text-[11px] transition"
              >
                "{s}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 flex flex-col gap-3">
        {results.length > 0 ? (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-bold text-white tracking-wide">
                FOUND {results.length} EVIDENCE RECORDS
              </span>
              <span className="font-medium">Sorted by composite match confidence</span>
            </div>

            {results.map((r) => {
              const isMerged = r.hit_type === 'MERGED_HIT';
              const isLocal = r.hit_type === 'LOCAL_HIT';

              return (
                <div
                  key={r.memory_id}
                  className="glass-card glass-card-hover rounded-xl p-4.5 flex flex-col gap-3 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                          isMerged
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-600/40'
                            : isLocal
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
                            : 'bg-blue-950/80 text-blue-300 border border-blue-600/40'
                        }`}
                      >
                        {r.hit_type}
                      </span>

                      <span className="text-slate-300 font-mono text-xs">{r.memory_id}</span>

                      <span className="text-slate-400 text-xs font-medium">
                        via {r.device_id.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-medium">SIMILARITY:</span>
                      <span className="text-blue-400 font-extrabold text-sm">
                        {(r.score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-white font-medium pl-1">"{r.content}"</p>

                  {/* Explainability Breakdown */}
                  <div className="bg-[#0A0E18] border border-slate-800/80 p-3 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-medium uppercase">
                        Semantic Match
                      </span>
                      <span className="text-blue-400 font-bold text-xs">
                        {(r.explainability.semantic_similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-medium uppercase">
                        Recency
                      </span>
                      <span className="text-slate-200 font-bold text-xs">
                        {(r.explainability.recency * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-medium uppercase">
                        Confidence
                      </span>
                      <span className="text-emerald-400 font-bold text-xs">
                        {(r.explainability.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-medium uppercase">
                        Device Score
                      </span>
                      <span className="text-purple-400 font-bold text-xs">
                        {(r.explainability.device_relevance * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : hasSearched ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 glass-card rounded-xl text-slate-400">
            <Search className="w-10 h-10 text-slate-600 mb-3" />
            <p className="font-semibold text-white">No memory matches found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              No vector points reached the minimum similarity threshold. Try broadening your query or switching scopes.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 glass-card rounded-xl text-slate-400">
            <Sparkles className="w-10 h-10 text-blue-500/50 mb-3" />
            <p className="font-semibold text-white text-base">Distributed Vector Recall Ready</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Choose MERGED for collective mesh intelligence, LOCAL for zero-cloud device shards, or CLOUD for synchronized records.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default SearchView;
