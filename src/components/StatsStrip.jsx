import React from 'react';
import { Fence, UserCheck, ShieldAlert, Activity } from 'lucide-react';

export default function StatsStrip({ totalFenceCrossingsToday, mostRecentTrackId }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      {/* Metric 1: Fence Crossing Alerts Today */}
      <div className="tactical-panel bg-slate-900/60 p-4 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-950/60 border border-red-800/80 text-red-400">
            <Fence className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-mono-tech uppercase tracking-wider">
              FENCE-CROSSING INCIDENTS (TODAY)
            </div>
            <div className="text-2xl font-bold font-mono-tech text-red-400 flex items-baseline gap-2">
              {totalFenceCrossingsToday}
              <span className="text-xs text-slate-500 font-normal">EVENTS LOGGED</span>
            </div>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <span className="text-[10px] text-red-500/80 bg-red-950/40 border border-red-900/50 px-2 py-1 font-mono-tech uppercase">
            HIGH THREAT ZONE
          </span>
        </div>
      </div>

      {/* Metric 2: Most Recently Tracked Person ID */}
      <div className="tactical-panel bg-slate-900/60 p-4 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-950/60 border border-cyan-800/80 text-cyan-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-mono-tech uppercase tracking-wider">
              MOST RECENTLY TRACKED PERSON
            </div>
            <div className="text-2xl font-bold font-mono-tech text-cyan-300 flex items-baseline gap-2">
              {mostRecentTrackId !== null && mostRecentTrackId !== undefined ? (
                <>
                  <span className="text-xs text-cyan-500">TRK-ID</span>
                  <span>#{String(mostRecentTrackId).padStart(4, '0')}</span>
                </>
              ) : (
                <span className="text-slate-600">NO TARGET</span>
              )}
            </div>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <span className="text-[10px] text-cyan-400/80 bg-cyan-950/40 border border-cyan-900/50 px-2 py-1 font-mono-tech uppercase">
            TARGET ACQUIRED
          </span>
        </div>
      </div>
    </div>
  );
}
