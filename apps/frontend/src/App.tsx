import React, { useState, useEffect, useRef } from 'react';
import { TopBar } from './components/TopBar';
import { RadarView } from './components/RadarView';
import { MemoriesView } from './components/MemoriesView';
import { SearchView } from './components/SearchView';
import { ReconciliationView } from './components/ReconciliationView';
import { PrivacyView } from './components/PrivacyView';
import { SyncView } from './components/SyncView';
import { TimelineView } from './components/TimelineView';
import { ForensicsView } from './components/ForensicsView';
import { SystemInfoView } from './components/SystemInfoView';
import { DeviceDetailModal } from './components/DeviceDetailModal';
import { NewMemoryModal } from './components/NewMemoryModal';

import {
  DeviceState,
  MemoryRecord,
  SyncQueueItem,
  ConflictCandidate,
  ReconciliationDecision,
  SystemStats,
  LiveEvent,
} from './types';

import {
  fetchDevices,
  connectDevice,
  disconnectDevice,
  fetchDeviceMemories,
  fetchCloudMemories,
  fetchConflicts,
  fetchDecisions,
  fetchSystemStats,
  fetchDeviceSyncQueue,
  triggerDeviceSync,
  resetSystem,
  runScenario,
} from './api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('radar');
  const [devices, setDevices] = useState<DeviceState[]>([]);
  const [allMemories, setAllMemories] = useState<MemoryRecord[]>([]);
  const [cloudMemories, setCloudMemories] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<ConflictCandidate[]>([]);
  const [decisions, setDecisions] = useState<ReconciliationDecision[]>([]);
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Modals
  const [selectedDevice, setSelectedDevice] = useState<DeviceState | null>(null);
  const [ingestDeviceId, setIngestDeviceId] = useState<string | null>(null);
  const [isScenarioRunning, setIsScenarioRunning] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Load all system data
  const loadSystemState = async () => {
    try {
      const [devs, sysStats, confs, decs, cloud] = await Promise.all([
        fetchDevices(),
        fetchSystemStats(),
        fetchConflicts(),
        fetchDecisions(),
        fetchCloudMemories(),
      ]);

      setDevices(devs);
      setStats(sysStats);
      setConflicts(confs);
      setDecisions(decs);
      setCloudMemories(cloud);

      // Fetch memories & queues for all 3 devices
      const memPromises = devs.map((d) => fetchDeviceMemories(d.device_id));
      const queuePromises = devs.map((d) => fetchDeviceSyncQueue(d.device_id));

      const memArrays = await Promise.all(memPromises);
      const queueArrays = await Promise.all(queuePromises);

      const flatMems = memArrays.flat().sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
      const flatQueues = queueArrays.flat().sort((a, b) => (b.created_at > a.created_at ? 1 : -1));

      setAllMemories(flatMems);
      setQueueItems(flatQueues);
    } catch (e) {
      console.error('Error loading GhostMesh system state:', e);
    }
  };

  // Connect WebSocket live event stream
  useEffect(() => {
    loadSystemState();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = (import.meta.env.VITE_WS_URL as string) || `${protocol}//${window.location.host}/ws/events`;

    const connectWs = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const parsed: LiveEvent = JSON.parse(event.data);
          setEvents((prev) => [...prev.slice(-100), parsed]);

          // Selective auto-refresh on state-changing events
          if (
            parsed.event_type.includes('memory') ||
            parsed.event_type.includes('sync') ||
            parsed.event_type.includes('device') ||
            parsed.event_type.includes('conflict') ||
            parsed.event_type.includes('reconciliation')
          ) {
            loadSystemState();
          }
        } catch (e) {
          console.error('Failed to parse WebSocket event:', e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWs, 2000);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    };

    connectWs();

    // Heartbeat poll every 8 seconds as backup
    const interval = setInterval(loadSystemState, 8000);

    return () => {
      clearInterval(interval);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Device connectivity toggle (Kill Network / Reconnect)
  const handleToggleConnect = async (deviceId: string, currentStatus: string) => {
    try {
      if (currentStatus === 'ONLINE') {
        await disconnectDevice(deviceId);
      } else {
        await connectDevice(deviceId);
      }
      loadSystemState();
    } catch (e) {
      console.error(e);
    }
  };

  // Sync trigger
  const handleTriggerSync = async (deviceId: string) => {
    try {
      await triggerDeviceSync(deviceId);
      loadSystemState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerSyncAll = async () => {
    for (const d of devices) {
      if (d.status === 'ONLINE') {
        await triggerDeviceSync(d.device_id);
      }
    }
    loadSystemState();
  };

  // Reset
  const handleReset = async () => {
    if (window.confirm('Reset all Qdrant Edge shards and Qdrant Cloud to clean baseline?')) {
      try {
        await resetSystem();
        loadSystemState();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Scenario Runner
  const handleRunScenario = async (scenario: 'offline' | 'conflict' | 'privacy' | 'full') => {
    setIsScenarioRunning(true);
    try {
      await runScenario(scenario);
      await loadSystemState();
      if (scenario === 'conflict') setActiveTab('reconciliation');
      if (scenario === 'privacy') setActiveTab('privacy');
      if (scenario === 'offline') setActiveTab('radar');
      if (scenario === 'full') setActiveTab('radar');
    } catch (e) {
      console.error(e);
    } finally {
      setIsScenarioRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#07090D] text-slate-100 font-sans select-none">
      {/* Top Header & Navigation */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        wsConnected={wsConnected}
        onReset={handleReset}
        onRunScenario={handleRunScenario}
        isScenarioRunning={isScenarioRunning}
      />

      {/* Main View Router */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'radar' && (
          <RadarView
            devices={devices}
            events={events}
            stats={stats}
            onToggleConnect={handleToggleConnect}
            onTriggerSync={handleTriggerSync}
            onOpenDeviceModal={(dev) => setSelectedDevice(dev)}
            onOpenNewMemoryModal={(devId) => setIngestDeviceId(devId)}
          />
        )}

        {activeTab === 'memories' && (
          <MemoriesView
            memories={allMemories}
            cloudMemories={cloudMemories}
            onSelectMemory={(mem) => {
              const dev = devices.find((d) => d.device_id === mem.device_id);
              if (dev) setSelectedDevice(dev);
            }}
          />
        )}

        {activeTab === 'search' && <SearchView />}

        {activeTab === 'reconciliation' && (
          <ReconciliationView
            conflicts={conflicts}
            decisions={decisions}
            onRefresh={loadSystemState}
          />
        )}

        {activeTab === 'privacy' && <PrivacyView memories={allMemories} />}

        {activeTab === 'sync' && (
          <SyncView
            queueItems={queueItems}
            devices={devices}
            onTriggerSyncAll={handleTriggerSyncAll}
          />
        )}

        {activeTab === 'timeline' && <TimelineView events={events} />}

        {activeTab === 'forensics' && <ForensicsView decisions={decisions} />}

        {activeTab === 'system' && <SystemInfoView stats={stats} />}
      </main>

      {/* Device Inspector Modal */}
      <DeviceDetailModal
        device={selectedDevice}
        onClose={() => setSelectedDevice(null)}
        onToggleConnect={handleToggleConnect}
      />

      {/* Ingest Memory Modal */}
      <NewMemoryModal
        deviceId={ingestDeviceId}
        onClose={() => setIngestDeviceId(null)}
        onCreated={loadSystemState}
      />
    </div>
  );
};
export default App;
