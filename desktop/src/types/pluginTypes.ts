// ============================================================================
//   ZENO OBSIDIAN-STYLE PLUGIN SYSTEM TYPES & HOST INTERFACES
//   Standard: 3-Dateien-Modell (manifest.json, main.js/plugin.wasm, styles.css)
// ============================================================================

export type PluginCategory = "transport" | "audio" | "theme" | "appearance" | "integration" | "mesh" | "utility";

export type PluginPermission = 
  | "network"        // Externe Netzwerkanfragen / Relays / Sockets
  | "audio"          // Zugriff auf Audio-Streams & Mikrofon
  | "ui"             // Einhängen in UI-Slots & Chat-Komponenten
  | "storage"        // Lokaler Key-Value-Speicher
  | "notifications"; // System-Toasts & Benachrichtigungen

export interface PluginManifest {
  id: string;               // Eindeutige ID (z.B. "matrix-transport", "voice-streamer")
  name: string;             // Anzeigename (z.B. "Matrix Federation Bridge")
  version: string;          // SemVer (z.B. "1.0.0")
  minAppVersion: string;    // Min. Zeno-Version (z.B. "0.1.0")
  description: string;      // Funktionsbeschreibung
  author: string;           // Entwicklername / GitHub-Handle
  authorUrl?: string;       // Profil-URL
  repo: string;             // GitHub-Repository (z.B. "zeno-messenger/zeno-matrix-plugin")
  license?: string;         // Lizenz (z.B. "MIT", "GPL-3.0")
  isDesktopOnly?: boolean;  // Benötigt native Desktop-Ressourcen (Rust/Tauri)
  permissions?: PluginPermission[];
  icon?: string;            // Iconify Icon-Name
  logoUrl?: string;         // Optionaler Pfad/URL zum Plugin-Logo (SVG/PNG)
  category?: PluginCategory;
}

export interface InstalledPlugin {
  manifest: PluginManifest;
  enabled: boolean;
  mainJs: string;
  stylesCss?: string;
  installedAt: string;
  hasUpdate?: boolean;
  latestVersion?: string;
  settings?: Record<string, any>;
}

export interface CommunityPluginEntry {
  id: string;
  name: string;
  author: string;
  description: string;
  repo: string;
  branch?: string;
  version: string;
  stars?: number;
  downloads?: number;
  icon: string;
  logoUrl?: string;
  category: PluginCategory;
  tags?: string[];
  permissions: PluginPermission[];
  verified?: boolean;
}

export interface ProfileThemeDefinition {
  id: string;
  name: string;
  author?: string;
  description?: string;
  previewColor?: string;
  badgeIcon?: string;
  cssClass?: string;
}

export interface PluginDockItem {
  id: string;
  pluginId: string;
  title: string;
  icon: string; // Iconify icon name or image url
  badge?: string | number;
  active?: boolean;
  onClick: () => void;
}

// --- HOST EXTENSION APIS ---

export type UISlot = 
  | "sidebar_bottom" 
  | "chat_toolbar" 
  | "settings_tab" 
  | "status_bar" 
  | "dashboard_widget";

export interface UIComponentDef {
  id: string;
  title?: string;
  render: (container: HTMLElement) => void | (() => void);
}

export interface TransportProvider {
  id: string;
  name: string;
  connect: (endpoint: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  sendMessage: (channelId: string, payload: any) => Promise<boolean>;
  onMessage: (handler: (channelId: string, payload: any) => void) => () => void;
  status: () => "connected" | "connecting" | "disconnected" | "error";
}

export interface AudioSourceProvider {
  id: string;
  name: string;
  startStream: () => Promise<MediaStream | AudioNode | void>;
  stopStream: () => Promise<void>;
  getCurrentTrack?: () => { title: string; artist?: string; coverUrl?: string } | null;
  volume?: number;
}

export interface PluginChatCommand {
  name: string;        // z.B. "/spotify", "/tor", "/matrix"
  description: string; // Beschreibung im Suggestion-Menü
  icon?: string;
  execute: (args: string, context: { channelId: string; serverId: string }) => void | Promise<void>;
}

// --- TYPISIERTE HOST PLUGIN API INSTANZ ---

export interface ZenoPluginApi {
  pluginId: string;
  manifest: PluginManifest;

  // 1. Transport-Erweiterungen (Matrix, Tor, LoRa)
  registerTransportProvider: (id: string, provider: TransportProvider) => void;
  unregisterTransportProvider: (id: string) => void;

  // 2. Audio-Quellen (Spotify Connect, Web-Radio)
  registerAudioSource: (id: string, source: AudioSourceProvider) => void;
  unregisterAudioSource: (id: string) => void;

  // 3. UI-Slots & Widgets
  registerUIComponent: (slot: UISlot, component: UIComponentDef) => void;
  unregisterUIComponent: (id: string) => void;

  // 4. Chat-Befehle (/command)
  registerCommand: (command: PluginChatCommand) => void;
  unregisterCommand: (name: string) => void;

  // 5. Event Bus
  on: (event: string, handler: (...args: any[]) => void) => () => void;
  emit: (event: string, ...args: any[]) => void;

  // 6. Isolierter Key-Value-Speicher
  storage: {
    get: <T = any>(key: string, defaultValue?: T) => Promise<T>;
    set: <T = any>(key: string, value: T) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };

  // 7. Profil- & Design-Erweiterungen
  registerProfileTheme?: (theme: ProfileThemeDefinition) => void;
  unregisterProfileTheme?: (id: string) => void;

  // 8. Serverleiste / Plugin-Dock Items
  registerDockItem?: (item: PluginDockItem) => void;
  unregisterDockItem?: (id: string) => void;

  // 9. System-Benachrichtigungen
  showNotice: (message: string, durationMs?: number) => void;
}

export interface ZenoPluginInstance {
  onload: (api: ZenoPluginApi) => void | Promise<void>;
  onunload?: () => void | Promise<void>;
  settingsComponent?: (container: HTMLElement) => void;
}
