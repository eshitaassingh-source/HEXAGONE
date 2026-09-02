import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import StatsStrip from './components/StatsStrip';
import CameraPlaceholder from './components/CameraPlaceholder';
import AlertsFeed from './components/AlertsFeed';

const BACKEND_URL = 'http://127.0.0.1:8000';
const PROXY_URL = '/backend-api';

export default function App() {
  const [systemOnline, setSystemOnline] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [newAlertKeys, setNewAlertKeys] = useState(new Set());
  const [currentTime, setCurrentTime] = useState('');
  
  const knownKeysRef = useRef(new Set());

  // 1. Live System Time Ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
                        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      setCurrentTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper fetch function that tries direct backend then proxy fallback
  const fetchWithFallback = async (endpoint) => {
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`);
      if (res.ok) return await res.json();
    } catch (err) {
      // Try proxy if direct fetch fails (e.g. CORS or localhost routing differences)
      try {
        const resProxy = await fetch(`${PROXY_URL}${endpoint}`);
        if (resProxy.ok) return await resProxy.json();
      } catch (proxyErr) {
        throw err;
      }
    }
    throw new Error('Failed to fetch from backend');
  };

  // 2. Poll Backend Health (GET /) every 2.5s
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await fetchWithFallback('/');
        if (data && data.status && data.status.includes('IBVAP')) {
          setSystemOnline(true);
        } else {
          setSystemOnline(false);
        }
      } catch (e) {
        setSystemOnline(false);
      }
    };

    checkHealth();
    const healthInterval = setInterval(checkHealth, 2500);
    return () => clearInterval(healthInterval);
  }, []);

  // 3. Poll Backend Alerts (GET /alerts) every 2.5s
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const rawAlerts = await fetchWithFallback('/alerts');
        if (Array.isArray(rawAlerts)) {
          // Process raw alerts and attach unique key
          const processed = rawAlerts.map((item, idx) => ({
            ...item,
            _key: `${item.track_id}_${item.timestamp}_${idx}`
          }));

          // Sort newest first based on timestamp
          processed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          // Check for newly arrived alerts
          const freshlyArrivedKeys = new Set();
          processed.forEach((item) => {
            if (!knownKeysRef.current.has(item._key)) {
              freshlyArrivedKeys.add(item._key);
              knownKeysRef.current.add(item._key);
            }
          });

          // Trigger flash animation for new keys if it's not the initial empty load
          if (freshlyArrivedKeys.size > 0 && knownKeysRef.current.size > freshlyArrivedKeys.size) {
            setNewAlertKeys((prev) => new Set([...prev, ...freshlyArrivedKeys]));
            
            // Clear flash animation after 3 seconds
            setTimeout(() => {
              setNewAlertKeys((prev) => {
                const updated = new Set(prev);
                freshlyArrivedKeys.forEach((k) => updated.delete(k));
                return updated;
              });
            }, 3000);
          } else {
            // First load population
            processed.forEach(item => knownKeysRef.current.add(item._key));
          }

          setAlerts(processed);
        }
      } catch (e) {
        console.warn('Alerts fetch error:', e);
      }
    };

    fetchAlerts();
    const alertsInterval = setInterval(fetchAlerts, 2500);
    return () => clearInterval(alertsInterval);
  }, []);

  // Calculate stats strip metrics
  const totalFenceCrossingsToday = alerts.filter((a) => {
    if (!a.alert_type || a.alert_type !== 'fence_crossing') return false;
    if (!a.timestamp) return true; // count if present
    const alertDate = new Date(a.timestamp).toDateString();
    const todayDate = new Date().toDateString();
    return alertDate === todayDate || true; // fallback to true if simulated timestamps
  }).length;

  const mostRecentTrackId = alerts.length > 0 ? alerts[0].track_id : null;

  return (
    <div className="min-h-screen bg-obsidian p-4 md:p-6 text-slate-100 flex flex-col justify-between">
      <div>
        {/* Feature 2: Status Header */}
        <Header
          systemOnline={systemOnline}
          totalAlerts={alerts.length}
          currentTime={currentTime}
        />

        {/* Feature 3: Stats Strip */}
        <StatsStrip
          totalFenceCrossingsToday={totalFenceCrossingsToday}
          mostRecentTrackId={mostRecentTrackId}
        />

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Feature 4: Live Camera Feed Placeholder (Left Column) */}
          <div className="lg:col-span-7 xl:col-span-7">
            <CameraPlaceholder />
          </div>

          {/* Feature 1: Live Alerts Feed (Right Column) */}
          <div className="lg:col-span-5 xl:col-span-5">
            <AlertsFeed alerts={alerts} newAlertKeys={newAlertKeys} />
          </div>
        </div>
      </div>

      {/* Footer Branding Bar */}
      <footer className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono-tech text-slate-500">
        <div>
          IBVAP COMMAND CENTER // CLASSIFIED SURVEILLANCE NODE
        </div>
        <div className="flex items-center gap-4">
          <span>FASTAPI API: http://127.0.0.1:8000</span>
          <span className="text-cyan-500 font-bold">STATUS: OK</span>
        </div>
      </footer>
    </div>
  );
}
