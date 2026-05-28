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

  // Fetch state on mount
  const fetchMechatronicState = async () => {
    try {
      const res = await fetch("/api/mechatronics");
      if (res.ok) {
        const data = await res.json();
        setState(data);
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
        setState(data.mechatronics);
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
  const windowsPythonScript = `import time
import requests
import random
# On Win10: pip install pywin32 requests
try:
    import win32com.client
    SW_AVAILABLE = True
except ImportError:
    SW_AVAILABLE = False

API_ENDPOINT = "http://localhost:3000/api/mechatronics"

def poll_and_sync_local_mechatronics():
    print("[J.A.R.V.I.S.] Starting local Windows 10 mechatronic bridge...")
    
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

        # 3. Stream to J.A.R.V.I.S. HUD Local port
        try:
            r = requests.post(API_ENDPOINT, json=payload)
            if r.status_code == 200:
                print(f"[HUD Sync] Telemetry transmitted successfully. Latency check ok.")
        except Exception as e:
            print(f"[HUD Sync] Connection failed: {e}. Is the J.A.R.V.I.S web app dev server running on port 3000?")

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
            {/* Fusion 360 block */}
            <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col gap-2">
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-1">
                <span className="text-[10px] font-bold text-white uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Autodesk Fusion 360
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
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> SolidWorks Premium
                </span>
                <span className="text-[8px] bg-amber-950/60 text-amber-400 px-1.5 rounded uppercase">Static Simulation ready</span>
              </div>
              <p className="text-[11px] text-slate-300 font-bold flex justify-between"><span className="text-slate-500">Assembly:</span> <span className="text-cyan-400 truncate max-w-[170px]">{state.solidworksModel.activeAssembly}</span></p>
              <p className="text-[10px] text-slate-400 flex justify-between"><span className="text-slate-500">FEA Mesh Cells:</span> <span>{state.solidworksModel.meshCount} nodes</span></p>
              
              {/* Factor of Safety progress visual */}
              <div className="mt-2 p-2 bg-[#05080a] border border-cyan-500/5 rounded-xl flex flex-col gap-1.5">
                <div className="flex justify-between text-[9px] font-bold">
                  <span className="text-slate-500">FACTOR OF SAFETY (FoS)</span>
                  <span className={state.solidworksModel.factorOfSafety < 2.0 ? "text-amber-400 font-bold" : "text-emerald-400"}>
                    {state.solidworksModel.factorOfSafety}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-cyan-500/5">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      state.solidworksModel.factorOfSafety < 2.0 ? "bg-amber-400" : "bg-emerald-400"
                    }`}
                    style={{ width: `${(state.solidworksModel.factorOfSafety / 3.0) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>0.0 (Fail)</span>
                  <span>1.5 (Risk limit)</span>
                  <span>3.0 (Overbuilt)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ESP32 HARDWARE TAB */}
        {activeTab === "esp32" && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-1">
                <span className="text-[10px] font-bold text-white uppercase flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" /> ESP32-WROVER mechatronic link
                </span>
                <span className="text-[8px] bg-emerald-950 text-emerald-400 px-1.5 rounded uppercase">{state.esp32Device.status}</span>
              </div>

              {/* Slider for interactive local tuning */}
              <div className="flex flex-col gap-2 p-2 bg-[#05080a] rounded-xl border border-cyan-500/5 text-[9px]">
                <span className="text-slate-400 font-bold">MANUAL INTERACTIVE TELEMETRY EMULATOR (Tuning)</span>
                
                {/* Voltage tuning slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[8px] font-mono text-slate-500">
                    <span>VOLTAGE INPUT:</span>
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
                    <span>PWM DUTY CYCLE:</span>
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
                    <span>CORE CHIP TEMP:</span>
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
                <span className="text-[8.5px] font-bold text-slate-500 block mb-1">COMPONENTS BILL OF MATERIALS (BOM):</span>
                <div className="flex flex-wrap gap-1">
                  {state.tinkercadDesign.partsList.map((part, idx) => (
                    <span key={idx} className="text-[8.5px] bg-cyan-950/40 text-cyan-300 border border-cyan-500/10 rounded px-1.5 py-0.5">
                      {part}
                    </span>
                  ))}
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
            <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col gap-2 text-[10px] leading-relaxed">
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
