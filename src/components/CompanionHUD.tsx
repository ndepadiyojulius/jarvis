import React, { useState, useEffect, useRef } from "react";
import { Cpu, HardDrive } from "lucide-react";

interface CompanionHUDProps {
  cpuUsage: number;
  memoryUsage: number;
  isAlertActive: boolean;
  systemName: string;
}

export default function CompanionHUD({
  cpuUsage,
  memoryUsage,
  isAlertActive,
  systemName,
}: CompanionHUDProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const [animatedRot, setAnimatedRot] = useState(0);

  // Background slow rotation of ring
  useEffect(() => {
    let animId: number;
    const animate = () => {
      rotationRef.current = (rotationRef.current + 0.4) % 360;
      setAnimatedRot(rotationRef.current);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Normalize coordinates to percentage tilt
    const maxTilt = 15; // Max tilt degrees
    const tiltX = (y / (rect.height / 2)) * -maxTilt;
    const tiltY = (x / (rect.width / 2)) * maxTilt;
    
    setMousePos({ x, y });
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Color selection based on system alerts status
  const themeColor = isAlertActive ? "rgba(239, 68, 68, 0.85)" : "rgba(6, 182, 212, 0.85)";
  const themeGlow = isAlertActive ? "rgba(239, 68, 68, 0.4)" : "rgba(6, 182, 212, 0.4)";
  const themeFill = isAlertActive ? "rgba(239, 68, 68, 0.05)" : "rgba(6, 182, 212, 0.02)";

  // Determine pulse speed based on CPU usage
  const pulseDuration = 4000 / (1 + (cpuUsage / 100) * 3); // Spikes cause faster pulsing of core

  return (
    <div
      ref={containerRef}
      id="hud-companion-block"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex flex-col items-center justify-center p-6 bg-slate-950/40 rounded-3xl border border-cyan-500/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md overflow-hidden aspect-square w-full select-none"
      style={{
        perspective: "1000px",
      }}
    >
      {/* Dynamic scanlines for cybertech terminal feel */}
      <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-[0.03]"></div>

      {/* Tilt container */}
      <div
        className="relative flex flex-col items-center justify-center transition-transform duration-350 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* SVG Core Diagnostic Ring */}
        <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
          
          {/* Cyber Tech SVG Graphics */}
          <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 300 300">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f87171" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Central Glow Orb */}
            <circle
              cx="150"
              cy="150"
              r={30 + (cpuUsage / 100) * 15}
              fill={isAlertActive ? "url(#redGrad)" : "url(#cyanGrad)"}
              style={{
                filter: "url(#glow)",
                opacity: 0.25 + 0.15 * Math.sin(Date.now() / pulseDuration),
                transition: "r 0.3s ease-out",
              }}
            />

            {/* Outer dotted interface ring */}
            <circle
              cx="150"
              cy="150"
              r="125"
              fill="none"
              stroke={themeColor}
              strokeWidth="1.5"
              strokeDasharray="3, 7"
              opacity="0.25"
              style={{
                transform: `rotate(${animatedRot * -0.3}deg)`,
                transformOrigin: "150px 150px",
              }}
            />

            {/* Outer segmented tech arcs */}
            <circle
              cx="150"
              cy="150"
              r="115"
              fill="none"
              stroke={themeColor}
              strokeWidth="3.5"
              strokeDasharray="80 120 40 30"
              opacity="0.65"
              style={{
                transform: `rotate(${animatedRot * 0.6}deg)`,
                transformOrigin: "150px 150px",
              }}
            />

            {/* Middle telemetry data scale ring */}
            <circle
              cx="150"
              cy="150"
              r="95"
              fill="none"
              stroke={themeColor}
              strokeWidth="1"
              strokeDasharray="4, 4"
              opacity="0.35"
            />

            {/* Compass ticks design */}
            <circle
              cx="150"
              cy="150"
              r="85"
              fill="none"
              stroke={themeColor}
              strokeWidth="2.5"
              strokeDasharray="2 12"
              opacity="0.5"
              style={{
                transform: `rotate(${animatedRot * -0.5}deg)`,
                transformOrigin: "150px 150px",
              }}
            />

            {/* CPU utilization percentage segment */}
            <circle
              cx="150"
              cy="150"
              r="70"
              fill="none"
              stroke={themeColor}
              strokeWidth="5"
              strokeDasharray={`${(cpuUsage / 100) * 440} 440`}
              strokeLinecap="round"
              opacity="0.95"
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "150px 150px",
                filter: "url(#glow)",
                transition: "stroke-dasharray 0.8s cubic-bezier(0.1, 0.8, 0.2, 1)",
              }}
            />

            {/* Inner Memory visualization ring (running counter-clockwise) */}
            <circle
              cx="150"
              cy="150"
              r="55"
              fill="none"
              stroke={isAlertActive ? "rgba(220,38,38,0.4)" : "rgba(34,211,238,0.4)"}
              strokeWidth="3.5"
              strokeDasharray={`${(memoryUsage / 100) * 345} 345`}
              opacity="0.8"
              style={{
                transform: "rotate(-90deg) scaleY(-1)",
                transformOrigin: "150px 150px",
                transition: "stroke-dasharray 1s ease-out",
              }}
            />

            {/* Telemetry Pointer / Aiming Reticle (Points slowly to current mouse offset angle) */}
            {mousePos.x !== 0 && (
              <line
                x1="150"
                y1="150"
                x2={150 + (mousePos.x / Math.sqrt(mousePos.x ** 2 + mousePos.y ** 2)) * 135}
                y2={150 + (mousePos.y / Math.sqrt(mousePos.x ** 2 + mousePos.y ** 2)) * 135}
                stroke={themeColor}
                strokeWidth="0.75"
                strokeDasharray="5, 3"
                opacity="0.5"
              />
            )}
          </svg>

          {/* Central text stats display */}
          <div className="absolute flex flex-col items-center text-center justify-center p-4">
            <span className={`text-3xl font-mono tracking-widest font-bold ${isAlertActive ? "text-red-400" : "text-cyan-400"}`}>
              {cpuUsage}%
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400/80 font-mono flex items-center gap-1">
              <Cpu className="w-3 h-3" /> Core Utl
            </span>
            
            <div className="h-px w-10 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent my-2"></div>
            
            <span className="text-sm font-mono text-slate-200">
              {memoryUsage}%
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400/60 font-mono flex items-center gap-1">
              <HardDrive className="w-2.5 h-2.5" /> Sys RAM
            </span>
          </div>

        </div>

        {/* Real-time system label banner */}
        <div className="mt-4 flex flex-col items-center gap-1">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-medium tracking-widest uppercase transition-all duration-300 ${
            isAlertActive 
              ? "bg-red-950/20 border-red-500/40 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)]" 
              : "bg-cyan-950/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isAlertActive ? "bg-red-500 animate-ping" : "bg-cyan-400 animate-pulse"}`}></span>
            {isAlertActive ? "ALERT CONDITION TRIED" : "SYSTEM PERSONALITY MONITOR"}
          </div>
          <span className="text-[10px] tracking-wider text-slate-500 font-mono mt-1">
            {systemName} v1.4.0 (ESP32 EMULATED ENGINE)
          </span>
        </div>

      </div>
    </div>
  );
}
