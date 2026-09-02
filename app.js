/**
 * IBVAP Tactical Border Surveillance Dashboard Application
 * Intelligence Border Video Analytics Platform Frontend Logic
 */

// Configuration & Endpoints
const API_BASE_URL = 'http://127.0.0.1:8000';
const POLL_INTERVAL_MS = 2500; // 2.5 seconds polling interval

// Global State
const state = {
  isOnline: false,
  alerts: [],
  seenAlertKeys: new Set(),
  firstLoadCompleted: false
};

// DOM Element References
const elements = {
  liveClock: document.getElementById('live-clock'),
  systemStatusBadge: document.getElementById('system-status-badge'),
  statusText: document.getElementById('status-text'),
  totalAlertBadge: document.getElementById('total-alert-badge'),
  statBackendStatus: document.getElementById('stat-backend-status'),
  statFenceCrossings: document.getElementById('stat-fence-crossings'),
  statLastTrackId: document.getElementById('stat-last-track-id'),
  alertsContainer: document.getElementById('alerts-container'),
  alertsPollLabel: document.getElementById('alerts-poll-label')
};

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

/**
 * Format ISO timestamp into readable tactical format YYYY-MM-DD HH:MM:SS
 */
function formatTimestamp(isoStr) {
  if (!isoStr) return '--:--:--';
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return isoStr; // Fallback to raw string if invalid
    
    const pad = (n) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const mins = pad(date.getMinutes());
    const secs = pad(date.getSeconds());
    
    return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
  } catch (e) {
    return isoStr;
  }
}

/**
 * Format alert type into clean human-readable title (e.g. fence_crossing -> Fence Crossing)
 */
function formatAlertType(alertType) {
  if (!alertType) return 'SECURITY ALERT';
  return alertType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Generate unique key for deduplication & new alert detection
 */
function getAlertKey(alert) {
  return `${alert.track_id}_${alert.timestamp}_${alert.alert_type}`;
}

/**
 * Check if a timestamp belongs to today (local date)
 */
function isToday(timestampStr) {
  if (!timestampStr) return false;
  const alertDate = new Date(timestampStr);
  const today = new Date();
  return (
    alertDate.getDate() === today.getDate() &&
    alertDate.getMonth() === today.getMonth() &&
    alertDate.getFullYear() === today.getFullYear()
  );
}

// ==========================================================================
// LIVE CLOCK & TICKER
// ==========================================================================
function updateClock() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timeString = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  if (elements.liveClock) {
    elements.liveClock.textContent = timeString;
  }
}

// ==========================================================================
// BACKEND HEALTH POLL (GET /)
// ==========================================================================
async function pollSystemStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(2000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.status) {
        setSystemOnline(true);
        return;
      }
    }
    setSystemOnline(false);
  } catch (err) {
    setSystemOnline(false);
  }
}

function setSystemOnline(online) {
  state.isOnline = online;
  if (online) {
    elements.systemStatusBadge.className = 'status-badge online';
    elements.statusText.textContent = 'ONLINE';
    elements.statBackendStatus.textContent = 'ONLINE';
    elements.statBackendStatus.className = 'stat-value mono text-green';
  } else {
    elements.systemStatusBadge.className = 'status-badge offline';
    elements.statusText.textContent = 'OFFLINE';
    elements.statBackendStatus.textContent = 'OFFLINE';
    elements.statBackendStatus.className = 'stat-value mono text-danger';
  }
}

// ==========================================================================
// ALERTS FEED POLL (GET /alerts)
// ==========================================================================
async function pollAlerts() {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(2000)
    });

    if (response.ok) {
      const alertsData = await response.json();
      if (Array.isArray(alertsData)) {
        processAlerts(alertsData);
      }
    }
  } catch (err) {
    // If backend fails during fetch, keep existing state or handle silently
    console.warn('[IBVAP] Alerts fetch error:', err.message);
  }
}

function processAlerts(fetchedAlerts) {
  // Sort alerts newest first (descending timestamp or track_id)
  const sortedAlerts = [...fetchedAlerts].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime() || 0;
    const timeB = new Date(b.timestamp).getTime() || 0;
    return timeB - timeA;
  });

  // Determine new incoming alerts
  const newAlertKeysThisPoll = new Set();
  sortedAlerts.forEach(alert => {
    const key = getAlertKey(alert);
    if (!state.seenAlertKeys.has(key)) {
      newAlertKeysThisPoll.add(key);
    }
  });

  // Update global state
  state.alerts = sortedAlerts;

  // Update Stats Strip & Badges
  updateDashboardStats(sortedAlerts);

  // Render Alerts List
  renderAlertsFeed(sortedAlerts, newAlertKeysThisPoll);

  // Mark all current keys as seen
  sortedAlerts.forEach(alert => {
    state.seenAlertKeys.add(getAlertKey(alert));
  });

  state.firstLoadCompleted = true;
}

// ==========================================================================
// STATS STRIP UPDATES
// ==========================================================================
function updateDashboardStats(alerts) {
  // Total alerts count
  const totalCount = alerts.length;
  elements.totalAlertBadge.textContent = totalCount;

  // Total fence-crossing alerts today
  const fenceCrossingsToday = alerts.filter(a => {
    const isFenceCrossing = a.alert_type && a.alert_type.toLowerCase() === 'fence_crossing';
    return isFenceCrossing && isToday(a.timestamp);
  }).length;
  
  elements.statFenceCrossings.textContent = fenceCrossingsToday;

  // Most recently tracked person ID
  if (alerts.length > 0) {
    const latestTrackId = alerts[0].track_id;
    elements.statLastTrackId.textContent = `#${latestTrackId}`;
  } else {
    elements.statLastTrackId.textContent = 'N/A';
  }
}

// ==========================================================================
// ALERTS RENDERER
// ==========================================================================
function renderAlertsFeed(alerts, newKeysSet) {
  if (alerts.length === 0) {
    elements.alertsContainer.innerHTML = `
      <div class="feed-empty-state">
        <div class="empty-radar-ping"></div>
        <p class="empty-title mono">NO ACTIVE ALERTS DETECTED</p>
        <p class="empty-sub mono">MONITORING BORDER PERIMETER FOR ANOMALIES...</p>
      </div>
    `;
    return;
  }

  // Build HTML fragment for alerts
  const alertCardsHtml = alerts.map(alert => {
    const key = getAlertKey(alert);
    // Give flash highlight animation if it's new (and not on initial empty load if desired)
    const isNew = newKeysSet.has(key) && state.firstLoadCompleted;
    const alertTypeFormatted = formatAlertType(alert.alert_type);
    const formattedTime = formatTimestamp(alert.timestamp);

    return `
      <div class="alert-card ${isNew ? 'new-alert' : ''}" data-key="${key}">
        <div class="alert-card-header">
          <div class="alert-type-badge">
            <span class="alert-type-icon"></span>
            <span>${alertTypeFormatted}</span>
          </div>
          <div class="track-id-badge">
            TRACK ID: #${alert.track_id}
          </div>
        </div>
        <div class="alert-card-footer">
          <span class="alert-timestamp">TIMESTAMP: ${formattedTime}</span>
          <span class="alert-sector-tag">SECTOR 04</span>
        </div>
      </div>
    `;
  }).join('');

  elements.alertsContainer.innerHTML = alertCardsHtml;
}

// ==========================================================================
// INITIALIZATION & POLLING LOOP
// ==========================================================================
function initDashboard() {
  console.log('[IBVAP] Initializing Tactical Surveillance Dashboard...');
  
  // Start live clock
  updateClock();
  setInterval(updateClock, 1000);

  // Initial poll calls
  pollSystemStatus();
  pollAlerts();

  // Setup recurring polling loop
  setInterval(() => {
    pollSystemStatus();
    pollAlerts();
  }, POLL_INTERVAL_MS);
}

// Boot application when DOM is ready
document.addEventListener('DOMContentLoaded', initDashboard);
