import React, { useState } from 'react';
import { Clock, ShieldAlert, GitMerge, WifiOff, HardDrive, CheckCircle2, ChevronRight } from 'lucide-react';
import { LiveEvent } from '../types';

interface TimelineViewProps {
  events: LiveEvent[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  const [selectedEvent, setSelectedEvent] = useState<LiveEvent | null>(
    events.length > 0 ? events[events.length - 1] : null
  );

  const getEventBadge = (type: string) => {
    if (type.includes('privacy')) {
      return {
        icon: ShieldAlert,
        color: 'text-rose-400',
        bg: 'bg-rose-950/60 border-rose-800/80',
        label: 'PRIVACY',
      };
    }
    if (type.includes('reconciliation') || type.includes('merged')) {
      return {
        icon: GitMerge,
        color: 'text-purple-400',
        bg: 'bg-purple-950/60 border-purple-800/80',
        label: 'RECONCILE',
      };
    }
    if (type.includes('disconnect') || type.includes('offline')) {
      return {
        icon: WifiOff,
        color: 'text-rose-400',
        bg: 'bg-rose-950/60 border-rose-800/80',
        label: 'PARTITION',
      };
    }
    if (type.includes('sync')) {
      return {
        icon: CheckCircle2,
        color: 'text-cyan-400',
        bg: 'bg-cyan-950/60 border-cyan-800/80',
        label: 'SYNC',
      };
    }
    return {
      icon: HardDrive,
      color: 'text-blue-400',
      bg: 'bg-blue-950/60 border-blue-800/80',
      label: 'SHARD',
    };
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#05070B] p-4 lg:p-5 gap-3.5 overflow-hidden">
      {/* Header */}
      <div className="glass-card rounded-2xl p-4 flex items-center justify-between shadow-lg border border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2 tracking-wide">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
            DISTRIBUTED MEMORY AUDIT TIMELINE
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Chronological log of edge observations, offline partitions, sync flushes, and reconciliations
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-cyan-400 font-bold">
          {events.length} LOGGED EVENTS
        </span>
      </div>

      {/* Main Split: Timeline list + Payload inspector */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
        {/* Timeline Event Cards */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-slate-800 overflow-y-auto p-4 space-y-2.5 shadow-xl">
          {events.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">No events recorded yet.</div>
          ) : (
            events.map((evt) => {
              const isSelected = selectedEvent?.event_id === evt.event_id;
              const badge = getEventBadge(evt.event_type);
              const Icon = badge.icon;

              return (
                <div
                  key={evt.event_id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                      : 'bg-[#090D17] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${badge.bg} ${badge.color} border shrink-0 mt-0.5`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{evt.event_type}</span>
                        {evt.device_id && (
                          <span className="px-2 py-0.2 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-cyan-300 font-bold font-mono">
                            {evt.device_id.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {evt.timestamp.split('T')[1]?.slice(0, 8)}
                      </span>
                    </div>

                    {evt.details?.canonical_content && (
                      <p className="text-xs text-emerald-300 font-semibold mt-1">
                        → Merged: "{evt.details.canonical_content}"
                      </p>
                    )}
                    {evt.details?.content_preview && (
                      <p className="text-xs text-slate-300 font-medium mt-1">
                        "{evt.details.content_preview}"
                      </p>
                    )}
                    {evt.details?.explanation && (
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        {evt.details.explanation}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-600 self-center" />
                </div>
              );
            })
          )}
        </div>

        {/* Selected Event Payload Inspector */}
        <div className="glass-card rounded-2xl border border-slate-800 p-4 flex flex-col gap-3 overflow-y-auto shadow-xl">
          <div className="border-b border-slate-800/80 pb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Event Details & Payload Inspector
            </span>
            <h3 className="text-sm font-extrabold text-white mt-1">
              {selectedEvent ? selectedEvent.event_type : 'Select an Event'}
            </h3>
          </div>

          {selectedEvent ? (
            <div className="space-y-3 text-xs">
              <div className="bg-[#090D17] p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Event ID</span>
                <span className="font-mono text-cyan-400 text-xs mt-0.5 block">
                  {selectedEvent.event_id}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#090D17] p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Device ID</span>
                  <span className="font-semibold text-white text-xs mt-0.5 block">
                    {selectedEvent.device_id || 'CORE (GLOBAL)'}
                  </span>
                </div>
                <div className="bg-[#090D17] p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Timestamp</span>
                  <span className="font-semibold text-slate-300 text-xs mt-0.5 block">
                    {selectedEvent.timestamp}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1.5">
                  Payload Metadata (JSON)
                </span>
                <pre className="bg-[#070A12] border border-slate-800 p-3 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed">
                  {JSON.stringify(selectedEvent.details, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs">
              Click an event on the left to inspect its telemetry payload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
