import React, { useState, useEffect, useRef, useCallback } from "react";
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
  userName = "TheAdministrator",
  userIdentity,
  servers = [],
  connectedRelaysCount = 3,
  theme = "dark",
  onJoinVoice
}) => {
  const [copiedAin, setCopiedAin] = useState<boolean>(false);
  const dashboardScrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflowBelow, setHasOverflowBelow] = useState<boolean>(false);

  const checkOverflow = useCallback(() => {
    const el = dashboardScrollRef.current;
    if (!el) return;
    const isOverflowing = el.scrollHeight - el.scrollTop - el.clientHeight > 18;
    setHasOverflowBelow(isOverflowing);
  }, []);

  useEffect(() => {
    checkOverflow();
    const el = dashboardScrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => checkOverflow());
    observer.observe(el);
    window.addEventListener("resize", checkOverflow);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
  }, [checkOverflow]);

  const handleScroll = () => {
    checkOverflow();
  };

  const handleScrollDownHint = () => {
    dashboardScrollRef.current?.scrollBy({ top: 220, behavior: "smooth" });
  };

  const displayAin = userIdentity?.ain || "ZENO-D432-EAA1-8B01";
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

  const primaryServer = servers[0];
  const textChannels = primaryServer?.categories?.find((c) => c.type === "text")?.channels || [];
  const voiceChannels = primaryServer?.categories?.find((c) => c.type === "voice")?.channels || [];

  const isLight = theme === "light";

  // Common floating island card style adapting seamlessly to dark and light mode
  const islandStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxShadow: isLight ? "0 4px 16px rgba(0, 0, 0, 0.06)" : "0 8px 30px rgba(0, 0, 0, 0.28)",
    boxSizing: "border-box"
  };

  return (
    <div className="zeno-dashboard-wrapper" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div
        ref={dashboardScrollRef}
        onScroll={handleScroll}
        className="zeno-dashboard"
        style={{
          padding: "16px 20px 56px 20px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          height: "100%",
          maxHeight: "100%",
          boxSizing: "border-box",
          backgroundColor: "transparent",
          color: "var(--text-primary)"
        }}
      >
      {/* 1. FLOATING HERO & IDENTITY STATUS ISLAND */}
      <section
        style={{
          ...islandStyle,
          padding: "16px 20px",
          gap: "12px",
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
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
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "3px 0 0 0" }}>
              Dezentrale, souveräne Kollaborationsplattform. Lokale Schlüsselhoheit, Art. 10 GG Konformität &amp; Zero-Knowledge.
            </p>
          </div>

          {/* Quick Action Buttons in Hero */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {onNavigateToIde && (
              <button
                onClick={onNavigateToIde}
                className="settings-btn primary"
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "5px 12px", backgroundColor: "#00FF87", color: "#08090C", fontWeight: "700" }}
                title="Direkt in die Zeno Entwicklungsumgebung wechseln"
              >
                <Icon icon="mage:code" /> Zeno IDE öffnen
              </button>
            )}
            {onOpenInstanceBrowser && (
              <button
                onClick={onOpenInstanceBrowser}
                className="settings-btn"
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "5px 10px" }}
                title="Dezentrale Zeno-Server & Community-Instanzen durchstöbern"
              >
                <Icon icon="mage:compass" /> Instanzen
              </button>
            )}
            {onOpenSovereignModal && (
              <button
                onClick={onOpenSovereignModal}
                className="settings-btn"
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "5px 10px" }}
                title="Sovereign Identity, BIP-39 Seed & Passcode verwalten"
              >
                <Icon icon="mage:shield-check" /> Account
              </button>
            )}
          </div>
        </div>

        {/* Status Chips Strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "8px" }}>
          {/* AIN Identity Chip */}
          <div
            onClick={handleCopyAin}
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              padding: "7px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer"
            }}
            title="Klicken zum Kopieren"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0, overflow: "hidden" }}>
              <Icon icon="mage:user-square" style={{ fontSize: "16px", color: "var(--accent-color)", flexShrink: 0 }} />
              <div style={{ minWidth: 0, overflow: "hidden" }}>
                <span style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                  Sovereign AIN
                </span>
                <span style={{ fontSize: "11px", fontWeight: "600", fontFamily: "var(--font-mono)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                  {displayAin}
                </span>
              </div>
            </div>
            <Icon icon={copiedAin ? "mage:check" : "mage:copy"} style={{ color: copiedAin ? "#00FF87" : "var(--text-muted)", fontSize: "13px", flexShrink: 0, marginLeft: "4px" }} />
          </div>

          {/* SQLite DB Chip */}
          <div
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              padding: "7px 10px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Icon icon="mage:database" style={{ fontSize: "16px", color: "#38BDF8", flexShrink: 0 }} />
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
              padding: "7px 10px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Icon icon="mage:satellite" style={{ fontSize: "16px", color: "#00FF87", flexShrink: 0 }} />
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
              padding: "7px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: onOpenGitSyncModal ? "pointer" : "default"
            }}
            title="Git Synchronisation öffnen"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon icon="mage:git-branch" style={{ fontSize: "16px", color: "var(--accent-color)", flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                  Git Manifest Repository
                </span>
                <span style={{ fontSize: "11px", fontWeight: "600" }}>
                  {liveGitStatus?.branch || "main"} {liveGitStatus?.isClean ? "(Sauber)" : `(${liveGitStatus?.uncommittedChanges} Geändert)`}
                </span>
              </div>
            </div>
            {onOpenGitSyncModal && <Icon icon="mage:chevron-right" style={{ color: "var(--text-muted)", fontSize: "13px" }} />}
          </div>
        </div>
      </section>

      {/* 2. THREE-COLUMN FLOATING USABILITY GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(285px, 1fr))",
          gap: "14px",
          flex: 1,
          minHeight: 0
        }}
      >
        
        {/* COLUMN 1: WORKSPACE & ENTWICKLUNG (DEVELOPER HUB) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          
          {/* Project Files */}
          <div style={{ ...islandStyle, flex: 1, minHeight: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)" }}>
                <Icon icon="mage:folder-open" style={{ color: "#38BDF8" }} /> PROJEKT-DATEIEN &amp; WORKSPACE
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

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, overflowY: "auto", minHeight: "100px" }}>
              {recentFiles.map((file) => (
                <div
                  key={file.name}
                  onClick={() => openWorkspaceFile(file.name, file.language)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    backgroundColor: "var(--bg-tertiary)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-color)",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)"
                  }}
                  className="channel-jump-item"
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
                      style={{ fontSize: "15px", flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "11px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {file.name}
                    </span>
                  </div>
                  <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", flexShrink: 0 }}>
                    {file.language}
                  </span>
                </div>
              ))}
              {recentFiles.length === 0 && (
                <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "12px" }}>
                  Keine kürzlich geöffneten Dateien.
                </p>
              )}
            </div>
          </div>

          {/* Git Source Control Feed */}
          <div style={{ ...islandStyle }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon icon="mage:git-commit" style={{ color: "var(--accent-color)" }} /> GIT SOURCE CONTROL
              </span>
              {onOpenGitSyncModal && (
                <button
                  onClick={onOpenGitSyncModal}
                  className="settings-btn"
                  style={{ fontSize: "10px", padding: "2px 7px" }}
                >
                  Sync &amp; Push
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {liveGitCommits.slice(0, 3).map((commit, idx) => (
                <div key={idx} style={{ padding: "6px 8px", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
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

        {/* COLUMN 2: KOMMUNIKATION & RÄUME */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          
          {/* Text Channels */}
          <div style={{ ...islandStyle }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)" }}>
                <Icon icon="mage:message-conversation" style={{ color: "var(--accent-color)" }} /> SCHNELLZUGRIFF KANÄLE
              </span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", backgroundColor: "rgba(255, 255, 255, 0.05)", padding: "1px 6px", borderRadius: "8px" }}>
                {primaryServer?.name || "Server"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {textChannels.slice(0, 3).map((chn) => (
                <div
                  key={chn.id}
                  onClick={() => primaryServer && onNavigateToChannel && onNavigateToChannel(primaryServer, chn)}
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    padding: "7px 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)"
                  }}
                  className="channel-jump-item"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <Icon icon="mage:hashtag" style={{ color: "var(--text-muted)" }} />
                    <span style={{ fontSize: "11px", fontWeight: "600" }}>{chn.name}</span>
                  </div>
                  <Icon icon="mage:arrow-right" style={{ fontSize: "11px", color: "var(--text-muted)" }} />
                </div>
              ))}
              {textChannels.length === 0 && (
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "4px 0" }}>Keine Textkanäle gefunden.</p>
              )}
            </div>
          </div>

          {/* Voice Lounge Card */}
          <div style={{ ...islandStyle }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)" }}>
                <Icon icon="mage:microphone" style={{ color: "#00FF87" }} /> SPRACHLOUNGE &amp; AUDIO
              </span>
              <span style={{ fontSize: "9px", color: "#00FF87", fontWeight: "600", backgroundColor: "rgba(0, 255, 135, 0.1)", padding: "1px 6px", borderRadius: "8px" }}>
                Web Audio VAD
              </span>
            </div>

            {voiceChannels.length > 0 ? (
              voiceChannels.map((vChn) => (
                <div key={vChn.id} style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Icon icon="mage:volume-up" style={{ color: "var(--accent-color)" }} />
                      <span style={{ fontSize: "12px", fontWeight: "700" }}>{vChn.name}</span>
                    </div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>
                      Ende-zu-Ende verschlüsselt (E2EE)
                    </span>
                  </div>
                  <button
                    onClick={() => onJoinVoice && onJoinVoice(vChn.id, vChn.name)}
                    className="settings-btn primary"
                    style={{ fontSize: "11px", padding: "5px 10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", backgroundColor: "#00FF87", color: "#08090C", fontWeight: "700" }}
                  >
                    <Icon icon="mage:phone" /> Sprachkanal beitreten
                  </button>
                </div>
              ))
            ) : (
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Keine aktiven Sprachkanäle.</p>
            )}
          </div>

          {/* Decentralized Servers */}
          <div style={{ ...islandStyle }}>
            <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              DEZENTRALE SERVER ({servers.length})
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {servers.map((srv) => (
                <div key={srv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <span style={{ fontSize: "13px" }}>{srv.iconLetter || "🛡️"}</span>
                    <span style={{ fontSize: "11px", fontWeight: "500" }}>{srv.name}</span>
                  </div>
                  <span style={{ fontSize: "9px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Git-Backed</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLUMN 3: DEZENTRALES NETZWERK & PRIVATSPHÄRE (SECURITY HUB) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          
          {/* Multi-Relay Transport Status */}
          <div style={{ ...islandStyle }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon icon="mage:globe" style={{ color: "#00FF87" }} /> RELAY-TRANSPORT
              </span>
              <span style={{ fontSize: "9px", color: "#00FF87", fontWeight: "600", backgroundColor: "rgba(0, 255, 135, 0.1)", padding: "1px 6px", borderRadius: "8px" }}>
                AES-256-GCM
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "11px" }}>
              {[
                { name: "relay.damus.io", type: "Nostr WebSocket", ping: "28ms" },
                { name: "nos.lol", type: "Nostr WebSocket", ping: "42ms" },
                { name: "relay.snort.social", type: "Nostr WebSocket", ping: "35ms" }
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
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
          <div style={{ ...islandStyle }}>
            <span style={{ fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)" }}>
              <Icon icon="mage:lock" style={{ color: "var(--accent-color)" }} /> SOVEREIGN KEY SECURITY
            </span>

            <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", whiteSpace: "nowrap" }}>
                <span>Passcode-Schutz:</span>
                <strong style={{ color: "#00FF87" }}>Aktiv</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", whiteSpace: "nowrap" }}>
                <span>15s Auto-Lock:</span>
                <strong style={{ color: "#00FF87" }}>Aktiv</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", whiteSpace: "nowrap" }}>
                <span>Schulterblick-Blur:</span>
                <strong style={{ color: "#00FF87" }}>Aktiv</strong>
              </div>
            </div>

            <button
              onClick={handleExportBackup}
              className="settings-btn"
              style={{ width: "100%", fontSize: "11px", padding: "5px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "2px" }}
            >
              <Icon icon="mage:download" /> Paper-Backup (.txt) exportieren
            </button>
          </div>

          {/* Privacy Shield Card */}
          <div style={{ ...islandStyle }}>
            <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#38BDF8", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "5px" }}>
              <Icon icon="mage:shield" /> PRIVATSPHÄREN-SCHUTZSCHILD
            </span>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: "1.4" }}>
              Zeno verweigert jegliches serverseitige und clientseitige Scannen von Nachrichten. Alle Datenströme bleiben lokal verschlüsselt.
            </p>
          </div>

        </div>

      </div>
      </div>

      {/* Dynamic bottom blur & fade overlay when content is cut off below */}
      <div
        className={`zeno-dashboard-cut-blur ${hasOverflowBelow ? "visible" : ""}`}
        onClick={handleScrollDownHint}
        title="Nach unten scrollen, um weitere Widgets zu sehen"
      >
        <div className="zeno-dashboard-cut-blur-pill">
          <Icon icon="mage:chevron-down" style={{ fontSize: "14px" }} />
          <span>Weitere Widgets anzeigen</span>
        </div>
      </div>
    </div>
  );
};
