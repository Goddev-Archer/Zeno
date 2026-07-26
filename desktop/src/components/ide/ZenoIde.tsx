import React from "react";
import { Icon } from "@iconify/react";
import Editor from "@monaco-editor/react";
import { IdeFile } from "../../types";

interface ZenoIdeProps {
  ideSidebarTab: "explorer" | "git" | "extensions" | "gitlens";
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
  setIdeSidebarTab: (tab: "explorer" | "git" | "extensions" | "gitlens") => void;
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
  showToast: (msg: string) => void;
}

export const ZenoIde: React.FC<ZenoIdeProps> = ({
  ideSidebarTab,
  ideFiles,
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
  setIsSettingsOpen,
  setIdeNewItemType,
  setIdeNewItemParentPath,
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
  showToast
}) => {
  return (
    <div className="zeno-ide-workspace">
      {/* VS Code styled Activity Bar (narrow sidebar menu) */}
      <div className="ide-activity-bar">
        <div className="ide-activity-top">
          <button 
            className={`ide-activity-btn ${ideSidebarTab === "explorer" ? "active" : ""}`}
            onClick={() => setIdeSidebarTab("explorer")}
            title="Explorer"
          >
            <Icon icon="mage:file-records" />
          </button>

          <button 
            className={`ide-activity-btn ${ideSidebarTab === "git" ? "active" : ""}`}
            onClick={() => setIdeSidebarTab("git")}
            title="Source Control (Git)"
          >
            <Icon icon="mage:git-branch" />
            {ideGitChanges.length > 0 && (
              <span className="ide-activity-badge">{ideGitChanges.length}</span>
            )}
          </button>

          <button 
            className={`ide-activity-btn ${ideSidebarTab === "extensions" ? "active" : ""}`}
            onClick={() => setIdeSidebarTab("extensions")}
            title="Plugins / Extensions"
          >
            <Icon icon="mage:box-3d" />
          </button>

          {ideExtensions.find(ext => ext.id === "gitlens")?.installed && (
            <button 
              className={`ide-activity-btn gitlens-opt ${ideSidebarTab === "gitlens" ? "active" : ""}`}
              onClick={() => setIdeSidebarTab("gitlens")}
              title="GitLens History Map"
              style={{ color: "#E05555" }}
            >
              <Icon icon="octicon:history-16" />
            </button>
          )}
        </div>

        <div className="ide-activity-bottom">
          <button className="ide-activity-btn" onClick={() => setIsSettingsOpen(true)} title="Einstellungen">
            <Icon icon="mage:settings" />
          </button>
        </div>
      </div>

      {/* IDE Side Panel */}
      <aside className="ide-sidebar">
        {ideSidebarTab === "explorer" && (
          <>
            <div className="ide-sidebar-header">
              <span className="ide-project-title">
                Explorer
              </span>
              <div className="ide-sidebar-actions">
                <button 
                  className="ide-sidebar-btn" 
                  onClick={() => {
                    setIdeNewItemType("file");
                    setIdeNewItemParentPath("");
                    setIsIdeNewItemModalOpen(true);
                  }}
                  title="Neue Datei erstellen"
                >
                  <Icon icon="mage:plus" />
                </button>
                <button 
                  className="ide-sidebar-btn" 
                  onClick={() => {
                    setIdeNewItemType("folder");
                    setIdeNewItemParentPath("");
                    setIsIdeNewItemModalOpen(true);
                  }}
                  title="Neuer Ordner erstellen"
                >
                  <Icon icon="mage:folder-open" />
                </button>
                <button 
                  className="ide-sidebar-btn" 
                  onClick={() => setIsIdeProjectWizardOpen(true)}
                  title="Projekt aus Vorlage generieren"
                >
                  <Icon icon="mage:box-3d" style={{ color: "var(--accent-color)" }} />
                </button>
              </div>
            </div>

            <div className="ide-tree-container">
              <div className="ide-sidebar-section-title">ZENO-WORKSPACE</div>
              {renderIdeFileTree()}
              {ideFiles.length === 0 && (
                <p style={{ fontSize: "11px", color: "var(--text-muted)", padding: "16px", textAlign: "center" }}>
                  Workspace leer. Generiere ein Projekt über das Würfel-Symbol.
                </p>
              )}
            </div>
          </>
        )}

        {ideSidebarTab === "git" && (
          <div className="ide-git-panel" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "14px" }}>
            <div className="ide-sidebar-header" style={{ padding: "0 0 10px 0", borderBottom: "1px solid var(--border-color)", marginBottom: "14px" }}>
              <span className="ide-project-title">Source Control</span>
            </div>

            <div className="ide-git-input-wrapper" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <textarea
                className="settings-input"
                placeholder="Commit-Nachricht (Strg+Enter zum Committen)..."
                value={ideGitMessage}
                onChange={(e) => setIdeGitMessage(e.target.value)}
                style={{ width: "100%", height: "70px", resize: "none", fontSize: "11px", padding: "8px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    handleIdeGitCommit();
                  }
                }}
              />
              <button 
                className="settings-btn primary"
                onClick={handleIdeGitCommit}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px", padding: "8px" }}
              >
                <Icon icon="mage:git-branch" /> Commit & Push
              </button>
            </div>

            <div className="ide-git-changes-section" style={{ marginTop: "20px", flex: 1, overflowY: "auto" }}>
              <div className="ide-sidebar-section-title" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Änderungen</span>
                <span className="badge" style={{ backgroundColor: "var(--bg-tertiary)" }}>{ideGitChanges.length}</span>
              </div>
              
              {ideGitChanges.map((change) => (
                <div key={change} className="ide-git-change-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", fontSize: "12px", borderRadius: "4px", cursor: "pointer", transition: "background 0.2s" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Icon icon="mage:file-records" style={{ color: "var(--text-muted)", fontSize: "13px" }} />
                    <span>{change}</span>
                  </span>
                  <span style={{ color: "#FFC66D", fontWeight: "bold", fontSize: "11px" }}>M</span>
                </div>
              ))}

              {ideGitChanges.length === 0 && (
                <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginTop: "24px" }}>
                  Keine ungespeicherten Änderungen vorhanden.
                </p>
              )}
            </div>
          </div>
        )}

        {ideSidebarTab === "extensions" && (
          <div className="ide-extensions-panel" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "14px" }}>
            <div className="ide-sidebar-header" style={{ padding: "0 0 10px 0", borderBottom: "1px solid var(--border-color)", marginBottom: "14px" }}>
              <span className="ide-project-title">Plugin-Installer</span>
            </div>

            <div style={{ position: "relative", marginBottom: "14px" }}>
              <input
                type="text"
                className="settings-input"
                placeholder="Erweiterungen durchsuchen..."
                value={ideExtensionsSearchQuery}
                onChange={(e) => setIdeExtensionsSearchQuery(e.target.value)}
                style={{ width: "100%", paddingRight: "26px", fontSize: "11px", height: "30px" }}
              />
              <Icon icon="mage:search" style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>

            <div className="extensions-list" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              {ideExtensions
                .filter(ext => {
                  if (!ideExtensionsSearchQuery.trim()) return true;
                  const q = ideExtensionsSearchQuery.toLowerCase();
                  return ext.name.toLowerCase().includes(q) || ext.description.toLowerCase().includes(q);
                })
                .map((ext) => (
                  <div key={ext.id} className="extension-card" style={{ display: "flex", gap: "10px", padding: "10px", backgroundColor: "var(--bg-tertiary)", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                    <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {ext.icon.startsWith("http") ? (
                        <img src={ext.icon} alt={ext.name} style={{ width: "32px", height: "32px", borderRadius: "4px" }} />
                      ) : (
                        <Icon icon={ext.icon} style={{ fontSize: "28px" }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                        {ext.name}
                      </h4>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "2px 0 6px 0", lineHeight: "1.3" }}>
                        {ext.description}
                      </p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                          {ext.downloads} downloads
                        </span>
                        {ext.installed ? (
                          <button
                            onClick={() => handleExtensionUninstall(ext.id)}
                            className="settings-btn"
                            style={{ fontSize: "9px", padding: "2px 6px", border: "1px solid var(--accent-danger)", color: "var(--accent-danger)" }}
                          >
                            Deinstallieren
                          </button>
                        ) : (
                          <button
                            onClick={() => handleExtensionInstall(ext.id)}
                            className="settings-btn primary"
                            style={{ fontSize: "9px", padding: "2px 8px" }}
                          >
                            Installieren
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {ideSidebarTab === "gitlens" && (
          <div className="ide-gitlens-panel" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "14px" }}>
            <div className="ide-sidebar-header" style={{ padding: "0 0 10px 0", borderBottom: "1px solid var(--border-color)", marginBottom: "14px" }}>
              <span className="ide-project-title" style={{ color: "#E05555" }}>GitLens History Map</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, overflowY: "auto" }}>
              <div className="gitlens-info" style={{ padding: "10px", backgroundColor: "rgba(224, 85, 85, 0.1)", borderRadius: "6px", border: "1px solid rgba(224, 85, 85, 0.2)" }}>
                <p style={{ fontSize: "11px", color: "var(--text-primary)", margin: 0 }}>
                  GitLens hat das Platzierungsziel erfolgreich von der standardmäßigen VS-Code-Ansicht in das <strong>Zeno Aktivitäts-Menü</strong> übersetzt.
                </p>
              </div>

              <div className="gitlens-history-timeline" style={{ marginTop: "14px" }}>
                <div className="ide-sidebar-section-title">COMMITS VERLAUF</div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                  {[
                    { author: "CipherNaut", time: "Vor 10 Min.", msg: "feat: Add full-IDE layout Option B" },
                    { author: "CipherNaut", time: "Vor 2 Std.", msg: "fix: Monaco Themes dynamic light/dark loading" },
                    { author: "LenaCrypt", time: "Gestern", msg: "refactor: WASM isolates memory management" }
                  ].map((commit, idx) => (
                    <div key={idx} style={{ padding: "8px", borderLeft: "2px solid var(--border-color)", paddingLeft: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                        <span>{commit.author}</span>
                        <span>{commit.time}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-primary)", fontWeight: "500", marginTop: "4px" }}>
                        {commit.msg}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Editor & Console Container */}
      <div className="ide-editor-container">
        <div className="ide-tabs-bar">
          {ideOpenTabs.map((tabPath) => {
            const isActive = tabPath === ideActiveFilePath;
            const fileName = tabPath.split("/").pop() || tabPath;
            const fileObj = ideFiles.find((f) => f.path === tabPath);
            const lang = fileObj?.language || "";

            return (
              <div
                key={tabPath}
                className={`ide-tab ${isActive ? "active" : ""}`}
                onClick={() => handleIdeFileSelect(tabPath)}
              >
                <Icon 
                  icon={
                    lang === "rust" ? "vscode-icons:file-type-rust" :
                    lang === "python" ? "vscode-icons:file-type-python" :
                    lang === "golang" ? "vscode-icons:file-type-go" :
                    lang === "csharp" ? "vscode-icons:file-type-csharp" :
                    lang === "cpp" ? "vscode-icons:file-type-cpp" :
                    lang === "javascript" ? "vscode-icons:file-type-js" :
                    lang === "typescript" ? "vscode-icons:file-type-typescript" :
                    lang === "html" ? "vscode-icons:file-type-html" :
                    lang === "css" ? "vscode-icons:file-type-css" :
                    lang === "toml" ? "vscode-icons:file-type-toml" :
                    "mage:file-records"
                  } 
                  style={{ fontSize: "13px" }}
                />
                <span>{fileName}</span>
                <button
                  className="ide-tab-close"
                  onClick={(e) => handleIdeFileClose(tabPath, e)}
                >
                  <Icon icon="mage:multiply" style={{ fontSize: "10px" }} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="ide-editor-wrapper">
          {activeIdeFile && !activeIdeFile.isFolder ? (
            <>
              <div style={{ position: "absolute", top: "10px", right: "20px", zIndex: 10, display: "flex", gap: "8px" }}>
                <button
                  className="editor-toolbar-btn primary btn-run"
                  onClick={handleIdeRun}
                  style={{ fontSize: "11px", padding: "4px 10px", height: "26px" }}
                  title="Code ausführen"
                >
                  <Icon icon="mage:play" /> Run Sandbox
                </button>
                <button
                  className="editor-toolbar-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(activeIdeFile.code);
                    showToast("Code kopiert!");
                  }}
                  style={{ fontSize: "11px", padding: "4px 8px", height: "26px" }}
                  title="In Zwischenablage kopieren"
                >
                  <Icon icon="mage:copy" /> Copy
                </button>
              </div>

              <Editor
                height="100%"
                language={activeIdeFile.language}
                theme={theme === "light" ? "zeno-light-theme" : "zeno-dark-theme"}
                value={activeIdeFile.code}
                onChange={handleIdeCodeChange}
                onMount={(_, monaco) => setupZenoIntelliSense(monaco)}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "var(--font-mono)",
                  automaticLayout: true,
                  quickSuggestions: { other: true, comments: true, strings: true },
                  suggestOnTriggerCharacters: true,
                  acceptSuggestionOnEnter: "on",
                  tabCompletion: "on",
                  snippetSuggestions: "top",
                  wordBasedSuggestions: "allDocuments",
                  parameterHints: { enabled: true }
                }}
              />
            </>
          ) : (
            <div className="ide-no-editors-screen">
              <div className="ide-watermark-container">
                <img 
                  src="/zeno_logo.svg" 
                  alt="Zeno Logo" 
                  className="ide-watermark-logo"
                  style={{ width: "80px", height: "80px", opacity: 0.15, filter: "grayscale(30%)", marginBottom: "16px" }} 
                />
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", opacity: 0.8, marginBottom: "24px" }}>
                  Zeno Workspace Editor
                </h3>
              </div>

              <div className="ide-shortcut-list">
                <div className="ide-shortcut-item">
                  <span className="ide-shortcut-action">Datei erstellen</span>
                  <span className="ide-shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>N</kbd>
                  </span>
                </div>
                <div className="ide-shortcut-item">
                  <span className="ide-shortcut-action">Projekt-Template generieren</span>
                  <span className="ide-shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>G</kbd>
                  </span>
                </div>
                <div className="ide-shortcut-item">
                  <span className="ide-shortcut-action">WASM Runtime Hub</span>
                  <span className="ide-shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>H</kbd>
                  </span>
                </div>
                <div className="ide-shortcut-item">
                  <span className="ide-shortcut-action">Konsole ein-/ausblenden</span>
                  <span className="ide-shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>`</kbd>
                  </span>
                </div>
              </div>

              <div className="ide-quick-actions" style={{ display: "flex", gap: "10px", marginTop: "32px" }}>
                <button 
                  className="settings-btn"
                  onClick={() => {
                    setIdeNewItemType("file");
                    setIdeNewItemParentPath("");
                    setIsIdeNewItemModalOpen(true);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "8px 14px" }}
                >
                  <Icon icon="mage:plus" /> Neue Datei
                </button>
                <button 
                  className="settings-btn primary"
                  onClick={() => setIsIdeProjectWizardOpen(true)}
                  style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "8px 14px" }}
                >
                  <Icon icon="mage:box-3d" /> Projekt generieren
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Console Bottom Area */}
        <div 
          className={`ide-console ${isIdeConsoleExpanded ? "" : "collapsed"}`}
          style={{ height: isIdeConsoleExpanded ? "220px" : "35px" }}
        >
          <div 
            className="ide-console-header"
            onClick={() => setIsIdeConsoleExpanded(!isIdeConsoleExpanded)}
          >
            <span className="ide-console-title">
              <Icon icon="mage:dashboard" />
              WASM Sandbox-Ausgabe & Logs
            </span>
            <div className="ide-console-actions">
              <button
                className="ide-sidebar-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIdeConsoleOutput("");
                  showToast("Konsole gelöscht.");
                }}
                title="Konsole leeren"
              >
                <Icon icon="mage:trash-3" style={{ fontSize: "12px" }} />
              </button>
              <Icon 
                icon={isIdeConsoleExpanded ? "mage:chevron-down" : "mage:chevron-up"} 
                style={{ fontSize: "14px", color: "var(--text-muted)" }} 
              />
            </div>
          </div>
          {isIdeConsoleExpanded && (
            <pre className="ide-console-output" style={{ flex: 1, margin: 0, overflowY: "auto" }}>
              <code>{ideConsoleOutput || "[zeno-console] Keine Ausgaben vorhanden."}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
