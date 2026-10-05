import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Editor from "@monaco-editor/react";
import { IdeFile, SystemCompilersStatus } from "../../types";
import { getSystemCompilers, writeWorkspaceFile } from "../../services/ideBackendService";

interface ZenoIdeProps {
  ideSidebarTab: "explorer" | "git" | "extensions" | "compilers" | "gitlens";
  ideFiles: IdeFile[];
  ideOpenTabs: string[];
  ideActiveFilePath: string;
  ideGitChanges: string[];
  ideGitMessage: string;
  ideExtensions: Array<{ id: string; name: string; description: string; downloads: string; installed: boolean; icon: string }>;
  ideExtensionsSearchQuery: string;
  isIdeConsoleExpanded: boolean;
  ideConsoleOutput: string;
  theme: "dark" | "light";
  activeIdeFile: IdeFile | undefined;
  setIdeSidebarTab: (tab: "explorer" | "git" | "extensions" | "compilers" | "gitlens") => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIdeNewItemType: (type: "file" | "folder") => void;
  setIdeNewItemParentPath: (path: string) => void;
  setIsIdeNewItemModalOpen: (open: boolean) => void;
  setIsIdeProjectWizardOpen: (open: boolean) => void;
  renderIdeFileTree: () => React.ReactNode;
  setIdeGitMessage: (msg: string) => void;
  handleIdeGitCommit: () => void;
  setIdeExtensionsSearchQuery: (q: string) => void;
  handleExtensionInstall: (id: string) => void;
  handleExtensionUninstall: (id: string) => void;
  handleIdeFileSelect: (path: string) => void;
  handleIdeFileClose: (path: string, e: React.MouseEvent) => void;
  handleIdeRun: () => void;
  handleIdeCodeChange: (code: string | undefined) => void;
  setupZenoIntelliSense: (monaco: any) => void;
  setIsIdeConsoleExpanded: (expanded: boolean) => void;
  setIdeConsoleOutput: (out: string) => void;
  onReturnToDashboard?: () => void;
  showToast: (msg: string) => void;
}

export const ZenoIde: React.FC<ZenoIdeProps> = ({
  ideSidebarTab,
  ideFiles: _ideFiles,
  ideOpenTabs,
  ideActiveFilePath,
  ideGitChanges,
  ideGitMessage,
  ideExtensions,
  ideExtensionsSearchQuery,
  isIdeConsoleExpanded,
  ideConsoleOutput,
  theme,
  activeIdeFile,
  setIdeSidebarTab,
  setIsSettingsOpen: _setIsSettingsOpen,
  setIdeNewItemType,
  setIdeNewItemParentPath: _setIdeNewItemParentPath,
  setIsIdeNewItemModalOpen,
  setIsIdeProjectWizardOpen,
  renderIdeFileTree,
  setIdeGitMessage,
  handleIdeGitCommit,
  setIdeExtensionsSearchQuery,
  handleExtensionInstall,
  handleExtensionUninstall,
  handleIdeFileSelect,
  handleIdeFileClose,
  handleIdeRun,
  handleIdeCodeChange,
  setupZenoIntelliSense,
  setIsIdeConsoleExpanded,
  setIdeConsoleOutput,
  onReturnToDashboard,
  showToast
}) => {
  const [activeBottomTab, setActiveBottomTab] = useState<"terminal" | "compilers" | "problems">("terminal");
  const [compilersStatus, setCompilersStatus] = useState<SystemCompilersStatus | null>(null);
  const [isLoadingCompilers, setIsLoadingCompilers] = useState<boolean>(false);
  const [externalPortMode, setExternalPortMode] = useState<boolean>(false);
  const [externalIdeUrl, setExternalIdeUrl] = useState<string>("http://localhost:3050");
  const [customPortInput, setCustomPortInput] = useState<string>("http://localhost:3050");
  const [isExternalServerAlive, setIsExternalServerAlive] = useState<boolean>(false);

  // Fetch host compilers & runtimes via Rust backend
  useEffect(() => {
    let isMounted = true;
    const fetchCompilers = async () => {
      setIsLoadingCompilers(true);
      try {
        const status = await getSystemCompilers();
        if (isMounted) setCompilersStatus(status);
      } catch (e) {
        console.warn("Fehler beim Abrufen der System-Compiler:", e);
      } finally {
        if (isMounted) setIsLoadingCompilers(false);
      }
    };
    fetchCompilers();
    return () => { isMounted = false; };
  }, []);

  // Check health of external ported IDE server
  useEffect(() => {
    const checkExternalServer = async () => {
      try {
        const res = await fetch("http://localhost:3050/health");
        setIsExternalServerAlive(res.ok);
      } catch (e) {
        setIsExternalServerAlive(false);
      }
    };
    checkExternalServer();
    const interval = setInterval(checkExternalServer, 5000);
    return () => clearInterval(interval);
  }, []);

  // Quick save via Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (activeIdeFile) {
          writeWorkspaceFile(activeIdeFile.path, activeIdeFile.code);
          showToast(`✓ "${activeIdeFile.name}" lokal via Rust gesichert.`);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleIdeRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIdeFile, handleIdeRun, showToast]);

  const handleEditorBeforeMount = (monaco: any) => {
    // Register Zeno JetBrains-aligned themes
    monaco.editor.defineTheme("zeno-ide-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6C707E", fontStyle: "italic" },
        { token: "keyword", foreground: "CF8E6D", fontStyle: "bold" },
        { token: "string", foreground: "6A8759" },
        { token: "number", foreground: "2AACB8" },
        { token: "type", foreground: "56A8F5" },
        { token: "function", foreground: "57B6C2" },
        { token: "variable", foreground: "BCBEC4" }
      ],
      colors: {
        "editor.background": "#1E1F22",
        "editor.foreground": "#BCBEC4",
        "editorGutter.background": "#1E1F22",
        "editor.lineHighlightBackground": "#26282E",
        "editor.lineHighlightBorder": "#2E3136",
        "editorCursor.foreground": "#3574F0",
        "editorLineNumber.foreground": "#4E5157",
        "editorLineNumber.activeForeground": "#BCBEC4",
        "editor.selectionBackground": "#214283"
      }
    });

    monaco.editor.defineTheme("zeno-ide-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "8C9099", fontStyle: "italic" },
        { token: "keyword", foreground: "0033B3", fontStyle: "bold" },
        { token: "string", foreground: "067D17" },
        { token: "number", foreground: "1750EB" },
        { token: "function", foreground: "00627A" }
      ],
      colors: {
        "editor.background": "#FFFFFF",
        "editor.foreground": "#1E1F22",
        "editorGutter.background": "#FFFFFF",
        "editor.lineHighlightBackground": "#F0F2F5",
        "editorCursor.foreground": "#0066CC",
        "editorLineNumber.foreground": "#ADADAD",
        "editorLineNumber.activeForeground": "#1E1F22"
      }
    });
  };

  const getFileIcon = (lang: string, name: string) => {
    if (name.endsWith(".rs")) return "vscode-icons:file-type-rust";
    if (name.endsWith(".py")) return "vscode-icons:file-type-python";
    if (name.endsWith(".js") || name.endsWith(".jsx")) return "vscode-icons:file-type-js";
    if (name.endsWith(".ts") || name.endsWith(".tsx")) return "vscode-icons:file-type-typescript-official";
    if (name.endsWith(".json")) return "vscode-icons:file-type-json";
    if (name.endsWith(".md")) return "vscode-icons:file-type-markdown";
    if (name.endsWith(".css")) return "vscode-icons:file-type-css";
    if (name.endsWith(".html")) return "vscode-icons:file-type-html";
    if (name.endsWith(".toml")) return "vscode-icons:file-type-toml";
    if (lang === "rust") return "vscode-icons:file-type-rust";
    if (lang === "python") return "vscode-icons:file-type-python";
    return "mage:file-records";
  };

  return (
    <div className="zeno-ide-workspace" style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", overflow: "hidden" }}>
      
      {/* 1. JETBRAINS-ALIGNED TOP WORKBENCH HEADER */}
      <header className="zeno-ide-header" style={{ height: "42px", backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", flexShrink: 0, zIndex: 10 }}>
        {/* Left: Dashboard Return & Breadcrumbs */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          {onReturnToDashboard && (
            <button
              onClick={onReturnToDashboard}
              className="settings-btn"
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "4px 10px", height: "28px" }}
              title="Zurück zum Zeno Dashboard & Chat-Kanälen"
            >
              <Icon icon="mage:arrow-left" /> Zurück
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "6px", borderLeft: "1px solid var(--border-color)", paddingLeft: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "5px" }}>
              <Icon icon="mage:code" style={{ color: "var(--accent-color)" }} /> ZENO IDE
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>/</span>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {activeIdeFile ? activeIdeFile.path : "Keine Datei geöffnet"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "2px 8px", fontSize: "10px", color: "var(--text-muted)" }}>
            <Icon icon="mage:git-branch" style={{ color: "var(--accent-color)" }} />
            <span>main</span>
          </div>
        </div>

        {/* Center: Status & Porting Notice */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {externalPortMode ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "var(--radius-sm)", padding: "2px 10px", fontSize: "11px", color: "#38BDF8" }}>
              <Icon icon="mage:link" />
              <span>Externer IDE-Port aktiv: <strong>{externalIdeUrl}</strong></span>
              <button
                onClick={() => setExternalPortMode(false)}
                style={{ background: "none", border: "none", color: "#38BDF8", cursor: "pointer", fontWeight: "700", marginLeft: "4px" }}
                title="Zurück zur nativen Zeno IDE"
              >
                ✕
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-muted)" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#00FF87", display: "inline-block" }} />
              <span>Rust Core Backend Aktiv (100% Native Execution)</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* External IDE Port Toggle */}
          <button
            onClick={() => setExternalPortMode(!externalPortMode)}
            className={`settings-btn ${externalPortMode ? "primary" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "4px 10px", height: "28px" }}
            title="Eigene IDE über Porting (z. B. localhost:3050 oder Code-OSS) einbinden"
          >
            <Icon icon="mage:terminal" />
            {externalPortMode ? "Native Zeno IDE" : "Eigene IDE / Port"}
          </button>

          {/* Native Rust Run Button */}
          <button
            onClick={handleIdeRun}
            className="settings-btn primary"
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "4px 14px", height: "28px", backgroundColor: "#00FF87", color: "#08090C", fontWeight: "700" }}
            title="Code über das Rust-Backend nativ ausführen (Ctrl+Enter)"
          >
            <Icon icon="mage:play" /> Ausführen (Rust)
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKBENCH LAYOUT */}
      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
        {externalPortMode ? (
          /* PORTED / EXTERNAL IDE FRAME */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", backgroundColor: "var(--bg-primary)" }}>
            <div style={{ padding: "8px 14px", backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Server-URL / Port:</span>
                <input
                  type="text"
                  value={customPortInput}
                  onChange={(e) => setCustomPortInput(e.target.value)}
                  style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", padding: "3px 8px", fontSize: "11px", width: "240px", fontFamily: "var(--font-mono)" }}
                />
                <button
                  onClick={() => setExternalIdeUrl(customPortInput)}
                  className="settings-btn"
                  style={{ fontSize: "10px", padding: "3px 8px" }}
                >
                  Verbinden
                </button>
              </div>
              <span style={{ fontSize: "10px", color: isExternalServerAlive ? "#00FF87" : "var(--text-muted)" }}>
                {isExternalServerAlive ? "● Port 3050 erreichbar" : "○ Warten auf externen Server..."}
              </span>
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <iframe
                src={externalIdeUrl}
                title="External Ported IDE"
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </div>
          </div>
        ) : (
          /* NATIVE DOCKED ZENO IDE WORKBENCH */
          <>
            {/* Activity Bar */}
            <nav className="ide-activity-bar" style={{ width: "48px", backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", padding: "8px 0", flexShrink: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "100%" }}>
                <button
                  className={`ide-activity-btn ${ideSidebarTab === "explorer" ? "active" : ""}`}
                  onClick={() => setIdeSidebarTab("explorer")}
                  title="Explorer (Dateibaum)"
                  style={{ width: "36px", height: "36px", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", background: ideSidebarTab === "explorer" ? "rgba(53, 116, 240, 0.15)" : "transparent", color: ideSidebarTab === "explorer" ? "var(--accent-color)" : "var(--text-muted)" }}
                >
                  <Icon icon="mage:file-records" style={{ fontSize: "18px" }} />
                </button>

                <button
                  className={`ide-activity-btn ${ideSidebarTab === "git" ? "active" : ""}`}
                  onClick={() => setIdeSidebarTab("git")}
                  title="Source Control (Git)"
                  style={{ width: "36px", height: "36px", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", position: "relative", background: ideSidebarTab === "git" ? "rgba(53, 116, 240, 0.15)" : "transparent", color: ideSidebarTab === "git" ? "var(--accent-color)" : "var(--text-muted)" }}
                >
                  <Icon icon="mage:git-branch" style={{ fontSize: "18px" }} />
                  {ideGitChanges.length > 0 && (
                    <span style={{ position: "absolute", top: "4px", right: "4px", width: "7px", height: "7px", backgroundColor: "var(--accent-color)", borderRadius: "50%" }} />
                  )}
                </button>

                <button
                  className={`ide-activity-btn ${ideSidebarTab === "compilers" ? "active" : ""}`}
                  onClick={() => setIdeSidebarTab("compilers")}
                  title="System & Compiler (Rust, Python, Node)"
                  style={{ width: "36px", height: "36px", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", background: ideSidebarTab === "compilers" ? "rgba(53, 116, 240, 0.15)" : "transparent", color: ideSidebarTab === "compilers" ? "var(--accent-color)" : "var(--text-muted)" }}
                >
                  <Icon icon="mage:cpu" style={{ fontSize: "18px" }} />
                </button>

                <button
                  className={`ide-activity-btn ${ideSidebarTab === "extensions" ? "active" : ""}`}
                  onClick={() => setIdeSidebarTab("extensions")}
                  title="Open VSX Extensions Marketplace"
                  style={{ width: "36px", height: "36px", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", background: ideSidebarTab === "extensions" ? "rgba(53, 116, 240, 0.15)" : "transparent", color: ideSidebarTab === "extensions" ? "var(--accent-color)" : "var(--text-muted)" }}
                >
                  <Icon icon="mage:box-3d" style={{ fontSize: "18px" }} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => showToast("Zeno IDE Theme wird automatisch über die Zeno Design-Tokens gesteuert.")}
                  title="Theme & Style Information"
                  style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  <Icon icon="mage:palette" style={{ fontSize: "16px" }} />
                </button>
              </div>
            </nav>

            {/* Sidebar Tool Window */}
            <aside className="ide-sidebar" style={{ width: "260px", backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
              
              {/* TAB 1: EXPLORER */}
              {ideSidebarTab === "explorer" && (
                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
                      EXPLORER
                    </span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        onClick={() => { setIdeNewItemType("file"); setIsIdeNewItemModalOpen(true); }}
                        className="ide-sidebar-btn"
                        title="Neue Datei erstellen"
                      >
                        <Icon icon="mage:file-plus" />
                      </button>
                      <button
                        onClick={() => { setIdeNewItemType("folder"); setIsIdeNewItemModalOpen(true); }}
                        className="ide-sidebar-btn"
                        title="Neuen Ordner erstellen"
                      >
                        <Icon icon="mage:folder-plus" />
                      </button>
                      <button
                        onClick={() => setIsIdeProjectWizardOpen(true)}
                        className="ide-sidebar-btn"
                        title="Projektvorlage Wizard"
                      >
                        <Icon icon="mage:sparkles" style={{ color: "var(--accent-color)" }} />
                      </button>
                    </div>
                  </div>

                  <div className="ide-tree-container" style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
                    {renderIdeFileTree()}
                  </div>
                </div>
              )}

              {/* TAB 2: GIT SOURCE CONTROL */}
              {ideSidebarTab === "git" && (
                <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "14px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "10px" }}>
                    SOURCE CONTROL (GIT)
                  </span>
                  <textarea
                    placeholder="Commit-Nachricht eingeben..."
                    value={ideGitMessage}
                    onChange={(e) => setIdeGitMessage(e.target.value)}
                    style={{ width: "100%", height: "64px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "8px", fontSize: "11px", color: "var(--text-primary)", outline: "none", marginBottom: "8px", resize: "none", boxSizing: "border-box" }}
                  />
                  <button
                    onClick={handleIdeGitCommit}
                    className="settings-btn primary"
                    style={{ width: "100%", fontSize: "11px", padding: "6px", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <Icon icon="mage:git-commit" /> Commit via Rust Core
                  </button>

                  <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "6px", textTransform: "uppercase" }}>
                    Änderungen ({ideGitChanges.length})
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {ideGitChanges.map((change, idx) => (
                      <div key={idx} style={{ fontSize: "11px", color: "#00FF87", padding: "4px 8px", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: "6px", border: "1px solid var(--border-color)" }}>
                        <span style={{ fontWeight: "700" }}>M</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{change}</span>
                      </div>
                    ))}
                    {ideGitChanges.length === 0 && (
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "14px" }}>
                        Arbeitsverzeichnis ist sauber.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SYSTEM & COMPILERS (RUST BACKEND POWERED) */}
              {ideSidebarTab === "compilers" && (
                <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "14px", overflowY: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
                      NATIVE RUNTIMES (RUST)
                    </span>
                    <button
                      onClick={async () => {
                        setIsLoadingCompilers(true);
                        const s = await getSystemCompilers();
                        setCompilersStatus(s);
                        setIsLoadingCompilers(false);
                        showToast("Host-Compiler aktualisiert.");
                      }}
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                      title="Neu prüfen"
                    >
                      <Icon icon={isLoadingCompilers ? "mage:spinner" : "mage:reload"} />
                    </button>
                  </div>

                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px", lineHeight: "1.4" }}>
                    WASM-Laufzeiten wurden auf Eis gelegt. Zeno nutzt nun 100% native Rust-Backend-Ausführung.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {/* Rust */}
                    <div style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Icon icon="vscode-icons:file-type-rust" /> Rust (cargo/rustc)
                        </span>
                        <span style={{ fontSize: "10px", color: compilersStatus?.rustAvailable ? "#00FF87" : "#EF4444", fontWeight: "600" }}>
                          {compilersStatus?.rustAvailable ? "Verfügbar" : "Nicht installiert"}
                        </span>
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {compilersStatus?.rustVersion || "Natives Rust Toolchain"}
                      </div>
                    </div>

                    {/* Python */}
                    <div style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Icon icon="vscode-icons:file-type-python" /> Python 3
                        </span>
                        <span style={{ fontSize: "10px", color: compilersStatus?.pythonAvailable ? "#00FF87" : "#EF4444", fontWeight: "600" }}>
                          {compilersStatus?.pythonAvailable ? "Verfügbar" : "Nicht installiert"}
                        </span>
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {compilersStatus?.pythonVersion || "Python Interpreter"}
                      </div>
                    </div>

                    {/* Node.js */}
                    <div style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Icon icon="vscode-icons:file-type-node" /> Node.js / V8
                        </span>
                        <span style={{ fontSize: "10px", color: compilersStatus?.nodeAvailable ? "#00FF87" : "#EF4444", fontWeight: "600" }}>
                          {compilersStatus?.nodeAvailable ? "Verfügbar" : "Nicht installiert"}
                        </span>
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {compilersStatus?.nodeVersion || "Node.js Engine"}
                      </div>
                    </div>

                    {/* Git */}
                    <div style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Icon icon="mage:git-branch" style={{ color: "var(--accent-color)" }} /> Git Core
                        </span>
                        <span style={{ fontSize: "10px", color: compilersStatus?.gitAvailable ? "#00FF87" : "#EF4444", fontWeight: "600" }}>
                          {compilersStatus?.gitAvailable ? "Verfügbar" : "Nicht installiert"}
                        </span>
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {compilersStatus?.gitVersion || "Git System CLI"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: EXTENSIONS */}
              {ideSidebarTab === "extensions" && (
                <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
                      EXTENSIONS
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--accent-color)", backgroundColor: "rgba(53, 116, 240, 0.12)", padding: "2px 6px", borderRadius: "var(--radius-sm)" }}>
                      {ideExtensions.filter((e) => e.installed).length} Aktiv
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Erweiterungen suchen..."
                    value={ideExtensionsSearchQuery}
                    onChange={(e) => setIdeExtensionsSearchQuery(e.target.value)}
                    style={{ width: "100%", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "6px 8px", fontSize: "11px", color: "var(--text-primary)", outline: "none", marginBottom: "10px", boxSizing: "border-box" }}
                  />
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {ideExtensions
                      .filter(
                        (ext) =>
                          ext.name.toLowerCase().includes(ideExtensionsSearchQuery.toLowerCase()) ||
                          ext.description.toLowerCase().includes(ideExtensionsSearchQuery.toLowerCase())
                      )
                      .map((ext) => (
                        <div key={ext.id} style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "var(--radius-md)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                            <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                              <Icon icon={ext.icon || "mage:box-3d"} style={{ color: "var(--accent-color)", fontSize: "14px" }} />
                              <span>{ext.name}</span>
                            </div>
                            <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>⬇ {ext.downloads}</span>
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)", margin: "2px 0 8px 0", lineHeight: "1.3" }}>
                            {ext.description}
                          </div>
                          <button
                            onClick={() => (ext.installed ? handleExtensionUninstall(ext.id) : handleExtensionInstall(ext.id))}
                            className={`settings-btn ${ext.installed ? "" : "primary"}`}
                            style={{ fontSize: "10px", padding: "3px 8px" }}
                          >
                            {ext.installed ? "Deinstallieren" : "Installieren"}
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </aside>

            {/* Editor Container */}
            <main className="ide-editor-container" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", backgroundColor: "var(--bg-primary)", minWidth: 0 }}>
              
              {/* JetBrains-Style Tabs Bar */}
              <div className="ide-tabs-bar" style={{ display: "flex", backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", height: "35px", alignItems: "flex-end", paddingLeft: "8px", overflowX: "auto", flexShrink: 0 }}>
                {ideOpenTabs.map((tabPath) => {
                  const isActive = tabPath === ideActiveFilePath;
                  const fileName = tabPath.split("/").pop() || tabPath;
                  const isDirty = ideGitChanges.includes(tabPath);
                  const fileLang = activeIdeFile?.path === tabPath ? activeIdeFile.language : "";
                  return (
                    <div
                      key={tabPath}
                      onClick={() => handleIdeFileSelect(tabPath)}
                      className={`ide-tab ${isActive ? "active" : ""}`}
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 12px", height: "30px", backgroundColor: isActive ? "var(--bg-primary)" : "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderBottom: isActive ? "1px solid var(--bg-primary)" : "none", borderTop: isActive ? "2px solid var(--accent-color)" : "1px solid var(--border-color)", borderRadius: "4px 4px 0 0", fontSize: "12px", color: isActive ? "var(--text-primary)" : "var(--text-muted)", cursor: "pointer", marginRight: "4px", whiteSpace: "nowrap", userSelect: "none" }}
                    >
                      <Icon icon={getFileIcon(fileLang, fileName)} style={{ fontSize: "14px" }} />
                      <span>{fileName}</span>
                      {isDirty && (
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent-color)" }} title="Ungespeicherte Änderungen" />
                      )}
                      <button
                        onClick={(e) => handleIdeFileClose(tabPath, e)}
                        className="ide-tab-close"
                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                        title="Schließen"
                      >
                        <Icon icon="mage:multiply" style={{ fontSize: "11px" }} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Monaco Editor Frame */}
              <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
                {activeIdeFile && !activeIdeFile.isFolder ? (
                  <Editor
                    height="100%"
                    language={activeIdeFile.language}
                    theme={theme === "light" ? "zeno-ide-light" : "zeno-ide-dark"}
                    beforeMount={handleEditorBeforeMount}
                    value={activeIdeFile.code}
                    onChange={handleIdeCodeChange}
                    onMount={(_, monaco) => setupZenoIntelliSense(monaco)}
                    options={{
                      minimap: { enabled: true, scale: 0.75 },
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                      fontLigatures: true,
                      automaticLayout: true,
                      renderLineHighlight: "all",
                      cursorBlinking: "smooth",
                      padding: { top: 10, bottom: 10 },
                      scrollBeyondLastLine: false
                    }}
                  />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", gap: "10px" }}>
                    <Icon icon="mage:code" style={{ fontSize: "42px", opacity: 0.4 }} />
                    <p style={{ fontSize: "13px" }}>Wähle eine Datei im Explorer links aus, um sie in der Zeno IDE zu bearbeiten.</p>
                  </div>
                )}
              </div>

              {/* DOCKED BOTTOM PANEL (TERMINAL / OUTPUT / SYSTEM) */}
              <div className="ide-console" style={{ backgroundColor: "var(--bg-secondary)", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
                {/* Header */}
                <div style={{ height: "32px", padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--bg-tertiary)", borderBottom: isIdeConsoleExpanded ? "1px solid var(--border-color)" : "none", userSelect: "none" }}>
                  <div style={{ display: "flex", gap: "16px", fontSize: "11px", fontWeight: "700" }}>
                    <span
                      onClick={() => { setActiveBottomTab("terminal"); setIsIdeConsoleExpanded(true); }}
                      style={{ color: activeBottomTab === "terminal" ? "var(--accent-color)" : "var(--text-muted)", cursor: "pointer", borderBottom: activeBottomTab === "terminal" ? "2px solid var(--accent-color)" : "none", paddingBottom: "2px" }}
                    >
                      RUST CORE RUNNER & TERMINAL
                    </span>
                    <span
                      onClick={() => { setActiveBottomTab("compilers"); setIsIdeConsoleExpanded(true); }}
                      style={{ color: activeBottomTab === "compilers" ? "var(--accent-color)" : "var(--text-muted)", cursor: "pointer", borderBottom: activeBottomTab === "compilers" ? "2px solid var(--accent-color)" : "none", paddingBottom: "2px" }}
                    >
                      SYSTEM TOOLCHAINS
                    </span>
                    <span
                      onClick={() => { setActiveBottomTab("problems"); setIsIdeConsoleExpanded(true); }}
                      style={{ color: activeBottomTab === "problems" ? "var(--accent-color)" : "var(--text-muted)", cursor: "pointer", borderBottom: activeBottomTab === "problems" ? "2px solid var(--accent-color)" : "none", paddingBottom: "2px" }}
                    >
                      PROBLEME (0)
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {isIdeConsoleExpanded && (
                      <button
                        onClick={() => setIdeConsoleOutput("")}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "11px" }}
                        title="Ausgabe leeren"
                      >
                        <Icon icon="mage:trash" /> Leeren
                      </button>
                    )}
                    <button
                      onClick={() => setIsIdeConsoleExpanded(!isIdeConsoleExpanded)}
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "12px" }}
                      title={isIdeConsoleExpanded ? "Panel einklappen" : "Panel ausklappen"}
                    >
                      <Icon icon={isIdeConsoleExpanded ? "mage:chevron-down" : "mage:chevron-up"} />
                    </button>
                  </div>
                </div>

                {/* Panel Body */}
                {isIdeConsoleExpanded && (
                  <div style={{ height: "140px", padding: "10px 14px", overflowY: "auto", fontFamily: "var(--font-mono)", fontSize: "12px", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
                    {activeBottomTab === "terminal" && (
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: "1.4" }}>
                        <code>{ideConsoleOutput || "[Zeno Rust Core] Bereit für native Programmausführung.\nDrücke 'Ausführen (Rust)' oder 'Ctrl + Enter', um die aktive Datei nativ im Rust-Backend auszuführen."}</code>
                      </pre>
                    )}

                    {activeBottomTab === "compilers" && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", fontSize: "11px" }}>
                        <div>
                          <strong>Rust Compiler:</strong><br />
                          <span style={{ color: compilersStatus?.rustAvailable ? "#00FF87" : "#EF4444" }}>
                            {compilersStatus?.rustVersion || "Nicht erkannt"}
                          </span>
                        </div>
                        <div>
                          <strong>Python:</strong><br />
                          <span style={{ color: compilersStatus?.pythonAvailable ? "#00FF87" : "#EF4444" }}>
                            {compilersStatus?.pythonVersion || "Nicht erkannt"}
                          </span>
                        </div>
                        <div>
                          <strong>Node.js:</strong><br />
                          <span style={{ color: compilersStatus?.nodeAvailable ? "#00FF87" : "#EF4444" }}>
                            {compilersStatus?.nodeVersion || "Nicht erkannt"}
                          </span>
                        </div>
                      </div>
                    )}

                    {activeBottomTab === "problems" && (
                      <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                        Keine Syntax- oder Kompilierungsfehler im aktuellen Workspace gefunden.
                      </div>
                    )}
                  </div>
                )}
              </div>

            </main>
          </>
        )}
      </div>

    </div>
  );
};
