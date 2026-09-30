import React, { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { Server, GitRepositoryConfig, ZenoServerManifest } from "../../types";
import {
  resolveRawManifestUrl,
  createServerManifest,
  manifestToServer,
  generateGitCommands
} from "../../utils/gitManifestHelper";

interface CreateJoinServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServerCreated: (newServer: Server) => void;
  onServerJoined: (serverOrCode: string | Server) => void;
  showToast: (msg: string) => void;
  userAin?: string;
}

export const CreateJoinServerModal: React.FC<CreateJoinServerModalProps> = ({
  isOpen,
  onClose,
  onServerCreated,
  onServerJoined,
  showToast,
  userAin
}) => {
  const [activeTab, setActiveTab] = useState<"create" | "join" | "guide">("create");

  // Create Server Form State
  const [serverName, setServerName] = useState("");
  const [serverDescription, setServerDescription] = useState("");
  const [serverIcon, setServerIcon] = useState("🛡️");
  const [isEncrypted, setIsEncrypted] = useState(true);

  // Git Repository Binding State
  const [gitProvider, setGitProvider] = useState<"none" | "github" | "gitlab" | "gitea" | "custom_git">("github");
  const [repoUrl, setRepoUrl] = useState("");
  const [repoBranch, setRepoBranch] = useState("main");
  const [showManifestPreview, setShowManifestPreview] = useState(false);
  const [showGitCommands, setShowGitCommands] = useState(false);

  // Join Server Form State
  const [inviteInput, setInviteInput] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  // Guide Tab Selection
  const [guideProvider, setGuideProvider] = useState<"github" | "gitlab" | "selfhost">("github");

  const iconOptions = ["🛡️", "⚡", "🚀", "🪐", "🔥", "💻", "🎮", "🔒", "🌐", "🛠️"];

  // Default Categories
  const defaultCategories = useMemo(() => [
    {
      name: "TEXTKANÄLE",
      type: "text" as const,
      channels: [
        { id: `chn-${Date.now()}-1`, name: "allgemein" },
        { id: `chn-${Date.now()}-2`, name: "dev-lounge" },
        { id: `chn-${Date.now()}-3`, name: "git-updates" }
      ]
    },
    {
      name: "SPRACHKANÄLE",
      type: "voice" as const,
      channels: [
        { id: `chn-${Date.now()}-4`, name: "Sprachkanal Alpha" },
        { id: `chn-${Date.now()}-5`, name: "Pair Programming" }
      ]
    }
  ], []);

  // Compute live manifest
  const liveManifest: ZenoServerManifest = useMemo(() => {
    const srvId = `srv-${(serverName || "zeno").toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-6)}`;
    const gitRepo: GitRepositoryConfig | undefined = gitProvider !== "none" ? {
      provider: gitProvider,
      repoUrl: repoUrl.trim(),
      branch: repoBranch.trim() || "main",
      manifestPath: "zeno-server.json",
      rawManifestUrl: repoUrl ? resolveRawManifestUrl(repoUrl, gitProvider, repoBranch.trim() || "main") : undefined
    } : undefined;

    return createServerManifest(
      srvId,
      serverName.trim() || "Neuer Zeno Server",
      serverDescription.trim() || "Dezentrale Entwickler-Community",
      serverIcon,
      isEncrypted,
      defaultCategories,
      gitRepo,
      userAin
    );
  }, [serverName, serverDescription, serverIcon, isEncrypted, gitProvider, repoUrl, repoBranch, defaultCategories, userAin]);

  const manifestJsonString = useMemo(() => {
    return JSON.stringify(liveManifest, null, 2);
  }, [liveManifest]);

  const gitCliCommands = useMemo(() => {
    return generateGitCommands(repoUrl, repoBranch);
  }, [repoUrl, repoBranch]);

  // Detected Join Type
  const detectedJoinType = useMemo(() => {
    const trimmed = inviteInput.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) return "raw_json";
    if (trimmed.includes("github.com")) return "github";
    if (trimmed.includes("gitlab.com")) return "gitlab";
    if (trimmed.includes("codeberg.org")) return "gitea";
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return "custom_url";
    if (trimmed.startsWith("zeno://")) return "zeno_protocol";
    return "invite_code";
  }, [inviteInput]);

  if (!isOpen) return null;

  // Handle Copy to Clipboard
  const handleCopyManifest = () => {
    navigator.clipboard.writeText(manifestJsonString);
    showToast("zeno-server.json in die Zwischenablage kopiert! 📋");
  };

  const handleCopyGitCommands = () => {
    navigator.clipboard.writeText(gitCliCommands);
    showToast("Git CLI-Befehle kopiert! 💻");
  };

  // Handle Download Manifest JSON
  const handleDownloadManifest = () => {
    const blob = new Blob([manifestJsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zeno-server.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("zeno-server.json erfolgreich heruntergeladen! 💾");
  };

  // Handle Create Server Submission
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim()) {
      showToast("Bitte gib einen Servernamen ein!");
      return;
    }

    const newServer = manifestToServer(liveManifest, liveManifest.gitRepo?.rawManifestUrl);

    console.log("[Zeno Server Wizard] Erstellter Server mit Manifest:", liveManifest);
    onServerCreated(newServer);
    showToast(`Server "${newServer.name}" erfolgreich erstellt! 🚀`);
    onClose();
  };

  // Handle Join Server Submission with async Git Manifest Fetch
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inviteInput.trim();
    if (!query) {
      showToast("Bitte gib einen Einladungs-Code, Git-URL oder zeno:// Link ein!");
      return;
    }

    // 1. Check if raw JSON was pasted
    if (detectedJoinType === "raw_json") {
      try {
        const parsed = JSON.parse(query) as ZenoServerManifest;
        const srv = manifestToServer(parsed);
        onServerJoined(srv);
        showToast(`Server "${srv.name}" aus JSON-Manifest importiert! 🚀`);
        onClose();
        return;
      } catch (err) {
        showToast("Ungültiges JSON-Manifest!");
        return;
      }
    }

    // 2. Check if a Git URL or HTTP URL was provided
    if (detectedJoinType === "github" || detectedJoinType === "gitlab" || detectedJoinType === "gitea" || detectedJoinType === "custom_url") {
      setIsResolving(true);
      const rawUrl = resolveRawManifestUrl(query, (detectedJoinType as any) || "github");
      
      try {
        const res = await fetch(rawUrl, { cache: "no-store" });
        if (res.ok) {
          const manifest = await res.json() as ZenoServerManifest;
          const srv = manifestToServer(manifest, rawUrl);
          setIsResolving(false);
          onServerJoined(srv);
          showToast(`Server "${srv.name}" via Git-Manifest geladen! 🛡️`);
          onClose();
          return;
        } else {
          console.warn("[Zeno Join] Konnte Manifest nicht direkt über HTTP laden (Status:", res.status, "), erstelle Proxy-Servereintrag.");
        }
      } catch (fetchErr) {
        console.warn("[Zeno Join] Fetch-Fehler (evtl. CORS/Offline), erstelle Git-Servereintrag offline:", fetchErr);
      }
      setIsResolving(false);
    }

    // 3. Fallback: Generic join
    onServerJoined(query);
    showToast(`Server "${query}" beigetreten!`);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}
    >
      <div
        className="modal-container glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "560px",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "#111319",
          border: "1px solid #1E222D",
          borderRadius: "16px",
          padding: "24px",
          color: "#E2E8F0",
          boxShadow: "0 16px 50px rgba(0,0,0,0.75)"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: activeTab === "guide" ? "rgba(245, 158, 11, 0.15)" : activeTab === "create" ? "rgba(0, 255, 135, 0.15)" : "rgba(56, 189, 248, 0.15)",
                border: `1px solid ${activeTab === "guide" ? "rgba(245, 158, 11, 0.3)" : activeTab === "create" ? "rgba(0, 255, 135, 0.3)" : "rgba(56, 189, 248, 0.3)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: activeTab === "guide" ? "#F59E0B" : activeTab === "create" ? "#00FF87" : "#38BDF8",
                fontSize: "20px"
              }}
            >
              <Icon icon={activeTab === "guide" ? "mage:book-open" : activeTab === "create" ? "mage:plus" : "mage:link-2"} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#FFF" }}>
                {activeTab === "create" && "Neuen Server erstellen"}
                {activeTab === "join" && "Einem Server beitreten"}
                {activeTab === "guide" && "Git-Server Hosting Leitfaden"}
              </h3>
              <p style={{ fontSize: "11px", color: "#94A3B8", margin: "2px 0 0 0" }}>
                {activeTab === "create" && "Dezentraler Server mit automatischem Git-Manifest (zeno-server.json)"}
                {activeTab === "join" && "Verbinde dich via Git-Repository, Raw-Manifest oder Invite-Code"}
                {activeTab === "guide" && "Schritt-für-Schritt-Anleitung für GitHub, GitLab und eigene Git-Server"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "20px", display: "flex", alignItems: "center" }}
            title="Schließen"
          >
            <Icon icon="mage:multiply" />
          </button>
        </div>

        {/* 3-Tab Navigation Bar */}
        <div style={{ display: "flex", backgroundColor: "#0D0E12", padding: "4px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #1E222D", gap: "4px" }}>
          <button
            onClick={() => setActiveTab("create")}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: activeTab === "create" ? "#1E222D" : "transparent",
              color: activeTab === "create" ? "#00FF87" : "#94A3B8",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <Icon icon="mage:plus" /> Erstellen
          </button>
          <button
            onClick={() => setActiveTab("join")}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: activeTab === "join" ? "#1E222D" : "transparent",
              color: activeTab === "join" ? "#38BDF8" : "#94A3B8",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <Icon icon="mage:link-2" /> Beitreten
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: activeTab === "guide" ? "#1E222D" : "transparent",
              color: activeTab === "guide" ? "#F59E0B" : "#94A3B8",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <Icon icon="mage:book-open" /> Git-Guide
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: SERVER ERSTELLEN FORM */}
        {/* ======================================================== */}
        {activeTab === "create" && (
          <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Server Icon Picker */}
            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", display: "block", marginBottom: "6px" }}>
                SERVER ICON WÄHLEN
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setServerIcon(icon)}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      border: serverIcon === icon ? "2px solid #00FF87" : "1px solid #1E222D",
                      backgroundColor: serverIcon === icon ? "rgba(0,255,135,0.15)" : "#0D0E12",
                      fontSize: "17px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Server Name & Description */}
            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", display: "block", marginBottom: "6px" }}>
                SERVER NAME *
              </label>
              <input
                type="text"
                placeholder="z. B. DevSecOps Community"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                style={{
                  width: "100%",
                  backgroundColor: "#0D0E12",
                  border: "1px solid #262933",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "12px",
                  color: "#FFF",
                  outline: "none"
                }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", display: "block", marginBottom: "6px" }}>
                BESCHREIBUNG / THEMA
              </label>
              <input
                type="text"
                placeholder="z. B. Dezentraler Hub für WASM, Rust & Security Reviews"
                value={serverDescription}
                onChange={(e) => setServerDescription(e.target.value)}
                style={{
                  width: "100%",
                  backgroundColor: "#0D0E12",
                  border: "1px solid #262933",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "12px",
                  color: "#FFF",
                  outline: "none"
                }}
              />
            </div>

            {/* Git Hosting Bindung */}
            <div style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", borderRadius: "10px", padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#FFF", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Icon icon="mage:code" style={{ color: "#38BDF8" }} />
                  GIT-REPOSITORY BINDUNG (DEZENTRALE ABLAGE)
                </span>
                <span style={{ fontSize: "10px", color: "#00FF87", backgroundColor: "rgba(0,255,135,0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                  Empfohlen
                </span>
              </div>

              {/* Provider Selection */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "12px" }}>
                {(["github", "gitlab", "gitea", "none"] as const).map((prov) => (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => setGitProvider(prov)}
                    style={{
                      padding: "6px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "600",
                      border: gitProvider === prov ? "1px solid #38BDF8" : "1px solid #262933",
                      backgroundColor: gitProvider === prov ? "rgba(56, 189, 248, 0.15)" : "#161922",
                      color: gitProvider === prov ? "#38BDF8" : "#94A3B8",
                      cursor: "pointer"
                    }}
                  >
                    {prov === "github" && "GitHub"}
                    {prov === "gitlab" && "GitLab"}
                    {prov === "gitea" && "Eigener Git"}
                    {prov === "none" && "Nur Lokal"}
                  </button>
                ))}
              </div>

              {gitProvider !== "none" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "10px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>
                      REPOSITORY CLONE/WEB URL
                    </label>
                    <input
                      type="text"
                      placeholder={gitProvider === "github" ? "https://github.com/org/zeno-server" : gitProvider === "gitlab" ? "https://gitlab.com/org/zeno-server" : "https://git.meinedomain.de/org/zeno-server"}
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      style={{
                        width: "100%",
                        backgroundColor: "#161922",
                        border: "1px solid #262933",
                        borderRadius: "6px",
                        padding: "8px 10px",
                        fontSize: "11px",
                        color: "#FFF",
                        fontFamily: "monospace",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "10px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>
                        BRANCH
                      </label>
                      <input
                        type="text"
                        value={repoBranch}
                        onChange={(e) => setRepoBranch(e.target.value)}
                        style={{
                          width: "100%",
                          backgroundColor: "#161922",
                          border: "1px solid #262933",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          fontSize: "11px",
                          color: "#FFF",
                          fontFamily: "monospace",
                          outline: "none"
                        }}
                      />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label style={{ fontSize: "10px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>
                        MANIFEST DATEI
                      </label>
                      <input
                        type="text"
                        value="zeno-server.json"
                        disabled
                        style={{
                          width: "100%",
                          backgroundColor: "#161922",
                          border: "1px solid #262933",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          fontSize: "11px",
                          color: "#64748B",
                          fontFamily: "monospace"
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* E2EE Toggle */}
            <div style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", borderRadius: "10px", padding: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Icon icon="mage:lock" style={{ color: "#00FF87", fontSize: "20px" }} />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#FFF" }}>AES-256 E2EE Verschlüsselung</div>
                  <div style={{ fontSize: "10px", color: "#94A3B8" }}>Inhalte & Kanäle werden kryptografisch abgesichert</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isEncrypted}
                onChange={(e) => setIsEncrypted(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#00FF87", cursor: "pointer" }}
              />
            </div>

            {/* Manifest & CLI Expanders */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setShowManifestPreview(!showManifestPreview)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #1E222D",
                  backgroundColor: "#0D0E12",
                  color: "#94A3B8",
                  fontSize: "11px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <Icon icon="mage:code" /> {showManifestPreview ? "Manifest verbergen" : "zeno-server.json Vorschau"}
              </button>
              <button
                type="button"
                onClick={() => setShowGitCommands(!showGitCommands)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #1E222D",
                  backgroundColor: "#0D0E12",
                  color: "#94A3B8",
                  fontSize: "11px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <Icon icon="mage:terminal" /> {showGitCommands ? "Befehle verbergen" : "Git CLI Befehle"}
              </button>
            </div>

            {/* Live Manifest Preview Box */}
            {showManifestPreview && (
              <div style={{ backgroundColor: "#090A0D", border: "1px solid #1E222D", borderRadius: "8px", padding: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "10px", color: "#64748B", fontFamily: "monospace" }}>zeno-server.json (Auto-generiert)</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={handleCopyManifest}
                      style={{ background: "#161922", border: "1px solid #262933", color: "#E2E8F0", padding: "3px 8px", borderRadius: "4px", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Icon icon="mage:copy" /> Kopieren
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadManifest}
                      style={{ background: "#161922", border: "1px solid #262933", color: "#00FF87", padding: "3px 8px", borderRadius: "4px", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Icon icon="mage:download" /> Download
                    </button>
                  </div>
                </div>
                <pre style={{ margin: 0, fontSize: "10px", maxHeight: "160px", overflowY: "auto", color: "#A9B7C6", fontFamily: "monospace", lineHeight: "1.4" }}>
                  {manifestJsonString}
                </pre>
              </div>
            )}

            {/* Git CLI Instructions Box */}
            {showGitCommands && (
              <div style={{ backgroundColor: "#090A0D", border: "1px solid #1E222D", borderRadius: "8px", padding: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "10px", color: "#64748B", fontFamily: "monospace" }}>Bash / PowerShell Befehle</span>
                  <button
                    type="button"
                    onClick={handleCopyGitCommands}
                    style={{ background: "#161922", border: "1px solid #262933", color: "#38BDF8", padding: "3px 8px", borderRadius: "4px", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <Icon icon="mage:copy" /> Befehle kopieren
                  </button>
                </div>
                <pre style={{ margin: 0, fontSize: "10px", maxHeight: "140px", overflowY: "auto", color: "#38BDF8", fontFamily: "monospace", lineHeight: "1.4" }}>
                  {gitCliCommands}
                </pre>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={handleDownloadManifest}
                style={{
                  flex: 1,
                  backgroundColor: "#161922",
                  border: "1px solid #262933",
                  color: "#E2E8F0",
                  padding: "12px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <Icon icon="mage:download" /> Manifest exportieren
              </button>
              <button
                type="submit"
                style={{
                  flex: 2,
                  backgroundColor: "#00FF87",
                  color: "#08090C",
                  border: "none",
                  padding: "12px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <Icon icon="mage:plus" /> Server in Zeno starten 🚀
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SERVER BEITRETEN FORM */}
        {/* ======================================================== */}
        {activeTab === "join" && (
          <form onSubmit={handleJoinSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", display: "block", marginBottom: "6px" }}>
                EINLADUNGS-CODE, GIT-URL ODER ZENO:// LINK *
              </label>
              <input
                type="text"
                placeholder="z. B. https://github.com/my-team/zeno-community oder zeno-invite-x8k2"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                style={{
                  width: "100%",
                  backgroundColor: "#0D0E12",
                  border: "1px solid #262933",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "12px",
                  color: "#FFF",
                  outline: "none"
                }}
                required
              />
            </div>

            {/* Smart Detection Badge */}
            {detectedJoinType && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(56, 189, 248, 0.1)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  color: "#38BDF8"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Icon icon="mage:shield-check" />
                  <span>
                    {detectedJoinType === "github" && "GitHub Repository erkannt (zeno-server.json wird automatisch aufgelöst)"}
                    {detectedJoinType === "gitlab" && "GitLab Repository erkannt (Raw-Endpunkt wird aufgelöst)"}
                    {detectedJoinType === "gitea" && "Gitea / Codeberg Repository erkannt"}
                    {detectedJoinType === "raw_json" && "Vollständiges JSON-Manifest erkannt"}
                    {detectedJoinType === "custom_url" && "HTTP(S) Manifest-URL erkannt"}
                    {detectedJoinType === "zeno_protocol" && "Zeno P2P Deep-Link erkannt"}
                    {detectedJoinType === "invite_code" && "Klassischer Zeno Invite-Code erkannt"}
                  </span>
                </div>
              </div>
            )}

            <div style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", borderRadius: "10px", padding: "12px", fontSize: "11px", color: "#94A3B8", lineHeight: "1.4" }}>
              💡 <b style={{ color: "#FFF" }}>Tipp:</b> Du kannst direkt die GitHub- oder GitLab-URL der Server-Community einfügen. Zeno ruft die `zeno-server.json` dezentral ab und initialisiert alle Kanäle automatisch!
            </div>

            <button
              type="submit"
              disabled={isResolving}
              style={{
                backgroundColor: "#38BDF8",
                color: "#08090C",
                border: "none",
                padding: "12px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: isResolving ? "not-allowed" : "pointer",
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: isResolving ? 0.7 : 1
              }}
            >
              <Icon icon={isResolving ? "mage:refresh" : "mage:link-2"} className={isResolving ? "spin-animation" : ""} />
              {isResolving ? "Lade Server-Manifest..." : "Server beitreten & verbinden"}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 3: GIT-SERVER HOSTING GUIDE */}
        {/* ======================================================== */}
        {activeTab === "guide" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Guide Provider Selector */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                onClick={() => setGuideProvider("github")}
                style={{
                  flex: 1,
                  padding: "6px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "600",
                  border: guideProvider === "github" ? "1px solid #F59E0B" : "1px solid #1E222D",
                  backgroundColor: guideProvider === "github" ? "rgba(245, 158, 11, 0.15)" : "#0D0E12",
                  color: guideProvider === "github" ? "#F59E0B" : "#94A3B8",
                  cursor: "pointer"
                }}
              >
                🐙 GitHub Setup
              </button>
              <button
                type="button"
                onClick={() => setGuideProvider("gitlab")}
                style={{
                  flex: 1,
                  padding: "6px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "600",
                  border: guideProvider === "gitlab" ? "1px solid #F59E0B" : "1px solid #1E222D",
                  backgroundColor: guideProvider === "gitlab" ? "rgba(245, 158, 11, 0.15)" : "#0D0E12",
                  color: guideProvider === "gitlab" ? "#F59E0B" : "#94A3B8",
                  cursor: "pointer"
                }}
              >
                🦊 GitLab Setup
              </button>
              <button
                type="button"
                onClick={() => setGuideProvider("selfhost")}
                style={{
                  flex: 1,
                  padding: "6px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "600",
                  border: guideProvider === "selfhost" ? "1px solid #F59E0B" : "1px solid #1E222D",
                  backgroundColor: guideProvider === "selfhost" ? "rgba(245, 158, 11, 0.15)" : "#0D0E12",
                  color: guideProvider === "selfhost" ? "#F59E0B" : "#94A3B8",
                  cursor: "pointer"
                }}
              >
                🦺 Eigener Server (Gitea)
              </button>
            </div>

            {/* Guide Content */}
            <div style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", borderRadius: "10px", padding: "14px", maxHeight: "260px", overflowY: "auto", fontSize: "11px", lineHeight: "1.5", color: "#CBD5E1" }}>
              {guideProvider === "github" && (
                <div>
                  <h4 style={{ color: "#FFF", margin: "0 0 6px 0", fontSize: "13px" }}>🐙 Zeno-Server auf GitHub hosten:</h4>
                  <ol style={{ paddingLeft: "18px", margin: "0 0 10px 0" }}>
                    <li>Erstelle auf GitHub ein neues Repository (z. B. <code>zeno-server-data</code>).</li>
                    <li>Wähle <b>Public</b> (oder Private mit Access Token).</li>
                    <li>Kopiere das generierte <code>zeno-server.json</code> Manifest aus Tab 1.</li>
                    <li>Committe und pushe die Datei in den <code>main</code>-Branch.</li>
                  </ol>
                  <p style={{ margin: "6px 0", color: "#94A3B8" }}>
                    Teile einfach deine GitHub-URL mit Mitgliedern: <code>https://github.com/dein-user/zeno-server-data</code>. Zeno lädt das Manifest direkt via Raw-CDN!
                  </p>
                </div>
              )}

              {guideProvider === "gitlab" && (
                <div>
                  <h4 style={{ color: "#FFF", margin: "0 0 6px 0", fontSize: "13px" }}>🦊 Zeno-Server auf GitLab hosten:</h4>
                  <ol style={{ paddingLeft: "18px", margin: "0 0 10px 0" }}>
                    <li>Erstelle ein neues Projekt auf GitLab.com oder deiner GitLab-Instanz.</li>
                    <li>Setze das Projekt auf <b>Public</b> oder erstelle einen Read-Only Deploy Token.</li>
                    <li>Lade die <code>zeno-server.json</code> ins Root-Verzeichnis hoch.</li>
                  </ol>
                  <p style={{ margin: "6px 0", color: "#94A3B8" }}>
                    Zeno löst GitLab-Repositories automatisch auf den Raw-Endpunkt <code>/-/raw/main/zeno-server.json</code> auf.
                  </p>
                </div>
              )}

              {guideProvider === "selfhost" && (
                <div>
                  <h4 style={{ color: "#FFF", margin: "0 0 6px 0", fontSize: "13px" }}>🦺 Eigener Git-Server (Gitea / Forgejo / Bare Git):</h4>
                  <p style={{ margin: "0 0 8px 0" }}>
                    Für maximale Unabhängigkeit von US-Cloudbetreibern und Immunität gegen Chatkontroll-Gesetze:
                  </p>
                  <ol style={{ paddingLeft: "18px", margin: "0 0 10px 0" }}>
                    <li>Erstelle ein Repo auf deiner selbst gehosteten Gitea- oder Forgejo-Instanz.</li>
                    <li>Pushe die <code>zeno-server.json</code>.</li>
                    <li>Nutze die direkte Repo-URL (z. B. <code>https://git.meinedomain.de/alice/zeno-server</code>).</li>
                  </ol>
                  <p style={{ margin: "6px 0", color: "#00FF87" }}>
                    Vollständige Nginx/Caddy-Konfigurationen findest du in der Datei <b>SERVER_GIT_GUIDE.md</b> im Projektverzeichnis!
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("create")}
              style={{
                backgroundColor: "#F59E0B",
                color: "#08090C",
                border: "none",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <Icon icon="mage:plus" /> Jetzt Server erstellen & Manifest generieren
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
