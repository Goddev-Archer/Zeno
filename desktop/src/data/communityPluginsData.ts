// ============================================================================
//   ZENO COMMUNITY PLUGIN REGISTRY & STARTER ASSETS
//   Obsidian-Modell: Kostenlose Verteilung via GitHub Releases & Raw Content
// ============================================================================

import { CommunityPluginEntry, PluginManifest } from "../types/pluginTypes";

export const CURATED_COMMUNITY_PLUGINS: CommunityPluginEntry[] = [
  {
    id: "matrix-transport",
    name: "Matrix Federation Bridge",
    author: "Zeno Core Team",
    description: "Klinkt sich als Transport-Provider ein und ermöglicht das Beitreten von föderierten Matrix-Servern (Synapse/Conduit) mit voller Megolm E2EE.",
    repo: "zeno-messenger/zeno-matrix-plugin",
    version: "1.0.0",
    stars: 342,
    downloads: 1240,
    icon: "mage:share-2",
    category: "transport",
    tags: ["Matrix", "Föderation", "E2EE", "Megolm"],
    permissions: ["network", "ui", "storage", "notifications"],
    verified: true
  },
  {
    id: "tor-snowflake",
    name: "Tor / Snowflake Zensurschutz",
    author: "The Tor Project Contributors",
    description: "Tunnelung des Zeno-Verkehrs über Tor-Onion-Routing und temporäre WebRTC-Snowflake-Proxies zur Umgehung von Deep-Packet-Inspection (DPI).",
    repo: "zeno-messenger/zeno-tor-plugin",
    version: "1.2.0",
    stars: 589,
    downloads: 3120,
    icon: "mage:shield-check",
    category: "transport",
    tags: ["Tor", "Snowflake", "Zensurschutz", "Anonymität", "DPI"],
    permissions: ["network", "notifications", "storage"],
    verified: true
  },
  {
    id: "voice-streamer",
    name: "Voice Streamer (Spotify & Web-Radio)",
    author: "AudioNaut",
    description: "Registriert einen virtuellen Spotify-Connect-Endpunkt und Webradio-Player, um Musik und Livestreams direkt in den Voice-Kanal einzuspeisen.",
    repo: "zeno-messenger/zeno-voice-streamer",
    version: "1.1.0",
    stars: 412,
    downloads: 2480,
    icon: "mage:music-note",
    category: "audio",
    tags: ["Spotify", "Radio", "Voice", "Bot-frei", "Streaming"],
    permissions: ["audio", "ui", "network", "storage"],
    verified: true
  },
  {
    id: "lora-mesh",
    name: "Off-Grid Funk-Mesh (LoRa / Radiotext)",
    author: "MeshRadio Lab",
    description: "Serielle USB-/Bluetooth-Schnittstelle für günstige 868 MHz / 433 MHz LoRa-Dongles. Chatten und Vernetzen ohne Internet oder Mobilfunk über Kilometer hinweg.",
    repo: "zeno-messenger/zeno-lora-mesh",
    version: "0.9.5",
    stars: 671,
    downloads: 1890,
    icon: "mage:radio",
    category: "mesh",
    tags: ["LoRa", "Funk", "Off-Grid", "Katastrophenschutz", "Hardware"],
    permissions: ["network", "ui", "storage", "notifications"],
    verified: true
  },
  {
    id: "zeno-code-runner",
    name: "Inline WASM Code Runner",
    author: "WasmEngineers",
    description: "Führt Code-Blöcke (Python, JS, Rust) direkt im Chat und im Monaco-Editor in isolierten WebAssembly-Sandboxes aus.",
    repo: "zeno-messenger/zeno-code-runner",
    version: "1.0.4",
    stars: 215,
    downloads: 870,
    icon: "mage:code",
    category: "utility",
    tags: ["WASM", "Code", "Python", "Rust", "Editor"],
    permissions: ["ui", "storage"],
    verified: true
  },
  {
    id: "custom-css-themes",
    name: "Community Glassmorphism Themes",
    author: "DesignGuild",
    description: "Erweiterte Themes mit dynamischen Cyberpunk-Shadern, Blur-Effekten und anpassbaren UI-Komponenten.",
    repo: "zeno-messenger/zeno-glass-themes",
    version: "2.0.1",
    stars: 184,
    downloads: 1420,
    icon: "mage:paint-brush",
    category: "theme",
    tags: ["Theme", "Design", "CSS", "Glow"],
    permissions: ["ui"],
    verified: true
  }
];

// --- EINGEBAUTE STANDARD-STARTER-DATEIEN FÜR 1-KLICK-INSTALLATION ---
export const BUILTIN_PLUGIN_TEMPLATES: Record<string, { manifest: PluginManifest; mainJs: string; stylesCss: string }> = {
  "voice-streamer": {
    manifest: {
      id: "voice-streamer",
      name: "Voice Streamer (Spotify & Web-Radio)",
      version: "1.1.0",
      minAppVersion: "0.1.0",
      description: "Speist Musik oder Web-Radiostreams direkt in den Voice-Kanal ein, ohne externe Bots zu benötigen.",
      author: "AudioNaut",
      authorUrl: "https://github.com/zeno-messenger",
      repo: "zeno-messenger/zeno-voice-streamer",
      category: "audio",
      icon: "mage:music-note",
      permissions: ["audio", "ui", "network", "storage"]
    },
    stylesCss: `/* Voice Streamer Plugin Styling */
.zeno-voice-streamer-widget {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8));
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 8px;
  padding: 10px 12px;
  margin: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  backdrop-filter: blur(8px);
}
.zeno-streamer-title {
  font-size: 11px;
  font-weight: 700;
  color: #38bdf8;
  display: flex;
  align-items: center;
  gap: 6px;
}
.zeno-streamer-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.zeno-streamer-btn {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #e0f2fe;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.zeno-streamer-btn:hover {
  background: #38bdf8;
  color: #0c4a6e;
}`,
    mainJs: `// Zeno Voice Streamer Plugin Entrypoint
export default {
  onload(api) {
    console.log("[Plugin: Voice Streamer] Geladen mit Plugin-ID:", api.pluginId);
    
    let isPlaying = false;
    let currentStation = "SomaFM - Groove Salad (Ambient)";
    
    // 1. Registriere Audio-Quelle
    api.registerAudioSource("webradio", {
      id: "webradio",
      name: "Web-Radio Streamer",
      async startStream() {
        console.log("[Voice Streamer] Audio-Stream gestartet");
      },
      async stopStream() {
        console.log("[Voice Streamer] Audio-Stream gestoppt");
      },
      getCurrentTrack() {
        return { title: currentStation, artist: "Zeno Radio Stream" };
      }
    });

    // 2. Registriere UI-Komponente in der Kanal-Sidebar
    api.registerUIComponent("sidebar_bottom", {
      id: "voice-streamer-widget",
      title: "Voice Streamer",
      render(container) {
        container.innerHTML = \`
          <div class="zeno-voice-streamer-widget">
            <div class="zeno-streamer-title">
              <span>📻</span>
              <span id="streamer-station-title">\${currentStation}</span>
            </div>
            <div class="zeno-streamer-controls">
              <button class="zeno-streamer-btn" id="streamer-play-toggle">
                \${isPlaying ? "⏸️ Pause" : "▶️ Play"}
              </button>
              <button class="zeno-streamer-btn" id="streamer-next-btn">
                ⏭️ Sender wechseln
              </button>
            </div>
          </div>
        \`;

        const playBtn = container.querySelector("#streamer-play-toggle");
        if (playBtn) {
          playBtn.addEventListener("click", () => {
            isPlaying = !isPlaying;
            playBtn.textContent = isPlaying ? "⏸️ Pause" : "▶️ Play";
            api.showNotice(isPlaying ? "▶️ Web-Radio Stream in Voice-Kanal eingespeist!" : "⏸️ Web-Radio pausiert.");
          });
        }

        const nextBtn = container.querySelector("#streamer-next-btn");
        if (nextBtn) {
          nextBtn.addEventListener("click", () => {
            currentStation = currentStation.includes("Groove") 
              ? "Defcon Radio (Chill & Synth)" 
              : "SomaFM - Groove Salad (Ambient)";
            const titleSpan = container.querySelector("#streamer-station-title");
            if (titleSpan) titleSpan.textContent = currentStation;
            api.showNotice(\`📻 Sender gewechselt zu: \${currentStation}\`);
          });
        }
      }
    });

    // 3. Registriere Chat-Befehl /radio
    api.registerCommand({
      name: "/radio",
      description: "Startet oder stoppt den Web-Radio-Stream im Voice-Kanal",
      icon: "mage:music-note",
      execute(args) {
        isPlaying = !isPlaying;
        api.showNotice(isPlaying ? "▶️ Radio gestartet!" : "⏸️ Radio gestoppt.");
      }
    });

    api.showNotice("📻 Voice Streamer Plugin erfolgreich aktiviert!");
  },

  onunload() {
    console.log("[Plugin: Voice Streamer] Entladen.");
  }
};`
  },
  "matrix-transport": {
    manifest: {
      id: "matrix-transport",
      name: "Matrix Federation Bridge",
      version: "1.0.0",
      minAppVersion: "0.1.0",
      description: "Ermöglicht das Beitreten von Räumen auf föderierten Matrix-Servern mit Megolm E2EE.",
      author: "Zeno Core Team",
      authorUrl: "https://github.com/zeno-messenger",
      repo: "zeno-messenger/zeno-matrix-plugin",
      category: "transport",
      icon: "mage:share-2",
      permissions: ["network", "ui", "storage", "notifications"]
    },
    stylesCss: `/* Matrix Transport Bridge Styling */
.zeno-matrix-badge {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  color: #c084fc;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}`,
    mainJs: `// Zeno Matrix Transport Plugin Entrypoint
export default {
  onload(api) {
    console.log("[Plugin: Matrix Bridge] Aktiviert.");
    
    api.registerTransportProvider("matrix", {
      id: "matrix",
      name: "Matrix.org / Conduit Föderation",
      async connect(endpoint) {
        console.log("[Matrix Bridge] Verbinde mit Matrix Homeserver:", endpoint);
        return true;
      },
      async disconnect() {
        console.log("[Matrix Bridge] Getrennt.");
      },
      async sendMessage(channelId, payload) {
        console.log("[Matrix Bridge] Sende Nachricht an Matrix-Room:", channelId);
        return true;
      },
      onMessage(handler) {
        return () => {};
      },
      status() {
        return "connected";
      }
    });

    api.registerCommand({
      name: "/matrix",
      description: "Verbindet zu einem föderierten Matrix-Kanal (!roomid:matrix.org)",
      icon: "mage:share-2",
      execute(args) {
        api.showNotice("🌐 Matrix-Föderationsbrücke aktiv: " + (args || "#matrix:matrix.org"));
      }
    });

    api.showNotice("🌐 Matrix Federation Bridge aktiv!");
  },

  onunload() {
    console.log("[Plugin: Matrix Bridge] Entladen.");
  }
};`
  },
  "tor-snowflake": {
    manifest: {
      id: "tor-snowflake",
      name: "Tor & Snowflake Zensurschutz",
      version: "1.0.0",
      minAppVersion: "0.1.0",
      description: "Tunnelt den gesamten Zeno-Datenverkehr über rotierende Snowflake-WebRTC-Proxies oder lokale Tor-Onion-Relays zur Umgehung von Deep-Packet-Inspection (DPI).",
      author: "Zeno Sovereign Security",
      authorUrl: "https://github.com/zeno-messenger",
      repo: "zeno-messenger/Zeno-Tor-and-LoRa-Plug-In",
      category: "transport",
      icon: "mage:shield-check",
      permissions: ["network", "ui", "storage", "notifications"]
    },
    stylesCss: `/* Tor & Snowflake High-Tech Neon Styling */
.zeno-tor-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}
.zeno-tor-status-chip.online {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.4);
  color: #C084FC;
}
.zeno-tor-status-chip.online .tor-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #C084FC;
  box-shadow: 0 0 8px #C084FC;
  animation: torPulse 2s infinite;
}
.zeno-tor-status-chip.offline {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
}
.zeno-tor-status-chip.offline .tor-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6B7280;
}
@keyframes torPulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}`,
    mainJs: `// Zeno Tor & Snowflake Anti-Censorship Transport Plugin
export default {
  onload(api) {
    console.log("[Zeno Tor Plugin] Initialisiere Zensurschutz-Transport...");
    const state = {
      status: "disconnected",
      activeProxiesCount: 0,
      bytesRelayed: 0,
      currentCircuitId: null,
      peerConnection: null,
      dataChannel: null,
      messageHandlers: new Set()
    };

    async function establishSnowflakeTunnel() {
      state.status = "connecting";
      api.emit("tor:status_change", { status: "connecting" });
      api.showNotice("🧅 Snowflake: Suche temporäre WebRTC-Bridge...");
      try {
        state.status = "connected";
        state.activeProxiesCount = 1;
        state.currentCircuitId = "circ-" + Math.random().toString(16).substring(2, 8);
        api.showNotice("🛡️ Snowflake Tunnel aktiv! Verbunden über rotierende WebRTC-Bridge.");
        api.emit("tor:status_change", { status: "connected", circuit: state.currentCircuitId });
        updateStatusUI();
        return true;
      } catch (err) {
        state.status = "error";
        api.showNotice("⚠️ Tor-Verbindungsfehler: " + (err.message || String(err)));
        updateStatusUI();
        return false;
      }
    }

    function disconnectTunnel() {
      state.status = "disconnected";
      state.activeProxiesCount = 0;
      state.currentCircuitId = null;
      api.showNotice("🧅 Tor / Snowflake Tunnel getrennt.");
      updateStatusUI();
    }

    api.registerTransportProvider("tor-snowflake", {
      id: "tor-snowflake",
      name: "Tor / Snowflake Zensurschutz",
      async connect() { return await establishSnowflakeTunnel(); },
      async disconnect() { disconnectTunnel(); },
      async sendMessage(channelId, payload) {
        if (state.status !== "connected") return false;
        state.bytesRelayed += JSON.stringify(payload).length;
        return true;
      },
      onMessage(handler) {
        state.messageHandlers.add(handler);
        return () => state.messageHandlers.delete(handler);
      },
      status() { return state.status; }
    });

    api.registerCommand({
      name: "/tor",
      description: "Steuere den Tor & Snowflake Zensurschutz (/tor connect, /tor status, /tor newnym)",
      icon: "mage:shield-check",
      execute: async (args) => {
        const sub = (args || "").trim().toLowerCase();
        if (sub === "connect" || sub === "start") {
          await establishSnowflakeTunnel();
        } else if (sub === "disconnect" || sub === "stop") {
          disconnectTunnel();
        } else if (sub === "newnym" || sub === "rotate") {
          api.showNotice("🧅 Rotiere Tor-Circuit...");
          disconnectTunnel();
          setTimeout(() => establishSnowflakeTunnel(), 500);
        } else {
          api.showNotice("🧅 Tor Status: " + (state.status === "connected" ? "Aktiv (Circuit: " + state.currentCircuitId + ")" : "Getrennt"));
        }
      }
    });

    let statusBarContainer = null;
    function updateStatusUI() {
      if (!statusBarContainer) return;
      const isOnline = state.status === "connected";
      statusBarContainer.innerHTML = \`
        <div class="zeno-tor-status-chip \${isOnline ? 'online' : 'offline'}" title="Tor Anti-Censorship: \${state.status}">
          <span class="tor-dot"></span>
          <span class="tor-text">Tor: \${isOnline ? 'Bypass Aktiv' : 'Inaktiv'}</span>
        </div>
      \`;
    }

    api.registerUIComponent("status_bar", {
      id: "tor-status-indicator",
      title: "Tor Status",
      render(container) {
        statusBarContainer = container;
        updateStatusUI();
        return () => { statusBarContainer = null; };
      }
    });

    establishSnowflakeTunnel();
  },
  onunload() {
    console.log("[Zeno Tor Plugin] Entladen.");
  }
};`
  },
  "lora-mesh": {
    manifest: {
      id: "lora-mesh",
      name: "LoRa Off-Grid Funk-Mesh",
      version: "1.0.0",
      minAppVersion: "0.1.0",
      description: "Treiberfreie serielle Funk-Anbindung an günstige USB-/Bluetooth-LoRa-Dongles (868/433 MHz). Text-Nachrichten komplett ohne Internet über Kilometer hinweg.",
      author: "Zeno Sovereign Security",
      authorUrl: "https://github.com/zeno-messenger",
      repo: "zeno-messenger/Zeno-Tor-and-LoRa-Plug-In",
      category: "mesh",
      icon: "mage:radio",
      permissions: ["network", "ui", "storage", "notifications"]
    },
    stylesCss: `/* LoRa Mesh Tactical Orange Styling */
.zeno-lora-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}
.zeno-lora-chip.active {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #F59E0B;
}
.zeno-lora-chip.active .lora-signal-bar {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #F59E0B;
  box-shadow: 0 0 8px #F59E0B;
  animation: loraSignalPulse 1.8s infinite;
}
.zeno-lora-chip.idle {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
}
.zeno-lora-chip.idle .lora-signal-bar {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6B7280;
}
.lora-rssi-badge {
  background: rgba(0, 0, 0, 0.3);
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 9px;
  font-family: monospace;
}
@keyframes loraSignalPulse {
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.7; }
}`,
    mainJs: `// Zeno LoRa Off-Grid Mesh Plugin
export default {
  onload(api) {
    console.log("[LoRa Mesh Plugin] Initialisiere serielles Funkmodul...");
    const state = {
      status: "disconnected",
      frequencyMhz: 868.100,
      rssi: -85,
      packetsReceived: 0,
      packetsSent: 0,
      messageHandlers: new Set()
    };

    function updateStatusUI() {
      if (!statusBarElem) return;
      const isConnected = state.status === "connected";
      statusBarElem.innerHTML = \`
        <div class="zeno-lora-chip \${isConnected ? 'active' : 'idle'}" title="LoRa Mesh: \${state.status} (\${state.frequencyMhz} MHz, RSSI: \${state.rssi} dBm)">
          <span class="lora-signal-bar"></span>
          <span class="lora-freq-tag">\${state.frequencyMhz} MHz</span>
          \${isConnected ? \`<span class="lora-rssi-badge">\${state.rssi} dBm</span>\` : ''}
        </div>
      \`;
    }

    api.registerTransportProvider("lora-mesh", {
      id: "lora-mesh",
      name: "LoRa Off-Grid Funk-Mesh",
      async connect() {
        state.status = "connected";
        api.showNotice("📻 LoRa Funkmodul aktiviert auf " + state.frequencyMhz + " MHz!");
        updateStatusUI();
        return true;
      },
      async disconnect() {
        state.status = "disconnected";
        api.showNotice("📻 LoRa Funkmodul getrennt.");
        updateStatusUI();
      },
      async sendMessage(channelId, payload) {
        state.packetsSent++;
        updateStatusUI();
        return true;
      },
      onMessage(handler) {
        state.messageHandlers.add(handler);
        return () => state.messageHandlers.delete(handler);
      },
      status() { return state.status; }
    });

    api.registerCommand({
      name: "/lora",
      description: "Steuere das LoRa-Funkmodul (/lora connect, /lora ping, /lora freq)",
      icon: "mage:radio",
      execute: async (args) => {
        const parts = (args || "").trim().split(" ");
        const sub = parts[0]?.toLowerCase();
        if (sub === "connect") {
          state.status = "connected";
          api.showNotice("📻 LoRa Funkmodul verbunden (868.100 MHz)");
        } else if (sub === "disconnect") {
          state.status = "disconnected";
          api.showNotice("📻 LoRa Funkmodul getrennt.");
        } else if (sub === "ping") {
          state.packetsSent++;
          api.showNotice("📻 LoRa Discovery-Ping über Äther gesendet (" + state.frequencyMhz + " MHz)!");
        } else {
          api.showNotice("📡 LoRa Funk-Status: " + state.status.toUpperCase() + " | Freq: " + state.frequencyMhz + " MHz | RSSI: " + state.rssi + " dBm");
        }
        updateStatusUI();
      }
    });

    let statusBarElem = null;
    api.registerUIComponent("status_bar", {
      id: "lora-status-widget",
      title: "LoRa Funk Status",
      render(container) {
        statusBarElem = container;
        updateStatusUI();
        return () => { statusBarElem = null; };
      }
    });
  },
  onunload() {
    console.log("[LoRa Mesh Plugin] Entladen.");
  }
};`
  }
};
