import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { LiveEvent } from '../types';

interface TimelineViewProps {
  events: LiveEvent[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  const [selectedEvent, setSelectedEvent] = useState<LiveEvent | null>(
    events.length > 0 ? events[events.length - 1] : null
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080A0D] p-4 gap-4 overflow-hidden font-mono">
      {/* Header */}
      <div className="bg-[#0C0F15] border border-[#1E2533] p-4 rounded flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            DISTRIBUTED MEMORY EVENT TIMELINE
          </h2>
          <p className="text-xs text-slate-500">
            Chronological audit of observation creation, offline partitions, sync drains, and reconciliations
          </p>
        </div>
        <span className="text-xs text-slate-400 font-bold">{events.length} LOGGED EVENTS</span>
      </div>

      {/* Main Split: Timeline list + Payload inspector */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
        {/* Timeline Event Cards */}
        <div className="lg:col-span-2 border border-[#1E2533] rounded bg-[#0A0D13] overflow-y-auto p-4 space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-16 text-slate-500">No events recorded yet.</div>
          ) : (
            events.map((evt) => {
              const isSelected = selectedEvent?.event_id === evt.event_id;
              const isReconcile = evt.event_type.includes('reconciliation') || evt.event_type.includes('merged');
              const isOffline = evt.event_type === 'device.disconnected';

              return (
                <div
                  key={evt.event_id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-3 rounded border cursor-pointer transition flex items-start gap-3 ${
                    isSelected
                      ? 'bg-[#141A26] border-blue-500'
                      : isOffline
                      ? 'bg-rose-950/20 border-rose-900/40 hover:bg-rose-950/30'
                      : isReconcile
                      ? 'bg-purple-950/20 border-purple-900/40 hover:bg-purple-950/30'
                      : 'bg-[#0E121A] border-[#1E2533] hover:border-[#283244]'
                  }`}
                >
                  <div className="text-slate-500 text-[11px] pt-0.5 whitespace-nowrap">
                    {evt.timestamp.split('T')[1]?.slice(0, 8)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">{evt.event_type}</span>
                        {evt.device_id && (
                          <span className="px-1.5 py-0.2 rounded bg-[#161B26] border border-[#283244] text-[10px] text-blue-300">
                            {evt.device_id.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">{evt.event_id}</span>
                    </div>

                    {evt.details?.canonical_content && (
                      <p className="text-xs text-emerald-400 font-sans mt-1">
                        Canonical: "{evt.details.canonical_content}"
                      </p>
                    )}
                    {evt.details?.content_preview && (
                      <p className="text-xs text-slate-300 font-sans mt-1">
                        "{evt.details.content_preview}"
                      </p>
                    )}
                    {evt.details?.explanation && (
                      <p className="text-xs text-slate-400 font-sans mt-1">
                        {evt.details.explanation}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Event Payload Inspector */}
        <div className="border border-[#1E2533] rounded bg-[#0A0D13] p-4 flex flex-col gap-3 overflow-y-auto">
          <div className="border-b border-[#1E2533] pb-2">
            <span className="text-xs text-slate-500">EVENT PAYLOAD INSPECTOR</span>
            <h3 className="text-sm font-bold text-slate-100 mt-1">
              {selectedEvent ? selectedEvent.event_type : 'No Event Selected'}
            </h3>
          </div>

          {selectedEvent ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">EVENT ID:</span>
                <span className="text-slate-200">{selectedEvent.event_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">TIMESTAMP:</span>
                <span className="text-slate-200">{selectedEvent.timestamp}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SOURCE NODE:</span>
                <span className="text-blue-400 font-bold">
                  {selectedEvent.device_id || 'MESH CORE CLUSTER'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] mb-1">RAW JSON PAYLOAD:</span>
                <pre className="p-3 rounded bg-[#080A0E] border border-[#1E2533] text-[11px] text-emerald-400 overflow-x-auto">
                  {JSON.stringify(selectedEvent.details, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-xs py-12 text-center">
              Click any event in the timeline to inspect metadata.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
