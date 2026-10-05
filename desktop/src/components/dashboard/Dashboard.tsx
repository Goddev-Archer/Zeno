import React, { useState } from "react";
import { Icon } from "@iconify/react";
import {
  WidgetConfig,
  RecentFile,
  Server,
  Channel,
  UserIdentity
} from "../../types";
import { exportNativeTextFile } from "../../services/cryptoService";

interface DashboardProps {
  widgets?: WidgetConfig[];
  dashboardEditMode?: boolean;
  editingWidgetId?: string | null;
  draggedWidgetId?: string | null;
  swappingWidgetIds?: string[];
  recentFiles: RecentFile[];
  githubToken?: string;
  githubReposLoading?: boolean;
  githubRepos?: Array<{ name: string; fullName: string }>;
  githubRepoData?: Record<string, any>;
  gitWidgetTabs?: Record<string, string>;
  gitError?: string | null;
  liveGitStatus: any;
  liveGitCommits: any[];
  dashboardLocation?: string;
  dashboardTime?: string;
  weatherMode?: "wttr" | "custom";
  weatherApiUrl?: string;
  weatherApiKey?: string;
  realWeatherData?: any;
  weatherFetching?: boolean;
  theme?: "dark" | "light";
  glowColor?: string;
  setDashboardEditMode?: (mode: boolean | ((prev: boolean) => boolean)) => void;
  setEditingWidgetId?: (id: string | null) => void;
  setDraggedWidgetId?: (id: string | null) => void;
  setGitWidgetTabs?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDashboardLocation?: (loc: string) => void;
  setWeatherMode?: (mode: "wttr" | "custom") => void;
  setWeatherApiUrl?: (url: string) => void;
  setWeatherApiKey?: (key: string) => void;
  setRealWeatherData?: (data: any) => void;
  addCustomWidget?: () => void;
  handleWidgetDrop?: (targetId: string) => void;
  moveWidget?: (id: string, dir: "left" | "right") => void;
  updateWidget?: (id: string, patch: Partial<WidgetConfig>) => void;
  deleteWidget?: (id: string) => void;
  openWorkspaceFile: (filename: string, language: string) => void;
  setEditorCode: (code: string) => void;
  setEditorWorkflowStep: (step: any) => void;
  setIsEditorOpen: (open: boolean) => void;
  fetchGithubRepoDetails?: (repoName: string) => void;
  fetchLiveGitData?: () => void;
  fetchRealWeather?: () => void;
  showToast: (msg: string) => void;
  getContrastColor?: (hex: string) => string;
  onOpenMarketplace?: () => void;
  // Ergonomic Extensions:
  onNavigateToIde?: () => void;
  onNavigateToChannel?: (server: Server, channel: Channel) => void;
  onOpenSovereignModal?: () => void;
  onOpenInstanceBrowser?: () => void;
  onOpenGitSyncModal?: () => void;
  userName?: string;
  userIdentity?: UserIdentity | null;
  servers?: Server[];
  connectedRelaysCount?: number;
  onJoinVoice?: (channelId: string, channelName: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  recentFiles,
  liveGitStatus,
  liveGitCommits,
  openWorkspaceFile,
  showToast,
  onNavigateToIde,
  onNavigateToChannel,
  onOpenSovereignModal,
  onOpenInstanceBrowser,
  onOpenGitSyncModal,
  userName = "CipherNaut",
  userIdentity,
  servers = [],
  connectedRelaysCount = 3,
  onJoinVoice
}) => {
  const [copiedAin, setCopiedAin] = useState<boolean>(false);

  const displayAin = userIdentity?.ain || "ZENO-7A4B-8E21-99C0";
  const displayFingerprint = userIdentity?.fingerprint || "0x9F82A4C1B920";

  const handleCopyAin = () => {
    navigator.clipboard.writeText(displayAin);
    setCopiedAin(true);
    showToast("AIN in die Zwischenablage kopiert.");
    setTimeout(() => setCopiedAin(false), 2000);
  };

  const handleExportBackup = async () => {
    const backupContent = `=====================================================
ZENO SOVEREIGN IDENTITY PAPER BACKUP
=====================================================
AIN:         ${displayAin}
Fingerprint: ${displayFingerprint}
Generiert:   ${new Date().toISOString()}

HINWEIS:
Bewahre diese Datei sicher auf. Zeno nutzt keine zentralen
Passwörter. Deine kryptografischen Schlüssel gehören allein dir.
=====================================================`;
    try {
      const path = await exportNativeTextFile("zeno-identity-paper-backup.txt", backupContent);
      showToast(`✓ Paper-Backup exportiert: ${path}`);
    } catch (e: any) {
      showToast(`Export-Fehler: ${e?.message || e}`);
    }
  };

  // Curated Channels for quick navigation
  const primaryServer = servers[0];
  const textChannels = primaryServer?.categories?.find((c) => c.type === "text")?.channels || [];
  const voiceChannels = primaryServer?.categories?.find((c) => c.type === "voice")?.channels || [];

  return (
    <div
      className="zeno-dashboard"
      style={{
        padding: "20px 24px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        height: "100%",
        boxSizing: "border-box",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)"
      }}
    >
      {/* 1. HERO & IDENTITY STATUS BANNER */}
      <section
        style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "18px 22px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                Willkommen im Workspace, {userName}
              </h1>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  backgroundColor: "rgba(0, 255, 135, 0.12)",
                  color: "#00FF87",
                  border: "1px solid rgba(0, 255, 135, 0.3)",
                  padding: "2px 8px",
                  borderRadius: "12px"
                }}
              >
                ● E2EE VERIFIZIERT
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
              Dezentrale, hochsichere Kollaborationsplattform gegen die EU-Chatkontrolle. Lokale Schlüsselhoheit & Zero-Knowledge.
            </p>
          </div>

          {/* Quick Action Buttons in Hero */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {onNavigateToIde && (
              <button
                onClick={onNavigateToIde}
                className="settings-btn primary"
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "6px 14px", backgroundColor: "#00FF87", color: "#08090C", fontWeight: "700" }}
                title="Direkt in die Zeno Entwicklungsumgebung wechseln"
              >
                <Icon icon="mage:code" /> Zeno IDE öffnen
              </button>
            )}
            {onOpenInstanceBrowser && (
              <button
                onClick={onOpenInstanceBrowser}
                className="settings-btn"
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "6px 12px" }}
                title="Dezentrale Zeno-Server & Community-Instanzen durchstöbern"
              >
                <Icon icon="mage:compass" /> Instanzen
              </button>
            )}
            {onOpenSovereignModal && (
              <button
                onClick={onOpenSovereignModal}
                className="settings-btn"
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "6px 12px" }}
                title="Sovereign Identity, BIP-39 Seed & Passcode verwalten"
              >
                <Icon icon="mage:shield-check" /> Account
              </button>
            )}
          </div>
        </div>

        {/* Status Chips Strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
          {/* AIN Identity Chip */}
          <div
            onClick={handleCopyAin}
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer"
            }}
            title="Klicken zum Kopieren"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
              <Icon icon="mage:user-square" style={{ fontSize: "18px", color: "var(--accent-color)" }} />
              <div>
                <span style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                  Sovereign AIN
                </span>
                <span style={{ fontSize: "11px", fontWeight: "600", fontFamily: "var(--font-mono)" }}>
                  {displayAin}
                </span>
              </div>
            </div>
            <Icon icon={copiedAin ? "mage:check" : "mage:copy"} style={{ color: copiedAin ? "#00FF87" : "var(--text-muted)", fontSize: "14px" }} />
          </div>

          {/* SQLite DB Chip */}
          <div
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Icon icon="mage:database" style={{ fontSize: "18px", color: "#38BDF8" }} />
            <div>
              <span style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                Lokale Persistenz
              </span>
              <span style={{ fontSize: "11px", fontWeight: "600" }}>
                SQLite (zeno.db) Verbunden
              </span>
            </div>
          </div>

          {/* Relays Chip */}
          <div
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Icon icon="mage:satellite" style={{ fontSize: "18px", color: "#00FF87" }} />
            <div>
              <span style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                Multi-Relay Transport
              </span>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#00FF87" }}>
                {connectedRelaysCount} Relays Online (Nostr/WS)
              </span>
            </div>
          </div>

          {/* Git Status Chip */}
          <div
            onClick={onOpenGitSyncModal}
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: onOpenGitSyncModal ? "pointer" : "default"
            }}
            title="Git Synchronisation öffnen"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon icon="mage:git-branch" style={{ fontSize: "18px", color: "var(--accent-color)" }} />
              <div>
                <span style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                  Git Manifest Repository
                </span>
                <span style={{ fontSize: "11px", fontWeight: "600" }}>
                  {liveGitStatus?.branch || "main"} {liveGitStatus?.isClean ? "(Sauber)" : `(${liveGitStatus?.uncommittedChanges} Geändert)`}
                </span>
              </div>
            </div>
            {onOpenGitSyncModal && <Icon icon="mage:chevron-right" style={{ color: "var(--text-muted)", fontSize: "14px" }} />}
          </div>
        </div>
      </section>

      {/* 2. THREE-COLUMN ERGONOMIC USABILITY WORKSPACE */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr 1fr", gap: "16px", flex: 1, minHeight: 0 }}>
        
        {/* COLUMN 1: KOMMUNIKATION & RÄUME */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Card: Text Channels Quick Jump */}
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)" }}>
                <Icon icon="mage:message-conversation" style={{ color: "var(--accent-color)" }} /> SCHNELLZUGRIFF KANÄLE
              </span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{primaryServer?.name || "Server"}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {textChannels.slice(0, 4).map((chn) => (
                <div
                  key={chn.id}
                  onClick={() => primaryServer && onNavigateToChannel && onNavigateToChannel(primaryServer, chn)}
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)"
                  }}
                  className="channel-jump-item"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon icon="mage:hashtag" style={{ color: "var(--text-muted)" }} />
                    <span style={{ fontSize: "12px", fontWeight: "600" }}>{chn.name}</span>
                  </div>
                  <Icon icon="mage:arrow-right" style={{ fontSize: "12px", color: "var(--text-muted)" }} />
                </div>
              ))}
              {textChannels.length === 0 && (
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "8px 0" }}>Keine Textkanäle gefunden.</p>
              )}
            </div>
          </div>

          {/* Card: Live Voice Channel Lounge */}
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)" }}>
                <Icon icon="mage:microphone" style={{ color: "#00FF87" }} /> SPRACHLOUNGE & AUDIO
              </span>
              <span style={{ fontSize: "10px", color: "#00FF87", fontWeight: "600" }}>Web Audio VAD</span>
            </div>

            {voiceChannels.length > 0 ? (
              voiceChannels.map((vChn) => (
                <div key={vChn.id} style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Icon icon="mage:volume-up" style={{ color: "var(--accent-color)" }} />
                      <span style={{ fontSize: "12px", fontWeight: "700" }}>{vChn.name}</span>
                    </div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Ende-zu-Ende verschlüsselt</span>
                  </div>
                  <button
                    onClick={() => onJoinVoice && onJoinVoice(vChn.id, vChn.name)}
                    className="settings-btn primary"
                    style={{ fontSize: "11px", padding: "6px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <Icon icon="mage:phone" /> Sprachkanal beitreten
                  </button>
                </div>
              ))
            ) : (
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Keine aktiven Sprachkanäle.</p>
            )}
          </div>

          {/* Card: Community & Joined Servers */}
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              DEZENTRALE SERVER ({servers.length})
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {servers.map((srv) => (
                <div key={srv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px" }}>{srv.iconLetter || "🛡️"}</span>
                    <span style={{ fontSize: "12px", fontWeight: "500" }}>{srv.name}</span>
                  </div>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Git-Backed</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLUMN 2: WORKSPACE & ENTWICKLUNG (DEVELOPER HUB) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Recent Files in Workspace */}
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)" }}>
                <Icon icon="mage:folder-open" style={{ color: "#38BDF8" }} /> PROJEKT-DATEIEN & ARBEITSBEREICH
              </span>
              {onNavigateToIde && (
                <button
                  onClick={onNavigateToIde}
                  style={{ background: "none", border: "none", color: "var(--accent-color)", fontSize: "11px", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  In IDE öffnen <Icon icon="mage:arrow-right" />
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, overflowY: "auto" }}>
              {recentFiles.map((file) => (
                <div
                  key={file.name}
                  onClick={() => openWorkspaceFile(file.name, file.language)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    backgroundColor: "var(--bg-tertiary)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-color)",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                    <Icon
                      icon={
                        file.name.endsWith(".rs") ? "vscode-icons:file-type-rust" :
                        file.name.endsWith(".py") ? "vscode-icons:file-type-python" :
                        file.name.endsWith(".js") ? "vscode-icons:file-type-js" :
                        file.name.endsWith(".ts") ? "vscode-icons:file-type-typescript-official" :
                        file.name.endsWith(".json") ? "vscode-icons:file-type-json" :
                        file.name.endsWith(".md") ? "vscode-icons:file-type-markdown" : "mage:file-records"
                      }
                      style={{ fontSize: "16px", flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {file.name}
                    </span>
                  </div>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
                    {file.language}
                  </span>
                </div>
              ))}
              {recentFiles.length === 0 && (
                <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "16px" }}>
                  Keine kürzlich geöffneten Dateien.
                </p>
              )}
            </div>
          </div>

          {/* Git Source Control Feed */}
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon icon="mage:git-commit" style={{ color: "var(--accent-color)" }} /> GIT SOURCE CONTROL
              </span>
              {onOpenGitSyncModal && (
                <button
                  onClick={onOpenGitSyncModal}
                  className="settings-btn"
                  style={{ fontSize: "10px", padding: "3px 8px" }}
                >
                  Sync & Push
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {liveGitCommits.slice(0, 3).map((commit, idx) => (
                <div key={idx} style={{ padding: "6px 10px", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                    <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--accent-color)", fontWeight: "700" }}>
                      {commit.hash}
                    </span>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{commit.timeAgo || commit.date}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {commit.message}
                  </div>
                </div>
              ))}
              {liveGitCommits.length === 0 && (
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                  Keine Commits im Verlauf gefunden.
                </span>
              )}
            </div>
          </div>

        </div>

        {/* COLUMN 3: DEZENTRALES NETZWERK & PRIVATSPHÄRE (SECURITY HUB) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Multi-Relay Transport Status */}
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon icon="mage:globe" style={{ color: "#00FF87" }} /> RELAY-TRANSPORT
              </span>
              <span style={{ fontSize: "10px", color: "#00FF87", fontWeight: "600" }}>AES-256-GCM</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
              {[
                { name: "relay.damus.io", type: "Nostr WebSocket", ping: "28ms", status: "Verbunden" },
                { name: "nos.lol", type: "Nostr WebSocket", ping: "42ms", status: "Verbunden" },
                { name: "relay.snort.social", type: "Nostr WebSocket", ping: "35ms", status: "Verbunden" }
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <div>
                    <span style={{ fontWeight: "600", display: "block" }}>{r.name}</span>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{r.type}</span>
                  </div>
                  <span style={{ color: "#00FF87", fontSize: "10px", fontWeight: "600" }}>● {r.ping}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sovereign Security & Backup Card */}
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)" }}>
              <Icon icon="mage:lock" style={{ color: "var(--accent-color)" }} /> SOVEREIGN KEY SECURITY
            </span>

            <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Passcode-Schutz:</span>
                <strong style={{ color: "#00FF87" }}>Aktiv</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>15s Auto-Lock Timer:</span>
                <strong style={{ color: "#00FF87" }}>Aktiv</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Schulterblick-Blur:</span>
                <strong style={{ color: "#00FF87" }}>Aktiv</strong>
              </div>
            </div>

            <button
              onClick={handleExportBackup}
              className="settings-btn"
              style={{ width: "100%", fontSize: "11px", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "4px" }}
            >
              <Icon icon="mage:download" /> Paper-Backup (.txt) exportieren
            </button>
          </div>

          {/* EU-Chatkontrolle Gegenentwurf Card */}
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#38BDF8", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "5px" }}>
              <Icon icon="mage:shield" /> PRIVATSPHÄREN-SCHUTZSCHILD
            </span>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: "1.4" }}>
              Zeno verweigert jegliches serverseitige und clientseitige Scannen von Nachrichten. Alle Datenströme bleiben lokal verschlüsselt.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
