export interface SystemMetrics {
  timestamp: string;
  cpu: {
    cores: number;
    loadAverage: number[];
    usage: number; // Percentage
    model: string;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usage: number; // Percentage
  };
  uptime: number; // Seconds
  platform: string;
  arch: string;
}

export interface MonitoredServer {
  id: string;
  label: string;
  url: string;
  checkType: "ping" | "cpu" | "memory";
  intervalSeconds: number;
  lastChecked?: string;
  status: "unknown" | "online" | "offline" | "slow";
  latencyMs?: number;
  lastStatusText?: string;
  enabled: boolean;
}

export interface AlertTrigger {
  id: string;
  metric: "cpu" | "memory" | "ping_latency" | "ping_status";
  threshold: number; // limit (e.g., 80)
  comparison: "greater" | "less" | "offline";
  audioCueWord: string; // Speech synthesis phrase, e.g., "Warning: CPU usage exceeds critical threshold"
  soundEffect: "beep" | "chirp" | "radar" | "voice_only";
  enabled: boolean;
  isActive: boolean; // currently tripped
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error";
  emitter: string; // e.g., "HUDCORE", "MONITOR-1", "JARVIS"
  message: string;
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  createdAt: string;
}

export interface MechatronicState {
  fusionModel: {
    activeFile: string;
    lastSaved: string;
    componentCount: number;
    warnings: string[];
    isStressed: boolean;
  };
  solidworksModel: {
    activeAssembly: string;
    meshCount: number;
    factorOfSafety: number;
    simulationStatus: "idle" | "running" | "completed" | "error";
  };
  tinkercadDesign: {
    projectName: string;
    partsList: string[];
    viewUrl: string;
  };
  esp32Device: {
    connectionType: "serial" | "mqtt" | "offline";
    port: string;
    baudRate: number;
    voltage: number;
    dutyCycle: number;
    coreTempC: number;
    status: "idle" | "measuring" | "calibrated" | "error";
    lastTelemeteryTimestamp: string;
  };
}
