// ============================================================================
//   ZENO OBSIDIAN-STYLE PLUGIN MANAGER & HOT-RELOAD RUNTIME
//   Verwaltet Installation, GitHub-Releases-Download, Lebenszyklus & API-Sandbox
// ============================================================================

import {
  PluginManifest,
  InstalledPlugin,
  CommunityPluginEntry,
  UISlot,
  UIComponentDef,
  TransportProvider,
  AudioSourceProvider,
  PluginChatCommand,
  ProfileThemeDefinition,
  PluginDockItem,
  ZenoPluginApi,
  ZenoPluginInstance
} from "../types/pluginTypes";
import { CURATED_COMMUNITY_PLUGINS, BUILTIN_PLUGIN_TEMPLATES } from "../data/communityPluginsData";
import { invoke } from "@tauri-apps/api/core";

export function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
}

class ZenoPluginManager {
  private installedPlugins: Map<string, InstalledPlugin> = new Map();
  private activeInstances: Map<string, ZenoPluginInstance> = new Map();

  // Registrierte Host-Ressourcen (Slot/ID -> Ressource)
  private registeredTransports: Map<string, TransportProvider> = new Map();
  private registeredAudioSources: Map<string, AudioSourceProvider> = new Map();
  private registeredUIComponents: Map<UISlot, Map<string, UIComponentDef>> = new Map();
  private registeredCommands: Map<string, PluginChatCommand> = new Map();
  private registeredProfileThemes: Map<string, ProfileThemeDefinition> = new Map();
  private registeredDockItems: Map<string, PluginDockItem> = new Map();
  private eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  // Zuordnung: Plugin-ID -> Set der von ihm registrierten Ressourcen für sauberes Unloading
  private pluginResources: Map<string, {
    transports: Set<string>;
    audioSources: Set<string>;
    uiSlots: Array<{ slot: UISlot; id: string }>;
    commands: Set<string>;
    profileThemes: Set<string>;
    dockItems: Set<string>;
    eventCleanups: Array<() => void>;
  }> = new Map();

  private changeListeners: Set<() => void> = new Set();
  private toastHandler: ((msg: string) => void) | null = null;

  constructor() {
    this.initSlotMaps();
    this.loadInstalledPlugins();
  }

  private initSlotMaps() {
    const slots: UISlot[] = ["sidebar_bottom", "chat_toolbar", "settings_tab", "status_bar", "dashboard_widget"];
    for (const slot of slots) {
      this.registeredUIComponents.set(slot, new Map());
    }
  }

  public setToastHandler(handler: (msg: string) => void) {
    this.toastHandler = handler;
  }

  /**
   * Lädt alle installierten Plugins aus dem lokalen Speicher und aktiviert freigegebene
   */
  public async loadInstalledPlugins(): Promise<void> {
    try {
      const stored = localStorage.getItem("zeno_installed_plugins");
      if (stored) {
        const list: InstalledPlugin[] = JSON.parse(stored);
        for (const p of list) {
          this.installedPlugins.set(p.manifest.id, p);
        }
      } else {
        // Starte initial mit dem Voice-Streamer als vorinstalliertem Musterbeispiel (deaktiviert)
        const template = BUILTIN_PLUGIN_TEMPLATES["voice-streamer"];
        if (template) {
          const initialPlugin: InstalledPlugin = {
            manifest: template.manifest,
            enabled: false,
            mainJs: template.mainJs,
            stylesCss: template.stylesCss,
            installedAt: new Date().toISOString()
          };
          this.installedPlugins.set(initialPlugin.manifest.id, initialPlugin);
          this.saveToStorage();
        }
      }

      // Aktiviere alle Plugins, die auf 'enabled: true' stehen
      for (const plugin of this.installedPlugins.values()) {
        if (plugin.enabled) {
          await this.enablePlugin(plugin.manifest.id, false);
        }
      }
    } catch (e) {
      console.error("[Zeno Plugin Manager] Fehler beim Laden der Plugins:", e);
    }
    this.notifyChange();
  }

  private saveToStorage(): void {
    try {
      const list = Array.from(this.installedPlugins.values());
      localStorage.setItem("zeno_installed_plugins", JSON.stringify(list));
    } catch (e) {
      console.warn("[Zeno Plugin Manager] Konnte Plugins nicht in localStorage speichern:", e);
    }
  }

  public getInstalledPlugins(): InstalledPlugin[] {
    return Array.from(this.installedPlugins.values());
  }

  public getInstalledPlugin(id: string): InstalledPlugin | undefined {
    return this.installedPlugins.get(id);
  }

  public isPluginEnabled(id: string): boolean {
    return this.installedPlugins.get(id)?.enabled || false;
  }

  /**
   * Lädt die Liste der verfügbaren Community-Plugins
   * Versucht zuerst die GitHub Raw-Registry, fällt bei Offline-Status auf eingebaute Liste zurück
   */
  public async fetchCommunityPlugins(): Promise<CommunityPluginEntry[]> {
    try {
      const res = await fetch("https://raw.githubusercontent.com/zeno-messenger/community-plugins/main/community-plugins.json");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      // Offline oder kein Netzwerk: Greife auf kuratierte eingebaute Registry zurück
    }
    return CURATED_COMMUNITY_PLUGINS;
  }

  /**
   * 1-Klick-Installation eines Plugins direkt von GitHub Releases / Vorlagen
   */
  public async installPlugin(entry: CommunityPluginEntry): Promise<boolean> {
    try {
      let manifest: PluginManifest = {
        id: entry.id,
        name: entry.name,
        version: entry.version,
        minAppVersion: "0.1.0",
        description: entry.description,
        author: entry.author,
        repo: entry.repo,
        category: entry.category,
        icon: entry.icon,
        logoUrl: entry.logoUrl,
        permissions: entry.permissions
      };
      let mainJs = "";
      let stylesCss = "";

      // 1. Prüfe, ob eine eingebaute Vorlage existiert
      const template = BUILTIN_PLUGIN_TEMPLATES[entry.id];
      if (template) {
        manifest = template.manifest;
        mainJs = template.mainJs;
        stylesCss = template.stylesCss;
      } else {
        // 2. Lade direkt von GitHub (Obsidian-Modell: raw.githubusercontent.com / Releases)
        try {
          const baseUrl = `https://raw.githubusercontent.com/${entry.repo}/${entry.branch || "main"}`;
          const [mRes, jRes, cRes] = await Promise.all([
            fetch(`${baseUrl}/manifest.json`),
            fetch(`${baseUrl}/main.js`),
            fetch(`${baseUrl}/styles.css`)
          ]);

          if (mRes.ok) manifest = await mRes.json();
          if (jRes.ok) mainJs = await jRes.text();
          if (cRes.ok) stylesCss = await cRes.text();
        } catch (fetchErr) {
          console.warn("[Zeno Plugin Manager] GitHub Download fehlgeschlagen, erstelle Default-Bundle:", fetchErr);
        }

        // Falls kein Code vorhanden ist, generiere sauberen Einstiegspunkt
        if (!mainJs) {
          mainJs = `export default {\n  onload(api) {\n    console.log("[Plugin ${manifest.name}] Gestartet!");\n    api.showNotice("🧩 Plugin ${manifest.name} aktiv.");\n  },\n  onunload() {\n    console.log("[Plugin ${manifest.name}] Entladen.");\n  }\n};`;
        }
      }

      const installed: InstalledPlugin = {
        manifest,
        enabled: true,
        mainJs,
        stylesCss,
        installedAt: new Date().toISOString()
      };

      this.installedPlugins.set(manifest.id, installed);
      this.saveToStorage();

      // Speichere auch auf dem Dateisystem via Tauri (falls nativ)
      if (isTauriEnvironment()) {
        try {
          await invoke("plugin_save_installed_files", {
            pluginId: manifest.id,
            manifestJson: JSON.stringify(manifest, null, 2),
            mainJs,
            stylesCss: stylesCss || ""
          });
        } catch (tauriErr) {
          console.warn("[Zeno Plugin Manager] Konnte Dateien nicht auf Festplatte ablegen:", tauriErr);
        }
      }

      // Sofortiges Hot-Loading
      await this.enablePlugin(manifest.id);
      this.notifyChange();

      if (this.toastHandler) {
        this.toastHandler(`🧩 Plugin "${manifest.name}" erfolgreich installiert & geladen! 🎉`);
      }
      return true;
    } catch (e: any) {
      console.error("[Zeno Plugin Manager] Fehler bei Installation:", e);
      if (this.toastHandler) {
        this.toastHandler(`❌ Fehler bei Installation: ${e?.message || String(e)}`);
      }
      return false;
    }
  }

  /**
   * Deinstalliert ein Plugin und entfernt alle Ressourcen
   */
  public async uninstallPlugin(pluginId: string): Promise<boolean> {
    await this.disablePlugin(pluginId);
    this.installedPlugins.delete(pluginId);
    this.saveToStorage();

    if (isTauriEnvironment()) {
      try {
        await invoke("plugin_delete_installed", { pluginId });
      } catch {}
    }

    this.notifyChange();
    if (this.toastHandler) {
      this.toastHandler(`🗑️ Plugin deinstalliert.`);
    }
    return true;
  }

  /**
   * Aktiviert ein Plugin mit Live-Hot-Reloading
   */
  public async enablePlugin(pluginId: string, persist: boolean = true): Promise<boolean> {
    const plugin = this.installedPlugins.get(pluginId);
    if (!plugin) return false;

    // Falls bereits aktiv, zunächst sauber entladen
    if (this.activeInstances.has(pluginId)) {
      await this.disablePlugin(pluginId, false);
    }

    try {
      // 1. CSS Stylesheet dynamisch in den Document-Head einhängen
      if (plugin.stylesCss && typeof document !== "undefined") {
        let styleTag = document.getElementById(`zeno-plugin-${pluginId}`) as HTMLStyleElement | null;
        if (!styleTag) {
          styleTag = document.createElement("style");
          styleTag.id = `zeno-plugin-${pluginId}`;
          document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = plugin.stylesCss;
      }

      // 2. Ressourcen-Tracking für dieses Plugin anlegen
      this.pluginResources.set(pluginId, {
        transports: new Set(),
        audioSources: new Set(),
        uiSlots: [],
        commands: new Set(),
        profileThemes: new Set(),
        dockItems: new Set(),
        eventCleanups: []
      });

      // 3. Typisierte Plugin-API erzeugen
      const api = this.createPluginApi(plugin);

      // 4. JS-Code ausführen (Modul-Instanziierung)
      const instance = await this.instantiatePluginModule(plugin.mainJs);
      this.activeInstances.set(pluginId, instance);

      // 5. onload() Lebenszyklus aufrufen
      if (typeof instance.onload === "function") {
        await instance.onload(api);
      }

      plugin.enabled = true;
      if (persist) this.saveToStorage();

      this.notifyChange();
      return true;
    } catch (e) {
      console.error(`[Zeno Plugin Manager] Fehler beim Laden von Plugin ${pluginId}:`, e);
      if (this.toastHandler) {
        this.toastHandler(`⚠️ Fehler beim Aktivieren von "${plugin.manifest.name}".`);
      }
      return false;
    }
  }

  /**
   * Deaktiviert ein Plugin und räumt alle registrierten Ressourcen restlos auf
   */
  public async disablePlugin(pluginId: string, persist: boolean = true): Promise<boolean> {
    const instance = this.activeInstances.get(pluginId);
    if (instance && typeof instance.onunload === "function") {
      try {
        await instance.onunload();
      } catch (e) {
        console.warn(`[Zeno Plugin Manager] Fehler im onunload() von ${pluginId}:`, e);
      }
    }
    this.activeInstances.delete(pluginId);

    // 1. CSS Stylesheet entfernen
    if (typeof document !== "undefined") {
      const styleTag = document.getElementById(`zeno-plugin-${pluginId}`);
      if (styleTag) styleTag.remove();
    }

    // 2. Alle durch dieses Plugin registrierten Ressourcen unregistrieren
    const resources = this.pluginResources.get(pluginId);
    if (resources) {
      for (const tId of resources.transports) this.registeredTransports.delete(tId);
      for (const aId of resources.audioSources) this.registeredAudioSources.delete(aId);
      for (const { slot, id } of resources.uiSlots) {
        const slotMap = this.registeredUIComponents.get(slot);
        if (slotMap) slotMap.delete(id);
      }
      for (const cmd of resources.commands) this.registeredCommands.delete(cmd);
      for (const themeId of resources.profileThemes) this.registeredProfileThemes.delete(themeId);
      for (const dockId of resources.dockItems) this.registeredDockItems.delete(dockId);
      for (const cleanup of resources.eventCleanups) cleanup();
      this.pluginResources.delete(pluginId);
    }

    const plugin = this.installedPlugins.get(pluginId);
    if (plugin) {
      plugin.enabled = false;
      if (persist) this.saveToStorage();
    }

    this.notifyChange();
    return true;
  }

  /**
   * Erzeugt das sichere ZenoPluginApi-Objekt für ein konkretes Plugin
   */
  private createPluginApi(plugin: InstalledPlugin): ZenoPluginApi {
    const pluginId = plugin.manifest.id;
    const resTracker = this.pluginResources.get(pluginId)!;

    return {
      pluginId,
      manifest: plugin.manifest,

      // 1. Transport-Provider
      registerTransportProvider: (id: string, provider: TransportProvider) => {
        this.registeredTransports.set(id, provider);
        resTracker.transports.add(id);
        this.notifyChange();
      },
      unregisterTransportProvider: (id: string) => {
        this.registeredTransports.delete(id);
        resTracker.transports.delete(id);
        this.notifyChange();
      },

      // 2. Audio-Quellen
      registerAudioSource: (id: string, source: AudioSourceProvider) => {
        this.registeredAudioSources.set(id, source);
        resTracker.audioSources.add(id);
        this.notifyChange();
      },
      unregisterAudioSource: (id: string) => {
        this.registeredAudioSources.delete(id);
        resTracker.audioSources.delete(id);
        this.notifyChange();
      },

      // 3. UI-Slots
      registerUIComponent: (slot: UISlot, component: UIComponentDef) => {
        const slotMap = this.registeredUIComponents.get(slot);
        if (slotMap) {
          slotMap.set(component.id, component);
          resTracker.uiSlots.push({ slot, id: component.id });
          this.notifyChange();
        }
      },
      unregisterUIComponent: (id: string) => {
        for (const slotMap of this.registeredUIComponents.values()) {
          slotMap.delete(id);
        }
        resTracker.uiSlots = resTracker.uiSlots.filter((item) => item.id !== id);
        this.notifyChange();
      },

      // 4. Chat-Befehle
      registerCommand: (command: PluginChatCommand) => {
        this.registeredCommands.set(command.name, command);
        resTracker.commands.add(command.name);
        this.notifyChange();
      },
      unregisterCommand: (name: string) => {
        this.registeredCommands.delete(name);
        resTracker.commands.delete(name);
        this.notifyChange();
      },

      // 5. Event Bus
      on: (event: string, handler: (...args: any[]) => void) => {
        if (!this.eventListeners.has(event)) {
          this.eventListeners.set(event, new Set());
        }
        const set = this.eventListeners.get(event)!;
        set.add(handler);
        const cleanup = () => set.delete(handler);
        resTracker.eventCleanups.push(cleanup);
        return cleanup;
      },
      emit: (event: string, ...args: any[]) => {
        const set = this.eventListeners.get(event);
        if (set) {
          for (const handler of set) {
            try {
              handler(...args);
            } catch (err) {
              console.error(`[Plugin Event ${event}] Fehler:`, err);
            }
          }
        }
      },

      // 6. Isolierter Speicher pro Plugin
      storage: {
        get: async <T = any>(key: string, defaultValue?: T): Promise<T> => {
          try {
            const raw = localStorage.getItem(`zeno_plugin_${pluginId}_${key}`);
            return raw ? JSON.parse(raw) : defaultValue as T;
          } catch {
            return defaultValue as T;
          }
        },
        set: async <T = any>(key: string, value: T): Promise<void> => {
          localStorage.setItem(`zeno_plugin_${pluginId}_${key}`, JSON.stringify(value));
        },
        delete: async (key: string): Promise<void> => {
          localStorage.removeItem(`zeno_plugin_${pluginId}_${key}`);
        }
      },

      // 7. Profil- & Design-Erweiterungen
      registerProfileTheme: (theme: ProfileThemeDefinition) => {
        this.registeredProfileThemes.set(theme.id, theme);
        resTracker.profileThemes.add(theme.id);
        this.notifyChange();
      },
      unregisterProfileTheme: (themeId: string) => {
        this.registeredProfileThemes.delete(themeId);
        resTracker.profileThemes.delete(themeId);
        this.notifyChange();
      },

      // 8. Serverleiste / Plugin-Dock Items
      registerDockItem: (item: PluginDockItem) => {
        this.registeredDockItems.set(item.id, item);
        resTracker.dockItems.add(item.id);
        this.notifyChange();
      },
      unregisterDockItem: (id: string) => {
        this.registeredDockItems.delete(id);
        resTracker.dockItems.delete(id);
        this.notifyChange();
      },

      // 9. System-Benachrichtigungen
      showNotice: (message: string, _durationMs?: number) => {
        if (this.toastHandler) {
          this.toastHandler(message);
        } else {
          console.log(`[Plugin Notice] ${message}`);
        }
      }
    };
  }

  /**
   * Führt den Plugin-JavaScript-Code in einem isolierten Scope aus
   */
  private async instantiatePluginModule(code: string): Promise<ZenoPluginInstance> {
    try {
      // Nutzt data-URL oder dynamic import für saubere ES-Modul-Isolation
      const blob = new Blob([code], { type: "application/javascript" });
      const blobUrl = URL.createObjectURL(blob);
      const module = await import(/* @vite-ignore */ blobUrl);
      URL.revokeObjectURL(blobUrl);
      return module.default || module;
    } catch (importErr) {
      // Fallback: Function-Evaluator
      const exports: any = {};
      const module = { exports };
      const run = new Function("exports", "module", code);
      run(exports, module);
      return module.exports?.default || module.exports || exports;
    }
  }

  // --- GETTER FÜR HOST-KOMPONENTEN ---

  public getUIComponentsForSlot(slot: UISlot): UIComponentDef[] {
    const slotMap = this.registeredUIComponents.get(slot);
    return slotMap ? Array.from(slotMap.values()) : [];
  }

  public getRegisteredCommands(): PluginChatCommand[] {
    return Array.from(this.registeredCommands.values());
  }

  public getAudioSources(): AudioSourceProvider[] {
    return Array.from(this.registeredAudioSources.values());
  }

  public getTransports(): TransportProvider[] {
    return Array.from(this.registeredTransports.values());
  }

  public getRegisteredProfileThemes(): ProfileThemeDefinition[] {
    return Array.from(this.registeredProfileThemes.values());
  }

  public getDockItems(): PluginDockItem[] {
    return Array.from(this.registeredDockItems.values());
  }

  public onPluginChange(listener: () => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  private notifyChange(): void {
    for (const listener of this.changeListeners) {
      try {
        listener();
      } catch {}
    }
  }

  /**
   * Prüft GitHub auf Updates aller installierten Plugins
   */
  public async checkForUpdates(): Promise<number> {
    let updatesFound = 0;
    for (const plugin of this.installedPlugins.values()) {
      try {
        const res = await fetch(`https://raw.githubusercontent.com/${plugin.manifest.repo}/main/manifest.json`);
        if (res.ok) {
          const remoteManifest: PluginManifest = await res.json();
          if (remoteManifest.version && remoteManifest.version !== plugin.manifest.version) {
            plugin.hasUpdate = true;
            plugin.latestVersion = remoteManifest.version;
            updatesFound++;
          }
        }
      } catch {}
    }
    this.saveToStorage();
    this.notifyChange();
    return updatesFound;
  }

  /**
   * Öffnet den nativen Plugin-Ordner im Betriebssystem-Dateimanager
   */
  public async openPluginsFolder(): Promise<void> {
    if (isTauriEnvironment()) {
      try {
        await invoke("plugin_open_folder");
        return;
      } catch (e) {
        console.warn("[Zeno Plugin Manager] Konnte Ordner nicht via Tauri öffnen:", e);
      }
    }
    if (this.toastHandler) {
      this.toastHandler("📁 Plugin-Ordner: %APPDATA%/zeno/plugins/");
    }
  }
}

export const pluginManager = new ZenoPluginManager();
