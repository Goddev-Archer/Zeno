import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { Server, GitServerRepoStatus } from "../../types";
import {
  getServerRepoStatus,
  commitAndPushServerManifest,
  pullServerManifest,
  serverToManifest
} from "../../services/gitServerSyncService";
import { exportNativeTextFile } from "../../services/cryptoService";

interface GitSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: Server;
  onServerUpdated: (updatedServer: Server) => void;
  showToast: (msg: string) => void;
}

export const GitSyncModal: React.FC<GitSyncModalProps> = ({
  isOpen,
  onClose,
  server,
  onServerUpdated,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<"status" | "commit" | "manifest">("status");
  const [repoStatus, setRepoStatus] = useState<GitServerRepoStatus | null>(null);
  const [localRepoPath, setLocalRepoPath] = useState<string>(server.gitRepo?.localPath || "");
  const [commitMessage, setCommitMessage] = useState<string>(
    `feat(server): update ${server.name} channels and categories`
  );
  const [shouldPush, setShouldPush] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [operationLog, setOperationLog] = useState<string | null>(null);

  // Load status whenever modal opens
  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setCommitMessage(`feat(server): update ${server.name} channels and categories`);
      setOperationLog(null);
    }
  }, [isOpen, server]);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const status = await getServerRepoStatus(localRepoPath.trim() || undefined);
      setRepoStatus(status);
    } catch (e) {
      console.warn("Fehler beim Laden des Git-Status:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const manifestJsonString = useMemo(() => {
    return JSON.stringify(serverToManifest(server), null, 2);
  }, [server]);

  if (!isOpen) return null;

  // Handle Pull from Git
  const handlePull = async () => {
    setIsLoading(true);
    setOperationLog(null);
    try {
      const { result, updatedServer } = await pullServerManifest({
        currentServer: server,
        repoPath: localRepoPath.trim() || undefined
      });

      setOperationLog(`[git pull]\n${result.output}`);

      if (result.success) {
        if (updatedServer) {
          onServerUpdated(updatedServer);
          showToast(`Server "${updatedServer.name}" erfolgreich aus Git aktualisiert! 📥`);
        } else {
          showToast("Git Pull erfolgreich ausgeführt! 🌿");
        }
      } else {
        showToast("Warnung beim Git Pull. Details im Log prüfen.");
      }

      await loadStatus();
    } catch (e: any) {
      showToast(`Fehler beim Pull: ${e.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Commit & Push
  const handleCommitPush = async () => {
    setIsLoading(true);
    setOperationLog(null);
    try {
      const result = await commitAndPushServerManifest({
        server,
        repoPath: localRepoPath.trim() || undefined,
        commitMessage: commitMessage.trim() || undefined,
        push: shouldPush
      });

      const logText = `[git commit & push]\nStatus: ${result.success ? "Erfolgreich" : "Fehlgeschlagen"}\nCommit: ${
        result.commitHash || "keine Änderungen"
      }\nRemote-Push: ${result.pushed ? "Ja" : "Nein"}\n\n${result.output}`;
      setOperationLog(logText);

      if (result.success) {
        showToast(
          result.pushed
            ? `Änderungen committet & nach Git gepusht! 🚀 (${result.commitHash || "HEAD"})`
            : `zeno-server.json lokal gesichert & committet! 💾 (${result.commitHash || "HEAD"})`
        );
      } else {
        showToast("Fehler beim Commit oder Push. Details im Log ansehen.");
      }

      await loadStatus();
    } catch (e: any) {
      showToast(`Fehler beim Commit: ${e.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy Manifest to Clipboard
  const handleCopyManifest = () => {
    navigator.clipboard.writeText(manifestJsonString);
    showToast("zeno-server.json in Zwischenablage kopiert! 📋");
  };

  // Download Manifest
  const handleDownloadManifest = async () => {
    try {
      await exportNativeTextFile("zeno-server.json", manifestJsonString);
      showToast("zeno-server.json in Downloads gespeichert! 💾");
    } catch (e: any) {
      showToast(`Fehler beim Herunterladen: ${e.message || e}`);
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          width: "650px",
          maxWidth: "94vw",
          maxHeight: "88vh",
          backgroundColor: "#1E1F22",
          border: "1px solid #3574F0",
          borderRadius: "12px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(53, 116, 240, 0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "#E3E4E8"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #2B2D30",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#18191B"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(53, 116, 240, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3574F0",
                fontSize: "22px"
              }}
            >
              <Icon icon="octicon:git-branch-16" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ fontSize: "17px", fontWeight: "700", margin: 0, color: "#FFF" }}>
                  Git Server Manifest
                </h2>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    backgroundColor: repoStatus?.manifestExists ? "rgba(0, 255, 135, 0.15)" : "rgba(235, 87, 87, 0.15)",
                    color: repoStatus?.manifestExists ? "#00FF87" : "#EB5757",
                    border: `1px solid ${repoStatus?.manifestExists ? "rgba(0, 255, 135, 0.3)" : "rgba(235, 87, 87, 0.3)"}`
                  }}
                >
                  {repoStatus?.manifestExists ? "zeno-server.json aktiv" : "Keine zeno-server.json"}
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                Server: <strong>{server.name}</strong> • Git als Single Source of Truth
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#64748B",
              fontSize: "20px",
              cursor: "pointer",
              padding: "4px"
            }}
          >
            <Icon icon="mage:multiply" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #2B2D30",
            backgroundColor: "#18191B",
            padding: "0 24px"
          }}
        >
          <button
            onClick={() => setActiveTab("status")}
            style={{
              padding: "12px 16px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "status" ? "2px solid #3574F0" : "2px solid transparent",
              color: activeTab === "status" ? "#FFF" : "#94A3B8",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Icon icon="mage:dashboard" />
            Repository-Status & Sync
          </button>
          <button
            onClick={() => setActiveTab("commit")}
            style={{
              padding: "12px 16px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "commit" ? "2px solid #3574F0" : "2px solid transparent",
              color: activeTab === "commit" ? "#FFF" : "#94A3B8",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Icon icon="mage:cloud-upload" />
            Commit & Push
          </button>
          <button
            onClick={() => setActiveTab("manifest")}
            style={{
              padding: "12px 16px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "manifest" ? "2px solid #3574F0" : "2px solid transparent",
              color: activeTab === "manifest" ? "#FFF" : "#94A3B8",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Icon icon="mage:code" />
            zeno-server.json Vorschau
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* TAB 1: STATUS & PULL */}
          {activeTab === "status" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Status Overview Box */}
              <div
                style={{
                  backgroundColor: "#18191B",
                  borderRadius: "10px",
                  border: "1px solid #2B2D30",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#94A3B8" }}>
                    LOKALER GIT-STATUS
                  </span>
                  <button
                    onClick={loadStatus}
                    disabled={isLoading}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#3574F0",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <Icon icon="mage:refresh" className={isLoading ? "spin" : ""} />
                    Aktualisieren
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>Branch</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#FFF", fontFamily: "monospace" }}>
                      🌿 {repoStatus?.branch || "main"}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>Status</span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: repoStatus?.isClean ? "#00FF87" : "#F2C94C"
                      }}
                    >
                      {repoStatus?.isClean ? "✓ Arbeitsverzeichnis sauber" : "● Uncommittete Änderungen"}
                    </span>
                  </div>
                  <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>Remote Origin</span>
                    <span style={{ fontSize: "12px", color: "#94A3B8", fontFamily: "monospace" }}>
                      {repoStatus?.remoteUrl || server.gitRepo?.repoUrl || "Kein Remote konfiguriert (rein lokal)"}
                    </span>
                  </div>
                  {repoStatus?.lastCommit && (
                    <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "11px", color: "#64748B" }}>Letzter Commit</span>
                      <span style={{ fontSize: "12px", color: "#00FF87", fontFamily: "monospace" }}>
                        {repoStatus.lastCommit}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Local Path Configuration */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#94A3B8" }}>
                  REPOSITORY-PFAD (OPTIONALER OVERRIDE)
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={localRepoPath}
                    onChange={(e) => setLocalRepoPath(e.target.value)}
                    placeholder="Standard: Zeno Projekt-Root"
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      backgroundColor: "#18191B",
                      border: "1px solid #2B2D30",
                      borderRadius: "8px",
                      color: "#FFF",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={loadStatus}
                    style={{
                      padding: "8px 14px",
                      backgroundColor: "#2B2D30",
                      border: "none",
                      borderRadius: "8px",
                      color: "#E3E4E8",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Prüfen
                  </button>
                </div>
                <span style={{ fontSize: "11px", color: "#64748B" }}>
                  Standardmäßig wird das geöffnete Zeno Git-Repository verwendet.
                </span>
              </div>

              {/* Pull Action Button */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(53, 116, 240, 0.08)",
                  border: "1px solid rgba(53, 116, 240, 0.2)"
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#FFF" }}>
                    Aus Git aktualisieren (Pull)
                  </h4>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94A3B8" }}>
                    Holt die neuesten Kanäle und Konfigurationen aus <code>zeno-server.json</code> ab.
                  </p>
                </div>
                <button
                  onClick={handlePull}
                  disabled={isLoading}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#3574F0",
                    color: "#FFF",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Icon icon="mage:cloud-download" />
                  Git Pull
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: COMMIT & PUSH */}
          {activeTab === "commit" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#94A3B8" }}>
                  COMMIT-NACHRICHT
                </label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="feat(server): update zeno-server.json manifest"
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "#18191B",
                    border: "1px solid #2B2D30",
                    borderRadius: "8px",
                    color: "#FFF",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px",
                  backgroundColor: "#18191B",
                  borderRadius: "8px",
                  border: "1px solid #2B2D30",
                  cursor: "pointer"
                }}
              >
                <input
                  type="checkbox"
                  checked={shouldPush}
                  onChange={(e) => setShouldPush(e.target.checked)}
                  style={{ accentColor: "#00FF87", width: "16px", height: "16px" }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#FFF" }}>
                    Direkt nach origin push (Remote-Verteilung)
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748B" }}>
                    Pusht die aktualisierte <code>zeno-server.json</code> sofort ins Remote-Repository, damit andere Teilnehmer synchron bleiben.
                  </span>
                </div>
              </label>

              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid #2B2D30",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px"
                }}
              >
                <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "600" }}>
                  DAS MANIFEST ENTHÄLT AKTUELL:
                </span>
                <span style={{ fontSize: "12px", color: "#00FF87" }}>
                  • {server.categories?.length || 0} Kategorien mit insgesamt{" "}
                  {server.categories?.reduce((acc, cat) => acc + (cat.channels?.length || 0), 0) || 0} Kanälen
                </span>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                  • Relays: {server.gitRepo?.provider || "Dezentral"} • Verschlüsselt: {server.encrypted ? "Ja (E2EE)" : "Nein"}
                </span>
              </div>

              <button
                onClick={handleCommitPush}
                disabled={isLoading}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#00FF87",
                  color: "#08090C",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 15px rgba(0, 255, 135, 0.3)"
                }}
              >
                <Icon icon="mage:cloud-upload" />
                {shouldPush ? "In Git committen & pushen" : "Lokal in Git committen"}
              </button>
            </div>
          )}

          {/* TAB 3: MANIFEST CODE PREVIEW */}
          {activeTab === "manifest" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                  Pfad: <code>zeno-server.json</code>
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleCopyManifest}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      backgroundColor: "#2B2D30",
                      border: "none",
                      color: "#E3E4E8",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <Icon icon="mage:copy" />
                    Kopieren
                  </button>
                  <button
                    onClick={handleDownloadManifest}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      backgroundColor: "#2B2D30",
                      border: "none",
                      color: "#E3E4E8",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <Icon icon="mage:download" />
                    Download
                  </button>
                </div>
              </div>

              <pre
                style={{
                  margin: 0,
                  padding: "16px",
                  backgroundColor: "#111214",
                  border: "1px solid #2B2D30",
                  borderRadius: "8px",
                  color: "#A9B7C6",
                  fontSize: "12px",
                  lineHeight: "1.5",
                  maxHeight: "260px",
                  overflowY: "auto",
                  fontFamily: "monospace"
                }}
              >
                {manifestJsonString}
              </pre>
            </div>
          )}

          {/* Operation Output Log Box if available */}
          {operationLog && (
            <div
              style={{
                marginTop: "10px",
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "#111214",
                border: "1px solid #2B2D30",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#3574F0", fontFamily: "monospace" }}>
                  GIT PROZESS-TERMINAL
                </span>
                <button
                  onClick={() => setOperationLog(null)}
                  style={{ background: "none", border: "none", color: "#64748B", fontSize: "12px", cursor: "pointer" }}
                >
                  Schließen
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  fontSize: "11px",
                  color: "#E3E4E8",
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                  maxHeight: "120px",
                  overflowY: "auto"
                }}
              >
                {operationLog}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #2B2D30",
            backgroundColor: "#18191B",
            display: "flex",
            justifyContent: "flex-end"
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              border: "1px solid #3B4048",
              backgroundColor: "transparent",
              color: "#FFF",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
