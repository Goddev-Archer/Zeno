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

function getCurrentTimestamp(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

export default function App() {
  // --- STATE ---
  const [servers, setServers] = useState<Server[]>(initialServers);
  const [activeServerId, setActiveServerId] = useState<string>(initialServers[0].id);
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
  const [editorCode, setEditorCode] = useState<string>("");
  const [editorLanguage, setEditorLanguage] = useState<string>("rust");
  const [editorFilename, setEditorFilename] = useState<string>("main.rs");
  const [editorWorkflowStep, setEditorWorkflowStep] = useState<"select_action" | "input_filename" | "editor">("select_action");
  const [editorOutput, setEditorOutput] = useState<string>("");
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
    setActiveServerId(server.id);
    // Auto-select first text channel on server change
    const firstTextChan = server.categories.find((c) => c.type === "text")?.channels[0];
    if (firstTextChan) {
      setActiveChannel(firstTextChan);
    }
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
      showToast(`Datei "${editorFilename}" erfolgreich gespeichert!`);
    } catch (err: any) {
      showToast(`Fehler beim Speichern: ${err.message}`);
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
          className="server-icon home-button" 
          onClick={() => showToast("Zeno Startseite geöffnet")} 
          title="Zeno Home"
        >
          <img src="/zeno_logo.svg" alt="Zeno Logo" style={{ width: "30px", height: "30px", borderRadius: "6px" }} />
        </button>

        <div className="server-separator" role="separator" />

        <nav className="server-list" aria-label="Server-Liste">
          {servers.map((srv) => (
            <button
              key={srv.id}
              className={`server-icon ${activeServer.id === srv.id ? "active" : ""}`}
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
        <header className="server-header">
          <h1 className="server-name">{activeServer.name}</h1>
          <button className="server-dropdown-toggle" onClick={() => showToast("Server-Menü geöffnet")}>
            <Icon icon="mage:chevron-down" />
          </button>
        </header>

        <div className="channel-list">
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
                    {cat.channels.map((ch) => {
                      const isText = cat.type === "text";
                      const isChannelActive = activeChannel.id === ch.id;
                      
                      return (
                        <li key={ch.id}>
                          <button
                            className={`channel-item ${isChannelActive ? "active" : ""} ${!isText ? "voice-channel" : ""}`}
                            onClick={() => isText ? setActiveChannel(ch) : handleJoinVoice(ch.id, ch.name)}
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
        <div className="messages-container">
          <div className="date-separator" role="separator">
            <span className="date-separator-text">— Heute —</span>
          </div>

          {(chatMessages[activeChannel.id] || []).map((msg, i) => (
            <article key={i} className="message visible">
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
      </main>

      {/* 4. MEMBERS SIDEBAR */}
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
                      <div className="recent-file-details">
                        <span className="recent-file-name">{file.name}</span>
                        <span className="recent-file-lang">{file.language.toUpperCase()}</span>
                      </div>
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
                  <span className="editor-filename">{editorFilename}</span>
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
                  onChange={(val) => setEditorCode(val || "")}
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
                  title="Speichern"
                >
                  <Icon icon="mage:save" /> Save
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
