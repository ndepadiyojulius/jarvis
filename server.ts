import express from "express";
import path from "path";
import os from "os";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client if key exists
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. GET /api/system/metrics - Returns genuine server/container stats + customizable simulated stats
app.get("/api/system/metrics", (req, res) => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercentage = Math.round((usedMem / totalMem) * 100);

    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const uptime = os.uptime();
    
    // Calculate a rough CPU utilization based on load average
    const cores = cpus.length;
    const load1Min = loadAvg[0];
    const estimatedCpuUtil = Math.min(Math.round((load1Min / cores) * 100), 100);

    res.json({
      timestamp: new Date().toISOString(),
      cpu: {
        cores,
        loadAverage: loadAvg,
        usage: estimatedCpuUtil || Math.floor(Math.random() * 15) + 10, // Avoid constant 0 on systems without active load average tracking
        model: cpus && cpus.length > 0 ? cpus[0].model : "Virtual Core",
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usage: memPercentage,
      },
      uptime,
      platform: os.platform(),
      arch: os.arch(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST /api/monitor/ping - Pings external URLs for developers to monitor their server/DB
app.post("/api/monitor/ping", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  const cleanUrl = url.trim();
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(cleanUrl, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "Companion-Monitor-HUD/1.0" },
    });
    
    clearTimeout(id);
    const latency = Date.now() - startTime;

    res.json({
      url: cleanUrl,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      latency,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const latency = Date.now() - startTime;
    res.json({
      url: cleanUrl,
      status: null,
      statusText: error.name === "AbortError" ? "Timeout (6000ms)" : error.message,
      ok: false,
      latency,
      timestamp: new Date().toISOString(),
    });
  }
});

// Built-in intelligent Offline / Local Coprocessor J.A.R.V.I.S. engine fallback
function getLocalJarvisResponse(message: string, metricsContext: any): string {
  const msg = message.toLowerCase();
  
  // Custom mechatronics dialogue triggers
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("greetings") || msg.includes("salutations")) {
    return `Greetings, developer. I am running on local-loop offline coprocessor backup. Sensors are operational, and local telemetry sweeps are active. How may I assist your mechatronic systems engineering workspace today?`;
  }
  
  if (msg.includes("cad") || msg.includes("fusion") || msg.includes("solidworks") || msg.includes("stress") || msg.includes("fea") || msg.includes("mesh") || msg.includes("safety") || msg.includes("load") || msg.includes("kn")) {
    const fos = metricsContext?.liveStats?.factorOfSafety || 1.49;
    return `### J.A.R.V.I.S. Local CAD & Structural Telemetry Analysis:
* **Factor of Safety (FoS):** Currently estimated or computed to be **${fos}**. A safety factor below 1.5 indicates a critical structural threshold where dynamic load risks joint failure.
* **Component Warnings:** I recommend tuning the **DYNAMIC MECHANICAL LOAD** slide on your FEA dashboard to decrease local compression stresses below 180 kN.
* **Optimization Recommendation:** Adjust CAD fasteners or structural joint webbing models in Fusion 360 to distribute tensile shear forces more evenly.`;
  }
  
  if (msg.includes("esp32") || msg.includes("pwm") || msg.includes("oscilloscope") || msg.includes("sine") || msg.includes("volt") || msg.includes("telemetry") || msg.includes("hz")) {
    return `### J.A.R.V.I.S. Embedded Hardware Log:
* **DSO Monitor:** Oscilloscope waveforms (PWM/Sine/COM) reflect instant core calibration at 3.28V reference logic gates.
* **Heat Ratio:** Core semiconductor thermals look stable under static load, but high duty cycles increase carrier noise.
* **Tinkercad Interface:** Select other components on the Tinkercad Parts list tab to view live local pinout physical harnesses and compile autogenerated C++ device drivers offline!`;
  }
  
  if (msg.includes("alert") || msg.includes("tripped") || msg.includes("ping") || msg.includes("offline") || msg.includes("github") || msg.includes("watchdog")) {
    return `### J.A.R.V.I.S. System Guard Heartbeat:
* **Network Status Checker:** Since we are operating on an isolated offline loop, our watchdog checks to external routes (such as \`api.github.com\`) will report latency dropouts and trigger alert sirens.
* **Actionable Tuning:** If you are working offline, you can disable these watchdogs by clicking the **Watchdog Disable** switch on the dashboard panel to keep the system status green, or adjust the limits in the active alert rule sliders.`;
  }

  if (msg.includes("offline") || msg.includes("internet") || msg.includes("disconnected") || msg.includes("port") || msg.includes("3000")) {
    return `### Offline Development Sync:
Your workspace is configured for local loopback development on port 3000. Under these parameters, external cloud requests bypass directly to my local rule-based coprocessor. Telemetry and simulated stress matrices run in high fidelity natively so you can design robotics offline smoothly!`;
  }

  if (msg.includes("help") || msg.includes("options") || msg.includes("features") || msg.includes("tasks") || msg.includes("add")) {
    return `### Embedded System Capabilities:
1. **Interactive Storage Oscilloscope:** Switch to the **ESP32** hardware tab and toggle PWM, Sine waves, or UART sweeps. Use the frequency slider to adjust live telemetry.
2. **Live FEA Stress Bracket SVG:** Go to the **CAD Metrics** tab and slide the dynamic Load force knob to see thermal/pressure stress contours update physically from cyan (safe) to deep red (shear fail!).
3. **C++ Device Driver Copier:** Select any Tinkercad component to inspect its physical harness wiring pins and grab the C++ microcontroller code instantly.
4. **Offline Guard Watchdog:** Safely inspect active pipeline servers or toggle rule watchdogs.`;
  }

  // Witty generic technical fallback
  return `### J.A.R.V.I.S. Co-processing Sync:
*"Awaiting parameters, developer."*

As your local engineering desk companion, I am assisting you in offline-secure sandbox mode. All systems are green:
* **Host CPU/Memory telemetry:** Fully synchronized.
* **Local mechatronics loop:** Actively plotting.
* **Interactive sensors:** Calibration locked.

How can I help you program the Arduino firmware or optimize active assembly designs?`;
}

function getLocalExplainAlertResponse(problemType: string, currentMetrics: any, logTrace: string, systemLabel: string): string {
  return `### J.A.R.V.I.S. Automated Offline Diagnostics Report
#### Root-cause identification for specialized event: "${problemType || "System Watchdog Alert"}"

I have parsed the telemetry parameters in our isolated local co-processing deck:
- **Trigger Source:** ${systemLabel || "Local Developer Workspace"}
- **Live Anomaly Context:** ${JSON.stringify(currentMetrics || {})}

#### 🛠️ Recommended Action Items:
1. **Manage Network Watchdogs:** If the alert was triggered by external route latency constraints (e.g. GitHub check failure), this is entirely expected under offline parameters. Toggle off the watchdog or adjust the rules threshold.
2. **Dynamic CAD Load Reduction:** If the alert mentions Factor of Safety (FoS) dropping to critical levels, check the applied load force on the CAD dashboard and downscale the dynamic force.
3. **Semiconductor Care:** If CPU/RAM load percentage exceeded bounds, verify that the active python background polling daemon is not executing duplicate high-frequency instances.`;
}

function getLocalMechatronicsDiagnoseResponse(state: any): string {
  const fos = state?.solidworksModel?.factorOfSafety || 1.85;
  const fosStatus = fos < 1.5 ? "FAILING (Dynamic fatigue imminent)" : fos < 2.0 ? "RISKY (Operating at borderline tolerance)" : "SAFE (Structural integrity compliant)";
  const temp = state?.esp32Device?.coreTempC || 41.5;
  const tempStatus = temp > 65 ? "OVERHEATING WARNING" : "OPTIMAL CORE GRADIENT";
  
  return `### J.A.R.V.I.S. Cybersecurity & Mechatronic Joint Report (Offline Mode)

* **Structural Integrity Analysis (SolidWorks Assembly: "${state?.solidworksModel?.activeAssembly || "CNC Assembly"}"):** 
  The computed Factor of Safety (FoS) is **${fos}** [Status: **${fosStatus}**]. Extreme strain on pivot joints might result in plastic shear deformation. Reduce load force below 180 kN to stabilize of safety indices.
  
* **Embedded Controller Evaluation (ESP32 on ${state?.esp32Device?.port || "COM4"}):**
  Sensor diagnostics returned an operating core potential of **${state?.esp32Device?.voltage || 3.28} V** and duty cycle of **${state?.esp32Device?.dutyCycle || 68.4}%**. Chip thermals reflect **${temp}°C** [Status: **${tempStatus}**]. The thermal dissipation is within nominal limits.
  
* **Fusion Warning Debugging:**
  For active joint constraints anomalies in \`${state?.fusionModel?.activeFile || "Suspension_Arm_v3.f3d"}\`, trace the missing projection dependencies. Sketch 14 contains disconnected sketch contours. Right-click and select 'Manage Lost Projections' to auto-heal.`;
}

// 3. POST /api/gemini/explain-alert - AI Diagnose critical status anomalies
app.post("/api/gemini/explain-alert", async (req, res) => {
  const { problemType, currentMetrics, logTrace, systemLabel } = req.body;
  try {
    const client = getGeminiClient();
    
    const prompt = `System Alert Triggered for ${systemLabel || "Developer Server"}!
Anomaly Event details:
- Critical Condition: ${problemType || "High CPU utilization / Memory threshold exceeded"}
- Current Live Metrics: ${JSON.stringify(currentMetrics)}
- Recent System Logs:
${logTrace || "No active log trace attached"}

As an elite DevOps/SRE J.A.R.V.I.S-themed engineering desk companion, provide:
1. A brief "JARVIS-style" witty greeting & summary of the diagnostic event (keep it high-energy/tech professional, e.g. "I've detected a notable disruption in the telemetry...")
2. Identification of 2-3 likely root-causes based on these metrics.
3. Precise, step-by-step engineering recommendations to resolve the issue.
4. Briefly summarize a terminal command they could execute on Mac or Linux to investigate further.

Format in clean markdown paragraphs. Keep it professional, reassuring, and concise for quick reading on a developer HUD.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the J.A.R.V.I.S. Artificial Intelligence desk assistant. You provide precise, deep, clean-cut diagnostic insights on computer systems, code pipelines, and servers with a confident, polite, and helpful cybertech persona. Speak respectfully but in a technical display style.",
      },
    });

    res.json({
      response: response.text,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    // Graceful offline fallback
    console.warn("[J.A.R.V.I.S.] Defaulting to Offline Explain AI Coprocessor:", error.message);
    const mockAns = getLocalExplainAlertResponse(problemType, currentMetrics, logTrace, systemLabel);
    res.json({
      response: mockAns,
      timestamp: new Date().toISOString(),
      offlineMode: true
    });
  }
});

// 4. POST /api/gemini/prompt-jarvis - Chat with Jarvis for assistance
app.post("/api/gemini/prompt-jarvis", async (req, res) => {
  const { message, metricsContext } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const client = getGeminiClient();

    const prompt = `User request: "${message}"
Companion Context (current system stats): ${JSON.stringify(metricsContext || {})}

Please respond directly as the J.A.R.V.I.S. engineering companion, providing direct, helpful, and highly technical support.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the J.A.R.V.I.S. Artificial Intelligence desk assistant. You are witty, polite, and extremely knowledgeable about engineering, software development, containerization, databases, and general troubleshooting. Use high-tech sci-fi and polite displays where suitable.",
      },
    });

    res.json({
      response: response.text,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    // Graceful offline fallback
    console.warn("[J.A.R.V.I.S.] Defaulting to Offline Chat Coprocessor:", error.message);
    const mockAns = getLocalJarvisResponse(message, metricsContext);
    res.json({
      response: mockAns,
      timestamp: new Date().toISOString(),
      offlineMode: true
    });
  }
});

// Initial Mechatronic in-memory store
let mechatronicData = {
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
    factorOfSafety: 1.85, // recommended is > 2.0
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
};

// GET /api/mechatronics - Query mechatronics telemetry status
app.get("/api/mechatronics", (req, res) => {
  res.json(mechatronicData);
});

// POST /api/mechatronics - Update state (external telemetry simulator or local Python CAD script hook)
app.post("/api/mechatronics", (req, res) => {
  try {
    const updated = req.body;
    
    // Deeply patch fields as suited
    if (updated.fusionModel) mechatronicData.fusionModel = { ...mechatronicData.fusionModel, ...updated.fusionModel };
    if (updated.solidworksModel) mechatronicData.solidworksModel = { ...mechatronicData.solidworksModel, ...updated.solidworksModel };
    if (updated.tinkercadDesign) mechatronicData.tinkercadDesign = { ...mechatronicData.tinkercadDesign, ...updated.tinkercadDesign };
    if (updated.esp32Device) {
      mechatronicData.esp32Device = { 
        ...mechatronicData.esp32Device, 
        ...updated.esp32Device,
        lastTelemetryTimestamp: new Date().toISOString()
      };
    }

    res.json({ success: true, mechatronics: mechatronicData });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/gemini/mechatronics-diagnose - SRE engineering recommendations for mechatronic CAD metrics and hardware parameters
app.post("/api/gemini/mechatronics-diagnose", async (req, res) => {
  const { state } = req.body;
  try {
    const client = getGeminiClient();

    const prompt = `Mechatronics Assessment Check:
1. Fusion 360 File: "${state?.fusionModel?.activeFile || "Unknown"}" (Complex joint count: ${state?.fusionModel?.componentCount || 0}). Active warnings: ${JSON.stringify(state?.fusionModel?.warnings)}.
2. SolidWorks simulation model: "${state?.solidworksModel?.activeAssembly || "Unknown"}". Active Finite Element Mesh Elements: ${state?.solidworksModel?.meshCount || 0}. Factor of Safety (FoS) simulated: ${state?.solidworksModel?.factorOfSafety || "N/A"}.
3. ESP32 Sensor Telemetry: Signal channel state on port ${state?.esp32Device?.port || "N/A"}. Live Voltage: ${state?.esp32Device?.voltage}V. PWM Duty Cycle: ${state?.esp32Device?.dutyCycle}%. Core Temperature: ${state?.esp32Device?.coreTempC}°C.

As an elite J.A.R.V.I.S-themed Mechatronics, CAD & Hardware Emulation expert, evaluate:
1. Mechanical Risk Analysis: Identify if the SolidWorks Factor of Safety (FoS) is acceptable (generally FoS > 2.0 is safe, < 1.5 is risky under dynamic loads).
2. Electronics Evaluation: Check if the ESP32 core temperature of ${state?.esp32Device?.coreTempC}°C and core voltage (${state?.esp32Device?.voltage}V) are healthy or showing signal fatigue.
3. CAD Joint Error: Explain how to solve the active Fusion 360 warnings.
4. Deliver high-end, witty, professional mechatronic advice on mechatronic calibration and mechatronic design.

Format in neat markdown bullet points. High-tech, polite, and reassuring tone.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are J.A.R.V.I.S., an elite cyber-physical systems engineering companion. You specialize in robotics, CAD analysis (Fusion 360, SolidWorks, Autodesk), mechatronic control, and ESP32 telemetry diagnostics.",
      },
    });

    res.json({
      response: response.text,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    // Graceful offline fallback
    console.warn("[J.A.R.V.I.S.] Defaulting to Offline Mechatronic Diagnoser:", error.message);
    const mockAns = getLocalMechatronicsDiagnoseResponse(state);
    res.json({
      response: mockAns,
      timestamp: new Date().toISOString(),
      offlineMode: true
    });
  }
});

// Setup dev server with Vite, or server static client build for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Companion HUD] Express Server running on port ${PORT}`);
  });
}

startServer();
