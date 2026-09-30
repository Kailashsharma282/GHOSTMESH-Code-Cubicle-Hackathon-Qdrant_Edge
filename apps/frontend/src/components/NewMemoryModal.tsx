import React, { useState } from 'react';
import { X, PlusCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { createDeviceMemory } from '../api';

interface NewMemoryModalProps {
  deviceId: string | null;
  onClose: () => void;
  onCreated: () => void;
}

export const NewMemoryModal: React.FC<NewMemoryModalProps> = ({
  deviceId,
  onClose,
  onCreated,
}) => {
  const [content, setContent] = useState('');
  const [memoryType, setMemoryType] = useState('OBSERVATION');
  const [confidence, setConfidence] = useState(0.85);
  const [privacyTier, setPrivacyTier] = useState<string>('AUTO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!deviceId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await createDeviceMemory(
        deviceId,
        content,
        memoryType,
        confidence,
        privacyTier === 'AUTO' ? null : privacyTier
      );
      onCreated();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="glass-card rounded-2xl border border-slate-800 w-full max-w-lg p-5 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                INGEST OBSERVATION TO {deviceId.toUpperCase()}
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Indexes locally into device Qdrant Edge shard with automated privacy gate
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ingest Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
          <div>
            <label className="text-slate-300 font-bold block mb-1.5">
              OBSERVATION CONTENT / SEMANTIC MEMORY:
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. 'USB-C fast charger on office desk', 'Confidential project password', etc."
              className="w-full bg-[#090D17] border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium leading-relaxed"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-bold block mb-1.5">MEMORY MODALITY:</label>
              <select
                value={memoryType}
                onChange={(e) => setMemoryType(e.target.value)}
                className="w-full bg-[#090D17] border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="OBSERVATION">OBSERVATION</option>
                <option value="NOTE">NOTE</option>
                <option value="OBJECT">OBJECT DETECTED</option>
                <option value="IMAGE">CAMERA FRAME</option>
                <option value="EVENT">SECURITY EVENT</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1.5 flex items-center justify-between">
                <span>CONFIDENCE:</span>
                <span className="text-emerald-400 font-extrabold">{(confidence * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full mt-2 accent-blue-500 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1.5">
              PRIVACY POLICY ROUTING:
            </label>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setPrivacyTier('AUTO')}
                className={`py-2 px-2.5 rounded-xl border font-bold transition flex items-center justify-center gap-1 ${
                  privacyTier === 'AUTO'
                    ? 'bg-blue-600/25 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                    : 'bg-[#090D17] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                AUTO-CLASSIFY
              </button>
              <button
                type="button"
                onClick={() => setPrivacyTier('LOCAL_ONLY')}
                className={`py-2 px-2.5 rounded-xl border font-bold transition flex items-center justify-center gap-1 ${
                  privacyTier === 'LOCAL_ONLY'
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                    : 'bg-[#090D17] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                LOCAL ONLY
              </button>
              <button
                type="button"
                onClick={() => setPrivacyTier('SYNC_ALLOWED')}
                className={`py-2 px-2.5 rounded-xl border font-bold transition ${
                  privacyTier === 'SYNC_ALLOWED'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-[#090D17] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                SYNC ALLOWED
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
              * AUTO-CLASSIFY runs regex + NLP rules. Passwords, keys, and tokens are quarantined automatically.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50"
            >
              {isSubmitting ? 'INGESTING...' : 'COMMIT OBSERVATION'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewMemoryModal;
