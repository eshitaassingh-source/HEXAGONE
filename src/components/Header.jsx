import React from 'react';
import { ShieldAlert, Radio, Clock, Database, Activity } from 'lucide-react';

export default function Header({ systemOnline, totalAlerts, currentTime }) {
  return (
    <header className="tactical-panel bg-slate-950/80 border-b border-slate-800 px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-4">
      {/* Branding / Title */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-wider text-slate-100 uppercase">
              IBVAP <span className="text-cyan-400 text-sm font-mono-tech">// TACTICAL ANALYTICS</span>
            </h1>
            <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-cyan-400 border border-cyan-800 font-mono-tech">
              SYS-VER 2.4
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono-tech tracking-wide">
            INTELLIGENT BORDER VIDEO ANALYTICS PLATFORM
          </p>
        </div>
      </div>

      {/* Realtime Telemetry Indicators */}
      <div className="flex items-center gap-6 font-mono-tech">
        {/* System Status Indicator */}
        <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 border border-slate-800">
          <Radio className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 uppercase">SYS STATUS:</span>
          {systemOnline ? (
            <div className="flex items-center gap-2">
              <span className="pulse-online"></span>
              <span className="text-xs font-bold text-emerald-400 tracking-wider">ONLINE</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="pulse-offline"></span>
              <span className="text-xs font-bold text-red-500 tracking-wider">OFFLINE</span>
            </div>
          )}
        </div>

        {/* Total Alert Count */}
        <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 border border-slate-800">
          <Database className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 uppercase">TOTAL ALERTS:</span>
          <span className="text-sm font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 border border-amber-800/60">
            {totalAlerts}
          </span>
        </div>

        {/* Live System Time Display */}
        <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 border border-slate-800">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-400 uppercase">SYS TIME:</span>
          <span className="text-sm font-bold text-cyan-300">
            {currentTime}
          </span>
        </div>
      </div>
    </header>
  );
}
