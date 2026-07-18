import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import Editor from "@monaco-editor/react";
import "./App.css";

// --- TYPES & INTERFACES ---
interface Channel {
  id: string;
  name: string;
  active?: boolean;
  connectedUsers?: string[];
}

interface Category {
  name: string;
  type: "text" | "voice";
  channels: Channel[];
}

interface Server {
  id: string;
  name: string;
  iconLetter: string;
  categories: Category[];
}

interface MessageAttachment {
  name: string;
  size: string;
  dataUrl?: string;
  type: string;
}

interface Message {
  author: string;
  text: string;
  time: string;
  color: string;
  code?: string;
  attachment?: MessageAttachment;
}

interface Profile {
  name: string;
  avatar: string;
  avatarColor: string;
  bgColor?: string;
  role: string;
  roleColor?: string;
  status?: string;
  fingerprint: string;
}

interface Toast {
  id: number;
  message: string;
}

interface RecentFile {
  name: string;
  code: string;
  language: string;
}

// --- WIDGET SYSTEM TYPES ---
type WidgetType = "recent-files" | "git-status" | "weather" | "privacy-guard" | "custom";
type WidgetColSpan = 1 | 2;
type WidgetRowSpan = 1 | 2;
interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  bgColor: string;
  colSpan: WidgetColSpan;
  rowSpan: WidgetRowSpan;
  order: number;
  customCode: string;
}

// --- MOCK DATABASE ---
const initialServers: Server[] = [
  {
    id: "zeno-dev",
    name: "Zeno Development",
    iconLetter: "Z",
    categories: [
      {
        name: "Textkanäle",
        type: "text",
        channels: [
          { id: "allgemein", name: "allgemein", active: true },
          { id: "dev-talk", name: "dev-talk" },
          { id: "ui-design", name: "ui-design" },
          { id: "kryptografie", name: "kryptografie" }
        ]
      },
      {
        name: "Sprachkanäle",
        type: "voice",
        channels: [
          { id: "voice-lobby", name: "Voice Lobby", connectedUsers: ["Max", "Lena"] },
          { id: "pair-programming", name: "Pair Programming" }
        ]
      }
    ]
  },
  {
    id: "gaming-hub",
    name: "Gaming Hub",
    iconLetter: "G",
    categories: [
      {
        name: "Textkanäle",
        type: "text",
        channels: [
          { id: "lobby", name: "lobby" },
          { id: "lfg", name: "lfg-gaming" },
          { id: "clips", name: "clips-and-highlights" }
        ]
      },
      {
        name: "Sprachkanäle",
        type: "voice",
        channels: [
          { id: "duo-1", name: "Duo Queue 1" },
          { id: "duo-2", name: "Duo Queue 2" },
          { id: "squad-room", name: "Squad Room" }
        ]
      }
    ]
  },
  {
    id: "design-team",
    name: "Design Team",
    iconLetter: "D",
    categories: [
      {
        name: "Textkanäle",
        type: "text",
        channels: [
          { id: "design-system", name: "design-system" },
          { id: "moodboards", name: "moodboards" },
          { id: "ux-research", name: "ux-research" }
        ]
      },
      {
        name: "Sprachkanäle",
        type: "voice",
        channels: [
          { id: "feedback-sync", name: "Feedback Sync" },
          { id: "brainstorming", name: "Brainstorming" }
        ]
      }
    ]
  },
  {
    id: "open-source",
    name: "Open Source",
    iconLetter: "O",
    categories: [
      {
        name: "Textkanäle",
        type: "text",
        channels: [
          { id: "announcements", name: "announcements" },
          { id: "general", name: "general" },
          { id: "issues", name: "issues-and-pr" }
        ]
      },
      {
        name: "Sprachkanäle",
        type: "voice",
        channels: [
          { id: "community-call", name: "Community Call" }
        ]
      }
    ]
  }
];

const initialMessages: Record<string, Message[]> = {
  allgemein: [
    { author: "MaxShield", text: "Hat jemand schon den neuen SFrame-Branch getestet? Die Latenz im Voice ist deutlich besser.", time: "10:14", color: "blue" },
    { author: "LenaCrypt", text: "Ja, funktioniert super! Hier ist mein Benchmark-Script:", time: "10:16", color: "green", code: "use zeno_core::crypto::sframe;\nuse std::time::Instant;\n\nfn main() {\n    let key = sframe::generate_key();\n    let payload = vec![0u8; 960];\n    let start = Instant::now();\n    for _ in 0..10_000 {\n        let _ = sframe::encrypt(&key, &payload);\n    }\n    println!(\"10k encryptions: {:?}\", start.elapsed());\n}" },
    { author: "CipherNaut", text: "Nice! 🔥 Die Zahlen sehen vielversprechend aus. Ich merge den Branch heute Abend.", time: "10:18", color: "purple" }
  ],
  "dev-talk": [
    { author: "CipherNaut", text: "Wir müssen die WASM-Sandbox-Performance im Auge behalten.", time: "09:12", color: "purple" },
    { author: "MaxShield", text: "Stimmt, ich mache dazu einen Benchmark.", time: "09:15", color: "blue" }
  ],
  "ui-design": [
    { author: "LenaCrypt", text: "Ich habe die neuen Entwürfe für das Zeno-Branding hochgeladen. Was meint ihr?", time: "11:02", color: "green" }
  ],
  kryptografie: [
    { author: "LenaCrypt", text: "Das 3-Stufen-Modell für Key-Recovery (Gerätekopplung, Cloud-Backup, Social Recovery) steht.", time: "14:20", color: "green" }
  ],
  lobby: [
    { author: "MaxShield", text: "Moin, zockt heute jemand? 🎮", time: "18:44", color: "blue" }
  ]
};

const mockProfiles: Record<string, Profile> = {
  MaxShield: {
    name: "MaxShield",
    avatar: "M",
    avatarColor: "blue",
    role: "Entwickler",
    roleColor: "blue",
    status: '"Latenz-Optimierung läuft..."',
    fingerprint: "0x8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890BCDEF12"
  },
  LenaCrypt: {
    name: "LenaCrypt",
    avatar: "L",
    avatarColor: "green",
    role: "Entwickler",
    roleColor: "green",
    status: '"Opus-Streams & SFrame standardisiert."',
    fingerprint: "0x2C3D4E5F67890BCDEF1234567890ABCDEF123456"
  },
  CipherNaut: {
    name: "CipherNaut",
    avatar: "C",
    avatarColor: "purple",
    bgColor: "var(--accent-purple, #9B6BDF)",
    role: "Unterstützer",
    roleColor: "warning",
    status: '"Zeno verschlüsselt meine Daten."',
    fingerprint: "0xA3F9D1E8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890"
  },
  ZenoBot: {
    name: "ZenoBot",
    avatar: "Z",
    avatarColor: "orange",
    role: "Bot",
    roleColor: "warning",
    status: '"Typisierter RPC-Brückenwächter."',
    fingerprint: "0x5F67890BCDEF1234567890ABCDEF1234567890AB"
  },
  DarkNode: {
    name: "DarkNode",
    avatar: "D",
    avatarColor: "gray",
    role: "Offline",
    roleColor: "muted",
    status: '"Offline - Tor relay ist online."',
    fingerprint: "0xBCDEF1234567890ABCDEF1234567890ABCDEF123"
  },
  QuantumLeap: {
    name: "QuantumLeap",
    avatar: "Q",
    avatarColor: "gray",
    role: "Offline",
    roleColor: "muted",
    status: '"Suche post-quantum Signaturen..."',
    fingerprint: "0xABCDEF1234567890ABCDEF1234567890ABCDEF12"
  }
};

const darkPresets = [
  { color: "#18191B", title: "Default Dark" },
  { color: "#0F1015", title: "Deep Space" },
  { color: "#0F1411", title: "Forest Green" },
  { color: "#150F1A", title: "Nebula Purple" }
];

const lightPresets = [
  { color: "#E3E4E8", title: "Default Light" },
  { color: "#DCE2EC", title: "Soft Blue" },
  { color: "#DCECE0", title: "Soft Green" },
  { color: "#E5DCEC", title: "Soft Lavender" }
];

// --- HELPER FUNCTIONS ---
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function detectLanguage(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return "javascript";
  
  if (trimmed.startsWith("<html") || trimmed.startsWith("<!DOCTYPE html") || (trimmed.includes("<div") && trimmed.includes("</div>"))) {
    return "html";
  }
  if (trimmed.includes("body {") || trimmed.includes("margin:") || (trimmed.includes("color:") && trimmed.includes("{") && trimmed.includes("}"))) {
    return "css";
  }
  if (trimmed.includes("fn main()") || trimmed.includes("use std::") || trimmed.includes("println!(") || trimmed.includes("pub fn ")) {
    return "rust";
  }
  if (trimmed.includes("def ") && (trimmed.includes("print(") || trimmed.includes("import ") || trimmed.includes(":\n"))) {
    return "python";
  }
  if (trimmed.startsWith("{") && trimmed.endsWith("}") && trimmed.includes("\"")) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch (e) {}
  }
  if (trimmed.includes("#include <") || trimmed.includes("std::cout") || trimmed.includes("int main(")) {
    return "cpp";
  }
  if (trimmed.includes("interface ") || trimmed.includes("type ") || trimmed.includes("as string") || trimmed.includes(": string") || trimmed.includes(": number")) {
    return "typescript";
  }
  return "javascript";
}

function getLanguageFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case "rs": return "rust";
    case "py": return "python";
    case "js": return "javascript";
    case "ts": return "typescript";
    case "tsx": return "typescript";
    case "jsx": return "javascript";
    case "cpp": return "cpp";
    case "c": return "cpp";
    case "h": return "cpp";
    case "cs": return "csharp";
    case "java": return "java";
    case "go": return "go";
    case "sql": return "sql";
    case "md": return "markdown";
    case "html": return "html";
    case "htm": return "html";
    case "css": return "css";
    case "json": return "json";
    default: return "javascript";
  }
}

const AVAILABLE_COMMANDS = [
  { name: "/code", desc: "Monaco Editor mit neuer Datei öffnen", icon: "mage:code" },
  { name: "/editor", desc: "Monaco Editor mit neuer Datei öffnen", icon: "mage:code" },
  { name: "/theme", desc: "Design umschalten (dunkel/hell)", icon: "mage:moon" },
  { name: "/mute", desc: "Mikrofon stumm- oder freischalten", icon: "mage:microphone-mute" },
  { name: "/deafen", desc: "Audio stumm- oder freischalten", icon: "mage:volume-mute" },
  { name: "/help", desc: "Hilfe-Informationen im Chat anzeigen", icon: "mage:information-circle" }
];

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "w-recent",  type: "recent-files",  title: "Zuletzt bearbeitete Dateien", bgColor: "", colSpan: 1, rowSpan: 1, order: 0, customCode: "" },
  { id: "w-git",     type: "git-status",    title: "Git Repository Status",       bgColor: "", colSpan: 1, rowSpan: 1, order: 1, customCode: "" },
  { id: "w-weather", type: "weather",       title: "Lokale Zeit & Wetter",         bgColor: "", colSpan: 1, rowSpan: 1, order: 2, customCode: "" },
  { id: "w-privacy", type: "privacy-guard", title: "Zeno Privacy Guard",           bgColor: "", colSpan: 1, rowSpan: 1, order: 3, customCode: "" },
];

function getContrastColor(hex: string): string {
  if (!hex) return "var(--text-primary)";
  const c = hex.replace("#", "");
  if (c.length !== 6) return "var(--text-primary)";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? "#0d0f14" : "#f4f4f5";
}

interface LiveGitStatus {
  branch: string;
  is_clean: boolean;
  modified: number;
  added: number;
  deleted: number;
  untracked: number;
}

interface LiveGitCommit {
  hash: string;
  message: string;
  date: string;
}

async function safeInvoke<T>(cmd: string, args?: any): Promise<T> {
  if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<T>(cmd, args);
  }
  throw new Error("Tauri-Umgebung nicht verfügbar.");
}

function getCurrentTimestamp(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

export default function App() {
  // --- STATE ---
  const [servers, setServers] = useState<Server[]>(initialServers);
  const [activeServerId, setActiveServerId] = useState<string>("home");
  const [animatingServerId, setAnimatingServerId] = useState<string | null>(null);
  const activeServer = servers.find((s) => s.id === activeServerId) || servers[0];
  
  const [activeChannel, setActiveChannel] = useState<Channel>(initialServers[0].categories[0].channels[0]);
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>(initialMessages);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  
  // Customizer / Appearance State
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [canvasColor, setCanvasColor] = useState<string>("#18191B");
  const [glowColor, setGlowColor] = useState<string>("#3574F0");
  const [glassmorphism, setGlassmorphism] = useState<boolean>(true);
  
  // User Controls State
  const [muted, setMuted] = useState<boolean>(false);
  const [deafened, setDeafened] = useState<boolean>(false);
  const [isMembersOpen, setIsMembersOpen] = useState<boolean>(true);
  
  // Modals & Panels State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>("profile");
  const [selectedUserProfile, setSelectedUserProfile] = useState<Profile | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isEditorDirty, setIsEditorDirty] = useState<boolean>(false);
  const [editorCode, setEditorCode] = useState<string>("");
  const [editorLanguage, setEditorLanguage] = useState<string>("rust");
  const [editorFilename, setEditorFilename] = useState<string>("main.rs");
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [editorWorkflowStep, setEditorWorkflowStep] = useState<"select_action" | "input_filename" | "editor">("select_action");
  const [editorOutput, setEditorOutput] = useState<string>("");
  const [editorRuntimes, setEditorRuntimes] = useState<Record<string, "installed" | "not_installed" | "installing">>({
    javascript: "installed",
    typescript: "installed",
    python: "not_installed",
    rust: "not_installed",
    csharp: "not_installed",
    cpp: "not_installed"
  });
  const [weatherMode, setWeatherMode] = useState<"wttr" | "custom">("wttr");
  const [weatherApiKey, setWeatherApiKey] = useState<string>("");
  const [weatherApiUrl, setWeatherApiUrl] = useState<string>("https://api.openweathermap.org/data/2.5/weather?q={city}&appid={key}&units=metric&lang=de");
  const [realWeatherData, setRealWeatherData] = useState<{
    temp: string;
    condition: string;
    icon: string;
    humidity: string;
    wind: string;
    forecast?: Array<{
      date: string;
      tempMin: string;
      tempMax: string;
      morningTemp: string;
      morningIcon: string;
      noonTemp: string;
      noonIcon: string;
      eveningTemp: string;
      eveningIcon: string;
      nightTemp: string;
      nightIcon: string;
    }>;
  } | null>(null);

  const [liveGitStatus, setLiveGitStatus] = useState<LiveGitStatus | null>(null);
  const [liveGitCommits, setLiveGitCommits] = useState<LiveGitCommit[]>([]);
  const [gitError, setGitError] = useState<string | null>(null);

  const fetchLiveGitData = async () => {
    try {
      setGitError(null);
      const status = await safeInvoke<LiveGitStatus>("get_git_status");
      setLiveGitStatus(status);
      const log = await safeInvoke<LiveGitCommit[]>("get_git_log");
      setLiveGitCommits(log);
    } catch (e: any) {
      console.warn("Git integration failed:", e);
      setGitError(e.message || String(e));
    }
  };

  useEffect(() => {
    fetchLiveGitData();
    const interval = setInterval(fetchLiveGitData, 15000);
    return () => clearInterval(interval);
  }, []);

  const [githubToken, setGithubToken] = useState<string>("");
  const [githubUser, setGithubUser] = useState<{ login: string; name: string | null; avatarUrl: string } | null>(null);
  const [githubConnecting, setGithubConnecting] = useState<boolean>(false);

  const testGithubConnection = async () => {
    if (!githubToken.trim()) return;
    setGithubConnecting(true);
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${githubToken.trim()}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (!res.ok) {
        throw new Error(`GitHub API Fehler: HTTP ${res.status}`);
      }
      const data = await res.json();
      setGithubUser({
        login: data.login,
        name: data.name,
        avatarUrl: data.avatar_url,
      });
      showToast(`GitHub-Verbindung hergestellt: @${data.login}`);
    } catch (e: any) {
      console.error(e);
      showToast("GitHub-Verbindung fehlgeschlagen: " + (e.message || String(e)));
      setGithubUser(null);
    } finally {
      setGithubConnecting(false);
    }
  };

  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [dashboardEditMode, setDashboardEditMode] = useState<boolean>(false);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [swappingWidgetIds, setSwappingWidgetIds] = useState<string[]>([]);
  const updateWidget = (id: string, patch: Partial<WidgetConfig>) =>
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  const deleteWidget = (id: string) =>
    setWidgets((prev) => prev.filter((w) => w.id !== id).map((w, i) => ({ ...w, order: i })));

  const moveWidget = (id: string, direction: "left" | "right") => {
    setWidgets((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((w) => w.id === id);
      if (index === -1) return prev;
      const newIndex = direction === "left" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= sorted.length) return prev;
      
      const currentOrder = sorted[index].order;
      const targetOrder = sorted[newIndex].order;
      const targetId = sorted[newIndex].id;
      
      setSwappingWidgetIds([id, targetId]);
      setTimeout(() => {
        setSwappingWidgetIds([]);
      }, 350);
      
      return prev.map((w) => {
        if (w.id === id) return { ...w, order: targetOrder };
        if (w.id === targetId) return { ...w, order: currentOrder };
        return w;
      });
    });
  };

  const addCustomWidget = () => {
    const id = "w-custom-" + Date.now();
    const defaultCode = `// Das Widget wird in einer sicheren Sandbox ausgeführt.
// Gib einen HTML-String zurück (inklusive Script-Tags für Interaktivität).
// Du kannst CSS-Variablen wie var(--glow-color-1) oder var(--text-primary) nutzen.

return \`
  <div style="display: flex; flex-direction: column; gap: 10px; height: 100%; justify-content: center; align-items: center; text-align: center; padding: 10px;">
    <div style="font-size: 24px; font-weight: 800; color: var(--glow-color-1, #3574F0); text-shadow: 0 0 10px rgba(53, 116, 240, 0.3);" id="counter">0</div>
    <div style="font-size: 11px; color: var(--text-muted); font-weight: 500;">Interaktiver Zähler</div>
    <div style="display: flex; gap: 6px;">
      <button id="btn-dec" style="background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: 600;">-1</button>
      <button id="btn-inc" style="background: var(--glow-color-1, #3574F0); color: white; border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: 600;">+1</button>
    </div>
  </div>
  <script>
    let count = 0;
    const c = document.getElementById('counter');
    document.getElementById('btn-inc').onclick = () => { count++; c.innerText = count; };
    document.getElementById('btn-dec').onclick = () => { count--; c.innerText = count; };
  </script>
\`;`;
    setWidgets((prev) => [...prev, { id, type: "custom", title: "Neues Widget", bgColor: "", colSpan: 1, rowSpan: 1, order: prev.length, customCode: defaultCode }]);
    setEditingWidgetId(id);
  };
  const handleWidgetDrop = (targetId: string) => {
    if (!draggedWidgetId || draggedWidgetId === targetId) return;
    setWidgets((prev) => {
      const srcOrder = prev.find((w) => w.id === draggedWidgetId)!.order;
      const tgtOrder = prev.find((w) => w.id === targetId)!.order;
      return prev.map((w) => {
        if (w.id === draggedWidgetId) return { ...w, order: tgtOrder };
        if (w.id === targetId) return { ...w, order: srcOrder };
        return w;
      });
    });
    setDraggedWidgetId(null);
  };
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([
    { name: "main.rs", code: "fn main() {\n    println!(\"Hello World!\");\n}", language: "rust" },
    { name: "index.js", code: "console.log(\"Hello Zeno!\");", language: "javascript" },
    { name: "main.py", code: "print(\"Hello Zeno!\")", language: "python" }
  ]);

  const addRecentFile = (name: string, code: string, lang: string) => {
    setRecentFiles((prev) => {
      const filtered = prev.filter((f) => f.name !== name);
      return [{ name, code, language: lang }, ...filtered].slice(0, 5);
    });
  };
  
  // Chat Input State
  const [inputText, setInputText] = useState<string>("");
  const [pendingAttachment, setPendingAttachment] = useState<{ name: string; size: string; dataUrl?: string; type: string } | null>(null);
  const chatAttachmentInputRef = useRef<HTMLInputElement | null>(null);
  const [showCommandSuggestions, setShowCommandSuggestions] = useState<boolean>(false);
  
  // Voice Simulation State
  const [connectedVoice, setConnectedVoice] = useState<string | null>(null);
  const [voiceDuration, setVoiceDuration] = useState<number>(0);
  const voiceTimerRef = useRef<any>(null);

  // Toast Notifications State
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef<number>(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- TOAST TRIGGER ---
  const showToast = (message: string) => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // --- DASHBOARD STATES & EFFECT ---
  const [dashboardLocation, setDashboardLocation] = useState<string>("Berlin");
  const [dashboardTime, setDashboardTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      let offsetHours = 0;
      const loc = dashboardLocation.toLowerCase();
      if (loc.includes("new york") || loc.includes("nyc") || loc.includes("usa")) offsetHours = -6;
      else if (loc.includes("tokyo") || loc.includes("tokio") || loc.includes("japan")) offsetHours = 7;
      else if (loc.includes("london") || loc.includes("uk") || loc.includes("england")) offsetHours = -1;
      
      date.setHours(date.getHours() + offsetHours);
      setDashboardTime(date.toTimeString().slice(0, 5) + " Uhr");
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [dashboardLocation]);

  // Fetch real weather data — wttr.in (no key, privacy-friendly) or user-supplied custom API
  const [weatherFetching, setWeatherFetching] = useState(false);
  const fetchRealWeather = async () => {
    if (!dashboardLocation.trim()) { showToast("Bitte einen Standort eingeben."); return; }
    setWeatherFetching(true);
    try {
      if (weatherMode === "wttr") {
        // wttr.in: city name only, no API key, open source, self-hostable
        const city = encodeURIComponent(dashboardLocation.trim());
        const res = await fetch(`https://wttr.in/${city}?format=j1`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const cur = data.current_condition?.[0];
        if (!cur) throw new Error("Ungültige Antwort von wttr.in");
        const tempC = cur.temp_C;
        const desc = cur.lang_de?.[0]?.value || cur.weatherDesc?.[0]?.value || "Unbekannt";
        const humidity = cur.humidity + "%";
        const windKmph = cur.windspeedKmph + " km/h";
        const code = parseInt(cur.weatherCode, 10);
        let icon = "mage:sun";
        if (code >= 200 && code < 300) icon = "mage:lightning";
        else if (code >= 300 && code < 400) icon = "mage:cloudy";
        else if (code >= 500 && code < 600) icon = "mage:cloudy";
        else if (code >= 600 && code < 700) icon = "mage:cloudy";
        else if (code >= 700 && code < 800) icon = "mage:cloudy";
        else if (code === 800) icon = "mage:sun";
        else if (code > 800) icon = "mage:cloudy";

        // Parse 3-day forecast with 1/4 day temperatures
        const forecast = (data.weather || []).map((day: any) => {
          const dateObj = new Date(day.date);
          const weekday = dateObj.toLocaleDateString('de-DE', { weekday: 'short' });
          const formattedDate = dateObj.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });

          const getHourData = (index: number) => {
            const h = day.hourly?.[index] || {};
            const code = parseInt(h.weatherCode || "800", 10);
            let hIcon = "mage:sun";
            if (code >= 200 && code < 300) hIcon = "mage:lightning";
            else if (code >= 300 && code < 700) hIcon = "mage:cloudy";
            else if (code >= 700 && code < 800) hIcon = "mage:cloudy";
            else if (code > 800) hIcon = "mage:cloudy";

            return {
              temp: h.tempC ? h.tempC + "°C" : "?°C",
              icon: hIcon
            };
          };

          const night = getHourData(0); // 00:00
          const morning = getHourData(2); // 06:00
          const noon = getHourData(4); // 12:00
          const evening = getHourData(6); // 18:00

          return {
            date: `${weekday}, ${formattedDate}`,
            tempMin: day.mintempC + "°C",
            tempMax: day.maxtempC + "°C",
            morningTemp: morning.temp,
            morningIcon: morning.icon,
            noonTemp: noon.temp,
            noonIcon: noon.icon,
            eveningTemp: evening.temp,
            eveningIcon: evening.icon,
            nightTemp: night.temp,
            nightIcon: night.icon
          };
        });

        setRealWeatherData({ temp: tempC + "°C", condition: desc, icon, humidity, wind: windKmph, forecast });
        showToast(`Wetterdaten für ${dashboardLocation} aktualisiert (wttr.in)`);
      } else if (weatherMode === "custom") {
        if (!weatherApiKey.trim() && weatherApiUrl.includes("{key}")) {
          showToast("Bitte einen API-Key eingeben."); setWeatherFetching(false); return;
        }
        const url = weatherApiUrl
          .replace("{city}", encodeURIComponent(dashboardLocation.trim()))
          .replace("{key}", weatherApiKey.trim());
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Try OpenWeatherMap shape; fall back gracefully
        const temp = data.main?.temp !== undefined ? Math.round(data.main.temp) + "°C" : "?";
        const condition = data.weather?.[0]?.description || data.condition?.text || "Unbekannt";
        const humidity = (data.main?.humidity ?? data.current?.humidity ?? "?") + "%";
        const wind = Math.round(data.wind?.speed ?? data.current?.wind_kph ?? 0) + " km/h";
        const oid = data.weather?.[0]?.id;
        let icon = "mage:sun";
        if (oid) {
          if (oid >= 200 && oid < 300) icon = "mage:lightning";
          else if (oid >= 300 && oid < 600) icon = "mage:cloudy";
          else if (oid >= 600 && oid < 700) icon = "mage:cloudy";
          else if (oid > 800) icon = "mage:cloudy";
        }
        setRealWeatherData({ temp, condition, icon, humidity, wind });
        showToast(`Wetterdaten für ${dashboardLocation} aktualisiert (Custom API)`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast("Fehler beim Abrufen: " + msg);
    } finally {
      setWeatherFetching(false);
    }
  };

  useEffect(() => {
    fetchRealWeather();
  }, [weatherMode]);

  // --- DYNAMIC BACKGROUND & THEME SYNC ---
  useEffect(() => {
    document.body.style.setProperty("--bg-canvas", canvasColor);
    const opacity1 = theme === "light" ? 0.12 : 0.18;
    const opacity2 = theme === "light" ? 0.06 : 0.09;
    document.body.style.setProperty("--glow-color-1", hexToRgba(glowColor, opacity1));
    document.body.style.setProperty("--glow-color-2", hexToRgba(glowColor, opacity2));
    
    if (theme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }

    if (glassmorphism) {
      document.body.classList.add("glass-effect");
    } else {
      document.body.classList.remove("glass-effect");
    }
  }, [canvasColor, glowColor, theme, glassmorphism]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSettingsOpen(false);
        setSelectedUserProfile(null);
        setIsEditorOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const chatInput = document.getElementById("chat-input-field");
        if (chatInput) chatInput.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- SCROLL TO BOTTOM ---
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeChannel]);

  // --- VOICE CHAT CONNECT TIMER ---
  useEffect(() => {
    if (connectedVoice) {
      setVoiceDuration(0);
      voiceTimerRef.current = setInterval(() => {
        setVoiceDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (voiceTimerRef.current) {
        clearInterval(voiceTimerRef.current);
        voiceTimerRef.current = null;
      }
    }
    return () => {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    };
  }, [connectedVoice]);

  const formatVoiceTime = (secs: number) => {
    const mm = String(Math.floor(secs / 60)).padStart(2, "0");
    const ss = String(secs % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // --- CORE UI ACTIONS ---
  const handleServerSelect = (server: Server) => {
    setAnimatingServerId(server.id);
    setActiveServerId(server.id);
    // Auto-select first text channel on server change
    const firstTextChan = server.categories.find((c) => c.type === "text")?.channels[0];
    if (firstTextChan) {
      setActiveChannel(firstTextChan);
    }
    setTimeout(() => {
      setAnimatingServerId(null);
    }, 300);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !pendingAttachment) return;

    const trimmedInput = inputText.trim();
    setShowCommandSuggestions(false);

    if (trimmedInput.startsWith("/code ") || trimmedInput.startsWith("/editor ")) {
      const spaceIdx = trimmedInput.indexOf(" ");
      const code = trimmedInput.substring(spaceIdx + 1);
      setEditorCode(code);
      setEditorLanguage(detectLanguage(code));
      setEditorFilename("unnamed.js");
      setEditorWorkflowStep("editor");
      setEditorOutput("");
      setIsEditorOpen(true);
      setInputText("");
      return;
    } else if (trimmedInput === "/code" || trimmedInput === "/editor") {
      setEditorCode("");
      setEditorLanguage("javascript");
      setEditorFilename("unnamed.js");
      setEditorWorkflowStep("select_action");
      setEditorOutput("");
      setIsEditorOpen(true);
      setInputText("");
      return;
    } else if (trimmedInput === "/theme") {
      handleThemeToggle();
      setInputText("");
      return;
    } else if (trimmedInput === "/mute") {
      setMuted(!muted);
      showToast(!muted ? "Mikrofon stummgeschaltet" : "Mikrofon aktiviert");
      setInputText("");
      return;
    } else if (trimmedInput === "/deafen") {
      setDeafened(!deafened);
      showToast(!deafened ? "Audio stummgeschaltet" : "Audio aktiviert");
      setInputText("");
      return;
    } else if (trimmedInput === "/help") {
      const helpMsg: Message = {
        author: "ZenoBot",
        text: "Hier sind die verfügbaren Befehle:\n• /code - Monaco Editor öffnen\n• /theme - Design wechseln\n• /mute - Stumm schalten\n• /deafen - Audio deaktivieren\n• /help - Diese Liste anzeigen",
        time: getCurrentTimestamp(),
        color: "orange"
      };
      setChatMessages((prev) => ({
        ...prev,
        [activeChannel.id]: [...(prev[activeChannel.id] || []), helpMsg]
      }));
      setInputText("");
      return;
    }

    const newMsg: Message = {
      author: "CipherNaut",
      text: inputText || (pendingAttachment ? `Datei gesendet: ${pendingAttachment.name}` : ""),
      time: getCurrentTimestamp(),
      color: "purple",
      attachment: pendingAttachment ? {
        name: pendingAttachment.name,
        size: pendingAttachment.size,
        dataUrl: pendingAttachment.dataUrl,
        type: pendingAttachment.type
      } : undefined
    };

    setChatMessages((prev) => ({
      ...prev,
      [activeChannel.id]: [...(prev[activeChannel.id] || []), newMsg]
    }));
    setInputText("");
    setPendingAttachment(null);
  };

  const toggleCategory = (catName: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const handleJoinVoice = (chId: string, chName: string) => {
    setConnectedVoice(chName);
    
    // Add "CipherNaut" to the connectedUsers list of this channel, and remove from any other voice channel
    setServers((prevServers) =>
      prevServers.map((srv) => ({
        ...srv,
        categories: srv.categories.map((cat) => ({
          ...cat,
          channels: cat.channels.map((ch) => {
            if (cat.type === "voice") {
              let users = ch.connectedUsers ? [...ch.connectedUsers] : [];
              if (ch.id === chId) {
                if (!users.includes("CipherNaut")) {
                  users.push("CipherNaut");
                }
              } else {
                users = users.filter((u) => u !== "CipherNaut");
              }
              return { ...ch, connectedUsers: users };
            }
            return ch;
          })
        }))
      }))
    );

    showToast(`Sprachkanal #${chName} beigetreten`);
  };

  const handleDisconnectVoice = () => {
    setConnectedVoice(null);
    
    setServers((prevServers) =>
      prevServers.map((srv) => ({
        ...srv,
        categories: srv.categories.map((cat) => ({
          ...cat,
          channels: cat.channels.map((ch) => {
            if (cat.type === "voice" && ch.connectedUsers) {
              return {
                ...ch,
                connectedUsers: ch.connectedUsers.filter((u) => u !== "CipherNaut")
              };
            }
            return ch;
          })
        }))
      }))
    );

    showToast("Sprachverbindung getrennt");
  };

  const handleOpenFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target?.result as string;
      const detectedLang = getLanguageFromExtension(file.name);
      setEditorCode(contents);
      setEditorFilename(file.name);
      setEditorLanguage(detectedLang);
      setEditorWorkflowStep("editor");
      setEditorOutput("");
      addRecentFile(file.name, contents, detectedLang);
      showToast(`Datei "${file.name}" geladen`);
    };
    reader.readAsText(file);
  };

  const handleSaveFile = () => {
    try {
      const blob = new Blob([editorCode], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = editorFilename;
      link.click();
      URL.revokeObjectURL(url);
      
      addRecentFile(editorFilename, editorCode, editorLanguage);
      setIsEditorDirty(false);
      showToast(`Datei "${editorFilename}" erfolgreich gespeichert!`);
    } catch (err: any) {
      showToast(`Fehler beim Speichern: ${err.message}`);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        if (isEditorOpen) {
          e.preventDefault();
          handleSaveFile();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditorOpen, editorCode, editorFilename, editorLanguage]);

  useEffect(() => {
    if (!isEditorOpen) {
      setIsEditorDirty(false);
    }
  }, [isEditorOpen]);

  const handleRenameFile = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setIsRenaming(false);
      return;
    }
    
    setRecentFiles((prev) =>
      prev.map((f) =>
        f.name === editorFilename
          ? { ...f, name: trimmed, language: getLanguageFromExtension(trimmed) }
          : f
      )
    );

    setEditorFilename(trimmed);
    setEditorLanguage(getLanguageFromExtension(trimmed));
    setIsRenaming(false);
    showToast(`Datei umbenannt in "${trimmed}"`);
  };

  const handleDeleteRecentFile = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    setRecentFiles((prev) => prev.filter((f) => f.name !== name));
    showToast(`Datei "${name}" gelöscht`);
  };

  const handleDeleteCurrentFile = () => {
    if (window.confirm(`Möchtest du die Datei "${editorFilename}" wirklich aus dem Workspace löschen?`)) {
      setRecentFiles((prev) => prev.filter((f) => f.name !== editorFilename));
      setEditorCode("");
      setEditorFilename("main.rs");
      setEditorLanguage("rust");
      setEditorWorkflowStep("select_action");
      setEditorOutput("");
      showToast(`Datei "${editorFilename}" gelöscht`);
    }
  };

  const handleInstallRuntime = (lang: string) => {
    setEditorRuntimes((prev) => ({ ...prev, [lang]: "installing" }));
    showToast(`Herunterladen der ${lang.toUpperCase()}-Umgebung gestartet...`);
    setTimeout(() => {
      setEditorRuntimes((prev) => ({ ...prev, [lang]: "installed" }));
      showToast(`Laufzeitumgebung für ${lang.toUpperCase()} erfolgreich installiert!`);
    }, 2000);
  };

  const handleDeleteRuntime = (lang: string) => {
    if (window.confirm(`Möchtest du die Laufzeitumgebung für ${lang.toUpperCase()} deinstallieren?`)) {
      setEditorRuntimes((prev) => ({ ...prev, [lang]: "not_installed" }));
      showToast(`Laufzeitumgebung für ${lang.toUpperCase()} entfernt.`);
    }
  };

  const handleChatAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeKb = (file.size / 1024).toFixed(1);
    const sizeStr = `${sizeKb} KB`;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPendingAttachment({
          name: file.name,
          size: sizeStr,
          dataUrl: event.target?.result as string,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    } else {
      setPendingAttachment({
        name: file.name,
        size: sizeStr,
        type: file.type
      });
    }
    showToast(`Anhang "${file.name}" bereit zum Senden`);
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    setCanvasColor(nextTheme === "light" ? "#E3E4E8" : "#18191B");
    showToast(nextTheme === "light" ? "Helles Design aktiviert" : "Dunkles Design aktiviert");
  };

  const handleEditorRun = () => {
    const codeToRun = editorCode;
    const lang = editorLanguage.toLowerCase();

    const runtimeStatus = editorRuntimes[lang] || "installed";
    if (runtimeStatus === "not_installed") {
      setEditorOutput(`Fehler: Die Laufzeitumgebung für "${lang.toUpperCase()}" ist nicht installiert.\n\nBitte gehe in die Einstellungen (Zahnrad-Symbol unten links) -> Registerkarte "Monaco-Editor" und klicke auf "Download & Installieren", um diese Laufzeitunterstützung einzubinden.`);
      return;
    } else if (runtimeStatus === "installing") {
      setEditorOutput(`Laufzeitumgebung für "${lang.toUpperCase()}" wird momentan heruntergeladen und installiert...\nBitte warte kurz und versuche es dann erneut.`);
      return;
    }

    if (lang === "javascript" || lang === "typescript") {
      setEditorOutput("Kompiliere & starte JS/TS Sandbox...");
      
      // Clean TypeScript types for simple runner execution (removing basic type annotations)
      let cleanedCode = codeToRun;
      if (lang === "typescript") {
        cleanedCode = codeToRun
          .replace(/:\s*(string|number|boolean|any|void|object|unknown|never)/g, "")
          .replace(/as\s+(string|number|boolean|any|void|object|unknown|never)/g, "")
          .replace(/interface\s+\w+\s*\{[^}]*\}/g, "")
          .replace(/type\s+\w+\s*=\s*[^;]+;/g, "");
      }

      const workerCode = `
        const outputs = [];
        const customConsole = {
          log: (...args) => {
            outputs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
          },
          error: (...args) => {
            outputs.push("ERROR: " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
          },
          warn: (...args) => {
            outputs.push("WARN: " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
          }
        };

        self.onmessage = function(e) {
          try {
            const fn = new Function('console', e.data);
            fn(customConsole);
            self.postMessage({ success: true, output: outputs.join('\\n') || '✓ Code ausgeführt (keine Ausgaben).' });
          } catch (err) {
            self.postMessage({ success: false, output: "Laufzeitfehler: " + err.message + "\\n" + outputs.join('\\n') });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      let isFinished = false;

      worker.onmessage = (e) => {
        isFinished = true;
        setEditorOutput(e.data.output);
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };

      worker.onerror = (e) => {
        isFinished = true;
        setEditorOutput("Syntaxfehler oder Kompilierungsfehler: " + e.message);
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };

      worker.postMessage(cleanedCode);

      // Safety timeout
      setTimeout(() => {
        if (!isFinished) {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          setEditorOutput("Zeitüberschreitung: Das Programm wurde nach 5 Sekunden beendet (möglicherweise eine Endlosschleife).");
        }
      }, 5000);

    } else if (lang === "python") {
      setEditorOutput("Lade Python WASM-Sandbox von CDN...");
      
      const loadPyodideAndRun = async () => {
        try {
          if (!(window as any).loadPyodide) {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
            script.async = true;
            script.onload = async () => {
              try {
                setEditorOutput("Initialisiere Python WASM-Laufzeitumgebung...");
                const pyodideInstance = await (window as any).loadPyodide();
                (window as any).pyodide = pyodideInstance;
                executePython(pyodideInstance, codeToRun);
              } catch (err: any) {
                setEditorOutput("Initialisierungsfehler: " + err.message);
              }
            };
            script.onerror = () => {
              setEditorOutput("Fehler: Pyodide-Skript konnte nicht von CDN geladen werden.");
            };
            document.head.appendChild(script);
          } else {
            if (!(window as any).pyodide) {
              setEditorOutput("Initialisiere Python WASM-Laufzeitumgebung...");
              (window as any).pyodide = await (window as any).loadPyodide();
            }
            executePython((window as any).pyodide, codeToRun);
          }
        } catch (err: any) {
          setEditorOutput("Fehler: " + err.message);
        }
      };

      const executePython = (pyodide: any, pyCode: string) => {
        setEditorOutput("Führe Python Code in WebAssembly-Sandbox aus...\n");
        try {
          // Setup stdout/stderr capturing
          pyodide.runPython(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
          `);

          // Run user code
          pyodide.runPython(pyCode);

          // Get outputs
          const stdout = pyodide.runPython("sys.stdout.getvalue()");
          const stderr = pyodide.runPython("sys.stderr.getvalue()");

          const result = (stdout + "\n" + stderr).trim();
          setEditorOutput(result || "✓ Python Code ausgeführt (keine Ausgaben).");
        } catch (err: any) {
          setEditorOutput("Python Fehler: " + err.message);
        }
      };

      loadPyodideAndRun();

    } else if (lang === "rust" || lang === "cpp") {
      setEditorOutput(`[zeno-compiler-sandbox] Kompiliere ${lang.toUpperCase()} Code...\n`);
      
      setTimeout(() => {
        if (lang === "rust") {
          if (!codeToRun.includes("fn main")) {
            setEditorOutput((prev) => prev + "error[E0601]: main function not found in crate\n  --> src/main.rs\n  |\n  = note: consider adding a `fn main() {}` function");
            return;
          }
          
          let stdout = "";
          if (codeToRun.includes("println!(")) {
            const matches = codeToRun.match(/println!\(\s*"([^"]+)"\s*(?:,\s*([^)]+))?\s*\)/g);
            if (matches) {
              stdout = matches.map(m => {
                const content = m.match(/"([^"]+)"/);
                return content ? content[1] : "";
              }).join("\n");
            }
          }
          
          setEditorOutput((prev) => prev + "Build abgeschlossen! Starte Programm...\n\n" + (stdout || "✓ Code ausgeführt (keine Ausgaben)."));
        } else if (lang === "cpp") {
          if (!codeToRun.includes("main()")) {
            setEditorOutput((prev) => prev + "error: main function not found");
            return;
          }
          let stdout = "";
          if (codeToRun.includes("std::cout <<")) {
            const matches = codeToRun.match(/std::cout\s*<<\s*"([^"]+)"/g);
            if (matches) {
              stdout = matches.map(m => {
                const content = m.match(/"([^"]+)"/);
                return content ? content[1] : "";
              }).join("\n");
            }
          }
          setEditorOutput((prev) => prev + "Kompilierung erfolgreich!\n\n" + (stdout || "✓ C++ Programm beendet."));
        }
      }, 1200);
    } else {
      setEditorOutput(`Kompilierung für ${lang.toUpperCase()} nicht unterstützt. Client-seitige Sandbox unterstützt JavaScript, TypeScript und Python.`);
    }
  };

  return (
    <div className="app-layout">
      {/* 1. SERVER SIDEBAR */}
      <aside className="server-sidebar">
        <button 
          className={`server-icon home-button ${activeServerId === "home" ? "active" : ""}`} 
          onClick={() => setActiveServerId("home")} 
          title="Zeno Home"
        >
          <img src="/zeno_logo.svg" alt="Zeno Logo" style={{ width: "30px", height: "30px", borderRadius: "6px" }} />
        </button>

        <div className="server-separator" role="separator" />

        <nav className="server-list" aria-label="Server-Liste">
          {servers.map((srv) => (
            <button
              key={srv.id}
              className={`server-icon ${activeServer.id === srv.id && activeServerId !== "home" ? "active" : ""} ${animatingServerId === srv.id ? "indicator-animate" : ""}`}
              onClick={() => handleServerSelect(srv)}
              title={srv.name}
            >
              <span className="server-icon-letter">{srv.iconLetter}</span>
            </button>
          ))}
          <button 
            className="server-icon" 
            id="btn-add-server" 
            onClick={() => showToast("Server-Erstellung ist im Prototyp deaktiviert")} 
            title="Server hinzufügen"
          >
            <span className="server-icon-letter">+</span>
          </button>
        </nav>
      </aside>

      {/* 2. CHANNEL SIDEBAR */}
      <aside className="channel-sidebar">
        {activeServerId === "home" ? (
          <>
            <header className="server-header">
              <h1 className="server-name">Zeno Home</h1>
              <Icon icon="mage:home" style={{ fontSize: "16px", color: "var(--text-muted)" }} />
            </header>
            <div className="channel-list">
              <section className="channel-category">
                <button className="category-header" style={{ cursor: "default" }}>
                  <span className="category-name">NAVIGATION</span>
                </button>
                <ul className="category-channels">
                  <li>
                    <button className="channel-item active">
                      <span className="channel-icon"><Icon icon="mage:dashboard" /></span>
                      <span className="channel-name">Dashboard</span>
                    </button>
                  </li>
                  <li>
                    <button className="channel-item" onClick={() => setIsSettingsOpen(true)}>
                      <span className="channel-icon"><Icon icon="mage:settings" /></span>
                      <span className="channel-name">Einstellungen</span>
                    </button>
                  </li>
                </ul>
              </section>
            </div>
          </>
        ) : (
          <>
            <header className="server-header">
              <h1 className="server-name">{activeServer.name}</h1>
              <button className="server-dropdown-toggle" onClick={() => showToast("Server-Menü geöffnet")}>
                <Icon icon="mage:chevron-down" />
              </button>
            </header>
            <div className="channel-list" key={activeServer.id}>
          {activeServer.categories.map((cat) => {
            const isCollapsed = collapsedCategories[cat.name];
            return (
              <section key={cat.name} className="channel-category">
                <button className="category-header" onClick={() => toggleCategory(cat.name)}>
                  <span className={`category-arrow ${isCollapsed ? "collapsed" : ""}`}>
                    <Icon icon="mage:chevron-down" />
                  </span>
                  <span className="category-name">{cat.name.toUpperCase()}</span>
                </button>
                
                {!isCollapsed && (
                  <ul className="category-channels">
                    {cat.channels.map((ch, idx) => {
                      const isText = cat.type === "text";
                      const isChannelActive = activeChannel.id === ch.id;
                      
                      return (
                        <li key={ch.id}>
                          <button
                            className={`channel-item channel-item-animate ${isChannelActive ? "active" : ""} ${!isText ? "voice-channel" : ""}`}
                            onClick={() => isText ? setActiveChannel(ch) : handleJoinVoice(ch.id, ch.name)}
                            style={{ "--idx": Math.min(idx, 6) } as React.CSSProperties}
                          >
                            <span className="channel-icon">
                              <Icon icon={isText ? "mage:hashtag" : "mage:volume-up"} />
                            </span>
                            <span className="channel-name">{ch.name}</span>
                          </button>

                          {/* Connected voice users */}
                          {!isText && ch.connectedUsers && (
                            <ul className="voice-connected-users">
                              {ch.connectedUsers.map((u) => (
                                <li key={u} className="voice-user">
                                  <span className="voice-user-avatar">{u[0]}</span>
                                  <span className="voice-user-name">{u}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
          </>
        )}

        {/* User Info Footer */}
        <footer className="user-panel">
          {/* Voice Connected State Area */}
          {connectedVoice && (
            <div className="voice-indicator">
              <div className="voice-status">
                <span className="voice-status-icon">
                  <Icon icon="mage:volume-up" className="voice-status-indicator pulse" style={{ color: "var(--accent-success, #59A869)", marginRight: "4px" }} />
                </span>
                <span className="voice-status-text">
                  Verbunden mit <strong>{connectedVoice}</strong> ({formatVoiceTime(voiceDuration)})
                </span>
              </div>
              <button className="voice-disconnect" onClick={handleDisconnectVoice} title="Trennen">
                <Icon icon="mage:multiply" />
              </button>
            </div>
          )}

          <div 
            className="user-info" 
            style={{ cursor: "pointer" }}
            onClick={() => setSelectedUserProfile(mockProfiles.CipherNaut)}
          >
            <div className="user-avatar-wrapper">
              <div className="user-avatar purple">C</div>
              <span className="status-dot online" />
            </div>
            <div className="user-details">
              <span className="user-name">CipherNaut</span>
              <span className="user-id">0xA3F...8B2</span>
            </div>
          </div>
          <div className="user-controls">
            <button className="user-control-btn" onClick={handleThemeToggle} title="Design umschalten">
              <Icon icon={theme === "light" ? "mage:moon" : "mage:sun"} />
            </button>
             <button className={`user-control-btn ${muted ? "active" : ""}`} onClick={() => { setMuted(!muted); showToast(muted ? "Mikrofon aktiviert" : "Mikrofon stummgeschaltet"); }} title="Mikrofon">
              <Icon icon={muted ? "mage:microphone-mute" : "mage:microphone"} />
            </button>
            <button className={`user-control-btn ${deafened ? "active" : ""}`} onClick={() => { setDeafened(!deafened); showToast(deafened ? "Audio aktiviert" : "Audio stummgeschaltet"); }} title="Stummschalten">
              <Icon icon={deafened ? "mage:volume-mute" : "mage:volume-up"} />
            </button>
            <button className="user-control-btn" onClick={() => setIsSettingsOpen(true)} title="Einstellungen">
              <Icon icon="mage:settings" />
            </button>
          </div>
        </footer>
      </aside>

      {/* 3. CHAT MAIN AREA */}
      <main className="chat-area">
        {activeServerId === "home" ? (
          <div className="zeno-dashboard" style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>
            <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "8px" }}>
              <div className="dashboard-welcome">
                <h1 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)" }}>Willkommen zurück, CipherNaut</h1>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Dein privates, sicheres Workspace-Dashboard. Zero-Knowledge, 100% clientseitig.</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {dashboardEditMode && (
                  <button className="settings-btn primary" onClick={addCustomWidget} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "6px 12px" }}>
                    <Icon icon="mage:plus" /> Widget
                  </button>
                )}
                <button className={`settings-btn ${dashboardEditMode ? "primary" : ""}`} onClick={() => { setDashboardEditMode((v) => !v); setEditingWidgetId(null); }} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "6px 12px" }}>
                  <Icon icon={dashboardEditMode ? "mage:check" : "mage:settings"} />
                  {dashboardEditMode ? "Fertig" : "Dashboard bearbeiten"}
                </button>
              </div>
            </header>

            <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gridAutoRows: "minmax(220px, auto)", gap: "16px", padding: "16px 0", flex: 1 }}>
              {[...widgets].sort((a, b) => a.order - b.order).map((widget) => {
                const hasBg = !!widget.bgColor;
                const fgColor = hasBg ? getContrastColor(widget.bgColor) : "var(--text-primary)";
                const fgMuted = hasBg ? getContrastColor(widget.bgColor) + "99" : "var(--text-muted)";
                const cardBg = hasBg ? widget.bgColor : "var(--bg-secondary)";
                const isDragging = draggedWidgetId === widget.id;
                return (
                  <div
                    key={widget.id}
                    draggable={dashboardEditMode}
                    onDragStart={(e) => {
                      if (e.dataTransfer) {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", widget.id);
                      }
                      setTimeout(() => {
                        setDraggedWidgetId(widget.id);
                      }, 0);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer) {
                        e.dataTransfer.dropEffect = "move";
                      }
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleWidgetDrop(widget.id);
                    }}
                    onDragEnd={() => setDraggedWidgetId(null)}
                    className={swappingWidgetIds.includes(widget.id) ? "widget-swapping" : ""}
                    style={{ gridColumn: `span ${widget.colSpan}`, gridRow: `span ${widget.rowSpan}`, backgroundColor: cardBg, border: `1px solid ${hasBg ? "transparent" : "var(--border-color)"}`, borderRadius: "var(--radius-lg)", padding: "16px", display: "flex", flexDirection: "column", position: "relative", opacity: isDragging ? 0.4 : 1, transition: "opacity 0.2s, box-shadow 0.2s", boxShadow: dashboardEditMode ? "0 0 0 2px var(--glow-color-1,#3574F0)55" : "none", cursor: dashboardEditMode ? "grab" : "default", minHeight: widget.rowSpan === 2 ? "460px" : "220px" }}
                  >
                    {dashboardEditMode && (() => {
                      const sorted = [...widgets].sort((a, b) => a.order - b.order);
                      const idx = sorted.findIndex((w) => w.id === widget.id);
                      const isFirst = idx === 0;
                      const isLast = idx === sorted.length - 1;
                      return (
                        <div style={{ position: "absolute", top: "8px", right: "8px", display: "flex", gap: "4px", zIndex: 10, pointerEvents: "auto" }}>
                          {!isFirst && (
                            <button onClick={() => moveWidget(widget.id, "left")} title="Nach vorne verschieben" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", color: "var(--text-primary)", fontSize: "13px", display: "flex", alignItems: "center" }}>
                              <Icon icon="mage:chevron-left" />
                            </button>
                          )}
                          {!isLast && (
                            <button onClick={() => moveWidget(widget.id, "right")} title="Nach hinten verschieben" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", color: "var(--text-primary)", fontSize: "13px", display: "flex", alignItems: "center" }}>
                              <Icon icon="mage:chevron-right" />
                            </button>
                          )}
                          <button onClick={() => setEditingWidgetId(editingWidgetId === widget.id ? null : widget.id)} style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", color: "var(--text-primary)", fontSize: "13px", display: "flex", alignItems: "center" }}><Icon icon="mage:settings" /></button>
                          <button onClick={() => deleteWidget(widget.id)} style={{ background: "rgba(200,50,50,0.12)", border: "1px solid rgba(200,50,50,0.25)", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", color: "#e05252", fontSize: "13px", display: "flex", alignItems: "center" }}><Icon icon="mage:trash" /></button>
                        </div>
                      );
                    })()}
                    {dashboardEditMode && editingWidgetId === widget.id && (
                      <div style={{ position: "absolute", top: "44px", right: "8px", width: "240px", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "12px", zIndex: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.6px" }}>Widget-Einstellungen</span>
                        <div>
                          <label style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Titel</label>
                          <input className="settings-input" value={widget.title} onChange={(e) => updateWidget(widget.id, { title: e.target.value })} style={{ fontSize: "11px", padding: "5px 8px", maxWidth: "none", width: "100%" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Hintergrundfarbe</label>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <input type="color" value={widget.bgColor || "#1a1f2e"} onChange={(e) => updateWidget(widget.id, { bgColor: e.target.value })} style={{ width: "32px", height: "28px", border: "none", borderRadius: "6px", cursor: "pointer", padding: "1px" }} />
                            <input className="settings-input" value={widget.bgColor} placeholder="leer = Standard" onChange={(e) => updateWidget(widget.id, { bgColor: e.target.value })} style={{ fontSize: "10px", padding: "5px 8px", flex: 1, fontFamily: "var(--font-mono)" }} />
                            {widget.bgColor && <button onClick={() => updateWidget(widget.id, { bgColor: "" })} style={{ background: "none", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "3px 5px", cursor: "pointer", color: "var(--text-muted)", fontSize: "10px" }}>x</button>}
                          </div>
                          {widget.bgColor && <p style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "4px" }}>Vordergrundfarbe: <span style={{ fontFamily: "var(--font-mono)" }}>{fgColor}</span></p>}
                        </div>
                        <div>
                          <label style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Größe</label>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                            {([["1x1", 1, 1], ["2x1 Breit", 2, 1], ["1x2 Hoch", 1, 2], ["2x2 Groß", 2, 2]] as [string, WidgetColSpan, WidgetRowSpan][]).map(([label, col, row]) => (
                              <button key={label} onClick={() => updateWidget(widget.id, { colSpan: col, rowSpan: row })} style={{ fontSize: "10px", padding: "4px 6px", borderRadius: "6px", border: `1px solid ${widget.colSpan === col && widget.rowSpan === row ? "var(--glow-color-1,#3574F0)" : "var(--border-color)"}`, background: widget.colSpan === col && widget.rowSpan === row ? "rgba(53,116,240,0.15)" : "var(--bg-tertiary)", color: "var(--text-primary)", cursor: "pointer" }}>{label}</button>
                            ))}
                          </div>
                        </div>
                        {widget.type === "custom" && (
                          <div>
                            <label style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>JavaScript (return HTML)</label>
                            <textarea value={widget.customCode} onChange={(e) => updateWidget(widget.id, { customCode: e.target.value })} spellCheck={false} style={{ width: "100%", height: "120px", fontSize: "10px", fontFamily: "var(--font-mono)", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "var(--text-primary)", padding: "6px 8px", resize: "vertical", boxSizing: "border-box" }} />
                            <p style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "3px" }}>JS-Code der einen HTML-String zurückgibt (return).</p>
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, pointerEvents: dashboardEditMode ? "none" : "auto", height: "100%", minHeight: 0 }}>
                      <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}`, paddingBottom: "10px", marginBottom: "12px", paddingRight: dashboardEditMode ? "56px" : "0px" }}>
                      {dashboardEditMode && <span style={{ fontSize: "14px", color: fgMuted, cursor: "grab", userSelect: "none" }} title="Ziehen zum Verschieben">⠿</span>}
                      <span style={{ fontSize: "18px", color: hasBg ? fgColor : "var(--accent-color)" }}>
                        <Icon icon={widget.type === "recent-files" ? "mage:file-records" : widget.type === "git-status" ? "mage:github" : widget.type === "weather" ? "mage:sun" : widget.type === "privacy-guard" ? "mage:shield" : "mage:code"} />
                      </span>
                      <h3 style={{ fontSize: "13px", fontWeight: "600", color: fgColor, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{widget.title}</h3>
                    </div>
                    {widget.type === "recent-files" && (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {recentFiles.map((file) => (
                            <div key={file.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: hasBg ? fgColor + "11" : "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}` }}>
                              <div onClick={() => { setEditorFilename(file.name); setEditorLanguage(file.language); setEditorCode(file.code); setEditorWorkflowStep("editor"); setEditorOutput(""); setIsEditorOpen(true); }} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", flex: 1, minWidth: 0 }}>
                                <Icon icon={file.language === "rust" ? "vscode-icons:file-type-rust" : file.language === "python" ? "vscode-icons:file-type-python" : file.language === "javascript" ? "vscode-icons:file-type-js" : "mage:file-records"} style={{ fontSize: "16px", flexShrink: 0 }} />
                                <span style={{ fontSize: "12px", fontWeight: "500", color: fgColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</span>
                              </div>
                              <span style={{ fontSize: "9px", color: fgMuted, fontWeight: "600" }}>{file.language.toUpperCase()}</span>
                            </div>
                          ))}
                          {recentFiles.length === 0 && <p style={{ fontSize: "11px", color: fgMuted, textAlign: "center", padding: "16px" }}>Keine Dateien.</p>}
                        </div>
                        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                          <button className="settings-btn primary" onClick={() => { setEditorCode(""); setEditorWorkflowStep("input_filename"); setIsEditorOpen(true); }} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "6px 12px" }}><Icon icon="mage:plus" /> Neue Datei</button>
                          <button className="settings-btn" onClick={() => { setEditorWorkflowStep("select_action"); setIsEditorOpen(true); }} style={{ fontSize: "11px", padding: "6px 12px" }}><Icon icon="mage:file-records" /> Editor</button>
                        </div>
                      </div>
                    )}
                    {widget.type === "git-status" && (() => {
                      const displayBranch = liveGitStatus?.branch || "main (Simuliert)";
                      const isClean = liveGitStatus ? liveGitStatus.is_clean : true;
                      const commits = liveGitStatus && liveGitCommits.length > 0 ? liveGitCommits : [
                        { hash: "5a69096", message: "Dashboard widget system: drag, resize, custom colors", date: "vor 2 Std." },
                        { hash: "140a9f0", message: "feat(weather): three-mode weather widget", date: "vor 4 Std." },
                        { hash: "0f551dc", message: "Add Monaco Editor runtime settings", date: "vor 1 Tag" }
                      ];
                      return (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            {gitError && (
                              <div style={{ fontSize: "9px", color: "#e05252", padding: "6px 8px", background: "rgba(224,82,82,0.1)", borderRadius: "var(--radius-sm)", marginBottom: "10px", border: "1px solid rgba(224,82,82,0.2)" }} title={gitError}>
                                ⚠️ Kein lokales Git-Repo oder Befehl nicht verfügbar.
                              </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", borderBottom: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}`, paddingBottom: "10px" }}>
                              <div>
                                <span style={{ fontSize: "10px", color: fgMuted, display: "block" }}>Branch</span>
                                <span style={{ fontSize: "12px", fontWeight: "600", color: "#F05032", display: "flex", alignItems: "center", gap: "4px" }}><Icon icon="mage:code" style={{ fontSize: "14px" }} /> {displayBranch}</span>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <span style={{ fontSize: "10px", color: fgMuted, display: "block" }}>Status</span>
                                {isClean ? (
                                  <span className="badge" style={{ backgroundColor: "rgba(89,168,105,0.15)", color: "#59A869", border: "1px solid rgba(89,168,105,0.2)", fontSize: "10px", padding: "2px 6px" }}>Clean</span>
                                ) : (
                                  <span className="badge" style={{ backgroundColor: "rgba(224,82,82,0.15)", color: "#e05252", border: "1px solid rgba(224,82,82,0.2)", fontSize: "10px", padding: "2px 6px" }}>
                                    {liveGitStatus ? `${liveGitStatus.modified + liveGitStatus.added + liveGitStatus.deleted + liveGitStatus.untracked} Änderungen` : "Geändert"}
                                  </span>
                                )}
                              </div>
                            </div>
                            {liveGitStatus && !isClean && (
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px", fontSize: "10px" }}>
                                {liveGitStatus.modified > 0 && <span style={{ color: "#FFC66D" }}>{liveGitStatus.modified} modifiziert</span>}
                                {liveGitStatus.added > 0 && <span style={{ color: "#59A869" }}>{liveGitStatus.added} neu</span>}
                                {liveGitStatus.deleted > 0 && <span style={{ color: "#e05252" }}>{liveGitStatus.deleted} gelöscht</span>}
                                {liveGitStatus.untracked > 0 && <span style={{ color: fgMuted }}>{liveGitStatus.untracked} unversioniert</span>}
                              </div>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <span style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", color: fgMuted, display: "block", marginBottom: "4px" }}>Letzte Commits</span>
                              {commits.map((c) => (
                                <div key={c.hash} style={{ display: "flex", gap: "8px", fontSize: "11px", alignItems: "center" }}>
                                  <span style={{ color: "var(--glow-color-1,#3574F0)", fontFamily: "var(--font-mono)", fontWeight: "600", flexShrink: 0 }}>{c.hash}</span>
                                  <span style={{ color: fgColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }} title={c.message}>{c.message}</span>
                                  <span style={{ fontSize: "9px", color: fgMuted, flexShrink: 0 }}>{c.date}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                            <button className="settings-btn" onClick={() => { fetchLiveGitData(); showToast("Git-Status aktualisiert"); }} style={{ fontSize: "11px", padding: "6px 12px" }}>Aktualisieren</button>
                            <button className="settings-btn" onClick={() => showToast("Zeno ist lokal und führt Push-Befehle nur über dein System-Git aus")} style={{ fontSize: "11px", padding: "6px 12px" }}>Push (Lokal)</button>
                          </div>
                        </div>
                      );
                    })()}
                    {widget.type === "weather" && (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="text"
                            className="settings-input"
                            placeholder="Standort (z. B. Berlin) + Enter"
                            value={dashboardLocation}
                            onChange={(e) => { setDashboardLocation(e.target.value); setRealWeatherData(null); }}
                            onKeyDown={(e) => { if (e.key === "Enter") fetchRealWeather(); }}
                            style={{ flex: 1, padding: "6px 10px", fontSize: "12px", maxWidth: "none" }}
                          />
                          <select className="settings-input" value={weatherMode} onChange={(e) => { setWeatherMode(e.target.value as "wttr" | "custom"); setRealWeatherData(null); }} style={{ padding: "6px 8px", fontSize: "11px", width: "auto", flexShrink: 0 }}>
                            <option value="wttr">wttr.in</option>
                            <option value="custom">Custom API</option>
                          </select>
                        </div>
                        {weatherMode === "custom" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "8px 10px", backgroundColor: hasBg ? fgColor + "11" : "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}` }}>
                            <input type="text" className="settings-input" value={weatherApiUrl} onChange={(e) => setWeatherApiUrl(e.target.value)} style={{ fontSize: "10px", padding: "5px 8px", maxWidth: "none", fontFamily: "var(--font-mono)" }} />
                            <input type="password" className="settings-input" placeholder="API-Key" value={weatherApiKey} onChange={(e) => setWeatherApiKey(e.target.value)} style={{ fontSize: "11px", padding: "5px 8px", maxWidth: "none" }} />
                          </div>
                        )}
                        {!realWeatherData ? (
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "20px", textAlign: "center" }}>
                            {weatherFetching ? (
                              <>
                                <span style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "var(--glow-color-1,#3574F0)", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                                <span style={{ fontSize: "11px", color: fgMuted }}>Lade Wetterdaten...</span>
                              </>
                            ) : (
                              <>
                                <Icon icon="mage:sun" style={{ fontSize: "28px", color: fgMuted }} />
                                <span style={{ fontSize: "11px", color: fgMuted }}>Keine Wetterdaten geladen</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: hasBg ? fgColor + "11" : "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}` }}>
                              <div>
                                <span style={{ fontSize: "24px", fontWeight: "700", display: "block", color: fgColor }}>{realWeatherData.temp}</span>
                                <span style={{ fontSize: "12px", fontWeight: "600", color: fgMuted }}>{dashboardLocation}</span>
                                <span style={{ fontSize: "10px", display: "block", color: "var(--glow-color-1,#3574F0)", marginTop: "4px" }}>{dashboardTime}</span>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <Icon icon={realWeatherData.icon} style={{ fontSize: "28px", color: "#FFC66D", display: "block", marginLeft: "auto", marginBottom: "2px" }} />
                                <span style={{ fontSize: "11px", color: fgColor, display: "block" }}>{realWeatherData.condition}</span>
                                <span style={{ fontSize: "9px", color: fgMuted, display: "block" }}>{realWeatherData.humidity} / {realWeatherData.wind}</span>
                              </div>
                            </div>

                            {realWeatherData.forecast && realWeatherData.forecast.length > 0 && (
                              <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}` }}>
                                <span style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", color: fgMuted, display: "block", marginBottom: "8px" }}>3-Tage-Vorhersage (wttr.in)</span>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr repeat(4, 1fr)", gap: "4px", paddingBottom: "4px", borderBottom: `1px solid ${hasBg ? fgColor + "15" : "var(--border-color)"}`, fontSize: "8px", fontWeight: "bold", textTransform: "uppercase", color: fgMuted, textAlign: "center" }}>
                                    <div style={{ textAlign: "left" }}>Tag</div>
                                    <div>Nacht</div>
                                    <div>Morgen</div>
                                    <div>Mittag</div>
                                    <div>Abend</div>
                                  </div>
                                  {realWeatherData.forecast.map((f, idx) => (
                                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.2fr repeat(4, 1fr)", gap: "4px", alignItems: "center", padding: "6px 0", borderBottom: idx < 2 ? `1px solid ${hasBg ? fgColor + "10" : "rgba(255,255,255,0.05)"}` : "none", textAlign: "center" }}>
                                      <div style={{ textAlign: "left", fontSize: "10px", fontWeight: "600", color: fgColor }}>{f.date}</div>
                                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                        <Icon icon={f.nightIcon} style={{ fontSize: "12px", color: "#FFC66D" }} />
                                        <span style={{ fontSize: "9px", color: fgColor, fontWeight: "500" }}>{f.nightTemp}</span>
                                      </div>
                                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                        <Icon icon={f.morningIcon} style={{ fontSize: "12px", color: "#FFC66D" }} />
                                        <span style={{ fontSize: "9px", color: fgColor, fontWeight: "500" }}>{f.morningTemp}</span>
                                      </div>
                                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                        <Icon icon={f.noonIcon} style={{ fontSize: "12px", color: "#FFC66D" }} />
                                        <span style={{ fontSize: "9px", color: fgColor, fontWeight: "500" }}>{f.noonTemp}</span>
                                      </div>
                                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                        <Icon icon={f.eveningIcon} style={{ fontSize: "12px", color: "#FFC66D" }} />
                                        <span style={{ fontSize: "9px", color: fgColor, fontWeight: "500" }}>{f.eveningTemp}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        <button className="settings-btn primary" onClick={fetchRealWeather} disabled={weatherFetching} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px", padding: "6px 12px" }}>
                          {weatherFetching ? "Lade..." : "Aktualisieren"}
                        </button>
                        <p style={{ fontSize: "9px", color: fgMuted, lineHeight: "1.4", marginTop: "auto" }}>
                          {weatherMode === "wttr" && "🌐 wttr.in: kein Account, kein Tracking."}
                          {weatherMode === "custom" && "🔑 API-Key bleibt lokal."}
                        </p>
                      </div>
                    )}
                    {widget.type === "privacy-guard" && (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {([["Schlüsselhoheit", "Aktiv & Lokal", "#59A869"], ["E2E Verschlüsselung", "AES-GCM-256 + SFrame", "#59A869"], ["Storage Backup", "BYOS", "#FFC66D"], ["Isolations-Sandbox", "WASM Aktiv", "#59A869"]] as [string, string, string][]).map(([label, val, color]) => (
                            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "11px", color: fgMuted }}>{label}</span>
                              <span className="badge" style={{ backgroundColor: color + "22", color, border: `1px solid ${color}33`, fontSize: "10px", padding: "2px 6px" }}>{val}</span>
                            </div>
                          ))}
                        </div>
                        <p style={{ fontSize: "9px", color: fgMuted, marginTop: "10px", lineHeight: "1.3" }}>Alle Systemfunktionen vollverschlüsselt. Metadaten clientseitig isoliert.</p>
                      </div>
                    )}
                    {widget.type === "custom" && (
                      <div style={{ flex: 1, overflow: "hidden", borderRadius: "var(--radius-sm)" }}>
                        <iframe
                          srcDoc={(() => {
                            let html = "<span style='color:red'>Kein Code</span>";
                            try {
                              // eslint-disable-next-line no-new-func
                              const r = new Function(widget.customCode)();
                              if (typeof r === "string") html = r;
                            } catch (e: unknown) { html = `<span style='color:#e05252;font-size:11px'>Fehler: ${(e as Error).message}</span>`; }
                            return `<!DOCTYPE html><html><head><style>
                            :root {
                              --bg-primary: ${theme === "light" ? "#FFFFFF" : "#1E1F22"};
                              --bg-secondary: ${theme === "light" ? "#F2F3F5" : "#2B2D30"};
                              --bg-tertiary: ${theme === "light" ? "#EBECF0" : "#1A1B1D"};
                              --border-color: ${theme === "light" ? "#DFE1E5" : "#3f4248"};
                              --text-primary: ${theme === "light" ? "#060607" : "#F2F3F5"};
                              --text-muted: ${theme === "light" ? "#5C6370" : "#949BA4"};
                              --glow-color-1: ${glowColor};
                            }
                            *{box-sizing:border-box;margin:0;padding:0}
                            body{font-family:system-ui,sans-serif;font-size:12px;background:${widget.bgColor || "transparent"};color:${fgColor};padding:8px;overflow:auto;height:100vh;}
                            </style></head><body>${html}</body></html>`;
                          })()}
                          sandbox="allow-scripts"
                          style={{ width: "100%", height: "100%", border: "none", background: "transparent" }}
                          title={widget.title}
                        />
                      </div>
                    )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <header className="chat-header">
          <div className="chat-header-info">
            <span className="chat-header-icon"><Icon icon="mage:hashtag" /></span>
            <h2 className="chat-header-channel">{activeChannel.name}</h2>
            <span className="chat-header-divider" />
            <p className="chat-header-description">Kanal für {activeChannel.name} in {activeServer.name}</p>
          </div>
          <div className="chat-header-actions">
            <button className="header-action-btn" onClick={() => showToast("Such-Layout ist im Prototyp deaktiviert")} title="Suche">
              <Icon icon="mage:search" />
            </button>
            <button 
              className={`header-action-btn ${isMembersOpen ? "active" : ""}`} 
              onClick={() => setIsMembersOpen(!isMembersOpen)} 
              title="Mitgliederliste anzeigen/ausblenden"
            >
              <Icon icon="mage:users" />
            </button>
          </div>
        </header>

        {/* Message Feed */}
        <div className="messages-container" key={activeChannel.id}>
          <div className="date-separator" role="separator">
            <span className="date-separator-text">— Heute —</span>
          </div>

          {(chatMessages[activeChannel.id] || []).map((msg, i) => (
            <article 
              key={i} 
              className="message message-animate"
              style={{ "--idx": Math.min(i, 6) } as React.CSSProperties}
            >
              <div className={`message-avatar ${msg.color}`}>{msg.author[0]}</div>
              <div className="message-body">
                <header className="message-header">
                  <span className={`message-author ${msg.color}`} onClick={() => setSelectedUserProfile(mockProfiles[msg.author] || null)} style={{ cursor: "pointer" }}>
                    {msg.author}
                  </span>
                  {mockProfiles[msg.author]?.role === "Bot" && <span className="badge bot-badge">BOT</span>}
                  <time className="message-timestamp">{msg.time}</time>
                </header>
                <div className="message-content">
                  <p>{msg.text}</p>
                  
                  {/* Embedded Code Block */}
                  {msg.code && (
                    <div className="code-block-wrapper" data-language="rust">
                      <header className="code-block-header">
                        <span className="code-block-language">Rust</span>
                        <div className="code-block-actions">
                          <button 
                            className="code-action-btn btn-open-editor" 
                            onClick={() => { setEditorCode(msg.code || ""); setEditorFilename("snippet.rs"); setEditorLanguage(detectLanguage(msg.code || "")); setEditorWorkflowStep("editor"); setIsEditorOpen(true); }}
                          >
                            Open in Editor
                          </button>
                        </div>
                      </header>
                      <pre className="code-block">
                        <code className="language-rust">{msg.code}</code>
                      </pre>
                    </div>
                  )}

                  {/* Message Attachment Rendering */}
                  {msg.attachment && (
                    <div className="message-attachment-card">
                      {msg.attachment.dataUrl ? (
                        <div className="message-attachment-image-wrapper">
                          <img src={msg.attachment.dataUrl} alt={msg.attachment.name} className="message-attachment-image" />
                        </div>
                      ) : (
                        <div className="message-attachment-file-info">
                          <Icon icon="mage:file-records" className="attachment-file-icon" />
                          <div className="attachment-text-details">
                            <span className="attachment-filename">{msg.attachment.name}</span>
                            <span className="attachment-filesize">{msg.attachment.size}</span>
                          </div>
                          <button 
                            className="attachment-download-btn" 
                            onClick={() => {
                              const blob = new Blob(["Simulierter Dateiinhalt"], { type: msg.attachment?.type || "text/plain" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = msg.attachment?.name || "file";
                              link.click();
                              URL.revokeObjectURL(url);
                              showToast(`Download von "${msg.attachment?.name}" gestartet`);
                            }}
                            title="Herunterladen"
                          >
                            <Icon icon="mage:download" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Footer */}
        <footer className="message-input-area" style={{ position: "relative" }}>
          {/* Hidden file input for attachments */}
          <input 
            type="file" 
            ref={chatAttachmentInputRef} 
            style={{ display: "none" }} 
            onChange={handleChatAttachmentChange} 
          />

          {/* Slash Command Suggestions Popup */}
          {showCommandSuggestions && (
            <div className="command-suggestions-popup">
              <header className="suggestions-header">
                <span>Verfügbare Befehle</span>
              </header>
              <div className="suggestions-list">
                {AVAILABLE_COMMANDS.filter((cmd) => cmd.name.toLowerCase().startsWith(inputText.toLowerCase())).map((cmd) => (
                  <button 
                    key={cmd.name}
                    type="button"
                    className="suggestion-item"
                    onClick={() => {
                      setInputText(cmd.name + " ");
                      setShowCommandSuggestions(false);
                      document.getElementById("chat-input-field")?.focus();
                    }}
                  >
                    <span className="suggestion-icon"><Icon icon={cmd.icon} /></span>
                    <div className="suggestion-details">
                      <span className="suggestion-name">{cmd.name}</span>
                      <span className="suggestion-desc">{cmd.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pending Attachment Preview */}
          {pendingAttachment && (
            <div className="pending-attachment-preview">
              <div className="attachment-preview-content">
                {pendingAttachment.dataUrl ? (
                  <img src={pendingAttachment.dataUrl} alt="Vorschau" className="attachment-preview-img" />
                ) : (
                  <Icon icon="mage:file-records" className="attachment-preview-icon" />
                )}
                <div className="attachment-preview-info">
                  <span className="attachment-preview-name">{pendingAttachment.name}</span>
                  <span className="attachment-preview-size">{pendingAttachment.size}</span>
                </div>
              </div>
              <button 
                type="button" 
                className="attachment-preview-remove" 
                onClick={() => setPendingAttachment(null)}
                title="Anhang entfernen"
              >
                <Icon icon="mage:multiply" />
              </button>
            </div>
          )}

          <form className="message-input-container" onSubmit={handleSendMessage}>
            <button className="input-action-btn" type="button" onClick={() => chatAttachmentInputRef.current?.click()} title="Anhang hinzufügen">
              <Icon icon="mage:plus" />
            </button>
            <div className="message-input-wrapper">
              <input
                type="text"
                className="message-input"
                id="chat-input-field"
                placeholder={`Nachricht an # ${activeChannel.name}`}
                value={inputText}
                onChange={(e) => {
                  const val = e.target.value;
                  setInputText(val);
                  setShowCommandSuggestions(val.startsWith("/"));
                }}
                autoComplete="off"
              />
            </div>
            <div className="input-actions-right">
              <button className="input-action-btn" type="button" onClick={() => { setEditorCode(""); setEditorWorkflowStep("select_action"); setIsEditorOpen(true); }} title="Codeblock teilen">
                <Icon icon="mage:code" />
              </button>
              <button className="input-action-btn" type="button" onClick={() => showToast("Emojis sind deaktiviert")} title="Emoji hinzufügen">
                <Icon icon="mage:smile" />
              </button>
            </div>
          </form>
        </footer>
          </>
        )}
      </main>

      {/* 4. MEMBERS SIDEBAR */}
      {activeServerId !== "home" && (
        <aside className={`members-sidebar ${isMembersOpen ? "" : "collapsed"}`}>
          <section className="member-role-group" data-role="entwickler">
            <h3 className="role-group-header">ONLINE — 3</h3>
            <ul className="role-group-list">
              {["MaxShield", "LenaCrypt", "CipherNaut"].map((user) => {
                const profile = mockProfiles[user];
                return (
                  <li key={user}>
                    <div className="member-item" onClick={() => setSelectedUserProfile(profile)}>
                      <div className="member-avatar-wrapper">
                        <div className={`member-avatar ${profile.avatarColor}`}>{profile.avatar}</div>
                        <span className="status-dot online" />
                      </div>
                      <span className="member-name">{profile.name}</span>
                      {profile.role === "Unterstützer" && <span className="badge supporter-badge">⭐</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="member-role-group" data-role="bots">
            <h3 className="role-group-header">BOTS — 1</h3>
            <ul className="role-group-list">
              <li>
                <div className="member-item" onClick={() => setSelectedUserProfile(mockProfiles.ZenoBot)}>
                  <div className="member-avatar-wrapper">
                    <div className="member-avatar orange">Z</div>
                    <span className="status-dot online" />
                  </div>
                  <span className="member-name">ZenoBot</span>
                  <span className="badge bot-badge">BOT</span>
                </div>
              </li>
            </ul>
          </section>

          <section className="member-role-group" data-role="offline">
            <h3 className="role-group-header">OFFLINE — 2</h3>
            <ul className="role-group-list">
              {["DarkNode", "QuantumLeap"].map((user) => {
                const profile = mockProfiles[user];
                return (
                  <li key={user}>
                    <div className="member-item offline" onClick={() => setSelectedUserProfile(profile)}>
                      <div className="member-avatar-wrapper">
                        <div className="member-avatar gray">{profile.avatar}</div>
                        <span className="status-dot offline" />
                      </div>
                      <span className="member-name">{profile.name}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      )}

      {/* 5. CODE EDITOR MODAL */}
      <div className={`modal-overlay ${isEditorOpen ? "open" : ""}`} id="editor-modal">
        {/* Hidden file picker input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: "none" }} 
          onChange={handleFileChange} 
        />

        <div className="code-editor-modal">
          {editorWorkflowStep === "select_action" && (
            <div className="editor-onboarding">
              <header className="onboarding-header">
                <h3>Wie möchtest du starten?</h3>
                <button className="editor-close-btn modal-close" onClick={() => setIsEditorOpen(false)}>
                  <Icon icon="mage:multiply" />
                </button>
              </header>
              <div className="onboarding-cards">
                <button className="onboarding-card" onClick={() => setEditorWorkflowStep("input_filename")}>
                  <div className="onboarding-card-icon"><Icon icon="mage:plus" /></div>
                  <div className="onboarding-card-text">
                    <h4>Neue Datei erstellen</h4>
                    <p>Erstelle ein leeres Dokument und bestimme die Syntax über die Dateiendung.</p>
                  </div>
                </button>
                <button className="onboarding-card" onClick={handleOpenFileClick}>
                  <div className="onboarding-card-icon"><Icon icon="mage:folder-open" /></div>
                  <div className="onboarding-card-text">
                    <h4>Lokale Datei öffnen</h4>
                    <p>Lade ein Dokument von deiner Festplatte in die sichere Ausführungs-Sandbox.</p>
                  </div>
                </button>
              </div>

              <div className="recent-files-section">
                <h4>Kürzlich geöffnete Dateien</h4>
                <div className="recent-files-list">
                  {recentFiles.map((file) => (
                    <button 
                      key={file.name} 
                      className="recent-file-item"
                      onClick={() => {
                        setEditorFilename(file.name);
                        setEditorLanguage(file.language);
                        setEditorCode(file.code);
                        setEditorWorkflowStep("editor");
                        setEditorOutput("");
                      }}
                      style={{ position: "relative" }}
                    >
                      <Icon 
                        icon={
                          file.language === "rust" ? "vscode-icons:file-type-rust" :
                          file.language === "python" ? "vscode-icons:file-type-python" :
                          file.language === "csharp" ? "vscode-icons:file-type-csharp" :
                          file.language === "cpp" ? "vscode-icons:file-type-cpp" :
                          file.language === "javascript" ? "vscode-icons:file-type-js" :
                          file.language === "typescript" ? "vscode-icons:file-type-typescript" :
                          file.language === "html" ? "vscode-icons:file-type-html" :
                          file.language === "css" ? "vscode-icons:file-type-css" :
                          file.language === "json" ? "vscode-icons:file-type-json" :
                          "mage:file-records"
                        } 
                        className="recent-file-icon"
                      />
                      <div className="recent-file-details" style={{ flex: 1 }}>
                        <span className="recent-file-name">{file.name}</span>
                        <span className="recent-file-lang">{file.language.toUpperCase()}</span>
                      </div>
                      <span 
                        className="recent-file-delete-btn"
                        onClick={(e) => handleDeleteRecentFile(e, file.name)}
                        title="Aus Historie löschen"
                      >
                        <Icon icon="mage:trash-3" />
                      </span>
                    </button>
                  ))}
                  {recentFiles.length === 0 && (
                    <p className="no-recent-files">Keine kürzlich geöffneten Dateien.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {editorWorkflowStep === "input_filename" && (
            <div className="editor-filename-input-view">
              <header className="onboarding-header">
                <h3>Neue Datei benennen</h3>
                <button className="editor-close-btn modal-close" onClick={() => setEditorWorkflowStep("select_action")} title="Zurück">
                  <Icon icon="mage:arrow-left" />
                </button>
              </header>
              <div className="filename-input-container">
                <p className="settings-help-text">Wähle einen Namen mit Endung (z.B. <code>main.py</code>, <code>index.js</code>, <code>benchmark.rs</code>).</p>
                <input 
                  type="text" 
                  className="settings-input" 
                  placeholder="Dateiname (z.B. main.rs)"
                  id="editor-new-filename-field"
                  defaultValue="main.rs"
                  style={{ width: "100%", margin: "16px 0", maxWidth: "none" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const input = e.currentTarget.value.trim() || "main.rs";
                      const lang = getLanguageFromExtension(input);
                      const initialCode = input.endsWith(".rs") ? "fn main() {\n    println!(\"Hello World!\");\n}" :
                                    input.endsWith(".py") ? "print(\"Hello World!\")" :
                                    input.endsWith(".js") || input.endsWith(".ts") ? "console.log(\"Hello World!\");" : "";
                      setEditorFilename(input);
                      setEditorLanguage(lang);
                      setEditorCode(initialCode);
                      setEditorWorkflowStep("editor");
                      addRecentFile(input, initialCode, lang);
                    }
                  }}
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    className="settings-btn primary" 
                    onClick={() => {
                      const inputEl = document.getElementById("editor-new-filename-field") as HTMLInputElement;
                      const input = inputEl?.value.trim() || "main.rs";
                      const lang = getLanguageFromExtension(input);
                      const initialCode = input.endsWith(".rs") ? "fn main() {\n    println!(\"Hello World!\");\n}" :
                                    input.endsWith(".py") ? "print(\"Hello World!\")" :
                                    input.endsWith(".js") || input.endsWith(".ts") ? "console.log(\"Hello World!\");" : "";
                      setEditorFilename(input);
                      setEditorLanguage(lang);
                      setEditorCode(initialCode);
                      setEditorWorkflowStep("editor");
                      addRecentFile(input, initialCode, lang);
                    }}
                  >
                    Erstellen
                  </button>
                  <button className="settings-btn" onClick={() => setEditorWorkflowStep("select_action")}>
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}

          {editorWorkflowStep === "editor" && (
            <>
              <header className="editor-modal-header">
                <div className="editor-modal-title-area">
                  {isRenaming ? (
                    <input
                      type="text"
                      className="editor-filename-rename-input"
                      defaultValue={editorFilename}
                      onBlur={(e) => handleRenameFile(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRenameFile(e.currentTarget.value);
                        } else if (e.key === "Escape") {
                          setIsRenaming(false);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="editor-filename editable" 
                      onClick={() => setIsRenaming(true)}
                      title="Klicke zum Umbenennen"
                    >
                      {editorFilename}
                      {isEditorDirty && <span style={{ color: "var(--glow-color-1, #3574F0)", marginLeft: "6px", fontSize: "10px" }} title="Ungespeicherte Änderungen">●</span>}
                      <Icon icon="mage:edit" className="filename-edit-icon" style={{ marginLeft: "6px", fontSize: "12px", opacity: 0.6 }} />
                    </span>
                  )}
                  <span className="badge language-badge">{editorLanguage.toUpperCase()}</span>
                </div>
                <button className="editor-close-btn modal-close" onClick={() => setIsEditorOpen(false)} title="Schließen">
                  <Icon icon="mage:multiply" />
                </button>
              </header>

              <div className="editor-code-area" style={{ minHeight: "400px" }}>
                <Editor
                  height="100%"
                  language={editorLanguage}
                  theme="vs-dark"
                  value={editorCode}
                  onChange={(val) => {
                    setEditorCode(val || "");
                    setIsEditorDirty(true);
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: "var(--font-mono)",
                    automaticLayout: true
                  }}
                />
              </div>

              <footer className="editor-modal-toolbar">
                <button className="editor-toolbar-btn primary btn-run" onClick={handleEditorRun} title="Ausführen">
                  <Icon icon="mage:play" /> Run
                </button>
                <button 
                  className="editor-toolbar-btn btn-copy" 
                  onClick={() => { navigator.clipboard.writeText(editorCode); showToast("Code kopiert!"); }} 
                  title="Kopieren"
                >
                  <Icon icon="mage:copy" /> Copy
                </button>
                <button 
                  className="editor-toolbar-btn btn-save" 
                  onClick={handleSaveFile} 
                  title="Speichern (Ctrl+S)"
                >
                  <Icon icon="lucide:save" /> Save {isEditorDirty && <span style={{ fontSize: "10px", color: "var(--glow-color-1, #3574F0)", marginLeft: "2px" }}>●</span>}
                </button>
                <button 
                  className="editor-toolbar-btn btn-suggest-edit" 
                  onClick={() => {
                    setChatMessages((prev) => ({
                      ...prev,
                      [activeChannel.id]: [...(prev[activeChannel.id] || []), {
                        author: "CipherNaut",
                        text: `Änderungsvorschlag für ${editorFilename} gesendet:`,
                        time: getCurrentTimestamp(),
                        color: "purple",
                        code: editorCode
                      }]
                    }));
                    setIsEditorOpen(false);
                    showToast("Änderungsvorschlag gesendet!");
                  }} 
                  title="Änderung vorschlagen"
                >
                  <Icon icon="mage:message-round" /> Suggest
                </button>
                <button 
                  className="editor-toolbar-btn btn-delete-file" 
                  onClick={handleDeleteCurrentFile} 
                  title="Aus Workspace löschen"
                  style={{ color: "var(--accent-danger, #E05555)", marginLeft: "auto" }}
                >
                  <Icon icon="mage:trash-3" /> Delete
                </button>
              </footer>

              {editorOutput && (
                <pre className="editor-output">
                  <code>{editorOutput}</code>
                </pre>
              )}
            </>
          )}
        </div>
      </div>

      {/* 6. DISCORD-STYLE FULLSCREEN SETTINGS MODAL */}
      <div className={`modal-overlay ${isSettingsOpen ? "open" : ""}`} id="settings-modal">
        <div className="settings-modal">
          <aside className="settings-sidebar">
            <div className="settings-sidebar-header">BENUTZER-EINSTELLUNGEN</div>
            <button 
              className={`settings-nav-item ${activeSettingsTab === "profile" ? "active" : ""}`} 
              onClick={() => setActiveSettingsTab("profile")}
            >
              Mein Profil
            </button>
            <button 
              className={`settings-nav-item ${activeSettingsTab === "appearance" ? "active" : ""}`} 
              onClick={() => setActiveSettingsTab("appearance")}
            >
              Erscheinungsbild
            </button>
            <button 
              className={`settings-nav-item ${activeSettingsTab === "byos" ? "active" : ""}`} 
              onClick={() => setActiveSettingsTab("byos")}
            >
              BYOS (Speicher)
            </button>
            <button 
              className={`settings-nav-item ${activeSettingsTab === "security" ? "active" : ""}`} 
              onClick={() => setActiveSettingsTab("security")}
            >
              Sicherheit & Keys
            </button>
            <button 
              className={`settings-nav-item ${activeSettingsTab === "editor" ? "active" : ""}`} 
              onClick={() => setActiveSettingsTab("editor")}
            >
              Monaco-Editor
            </button>
            <button 
              className={`settings-nav-item ${activeSettingsTab === "github" ? "active" : ""}`} 
              onClick={() => setActiveSettingsTab("github")}
            >
              GitHub-Integration
            </button>
          </aside>

          <main className="settings-content">
            <div className="settings-close-wrapper">
              <button className="settings-close-btn" onClick={() => setIsSettingsOpen(false)} title="Schließen">
                <Icon icon="mage:multiply" />
              </button>
              <span className="settings-close-label">ESC</span>
            </div>

            <div>
              {/* Tab: Profile */}
              {activeSettingsTab === "profile" && (
                <div className="settings-tab-content" id="tab-profile">
                  <h3>Kryptografisches Profil</h3>
                  <div className="settings-profile-card">
                    <div className="profile-avatar-large purple">C</div>
                    <div className="profile-info-large">
                      <span className="profile-name">CipherNaut</span>
                      <span className="profile-status-badge">Unterstützer ⭐</span>
                    </div>
                  </div>
                  <div className="settings-form-group">
                    <label>Kryptografische ID (Ed25519 Public Key)</label>
                    <div className="key-display-wrapper">
                      <code className="key-display">0xA3F9D1E8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890</code>
                      <button 
                        className="btn-copy-key" 
                        onClick={() => { navigator.clipboard.writeText("0xA3F9D1E8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890"); showToast("Public Key kopiert!"); }} 
                        title="Kopieren"
                      >
                        <Icon icon="mage:copy" />
                      </button>
                    </div>
                  </div>
                  <div className="settings-form-group">
                    <label>Geräte-Kopplung (Device Pairing)</label>
                    <p className="settings-help-text">Kopple ein weiteres Gerät durch Scannen des Pairing-Codes.</p>
                    <button className="settings-btn" onClick={() => showToast("Gerätekopplung gestartet")}>Pairing starten</button>
                  </div>
                </div>
              )}

              {/* Tab: Appearance */}
              {activeSettingsTab === "appearance" && (
                <div className="settings-tab-content" id="tab-appearance">
                  <h3>Erscheinungsbild & Canvas</h3>
                  <div className="settings-form-group">
                    <label>Milchglas-Effekt (Glassmorphism)</label>
                    <div className="switch-control">
                      <span>Transparenz- und Blur-Effekte aktivieren</span>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={glassmorphism} 
                          onChange={(e) => setGlassmorphism(e.target.checked)} 
                        />
                        <span className="slider" />
                      </label>
                    </div>
                  </div>
                  <div className="settings-form-group">
                    <label>Hintergrund-Presets</label>
                    <div className="color-presets" id="settings-color-presets">
                      {(theme === "light" ? lightPresets : darkPresets).map((preset) => (
                        <button
                          key={preset.color}
                          className={`preset-btn ${canvasColor === preset.color ? "active" : ""}`}
                          style={{ backgroundColor: preset.color }}
                          title={preset.title}
                          onClick={() => setCanvasColor(preset.color)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="settings-form-group">
                    <div className="custom-color-control">
                      <label htmlFor="settings-canvas-color">Eigene Hintergrundfarbe:</label>
                      <input 
                        type="color" 
                        id="settings-canvas-color" 
                        value={canvasColor} 
                        onChange={(e) => setCanvasColor(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="settings-form-group">
                    <div className="custom-color-control">
                      <label htmlFor="settings-glow-color">Radial-Glow Farbe:</label>
                      <input 
                        type="color" 
                        id="settings-glow-color" 
                        value={glowColor} 
                        onChange={(e) => setGlowColor(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: BYOS */}
              {activeSettingsTab === "byos" && (
                <div className="settings-tab-content" id="tab-byos">
                  <h3>Bring Your Own Storage (BYOS)</h3>
                  <p className="settings-help-text">Verbinde deinen eigenen Cloud-Speicher für Datei-Uploads über 10 MB.</p>
                  <div className="settings-form-group">
                    <label htmlFor="byos-provider">Speicher-Provider</label>
                    <select id="byos-provider" className="settings-select">
                      <option value="nextcloud">Nextcloud (WebDAV)</option>
                      <option value="s3">AWS S3 / MinIO</option>
                      <option value="dropbox">Dropbox API</option>
                    </select>
                  </div>
                  <div className="settings-form-group">
                    <label htmlFor="byos-url">Server-URL</label>
                    <input type="text" id="byos-url" className="settings-input" defaultValue="https://cloud.zeno-chat.de/remote.php/dav/files/" />
                  </div>
                  <div className="settings-form-group">
                    <label htmlFor="byos-user">Benutzername / Key ID</label>
                    <input type="text" id="byos-user" className="settings-input" defaultValue="cipher_naut" />
                  </div>
                  <button className="settings-btn primary" onClick={() => { setIsSettingsOpen(false); showToast("BYOS-Einstellungen gespeichert!"); }}>
                    Verbindung testen & Speichern
                  </button>
                </div>
              )}

              {/* Tab: Security */}
              {activeSettingsTab === "security" && (
                <div className="settings-tab-content" id="tab-security">
                  <h3>Sicherheit & Recovery</h3>
                  <div className="settings-form-group">
                    <label>Backup-Key (Seed Phrase)</label>
                    <p className="settings-help-text">Sichere deine 12-Wort-Seed-Phrase, um deine Identität auf neuen Geräten wiederherzustellen.</p>
                    <button className="settings-btn" onClick={() => showToast("Seed Phrase: apple banana cherry ...")}>Backup-Key anzeigen</button>
                  </div>
                  <div className="settings-form-group">
                    <label>Social Recovery (Treuhänder)</label>
                    <p className="settings-help-text">Teile deinen Key via Shamir's Secret Sharing auf 5 vertrauenswürdige Kontakte auf.</p>
                    <button className="settings-btn" onClick={() => showToast("Social Recovery Setup gestartet")}>Social Recovery einrichten</button>
                  </div>
                </div>
              )}

              {/* Tab: Monaco-Editor */}
              {activeSettingsTab === "editor" && (
                <div className="settings-tab-content" id="tab-editor">
                  <h3>Monaco-Editor Laufzeitumgebungen</h3>
                  <p className="settings-help-text">
                    Verwalte hier die clientseitigen Sandboxen und Compiler-Bibliotheken für verschiedene Programmiersprachen.
                  </p>

                  <div className="runtime-settings-list" style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {[
                      { id: "javascript", name: "JavaScript / TypeScript Sandbox", desc: "Native isolierte Sandbox-Laufzeit im Web Worker. Keine Downloads erforderlich.", size: "0 MB (integriert)", icon: "vscode-icons:file-type-js" },
                      { id: "python", name: "Python WebAssembly Playground (Pyodide)", desc: "Lokale Python-Ausführung über den Pyodide WASM-Interpreter.", size: "12.8 MB", icon: "vscode-icons:file-type-python" },
                      { id: "rust", name: "Rust Compiler Simulator & Aegis Crypto", desc: "Rust-Laufzeitsimulation und lokale Aegis Kryptografie-Pakete.", size: "4.5 MB", icon: "vscode-icons:file-type-rust" },
                      { id: "csharp", name: ".NET Sandbox Simulator (C#)", desc: ".NET CLR Simulator zur clientseitigen Ausführung von C#-Codeblöcken.", size: "8.2 MB", icon: "vscode-icons:file-type-csharp" },
                      { id: "cpp", name: "C / C++ Compiler Simulator (WASM-based)", desc: "WebAssembly-basierter gcc/g++-Simulator zur lokalen Code-Validierung.", size: "6.1 MB", icon: "vscode-icons:file-type-cpp" }
                    ].map((rt) => {
                      const status = editorRuntimes[rt.id];
                      return (
                        <div key={rt.id} className="runtime-card" style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "16px",
                          backgroundColor: "var(--bg-tertiary)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "var(--radius-md)",
                          gap: "16px"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <Icon icon={rt.icon} style={{ fontSize: "28px", flexShrink: 0 }} />
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>{rt.name}</span>
                              <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{rt.desc}</span>
                              <span style={{ fontSize: "9px", color: "var(--glow-color-1, #3574F0)", fontWeight: "600", marginTop: "4px" }}>Größe: {rt.size}</span>
                            </div>
                          </div>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                            {status === "installed" ? (
                              <>
                                <span className="badge" style={{ backgroundColor: "rgba(89, 168, 105, 0.15)", color: "#59A869", border: "1px solid rgba(89, 168, 105, 0.3)" }}>Bereit</span>
                                {rt.id !== "javascript" && (
                                  <button className="settings-btn" onClick={() => handleDeleteRuntime(rt.id)} style={{ padding: "6px 12px", color: "var(--accent-danger)" }}>Deinstallieren</button>
                                )}
                              </>
                            ) : status === "installing" ? (
                              <>
                                <span className="badge" style={{ backgroundColor: "rgba(255, 198, 109, 0.15)", color: "#FFC66D", border: "1px solid rgba(255, 198, 109, 0.3)" }}>Installiert...</span>
                                <div className="spinner" style={{ width: "16px", height: "16px", border: "2px solid var(--border-color)", borderTopColor: "var(--accent-color)", borderRadius: "50%", animation: "zeno-pulse 1s linear infinite" }} />
                              </>
                            ) : (
                              <>
                                <span className="badge" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>Nicht installiert</span>
                                <button className="settings-btn primary" onClick={() => handleInstallRuntime(rt.id)} style={{ padding: "6px 12px" }}>Download & Installieren</button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab: GitHub-Integration */}
              {activeSettingsTab === "github" && (
                <div className="settings-tab-content" id="tab-github">
                  <h3>GitHub-Integration (100% lokal & privat)</h3>
                  <p className="settings-help-text">
                    Verbinde dein GitHub-Konto direkt über deinen Webbrowser mit der GitHub-API. 
                    <strong> Wichtig:</strong> Dein Token verbleibt ausschließlich lokal auf diesem Gerät im Speicher der App. 
                    Es wird niemals an einen Zeno-Server gesendet.
                  </p>

                  <div className="settings-form-group" style={{ marginTop: "20px" }}>
                    <label>Personal Access Token (PAT)</label>
                    <p className="settings-help-text">
                      Erstelle ein Token mit <code>repo</code>-Rechten auf GitHub, um deinen Repository-Status abzufragen und Commits einzusehen.
                    </p>
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <input 
                        type="password" 
                        className="settings-input" 
                        placeholder="ghp_..." 
                        value={githubToken} 
                        onChange={(e) => {
                          setGithubToken(e.target.value);
                          setGithubUser(null);
                        }}
                        style={{ flex: 1, maxWidth: "none" }}
                      />
                      <button 
                        className="settings-btn primary" 
                        onClick={testGithubConnection} 
                        disabled={githubConnecting || !githubToken.trim()}
                        style={{ flexShrink: 0 }}
                      >
                        {githubConnecting ? "Verbinde..." : "Verbindung testen"}
                      </button>
                    </div>
                  </div>

                  {githubUser && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginTop: "16px",
                      padding: "12px",
                      backgroundColor: "rgba(89, 168, 105, 0.1)",
                      border: "1px solid rgba(89, 168, 105, 0.3)",
                      borderRadius: "var(--radius-md)"
                    }}>
                      <img 
                        src={githubUser.avatarUrl} 
                        alt="GitHub Avatar" 
                        style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid #59A869" }}
                      />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#59A869" }}>✓ Erfolgreich verbunden</span>
                        <span style={{ fontSize: "11px", color: "var(--text-primary)", fontWeight: "600" }}>
                          {githubUser.name || githubUser.login} (@{githubUser.login})
                        </span>
                      </div>
                    </div>
                  )}

                  <div style={{
                    marginTop: "24px",
                    padding: "16px",
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-lg)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px"
                  }}>
                    <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>Sicherheitsprotokoll & Transparenz</span>
                    <ul style={{ fontSize: "11px", color: "var(--text-muted)", paddingLeft: "16px", lineHeight: "1.6" }}>
                      <li>Direct-Client-Request: Keine API-Proxy-Server oder Cloud-Gateways. Die Anfrage erfolgt direkt von deiner lokalen IP zu GitHub.</li>
                      <li>Speicherort: Der Token wird ausschließlich in deiner lokalen Desktop-App-Sandbox gespeichert.</li>
                      <li>Minimalberechtigung: Verwende am besten ein feinkörniges (Fine-grained) Token mit Nur-Lese-Rechten auf ausgewählte Repositories.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* 7. PROFILE DETAILS MODAL */}
      <div className={`modal-overlay ${selectedUserProfile ? "open" : ""}`} id="profile-modal">
        {selectedUserProfile && (
          <div className="profile-modal-card">
            <header className="profile-card-header">
              <button className="modal-close" onClick={() => setSelectedUserProfile(null)} title="Schließen">
                <Icon icon="mage:multiply" />
              </button>
            </header>
            <div className="profile-card-body">
              <div 
                className={`profile-card-avatar ${selectedUserProfile.avatarColor}`}
                style={selectedUserProfile.bgColor ? { backgroundColor: selectedUserProfile.bgColor } : {}}
              >
                {selectedUserProfile.avatar}
              </div>
              <h3 className="profile-card-name">{selectedUserProfile.name}</h3>
              <span className="profile-card-role">{selectedUserProfile.role.toUpperCase()}</span>
              {selectedUserProfile.status && <div className="profile-card-status">{selectedUserProfile.status}</div>}
              
              <div className="profile-card-section">
                <label>Kryptografischer Fingerprint</label>
                <div className="fingerprint-display">
                  {selectedUserProfile.fingerprint}
                </div>
              </div>

              <div className="profile-card-actions">
                <button className="profile-action-btn primary" onClick={() => { setSelectedUserProfile(null); showToast(`Sicherer DM-Chat mit ${selectedUserProfile.name} gestartet`); }}>
                  Sicheren Chat starten
                </button>
                <button className="profile-action-btn" onClick={() => showToast("Kryptografische Identität verifiziert!")}>
                  Identität verifizieren
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TOAST CONTAINER */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
