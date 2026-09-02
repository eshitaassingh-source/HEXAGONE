import React from 'react';
import { VideoOff, Eye, Crosshair, AlertTriangle } from 'lucide-react';

export default function CameraPlaceholder() {
  return (
    <div className="tactical-panel camera-feed-placeholder rounded-none flex flex-col h-full min-h-[380px] border border-slate-800">
      {/* Top Telemetry Overlay */}
      <div className="panel-title-bar relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          <span className="text-cyan-400 font-mono-tech">CAM-01 // SECTOR-7 SURVEILLANCE</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono-tech text-slate-400">
          <span>FPS: --</span>
          <span>RES: 1080P HUD</span>
          <span className="text-amber-500 font-bold bg-amber-950/60 px-2 py-0.5 border border-amber-800">STANDBY</span>
        </div>
      </div>

      {/* Camera Viewport Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-6 text-center z-10 select-none">
        {/* Animated Radar Sweep Background */}
        <div className="radar-sweep"></div>

        {/* HUD Crosshair Center graphic */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full border border-cyan-500/30 flex items-center justify-center relative">
            <Crosshair className="w-12 h-12 text-cyan-400/60 animate-pulse" />
            <div className="absolute inset-0 border-t-2 border-b-2 border-cyan-400/40 rotate-45"></div>
          </div>
        </div>

        {/* Clear Placeholder Label */}
        <div className="max-w-md bg-slate-950/90 border border-slate-700/80 p-5 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-center gap-2 mb-2 text-amber-400 font-mono-tech">
            <VideoOff className="w-5 h-5" />
            <span className="text-xs uppercase tracking-widest font-bold">STREAM OFFLINE</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 uppercase tracking-widest font-mono-tech mb-2">
            LIVE CAMERA FEED — COMING SOON
          </h2>
          <p className="text-xs text-slate-400 font-mono-tech leading-relaxed">
            RTSP Video Stream ingestion pipeline pending hardware synchronization for Sector-07 border perimeter.
          </p>
        </div>

        {/* Tactical Corner Reticle Markers */}
        <div className="absolute top-4 left-4 text-[10px] font-mono-tech text-cyan-500/60">
          LAT: 31.5204° N <br /> LONG: 74.3587° E
        </div>
        <div className="absolute top-4 right-4 text-[10px] font-mono-tech text-cyan-500/60 text-right">
          ZOOM: 1.0X <br /> IR-NIGHT: AUTO
        </div>
        <div className="absolute bottom-4 left-4 text-[10px] font-mono-tech text-slate-500">
          [PERIMETER FENCE MONITORING]
        </div>
        <div className="absolute bottom-4 right-4 text-[10px] font-mono-tech text-slate-500">
          IBVAP-EDGE-NODE-01
        </div>
      </div>
    </div>
  );
}
