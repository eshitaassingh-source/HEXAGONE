import React from 'react';
import { AlertTriangle, Fence, ShieldAlert, User, Clock, BellRing } from 'lucide-react';

function formatTimestamp(rawTimestamp) {
  if (!rawTimestamp) return '--:--:--';
  try {
    const date = new Date(rawTimestamp);
    if (isNaN(date.getTime())) return rawTimestamp;
    
    // Format as YYYY-MM-DD HH:MM:SS
    const pad = (n) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const mins = pad(date.getMinutes());
    const secs = pad(date.getSeconds());
    
    return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
  } catch (e) {
    return rawTimestamp;
  }
}

function formatAlertType(alertType) {
  if (!alertType) return 'SECURITY ALERT';
  return alertType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function AlertsFeed({ alerts, newAlertKeys }) {
  return (
    <div className="tactical-panel flex flex-col h-full min-h-[380px] border border-slate-800">
      {/* Feed Header Bar */}
      <div className="panel-title-bar flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-red-500 animate-bounce" />
          <span className="text-slate-200">REALTIME ALERTS FEED</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono-tech text-slate-400">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span>LIVE STREAM</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400 font-bold">{alerts.length} RECORDED</span>
        </div>
      </div>

      {/* Alerts Scrollable Feed Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[500px]">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 font-mono-tech">
            <ShieldAlert className="w-10 h-10 mb-2 text-slate-700" />
            <p>NO ALERTS DETECTED YET</p>
            <p className="text-xs text-slate-600">POLLING BACKEND FOR INCIDENTS...</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isNew = newAlertKeys.has(alert._key);
            const formattedTime = formatTimestamp(alert.timestamp);
            const formattedType = formatAlertType(alert.alert_type);

            return (
              <div
                key={alert._key}
                className={`tactical-panel p-3 border border-slate-800 transition-all duration-300 ${
                  isNew ? 'flash-new-alert' : 'bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left Icon & Alert Details */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-950/80 border border-red-800 text-red-400 mt-0.5">
                      <Fence className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold font-mono-tech px-2 py-0.5 bg-red-950/80 text-red-400 border border-red-900/60 uppercase">
                          {formattedType}
                        </span>
                        {isNew && (
                          <span className="text-[10px] font-bold font-mono-tech px-1.5 py-0.5 bg-amber-500 text-slate-950 uppercase animate-pulse">
                            NEW ALERT
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm font-mono-tech">
                        <div className="flex items-center gap-1 text-slate-200">
                          <User className="w-3.5 h-3.5 text-cyan-400" />
                          <span>TARGET TRACK ID:</span>
                          <span className="font-bold text-cyan-300">
                            #{String(alert.track_id).padStart(4, '0')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Timestamp Badge */}
                  <div className="text-right font-mono-tech">
                    <div className="flex items-center justify-end gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{formattedTime}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 uppercase">
                      SEC-07 // CAM-01
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
