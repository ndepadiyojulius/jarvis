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

// 3. POST /api/gemini/explain-alert - AI Diagnose critical status anomalies
app.post("/api/gemini/explain-alert", async (req, res) => {
  try {
    const { problemType, currentMetrics, logTrace, systemLabel } = req.body;
    
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
    res.status(500).json({ error: error.message });
  }
});

// 4. POST /api/gemini/prompt-jarvis - Chat with Jarvis for assistance
app.post("/api/gemini/prompt-jarvis", async (req, res) => {
  try {
    const { message, metricsContext } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

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
    res.status(500).json({ error: error.message });
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
  try {
    const { state } = req.body;
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
    res.status(500).json({ error: error.message });
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
