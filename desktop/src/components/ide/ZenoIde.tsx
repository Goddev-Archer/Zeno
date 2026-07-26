import React, { useState } from "react";
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
  setIsSettingsOpen,
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
  setIdeConsoleOutput: _setIdeConsoleOutput,
  onReturnToDashboard,
  showToast: _showToast
}) => {
  const [commandPaletteQuery, setCommandPaletteQuery] = useState("");
  const [activeBottomTab, setActiveBottomTab] = useState<"terminal" | "problems" | "output">("terminal");

  const handleEditorBeforeMount = (monaco: any) => {
    // 2026 JetBrains / Cursor Island Design Palette
    monaco.editor.defineTheme("code-oss-island-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6B7280", fontStyle: "italic" },
        { token: "keyword", foreground: "38BDF8", fontStyle: "bold" },
        { token: "string", foreground: "34D399" },
        { token: "number", foreground: "F472B6" },
        { token: "type", foreground: "FBBF24" },
        { token: "function", foreground: "818CF8" }
      ],
      colors: {
        "editor.background": "#0D0E12",
        "editor.foreground": "#E2E8F0",
        "editorGutter.background": "#0D0E12",
        "editor.lineHighlightBackground": "#181A20",
        "editor.lineHighlightBorder": "#262933",
        "editorCursor.foreground": "#00FF87",
        "editorIndentGuide.background1": "#1E222D",
        "editorIndentGuide.activeBackground1": "#38BDF8"
      }
    });

    monaco.editor.defineTheme("code-oss-island-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#FFFFFF",
        "editor.foreground": "#1E293B"
      }
    });
  };

  return (
    <div className="code-oss-island-workspace" style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#08090C", padding: "12px", gap: "12px", boxSizing: "border-box", color: "#E2E8F0" }}>
      
      {/* 1. FLOATING HEADER ISLAND */}
      <header className="code-oss-header-island" style={{ height: "46px", backgroundColor: "#111319", borderRadius: "12px", border: "1px solid #1E222D", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
        {/* Left Engine Branding & Back Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {onReturnToDashboard && (
            <button
              onClick={onReturnToDashboard}
              style={{ background: "rgba(0, 255, 135, 0.12)", border: "1px solid rgba(0, 255, 135, 0.3)", color: "#00FF87", padding: "5px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              title="Dashboard & Chat Server öffnen"
            >
              <Icon icon="mage:arrow-left" /> Dashboard
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: "800", background: "linear-gradient(135deg, #00FF87, #60EFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              CODE-OSS 2026
            </span>
            <span style={{ fontSize: "10px", backgroundColor: "#1E222D", padding: "2px 6px", borderRadius: "4px", color: "#94A3B8" }}>
              Island Engine v1.98
            </span>
          </div>
        </div>

        {/* Center Floating Command Palette */}
        <div style={{ position: "relative", width: "380px" }}>
          <input
            type="text"
            placeholder="🔍 Command Palette (Ctrl + Shift + P)"
            value={commandPaletteQuery}
            onChange={(e) => setCommandPaletteQuery(e.target.value)}
            style={{ width: "100%", height: "28px", backgroundColor: "#0D0E12", border: "1px solid #262933", borderRadius: "8px", padding: "0 12px", fontSize: "11px", color: "#E2E8F0", outline: "none" }}
          />
        </div>

        {/* Right Execution & Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={handleIdeRun}
            style={{ backgroundColor: "#00FF87", color: "#08090C", border: "none", padding: "5px 14px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            title="Projekt Sandbox ausführen"
          >
            <Icon icon="mage:play" /> Run Project
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            style={{ backgroundColor: "#1E222D", color: "#94A3B8", border: "1px solid #262933", width: "30px", height: "30px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            title="Einstellungen"
          >
            <Icon icon="mage:settings" />
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE BODY (Floating Activity Bar, Sidebar, and Editor Islands) */}
      <div style={{ flex: 1, display: "flex", gap: "12px", minHeight: 0 }}>
        
        {/* Activity Bar Island */}
        <nav className="code-oss-activity-island" style={{ width: "48px", backgroundColor: "#111319", borderRadius: "12px", border: "1px solid #1E222D", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "14px", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          <button
            onClick={() => setIdeSidebarTab("explorer")}
            style={{ background: ideSidebarTab === "explorer" ? "rgba(56, 189, 248, 0.15)" : "transparent", border: "none", color: ideSidebarTab === "explorer" ? "#38BDF8" : "#64748B", width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", cursor: "pointer" }}
            title="Explorer (Dateibaum)"
          >
            <Icon icon="mage:file-records" />
          </button>

          <button
            onClick={() => setIdeSidebarTab("git")}
            style={{ background: ideSidebarTab === "git" ? "rgba(56, 189, 248, 0.15)" : "transparent", border: "none", color: ideSidebarTab === "git" ? "#38BDF8" : "#64748B", width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", cursor: "pointer", position: "relative" }}
            title="Source Control (Git)"
          >
            <Icon icon="mage:git-branch" />
            {ideGitChanges.length > 0 && (
              <span style={{ position: "absolute", top: "4px", right: "4px", width: "8px", height: "8px", backgroundColor: "#00FF87", borderRadius: "50%" }} />
            )}
          </button>

          <button
            onClick={() => setIdeSidebarTab("extensions")}
            style={{ background: ideSidebarTab === "extensions" ? "rgba(56, 189, 248, 0.15)" : "transparent", border: "none", color: ideSidebarTab === "extensions" ? "#38BDF8" : "#64748B", width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", cursor: "pointer" }}
            title="Open VSX Extensions Marketplace"
          >
            <Icon icon="mage:box-3d" />
          </button>
        </nav>

        {/* Sidebar Island */}
        <aside className="code-oss-sidebar-island" style={{ width: "260px", backgroundColor: "#111319", borderRadius: "12px", border: "1px solid #1E222D", display: "flex", flexDirection: "column", padding: "16px", boxSizing: "border-box", overflow: "hidden" }}>
          {ideSidebarTab === "explorer" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #1E222D", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", letterSpacing: "0.5px" }}>EXPLORER</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => { setIdeNewItemType("file"); setIsIdeNewItemModalOpen(true); }} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }} title="Neue Datei">
                    <Icon icon="mage:plus" />
                  </button>
                  <button onClick={() => setIsIdeProjectWizardOpen(true)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }} title="Neues Projekt Wizard">
                    <Icon icon="mage:folder-open" />
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto" }}>
                {renderIdeFileTree()}
              </div>
            </div>
          )}

          {ideSidebarTab === "git" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", marginBottom: "12px" }}>SOURCE CONTROL (GIT)</span>
              <textarea
                placeholder="Commit-Nachricht eingeben..."
                value={ideGitMessage}
                onChange={(e) => setIdeGitMessage(e.target.value)}
                style={{ width: "100%", height: "60px", backgroundColor: "#0D0E12", border: "1px solid #262933", borderRadius: "8px", padding: "8px", fontSize: "11px", color: "#E2E8F0", outline: "none", marginBottom: "8px", resize: "none" }}
              />
              <button
                onClick={handleIdeGitCommit}
                style={{ width: "100%", backgroundColor: "#38BDF8", color: "#08090C", border: "none", padding: "6px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer", marginBottom: "16px" }}
              >
                Commit & Push
              </button>

              <div style={{ fontSize: "10px", color: "#94A3B8", fontWeight: "700", marginBottom: "6px" }}>ÄNDERUNGEN ({ideGitChanges.length})</div>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                {ideGitChanges.map((change, idx) => (
                  <div key={idx} style={{ fontSize: "11px", color: "#34D399", padding: "4px 8px", backgroundColor: "#0D0E12", borderRadius: "4px" }}>
                    M {change}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ideSidebarTab === "extensions" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", marginBottom: "12px" }}>OPEN VSX EXTENSIONS</span>
              <input
                type="text"
                placeholder="Erweiterungen suchen..."
                value={ideExtensionsSearchQuery}
                onChange={(e) => setIdeExtensionsSearchQuery(e.target.value)}
                style={{ width: "100%", backgroundColor: "#0D0E12", border: "1px solid #262933", borderRadius: "8px", padding: "6px 10px", fontSize: "11px", color: "#E2E8F0", outline: "none", marginBottom: "12px" }}
              />
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {ideExtensions.map((ext) => (
                  <div key={ext.id} style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", padding: "10px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#E2E8F0" }}>{ext.name}</div>
                    <div style={{ fontSize: "10px", color: "#94A3B8", margin: "2px 0 6px 0" }}>{ext.description}</div>
                    <button
                      onClick={() => ext.installed ? handleExtensionUninstall(ext.id) : handleExtensionInstall(ext.id)}
                      style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "4px", border: "none", backgroundColor: ext.installed ? "#EF4444" : "#38BDF8", color: "#FFF", cursor: "pointer" }}
                    >
                      {ext.installed ? "Deinstallieren" : "Installieren"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Editor Workspace Island */}
        <main className="code-oss-editor-island" style={{ flex: 1, backgroundColor: "#111319", borderRadius: "12px", border: "1px solid #1E222D", display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          
          {/* Floating Pill Tabs */}
          <div style={{ height: "36px", backgroundColor: "#0D0E12", borderBottom: "1px solid #1E222D", display: "flex", alignItems: "center", padding: "0 8px", gap: "4px", overflowX: "auto" }}>
            {ideOpenTabs.map((tabPath) => {
              const isActive = tabPath === ideActiveFilePath;
              const fileName = tabPath.split("/").pop() || tabPath;
              return (
                <div
                  key={tabPath}
                  onClick={() => handleIdeFileSelect(tabPath)}
                  style={{ height: "26px", padding: "0 10px", borderRadius: "6px", backgroundColor: isActive ? "#111319" : "transparent", border: isActive ? "1px solid #262933" : "none", color: isActive ? "#00FF87" : "#94A3B8", fontSize: "11px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                >
                  <Icon icon="mage:file-records" style={{ fontSize: "12px" }} />
                  <span>{fileName}</span>
                  <button
                    onClick={(e) => handleIdeFileClose(tabPath, e)}
                    style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", padding: 0 }}
                  >
                    <Icon icon="mage:multiply" style={{ fontSize: "10px" }} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Monaco Editor Container */}
          <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
            {activeIdeFile && !activeIdeFile.isFolder ? (
              <Editor
                height="100%"
                language={activeIdeFile.language}
                theme={theme === "light" ? "code-oss-island-light" : "code-oss-island-dark"}
                beforeMount={handleEditorBeforeMount}
                value={activeIdeFile.code}
                onChange={handleIdeCodeChange}
                onMount={(_, monaco) => setupZenoIntelliSense(monaco)}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "var(--font-mono)",
                  automaticLayout: true,
                  renderLineHighlight: "all",
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on"
                }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748B" }}>
                <Icon icon="mage:box-3d" style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.3 }} />
                <p style={{ fontSize: "13px" }}>Wähle eine Datei im Explorer aus oder erstelle ein neues Projekt.</p>
              </div>
            )}
          </div>

          {/* 3. FLOATING TERMINAL & CONSOLE ISLAND */}
          <div style={{ borderTop: "1px solid #1E222D", backgroundColor: "#0D0E12", display: "flex", flexDirection: "column" }}>
            <div style={{ height: "28px", padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: isIdeConsoleExpanded ? "1px solid #1E222D" : "none" }}>
              <div style={{ display: "flex", gap: "16px", fontSize: "11px", fontWeight: "600" }}>
                <span
                  onClick={() => { setActiveBottomTab("terminal"); setIsIdeConsoleExpanded(true); }}
                  style={{ color: activeBottomTab === "terminal" ? "#38BDF8" : "#64748B", cursor: "pointer" }}
                >
                  TERMINAL
                </span>
                <span
                  onClick={() => { setActiveBottomTab("problems"); setIsIdeConsoleExpanded(true); }}
                  style={{ color: activeBottomTab === "problems" ? "#38BDF8" : "#64748B", cursor: "pointer" }}
                >
                  PROBLEME (0)
                </span>
                <span
                  onClick={() => { setActiveBottomTab("output"); setIsIdeConsoleExpanded(true); }}
                  style={{ color: activeBottomTab === "output" ? "#38BDF8" : "#64748B", cursor: "pointer" }}
                >
                  AUSGABE
                </span>
              </div>
              <button
                onClick={() => setIsIdeConsoleExpanded(!isIdeConsoleExpanded)}
                style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "12px" }}
              >
                <Icon icon={isIdeConsoleExpanded ? "mage:chevron-down" : "mage:chevron-up"} />
              </button>
            </div>

            {isIdeConsoleExpanded && (
              <div style={{ height: "120px", padding: "10px", overflowY: "auto", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#00FF87" }}>
                <pre style={{ margin: 0 }}><code>{ideConsoleOutput || "$ cargo check\n   Compiling zeno_sandbox v0.1.0\n    Finished dev [unoptimized + debuginfo] target(s) in 0.42s"}</code></pre>
              </div>
            )}
          </div>

        </main>
      </div>

    </div>
  );
};
