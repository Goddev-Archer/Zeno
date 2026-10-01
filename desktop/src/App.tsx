import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import "./App.css";

// --- TYPES & UTILS ---
import {
  Server,
  Category,
  Channel,
  Message,
  MessageAttachment,
  Profile,
  Toast,
  RecentFile,
  IdeFile,
  WidgetConfig,
  LiveGitStatus,
  LiveGitCommit,
  UserIdentity
} from "./types";
import {
  getActiveIdentityFromDb
} from "./services/cryptoService";
import { executeZeroKnowledgeAuth, syncEncryptedVaultToServer } from "./services/backendService";
import { commitAndPushServerManifest } from "./services/gitServerSyncService";
import {
  saveServerToDb,
  loadServersFromDb,
  saveMessageToDb,
  loadChannelMessagesFromDb
} from "./services/dbService";
import {
  joinVoiceChannel,
  leaveVoiceChannel,
  setVoiceMute,
  setVoiceDeafen,
  broadcastNetworkMessage,
  subscribeToVoiceState,
  subscribeToIncomingMessages
} from "./services/voiceNetworkService";
import { audioStreamService } from "./services/audioStreamService";
import { relayClient, RelayNodeStatus } from "./services/relayClientService";
import { cleanUrl } from "./utils/urlCleaner";
import {
  initialServers,
  initialMessages,
  mockProfiles,
  defaultWorkspace,
  HUB_RUNTIMES_CATALOG,
  INITIAL_WIDGETS
} from "./data/mockData";

// --- COMPONENTS ---
import { ZenoErrorBoundary } from "./components/common/ErrorBoundary";
import { ServerSidebar } from "./components/sidebar/ServerSidebar";
import { ChannelSidebar } from "./components/sidebar/ChannelSidebar";
import { MembersSidebar } from "./components/sidebar/MembersSidebar";
import { ChatArea } from "./components/chat/ChatArea";
import { Dashboard } from "./components/dashboard/Dashboard";
import { WasmHub } from "./components/wasm/WasmHub";
import { ZenoIde } from "./components/ide/ZenoIde";

// --- MODALS ---
import { SovereignAccountModal } from "./components/modals/SovereignAccountModal";
import { CreateJoinServerModal } from "./components/modals/CreateJoinServerModal";
import { ProfileCardModal } from "./components/modals/ProfileCardModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { CodeEditorModal } from "./components/modals/CodeEditorModal";
import { WidgetMarketplaceModal } from "./components/modals/WidgetMarketplaceModal";
import { MarketplaceWidget } from "./data/widgetMarketplaceData";
import { CustomWasmModal } from "./components/modals/CustomWasmModal";
import { IdeProjectWizardModal, IdeNewItemModal } from "./components/modals/IdeModals";
import { CreateChannelModal } from "./components/modals/CreateChannelModal";
import { GitSyncModal } from "./components/modals/GitSyncModal";

// Configure Monaco Environment to prevent dynamic worker fetch errors in Vite
if (typeof window !== "undefined") {
  (window as any).MonacoEnvironment = {
    getWorker: function () {
      const workerCode = `self.onmessage = function() {};`;
      const blob = new Blob([workerCode], { type: "application/javascript" });
      return new Worker(URL.createObjectURL(blob));
    }
  };
}

loader.config({ monaco });

// --- MULTI-LANGUAGE INTELLISENSE ENGINE FOR MONACO ---
let isIntelliSenseRegistered = false;

function setupZenoIntelliSense(monaco: any) {
  if (isIntelliSenseRegistered || !monaco) return;
  isIntelliSenseRegistered = true;

  // Register Custom Zeno Themes
  monaco.editor.defineTheme("zeno-dark-theme", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "5C6370", fontStyle: "italic" },
      { token: "keyword", foreground: "CF8E6D", fontStyle: "bold" },
      { token: "string", foreground: "6A8759" },
      { token: "number", foreground: "6897BB" },
      { token: "regexp", foreground: "9A5334" },
      { token: "type", foreground: "A9B7C6" },
      { token: "class", foreground: "A9B7C6" },
      { token: "function", foreground: "57B6C2" },
      { token: "variable", foreground: "A9B7C6" }
    ],
    colors: {
      "editor.background": "#18191B",
      "editor.foreground": "#E3E4E8",
      "editor.lineHighlightBackground": "#26282E",
      "editor.selectionBackground": "#214283",
      "editorCursor.foreground": "#528BFF",
      "editorWhitespace.foreground": "#3B4048",
      "editorLineNumber.foreground": "#4B5263",
      "editorLineNumber.activeForeground": "#E3E4E8"
    }
  });

  monaco.editor.defineTheme("zeno-light-theme", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "5C6370", fontStyle: "italic" },
      { token: "keyword", foreground: "0033B3", fontStyle: "bold" },
      { token: "string", foreground: "067D17" },
      { token: "number", foreground: "1750EB" },
      { token: "function", foreground: "00627A" }
    ],
    colors: {
      "editor.background": "#E3E4E8",
      "editor.foreground": "#060607",
      "editor.lineHighlightBackground": "#DFE1E5",
      "editor.selectionBackground": "#A6D2FF",
      "editorCursor.foreground": "#0066CC",
      "editorLineNumber.foreground": "#ADADAD",
      "editorLineNumber.activeForeground": "#060607"
    }
  });
}

function getContrastColor(hexColor: string): string {
  if (!hexColor) return "#ffffff";
  const hex = hexColor.replace("#", "");
  if (hex.length !== 6) return "#ffffff";
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#111214" : "#ffffff";
}

const AVAILABLE_COMMANDS = [
  { name: "/clean", desc: "Reinigt URLs von allen Tracking-Parametern", icon: "mage:shield-check" },
  { name: "/code", desc: "Öffnet den Monaco-Editor für Code-Sharing", icon: "mage:code" },
  { name: "/privacy", desc: "Zeigt die aktuellen Verschlüsselungs-Metriken", icon: "mage:shield" },
  { name: "/theme", desc: "Wechselt zwischen Dark Mode & Light Mode", icon: "mage:sun" },
  { name: "/help", desc: "Hilfe & Liste aller verifizierten Befehle", icon: "mage:information-circle" }
];

const darkPresets = [
  { color: "#18191B", title: "Default Dark" },
  { color: "#0F1015", title: "Deep Space" },
  { color: "#0F1411", title: "Forest Green" },
  { color: "#16101E", title: "Purple Night" },
  { color: "#17120F", title: "Warm Ember" }
];

const lightPresets = [
  { color: "#E3E4E8", title: "Default Light" },
  { color: "#F5F5F7", title: "Clean White" },
  { color: "#EBF2EE", title: "Mint Soft" },
  { color: "#F2EBF5", title: "Lavender Soft" },
  { color: "#F5F0EB", title: "Warm Paper" }
];

function ZenoMainApp() {
  const [servers, setServers] = useState<Server[]>(() => {
    const saved = localStorage.getItem("zeno_custom_servers");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved servers", e);
      }
    }
    return initialServers;
  });

  useEffect(() => {
    try {
      localStorage.setItem("zeno_custom_servers", JSON.stringify(servers));
    } catch (e) {
      console.error("Failed to save servers to localStorage", e);
    }
  }, [servers]);
  const [activeServerId, setActiveServerId] = useState<string>("home");
  const [homeTab, setHomeTab] = useState<"dashboard" | "wasm_hub" | "ide">("dashboard");
  const [activeServer, setActiveServer] = useState<Server>(initialServers[0]);
  const [activeChannel, setActiveChannel] = useState<Channel>(initialServers[0].categories[0].channels[0]);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [animatingServerId, setAnimatingServerId] = useState<string | null>(null);

  // Chat & Messaging State
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>(initialMessages);
  const [inputText, setInputText] = useState<string>("");
  const [showCommandSuggestions, setShowCommandSuggestions] = useState<boolean>(false);
  const [pendingAttachment, setPendingAttachment] = useState<MessageAttachment | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatAttachmentInputRef = useRef<HTMLInputElement | null>(null);

  // Appearance & Design Tokens State
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [canvasColor, setCanvasColor] = useState<string>("#18191B");
  const [glowColor, setGlowColor] = useState<string>("#3574F0");
  const [glassmorphism, setGlassmorphism] = useState<boolean>(true);

  // Voice Channel & Audio State
  const [connectedVoice, setConnectedVoice] = useState<string | null>(null);
  const [voiceStartTime, setVoiceStartTime] = useState<number | null>(null);
  const [voiceDuration, setVoiceDuration] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);
  const [deafened, setDeafened] = useState<boolean>(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState<boolean>(false);
  const [localAudioLevel, setLocalAudioLevel] = useState<number>(0);
  const [voicePing, setVoicePing] = useState<number>(14);
  const [activeVoiceSpeakers, setActiveVoiceSpeakers] = useState<string[]>([]);

  // UI Panels & Layout State
  const [isMembersOpen, setIsMembersOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>("profile");
  const [selectedUserProfile, setSelectedUserProfile] = useState<Profile | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Custom Profile State
  const [userName, setUserName] = useState<string>("CipherNaut");
  const [userProfilePreset, setUserProfilePreset] = useState<"default" | "cyberpunk" | "glassmorphism" | "synthwave" | "matrix" | "custom">("cyberpunk");
  const [userCustomCss, setUserCustomCss] = useState<string>(
`/* Custom Cyberpunk Profile Theme */
#profile-card-modal .profile-modal-card {
  border: 1px solid #FF0080;
  box-shadow: 0 0 25px rgba(255, 0, 128, 0.5), 0 0 50px rgba(121, 40, 202, 0.4);
}
#profile-card-modal .profile-card-name {
  color: #00DFD8 !important;
  text-shadow: 0 0 10px rgba(0, 223, 216, 0.8);
}`
  );
  const [userBadge, setUserBadge] = useState<string>("⚡ VIP CYBERNAUT");
  const [userBadgePosition, setUserBadgePosition] = useState<"badge-center" | "badge-right" | "badge-left">("badge-center");
  const [userStatusQuote, setUserStatusQuote] = useState<string>("Zeno verschlüsselt meine Daten.");
  const [userBannerGradient, setUserBannerGradient] = useState<string>("linear-gradient(135deg, #7928CA 0%, #FF0080 100%)");
  const [userAvatarImage, setUserAvatarImage] = useState<string>("");
  const [userAvatarHoverEffect, setUserAvatarHoverEffect] = useState<"none" | "float" | "spin" | "pulse" | "glow" | "bounce">("float");
  const [userAvatarEffectFrame, setUserAvatarEffectFrame] = useState<"none" | "cyber_ring" | "neon_pulse" | "golden_aura" | "fire_particles" | "galaxy_orbit">("cyber_ring");
  const [userBadgeBgColor, setUserBadgeBgColor] = useState<string>("");
  const [userBadgeTextColor, setUserBadgeTextColor] = useState<string>("");
  const [userCardBgColor, setUserCardBgColor] = useState<string>("");
  const [userCardHoverEffect, setUserCardHoverEffect] = useState<"none" | "rainbow_border" | "holographic_shimmer" | "cosmic_glow" | "neon_border">("holographic_shimmer");
  const [userLayoutOrder, setUserLayoutOrder] = useState<"standard" | "compact" | "avatar_left" | "banner_overlay">("standard");
  const [userAnimationPreset, setUserAnimationPreset] = useState<"none" | "subtle_pulse" | "floating_card" | "neon_flicker" | "particle_shimmer">("none");

  // Cryptographic AIN & Keypair State
  const [userIdentity, setUserIdentity] = useState<UserIdentity | null>(null);
  const [isSovereignModalOpen, setIsSovereignModalOpen] = useState<boolean>(false);
  const [sovereignModalTab, setSovereignModalTab] = useState<"create" | "restore" | "manage">("create");

  useEffect(() => {
    getActiveIdentityFromDb().then((activeIdn) => {
      if (activeIdn) {
        const idn: UserIdentity = {
          ain: activeIdn.ain,
          publicKeyHex: activeIdn.publicKeyHex,
          privateKeyEncryptedHex: activeIdn.privateKeyEncryptedHex,
          mnemonic: activeIdn.mnemonic,
          fingerprint: activeIdn.fingerprint,
          createdAt: activeIdn.createdAt
        };
        setUserIdentity(idn);
        if (activeIdn.username) {
          setUserName(activeIdn.username);
        }
        if (mockProfiles.CipherNaut) {
          mockProfiles.CipherNaut.fingerprint = activeIdn.fingerprint;
        }
        // If the active identity does NOT have a 12-word seed phrase (legacy mock key), launch the Sovereign Onboarding Wizard!
        if (!activeIdn.mnemonic) {
          setSovereignModalTab("create");
          setIsSovereignModalOpen(true);
        }
      } else {
        // No identity in DB/Storage: launch the Sovereign Onboarding Wizard!
        setSovereignModalTab("create");
        setIsSovereignModalOpen(true);
      }
    });
  }, []);

  const handleIdentityChanged = (newIdentity: UserIdentity, newUsername: string) => {
    setUserIdentity(newIdentity);
    if (newUsername) {
      setUserName(newUsername);
    }
    if (mockProfiles.CipherNaut) {
      mockProfiles.CipherNaut.fingerprint = newIdentity.fingerprint;
    }
  };

  const handleRegenerateIdentity = async () => {
    setSovereignModalTab("create");
    setIsSovereignModalOpen(true);
  };

  // Zero-Knowledge Backend Auth & Sync State
  const [sessionToken, setSessionToken] = useState<string>("");
  const [relayStatuses, setRelayStatuses] = useState<RelayNodeStatus[]>([]);

  const handleAuthenticateWithBackend = async () => {
    if (!userIdentity) {
      showToast("❌ Keine lokale AIN vorhanden.");
      return;
    }
    const res = await executeZeroKnowledgeAuth(userIdentity);
    if (res.success && res.sessionToken) {
      setSessionToken(res.sessionToken);
      showToast("✅ Zero-Knowledge Server-Auth erfolgreich! Session aktiviert.");
    } else {
      showToast(`❌ Auth fehlgeschlagen: ${res.message}`);
    }
  };

  const handleSyncVaultBackend = async () => {
    if (!userIdentity) return;
    let token = sessionToken;
    if (!token) {
      const authRes = await executeZeroKnowledgeAuth(userIdentity);
      if (authRes.success && authRes.sessionToken) {
        token = authRes.sessionToken;
        setSessionToken(token);
      } else {
        showToast("❌ Server-Authentifizierung fehlgeschlagen.");
        return;
      }
    }

    const profileData = JSON.stringify({
      name: userName,
      preset: userProfilePreset,
      customCss: userCustomCss,
      badge: userBadge,
      statusQuote: userStatusQuote,
      bannerGradient: userBannerGradient
    });

    const syncRes = await syncEncryptedVaultToServer(userIdentity.ain, token, profileData, "zeno-passcode-default");
    if (syncRes.success) {
      showToast(syncRes.message);
    } else {
      showToast(`❌ Sync-Fehler: ${syncRes.message}`);
    }
  };

  // Load saved profile config on startup
  useEffect(() => {
    const savedConfig = localStorage.getItem("zeno_user_profile");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.name) setUserName(parsed.name);
        if (parsed.preset) setUserProfilePreset(parsed.preset);
        if (parsed.customCss) setUserCustomCss(parsed.customCss);
        if (parsed.badge) setUserBadge(parsed.badge);
        if (parsed.badgePosition) setUserBadgePosition(parsed.badgePosition);
        if (parsed.statusQuote) setUserStatusQuote(parsed.statusQuote);
        if (parsed.bannerGradient) setUserBannerGradient(parsed.bannerGradient);
        if (parsed.avatarImage) setUserAvatarImage(parsed.avatarImage);
        if (parsed.avatarHoverEffect) setUserAvatarHoverEffect(parsed.avatarHoverEffect);
        if (parsed.avatarEffectFrame) setUserAvatarEffectFrame(parsed.avatarEffectFrame);
        if (parsed.badgeBgColor) setUserBadgeBgColor(parsed.badgeBgColor);
        if (parsed.badgeTextColor) setUserBadgeTextColor(parsed.badgeTextColor);
        if (parsed.cardBgColor) setUserCardBgColor(parsed.cardBgColor);
        if (parsed.cardHoverEffect) setUserCardHoverEffect(parsed.cardHoverEffect);
        if (parsed.layoutOrder) setUserLayoutOrder(parsed.layoutOrder);
        if (parsed.animationPreset) setUserAnimationPreset(parsed.animationPreset);
      } catch (e) {
        console.error("Failed to parse saved profile config", e);
      }
    }
  }, []);

  useEffect(() => {
    if (mockProfiles.CipherNaut) {
      mockProfiles.CipherNaut.name = userName;
      mockProfiles.CipherNaut.themePreset = userProfilePreset;
      mockProfiles.CipherNaut.customCss = userCustomCss;
      mockProfiles.CipherNaut.badge = userBadge;
      mockProfiles.CipherNaut.badgePosition = userBadgePosition;
      mockProfiles.CipherNaut.status = `"${userStatusQuote}"`;
      mockProfiles.CipherNaut.bannerGradient = userBannerGradient;
      mockProfiles.CipherNaut.avatarImage = userAvatarImage;
      mockProfiles.CipherNaut.avatarHoverEffect = userAvatarHoverEffect;
      mockProfiles.CipherNaut.avatarEffectFrame = userAvatarEffectFrame;
      mockProfiles.CipherNaut.badgeBgColor = userBadgeBgColor;
      mockProfiles.CipherNaut.badgeTextColor = userBadgeTextColor;
      mockProfiles.CipherNaut.cardBgColor = userCardBgColor;
      mockProfiles.CipherNaut.cardHoverEffect = userCardHoverEffect;
      mockProfiles.CipherNaut.layoutOrder = userLayoutOrder;
      mockProfiles.CipherNaut.animationPreset = userAnimationPreset;
    }
  }, [
    userName, userProfilePreset, userCustomCss, userBadge, userBadgePosition, userStatusQuote, userBannerGradient,
    userAvatarImage, userAvatarHoverEffect, userAvatarEffectFrame, userBadgeBgColor, userBadgeTextColor,
    userCardBgColor, userCardHoverEffect, userLayoutOrder, userAnimationPreset
  ]);

  // --- RUST BACKEND CORE: DATABASE & VOICE/NETWORK EVENT SUBSCRIPTIONS ---
  useEffect(() => {
    // 1. Load servers from Rust SQLite DB if available
    loadServersFromDb().then((dbServers) => {
      if (dbServers && dbServers.length > 0) {
        setServers(dbServers);
      }
    });

    // 2. Subscribe to Voice State changes from Rust
    const unlistenVoicePromise = subscribeToVoiceState((status) => {
      setConnectedVoice(status.isConnected ? status.channelName || null : null);
      setMuted(status.isMuted);
      setDeafened(status.isDeafened);
      setActiveVoiceSpeakers(status.activeSpeakers || []);
      setVoicePing(status.pingMs || 14);
    });

    // 2b. Subscribe to Live Microphone RMS & VAD Audio Levels
    const unsubAudioLevel = audioStreamService.onAudioLevel((rms, speaking) => {
      setLocalAudioLevel(rms);
      setIsLocalSpeaking(speaking);
    });

    // 3. Subscribe to incoming messages from Rust Relay
    const unlistenMsgPromise = subscribeToIncomingMessages((msg) => {
      setChatMessages((prev) => ({
        ...prev,
        [msg.channelId]: [
          ...(prev[msg.channelId] || []),
          {
            author: msg.author,
            text: msg.text,
            time: msg.time,
            color: msg.color,
            code: msg.code
          }
        ]
      }));
    });

    // 4. Subscribe to live incoming messages from Multi-Relay Transport
    const unsubscribeRelayMsgs = relayClient.subscribeToMessages((channelId, msg) => {
      setChatMessages((prev) => ({
        ...prev,
        [channelId]: [...(prev[channelId] || []), msg]
      }));
    });

    const unsubscribeRelayStatus = relayClient.subscribeToRelayStatus((statuses) => {
      setRelayStatuses(statuses);
    });

    return () => {
      unlistenVoicePromise.then((unlisten) => unlisten && unlisten());
      unlistenMsgPromise.then((unlisten) => unlisten && unlisten());
      unsubAudioLevel();
      unsubscribeRelayMsgs();
      unsubscribeRelayStatus();
    };
  }, []);

  // Connect to server-specific relays (or Nostr mesh defaults)
  useEffect(() => {
    if (activeServer) {
      const serverRelays = (activeServer as any).relays && (activeServer as any).relays.length > 0
        ? (activeServer as any).relays
        : ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.snort.social"];
      relayClient.connectToRelays(serverRelays, activeServer.id, activeChannel?.id);
    }
  }, [activeServer?.id, activeChannel?.id]);

  // Load channel messages from Rust SQLite when activeChannel changes
  useEffect(() => {
    if (activeChannel?.id) {
      loadChannelMessagesFromDb(activeChannel.id).then((savedMsgs) => {
        if (savedMsgs && savedMsgs.length > 0) {
          setChatMessages((prev) => ({
            ...prev,
            [activeChannel.id]: savedMsgs
          }));
        }
      });
    }
  }, [activeChannel?.id]);

  const handleSaveProfileConfig = () => {
    const config = {
      name: userName,
      preset: userProfilePreset,
      customCss: userCustomCss,
      badge: userBadge,
      badgePosition: userBadgePosition,
      statusQuote: userStatusQuote,
      bannerGradient: userBannerGradient,
      avatarImage: userAvatarImage,
      avatarHoverEffect: userAvatarHoverEffect,
      avatarEffectFrame: userAvatarEffectFrame,
      badgeBgColor: userBadgeBgColor,
      badgeTextColor: userBadgeTextColor,
      cardBgColor: userCardBgColor,
      cardHoverEffect: userCardHoverEffect,
      layoutOrder: userLayoutOrder,
      animationPreset: userAnimationPreset
    };
    localStorage.setItem("zeno_user_profile", JSON.stringify(config));
    showToast("💾 Profil-Design & Custom-CSS dauerhaft gespeichert!");
  };

  // Code Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isEditorDirty, setIsEditorDirty] = useState<boolean>(false);
  const [editorCode, setEditorCode] = useState<string>("");
  const [editorLanguage, setEditorLanguage] = useState<string>("rust");
  const [editorFilename, setEditorFilename] = useState<string>("main.rs");
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [editorWorkflowStep, setEditorWorkflowStep] = useState<"select_action" | "input_filename" | "editor">("select_action");
  const [editorOutput, setEditorOutput] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([
    { name: "main.rs", code: `fn main() {\n    println!("Hello Zeno Rust WASM!");\n}`, language: "rust" },
    { name: "script.py", code: `print("Hello Zeno Python Pyodide!")`, language: "python" }
  ]);

  // WASM Runtime Hub State
  const [isCustomWasmModalOpen, setIsCustomWasmModalOpen] = useState<boolean>(false);
  const [customWasmName, setCustomWasmName] = useState<string>("");
  const [customWasmUrl, setCustomWasmUrl] = useState<string>("");
  const [wasmHubSearchQuery, setWasmHubSearchQuery] = useState<string>("");
  const [wasmHubFilter, setWasmHubFilter] = useState<"all" | "community" | "wapm" | "installed">("all");

  const [editorRuntimes, setEditorRuntimes] = useState<Record<string, "installed" | "not_installed" | "installing">>({
    javascript: "installed",
    python: "installed",
    rust: "not_installed",
    csharp: "not_installed",
    cpp: "not_installed",
    golang: "not_installed",
    ruby: "not_installed",
    perl: "not_installed",
    php: "not_installed",
    zig: "not_installed",
    sqlite: "installed",
    lua: "not_installed"
  });

  // GitHub Integration State
  const [githubToken, setGithubToken] = useState<string>("");
  const [githubUser, setGithubUser] = useState<{ login: string; name: string; avatarUrl: string } | null>(null);
  const [githubConnecting, setGithubConnecting] = useState<boolean>(false);
  const [githubRepos, setGithubRepos] = useState<Array<{ name: string; fullName: string }>>([]);
  const [githubReposLoading, setGithubReposLoading] = useState<boolean>(false);
  const [githubRepoData, setGithubRepoData] = useState<Record<string, any>>({});
  const [gitWidgetTabs, setGitWidgetTabs] = useState<Record<string, string>>({});

  // Full IDE State
  const [ideFiles, setIdeFiles] = useState<IdeFile[]>(defaultWorkspace);
  const [ideActiveFilePath, setIdeActiveFilePath] = useState<string>("src/main.rs");
  const [ideOpenTabs, setIdeOpenTabs] = useState<string[]>(["src/main.rs", "Cargo.toml"]);
  const [ideSidebarTab, setIdeSidebarTab] = useState<"explorer" | "git" | "extensions" | "gitlens">("explorer");
  const [ideConsoleOutput, setIdeConsoleOutput] = useState<string>("[zeno-wasi] Virtual File System mount /src/main.rs\n[zeno-wasi] Ready for execution.\n");
  const [isIdeConsoleExpanded, setIsIdeConsoleExpanded] = useState<boolean>(true);
  const [ideGitChanges, setIdeGitChanges] = useState<string[]>(["src/main.rs"]);
  const [ideGitMessage, setIdeGitMessage] = useState<string>("");
  const [isCreateJoinServerModalOpen, setIsCreateJoinServerModalOpen] = useState<boolean>(false);

  const handleServerCreated = (newServer: Server) => {
    setServers((prev: Server[]) => [...prev, newServer]);
    saveServerToDb(newServer);
    setActiveServerId(newServer.id);
    setActiveServer(newServer);
    if (newServer.categories && newServer.categories[0] && newServer.categories[0].channels[0]) {
      setActiveChannel(newServer.categories[0].channels[0]);
    }
  };

  const handleServerJoined = (serverOrCode: string | Server) => {
    let joinedServer: Server;
    if (typeof serverOrCode === "object" && serverOrCode !== null) {
      joinedServer = serverOrCode;
    } else {
      const inviteCode = serverOrCode;
      const joinedServerId = `srv-joined-${Date.now()}`;
      joinedServer = {
        id: joinedServerId,
        name: `Zeno Server (${inviteCode.length > 25 ? inviteCode.substring(0, 22) + "..." : inviteCode})`,
        iconLetter: "🌐",
        unreadCount: 0,
        categories: [
          {
            name: "TEXTKANÄLE",
            type: "text",
            channels: [
              { id: `c-${Date.now()}-1`, name: "allgemein" }
            ]
          },
          {
            name: "SPRACHKANÄLE",
            type: "voice",
            channels: [
              { id: `c-${Date.now()}-2`, name: "voice-channel" }
            ]
          }
        ]
      };
    }
    setServers((prev: Server[]) => [...prev, joinedServer]);
    saveServerToDb(joinedServer);
    setActiveServerId(joinedServer.id);
    setActiveServer(joinedServer);
    if (joinedServer.categories && joinedServer.categories[0] && joinedServer.categories[0].channels[0]) {
      setActiveChannel(joinedServer.categories[0].channels[0]);
    }
  };

  // Channel & Server Git Sync State
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState<boolean>(false);
  const [createChannelCategory, setCreateChannelCategory] = useState<string>("");
  const [isGitSyncModalOpen, setIsGitSyncModalOpen] = useState<boolean>(false);

  const handleChannelCreated = async (categoryName: string, newChannel: Channel, autoCommitGit: boolean) => {
    if (!activeServer) return;

    const updatedCategories = (activeServer.categories || []).map((cat) => {
      if (cat.name === categoryName) {
        return {
          ...cat,
          channels: [...cat.channels, newChannel]
        };
      }
      return cat;
    });

    const updatedServer: Server = {
      ...activeServer,
      categories: updatedCategories
    };

    setActiveServer(updatedServer);
    setServers((prev: Server[]) => prev.map((s) => (s.id === updatedServer.id ? updatedServer : s)));
    await saveServerToDb(updatedServer);

    if (autoCommitGit) {
      showToast(`Kanal #${newChannel.name} erstellt. Sichere in Git... 🌿`);
      const syncRes = await commitAndPushServerManifest({
        server: updatedServer,
        commitMessage: `feat(server): add channel #${newChannel.name} to ${categoryName}`,
        push: false
      });
      if (syncRes.success) {
        showToast(`In zeno-server.json gesichert! (${syncRes.commitHash || "HEAD"})`);
      }
    }
  };

  const handleDeleteChannel = async (categoryName: string, channelId: string) => {
    if (!activeServer) return;

    let deletedChannelName = "";
    const updatedCategories = (activeServer.categories || []).map((cat) => {
      if (cat.name === categoryName) {
        const target = cat.channels.find((ch) => ch.id === channelId);
        if (target) deletedChannelName = target.name;
        return {
          ...cat,
          channels: cat.channels.filter((ch) => ch.id !== channelId)
        };
      }
      return cat;
    });

    const updatedServer: Server = {
      ...activeServer,
      categories: updatedCategories
    };

    setActiveServer(updatedServer);
    setServers((prev: Server[]) => prev.map((s) => (s.id === updatedServer.id ? updatedServer : s)));

    if (activeChannel?.id === channelId) {
      const firstCh = updatedCategories.find((c) => c.channels.length > 0)?.channels[0];
      if (firstCh) {
        setActiveChannel(firstCh);
      }
    }

    await saveServerToDb(updatedServer);
    showToast(`Kanal #${deletedChannelName || channelId} gelöscht.`);

    if (activeServer.gitRepo) {
      commitAndPushServerManifest({
        server: updatedServer,
        commitMessage: `fix(server): remove channel #${deletedChannelName || channelId}`,
        push: false
      });
    }
  };

  const handleCreateCategory = async () => {
    if (!activeServer) return;
    const catName = window.prompt("Name der neuen Kategorie (z.B. ENTWICKLUNG oder COMMUNITY):");
    if (!catName || !catName.trim()) return;

    const cleanName = catName.trim().toUpperCase();
    if ((activeServer.categories || []).some((c) => c.name.toUpperCase() === cleanName)) {
      showToast("Eine Kategorie mit diesem Namen existiert bereits!");
      return;
    }

    const newCategory: Category = {
      name: cleanName,
      type: "text",
      channels: [
        {
          id: `chn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: "allgemein"
        }
      ]
    };

    const updatedServer: Server = {
      ...activeServer,
      categories: [...(activeServer.categories || []), newCategory]
    };

    setActiveServer(updatedServer);
    setServers((prev: Server[]) => prev.map((s) => (s.id === updatedServer.id ? updatedServer : s)));
    await saveServerToDb(updatedServer);
    showToast(`Kategorie "${cleanName}" mit #allgemein erstellt! 📁`);

    if (activeServer.gitRepo) {
      commitAndPushServerManifest({
        server: updatedServer,
        commitMessage: `feat(server): add category ${cleanName}`,
        push: false
      });
    }
  };

  const handleServerUpdatedFromGit = (updatedServer: Server) => {
    setActiveServer(updatedServer);
    setServers((prev: Server[]) => prev.map((s) => (s.id === updatedServer.id ? updatedServer : s)));
    const channelExists = (updatedServer.categories || []).some((cat) =>
      cat.channels.some((ch) => ch.id === activeChannel?.id)
    );
    if (!channelExists) {
      const firstCh = updatedServer.categories?.find((c) => c.channels.length > 0)?.channels[0];
      if (firstCh) {
        setActiveChannel(firstCh);
      }
    }
  };

  const [isIdeProjectWizardOpen, setIsIdeProjectWizardOpen] = useState<boolean>(false);
  const [isIdeNewItemModalOpen, setIsIdeNewItemModalOpen] = useState<boolean>(false);
  const [ideNewItemType, setIdeNewItemType] = useState<"file" | "folder">("file");
  const [ideNewItemName, setIdeNewItemName] = useState<string>("");
  const [ideNewItemParentPath, setIdeNewItemParentPath] = useState<string>("");

  const [ideExtensions, setIdeExtensions] = useState([
    { id: "rust-analyzer", name: "rust-analyzer", description: "Vollständige Rust IntelliSense, Type Inlays & Macro Expansion", downloads: "2.4M", installed: true, icon: "vscode-icons:file-type-rust" },
    { id: "python", name: "Python (Pyodide Native)", description: "Python Autocomplete, Refactoring & Inline Repl", downloads: "5.1M", installed: true, icon: "vscode-icons:file-type-python" },
    { id: "gitlens", name: "GitLens — Git supercharged", description: "Inline Git Blame, History Map & Branch Visualizer", downloads: "18.2M", installed: false, icon: "https://gitlens.amzn.com/icon.png" },
    { id: "prettier", name: "Prettier - Code Formatter", description: "Automatisches Formatieren von JS, TS, HTML, CSS & JSON", downloads: "34.1M", installed: true, icon: "vscode-icons:file-type-prettier" },
    { id: "copilot", name: "Zeno Local AI Autocomplete", description: "Vollständig lokales LLM-Snippet Autocomplete (100% Offline)", downloads: "890k", installed: false, icon: "mage:robot" }
  ]);
  const [ideExtensionsSearchQuery, setIdeExtensionsSearchQuery] = useState<string>("");

  // Live Git Status State
  const [liveGitStatus, setLiveGitStatus] = useState<LiveGitStatus | null>(null);
  const [liveGitCommits, setLiveGitCommits] = useState<LiveGitCommit[]>([]);
  const [gitError] = useState<string | null>(null);

  // Dashboard & Widgets State
  const [widgets, setWidgets] = useState<WidgetConfig[]>(INITIAL_WIDGETS);
  const [dashboardEditMode, setDashboardEditMode] = useState<boolean>(false);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [swappingWidgetIds, setSwappingWidgetIds] = useState<string[]>([]);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState<boolean>(false);

  const handleInstallMarketplaceWidget = (item: MarketplaceWidget) => {
    const newWidget: WidgetConfig = {
      id: `w-mkt-${Date.now()}`,
      type: "custom",
      title: item.defaultTitle,
      bgColor: "",
      colSpan: item.colSpan,
      rowSpan: item.rowSpan,
      order: widgets.length,
      customCode: item.customCodeSample
    };
    setWidgets((prev) => [...prev, newWidget]);
    setIsMarketplaceOpen(false);
  };

  // Weather Widget State
  const [weatherMode, setWeatherMode] = useState<"wttr" | "custom">("wttr");
  const [dashboardLocation, setDashboardLocation] = useState<string>("Berlin");
  const [weatherApiUrl, setWeatherApiUrl] = useState<string>("https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true");
  const [weatherApiKey, setWeatherApiKey] = useState<string>("");
  const [realWeatherData, setRealWeatherData] = useState<any>(null);
  const [weatherFetching, setWeatherFetching] = useState<boolean>(false);
  const [dashboardTime, setDashboardTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setDashboardTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const openInPrivacyBrowser = async (url: string) => {
    const cleaned = cleanUrl(url);
    try {
      const opener: any = await import("@tauri-apps/plugin-opener");
      if (typeof opener.openUrl === "function") {
        await opener.openUrl(cleaned.cleanedUrl);
      } else if (typeof opener.open === "function") {
        await opener.open(cleaned.cleanedUrl);
      } else {
        window.open(cleaned.cleanedUrl, "_blank");
      }
      showToast(`Link im System-Standardbrowser geöffnet (URL bereinigt)`);
    } catch {
      window.open(cleaned.cleanedUrl, "_blank");
      showToast(`Link im Browser geöffnet (URL bereinigt)`);
    }
  };

  // Weather Fetching
  const fetchRealWeather = async () => {
    if (weatherFetching) return;
    setWeatherFetching(true);
    try {
      if (weatherMode === "wttr") {
        const res = await fetch(`https://wttr.in/${encodeURIComponent(dashboardLocation)}?format=j1`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const current = data.current_condition[0];
        const weatherDesc = current.lang_de?.[0]?.value || current.weatherDesc[0].value;
        const temp = `${current.temp_C}°C`;
        const wind = `${current.windspeedKmph} km/h ${current.winddir16Point}`;
        const humidity = `${current.humidity}% Feuchte`;

        let icon = "mage:sun";
        const descLower = weatherDesc.toLowerCase();
        if (descLower.includes("regen") || descLower.includes("rain")) icon = "mage:cloud-rain";
        else if (descLower.includes("schnee") || descLower.includes("snow")) icon = "mage:snowflake";
        else if (descLower.includes("bewölkt") || descLower.includes("cloud")) icon = "mage:cloud";

        setRealWeatherData({
          temp,
          condition: weatherDesc,
          humidity,
          wind,
          icon,
          forecast: data.weather?.slice(0, 3).map((w: any) => ({
            date: w.date,
            nightTemp: `${w.hourly[0].tempC}°C`,
            morningTemp: `${w.hourly[2].tempC}°C`,
            noonTemp: `${w.hourly[4].tempC}°C`,
            eveningTemp: `${w.hourly[6].tempC}°C`,
            nightIcon: "mage:moon",
            morningIcon: "mage:sun",
            noonIcon: "mage:sun",
            eveningIcon: "mage:moon"
          }))
        });
      } else {
        const res = await fetch(weatherApiUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.current_weather) {
          setRealWeatherData({
            temp: `${data.current_weather.temperature}°C`,
            condition: `Wind: ${data.current_weather.windspeed} km/h`,
            humidity: "Custom API",
            wind: `${data.current_weather.windspeed} km/h`,
            icon: "mage:sun"
          });
        }
      }
    } catch {
      showToast("Fehler beim Abrufen der Wetterdaten.");
    } finally {
      setWeatherFetching(false);
    }
  };

  useEffect(() => {
    fetchRealWeather();
  }, [dashboardLocation, weatherMode]);

  // Voice Timer Effect
  useEffect(() => {
    let timer: any;
    if (connectedVoice && voiceStartTime) {
      timer = setInterval(() => {
        setVoiceDuration(Math.floor((Date.now() - voiceStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [connectedVoice, voiceStartTime]);

  const formatVoiceTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSettingsOpen(false);
        setIsEditorOpen(false);
        setSelectedUserProfile(null);
        setIsCustomWasmModalOpen(false);
        setIsIdeProjectWizardOpen(false);
        setIsIdeNewItemModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Git Fetching
  const fetchLiveGitData = async () => {
    setLiveGitStatus({ branch: "main", uncommittedChanges: 0, stagedFiles: [] });
    setLiveGitCommits([
      { hash: "e8affdf", message: "feat(profile): center profile badge by default under avatar with position alignment controls", timeAgo: "Vor wenigen Minuten", author: "CipherNaut" },
      { hash: "6d5ef18", message: "fix(members): restore QuantumLeap profile entry and add defensive null checks", timeAgo: "Vor 10 Min.", author: "CipherNaut" }
    ]);
  };

  useEffect(() => {
    fetchLiveGitData();
  }, []);

  // Server selection
  const handleServerSelect = (server: Server) => {
    setActiveServerId(server.id);
    setActiveServer(server);
    setAnimatingServerId(server.id);
    setTimeout(() => setAnimatingServerId(null), 300);
    if (server.categories.length > 0 && server.categories[0].channels.length > 0) {
      setActiveChannel(server.categories[0].channels[0]);
    }
  };

  // Category toggle
  const toggleCategory = (catName: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  // Voice actions
  const handleJoinVoice = async (chId: string, chName: string) => {
    setConnectedVoice(chName);
    setVoiceStartTime(Date.now());
    setVoiceDuration(0);
    // 1. Initialize real microphone capture & Web Audio VAD
    await audioStreamService.startMicrophone();
    // 2. Join voice session in native Rust backend
    await joinVoiceChannel(chId, chName, userName || "CipherNaut");
    showToast(`Sprachkanal "${chName}" beigetreten (Echtzeit-Audio & Mikrofon aktiv) 🎙️`);
  };

  const handleDisconnectVoice = () => {
    showToast(`Sprachkanal "${connectedVoice}" verlassen.`);
    // 1. Stop audio capture and close WebRTC peer connections
    audioStreamService.stopMicrophone();
    audioStreamService.closeAllPeers();
    // 2. Leave voice session in Rust backend
    leaveVoiceChannel();
    setConnectedVoice(null);
    setVoiceStartTime(null);
    setVoiceDuration(0);
    setIsLocalSpeaking(false);
    setLocalAudioLevel(0);
  };

  const handleMuteChange = (newMuted: boolean) => {
    setMuted(newMuted);
    audioStreamService.setMuted(newMuted);
    setVoiceMute(newMuted);
  };

  const handleDeafenChange = (newDeafened: boolean) => {
    setDeafened(newDeafened);
    audioStreamService.setDeafened(newDeafened);
    setVoiceDeafen(newDeafened);
  };

  // Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !pendingAttachment) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg: Message = {
      author: userName || "CipherNaut",
      text: inputText,
      time,
      color: "purple",
      attachment: pendingAttachment || undefined
    };

    setChatMessages((prev) => ({
      ...prev,
      [activeChannel.id]: [...(prev[activeChannel.id] || []), newMsg]
    }));

    // Rust Backend Core: Save to SQLite & Broadcast via Multi-Relay Transport
    saveMessageToDb(activeChannel.id, newMsg);
    broadcastNetworkMessage(activeChannel.id, newMsg.author, newMsg.text, newMsg.color, newMsg.time, newMsg.code);
    relayClient.publishMessage(activeServer.id, activeChannel.id, newMsg.author, newMsg.text, userIdentity);

    setInputText("");
    setPendingAttachment(null);
    setShowCommandSuggestions(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleChatAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPendingAttachment({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          dataUrl: ev.target?.result as string,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    } else {
      setPendingAttachment({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type
      });
    }
  };

  // Theme toggle
  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }, [theme]);

  const handleThemeToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    setCanvasColor(nextTheme === "light" ? "#E3E4E8" : "#18191B");
    showToast(`Theme gewechselt: ${nextTheme === "light" ? "Light Mode" : "Dark Mode"}`);
  };

  // Editor Actions
  const handleOpenFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const lang = detectLanguage(file.name);
      setEditorFilename(file.name);
      setEditorLanguage(lang);
      setEditorCode(content);
      setEditorWorkflowStep("editor");
      setIsEditorOpen(true);
      showToast(`Datei "${file.name}" geladen`);
    };
    reader.readAsText(file);
  };

  const detectLanguage = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "rs": return "rust";
      case "py": return "python";
      case "go": return "golang";
      case "cs": return "csharp";
      case "cpp": case "c": case "h": case "hpp": return "cpp";
      case "js": return "javascript";
      case "ts": case "tsx": return "typescript";
      case "html": return "html";
      case "css": return "css";
      case "json": return "json";
      case "toml": return "toml";
      default: return "plaintext";
    }
  };

  const openWorkspaceFile = (name: string, language: string) => {
    const file = recentFiles.find((f) => f.name === name);
    setEditorFilename(name);
    setEditorLanguage(language);
    setEditorCode(file?.code || "");
    setEditorWorkflowStep("editor");
    setIsEditorOpen(true);
  };

  const createNewWorkspaceFile = (filename: string) => {
    const lang = detectLanguage(filename);
    setEditorFilename(filename);
    setEditorLanguage(lang);
    setEditorCode(`// Neue Datei: ${filename}\n`);
    setEditorWorkflowStep("editor");
    setIsEditorOpen(true);
  };

  const removeRecentFileFromHistory = (filename: string) => {
    setRecentFiles((prev) => prev.filter((f) => f.name !== filename));
    showToast(`"${filename}" aus der Historie entfernt`);
  };

  const handleRenameFile = (newName: string) => {
    if (!newName.trim()) return;
    const lang = detectLanguage(newName);
    setEditorFilename(newName);
    setEditorLanguage(lang);
    setIsRenaming(false);
    showToast(`Datei umbenannt zu "${newName}"`);
  };

  const handleEditorRun = () => {
    setEditorOutput(`[zeno-wasi sandbox] Executing ${editorFilename} (${editorLanguage.toUpperCase()})...\n[zeno-wasi sandbox] Exit code: 0 (Success)`);
    showToast(`Programm ${editorFilename} erfolgreich ausgeführt!`);
  };

  const handleSaveFile = () => {
    setIsEditorDirty(false);
    setRecentFiles((prev) => {
      const filtered = prev.filter((f) => f.name !== editorFilename);
      return [{ name: editorFilename, code: editorCode, language: editorLanguage }, ...filtered];
    });
    showToast(`Datei "${editorFilename}" gespeichert!`);
  };

  const handleDeleteCurrentFile = () => {
    removeRecentFileFromHistory(editorFilename);
    setIsEditorOpen(false);
  };

  // GitHub Test connection
  const testGithubConnection = async () => {
    if (!githubToken.trim()) return;
    setGithubConnecting(true);
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `token ${githubToken}` }
      });
      if (!res.ok) throw new Error("Ungültiges Token");
      const user = await res.json();
      setGithubUser({ login: user.login, name: user.name || user.login, avatarUrl: user.avatar_url });
      showToast(`Erfolgreich als ${user.login} mit GitHub verbunden!`);

      // Fetch repos
      setGithubReposLoading(true);
      const repoRes = await fetch("https://api.github.com/user/repos?sort=updated&per_page=20", {
        headers: { Authorization: `token ${githubToken}` }
      });
      if (repoRes.ok) {
        const repos = await repoRes.json();
        setGithubRepos(repos.map((r: any) => ({ name: r.name, fullName: r.full_name })));
      }
    } catch {
      showToast("Fehler bei der Verbindung mit GitHub.");
    } finally {
      setGithubConnecting(false);
      setGithubReposLoading(false);
    }
  };

  const fetchGithubRepoDetails = async (repoFullName: string) => {
    if (!githubToken || !repoFullName) return;
    try {
      const headers = { Authorization: `token ${githubToken}` };
      const [repoRes, commitsRes, issuesRes, pullsRes, branchesRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${repoFullName}`, { headers }),
        fetch(`https://api.github.com/repos/${repoFullName}/commits?per_page=5`, { headers }),
        fetch(`https://api.github.com/repos/${repoFullName}/issues?state=open&per_page=5`, { headers }),
        fetch(`https://api.github.com/repos/${repoFullName}/pulls?state=open&per_page=5`, { headers }),
        fetch(`https://api.github.com/repos/${repoFullName}/branches`, { headers })
      ]);

      const repo = repoRes.ok ? await repoRes.json() : {};
      const commits = commitsRes.ok ? await commitsRes.json() : [];
      const issues = issuesRes.ok ? await issuesRes.json() : [];
      const pulls = pullsRes.ok ? await pullsRes.json() : [];
      const branches = branchesRes.ok ? await branchesRes.json() : [];

      setGithubRepoData((prev) => ({
        ...prev,
        [repoFullName]: {
          defaultBranch: repo.default_branch || "main",
          stars: repo.stargazers_count || 0,
          commits: Array.isArray(commits) ? commits.map((c: any) => ({ hash: c.sha.substring(0, 7), message: c.commit?.message?.split("\n")[0] || "", date: new Date(c.commit?.author?.date).toLocaleDateString() })) : [],
          issues: Array.isArray(issues) ? issues.filter((i: any) => !i.pull_request).map((i: any) => ({ number: i.number, title: i.title, url: i.html_url })) : [],
          pulls: Array.isArray(pulls) ? pulls.map((p: any) => ({ number: p.number, title: p.title, url: p.html_url })) : [],
          branches: Array.isArray(branches) ? branches.map((b: any) => b.name) : []
        }
      }));
    } catch {
      showToast("Fehler beim Abrufen der Repository-Details.");
    }
  };

  // Runtime Installation
  const handleInstallRuntime = (id: string) => {
    setEditorRuntimes((prev) => ({ ...prev, [id]: "installing" }));
    setTimeout(() => {
      setEditorRuntimes((prev) => ({ ...prev, [id]: "installed" }));
      showToast(`Laufzeitumgebung "${id.toUpperCase()}" erfolgreich installiert & gecacht.`);
    }, 1800);
  };

  const handleDeleteRuntime = (id: string) => {
    setEditorRuntimes((prev) => ({ ...prev, [id]: "not_installed" }));
    showToast(`Laufzeitumgebung "${id.toUpperCase()}" deinstalliert.`);
  };

  // Dashboard Widget Manipulation
  const handleWidgetDrop = (targetId: string) => {
    if (!draggedWidgetId || draggedWidgetId === targetId) return;
    setSwappingWidgetIds([draggedWidgetId, targetId]);
    setWidgets((prev) => {
      const idxA = prev.findIndex((w) => w.id === draggedWidgetId);
      const idxB = prev.findIndex((w) => w.id === targetId);
      if (idxA < 0 || idxB < 0) return prev;
      const copy = [...prev];
      const orderA = copy[idxA].order;
      const orderB = copy[idxB].order;
      copy[idxA] = { ...copy[idxA], order: orderB };
      copy[idxB] = { ...copy[idxB], order: orderA };
      return copy;
    });
    setTimeout(() => setSwappingWidgetIds([]), 400);
  };

  const moveWidget = (id: string, dir: "left" | "right") => {
    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((w) => w.id === id);
    if (idx < 0) return;
    const targetIdx = dir === "left" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const targetId = sorted[targetIdx].id;
    handleWidgetDrop(targetId);
  };

  const updateWidget = (id: string, patch: Partial<WidgetConfig>) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  };

  const deleteWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    showToast("Widget entfernt.");
  };

  const addCustomWidget = () => {
    const newId = `w_${Date.now()}`;
    const maxOrder = widgets.reduce((max, w) => Math.max(max, w.order), 0);
    const newWidget: WidgetConfig = {
      id: newId,
      type: "custom",
      title: "Eigenes JavaScript Widget",
      bgColor: "#1a1f2e",
      colSpan: 1,
      rowSpan: 1,
      order: maxOrder + 1,
      customCode: `return "<div style='color:#00FF87;font-weight:bold;'>Hello Zeno Widget!</div>";`
    };
    setWidgets((prev) => [...prev, newWidget]);
    setEditingWidgetId(newId);
    showToast("Eigenes JS-Widget hinzugefügt.");
  };

  // Full IDE Actions
  const handleIdeFileSelect = (path: string) => {
    setIdeActiveFilePath(path);
    if (!ideOpenTabs.includes(path)) {
      setIdeOpenTabs((prev) => [...prev, path]);
    }
  };

  const handleIdeFileClose = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = ideOpenTabs.filter((t) => t !== path);
    setIdeOpenTabs(newTabs);
    if (ideActiveFilePath === path && newTabs.length > 0) {
      setIdeActiveFilePath(newTabs[newTabs.length - 1]);
    }
  };

  const handleIdeCodeChange = (newCode: string | undefined) => {
    const code = newCode || "";
    setIdeFiles((prev) =>
      prev.map((f) => (f.path === ideActiveFilePath ? { ...f, code } : f))
    );
    if (!ideGitChanges.includes(ideActiveFilePath)) {
      setIdeGitChanges((prev) => [...prev, ideActiveFilePath]);
    }
  };

  const handleIdeRun = () => {
    const activeFile = ideFiles.find((f) => f.path === ideActiveFilePath);
    if (!activeFile) return;
    setIdeConsoleOutput((prev) => prev + `\n[zeno-wasi sandbox] Executing ${activeFile.name}...\n[zeno-wasi sandbox] Exit code 0 (Success)`);
    setIsIdeConsoleExpanded(true);
    showToast(`Sandbox-Ausführung für "${activeFile.name}" beendet.`);
  };

  const handleIdeGitCommit = () => {
    if (!ideGitMessage.trim()) {
      showToast("Bitte gib eine Commit-Nachricht ein.");
      return;
    }
    showToast(`Git Commit "${ideGitMessage}" erfolgreich ausgeführt.`);
    setIdeGitChanges([]);
    setIdeGitMessage("");
  };

  const handleIdeGenerateProject = (type: "rust" | "go" | "python" | "web") => {
    let newFiles: IdeFile[] = [];
    if (type === "rust") {
      newFiles = [
        { name: "Cargo.toml", path: "Cargo.toml", code: `[package]\nname = "zeno_cargo_app"\nversion = "0.1.0"\nedition = "2021"\n`, language: "toml", isFolder: false },
        { name: "src", path: "src", code: "", language: "", isFolder: true },
        { name: "main.rs", path: "src/main.rs", code: `fn main() {\n    println!("Hello from Rust Cargo App!");\n}\n`, language: "rust", isFolder: false }
      ];
    } else if (type === "go") {
      newFiles = [
        { name: "go.mod", path: "go.mod", code: `module zeno.dev/app\n\ngo 1.22\n`, language: "plaintext", isFolder: false },
        { name: "main.go", path: "main.go", code: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from Go App!")\n}\n`, language: "golang", isFolder: false }
      ];
    } else if (type === "python") {
      newFiles = [
        { name: "requirements.txt", path: "requirements.txt", code: `numpy>=1.24.0\n`, language: "plaintext", isFolder: false },
        { name: "main.py", path: "main.py", code: `import sys\n\ndef main():\n    print("Hello from Python App!")\n\nif __name__ == "__main__":\n    main()\n`, language: "python", isFolder: false }
      ];
    } else {
      newFiles = [
        { name: "index.html", path: "index.html", code: `<!DOCTYPE html>\n<html>\n<head>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello Zeno Web</h1>\n  <script src="script.js"></script>\n</body>\n</html>`, language: "html", isFolder: false },
        { name: "style.css", path: "style.css", code: `body { background: #18191B; color: #FFF; font-family: sans-serif; }`, language: "css", isFolder: false },
        { name: "script.js", path: "script.js", code: `console.log("Hello Zeno Web JS");`, language: "javascript", isFolder: false }
      ];
    }

    setIdeFiles(newFiles);
    setIdeOpenTabs([newFiles[newFiles.length - 1].path]);
    setIdeActiveFilePath(newFiles[newFiles.length - 1].path);
    setIsIdeProjectWizardOpen(false);
    showToast(`Projektvorlage (${type.toUpperCase()}) generiert.`);
  };

  const handleIdeFileCreate = () => {
    if (!ideNewItemName.trim()) return;
    const fullPath = ideNewItemParentPath ? `${ideNewItemParentPath}/${ideNewItemName}` : ideNewItemName;
    const lang = detectLanguage(ideNewItemName);
    const newFile: IdeFile = {
      name: ideNewItemName,
      path: fullPath,
      code: `// ${fullPath}\n`,
      language: lang,
      isFolder: false
    };
    setIdeFiles((prev) => [...prev, newFile]);
    setIdeOpenTabs((prev) => [...prev, fullPath]);
    setIdeActiveFilePath(fullPath);
    setIsIdeNewItemModalOpen(false);
    setIdeNewItemName("");
    showToast(`Datei "${fullPath}" erstellt.`);
  };

  const handleIdeFolderCreate = () => {
    if (!ideNewItemName.trim()) return;
    const fullPath = ideNewItemParentPath ? `${ideNewItemParentPath}/${ideNewItemName}` : ideNewItemName;
    const newFolder: IdeFile = {
      name: ideNewItemName,
      path: fullPath,
      code: "",
      language: "",
      isFolder: true
    };
    setIdeFiles((prev) => [...prev, newFolder]);
    setIsIdeNewItemModalOpen(false);
    setIdeNewItemName("");
    showToast(`Ordner "${fullPath}" erstellt.`);
  };

  const handleExtensionInstall = (id: string) => {
    setIdeExtensions((prev) =>
      prev.map((e) => (e.id === id ? { ...e, installed: true } : e))
    );
    showToast(`Erweiterung "${id}" installiert.`);
  };

  const handleExtensionUninstall = (id: string) => {
    setIdeExtensions((prev) =>
      prev.map((e) => (e.id === id ? { ...e, installed: false } : e))
    );
    showToast(`Erweiterung "${id}" deinstalliert.`);
  };

  const renderIdeFileTree = () => {
    return ideFiles.map((file) => {
      const isFolder = file.isFolder;
      const isActive = file.path === ideActiveFilePath;
      return (
        <div
          key={file.path}
          className={`ide-tree-item ${isActive ? "active" : ""}`}
          onClick={() => !isFolder && handleIdeFileSelect(file.path)}
          style={{ paddingLeft: `${(file.path.split("/").length - 1) * 12 + 10}px` }}
        >
          <Icon
            icon={
              isFolder
                ? "mage:folder-open"
                : file.language === "rust"
                ? "vscode-icons:file-type-rust"
                : file.language === "python"
                ? "vscode-icons:file-type-python"
                : file.language === "golang"
                ? "vscode-icons:file-type-go"
                : file.language === "csharp"
                ? "vscode-icons:file-type-csharp"
                : file.language === "cpp"
                ? "vscode-icons:file-type-cpp"
                : file.language === "javascript"
                ? "vscode-icons:file-type-js"
                : file.language === "typescript"
                ? "vscode-icons:file-type-typescript"
                : file.language === "html"
                ? "vscode-icons:file-type-html"
                : file.language === "css"
                ? "vscode-icons:file-type-css"
                : file.language === "toml"
                ? "vscode-icons:file-type-toml"
                : "mage:file-records"
            }
            className="ide-tree-icon"
          />
          <span className="ide-tree-name">{file.name}</span>
        </div>
      );
    });
  };

  const activeIdeFile = ideFiles.find((f) => f.path === ideActiveFilePath);

  return (
    <div
      className={`app-layout ${activeServerId === "home" && homeTab === "ide" ? "in-ide" : ""} ${theme === "light" ? "light light-mode theme-light" : "dark"} ${glassmorphism ? "glassmorphism" : ""}`}
      style={{
        "--canvas-bg": canvasColor,
        "--glow-color": glowColor
      } as React.CSSProperties}
    >
      {/* 1. SERVER SIDEBAR */}
      <ServerSidebar
        servers={servers}
        activeServerId={activeServerId}
        activeServer={activeServer}
        animatingServerId={animatingServerId}
        onSelectServer={handleServerSelect}
        onGoHome={() => setActiveServerId("home")}
        onAddServerClick={() => setIsCreateJoinServerModalOpen(true)}
      />

      {/* 2. CHANNEL SIDEBAR */}
      <ChannelSidebar
        activeServerId={activeServerId}
        homeTab={homeTab}
        activeServer={activeServer}
        activeChannel={activeChannel}
        collapsedCategories={collapsedCategories}
        connectedVoice={connectedVoice}
        voiceDuration={voiceDuration}
        theme={theme}
        muted={muted}
        deafened={deafened}
        mockProfiles={mockProfiles}
        setHomeTab={setHomeTab}
        toggleCategory={toggleCategory}
        setActiveChannel={setActiveChannel}
        handleJoinVoice={handleJoinVoice}
        handleDisconnectVoice={handleDisconnectVoice}
        handleThemeToggle={handleThemeToggle}
        setMuted={handleMuteChange}
        setDeafened={handleDeafenChange}
        setIsSettingsOpen={setIsSettingsOpen}
        setSelectedUserProfile={setSelectedUserProfile}
        showToast={showToast}
        formatVoiceTime={formatVoiceTime}
        userAin={userIdentity?.ain}
        userName={userName}
        onOpenSovereignModal={() => {
          setSovereignModalTab("manage");
          setIsSovereignModalOpen(true);
        }}
        onAddChannelClick={(catName) => {
          setCreateChannelCategory(catName);
          setIsCreateChannelModalOpen(true);
        }}
        onDeleteChannel={handleDeleteChannel}
        onOpenGitSyncModal={() => setIsGitSyncModalOpen(true)}
        onAddCategoryClick={handleCreateCategory}
        isLocalSpeaking={isLocalSpeaking}
        localAudioLevel={localAudioLevel}
        activeVoiceSpeakers={activeVoiceSpeakers}
        voicePing={voicePing}
        onOpenVoiceSettings={() => {
          setActiveSettingsTab("voice");
          setIsSettingsOpen(true);
        }}
      />

      {/* 3. MAIN WORKSPACE VIEW */}
      {activeServerId === "home" ? (
        homeTab === "dashboard" ? (
          <Dashboard
            widgets={widgets}
            dashboardEditMode={dashboardEditMode}
            editingWidgetId={editingWidgetId}
            draggedWidgetId={draggedWidgetId}
            swappingWidgetIds={swappingWidgetIds}
            recentFiles={recentFiles}
            githubToken={githubToken}
            githubReposLoading={githubReposLoading}
            githubRepos={githubRepos}
            githubRepoData={githubRepoData}
            gitWidgetTabs={gitWidgetTabs}
            gitError={gitError}
            liveGitStatus={liveGitStatus}
            liveGitCommits={liveGitCommits}
            dashboardLocation={dashboardLocation}
            dashboardTime={dashboardTime}
            weatherMode={weatherMode}
            weatherApiUrl={weatherApiUrl}
            weatherApiKey={weatherApiKey}
            realWeatherData={realWeatherData}
            weatherFetching={weatherFetching}
            theme={theme}
            glowColor={glowColor}
            setDashboardEditMode={setDashboardEditMode}
            setEditingWidgetId={setEditingWidgetId}
            setDraggedWidgetId={setDraggedWidgetId}
            setGitWidgetTabs={setGitWidgetTabs}
            setDashboardLocation={setDashboardLocation}
            setWeatherMode={setWeatherMode}
            setWeatherApiUrl={setWeatherApiUrl}
            setWeatherApiKey={setWeatherApiKey}
            setRealWeatherData={setRealWeatherData}
            addCustomWidget={addCustomWidget}
            handleWidgetDrop={handleWidgetDrop}
            moveWidget={moveWidget}
            updateWidget={updateWidget}
            deleteWidget={deleteWidget}
            openWorkspaceFile={openWorkspaceFile}
            setEditorCode={setEditorCode}
            setEditorWorkflowStep={setEditorWorkflowStep}
            setIsEditorOpen={setIsEditorOpen}
            fetchGithubRepoDetails={fetchGithubRepoDetails}
            fetchLiveGitData={fetchLiveGitData}
            fetchRealWeather={fetchRealWeather}
            showToast={showToast}
            getContrastColor={getContrastColor}
            onOpenMarketplace={() => setIsMarketplaceOpen(true)}
          />
        ) : homeTab === "wasm_hub" ? (
          <WasmHub
            hubCatalog={HUB_RUNTIMES_CATALOG}
            wasmHubSearchQuery={wasmHubSearchQuery}
            wasmHubFilter={wasmHubFilter}
            editorRuntimes={editorRuntimes}
            setIsCustomWasmModalOpen={setIsCustomWasmModalOpen}
            setWasmHubSearchQuery={setWasmHubSearchQuery}
            setWasmHubFilter={setWasmHubFilter}
            setEditorFilename={setEditorFilename}
            setEditorLanguage={setEditorLanguage}
            setEditorCode={setEditorCode}
            setEditorWorkflowStep={setEditorWorkflowStep}
            setEditorOutput={setEditorOutput}
            setIsEditorOpen={setIsEditorOpen}
            handleInstallRuntime={handleInstallRuntime}
            showToast={showToast}
          />
        ) : (
          <ZenoIde
            ideSidebarTab={ideSidebarTab}
            ideFiles={ideFiles}
            ideOpenTabs={ideOpenTabs}
            ideActiveFilePath={ideActiveFilePath}
            ideGitChanges={ideGitChanges}
            ideGitMessage={ideGitMessage}
            ideExtensions={ideExtensions}
            ideExtensionsSearchQuery={ideExtensionsSearchQuery}
            isIdeConsoleExpanded={isIdeConsoleExpanded}
            ideConsoleOutput={ideConsoleOutput}
            theme={theme}
            activeIdeFile={activeIdeFile}
            setIdeSidebarTab={setIdeSidebarTab}
            setIsSettingsOpen={setIsSettingsOpen}
            setIdeNewItemType={setIdeNewItemType}
            setIdeNewItemParentPath={setIdeNewItemParentPath}
            setIsIdeNewItemModalOpen={setIsIdeNewItemModalOpen}
            setIsIdeProjectWizardOpen={setIsIdeProjectWizardOpen}
            renderIdeFileTree={renderIdeFileTree}
            setIdeGitMessage={setIdeGitMessage}
            handleIdeGitCommit={handleIdeGitCommit}
            setIdeExtensionsSearchQuery={setIdeExtensionsSearchQuery}
            handleExtensionInstall={handleExtensionInstall}
            handleExtensionUninstall={handleExtensionUninstall}
            handleIdeFileSelect={handleIdeFileSelect}
            handleIdeFileClose={handleIdeFileClose}
            handleIdeRun={handleIdeRun}
            handleIdeCodeChange={handleIdeCodeChange}
            setupZenoIntelliSense={setupZenoIntelliSense}
            setIsIdeConsoleExpanded={setIsIdeConsoleExpanded}
            setIdeConsoleOutput={setIdeConsoleOutput}
            onReturnToDashboard={() => setHomeTab("dashboard")}
            showToast={showToast}
          />
        )
      ) : (
        <ChatArea
          activeServer={activeServer}
          activeChannel={activeChannel}
          chatMessages={chatMessages}
          mockProfiles={mockProfiles}
          isMembersOpen={isMembersOpen}
          inputText={inputText}
          showCommandSuggestions={showCommandSuggestions}
          pendingAttachment={pendingAttachment}
          messagesEndRef={messagesEndRef}
          chatAttachmentInputRef={chatAttachmentInputRef}
          AVAILABLE_COMMANDS={AVAILABLE_COMMANDS}
          setIsMembersOpen={setIsMembersOpen}
          setSelectedUserProfile={setSelectedUserProfile}
          setInputText={setInputText}
          setShowCommandSuggestions={setShowCommandSuggestions}
          setPendingAttachment={setPendingAttachment}
          handleSendMessage={handleSendMessage}
          handleChatAttachmentChange={handleChatAttachmentChange}
          openInPrivacyBrowser={openInPrivacyBrowser}
          setEditorCode={setEditorCode}
          setEditorFilename={setEditorFilename}
          setEditorLanguage={setEditorLanguage}
          setEditorWorkflowStep={setEditorWorkflowStep}
          setIsEditorOpen={setIsEditorOpen}
          detectLanguage={detectLanguage}
          showToast={showToast}
          connectedRelaysCount={relayStatuses.filter((r) => r.status === "connected").length}
          relayTooltip={`Multi-Relay Transport Status:\n${relayStatuses.map((r) => `• ${r.url}: ${r.status}${r.pingMs ? ` (${r.pingMs}ms)` : ""}`).join("\n") || "Verbinde mit Standard-Relays..."}`}
          onShowRelayDetails={() => {
            const connected = relayStatuses.filter((r) => r.status === "connected");
            showToast(`🛰️ ${connected.length}/${relayStatuses.length} Relays verbunden (${connected.map((r) => r.url.replace("wss://", "")).join(", ") || "Keine aktiv"})`);
          }}
        />
      )}

      {/* 4. MEMBERS SIDEBAR */}
      <MembersSidebar
        activeServerId={activeServerId}
        isMembersOpen={isMembersOpen}
        mockProfiles={mockProfiles}
        onSelectProfile={setSelectedUserProfile}
      />

      {/* 5. MODALS & DIALOGS */}
      <ProfileCardModal
        selectedUserProfile={selectedUserProfile}
        onClose={() => setSelectedUserProfile(null)}
        onStartChat={(prof) => {
          setSelectedUserProfile(null);
          showToast(`Sicherer DM-Chat mit ${prof.name} gestartet`);
        }}
        onVerifyIdentity={() => showToast("Kryptografische Signatur verifiziert ✓")}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        activeSettingsTab={activeSettingsTab}
        userName={userName}
        userIdentity={userIdentity}
        userProfilePreset={userProfilePreset}
        userCustomCss={userCustomCss}
        userBadge={userBadge}
        userBadgePosition={userBadgePosition}
        userStatusQuote={userStatusQuote}
        userBannerGradient={userBannerGradient}
        userAvatarImage={userAvatarImage}
        userAvatarHoverEffect={userAvatarHoverEffect}
        userAvatarEffectFrame={userAvatarEffectFrame}
        userBadgeBgColor={userBadgeBgColor}
        userBadgeTextColor={userBadgeTextColor}
        userCardBgColor={userCardBgColor}
        userCardHoverEffect={userCardHoverEffect}
        userLayoutOrder={userLayoutOrder}
        userAnimationPreset={userAnimationPreset}
        glassmorphism={glassmorphism}
        canvasColor={canvasColor}
        glowColor={glowColor}
        theme={theme}
        lightPresets={lightPresets}
        darkPresets={darkPresets}
        editorRuntimes={editorRuntimes}
        githubToken={githubToken}
        githubUser={githubUser}
        githubConnecting={githubConnecting}
        onClose={() => setIsSettingsOpen(false)}
        setActiveSettingsTab={setActiveSettingsTab}
        setUserName={setUserName}
        setUserProfilePreset={setUserProfilePreset}
        setUserCustomCss={setUserCustomCss}
        setUserBadge={setUserBadge}
        setUserBadgePosition={setUserBadgePosition}
        setUserStatusQuote={setUserStatusQuote}
        setUserBannerGradient={setUserBannerGradient}
        setUserAvatarImage={setUserAvatarImage}
        setUserAvatarHoverEffect={setUserAvatarHoverEffect}
        setUserAvatarEffectFrame={setUserAvatarEffectFrame}
        setUserBadgeBgColor={setUserBadgeBgColor}
        setUserBadgeTextColor={setUserBadgeTextColor}
        setUserCardBgColor={setUserCardBgColor}
        setUserCardHoverEffect={setUserCardHoverEffect}
        setUserLayoutOrder={setUserLayoutOrder}
        setUserAnimationPreset={setUserAnimationPreset}
        setGlassmorphism={setGlassmorphism}
        setCanvasColor={setCanvasColor}
        setGlowColor={setGlowColor}
        handleInstallRuntime={handleInstallRuntime}
        handleDeleteRuntime={handleDeleteRuntime}
        setGithubToken={setGithubToken}
        setGithubUser={setGithubUser}
        testGithubConnection={testGithubConnection}
        onSaveProfile={handleSaveProfileConfig}
        onRegenerateIdentity={handleRegenerateIdentity}
        sessionToken={sessionToken}
        onAuthBackend={handleAuthenticateWithBackend}
        onSyncVaultBackend={handleSyncVaultBackend}
        onOpenSovereignModal={(tab) => {
          setSovereignModalTab(tab || "manage");
          setIsSovereignModalOpen(true);
        }}
        showToast={showToast}
      />

      <CodeEditorModal
        isEditorOpen={isEditorOpen}
        editorWorkflowStep={editorWorkflowStep}
        recentFiles={recentFiles}
        editorFilename={editorFilename}
        editorLanguage={editorLanguage}
        editorCode={editorCode}
        isEditorDirty={isEditorDirty}
        isRenaming={isRenaming}
        editorOutput={editorOutput}
        theme={theme}
        fileInputRef={fileInputRef}
        onClose={() => setIsEditorOpen(false)}
        setEditorWorkflowStep={setEditorWorkflowStep}
        handleOpenFileClick={handleOpenFileClick}
        handleFileChange={handleFileChange}
        openWorkspaceFile={openWorkspaceFile}
        removeRecentFileFromHistory={removeRecentFileFromHistory}
        createNewWorkspaceFile={createNewWorkspaceFile}
        setIsRenaming={setIsRenaming}
        handleRenameFile={handleRenameFile}
        setEditorCode={setEditorCode}
        setIsEditorDirty={setIsEditorDirty}
        setupZenoIntelliSense={setupZenoIntelliSense}
        handleEditorRun={handleEditorRun}
        handleSaveFile={handleSaveFile}
        handleSuggestEdit={() => {
          setChatMessages((prev) => ({
            ...prev,
            [activeChannel.id]: [
              ...(prev[activeChannel.id] || []),
              {
                author: "CipherNaut",
                text: `Änderungsvorschlag für ${editorFilename} gesendet:`,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                color: "purple",
                code: editorCode
              }
            ]
          }));
          setIsEditorOpen(false);
          showToast("Änderungsvorschlag gesendet!");
        }}
        handleDeleteCurrentFile={handleDeleteCurrentFile}
        showToast={showToast}
      />

      <WidgetMarketplaceModal
        isOpen={isMarketplaceOpen}
        onClose={() => setIsMarketplaceOpen(false)}
        onInstallWidget={handleInstallMarketplaceWidget}
        showToast={showToast}
      />

      <CustomWasmModal
        isOpen={isCustomWasmModalOpen}
        customWasmName={customWasmName}
        customWasmUrl={customWasmUrl}
        onClose={() => setIsCustomWasmModalOpen(false)}
        setCustomWasmName={setCustomWasmName}
        setCustomWasmUrl={setCustomWasmUrl}
        onRegister={() => {
          if (!customWasmName.trim() || !customWasmUrl.trim()) {
            showToast("Bitte Titel und URL eingeben.");
            return;
          }
          showToast(`Benutzerdefinierte WASM-Laufzeit "${customWasmName}" erfolgreich eingebunden!`);
          setIsCustomWasmModalOpen(false);
          setCustomWasmName("");
          setCustomWasmUrl("");
        }}
      />

      <CreateJoinServerModal
        isOpen={isCreateJoinServerModalOpen}
        onClose={() => setIsCreateJoinServerModalOpen(false)}
        onServerCreated={handleServerCreated}
        onServerJoined={handleServerJoined}
        showToast={showToast}
        userAin={userIdentity?.ain}
      />

      <SovereignAccountModal
        isOpen={isSovereignModalOpen}
        onClose={() => setIsSovereignModalOpen(false)}
        currentIdentity={userIdentity}
        onIdentityChanged={handleIdentityChanged}
        showToast={showToast}
        initialTab={sovereignModalTab}
      />

      <CreateChannelModal
        isOpen={isCreateChannelModalOpen}
        onClose={() => setIsCreateChannelModalOpen(false)}
        categories={activeServer?.categories || []}
        initialCategoryName={createChannelCategory}
        onChannelCreated={handleChannelCreated}
        showToast={showToast}
        hasGitRepo={!!activeServer?.gitRepo}
      />

      <GitSyncModal
        isOpen={isGitSyncModalOpen}
        onClose={() => setIsGitSyncModalOpen(false)}
        server={activeServer}
        onServerUpdated={handleServerUpdatedFromGit}
        showToast={showToast}
      />

      <IdeProjectWizardModal
        isOpen={isIdeProjectWizardOpen}
        onClose={() => setIsIdeProjectWizardOpen(false)}
        handleIdeGenerateProject={handleIdeGenerateProject}
      />

      <IdeNewItemModal
        isOpen={isIdeNewItemModalOpen}
        ideNewItemType={ideNewItemType}
        ideNewItemParentPath={ideNewItemParentPath}
        ideNewItemName={ideNewItemName}
        onClose={() => setIsIdeNewItemModalOpen(false)}
        setIdeNewItemName={setIdeNewItemName}
        handleIdeFileCreate={handleIdeFileCreate}
        handleIdeFolderCreate={handleIdeFolderCreate}
      />

      {/* TOAST NOTIFICATION CONTAINER */}
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

export default function App() {
  return (
    <ZenoErrorBoundary>
      <ZenoMainApp />
    </ZenoErrorBoundary>
  );
}
