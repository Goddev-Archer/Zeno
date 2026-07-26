import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Editor from "@monaco-editor/react";
import { IdeFile } from "../../types";
import { checkOpenVsCodeServerHealth, getOpenVsCodeLaunchCommand, OpenVsCodeServerStatus } from "../../services/openVsCodeService";

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
  ideOpenTabs,
  ideActiveFilePath,
  theme,
  activeIdeFile,
  handleIdeFileSelect,
  handleIdeFileClose,
  handleIdeRun,
  handleIdeCodeChange,
  setupZenoIntelliSense,
  onReturnToDashboard,
  showToast
}) => {
  const [openVsCodeUrl, _setOpenVsCodeUrl] = useState<string>("http://localhost:3000");
  const [serverStatus, setServerStatus] = useState<OpenVsCodeServerStatus>({
    online: false,
    serverUrl: "http://localhost:3000",
    message: "Verbindung wird geprüft..."
  });
  const [useEmbeddedFallback, setUseEmbeddedFallback] = useState<boolean>(false);

  useEffect(() => {
    checkOpenVsCodeServerHealth(openVsCodeUrl).then((status) => {
      setServerStatus(status);
    });
  }, [openVsCodeUrl]);

  const handleEditorBeforeMount = (monaco: any) => {
    monaco.editor.defineTheme("code-oss-island-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6B7280", fontStyle: "italic" },
        { token: "keyword", foreground: "38BDF8", fontStyle: "bold" },
        { token: "string", foreground: "34D399" },
        { token: "number", foreground: "F472B6" }
      ],
      colors: {
        "editor.background": "#0D0E12",
        "editor.foreground": "#E2E8F0",
        "editorGutter.background": "#0D0E12",
        "editor.lineHighlightBackground": "#181A20",
        "editor.lineHighlightBorder": "#262933",
        "editorCursor.foreground": "#00FF87"
      }
    });
  };

  return (
    <div className="code-oss-island-workspace" style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#08090C", padding: "12px", gap: "12px", boxSizing: "border-box", color: "#E2E8F0" }}>
      
      {/* FLOATING HEADER ISLAND */}
      <header className="code-oss-header-island" style={{ height: "46px", backgroundColor: "#111319", borderRadius: "12px", border: "1px solid #1E222D", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {onReturnToDashboard && (
            <button
              onClick={onReturnToDashboard}
              style={{ background: "rgba(0, 255, 135, 0.12)", border: "1px solid rgba(0, 255, 135, 0.3)", color: "#00FF87", padding: "5px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Icon icon="mage:arrow-left" /> Dashboard
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "800", background: "linear-gradient(135deg, #00FF87, #60EFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              GENUINE CODE-OSS WORKBENCH
            </span>
            <span style={{ fontSize: "10px", backgroundColor: serverStatus.online ? "rgba(0,255,135,0.15)" : "rgba(255,255,255,0.08)", color: serverStatus.online ? "#00FF87" : "#94A3B8", padding: "2px 8px", borderRadius: "4px", fontWeight: "600" }}>
              {serverStatus.online ? "● OpenVSCode Server Verknüpft" : "○ Standalone Sandbox-Modus"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {serverStatus.online && (
            <button
              onClick={() => {
                window.open(openVsCodeUrl, "_blank");
                showToast("Echtes VS Code (OpenVSCode Workbench) in neuem Fenster geöffnet! 🚀");
              }}
              style={{ backgroundColor: "#00FF87", color: "#08090C", border: "none", padding: "5px 14px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              title="Öffnet das echte VS Code ohne Iframe-Einschränkungen in einem eigenen Fenster"
            >
              <Icon icon="mage:external-link" /> In neuem Fenster öffnen
            </button>
          )}

          {!serverStatus.online && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(getOpenVsCodeLaunchCommand());
                showToast("Launch Befehl kopiert! Führe ihn im Terminal aus: " + getOpenVsCodeLaunchCommand());
              }}
              style={{ backgroundColor: "#1E222D", color: "#38BDF8", border: "1px solid #262933", padding: "5px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              title="Kopiert den Starter-Befehl für den echten OpenVSCode Server"
            >
              <Icon icon="mage:terminal" /> Terminal Launch Command
            </button>
          )}

          <button
            onClick={() => setUseEmbeddedFallback(!useEmbeddedFallback)}
            style={{ backgroundColor: "#1E222D", color: "#E2E8F0", border: "1px solid #262933", padding: "5px 12px", borderRadius: "8px", fontSize: "11px", cursor: "pointer" }}
          >
            {useEmbeddedFallback ? "Zum OpenVSCode Server" : "Standalone Island Editor"}
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE VIEW */}
      <div style={{ flex: 1, backgroundColor: "#111319", borderRadius: "12px", border: "1px solid #1E222D", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {serverStatus.online && !useEmbeddedFallback ? (
          /* GENUINE 100% OPENVSCODE WEB WORKBENCH EMBED & WINDOW LAUNCHER */
          <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
            <div style={{ backgroundColor: "#181A20", padding: "10px 16px", borderBottom: "1px solid #1E222D", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "#00FF87", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon icon="mage:check-circle" /> Echtes OpenVSCode unter {openVsCodeUrl} aktiv!
              </span>
              <button
                onClick={() => window.open(openVsCodeUrl, "_blank")}
                style={{ background: "#00FF87", color: "#08090C", border: "none", padding: "4px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Icon icon="mage:external-link" /> In neuem Fenster öffnen (Empfohlen)
              </button>
            </div>
            <iframe
              src={openVsCodeUrl}
              title="OpenVSCode Genuine Server Workbench"
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          </div>
        ) : (
          /* STANDALONE CODE-OSS ISLAND EMBEDDED EDITOR */
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            
            {/* Server Launch Banner if Offline */}
            {!serverStatus.online && (
              <div style={{ backgroundColor: "#181A20", borderBottom: "1px solid #1E222D", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#94A3B8" }}>
                  <Icon icon="mage:information" style={{ color: "#38BDF8", fontSize: "16px" }} />
                  <span>Möchtest du echte VS Code Terminals, Open VSX Extensions & LSPs nutzen? Starte den OpenVSCode Server lokal:</span>
                  <code style={{ background: "#0D0E12", color: "#00FF87", padding: "2px 6px", borderRadius: "4px", fontSize: "10px" }}>
                    {getOpenVsCodeLaunchCommand()}
                  </code>
                </div>
                <button
                  onClick={() => {
                    checkOpenVsCodeServerHealth(openVsCodeUrl).then(setServerStatus);
                    showToast("Verbindung mit " + openVsCodeUrl + " erneut geprüft!");
                  }}
                  style={{ background: "#38BDF8", color: "#08090C", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "700", cursor: "pointer" }}
                >
                  Verbindung prüfen 🔄
                </button>
              </div>
            )}

            {/* Pill Tabs */}
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
                <>
                  <div style={{ position: "absolute", top: "10px", right: "20px", zIndex: 10, display: "flex", gap: "8px" }}>
                    <button
                      onClick={handleIdeRun}
                      style={{ backgroundColor: "#00FF87", color: "#08090C", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Icon icon="mage:play" /> Run
                    </button>
                  </div>
                  <Editor
                    height="100%"
                    language={activeIdeFile.language}
                    theme={theme === "light" ? "vs" : "code-oss-island-dark"}
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
                      cursorBlinking: "smooth"
                    }}
                  />
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748B" }}>
                  <Icon icon="mage:box-3d" style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.3 }} />
                  <p style={{ fontSize: "13px" }}>Echte VS Code Engine bereit. Starte den OpenVSCode Server für volles Terminal & Plugins!</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
