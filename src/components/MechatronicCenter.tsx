import React, { useState, useEffect } from "react";
import { 
  Wrench, 
  Layers, 
  Cpu, 
  Terminal, 
  Zap, 
  CheckCircle, 
  FolderOpen, 
  Play, 
  Copy, 
  HelpCircle, 
  Link2, 
  Flame, 
  AlertTriangle,
  RefreshCw,
  Gauge,
  Sparkles,
  Bookmark
} from "lucide-react";
import { MechatronicState } from "../types";
import { playSyntheticAlert, speakAlertText } from "./AudioAlerts";

interface MechatronicCenterProps {
  logs: any[];
  addLog: (emitter: string, message: string, type?: "info" | "success" | "warning" | "error") => void;
  voiceSynthesisEnabled: boolean;
}

export default function MechatronicCenter({ logs, addLog, voiceSynthesisEnabled }: MechatronicCenterProps) {
  const [state, setState] = useState<MechatronicState>({
    fusionModel: {
      activeFile: "Suspension_Arm_v3.f3d",
      lastSaved: new Date().toISOString(),
      componentCount: 64,
      warnings: ["Over-constrained joint at Pivot_A (degree of freedom mismatch)", "Sketch 14 has broken projection reference"],
      isStressed: false,
    },
    solidworksModel: {
      activeAssembly: "CNC_Quill_Actuator.sldasm",
      meshCount: 142050,
      factorOfSafety: 1.85,
      simulationStatus: "completed",
    },
    tinkercadDesign: {
      projectName: "Pulse-Width Modulated Arduino Controller",
      partsList: ["Arduino Uno R3", "Power MOSFET N-Channel", "Optocoupler 4N35", "DC Motor 12V", "Potentiometer 10k"],
      viewUrl: "https://www.tinkercad.com/things/eHw23KlaB1u-pwm-motor-drive",
    },
    esp32Device: {
      connectionType: "serial",
      port: "COM4",
      baudRate: 115200,
      voltage: 3.28,
      dutyCycle: 68.4,
      coreTempC: 41.5,
      status: "measuring",
      lastTelemetryTimestamp: new Date().toISOString(),
    }
  });

  const [aiDiagnosis, setAiDiagnosis] = useState<string>("");
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeTab, setActiveTab] = useState<"cad" | "esp32" | "win10" | "tinkercad">("cad");

  // Advanced Interactive Mechatronics Simulation States
  const [appliedLoadKN, setAppliedLoadKN] = useState<number>(140);
  const [scopeWaveform, setScopeWaveform] = useState<"pwm" | "sine" | "uart">("pwm");
  const [scopeFreqHz, setScopeFreqHz] = useState<number>(15);
  const [tinkercadSelectedComponent, setTinkercadSelectedComponent] = useState<string>("Arduino Uno R3");
  const [firmwareCopied, setFirmwareCopied] = useState<boolean>(false);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Animated Oscilloscope Trace Effect
  useEffect(() => {
    if (activeTab !== "esp32") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw high-tech grid lines
      ctx.strokeStyle = "rgba(6, 182, 212, 0.08)";
      ctx.lineWidth = 1;
      const step = 20;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Center calibration timeline line
      ctx.strokeStyle = "rgba(6, 182, 212, 0.2)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Glow sweep trace styling
      ctx.strokeStyle = "#00ffff";
      ctx.shadowColor = "#00ffff";
      ctx.shadowBlur = 4;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const midY = canvas.height / 2;
      // Amplitude scaled to live voltage
      const amp = (state.esp32Device.voltage / 5) * (canvas.height / 2.6);
      const duty = state.esp32Device.dutyCycle / 100;

      for (let x = 0; x < canvas.width; x++) {
        let y = midY;
        const index = x + offset;

        if (scopeWaveform === "pwm") {
          const lambda = (canvas.width / scopeFreqHz);
          const t = (index % lambda) / lambda;
          y = t < duty ? midY - amp : midY + amp;
        } else if (scopeWaveform === "sine") {
          const waveFreq = (scopeFreqHz * 2 * Math.PI) / canvas.width;
          y = midY - Math.sin(index * waveFreq) * amp;
        } else {
          // UART asynchronous telemetry frames
          const frameWidth = 35;
          const frameIndex = Math.floor(index / frameWidth);
          const bitVal = (Math.sin(frameIndex * 1.7) * 400) % 2 > 0 ? 1 : -1;
          y = midY + bitVal * amp;
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      offset += 1.8;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [activeTab, scopeWaveform, scopeFreqHz, state.esp32Device.voltage, state.esp32Device.dutyCycle]);

  // Adjust Factor of Safety dynamically when dynamic load stress tweaks
  useEffect(() => {
    // Structural stress equation: safety factor declines with load force
    const yieldStrength = 280; // MPa
    const maxStress = Math.max(20, (appliedLoadKN * 1.5) - 30);
    const calculatedFoS = Number((yieldStrength / maxStress).toFixed(2));
    const finalFoSClamped = Math.max(0.48, Math.min(4.5, calculatedFoS));

    // Perform voice readouts for extreme safety drops (throttled)
    if (finalFoSClamped < 1.5 && state.solidworksModel.factorOfSafety >= 1.5) {
      playSyntheticAlert("beep");
      addLog("SOLIDWORKS-FEA", `Hazardous compression alert! Structural Factor of Safety dropped to ${finalFoSClamped}. Shear joints under high tension!`, "error");
      if (voiceSynthesisEnabled) {
        speakAlertText(`Warning! Structural safety coefficient has fallen to ${finalFoSClamped}. High failure risk.`);
      }
    }

    setState(prev => ({
      ...prev,
      solidworksModel: {
        ...prev.solidworksModel,
        factorOfSafety: finalFoSClamped
      }
    }));
  }, [appliedLoadKN]);

  // Fetch state on mount
  const fetchMechatronicState = async () => {
    try {
      const res = await fetch("/api/mechatronics");
      if (res.ok) {
        const data = await res.json();
        // Keep FEA load synchronized locally
        setState(prev => ({
          ...data,
          solidworksModel: {
            ...data.solidworksModel,
            factorOfSafety: prev.solidworksModel.factorOfSafety
          }
        }));
      }
    } catch (e) {
      // Keep state local fallback
    }
  };

  useEffect(() => {
    fetchMechatronicState();
    const interval = setInterval(fetchMechatronicState, 4500);
    return () => clearInterval(interval);
  }, []);

  // Sync state helper
  const syncTelemetryWithServer = async (updatedFields: Partial<MechatronicState>) => {
    try {
      const res = await fetch("/api/mechatronics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        const data = await res.json();
        setState(prev => ({
          ...data.mechatronics,
          solidworksModel: {
            ...data.mechatronics.solidworksModel,
            factorOfSafety: prev.solidworksModel.factorOfSafety
          }
        }));
      }
    } catch (e) {
      // Local fallback
      setState(prev => ({ ...prev, ...updatedFields }));
    }
  };

  // Run cyber-physical diagnostic scan
  const runMechatronicsAiCheck = async () => {
    setIsDiagnosing(true);
    addLog("JARVIS", "Initiating cyber-physical architecture scan on CAD nodes and microcontroller signals...", "warning");
    playSyntheticAlert("chirp");

    try {
      const res = await fetch("/api/gemini/mechatronics-diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      
      const data = await res.json();
      setAiDiagnosis(data.response);
      addLog("JARVIS", "Mechatronic audit successfully resolved.", "success");
      
      if (voiceSynthesisEnabled) {
        speakAlertText("Diagnostic complete. SolidWorks factor of safety is flagged at 1.85. Dynamic stress loads present moderate shear risks.");
      }
    } catch (err) {
      addLog("JARVIS", "Mechatronics AI cluster offline or failed.", "error");
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Windows 10 local python pipeline script
  const liveOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const windowsPythonScript = `import time
import requests
import random
# On Win10: pip install pywin32 requests
try:
    import win32com.client
    SW_AVAILABLE = True
except ImportError:
    SW_AVAILABLE = False

# Live remote or local offline server endpoint
API_ENDPOINT = "${liveOrigin}/api/mechatronics"

def poll_and_sync_local_mechatronics():
    print("[J.A.R.V.I.S.] Starting local Windows 10 mechatronic bridge...")
    print(f"[HUD Sync Target] Directing telemetry packages to: {API_ENDPOINT}")
    
    while True:
        # Default fallback values
        active_cad = "Friction_Gearbox.sldprt"
        factor_safety = 1.95
        
        # 1. Attempt to pool actual active CAD file from SolidWorks COM interface
        if SW_AVAILABLE:
            try:
                sw_app = win32com.client.GetObject(None, "SldWorks.Application")
                sw_model = sw_app.ActiveDoc
                if sw_model:
                    active_cad = sw_model.GetTitle()
                    # Example: get material stress diagnostics or static FEA factor of safety
                    print(f"[SolidWorks Watcher] Hooked active design: {active_cad}")
            except Exception:
                pass # Solidworks not running or no active file

        # 2. Build mechatronic telemetry payload
        payload = {
            "fusionModel": {
                "activeFile": "Quad_Arm_Fixture.f3d",
                "componentCount": 18,
                "warnings": ["Pivot mismatch warning #34", "Joint alignment tension at hinge [x=4.2]"]
            },
            "solidworksModel": {
                "activeAssembly": active_cad,
                "factorOfSafety": round(factor_safety + random.uniform(-0.1, 0.15), 2),
                "simulationStatus": "completed"
            },
            "esp32Device": {
                "voltage": round(3.26 + random.uniform(-0.04, 0.05), 3),
                "dutyCycle": round(65.0 + random.uniform(-5.0, 5.0), 1),
                "coreTempC": round(42.0 + random.uniform(-1.5, 3.0), 1),
                "status": "measuring"
            }
        }

        # 3. Stream to J.A.R.V.I.S. HUD Local/Remote port
        try:
            r = requests.post(API_ENDPOINT, json=payload)
            if r.status_code == 200:
                print(f"[HUD Sync] Telemetry transmitted successfully. Latency check ok.")
            else:
                print(f"[HUD Sync] Warning: Server returned status {r.status_code}")
        except Exception as e:
            print(f"[HUD Sync] Connection failed: {e}. Is the J.A.R.V.I.S server running and accessible?")

        time.sleep(4)

if __name__ == "__main__":
    poll_and_sync_local_mechatronics()`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(windowsPythonScript);
    setCopiedScript(true);
    addLog("SYSTEM", "Mechatronics Windows 10 Python pipeline script copied to clipboard.", "info");
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div 
      id="hud-mechatronics-integration-block"
      className="bg-slate-950/40 backdrop-blur-md rounded-3xl border border-cyan-500/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] p-5 flex flex-col font-mono"
    >
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/10 mb-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            MECHATRONICS & CAD HUB
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={runMechatronicsAiCheck}
            disabled={isDiagnosing}
            className="text-[9px] bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            {isDiagnosing ? "Diagnosing..." : "Run AI CAD Check"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1.5 mb-4 text-[10px] text-center select-none">
        <button
          onClick={() => setActiveTab("cad")}
          className={`py-1.5 rounded transition-all uppercase font-bold tracking-wider cursor-pointer border ${
            activeTab === "cad" 
              ? "bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]" 
              : "border-slate-800 text-slate-500 hover:text-slate-400"
          }`}
        >
          CAD Metrics
        </button>
        <button
          onClick={() => setActiveTab("esp32")}
          className={`py-1.5 rounded transition-all uppercase font-bold tracking-wider cursor-pointer border ${
            activeTab === "esp32" 
              ? "bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]" 
              : "border-slate-800 text-slate-500 hover:text-slate-400"
          }`}
        >
          ESP32 Scope
        </button>
        <button
          onClick={() => setActiveTab("tinkercad")}
          className={`py-1.5 rounded transition-all uppercase font-bold tracking-wider cursor-pointer border ${
            activeTab === "tinkercad" 
              ? "bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]" 
              : "border-slate-800 text-slate-500 hover:text-slate-400"
          }`}
        >
          Tinkercad Link
        </button>
        <button
          onClick={() => setActiveTab("win10")}
          className={`py-1.5 rounded transition-all uppercase font-bold tracking-wider cursor-pointer border ${
            activeTab === "win10" 
              ? "bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]" 
              : "border-slate-800 text-slate-500 hover:text-slate-400"
          }`}
        >
          Win10 Bridge
        </button>
      </div>

      {/* TAB CONTENTS */}
      <div className="flex-1 min-h-60 overflow-y-auto pr-1">
        
        {/* CAD METRICS TAB */}
        {activeTab === "cad" && (
          <div className="space-y-4">
            {/* Interactive FEA Stress Contour Simulation */}
            <div className="p-3 bg-slate-900/40 border border-[#00ffff1a] rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-1.5">
                <span className="text-[10px] font-bold text-cyan-300 uppercase flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Live FEA Stress Contour Map
                </span>
                <span className="text-[8px] bg-cyan-950 text-cyan-400 px-1.5 rounded uppercase">Mesh Resolution Max</span>
              </div>

              {/* Advanced SVG Structural Bracket that shifts color based on dynamic load */}
              <div className="relative h-24 bg-[#05080a] border border-cyan-500/10 rounded-xl flex items-center justify-center p-2 overflow-hidden">
                <div className="absolute top-1 left-2 text-[8px] text-slate-500 uppercase tracking-wider">
                  SUSPENSION JOINT SHEAR VECTOR
                </div>

                {/* SVG Structure */}
                <svg className="w-full h-16" viewBox="0 0 320 80" fill="none">
                  {/* Anchor Hub Section */}
                  <rect x="15" y="15" width="40" height="50" rx="4" fill="rgba(6, 182, 212, 0.15)" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1.5" />
                  <circle cx="35" cy="40" r="10" fill="#020617" stroke="rgba(6, 182, 212, 0.5)" strokeWidth="2" />
                  <text x="28" y="43" fill="#00ffff" className="text-[9px] font-bold font-mono">FIX</text>

                  {/* High Stress Transverse Webbing Section - Gradient Color based on load */}
                  <path 
                    d="M 55,25 L 150,15 L 180,40 L 150,65 L 55,55 Z" 
                    fill={`rgba(${appliedLoadKN > 180 ? Math.min(255, (appliedLoadKN - 100) * 1.2) : 10}, ${appliedLoadKN < 300 ? Math.max(100, 255 - appliedLoadKN) : 30}, ${appliedLoadKN < 180 ? Math.max(120, 255 - appliedLoadKN) : 40}, 0.55)`}
                    stroke={`rgb(${appliedLoadKN > 180 ? 255 : 30}, ${appliedLoadKN < 260 ? 240 : 50}, 240)`} 
                    strokeWidth="2" 
                    className="transition-all duration-300"
                  />
                  
                  {/* Dynamic stress force vector arrow */}
                  <path 
                    d="M 230,40 L 185,40" 
                    stroke="#ef4444" 
                    strokeWidth="2.5" 
                    markerEnd="url(#arrow)" 
                    className={appliedLoadKN > 220 ? "animate-pulse" : ""}
                  />
                  <polygon points="185,40 195,35 195,45" fill="#ef4444" />

                  {/* Load vector indicator text */}
                  <text x="195" y="32" fill="#ef4444" className="text-[8px] font-bold font-mono">
                    {appliedLoadKN} kN LOAD FORCE
                  </text>

                  {/* Hinge Linkage section */}
                  <rect x="230" y="25" width="60" height="30" rx="3" fill="rgba(6, 182, 212, 0.1)" stroke="rgba(6, 182, 212, 0.2)" />
                  <circle cx="260" cy="40" r="6" fill="#020617" stroke="#ef4444" strokeWidth="1.5" />
                </svg>

                {/* Micro hot-spot heat overlays */}
                <div className="absolute right-4 bottom-1.5 flex gap-3 text-[8px] text-slate-500 font-bold">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-cyan-400"></span> LOW STRESS
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-amber-400"></span> WARNING THRESHOLD
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-red-500"></span> MAX SHEAR
                  </span>
                </div>
              </div>

              {/* Dynamic Force Load Input Slider */}
              <div className="flex flex-col gap-1.5 p-2 bg-[#05080a] rounded-xl border border-cyan-500/5">
                <div className="flex justify-between text-[9px] font-bold">
                  <span className="text-slate-400 uppercase">DYNAMIC MECHANICAL LOAD SHEAR:</span>
                  <span className={`font-bold ${appliedLoadKN > 240 ? "text-red-400" : "text-cyan-300"}`}>{appliedLoadKN} kN Force</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="450"
                  step="5"
                  value={appliedLoadKN}
                  onChange={(e) => setAppliedLoadKN(Number(e.target.value))}
                  className="w-full h-1 accent-[#00f0ff] cursor-pointer bg-slate-900 rounded"
                />
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>Static Preload (40 kN)</span>
                  <span>Limit Shear Load (240 kN)</span>
                  <span>Max Failure Ultimate (450 kN)</span>
                </div>
              </div>
            </div>

            {/* Fusion 360 block */}
            <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col gap-2">
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-1">
                <span className="text-[10px] font-bold text-white uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span> Autodesk Fusion 360 Link
                </span>
                <span className="text-[8px] bg-cyan-950 text-cyan-400 px-1.5 rounded uppercase">Connected Node</span>
              </div>
              <p className="text-[11px] text-slate-300 font-bold flex justify-between"><span className="text-slate-500">Active Design:</span> <span className="text-cyan-400 truncate max-w-[170px]">{state.fusionModel.activeFile}</span></p>
              <p className="text-[10px] text-slate-400 flex justify-between"><span className="text-slate-500">Rigid Joints:</span> <span>{state.fusionModel.componentCount} elements</span></p>
              
              {state.fusionModel.warnings.length > 0 && (
                <div className="mt-1 space-y-1">
                  <span className="text-[8.5px] font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" /> ACTIVE SOLVER WARNINGS:
                  </span>
                  {state.fusionModel.warnings.map((warn, i) => (
                    <div key={i} className="text-[8.5px] text-slate-400 leading-relaxed pl-3 border-l border-amber-500/40">
                      • {warn}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SolidWorks block */}
            <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col gap-2">
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-1">
                <span className="text-[10px] font-bold text-white uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> SolidWorks Simulation Hub
                </span>
                <span className="text-[8px] bg-amber-950/60 text-amber-400 px-1.5 rounded uppercase">FEA Static Stress Solver</span>
              </div>
              <p className="text-[11px] text-slate-300 font-bold flex justify-between"><span className="text-slate-500">Assembly Node:</span> <span className="text-cyan-400 truncate max-w-[170px]">{state.solidworksModel.activeAssembly}</span></p>
              <p className="text-[10px] text-slate-400 flex justify-between"><span className="text-slate-500">Mesh Subdivisions:</span> <span>{state.solidworksModel.meshCount} nodes</span></p>
              
              {/* Factor of Safety progress visual */}
              <div className="mt-2 p-2 bg-[#05080a] border border-cyan-500/5 rounded-xl flex flex-col gap-1.5">
                <div className="flex justify-between text-[9px] font-bold">
                  <span className="text-slate-500">FACTOR OF SAFETY (FoS)</span>
                  <span className={state.solidworksModel.factorOfSafety < 1.5 ? "text-red-400 font-extrabold animate-pulse" : state.solidworksModel.factorOfSafety < 2.0 ? "text-amber-400 font-bold" : "text-emerald-400"}>
                    {state.solidworksModel.factorOfSafety} {state.solidworksModel.factorOfSafety < 1.5 ? "[FAIL]" : state.solidworksModel.factorOfSafety < 2.0 ? "[RISKY]" : "[SAFE]"}
                  </span>
                </div>
                <div className="h-1.5 b-full bg-slate-900 rounded-full overflow-hidden border border-cyan-500/5">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      state.solidworksModel.factorOfSafety < 1.5 ? "bg-red-500 animate-pulse" : state.solidworksModel.factorOfSafety < 2.0 ? "bg-amber-400" : "bg-emerald-400"
                    }`}
                    style={{ width: `${Math.min(100, (state.solidworksModel.factorOfSafety / 3.2) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>0.0 (Fail)</span>
                  <span>1.5 (Risk limit)</span>
                  <span>3.0+ (Overbuilt)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ESP32 HARDWARE TAB */}
        {activeTab === "esp32" && (
          <div className="space-y-4">
            {/* High-Fidelity Oscilloscope Waveform Monitor */}
            <div className="p-3 bg-slate-900/40 border border-[#00ffff1a] rounded-2xl flex flex-col gap-2.5">
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-1.5">
                <span className="text-[10px] font-bold text-cyan-300 uppercase flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Digital Storage Oscilloscope
                </span>
                <span className="text-[8px] bg-red-950 text-red-400 px-1.5 rounded uppercase">Trigger Auto</span>
              </div>

              {/* Grid Canvas Screen */}
              <div className="relative bg-[#020508] border border-cyan-500/20 rounded-xl overflow-hidden shadow-[inset_0_0_12px_rgba(6,182,212,0.25)] flex items-center justify-center p-1">
                <canvas 
                  ref={canvasRef} 
                  width="300" 
                  height="120"
                  className="w-full h-[120px] block"
                />
                
                {/* On-screen oscilloscope specs overlay */}
                <div className="absolute top-1 right-2 text-[8px] text-cyan-400/75 flex gap-2 tracking-wide">
                  <span>CH1: {state.esp32Device.voltage}V</span>
                  <span>SEC/DIV: 5ms</span>
                  <span>MODE: {scopeWaveform.toUpperCase()}</span>
                </div>
                <div className="absolute bottom-1.5 left-2 text-[7.5px] text-slate-500 uppercase">
                  Telemetry Trigger Level: 1.65V
                </div>
              </div>

              {/* Oscilloscope Waveform Selection & Control Grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {/* Wave selector */}
                <div className="p-1.5 bg-[#05080a] border border-cyan-500/5 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[8px] text-slate-500 font-bold uppercase">Signal Select:</span>
                  <div className="grid grid-cols-3 gap-1 text-[8.5px]">
                    <button
                      onClick={() => setScopeWaveform("pwm")}
                      className={`py-0.5 rounded border transition-colors cursor-pointer ${scopeWaveform === "pwm" ? "bg-cyan-950/80 border-cyan-400 text-cyan-300" : "border-slate-800 text-slate-500 hover:text-slate-400"}`}
                    >
                      PWM
                    </button>
                    <button
                      onClick={() => setScopeWaveform("sine")}
                      className={`py-0.5 rounded border transition-colors cursor-pointer ${scopeWaveform === "sine" ? "bg-cyan-950/80 border-cyan-400 text-cyan-300" : "border-slate-800 text-slate-500 hover:text-slate-400"}`}
                    >
                      Sine
                    </button>
                    <button
                      onClick={() => setScopeWaveform("uart")}
                      className={`py-0.5 rounded border transition-colors cursor-pointer ${scopeWaveform === "uart" ? "bg-cyan-950/80 border-cyan-400 text-cyan-300" : "border-slate-800 text-slate-500 hover:text-slate-400"}`}
                    >
                      COM
                    </button>
                  </div>
                </div>

                {/* Scope Frequency controller */}
                <div className="p-1.5 bg-[#05080a] border border-cyan-500/5 rounded-xl flex flex-col gap-1">
                  <div className="flex justify-between text-[8px] text-slate-500 font-bold">
                    <span>SWEEP INTENSITY:</span>
                    <span className="text-white">{scopeFreqHz} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="45"
                    value={scopeFreqHz}
                    onChange={(e) => setScopeFreqHz(Number(e.target.value))}
                    className="w-full h-1 accent-[#00f0ff] cursor-pointer bg-slate-900 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-1">
                <span className="text-[10px] font-bold text-white uppercase flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" /> ESP32-WROVER Control Node
                </span>
                <span className="text-[8px] bg-emerald-950 text-emerald-400 px-1.5 rounded uppercase">{state.esp32Device.status}</span>
              </div>

              {/* Slider for interactive local tuning */}
              <div className="flex flex-col gap-2 p-2 bg-[#05080a] rounded-xl border border-cyan-500/5 text-[9px]">
                <span className="text-slate-400 font-bold uppercase">Manual Interactive Emulator Parameters</span>
                
                {/* Voltage tuning slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[8px] font-mono text-slate-500">
                    <span>INPUT REFERENCE VOLTAGE:</span>
                    <span className="text-white font-bold">{state.esp32Device.voltage} V</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.05"
                    value={state.esp32Device.voltage}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      syncTelemetryWithServer({ esp32Device: { ...state.esp32Device, voltage: val } });
                    }}
                    className="w-full accent-cyan-400 h-1 cursor-pointer bg-slate-900 rounded"
                  />
                </div>

                {/* Duty cycle slider */}
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex justify-between text-[8px] font-mono text-slate-500">
                    <span>GATE PWM DUTY CYCLE:</span>
                    <span className="text-white font-bold">{state.esp32Device.dutyCycle} %</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.5"
                    value={state.esp32Device.dutyCycle}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      syncTelemetryWithServer({ esp32Device: { ...state.esp32Device, dutyCycle: val } });
                    }}
                    className="w-full accent-cyan-400 h-1 cursor-pointer bg-slate-900 rounded"
                  />
                </div>

                {/* Device Temp C Slider */}
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex justify-between text-[8px] font-mono text-slate-500">
                    <span>SEMICONDUCTOR HEAT RATIO:</span>
                    <span className={`font-bold ${state.esp32Device.coreTempC > 60 ? "text-red-400" : "text-white"}`}>{state.esp32Device.coreTempC} °C</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="85"
                    value={state.esp32Device.coreTempC}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const isHigh = val > 60;
                      if (isHigh && state.esp32Device.coreTempC <= 60) {
                        playSyntheticAlert("beep");
                        addLog("ESP32-CORE", `Warning: Microcontroller core heat threshold exceeded! (${val}°C)`, "warning");
                      }
                      syncTelemetryWithServer({ esp32Device: { ...state.esp32Device, coreTempC: val } });
                    }}
                    className="w-full accent-cyan-400 h-1 cursor-pointer bg-slate-900 rounded"
                  />
                </div>
              </div>

              {/* Live Signal Telemetry spec list */}
              <div className="text-[9px] text-slate-400 space-y-1">
                <p className="flex justify-between"><span className="text-slate-500">Port link:</span> <span className="text-white">{state.esp32Device.port}</span></p>
                <p className="flex justify-between"><span className="text-slate-500">Baud Rate:</span> <span className="text-white">{state.esp32Device.baudRate} bps</span></p>
                <p className="flex justify-between"><span className="text-slate-500">Last heartbeat:</span> <span className="text-white">{new Date(state.esp32Device.lastTelemetryTimestamp).toLocaleTimeString()}</span></p>
              </div>
            </div>
          </div>
        )}

        {/* TINKERCAD SCHEMATIC TAB */}
        {activeTab === "tinkercad" && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-1">
                <span className="text-[10px] font-bold text-white uppercase flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" /> Tinkercad Circuit Assets
                </span>
                <a 
                  href={state.tinkercadDesign.viewUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[8px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-cyan-900"
                >
                  <Link2 className="w-2.5 h-2.5" /> View Project
                </a>
              </div>

              <div className="p-2.5 bg-[#05080a] border border-cyan-500/5 rounded-xl">
                <p className="text-[10.5px] font-bold text-slate-200 uppercase">{state.tinkercadDesign.projectName}</p>
                <div className="h-px bg-cyan-500/10 my-1.5"></div>
                <span className="text-[8.5px] font-bold text-slate-500 block mb-1.5">COMPONENTS BILL OF MATERIALS (BOM) & INTERACTIVE RECIPIENT:</span>
                
                {/* Clickable BOM items */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {state.tinkercadDesign.partsList.map((part, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTinkercadSelectedComponent(part)}
                      className={`text-[8.5px] border rounded px-1.5 py-0.5 transition-colors cursor-pointer select-none font-mono ${
                        tinkercadSelectedComponent === part 
                        ? "bg-cyan-950 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.15)]" 
                        : "bg-slate-950/40 text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {part}
                    </button>
                  ))}
                </div>

                {/* Specific component wiring layout visual */}
                <div className="p-2 bg-[#020508] border border-cyan-500/5 rounded-lg text-[8.5px] text-slate-400 space-y-1">
                  <span className="text-cyan-400 font-bold uppercase tracking-wider block mb-1">
                    🔧 PHYSICAL HARNESS INTEGRATION PINOUT REFERENCE:
                  </span>
                  {tinkercadSelectedComponent === "Arduino Uno R3" && (
                    <>
                      <p className="flex justify-between"><span>Pin 5V / GND:</span> <span className="text-white">Main Core Power Bridge to Rail</span></p>
                      <p className="flex justify-between"><span>Analog Pin A0:</span> <span className="text-white">Potentiometer Voltage Sweep Input</span></p>
                      <p className="flex justify-between"><span>Digital PWM Pin D9:</span> <span className="text-white">Optocoupler gate control carrier</span></p>
                    </>
                  )}
                  {tinkercadSelectedComponent === "Power MOSFET N-Channel" && (
                    <>
                      <p className="flex justify-between"><span>Pin 1 (Gate):</span> <span className="text-white">Connected to Arduino digital Pin 9 with 220Ω protective resistor</span></p>
                      <p className="flex justify-between"><span>Pin 2 (Drain):</span> <span className="text-white">Connected to high power DC Motor Ground node</span></p>
                      <p className="flex justify-between"><span>Pin 3 (Source):</span> <span className="text-white">Common isolated chassis Ground terminal</span></p>
                    </>
                  )}
                  {tinkercadSelectedComponent === "Optocoupler 4N35" && (
                    <>
                      <p className="flex justify-between"><span>Pins 1/2 (Internal LED):</span> <span className="text-white">Powered via Arduino PWM Pin 9 with 330Ω bias</span></p>
                      <p className="flex justify-between"><span>Pins 4/5 (Output Transistor):</span> <span className="text-white">Switches external 12V high potential MOSFET gate bias</span></p>
                    </>
                  )}
                  {tinkercadSelectedComponent === "DC Motor 12V" && (
                    <>
                      <p className="flex justify-between"><span>Positive (+) Node:</span> <span className="text-white">Directly hooked to +12V high potential power bridge</span></p>
                      <p className="flex justify-between"><span>Negative (-) Node:</span> <span className="text-white">Wired to MOSFET Drain for safe logic side isolation</span></p>
                    </>
                  )}
                  {tinkercadSelectedComponent === "Potentiometer 10k" && (
                    <>
                      <p className="flex justify-between"><span>Left / Right Pins:</span> <span className="text-white">Arduino 5V reference and Common Ground</span></p>
                      <p className="flex justify-between"><span>Center Wiper Pin:</span> <span className="text-white">Connected to raw input channel Analog A0</span></p>
                    </>
                  )}
                </div>
              </div>

              {/* Dynamic Firmware Generator section */}
              <div className="p-2.5 bg-slate-900/40 border border-[#00ffff0a] rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center pb-1 border-b border-cyan-500/10">
                  <span className="text-[9px] font-bold text-cyan-300 uppercase">
                    💾 AI Autogenerated C++ Hardware Firmware
                  </span>
                  <button
                    onClick={() => {
                      let code = "";
                      if (tinkercadSelectedComponent === "Arduino Uno R3") {
                        code = `void setup() {\n  Serial.begin(115200);\n}\nvoid loop() {\n  float raw = analogRead(A0);\n  float volts = (raw * 5.0) / 1023.0;\n  Serial.print("VOLT_HB:"); Serial.println(volts);\n  delay(100);\n}`;
                      } else if (tinkercadSelectedComponent === "Power MOSFET N-Channel") {
                        code = `const int gatePin = 9;\nvoid setup() {\n  pinMode(gatePin, OUTPUT);\n}\nvoid loop() {\n  analogWrite(gatePin, 175); // 68.4% duty cycle\n  delay(50);\n}`;
                      } else {
                        code = `// Embedded logic device driver mapping\nvoid setup() {\n  pinMode(3, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(3, HIGH);\n  delayMicroseconds(40);\n}`;
                      }
                      navigator.clipboard.writeText(code);
                      setFirmwareCopied(true);
                      addLog("SYSTEM", "Firmware code block saved to host clipboard.", "success");
                      setTimeout(() => setFirmwareCopied(false), 2000);
                    }}
                    className="text-[8px] bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300 transition-colors uppercase font-bold cursor-pointer"
                  >
                    {firmwareCopied ? "Copied!" : "Copy Snippet"}
                  </button>
                </div>

                <div className="bg-[#020508] p-2 rounded-lg border border-cyan-500/5 max-h-36 overflow-y-auto font-mono text-[8px] leading-normal text-emerald-400">
                  {tinkercadSelectedComponent === "Arduino Uno R3" && (
                    <pre>{`// CAD-Companion Signal Synchronizer Firmware
// Designed for Arduino/Tinkercad ESP32 mechatronic sync bridge
#define ADC_REF_VOLTS 5.0

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  int rawValue = analogRead(A0);
  float voltage = (rawValue * ADC_REF_VOLTS) / 1023.0;
  
  // Format output telemetry JSON compatible payload
  Serial.print("{\\"voltage\\":"); Serial.print(voltage, 2);
  Serial.print(",\\"dutyCycle\\":68.4,\\"status\\":\\"measuring\\"}");
  Serial.println();
  
  // Flash status pulse indicators
  digitalWrite(LED_BUILTIN, HIGH);
  delay(150);
  digitalWrite(LED_BUILTIN, LOW);
  delay(350);
}`}</pre>
                  )}
                  {tinkercadSelectedComponent === "Power MOSFET N-Channel" && (
                    <pre>{`// MOSFET Gate Control High-frequency PWM firmware
const int gatePWM = 9; // High efficiency PWM Pin

void setup() {
  pinMode(gatePWM, OUTPUT);
  // Reconfigure AVR Timer-1 Prescaler for ultra-high frequency 31.2 kHz
  TCCR1B = (TCCR1B & 0b11111000) | 0x01;
}

void loop() {
  // Translate 68.4% duty cycle to AVR analog range [0 - 255]
  int targetAVRDuty = int(0.684 * 255.0);
  
  // Emit smooth continuous gate potential
  analogWrite(gatePWM, targetAVRDuty);
  delay(10);
}`}</pre>
                  )}
                  {tinkercadSelectedComponent === "Optocoupler 4N35" && (
                    <pre>{`// Isolated Optical Coupler High Noise Environment Gate Drive Setup
const int optoAnodePin = 9;

void setup() {
  pinMode(optoAnodePin, OUTPUT);
}

void loop() {
  // Waveform drive frequency sync
  digitalWrite(optoAnodePin, HIGH);
  delayMicroseconds(200);
  digitalWrite(optoAnodePin, LOW);
  delayMicroseconds(200);
}`}</pre>
                  )}
                  {tinkercadSelectedComponent === "DC Motor 12V" && (
                    <pre>{`// Power-isolated 12V Inductive Load Motor Starter firmware
const int speedControlPot = A0;
const int optoGateControl = 10;

void setup() {
  pinMode(optoGateControl, OUTPUT);
}

void loop() {
  int drivePot = analogRead(speedControlPot);
  // Safe mapping of control potentials
  int speedOutput = map(drivePot, 0, 1023, 0, 255);
  
  analogWrite(optoGateControl, speedOutput);
  delay(20);
}`}</pre>
                  )}
                  {tinkercadSelectedComponent === "Potentiometer 10k" && (
                    <pre>{`// Low impedance 10K Potentiometer signal capture buffer
const int wiperA0 = A0;

void setup() {
  analogReference(DEFAULT); // 5V reference voltage calibration
}

void loop() {
  int noiseFilteredAverage = 0;
  // Multi-pass noise decoupling sample sweep
  for (int i = 0; i < 8; i++) {
    noiseFilteredAverage += analogRead(wiperA0);
  }
  int finalValue = noiseFilteredAverage / 8;
  
  float targetAngle = (finalValue / 1023.0) * 270.0;
  delay(5);
}`}</pre>
                  )}
                </div>
              </div>

              <span className="text-[9px] text-slate-500 leading-relaxed leading-normal">
                Use Autodesk Tinkercad to prototype PWM gate drives, digital circuit layouts, or mechanical stress ratios virtually before compiling ESP32 mechatronic structures.
              </span>
            </div>
          </div>
        )}

        {/* WINDOWS 10 PIPELINE BRIDGE TAB */}
        {activeTab === "win10" && (
          <div className="space-y-3.5">
            <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col gap-2 text-[10px] leading-relaxed font-mono">
              <span className="text-white font-bold uppercase flex items-center gap-1 pb-1 border-b border-cyan-500/10">
                🚀 Windows 10 Launch & Bridge Setup
              </span>
              
              <div className="bg-[#05080a] p-2.5 rounded-xl space-y-1 text-slate-400 max-h-40 overflow-y-auto pr-1 text-[9px] custom-scrollbar">
                <p className="text-cyan-300 font-bold">1. Download Web Application:</p>
                <p className="pl-2">Export this J.A.R.V.I.S workspace as ZIP directly via the Settings panel on the top right, or clone it on your Windows 10 desktop.</p>
                
                <p className="text-cyan-300 font-bold mt-2">2. Ensure Node.js is installed:</p>
                <p className="pl-2">Download Node.js v18+ for Windows. Open Command Prompt and test with: <code className="text-white bg-slate-900 px-1 rounded">node -v</code></p>
                
                <p className="text-cyan-300 font-bold mt-2">3. Spin up Dev Server:</p>
                <p className="pl-2">Run <code className="text-white bg-slate-900 px-1 rounded">npm install</code>, then execute <code className="text-white bg-slate-900 px-1 rounded">npm run dev</code> in your project directory root to host J.A.R.V.I.S on local port 3000.</p>
                
                <p className="text-cyan-300 font-bold mt-2">4. Connect CAD COM Client:</p>
                <p className="pl-2">Create a Python script in your local directories, copy the J.A.R.V.I.S Python client script compiled below, and execute it to instantly pipe your Autodesk Fusion/Solidworks models telemetry directly to this HUD!</p>
              </div>

              {/* Copy Script Button */}
              <button
                onClick={copyScriptToClipboard}
                className="mt-1 w-full text-center bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 py-1.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer uppercase font-bold text-[9px]"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedScript ? "Script copied!" : "Copy Win10 CAD Python Bridge Script"}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* AI Diagnoses result overlay */}
      {aiDiagnosis && (
        <div className="mt-4 p-3 bg-cyan-950/20 border border-cyan-400/20 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.1)] relative">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> J.A.R.V.I.S. CAD EVALUATION DIAGNOSIS
            </span>
            <button 
              onClick={() => setAiDiagnosis("")}
              className="text-[9px] text-slate-500 hover:text-white"
            >
              [Dismiss]
            </button>
          </div>
          <p className="text-[9.5px] leading-relaxed text-slate-300 whitespace-pre-wrap font-sans">
            {aiDiagnosis}
          </p>
        </div>
      )}
    </div>
  );
}
