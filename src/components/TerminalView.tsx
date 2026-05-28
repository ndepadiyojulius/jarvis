import React, { useEffect, useRef } from "react";
import { Terminal, Shield, RefreshCw } from "lucide-react";
import { LogEntry } from "../types";

interface TerminalViewProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export default function TerminalView({ logs, onClearLogs }: TerminalViewProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const logColor = (type: "info" | "success" | "warning" | "error") => {
    switch (type) {
      case "success": return "text-emerald-400";
      case "warning": return "text-amber-400";
      case "error": return "text-red-400 font-bold";
      case "info": default: return "text-cyan-400/80";
    }
  };

  return (
    <div
      id="hud-terminal-block"
      className="p-5 bg-slate-950/40 rounded-3xl border border-cyan-500/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col h-full font-mono min-h-60"
    >
      {/* Title */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyan-500/10">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            DIAGNOSTIC LOG STREAM
          </span>
        </div>
        <button
          onClick={onClearLogs}
          className="text-[9px] text-slate-500 hover:text-cyan-400 uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RefreshCw className="w-2.5 h-2.5" /> Purge Cache
        </button>
      </div>

      {/* Log list terminal box */}
      <div className="flex-1 bg-slate-950/80 rounded-xl p-3 border border-slate-900 border-t-2 border-t-cyan-500/30 overflow-y-auto max-h-64 text-[10px] space-y-1.5 custom-scrollbar font-mono leading-relaxed">
        {logs.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-slate-600">
            <Shield className="w-5 h-5 mb-1.5 opacity-40 text-cyan-500/50" />
            <span className="text-[9px] uppercase tracking-widest">Awaiting active system telemetry feed...</span>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-2 items-start hover:bg-slate-900/40 transition-colors py-0.5 rounded px-1">
              <span className="text-slate-600 select-none">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
              <span className="text-cyan-500 select-none font-bold">
                [{log.emitter}]
              </span>
              <span className={`flex-1 break-words ${logColor(log.type)}`}>
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Legend */}
      <div className="mt-3 flex gap-3 text-[9px] text-slate-500 justify-end">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80"></span> INFO</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> SUCCESS</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> WARNING</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> CRITICAL</span>
      </div>
    </div>
  );
}
