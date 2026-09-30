import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm font-mono">
      <div className="bg-[#0C0F15] border border-[#1E2533] rounded w-full max-w-lg p-5 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E2533] pb-3">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-slate-100">
              RECORD OBSERVATION TO {deviceId.toUpperCase()}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#1E2533] text-slate-400 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ingest Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">OBSERVATION TEXT / CONTENT:</label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. 'USB-C adapter on office desk', 'Confidential password', etc."
              className="w-full bg-[#121622] border border-[#1E2533] rounded p-2.5 text-slate-100 focus:outline-none focus:border-blue-500 font-sans"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">MEMORY TYPE:</label>
              <select
                value={memoryType}
                onChange={(e) => setMemoryType(e.target.value)}
                className="w-full bg-[#121622] border border-[#1E2533] rounded p-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="OBSERVATION">OBSERVATION</option>
                <option value="NOTE">NOTE</option>
                <option value="OBJECT">OBJECT</option>
                <option value="IMAGE">IMAGE OBSERVATION</option>
                <option value="EVENT">EVENT</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">
                CONFIDENCE: {(confidence * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">PRIVACY CLASSIFICATION:</label>
            <select
              value={privacyTier}
              onChange={(e) => setPrivacyTier(e.target.value)}
              className="w-full bg-[#121622] border border-[#1E2533] rounded p-2 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="AUTO">AUTO (Deterministic Policy Engine Classifier)</option>
              <option value="LOCAL_ONLY">FORCE LOCAL_ONLY (Edge Quarantine)</option>
              <option value="SYNC_ALLOWED">FORCE SYNC_ALLOWED</option>
              <option value="PUBLIC_SYNC">FORCE PUBLIC_SYNC</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E2533]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-[#161B26] hover:bg-[#1E2533] text-slate-300 font-bold transition"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? 'EMBEDDING & STORING...' : 'STORE TO EDGE SHARD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
