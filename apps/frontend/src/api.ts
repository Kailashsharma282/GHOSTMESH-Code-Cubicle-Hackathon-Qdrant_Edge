import {
  DeviceState,
  MemoryRecord,
  SyncQueueItem,
  ConflictCandidate,
  ReconciliationDecision,
  SearchResultItem,
  SystemStats,
} from './types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '';

export async function fetchDevices(): Promise<DeviceState[]> {
  const res = await fetch(`${BASE_URL}/api/devices`);
  if (!res.ok) throw new Error('Failed to fetch devices');
  return res.json();
}

export async function connectDevice(deviceId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceId}/connect`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to connect device');
  return res.json();
}

export async function disconnectDevice(deviceId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceId}/disconnect`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to disconnect device');
  return res.json();
}

export async function fetchDeviceMemories(deviceId: string): Promise<MemoryRecord[]> {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceId}/memories?limit=100`);
  if (!res.ok) throw new Error('Failed to fetch device memories');
  return res.json();
}

export async function createDeviceMemory(
  deviceId: string,
  content: string,
  memory_type: string = 'TEXT',
  confidence: number = 0.85,
  privacy_tier?: string | null
): Promise<MemoryRecord> {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceId}/memories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      memory_type,
      confidence,
      privacy_tier: privacy_tier || undefined,
    }),
  });
  if (!res.ok) throw new Error('Failed to ingest memory');
  return res.json();
}

export async function searchDeviceLocal(
  deviceId: string,
  query: string
): Promise<SearchResultItem[]> {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceId}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit: 10 }),
  });
  if (!res.ok) throw new Error('Failed to search local device');
  return res.json();
}

export async function fetchDeviceSyncQueue(deviceId: string): Promise<SyncQueueItem[]> {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceId}/sync-queue`);
  if (!res.ok) throw new Error('Failed to fetch sync queue');
  return res.json();
}

export async function triggerDeviceSync(deviceId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceId}/sync`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger sync');
  return res.json();
}

export async function fetchConflicts(status?: string): Promise<ConflictCandidate[]> {
  const url = status ? `${BASE_URL}/api/conflicts?status=${status}` : `${BASE_URL}/api/conflicts`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch conflicts');
  return res.json();
}

export async function fetchDecisions(): Promise<ReconciliationDecision[]> {
  const res = await fetch(`${BASE_URL}/api/conflicts/decisions`);
  if (!res.ok) throw new Error('Failed to fetch decisions');
  return res.json();
}

export async function resolveConflict(
  conflictGroupId: string,
  action: string,
  customCanonicalText?: string
): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/conflicts/${conflictGroupId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, custom_canonical_text: customCanonicalText }),
  });
  if (!res.ok) throw new Error('Failed to resolve conflict');
  return res.json();
}

export async function searchMesh(
  query: string,
  mode: 'LOCAL' | 'CLOUD' | 'MERGED' = 'MERGED',
  deviceId?: string
): Promise<SearchResultItem[]> {
  const res = await fetch(`${BASE_URL}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      mode,
      device_id: deviceId || undefined,
      limit: 15,
    }),
  });
  if (!res.ok) throw new Error('Failed to search mesh');
  return res.json();
}

export async function fetchCloudMemories(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/api/memories/cloud`);
  if (!res.ok) throw new Error('Failed to fetch cloud memories');
  return res.json();
}

export async function fetchMemoryProvenance(memoryId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/memories/${memoryId}/provenance`);
  if (!res.ok) throw new Error('Failed to fetch provenance');
  return res.json();
}

export async function fetchPrivacyPolicies(): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/privacy/policies`);
  if (!res.ok) throw new Error('Failed to fetch privacy policies');
  return res.json();
}

export async function previewPrivacyClassification(content: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/privacy/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Failed to preview classification');
  return res.json();
}

export async function fetchSystemStats(): Promise<SystemStats> {
  const res = await fetch(`${BASE_URL}/api/system/stats`);
  if (!res.ok) throw new Error('Failed to fetch system stats');
  return res.json();
}

export async function resetSystem(): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/system/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset system');
  return res.json();
}

export async function runScenario(scenario: 'offline' | 'conflict' | 'privacy' | 'full'): Promise<any> {
  const endpointMap = {
    offline: '/api/scenarios/run/offline-demo',
    conflict: '/api/scenarios/run/conflict-demo',
    privacy: '/api/scenarios/run/privacy-demo',
    full: '/api/scenarios/run/full-demo',
  };
  const res = await fetch(`${BASE_URL}${endpointMap[scenario]}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to run scenario ${scenario}`);
  return res.json();
}
