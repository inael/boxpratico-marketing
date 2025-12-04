// Monitor tracking system using localStorage with heartbeat
const HEARTBEAT_INTERVAL = 5000; // 5 seconds
const MONITOR_TIMEOUT = 15000; // 15 seconds - if no heartbeat, consider monitor offline

export interface ActiveMonitor {
  monitorId: string;
  campaignId: string;
  lastHeartbeat: number;
}

// Start sending heartbeats for a monitor viewing a campaign
export function startMonitorHeartbeat(campaignId: string): () => void {
  const monitorId = `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const sendHeartbeat = () => {
    const monitors = getActiveMonitors();
    const existingIndex = monitors.findIndex(m => m.monitorId === monitorId);

    const monitor: ActiveMonitor = {
      monitorId,
      campaignId,
      lastHeartbeat: Date.now(),
    };

    if (existingIndex >= 0) {
      monitors[existingIndex] = monitor;
    } else {
      monitors.push(monitor);
    }

    localStorage.setItem('active_monitors', JSON.stringify(monitors));
  };

  // Send initial heartbeat
  sendHeartbeat();

  // Send heartbeat every interval
  const intervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

  // Cleanup function
  return () => {
    clearInterval(intervalId);
    removeMonitor(monitorId);
  };
}

// Get all active monitors (filter out expired ones)
export function getActiveMonitors(): ActiveMonitor[] {
  try {
    const data = localStorage.getItem('active_monitors');
    if (!data) return [];

    const monitors: ActiveMonitor[] = JSON.parse(data);
    const now = Date.now();

    // Filter out expired monitors
    const activeMonitors = monitors.filter(m => (now - m.lastHeartbeat) < MONITOR_TIMEOUT);

    // Update localStorage with filtered list
    if (activeMonitors.length !== monitors.length) {
      localStorage.setItem('active_monitors', JSON.stringify(activeMonitors));
    }

    return activeMonitors;
  } catch {
    return [];
  }
}

// Get active monitors for a specific campaign
export function getActiveMonitorsForCampaign(campaignId: string): ActiveMonitor[] {
  return getActiveMonitors().filter(m => m.campaignId === campaignId);
}

// Remove a specific monitor
function removeMonitor(monitorId: string): void {
  const monitors = getActiveMonitors();
  const filtered = monitors.filter(m => m.monitorId !== monitorId);
  localStorage.setItem('active_monitors', JSON.stringify(filtered));
}

// Get count of active monitors per campaign
export function getMonitorCountsByCampaign(): Record<string, number> {
  const monitors = getActiveMonitors();
  const counts: Record<string, number> = {};

  for (const monitor of monitors) {
    counts[monitor.campaignId] = (counts[monitor.campaignId] || 0) + 1;
  }

  return counts;
}
