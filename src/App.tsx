import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Cpu,
  HardDrive,
  Wifi,
  ShieldAlert,
  Play,
  Volume2,
  Mic,
  MicOff,
  Send,
  Terminal,
  Sparkles,
  Plus,
  Trash2,
  BookmarkCheck,
  Music,
  Maximize2,
  Activity,
  Zap,
  CheckCircle,
  HelpCircle,
  AlertCircle
} from "lucide-react";

import {
  SystemMetrics,
  MonitoredServer,
  AlertTrigger,
  LogEntry,
  TaskItem
} from "./types";

import CompanionHUD from "./components/CompanionHUD";
import CalendarHUD from "./components/CalendarHUD";
import TaskCenter from "./components/TaskCenter";
import TerminalView from "./components/TerminalView";
import MechatronicCenter from "./components/MechatronicCenter";
import { playSyntheticAlert, speakAlertText } from "./components/AudioAlerts";

export default function App() {
  // 1. Core States
  const [metrics, setMetrics] = useState<SystemMetrics>({
    timestamp: new Date().toISOString(),
    cpu: {
      cores: 4,
      loadAverage: [1.2, 0.8, 0.4],
      usage: 24,
      model: "Intel i9 CPU Core"
    },
    memory: {
      total: 16 * 1024 * 1024 * 1024,
      free: 12.4 * 1024 * 1024 * 1024,
      used: 3.6 * 1024 * 1024 * 1024,
      usage: 22
    },
    uptime: 3600,
    platform: "darwin",
    arch: "arm64"
  });

  const [servers, setServers] = useState<MonitoredServer[]>([
    {
      id: "srv-github",
      label: "GitHub Core API",
      url: "https://api.github.com",
      checkType: "ping",
      intervalSeconds: 6,
      status: "online",
      latencyMs: 75,
      enabled: true
    },
    {
      id: "srv-httpbin",
      label: "Watchdog Dev server",
      url: "https://httpbin.org/status/200",
      checkType: "ping",
      intervalSeconds: 6,
      status: "online",
      latencyMs: 40,
      enabled: true
    }
  ]);

  const [alerts, setAlerts] = useState<AlertTrigger[]>([
    {
      id: "alert-cpu",
      metric: "cpu",
      threshold: 80,
      comparison: "greater",
      audioCueWord: "Acknowledge. Core processing unit thermal limit approaching threshold levels.",
      soundEffect: "beep",
      enabled: true,
      isActive: false
    },
    {
      id: "alert-mem",
      metric: "memory",
      threshold: 85,
      comparison: "greater",
      audioCueWord: "System alert. Volatile memory threshold has exceeded critical limits.",
      soundEffect: "chirp",
      enabled: true,
      isActive: false
    },
    {
      id: "alert-ping",
      metric: "ping_status",
      threshold: 0,
      comparison: "offline",
      audioCueWord: "Attention. Network route dropped. Remote developer container is currently offline.",
      soundEffect: "radar",
      enabled: true,
      isActive: false
    }
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "initial-log-1",
      timestamp: new Date().toISOString(),
      type: "success",
      emitter: "HUDCORE",
      message: "Diagnostics Desk Companion booted successfully. ESP32 emulation stable."
    },
    {
      id: "initial-log-2",
      timestamp: new Date().toISOString(),
      type: "info",
      emitter: "JARVIS",
      message: "Salutations, developer. I am fully integrated into your telemetry channels."
    }
  ]);

  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: "task-1",
      text: "Optimize local server kernel memory buffers",
      completed: false,
      priority: "high",
      createdAt: new Date().toISOString()
    },
    {
      id: "task-2",
      text: "Diagnose background stack trace leak",
      completed: false,
      priority: "medium",
      createdAt: new Date().toISOString()
    },
    {
      id: "task-3",
      text: "Configure live voice audio alert routines",
      completed: true,
      priority: "low",
      createdAt: new Date().toISOString()
    }
  ]);

  // UI Interactive States
  const [currentTrack, setCurrentTrack] = useState("Daft Punk - Contact (R.A.M)");
  const [isEditingTrack, setIsEditingTrack] = useState(false);
  const [newTrackInput, setNewTrackInput] = useState("");
  
  const [micEnabled, setMicEnabled] = useState(false);
  const [micVolume, setMicVolume] = useState(0); // 0-100 real volume
  const [voiceSynthesisEnabled, setVoiceSynthesisEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  const offlineModeRef = useRef(offlineMode);
  useEffect(() => {
    offlineModeRef.current = offlineMode;
  }, [offlineMode]);

  // Jarvis assistant chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "jarvis"; text: string; timestamp: Date }[]>([
    {
      sender: "jarvis",
      text: "I am ready to review your systems. Select any diagnostic shortcut or key in a direct prompt to examine active issues.",
      timestamp: new Date()
    }
  ]);
  const [isJarvisTyping, setIsJarvisTyping] = useState(false);

  // Quick inputs to add dynamic servers
  const [showAddServer, setShowAddServer] = useState(false);
  const [newServerLabel, setNewServerLabel] = useState("");
  const [newServerUrl, setNewServerUrl] = useState("");

  // Refs for loop management and audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Helper log function
  const addLog = useCallback((emitter: string, message: string, type: "info" | "success" | "warning" | "error" = "info") => {
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        type,
        emitter,
        message
      }
    ].slice(-100)); // Limit to 100 entries for memory longevity
  }, []);

  // 2. Fetch local host metrics
  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/system/metrics");
      if (!res.ok) throw new Error("API Route down");
      const data: SystemMetrics = await res.json();
      setMetrics(data);
    } catch (err: any) {
      // Automatic robust simulated drift stats if the backend handles issues
      setMetrics((prev) => {
        const driftCpu = Math.max(10, Math.min(99, prev.cpu.usage + (Math.random() * 12 - 6)));
        const driftMem = Math.max(10, Math.min(99, prev.memory.usage + (Math.random() * 4 - 2)));
        return {
          ...prev,
          timestamp: new Date().toISOString(),
          cpu: {
            ...prev.cpu,
            usage: Math.round(driftCpu)
          },
          memory: {
            ...prev.memory,
            usage: Math.round(driftMem)
          },
          uptime: prev.uptime + 3
        };
      });
    }
  };

  // Poll system stats
  useEffect(() => {
    const handle = setInterval(fetchMetrics, 3000);
    return () => clearInterval(handle);
  }, []);

  // 3. Keep watchdog running (Ping registered servers)
  const pingServers = async () => {
    setServers((currentList) => {
      const activeServers = currentList.filter((s) => s.enabled);
      activeServers.forEach(async (srv) => {
        try {
          if (offlineModeRef.current) {
            // High-fidelity local loop simulated ping
            setServers((prevList) =>
              prevList.map((item) => {
                if (item.id === srv.id) {
                  return {
                    ...item,
                    status: "online",
                    latencyMs: Math.floor(Math.random() * 3) + 1,
                    lastChecked: new Date().toISOString(),
                    lastStatusText: "OK (Offline Loop)"
                  };
                }
                return item;
              })
            );
            return;
          }

          const checkRes = await fetch("/api/monitor/ping", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: srv.url })
          });
          const responseData = await checkRes.json();
          
          setServers((prevList) =>
            prevList.map((item) => {
              if (item.id === srv.id) {
                const updatedStatus = responseData.ok ? "online" : "offline";
                
                // If status flipped, write warning to logs
                if (item.status === "online" && updatedStatus === "offline") {
                  addLog("WATCHDOG", `Signal loss on target check ${item.label} [${item.url}]. Alert flag set.`, "error");
                } else if (item.status === "offline" && updatedStatus === "online") {
                  addLog("WATCHDOG", `Network heartbeat restored on ${item.label} [${item.url}]. Link latency: ${responseData.latency}ms.`, "success");
                }

                return {
                  ...item,
                  status: updatedStatus,
                  latencyMs: responseData.latency,
                  lastChecked: new Date().toISOString(),
                  lastStatusText: responseData.statusText || `${responseData.status || "FAIL"}`
                };
              }
              return item;
            })
          );
        } catch (error) {
          // If network failed
          setServers((prevList) =>
            prevList.map((item) => {
              if (item.id === srv.id) {
                return {
                  ...item,
                  status: "offline",
                  latencyMs: 999,
                  lastChecked: new Date().toISOString(),
                  lastStatusText: "Connection breakdown"
                };
              }
              return item;
            })
          );
        }
      });
      return currentList;
    });
  };

  useEffect(() => {
    // Run initial on boot, then every 6 seconds
    pingServers();
    const handle = setInterval(pingServers, 6000);
    return () => clearInterval(handle);
  }, [addLog]);

  // 4. Checking alert rules thresholds & voice dispatch
  useEffect(() => {
    // Analyze Cpu threshold
    const isCpuOver = metrics.cpu.usage >= alerts.find((a) => a.metric === "cpu")?.threshold!;
    // Analyze Memory threshold
    const isMemOver = metrics.memory.usage >= alerts.find((a) => a.metric === "memory")?.threshold!;
    // Analyze Ping watchdog offline count
    const hasOfflineServers = servers.some((s) => s.enabled && s.status === "offline");

    setAlerts((prevAlerts) =>
      prevAlerts.map((rule) => {
        let conditionTripped = false;
        if (rule.metric === "cpu") conditionTripped = isCpuOver;
        if (rule.metric === "memory") conditionTripped = isMemOver;
        if (rule.metric === "ping_status") conditionTripped = hasOfflineServers;

        if (rule.enabled) {
          if (conditionTripped && !rule.isActive) {
            // Newly Tripped alerts!
            addLog("ALERTS", `TRIPPED: ${rule.metric.toUpperCase()} limit exceeded threshold levels!`, "error");
            playSyntheticAlert(rule.soundEffect);
            if (voiceSynthesisEnabled) {
              speakAlertText(rule.audioCueWord);
            }
          } else if (!conditionTripped && rule.isActive) {
            // Recovered alerts!
            addLog("ALERTS", `STABILIZED: ${rule.metric.toUpperCase()} metric normalized. Safe state restored.`, "success");
          }
        }

        return {
          ...rule,
          isActive: conditionTripped
        };
      })
    );
  }, [metrics.cpu.usage, metrics.memory.usage, servers, voiceSynthesisEnabled, addLog]);

  // Is any alert active? Used to change Companion UI ring indicators to Crimson Alert
  const isAnyAlertActive = alerts.some((a) => a.enabled && a.isActive);

  // 5. Connect Microhpone reactive analyzer loop
  const toggleMicrophone = async () => {
    if (micEnabled) {
      // Disconnect
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setMicEnabled(false);
      setMicVolume(0);
      addLog("HUDCORE", "Voice capture engine powered offline.", "info");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      setMicEnabled(true);
      addLog("HUDCORE", "Voice capture engine live. Outer visual feedback is now fully reactive.", "success");

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const mappedVolume = Math.min(100, Math.round((average / 128) * 100));
        setMicVolume(mappedVolume);
        
        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      addLog("HUDCORE", "Local microphone stream denied/unavailable.", "warning");
    }
  };

  // Clean mic loop on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // 6. Gemini diagnostics chat implementation
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || chatInput;
    if (!textToSend.trim()) return;

    // Add user message immediately
    setChatMessages((prev) => [...prev, { sender: "user", text: textToSend, timestamp: new Date() }]);
    setChatInput("");
    setIsJarvisTyping(true);
    addLog("JARVIS", `Consulting intelligence subroutines... Prompt: "${textToSend}"`, "info");

    try {
      const res = await fetch("/api/gemini/prompt-jarvis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          metricsContext: {
            liveStats: {
              cpu: metrics.cpu.usage,
              memory: metrics.memory.usage,
              uptime: metrics.uptime,
              platform: metrics.platform
            },
            activeAlerts: alerts.filter((a) => a.enabled && a.isActive).map((a) => a.metric),
            healthyRoutes: servers.filter((s) => s.status === "online").length,
            criticalRoutes: servers.filter((s) => s.status === "offline").length
          }
        })
      });

      const data = await res.json();
      const aiReply = data.response || "I was unable to synchronize with my server channels at this moment.";
      
      setChatMessages((prev) => [...prev, { sender: "jarvis", text: aiReply, timestamp: new Date() }]);
      addLog("JARVIS", "Intelligence feedback received completely.", "success");

      // Auto TTS readout
      if (voiceSynthesisEnabled) {
        speakAlertText(aiReply.replace(/[*#`_]/g, "").slice(0, 160)); // read first part politely
      }
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "jarvis",
          text: "My neural transmission lines encountered an anomaly. Please ensure your GEMINI_API_KEY secret is verified.",
          timestamp: new Date()
        }
      ]);
      addLog("JARVIS", "Failed to retrieve AI feedback.", "error");

      if (voiceSynthesisEnabled) {
        speakAlertText("Diagnostic stream failed. Please configure your API secret.");
      }
    } finally {
      setIsJarvisTyping(false);
    }
  };

  // Quick Action AI Diagnostic Assessment helper
  const triggerSreDiagnostic = async () => {
    setIsJarvisTyping(true);
    addLog("JARVIS", "Running deep telemetry diagnostics cluster. Scanning logs...", "warning");
    
    try {
      const activeAnomalies = alerts.filter((a) => a.isActive).map((a) => a.metric).join(", ") || "No active alarms";
      const traceDump = logs.slice(-8).map((l) => `[${l.emitter}] ${l.message}`).join("\n");

      const res = await fetch("/api/gemini/explain-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemType: activeAnomalies,
          currentMetrics: {
            cpuPercentage: metrics.cpu.usage,
            memoryPercentage: metrics.memory.usage,
            uptimeSec: metrics.uptime,
            platform: metrics.platform
          },
          logTrace: traceDump,
          systemLabel: "Local Desktop Companion"
        })
      });

      const data = await res.json();
      const diagResponse = data.response;

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "jarvis",
          text: diagResponse,
          timestamp: new Date()
        }
      ]);

      if (voiceSynthesisEnabled) {
        speakAlertText("System diagnostics complete. I have updated the dialogue pane with our primary root cause candidates.");
      }
    } catch (err) {
      addLog("JARVIS", "Diagnostic cluster command aborted.", "error");
    } finally {
      setIsJarvisTyping(false);
    }
  };

  // 6.5 J.A.R.V.I.S. Interactive Agent Tasks Synchronizer
  const handleInjectAgentTask = () => {
    const newTask: TaskItem = {
      id: `task-jarvis-${Date.now()}`,
      text: "Synchronize Solidworks FEA stress contours with mechatronic core",
      completed: false,
      priority: "high",
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [newTask, ...prev]);
    addLog("JARVIS", "Injected mechatronic task to active companion board.", "success");
    playSyntheticAlert("chirp");
    if (voiceSynthesisEnabled) {
      speakAlertText("System task synchronized with active mechatronic pipeline.");
    }
  };

  // 7. Watchdog servers manual editing actions
  const handleAddServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerLabel.trim() || !newServerUrl.trim()) return;

    let targetUrl = newServerUrl.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    const newSrv: MonitoredServer = {
      id: `srv-${Date.now()}`,
      label: newServerLabel.trim(),
      url: targetUrl,
      checkType: "ping",
      intervalSeconds: 6,
      status: "unknown",
      enabled: true
    };

    setServers((prev) => [...prev, newSrv]);
    addLog("WATCHDOG", `Registered route watchdog targeting: ${newSrv.label}`, "info");
    
    // reset form fields
    setNewServerLabel("");
    setNewServerUrl("");
    setShowAddServer(false);
    
    // immediate ping
    setTimeout(pingServers, 500);
  };

  const removeServer = (id: string, name: string) => {
    setServers((prev) => prev.filter((s) => s.id !== id));
    addLog("WATCHDOG", `Deregistered watchdog route: ${name}`, "warning");
  };

  // 8. Alerts Force trigger test routines
  const forceTriggerTest = (rule: AlertTrigger) => {
    addLog("TESTER", `Manual trigger test emitted: ${rule.metric.toUpperCase()}`, "warning");
    playSyntheticAlert(rule.soundEffect);
    speakAlertText(`Simulated: ${rule.audioCueWord}`);
  };

  // 9. Task interaction state modifiers
  const handleAddTask = (text: string, priority: "high" | "medium" | "low") => {
    const fresh: TaskItem = {
      id: `task-${Date.now()}`,
      text,
      completed: false,
      priority,
      createdAt: new Date().toISOString()
    };
    setTasks((prev) => [fresh, ...prev]);
    addLog("HUDCORE", `Created ticket: "${text}"`, "info");
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const toggledState = !t.completed;
          addLog("HUDCORE", `Ticket: [${t.text.slice(0, 20)}...] status updated to: ${toggledState ? "RESOLVED" : "ACTIVE"}`, "success");
          return { ...t, completed: toggledState };
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target) {
        addLog("HUDCORE", `Flushed ticket record: "${target.text.slice(0, 20)}..."`, "warning");
      }
      return prev.filter((t) => t.id !== id);
    });
  };

  const handleClearCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.completed));
    addLog("HUDCORE", "Database clean query: Purged all resolved engineering checklists.", "success");
  };

  // Media change simulation
  const applyTrackChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackInput.trim()) return;
    setCurrentTrack(newTrackInput.trim());
    setIsEditingTrack(false);
    addLog("HUDCORE", `Audio channel synced to simulated media: "${newTrackInput.trim()}"`, "info");
    setNewTrackInput("");
  };

  return (
    <div className="min-h-screen bg-[#05080a] text-cyan-400 font-mono relative p-4 md:p-6 overflow-x-hidden flex flex-col justify-between">
      {/* Background Mesh Gradient Blobs - Glowing Cyberpunk theme */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-[#00ffff] blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-[#004444] blur-[150px] animate-pulse" style={{ animationDuration: "12s" }}></div>
      </div>

      {/* Grid decor lines - sci-fi architectural details */}
      <div className="absolute inset-0 border border-cyan-500/5 pointer-events-none m-4 rounded-[2rem]"></div>
      <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-500/5 pointer-events-none"></div>

      {/* HEADER SECTION */}
      <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-[#00ffff22] pb-5 gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.3em] opacity-65 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            COMPANION DESKHUD v4.1.2
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            J.A.R.V.I.S.{" "}
            <span className="text-xs bg-cyan-950 px-2 py-0.5 border border-cyan-500/30 text-cyan-300 rounded font-normal">
              STABLE ORBITAL
            </span>
          </h1>
        </div>

        {/* Digital Clock & Calendar Info */}
        <div className="text-center bg-cyan-950/20 px-5 py-2.5 rounded-2xl border border-cyan-500/10 backdrop-blur-md">
          <div className="text-3xl md:text-4xl font-black tracking-widest text-[#00ffff]">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
          </div>
          <div className="text-[9px] uppercase tracking-[0.4em] mt-1.5 opacity-80 text-cyan-300">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </div>
        </div>

        {/* Security Indicator status bar */}
        <div className="text-right flex flex-col items-end">
          <span className="text-[9px] uppercase tracking-[0.3em] opacity-70">
            SECURITY KEY CHAIN
          </span>
          <span className="text-lg font-black text-emerald-400 flex items-center gap-1.5">
            🛡️ ENCRYPTED
          </span>
          <div className="flex gap-1 mt-2">
            <div className="w-5 h-1.5 bg-cyan-400 rounded-sm"></div>
            <div className="w-5 h-1.5 bg-cyan-400 rounded-sm"></div>
            <div className="w-5 h-1.5 bg-cyan-400 rounded-sm"></div>
            <div className="w-5 h-1.5 bg-cyan-400 rounded-sm animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* MAIN HUD LAYOUT GRID */}
      <main className="relative z-10 grid grid-cols-12 gap-5 flex-1 items-stretch">
        
        {/* LEFT COLUMN: Media Visualizer, Checklist & Calendar Chronograph */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-5">
          
          {/* Calendar Chronograph */}
          <div className="bg-[#ffffff03] backdrop-blur-md border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] rounded-3xl p-1">
            <CalendarHUD />
          </div>

          {/* Active Tasks Center */}
          <div className="flex-1 bg-[#ffffff03] backdrop-blur-md border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] rounded-3xl p-1 flex flex-col min-h-64">
            <TaskCenter
              tasks={tasks}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onClearCompleted={handleClearCompleted}
            />
          </div>

          {/* Simulated Media Track Player Widget */}
          <div className="bg-[#ffffff03] backdrop-blur-md border border-white/5 p-5 rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                MEDIA SYNC MONITOR
              </span>
              <button
                onClick={() => setIsEditingTrack(!isEditingTrack)}
                className="text-[9px] hover:text-white uppercase transition-colors"
              >
                [Edit Track]
              </button>
            </div>

            {isEditingTrack ? (
              <form onSubmit={applyTrackChange} className="flex gap-2">
                <input
                  type="text"
                  value={newTrackInput}
                  onChange={(e) => setNewTrackInput(e.target.value)}
                  placeholder="Artist - Track Name..."
                  className="flex-1 bg-slate-900 border border-cyan-500/30 rounded-xl px-2.5 py-1 text-xs text-white"
                />
                <button
                  type="submit"
                  className="bg-cyan-950 px-2.5 border border-cyan-500/40 text-xs text-cyan-300 rounded-xl hover:bg-cyan-900 fill-none"
                >
                  Save
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-3 bg-cyan-950/20 p-2.5 rounded-2xl border border-cyan-500/5">
                {/* Visual pulsating visualizer block */}
                <div className="w-10 h-10 bg-cyan-950/40 border border-cyan-500/20 flex gap-0.5 items-end justify-center p-1.5 rounded-lg select-none">
                  {[2, 4, 3, 5, 2].map((lvl, index) => (
                    <div
                      key={`eq-${index}`}
                      className="w-1.5 bg-cyan-400 rounded-xs"
                      style={{
                        height: `${lvl * 20}%`,
                        animationName: "pulse",
                        animationDuration: `${0.4 + index * 0.1}s`,
                        animationIterationCount: "infinite",
                        animationTimingFunction: "ease-in-out",
                        animationDirection: "alternate"
                      }}
                    ></div>
                  ))}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{currentTrack.split(" - ")[0]}</p>
                  <p className="text-[9px] text-cyan-400/80 tracking-wider truncate">
                    {currentTrack.split(" - ")[1] || "Engineering Track"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER COLUMN: Central Interactive Core Orb, Microphone control & AI conversational desk helper */}
        <section className="col-span-12 lg:col-span-6 flex flex-col gap-5 items-stretch">
          
          {/* Upper core: orbiting reactive rings companion */}
          <div className="grid grid-cols-1 md:grid-cols-2 bg-[#ffffff03] backdrop-blur-md border border-white/5 rounded-3xl p-5 gap-5 items-center relative overflow-hidden">
            {/* Dynamic visualizer core (mic reactivity or default oscillation math) */}
            <div className="flex justify-center items-center">
              <CompanionHUD
                cpuUsage={micEnabled ? Math.max(metrics.cpu.usage, micVolume) : metrics.cpu.usage}
                memoryUsage={metrics.memory.usage}
                isAlertActive={isAnyAlertActive}
                systemName="J.A.R.V.I.S."
              />
            </div>

            {/* Core telemetry details panel */}
            <div className="flex flex-col gap-4">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-white">
                HEURISTIC INTELLIGENCE ENGINE
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                A highly customizable hardware and container monitor with synthetic alert integration, speech dispatch, and deep root diagnosis. Key in custom tasks or test alerts to examine synthesis.
              </p>

              {/* Reactive volume controller inputs */}
              <div className="flex flex-wrap gap-2.5 mt-2">
                <button
                  onClick={toggleMicrophone}
                  className={`flex items-center gap-2 px-3  py-2 rounded-xl border text-xs font-bold transition-all ${
                    micEnabled
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 animate-pulse"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/20"
                  }`}
                >
                  {micEnabled ? <Mic className="w-4 h-4 text-cyan-300" /> : <MicOff className="w-4 h-4" />}
                  {micEnabled ? "Mic Analyzer Active" : "Reactive Voice Loop"}
                </button>

                <button
                  onClick={() => setVoiceSynthesisEnabled(!voiceSynthesisEnabled)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs transition-all ${
                    voiceSynthesisEnabled
                      ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-900/60 border-slate-800 text-slate-500"
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  Voice TTS: {voiceSynthesisEnabled ? "ON" : "MUTE"}
                </button>
              </div>

              {micEnabled && (
                <div className="mt-1">
                  <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                    <span>MIC INPUT DB FEEDBACK:</span>
                    <span>{micVolume} dB v2</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-cyan-500/5">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-75"
                      style={{ width: `${micVolume}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* JARVIS Dialogue pane & active diagnostics console */}
          <div className="flex-1 bg-[#ffffff03] backdrop-blur-md border border-white/5 rounded-3xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.6)] flex flex-col justify-between min-h-80 gap-4">
            
            {/* Console dialogue header */}
            <div className="flex justify-between items-center border-b border-cyan-500/10 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                CONVERSATIONAL ANOMALY SOLVER
              </div>

              {/* One-click diagnostic cluster assessment trigger */}
              <button
                onClick={triggerSreDiagnostic}
                disabled={isJarvisTyping}
                className="text-[9px] bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 font-bold uppercase py-1 px-3 text-cyan-300 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" /> Analyze Active Alarms (Gemini SRE)
              </button>
            </div>

            {/* Chat list space */}
            <div className="flex-1 overflow-y-auto max-h-60 space-y-3 pr-1 custom-scrollbar text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={`msg-${i}`}
                  className={`flex flex-col p-3 rounded-2xl max-w-[85%] border leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-cyan-950/20 border-cyan-500/20 text-cyan-100 self-end ml-auto"
                      : "bg-[#ffffff03] border-white/5 text-slate-200 self-start"
                  }`}
                >
                  <span className={`text-[8px] uppercase tracking-wider mb-1 ${
                    msg.sender === "user" ? "text-cyan-400" : "text-amber-400"
                  }`}>
                    {msg.sender === "user" ? "Developer Agent" : "J.A.R.V.I.S. Artificial Intelligence"}
                  </span>
                  <div className="whitespace-pre-wrap font-sans text-[11px]">{msg.text}</div>
                </div>
              ))}
              
              {isJarvisTyping && (
                <div className="flex gap-1 items-center p-2.5 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  Consulting core logical pipeline diagnostics...
                </div>
              )}
            </div>

            {/* Interaction Shortcuts & Input bar */}
            <div className="pt-2 border-t border-cyan-500/10 flex flex-col gap-2.5">
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Recommended Diagnostic prompts:</span>
                <button
                  onClick={() => handleSendMessage("Perform memory leak analysis. What could cause 85%+ volatile RAM spike?")}
                  className="text-[9.5px] px-2 py-0.5 rounded-md border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/20 transition-all font-mono"
                >
                  Memory Leak?
                </button>
                <button
                  onClick={() => handleSendMessage("What commands can I run on macOS/Linux to investigate CPU thermal stress issues?")}
                  className="text-[9.5px] px-2 py-0.5 rounded-md border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/20 transition-all font-mono"
                >
                  CPU Investigation Cmds
                </button>
                <button
                  onClick={() => handleSendMessage("How do I structure robust Docker multi-container log aggregations?")}
                  className="text-[9.5px] px-2 py-0.5 rounded-md border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/20 transition-all font-mono"
                >
                  Docker logs
                </button>
              </div>

              <div className="flex gap-2.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask Jarvis to diagnostics anomaly, write scripts, audit load averages..."
                  className="flex-1 bg-slate-950/60 border border-cyan-500/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="px-4.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-400 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </section>

        {/* RIGHT COLUMN: Resource diagnostics, Watchdog server management, Config rules */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-5">
          
          {/* Detailed Resource Monitor progress bars */}
          <div className="bg-[#ffffff03] backdrop-blur-md border border-white/5 p-5 rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white border-b border-cyan-500/10 pb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              DETAILED TELEMETRY HUD
            </h3>

            <div className="space-y-3 text-xs">
              {/* CPU load */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="opacity-70 uppercase">CORE LOAD</span>
                  <span className="text-cyan-300">{metrics.cpu.usage}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-cyan-500/5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-300"
                    style={{ width: `${metrics.cpu.usage}%` }}
                  ></div>
                </div>
              </div>

              {/* Memory Usage */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="opacity-70 uppercase">VIRTUAL RAM</span>
                  <span className="text-cyan-300">{metrics.memory.usage}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-cyan-500/5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-300"
                    style={{ width: `${metrics.memory.usage}%` }}
                  ></div>
                </div>
              </div>

              {/* Simulated GPU Temperature based on cpu usage */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="opacity-70 uppercase">CORE TEMP</span>
                  <span className={metrics.cpu.usage > 65 ? "text-amber-400 font-bold" : "text-cyan-300"}>
                    {Math.round(42 + metrics.cpu.usage * 0.45)} °C
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-cyan-500/5">
                  <div
                    className={`h-full transition-all duration-300 ${
                      metrics.cpu.usage > 65 ? "bg-amber-400" : "bg-cyan-400"
                    }`}
                    style={{ width: `${Math.round(42 + metrics.cpu.usage * 0.45)}%` }}
                  ></div>
                </div>
              </div>

              {/* Extra technical specifications block */}
              <div className="mt-3 bg-cyan-950/20 p-2.5 rounded-2xl border border-cyan-500/5 text-[9px] text-slate-400 flex flex-col gap-1 select-none">
                <div className="flex justify-between"><span className="uppercase">Platform:</span> <span className="text-white uppercase">{metrics.platform} ({metrics.arch})</span></div>
                <div className="flex justify-between"><span className="uppercase">Uptime:</span> <span className="text-white">{Math.round(metrics.uptime / 60)} minutes</span></div>
                <div className="flex justify-between"><span className="uppercase">Model:</span> <span className="text-white truncate max-w-[120px]">{metrics.cpu.model}</span></div>
              </div>
            </div>
          </div>

          {/* WATCHDOG SERVER LIST - Pings and displays latency */}
          <div className="bg-[#ffffff03] backdrop-blur-md border border-white/5 p-5 rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-cyan-500/10 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <Wifi className="w-4 h-4 text-cyan-400" />
                WATCHDOG ENDPOINTS
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const nextMode = !offlineMode;
                    setOfflineMode(nextMode);
                    addLog(
                      "HUDCORE", 
                      `Global Telemetry Mode changed to: ${nextMode ? "OFFLINE COPROCESSOR" : "CLOUD REAL-TIME"}.`, 
                      nextMode ? "warning" : "success"
                    );
                    playSyntheticAlert("beep");
                  }}
                  className={`text-[8.5px] px-2 py-0.5 rounded-md border tracking-wider uppercase font-bold cursor-pointer transition-all ${
                    offlineMode
                      ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                      : "bg-cyan-950/40 border-cyan-500/20 text-cyan-400 hover:border-cyan-400"
                  }`}
                  title={offlineMode ? "Switch to Cloud Connected Watchdog" : "Switch to Local Offline Sandbox Mode"}
                >
                  {offlineMode ? "📶 Offline Loop" : "🌐 Connected"}
                </button>
                <button
                  onClick={() => setShowAddServer(!showAddServer)}
                  className="text-[9px] bg-cyan-950 px-2 py-0.5 text-cyan-400 rounded-md border border-cyan-500/20 hover:bg-cyan-900 cursor-pointer transition-colors"
                >
                  {showAddServer ? "Close" : "+ Add"}
                </button>
              </div>
            </div>

            {showAddServer && (
              <form onSubmit={handleAddServer} className="bg-[#05080a] p-3 border border-cyan-500/10 rounded-2xl flex flex-col gap-2.5">
                <input
                  type="text"
                  placeholder="Server Name (e.g., PostgreSQL/Vercel)"
                  value={newServerLabel}
                  onChange={(e) => setNewServerLabel(e.target.value)}
                  className="bg-slate-900 border border-cyan-500/20 rounded-xl px-2.5 py-1 text-[10px] text-white"
                />
                <input
                  type="text"
                  placeholder="URL (e.g., myserver.com/ping)"
                  value={newServerUrl}
                  onChange={(e) => setNewServerUrl(e.target.value)}
                  className="bg-slate-900 border border-cyan-500/20 rounded-xl px-2.5 py-1 text-[10px] text-white"
                />
                <button
                  type="submit"
                  className="bg-cyan-950 px-3 py-1 font-bold text-[9px] uppercase tracking-wider text-cyan-300 border border-cyan-500/30 rounded-lg hover:bg-cyan-900"
                >
                  Lock On Route
                </button>
              </form>
            )}

            {/* List of active pings */}
            <div className="space-y-2.5 overflow-y-auto max-h-48 pr-1 custom-scrollbar">
              {servers.map((srv) => (
                <div
                  key={srv.id}
                  className="p-2.5 rounded-2xl bg-slate-950/30 border border-slate-900 flex flex-col gap-1 text-[10px] relative group"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">{srv.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-md font-bold text-[8px] uppercase ${
                      srv.status === "online"
                        ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-950/40 text-red-400 border border-red-500/20"
                    }`}>
                      {srv.status}
                    </span>
                  </div>

                  <span className="text-[9px] text-slate-500 truncate">{srv.url}</span>

                  <div className="flex justify-between items-center text-[8px] text-slate-500 mt-1">
                    <span>Latency: <span className="text-cyan-400">{srv.latencyMs !== undefined ? `${srv.latencyMs}ms` : "N/A"}</span></span>
                    <span>Status: {srv.lastStatusText || "None"}</span>
                  </div>

                  {/* Remove route icon button */}
                  <button
                    onClick={() => removeServer(srv.id, srv.label)}
                    className="absolute top-2.5 right-2 mt-0.5 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIVE ALERTS CHECKLIST / THRESHOLDS SETTINGS */}
          <div className="bg-[#ffffff03] backdrop-blur-md border border-white/5 p-5 rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white border-b border-cyan-500/10 pb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              ALERT RULE PARAMETERS
            </h3>

            <div className="space-y-2.5">
              {alerts.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-2 rounded-2xl font-mono text-[9px] flex flex-col gap-1 border border-dashed text-slate-400 ${
                    rule.isActive && rule.enabled
                      ? "border-red-500/30 bg-red-950/10 text-red-300"
                      : "border-slate-800 bg-transparent"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase text-slate-200 flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${rule.isActive && rule.enabled ? "bg-red-500 animate-ping" : "bg-cyan-500/70"}`}></span>
                      {rule.metric.replace("_", " ")}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => forceTriggerTest(rule)}
                        className="text-[8px] border border-cyan-500/15 py-0.5 px-1.5 bg-cyan-950/20 text-cyan-400 rounded-sm hover:bg-cyan-950 transition-colors"
                      >
                        Force Trip
                      </button>
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() =>
                          setAlerts((prev) =>
                            prev.map((a) => (a.id === rule.id ? { ...a, enabled: !a.enabled } : a))
                          )
                        }
                        className="cursor-pointer"
                      />
                    </div>
                  </div>

                  {rule.metric !== "ping_status" ? (
                    <div className="flex items-center gap-2.5 text-[8px] text-slate-500 mt-1">
                      <span>LIMIT:</span>
                      <input
                        type="number"
                        min="20"
                        max="98"
                        value={rule.threshold}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAlerts((prev) =>
                            prev.map((a) => (a.id === rule.id ? { ...a, threshold: val } : a))
                          );
                        }}
                        className="w-12 bg-slate-900 border border-cyan-500/20 text-center text-white text-[8px] rounded-sm py-0.5"
                      />
                      <span>%</span>
                    </div>
                  ) : (
                    <span className="text-[8.5px] text-slate-500 mt-1">Triggers if any route flips offline</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </aside>

      </main>

      {/* MECHATRONICS INTEGRATION CONTROL PANEL */}
      <section className="relative z-10 grid grid-cols-12 gap-5 mt-5">
        <div className="col-span-12">
          <MechatronicCenter 
            logs={logs} 
            addLog={addLog} 
            voiceSynthesisEnabled={voiceSynthesisEnabled} 
          />
        </div>
      </section>

      {/* DIAGNOSTIC LOG STREAM BOARD (Span 12 Columns) */}
      <footer className="relative z-10 grid grid-cols-12 gap-5 mt-5">
        <div className="col-span-12">
          <TerminalView logs={logs} onClearLogs={() => setLogs([])} />
        </div>
      </footer>

      {/* STATUS FOOTER BAR & J.A.R.V.I.S. COPROCESSOR AGENT TASKBAR */}
      <footer className="relative z-10 flex flex-col xl:flex-row justify-between items-center text-[9px] border-t border-[#00ffff22] mt-6 pt-5 uppercase tracking-[0.15em] gap-4 select-none bg-slate-950/20 p-4 rounded-2xl border border-cyan-500/10 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        {/* Core Connection Spec */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 bg-[#020508] px-3 py-1.5 rounded-xl border border-cyan-500/10">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#22c55e] animate-pulse"></div>
            <span className="text-emerald-400 font-bold">TELEMETRY LINK: ONLINE</span>
          </div>
          <div className="opacity-70 text-[8.5px] font-mono">Emulated Temp: Stable</div>
          <div className="opacity-70 text-[8.5px] font-mono">Core Threads: 4 Active</div>
        </div>

        {/* J.A.R.V.I.S Active Agent Interface Block */}
        <div className="flex flex-1 max-w-xl items-center gap-3 px-3.5 py-1 bg-cyan-950/20 border border-cyan-400/20 rounded-xl mx-2 shadow-[inset_0_0_8px_rgba(6,182,212,0.1)]">
          {/* Pulsing Arc Reactor Core Visual */}
          <div 
            onClick={() => {
              playSyntheticAlert("chirp");
              speakAlertText("Greetings. J.A.R.V.I.S. intelligence coprocessor is completely operational. Present parameters looks stable.");
              addLog("JARVIS", "Agent triggered via console touch reactor.", "success");
            }}
            className="relative w-8 h-8 rounded-full border border-cyan-400/40 flex items-center justify-center cursor-pointer hover:border-cyan-300 transition-all shadow-[0_0_8px_rgba(6,182,212,0.2)] group"
            title="Trigger J.A.R.V.I.S. Core Diagnostics Voice"
          >
            {/* Spinning Outer Ring */}
            <div className="absolute inset-0.5 rounded-full border border-dashed border-cyan-400/60 animate-spin group-hover:animate-[spin_4s_linear_infinite]"></div>
            {/* Pulsing Core */}
            <div className={`w-3.5 h-3.5 rounded-full ${isJarvisTyping ? "bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-ping" : "bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse"}`}></div>
          </div>

          <div className="flex flex-col flex-1 truncate text-left">
            <div className="flex items-center gap-1.5 text-[8px] font-bold text-cyan-300 tracking-wider">
              <span>J.A.R.V.I.S. AGENT COPROCESSOR:</span>
              <span className={isJarvisTyping ? "text-amber-400 animate-pulse font-bold" : "text-emerald-400 font-bold"}>
                {isJarvisTyping ? "[THINKING...]" : "[ACTIVE STANDBY]"}
              </span>
            </div>
            
            {/* Live speech dialogue tracker */}
            <div className="text-[8.5px] text-slate-300 lowercase truncate font-mono max-w-[320px]">
              "{chatMessages[chatMessages.length - 1]?.text ? chatMessages[chatMessages.length - 1].text.slice(0, 75) + "..." : "Systems operational. awaiting instructions..."}"
            </div>
          </div>
        </div>

        {/* Active Taskbar Micro Controls */}
        <div className="flex gap-2 items-center">
          {/* Quick assessment action */}
          <button
            onClick={triggerSreDiagnostic}
            disabled={isJarvisTyping}
            className="px-2.5 py-1.5 bg-[#05080a] border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 rounded-lg text-[8px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Diagnose active mechatronic anomalies with J.A.R.V.I.S"
          >
            <Activity className="w-3 h-3 text-cyan-400 shrink-0" /> Assess SRE
          </button>

          {/* Inject task on task checklist */}
          <button
            onClick={handleInjectAgentTask}
            className="px-2.5 py-1.5 bg-[#05080a] border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 rounded-lg text-[8px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
            title="Let J.A.R.V.I.S inject diagnostic schedules"
          >
            <Plus className="w-3 h-3 text-cyan-400 shrink-0" /> Task Sync
          </button>

          {/* Voice toggle */}
          <button
            onClick={() => {
              setVoiceSynthesisEnabled(!voiceSynthesisEnabled);
              playSyntheticAlert("beep");
            }}
            className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
              voiceSynthesisEnabled 
                ? "bg-cyan-950/30 border-cyan-400/65 text-cyan-300 shadow-[0_0_6px_rgba(6,182,212,0.15)]" 
                : "bg-slate-900/50 border-slate-800 text-slate-600"
            }`}
            title={voiceSynthesisEnabled ? "Mute JARVIS Synthesizer Audio" : "Unmute JARVIS Synthesizer Audio"}
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>

          <span className="opacity-45 text-slate-600 font-mono text-[7.5px] hidden md:inline ml-1">PORT: /dev/tty.pico</span>
        </div>
      </footer>
    </div>
  );
}
