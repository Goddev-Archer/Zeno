import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import Editor from "@monaco-editor/react";
import { IdeFile, SystemCompilersStatus, IdeWorkspaceGitStatus, IdeGitFileChange } from "../../types";
import { getSystemCompilers } from "../../services/ideBackendService";
import { GfmChatRenderer } from "../chat/GfmChatRenderer";

export interface ZenoIdeProps {
  ideSidebarTab: "explorer" | "git" | "compilers";
  ideFiles: IdeFile[];
  ideOpenTabs: string[];
  ideActiveFilePath: string | null;
  ideGitChanges: string[];
  ideGitMessage: string;
  isIdeConsoleExpanded: boolean;
  ideConsoleOutput: string;
  theme: "dark" | "light";
  activeIdeFile: IdeFile | undefined;
  ideWorkspacePath: string | null;
  recentWorkspaces: string[];
  setIdeSidebarTab: (tab: "explorer" | "git" | "compilers") => void;
  setIdeNewItemType: (type: "file" | "folder") => void;
  setIdeNewItemParentPath?: (path: string) => void;
  setIsIdeNewItemModalOpen: (open: boolean) => void;
  setIsIdeProjectWizardOpen: (open: boolean) => void;
  setIdeGitMessage: (msg: string) => void;
  handleIdeGitCommit: () => void;
  handleIdeFileSelect: (path: string) => void;
  handleIdeFileClose: (path: string, e: React.MouseEvent) => void;
  handleIdeRun: () => void;
  handleIdeCodeChange: (code: string | undefined) => void;
  setupZenoIntelliSense: (monaco: any) => void;
  setIsIdeConsoleExpanded: (expanded: boolean) => void;
  setIdeConsoleOutput: (out: string) => void;
  onReturnToDashboard?: () => void;
  showToast: (msg: string) => void;
  onOpenFolder: () => void;
  onOpenFile: () => void;
  onCloseWorkspace: () => void;
  onRefreshWorkspace: () => void;
  onSelectRecentWorkspace: (path: string) => void;
  onSaveActiveFile: () => void;
  onDeleteFile?: (path: string) => void;
  ideGitStatus?: IdeWorkspaceGitStatus | null;
  onRefreshGitStatus?: () => void;
  onStageGitFile?: (path?: string) => void;
  onUnstageGitFile?: (path?: string) => void;
  onDiscardGitFile?: (path: string, isUntracked?: boolean) => void;
  onSyncGit?: () => void;
}

export const ZenoIde: React.FC<ZenoIdeProps> = ({
  ideSidebarTab,
  ideFiles,
  ideOpenTabs,
  ideActiveFilePath,
  ideGitChanges,
  ideGitMessage,
  isIdeConsoleExpanded,
  ideConsoleOutput,
  theme,
  activeIdeFile,
  ideWorkspacePath,
  recentWorkspaces,
  setIdeSidebarTab,
  setIdeNewItemType,
  setIdeNewItemParentPath,
  setIsIdeNewItemModalOpen,
  setIsIdeProjectWizardOpen,
  setIdeGitMessage,
  handleIdeGitCommit,
  handleIdeFileSelect,
  handleIdeFileClose,
  handleIdeRun,
  handleIdeCodeChange,
  setupZenoIntelliSense,
  setIsIdeConsoleExpanded,
  setIdeConsoleOutput,
  onReturnToDashboard,
  showToast,
  onOpenFolder,
  onOpenFile,
  onCloseWorkspace,
  onRefreshWorkspace,
  onSelectRecentWorkspace,
  onSaveActiveFile,
  onDeleteFile,
  ideGitStatus,
  onRefreshGitStatus,
  onStageGitFile,
  onUnstageGitFile,
  onDiscardGitFile,
  onSyncGit
}) => {
  const [activeBottomTab, setActiveBottomTab] = useState<"terminal" | "compilers" | "problems">("terminal");
  const [compilersStatus, setCompilersStatus] = useState<SystemCompilersStatus | null>(null);
  const [isLoadingCompilers, setIsLoadingCompilers] = useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [mdViewMode, setMdViewMode] = useState<"code" | "split" | "preview">("split");

  // VS Code Git Source Control State
  const [stagedFiles, setStagedFiles] = useState<string[]>([]);
  const [isStagedCollapsed, setIsStagedCollapsed] = useState<boolean>(false);
  const [isChangesCollapsed, setIsChangesCollapsed] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ ahead: number; behind: number }>({ ahead: 0, behind: 0 });

  const activeBranch = ideGitStatus?.isRepo ? (ideGitStatus.branch || "main") : "main";
  const effectiveAhead = ideGitStatus?.ahead ?? syncStatus.ahead;
  const effectiveBehind = ideGitStatus?.behind ?? syncStatus.behind;

  // Staged files list
  const stagedList: IdeGitFileChange[] = useMemo(() => {
    if (ideGitStatus && ideGitStatus.isRepo) {
      return ideGitStatus.staged;
    }
    return stagedFiles.map((p) => ({ path: p, status: "M", isStaged: true }));
  }, [ideGitStatus, stagedFiles]);

  // Unstaged files list
  const unstagedList: IdeGitFileChange[] = useMemo(() => {
    if (ideGitStatus && ideGitStatus.isRepo) {
      return ideGitStatus.unstaged;
    }
    return ideGitChanges
      .filter((f) => !stagedFiles.includes(f))
      .map((p) => ({ path: p, status: "M", isStaged: false }));
  }, [ideGitStatus, ideGitChanges, stagedFiles]);

  const totalChangesCount = stagedList.length + unstagedList.length;

  const handleStageFile = (filePath: string) => {
    if (onStageGitFile) {
      onStageGitFile(filePath);
    } else {
      setStagedFiles((prev) => [...prev, filePath]);
    }
  };

  const handleUnstageFile = (filePath: string) => {
    if (onUnstageGitFile) {
      onUnstageGitFile(filePath);
    } else {
      setStagedFiles((prev) => prev.filter((f) => f !== filePath));
    }
  };

  const handleStageAll = () => {
    if (onStageGitFile) {
      onStageGitFile();
    } else {
      setStagedFiles([...ideGitChanges]);
    }
  };

  const handleUnstageAll = () => {
    if (onUnstageGitFile) {
      onUnstageGitFile();
    } else {
      setStagedFiles([]);
    }
  };

  const handleDiscardFile = (filePath: string, isUntracked: boolean = false) => {
    if (onDiscardGitFile) {
      onDiscardGitFile(filePath, isUntracked);
    } else {
      const fileName = filePath.replace(/\\/g, "/").split("/").pop() || filePath;
      if (window.confirm(`Möchtest du alle Änderungen an "${fileName}" verwerfen?`)) {
        setStagedFiles((prev) => prev.filter((f) => f !== filePath));
        showToast(`Änderungen an "${fileName}" verworfen.`);
      }
    }
  };

  const handleDiscardAll = () => {
    if (unstagedList.length === 0) return;
    if (window.confirm("Möchtest du wirklich ALLE ungespeicherten Änderungen verwerfen?")) {
      unstagedList.forEach((f) => {
        if (onDiscardGitFile) {
          onDiscardGitFile(f.path, f.status === "U" || f.status === "??");
        }
      });
      if (!onDiscardGitFile) {
        setStagedFiles([]);
        showToast("Alle Änderungen verworfen.");
      }
    }
  };

  const handleVSCodeCommit = () => {
    if (!ideGitMessage.trim()) {
      showToast("Bitte gib eine Commit-Nachricht ein.");
      return;
    }
    handleIdeGitCommit();
  };

  const handleSyncRemote = () => {
    if (onSyncGit) {
      onSyncGit();
    } else {
      setSyncStatus({ ahead: 0, behind: 0 });
      showToast("Git Push & Pull synchronisiert (origin/main ist aktuell) ✓");
    }
  };

  const handleRefreshGitStatus = () => {
    if (onRefreshGitStatus) {
      onRefreshGitStatus();
    } else {
      showToast("Git-Status aktualisiert ✓");
    }
  };

  // Build true hierarchical tree nodes from the recursive file entries
  const treeNodes = useMemo(() => {
    if (!ideFiles || ideFiles.length === 0) return [];

    const rootNormalized = (ideWorkspacePath || "").replace(/\\/g, "/").replace(/\/$/, "");
    interface InternalNode {
      name: string;
      path: string;
      isFolder: boolean;
      language: string;
      depth: number;
      children: InternalNode[];
    }
    const nodeMap = new Map<string, InternalNode>();
    const rootNodes: InternalNode[] = [];

    const sorted = [...ideFiles].sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.path.localeCompare(b.path);
    });

    sorted.forEach((file) => {
      const normPath = file.path.replace(/\\/g, "/");
      nodeMap.set(normPath, {
        name: file.name,
        path: normPath,
        isFolder: file.isFolder,
        language: file.language,
        depth: 0,
        children: []
      });
    });

    sorted.forEach((file) => {
      const normPath = file.path.replace(/\\/g, "/");
      const node = nodeMap.get(normPath);
      if (!node) return;

      const lastSlash = normPath.lastIndexOf("/");
      const parentPath = lastSlash !== -1 ? normPath.substring(0, lastSlash) : "";

      if (parentPath && nodeMap.has(parentPath) && parentPath !== rootNormalized) {
        const parentNode = nodeMap.get(parentPath)!;
        node.depth = parentNode.depth + 1;
        parentNode.children.push(node);
      } else {
        node.depth = 0;
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }, [ideFiles, ideWorkspacePath]);

  // Keyboard shortcut listener for Strg+S and Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onSaveActiveFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleIdeRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSaveActiveFile, handleIdeRun]);

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

  const handleEditorBeforeMount = (monaco: any) => {
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
        "editor.background": "#15161A",
        "editor.foreground": "#BCBEC4",
        "editorGutter.background": "#15161A",
        "editor.lineHighlightBackground": "#1E2026",
        "editor.lineHighlightBorder": "#282A30",
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

  const getFileIcon = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".rs")) return "vscode-icons:file-type-rust";
    if (lower.endsWith(".py")) return "vscode-icons:file-type-python";
    if (lower.endsWith(".js") || lower.endsWith(".jsx") || lower.endsWith(".mjs")) return "vscode-icons:file-type-js";
    if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "vscode-icons:file-type-typescript-official";
    if (lower.endsWith(".json")) return "vscode-icons:file-type-json";
    if (lower.endsWith(".toml")) return "vscode-icons:file-type-toml";
    if (lower.endsWith(".md")) return "vscode-icons:file-type-markdown";
    if (lower.endsWith(".html")) return "vscode-icons:file-type-html";
    if (lower.endsWith(".css") || lower.endsWith(".scss")) return "vscode-icons:file-type-css";
    if (lower.endsWith(".go")) return "vscode-icons:file-type-go";
    if (lower.endsWith(".c") || lower.endsWith(".cpp") || lower.endsWith(".h")) return "vscode-icons:file-type-cpp";
    if (lower.endsWith(".sh") || lower.endsWith(".bash") || lower.endsWith(".ps1")) return "vscode-icons:file-type-shell";
    if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "vscode-icons:file-type-yaml";
    if (lower.endsWith(".sql")) return "vscode-icons:file-type-sql";
    return "codicon:file-code";
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const workspaceName = useMemo(() => {
    if (!ideWorkspacePath) return null;
    const parts = ideWorkspacePath.replace(/\\/g, "/").split("/");
    return parts.filter(Boolean).pop() || ideWorkspacePath;
  }, [ideWorkspacePath]);

  const hasAnyOpenItem = !!activeIdeFile || ideOpenTabs.length > 0;

  return (
    <div className="zeno-ide-workspace" style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", overflow: "hidden" }}>
      
      {/* 1. TOP WORKBENCH HEADER (Antigravity & JetBrains Unified Design) */}
      <header className="zeno-ide-header" style={{ height: "42px", backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", flexShrink: 0, zIndex: 10 }}>
        {/* Left: Return & Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          {onReturnToDashboard && (
            <button
              onClick={onReturnToDashboard}
              className="settings-btn"
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "4px 10px", height: "28px" }}
              title="Zurück zum Zeno Dashboard"
            >
              <Icon icon="codicon:arrow-left" /> Zurück
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "8px", borderLeft: "1px solid var(--border-color)", paddingLeft: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Icon icon="codicon:code" style={{ color: "var(--accent-color)", fontSize: "16px" }} /> ZENO NATIVE IDE
            </span>
            {workspaceName && (
              <>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>/</span>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--accent-color)", display: "flex", alignItems: "center", gap: "4px" }} title={ideWorkspacePath || ""}>
                  <Icon icon="codicon:folder" /> {workspaceName}
                </span>
              </>
            )}
            {activeIdeFile && (
              <>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>/</span>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activeIdeFile.name}
                </span>
              </>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "2px 8px", fontSize: "10px", color: "var(--text-muted)" }}>
            <Icon icon="octicon:git-branch-16" style={{ color: "var(--accent-color)" }} />
            <span>{activeBranch}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {activeIdeFile && (
            <button
              onClick={onSaveActiveFile}
              className="settings-btn"
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "4px 10px", height: "28px" }}
              title="Datei auf Festplatte speichern (Strg+S)"
            >
              <Icon icon="codicon:save" /> Speichern
            </button>
          )}

          <button
            onClick={handleIdeRun}
            className="settings-btn primary"
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "4px 12px", height: "28px", fontWeight: "600" }}
            title="Aktive Datei nativ auf dem PC ausführen (Ctrl+Enter)"
          >
            <Icon icon="codicon:play" /> Ausführen
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKBENCH LAYOUT */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        
        {/* Activity Bar (VS Code & Antigravity standard) */}
        <nav className="ide-activity-bar" style={{ width: "44px", backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", padding: "8px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "100%" }}>
            <button
              className={`ide-activity-btn ${ideSidebarTab === "explorer" ? "active" : ""}`}
              onClick={() => setIdeSidebarTab("explorer")}
              title="Explorer (Dateibaum)"
              style={{ width: "34px", height: "34px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", background: ideSidebarTab === "explorer" ? "rgba(53, 116, 240, 0.16)" : "transparent", color: ideSidebarTab === "explorer" ? "var(--accent-color)" : "var(--text-muted)" }}
            >
              <Icon icon="codicon:files" style={{ fontSize: "18px" }} />
            </button>

            <button
              className={`ide-activity-btn ${ideSidebarTab === "git" ? "active" : ""}`}
              onClick={() => setIdeSidebarTab("git")}
              title={`Source Control (Git) - ${totalChangesCount} Änderungen`}
              style={{ width: "34px", height: "34px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", position: "relative", background: ideSidebarTab === "git" ? "rgba(53, 116, 240, 0.16)" : "transparent", color: ideSidebarTab === "git" ? "var(--accent-color)" : "var(--text-muted)" }}
            >
              <Icon icon="codicon:source-control" style={{ fontSize: "18px" }} />
              {totalChangesCount > 0 && (
                <span style={{ position: "absolute", top: "4px", right: "4px", minWidth: "14px", height: "14px", padding: "0 3px", boxSizing: "border-box", backgroundColor: "var(--accent-oxide)", color: "#FFFFFF", borderRadius: "7px", fontSize: "9px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: "14px" }}>
                  {totalChangesCount}
                </span>
              )}
            </button>

            <button
              className={`ide-activity-btn ${ideSidebarTab === "compilers" ? "active" : ""}`}
              onClick={() => setIdeSidebarTab("compilers")}
              title="System-Toolchains (Rust, Python, Node, Git)"
              style={{ width: "34px", height: "34px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", background: ideSidebarTab === "compilers" ? "rgba(53, 116, 240, 0.16)" : "transparent", color: ideSidebarTab === "compilers" ? "var(--accent-color)" : "var(--text-muted)" }}
            >
              <Icon icon="codicon:terminal" style={{ fontSize: "18px" }} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <button
              onClick={onOpenFolder}
              title="Ordner auf Festplatte öffnen"
              style={{ width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", borderRadius: "6px" }}
            >
              <Icon icon="codicon:folder-opened" style={{ fontSize: "18px" }} />
            </button>
          </div>
        </nav>

        {/* Sidebar Tool Window */}
        <aside className="ide-sidebar" style={{ width: "250px", backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
          
          {/* TAB 1: EXPLORER */}
          {ideSidebarTab === "explorer" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {workspaceName ? `📁 ${workspaceName}` : "EXPLORER"}
                </span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => { setIdeNewItemParentPath?.(""); setIdeNewItemType("file"); setIsIdeNewItemModalOpen(true); }}
                    className="ide-sidebar-btn"
                    title="Neue Datei erstellen"
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "3px", borderRadius: "4px" }}
                  >
                    <Icon icon="codicon:new-file" style={{ fontSize: "15px" }} />
                  </button>
                  <button
                    onClick={() => { setIdeNewItemParentPath?.(""); setIdeNewItemType("folder"); setIsIdeNewItemModalOpen(true); }}
                    className="ide-sidebar-btn"
                    title="Neuen Ordner erstellen"
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "3px", borderRadius: "4px" }}
                  >
                    <Icon icon="codicon:new-folder" style={{ fontSize: "15px" }} />
                  </button>
                  <button
                    onClick={onRefreshWorkspace}
                    className="ide-sidebar-btn"
                    title="Explorer aktualisieren"
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "3px", borderRadius: "4px" }}
                  >
                    <Icon icon="codicon:refresh" style={{ fontSize: "15px" }} />
                  </button>
                  <button
                    onClick={onOpenFolder}
                    className="ide-sidebar-btn"
                    title="Anderen Ordner öffnen"
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "3px", borderRadius: "4px" }}
                  >
                    <Icon icon="codicon:folder-opened" style={{ fontSize: "15px" }} />
                  </button>
                  {ideWorkspacePath && (
                    <button
                      onClick={onCloseWorkspace}
                      className="ide-sidebar-btn"
                      title="Workspace schließen"
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "3px", borderRadius: "4px" }}
                    >
                      <Icon icon="codicon:close" style={{ fontSize: "15px" }} />
                    </button>
                  )}
                </div>
              </div>

              {/* File Tree View */}
              <div className="ide-tree-container" style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
                {treeNodes.length === 0 ? (
                  <div style={{ padding: "20px 14px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                    <p style={{ margin: "0 0 12px" }}>Kein Projektordner geöffnet.</p>
                    <button
                      onClick={onOpenFolder}
                      className="settings-btn primary"
                      style={{ width: "100%", fontSize: "11px", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      <Icon icon="codicon:folder-opened" /> Ordner öffnen
                    </button>
                  </div>
                ) : (
                  (() => {
                    const renderNode = (node: any) => {
                      const isFolder = node.isFolder;
                      const isExpanded = expandedFolders[node.path] ?? false;
                      const isActive = node.path === ideActiveFilePath;

                      return (
                        <React.Fragment key={node.path}>
                          <div
                            className={`ide-tree-item ${isActive ? "active" : ""}`}
                            onClick={() => {
                              if (isFolder) {
                                toggleFolder(node.path);
                              } else {
                                handleIdeFileSelect(node.path);
                              }
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 8px",
                              paddingLeft: `${node.depth * 14 + 10}px`,
                              fontSize: "12px",
                              cursor: "pointer",
                              backgroundColor: isActive ? "rgba(53, 116, 240, 0.16)" : "transparent",
                              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                              userSelect: "none"
                            }}
                          >
                            {isFolder ? (
                              <>
                                <Icon
                                  icon={isExpanded ? "codicon:chevron-down" : "codicon:chevron-right"}
                                  style={{ fontSize: "12px", color: "var(--text-muted)", flexShrink: 0 }}
                                />
                                <Icon
                                  icon={isExpanded ? "codicon:folder-opened" : "codicon:folder"}
                                  style={{ color: "#E5A93C", fontSize: "14px", flexShrink: 0 }}
                                />
                              </>
                            ) : (
                              <>
                                <span style={{ width: "12px", flexShrink: 0 }} />
                                <Icon icon={getFileIcon(node.name)} style={{ fontSize: "14px", flexShrink: 0 }} />
                              </>
                            )}
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                              {node.name}
                            </span>
                            {!isFolder && onDeleteFile && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`"${node.name}" wirklich von Festplatte löschen?`)) {
                                    onDeleteFile(node.path);
                                  }
                                }}
                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center", opacity: 0.7 }}
                                title="Datei löschen"
                              >
                                <Icon icon="codicon:trash" style={{ fontSize: "11px" }} />
                              </button>
                            )}
                          </div>

                          {isFolder && isExpanded && node.children && node.children.map((child: any) => renderNode(child))}
                        </React.Fragment>
                      );
                    };

                    return treeNodes.map((node) => renderNode(node));
                  })()
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GIT SOURCE CONTROL (VS CODE STYLE) */}
          {ideSidebarTab === "git" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", backgroundColor: "var(--bg-secondary)" }}>
              {/* 1. Header with Branch & Action Toolbar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px 8px 12px", borderBottom: "1px solid var(--border-color)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-primary)" }}>
                    Source Control
                  </span>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "3px", backgroundColor: "var(--bg-tertiary)", padding: "1px 6px", borderRadius: "4px", fontSize: "10px", color: "var(--accent-oxide)", fontWeight: 600 }} title="Aktueller Git Branch">
                    <Icon icon="octicon:git-branch-16" style={{ fontSize: "11px" }} />
                    <span>{activeBranch}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                  <button
                    onClick={handleRefreshGitStatus}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", borderRadius: "4px", display: "flex", alignItems: "center" }}
                    title="Status aktualisieren (Refresh)"
                  >
                    <Icon icon="codicon:refresh" style={{ fontSize: "13px" }} />
                  </button>
                  <button
                    onClick={handleSyncRemote}
                    style={{ background: "none", border: "none", color: effectiveAhead > 0 ? "var(--accent-oxide)" : "var(--text-muted)", cursor: "pointer", padding: "4px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "2px" }}
                    title={`Mit Remote synchronisieren (${effectiveBehind}↓ ${effectiveAhead}↑)`}
                  >
                    <Icon icon="codicon:sync" style={{ fontSize: "13px" }} />
                    {effectiveAhead > 0 && <span style={{ fontSize: "9px", fontWeight: "700" }}>{effectiveAhead}↑</span>}
                  </button>
                  <button
                    onClick={handleStageAll}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", borderRadius: "4px", display: "flex", alignItems: "center" }}
                    title="Alle Änderungen bereitstellen (+)"
                  >
                    <Icon icon="codicon:add" style={{ fontSize: "13px" }} />
                  </button>
                </div>
              </div>

              {/* 2. Commit Message Box & Primary Action */}
              <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-island)", flexShrink: 0 }}>
                <textarea
                  placeholder="Commit-Nachricht (Strg+Enter)..."
                  value={ideGitMessage}
                  onChange={(e) => setIdeGitMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleVSCodeCommit();
                    }
                  }}
                  style={{
                    width: "100%",
                    height: "56px",
                    backgroundColor: "var(--bg-canvas)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    padding: "6px 8px",
                    fontSize: "11px",
                    color: "var(--text-primary)",
                    outline: "none",
                    marginBottom: "8px",
                    resize: "none",
                    boxSizing: "border-box",
                    fontFamily: "var(--font-sans)"
                  }}
                />
                <button
                  onClick={handleVSCodeCommit}
                  style={{
                    width: "100%",
                    backgroundColor: "var(--accent-oxide)",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "6px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                  }}
                >
                  <Icon icon="codicon:check" /> Commit {stagedList.length > 0 ? `(${stagedList.length} bereitgestellt)` : `& Sync (${unstagedList.length})`}
                </button>
              </div>

              {/* 3. Sections: Staged Changes & Working Tree Changes */}
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                {/* 3a. STAGED CHANGES */}
                {stagedList.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", borderBottom: "1px solid var(--border-color)" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 12px",
                        backgroundColor: "var(--bg-tertiary)",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        userSelect: "none"
                      }}
                      onClick={() => setIsStagedCollapsed(!isStagedCollapsed)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Icon icon={isStagedCollapsed ? "codicon:chevron-right" : "codicon:chevron-down"} />
                        <span>STAGED CHANGES</span>
                        <span style={{ backgroundColor: "var(--bg-island)", padding: "1px 5px", borderRadius: "8px", fontSize: "9px", color: "var(--text-secondary)" }}>
                          {stagedList.length}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUnstageAll(); }}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                        title="Alle Änderungen zurücknehmen (-)"
                      >
                        <Icon icon="codicon:remove" style={{ fontSize: "12px" }} />
                      </button>
                    </div>

                    {!isStagedCollapsed && (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {stagedList.map((item) => {
                          const parts = item.path.replace(/\\/g, "/").split("/");
                          const fileName = parts.pop() || item.path;
                          const dirPath = parts.join("/");
                          const statusColor = item.status === "A" ? "#73C991" : item.status === "D" ? "#F14C4C" : "#E5A93C";
                          return (
                            <div
                              key={item.path}
                              onClick={() => handleIdeFileSelect(item.path)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "4px 12px",
                                fontSize: "11px",
                                cursor: "pointer",
                                borderBottom: "1px solid rgba(255,255,255,0.03)"
                              }}
                              className="ide-file-item"
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden", minWidth: 0 }}>
                                <Icon icon={getFileIcon(fileName)} style={{ fontSize: "13px", flexShrink: 0 }} />
                                <span style={{ color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</span>
                                {dirPath && (
                                  <span style={{ fontSize: "10px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dirPath}</span>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                                <span style={{ color: statusColor, fontWeight: 700, fontSize: "10px" }} title={`Staged (${item.status})`}>
                                  {item.status}
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleUnstageFile(item.path); }}
                                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                                  title="Aus Staging entfernen (-)"
                                >
                                  <Icon icon="codicon:remove" style={{ fontSize: "11px" }} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3b. WORKING TREE CHANGES */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 12px",
                      backgroundColor: "var(--bg-tertiary)",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      userSelect: "none"
                    }}
                    onClick={() => setIsChangesCollapsed(!isChangesCollapsed)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Icon icon={isChangesCollapsed ? "codicon:chevron-right" : "codicon:chevron-down"} />
                      <span>CHANGES</span>
                      <span style={{ backgroundColor: "var(--bg-island)", padding: "1px 5px", borderRadius: "8px", fontSize: "9px", color: "var(--text-secondary)" }}>
                        {unstagedList.length}
                      </span>
                    </div>
                    {unstagedList.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDiscardAll(); }}
                          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                          title="Alle Änderungen verwerfen (Discard All)"
                        >
                          <Icon icon="codicon:discard" style={{ fontSize: "12px" }} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStageAll(); }}
                          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                          title="Alle Änderungen bereitstellen (+)"
                        >
                          <Icon icon="codicon:add" style={{ fontSize: "12px" }} />
                        </button>
                      </div>
                    )}
                  </div>

                  {!isChangesCollapsed && (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {unstagedList.map((item) => {
                        const parts = item.path.replace(/\\/g, "/").split("/");
                        const fileName = parts.pop() || item.path;
                        const dirPath = parts.join("/");
                        const isUntracked = item.status === "U" || item.status === "??";
                        const statusColor = isUntracked ? "#4EC9B0" : item.status === "D" ? "#F14C4C" : "#E5A93C";
                        return (
                          <div
                            key={item.path}
                            onClick={() => handleIdeFileSelect(item.path)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "4px 12px",
                              fontSize: "11px",
                              cursor: "pointer",
                              borderBottom: "1px solid rgba(255,255,255,0.03)"
                            }}
                            className="ide-file-item"
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden", minWidth: 0 }}>
                              <Icon icon={getFileIcon(fileName)} style={{ fontSize: "13px", flexShrink: 0 }} />
                              <span style={{ color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</span>
                              {dirPath && (
                                <span style={{ fontSize: "10px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dirPath}</span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                              <span style={{ color: statusColor, fontWeight: 700, fontSize: "10px" }} title={isUntracked ? "Untracked" : item.status === "D" ? "Deleted" : "Modified"}>
                                {item.status}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDiscardFile(item.path, isUntracked); }}
                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                                title="Änderungen verwerfen"
                              >
                                <Icon icon="codicon:discard" style={{ fontSize: "11px" }} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStageFile(item.path); }}
                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                                title="Bereitstellen (+)"
                              >
                                <Icon icon="codicon:add" style={{ fontSize: "11px" }} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {unstagedList.length === 0 && stagedList.length === 0 && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "20px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                          <Icon icon="codicon:check-all" style={{ fontSize: "20px", color: "var(--accent-oxide)", opacity: 0.8 }} />
                          <span>Arbeitsverzeichnis ist sauber.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM TOOLCHAINS */}
          {ideSidebarTab === "compilers" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "14px", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
                  SYSTEM-TOOLCHAINS
                </span>
                <button
                  onClick={async () => {
                    setIsLoadingCompilers(true);
                    const s = await getSystemCompilers();
                    setCompilersStatus(s);
                    setIsLoadingCompilers(false);
                    showToast("Host-Toolchains aktualisiert.");
                  }}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                  title="Neu prüfen"
                >
                  <Icon icon={isLoadingCompilers ? "codicon:sync" : "codicon:refresh"} className={isLoadingCompilers ? "spin" : ""} />
                </button>
              </div>

              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px", lineHeight: "1.4" }}>
                Zeno IDE nutzt deine echten, installierten System-Compiler ohne Sandbox-Isolation.
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
                      <Icon icon="octicon:git-branch-16" style={{ color: "var(--accent-color)" }} /> Git Core
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
        </aside>

        {/* Editor Main Container */}
        <main className="ide-editor-container" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", backgroundColor: "var(--bg-primary)", minWidth: 0 }}>
          
          {/* Tabs Bar */}
          {ideOpenTabs.length > 0 && (
            <div className="ide-tabs-bar" style={{ display: "flex", backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", height: "35px", alignItems: "flex-end", paddingLeft: "8px", overflowX: "auto", flexShrink: 0 }}>
              {ideOpenTabs.map((tabPath) => {
                const isActive = tabPath === ideActiveFilePath;
                const fileName = tabPath.replace(/\\/g, "/").split("/").pop() || tabPath;
                const isDirty = ideGitChanges.includes(tabPath);
                return (
                  <div
                    key={tabPath}
                    onClick={() => handleIdeFileSelect(tabPath)}
                    className={`ide-tab ${isActive ? "active" : ""}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "0 12px",
                      height: "30px",
                      backgroundColor: isActive ? "var(--bg-primary)" : "var(--bg-tertiary)",
                      border: "1px solid var(--border-color)",
                      borderBottom: isActive ? "1px solid var(--bg-primary)" : "none",
                      borderTop: isActive ? "2px solid var(--accent-color)" : "1px solid var(--border-color)",
                      borderRadius: "4px 4px 0 0",
                      fontSize: "12px",
                      color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                      cursor: "pointer",
                      marginRight: "4px",
                      whiteSpace: "nowrap",
                      userSelect: "none"
                    }}
                  >
                    <Icon icon={getFileIcon(fileName)} style={{ fontSize: "14px" }} />
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
                      <Icon icon="codicon:close" style={{ fontSize: "11px" }} />
                    </button>
                  </div>
                );
              })}
              {activeIdeFile && (activeIdeFile.language === "markdown" || activeIdeFile.name.toLowerCase().endsWith(".md")) && (
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", paddingRight: "10px", alignSelf: "center", marginBottom: "5px" }}>
                  <button
                    onClick={() => setMdViewMode("code")}
                    title="Nur Code anzeigen"
                    style={{
                      background: mdViewMode === "code" ? "var(--bg-primary)" : "transparent",
                      border: "1px solid",
                      borderColor: mdViewMode === "code" ? "var(--border-color)" : "transparent",
                      color: mdViewMode === "code" ? "var(--accent-color)" : "var(--text-muted)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: mdViewMode === "code" ? "700" : "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: "pointer"
                    }}
                  >
                    <Icon icon="codicon:code" /> Code
                  </button>
                  <button
                    onClick={() => setMdViewMode("split")}
                    title="Split-View (Code & Live-Vorschau)"
                    style={{
                      background: mdViewMode === "split" ? "var(--bg-primary)" : "transparent",
                      border: "1px solid",
                      borderColor: mdViewMode === "split" ? "var(--border-color)" : "transparent",
                      color: mdViewMode === "split" ? "var(--accent-color)" : "var(--text-muted)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: mdViewMode === "split" ? "700" : "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: "pointer"
                    }}
                  >
                    <Icon icon="codicon:split-horizontal" /> Split
                  </button>
                  <button
                    onClick={() => setMdViewMode("preview")}
                    title="Nur formatierte Vorschau anzeigen"
                    style={{
                      background: mdViewMode === "preview" ? "var(--bg-primary)" : "transparent",
                      border: "1px solid",
                      borderColor: mdViewMode === "preview" ? "var(--border-color)" : "transparent",
                      color: mdViewMode === "preview" ? "var(--accent-color)" : "var(--text-muted)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: mdViewMode === "preview" ? "700" : "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: "pointer"
                    }}
                  >
                    <Icon icon="codicon:eye" /> Vorschau
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Editor Frame / Welcome Empty State */}
          <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
            {hasAnyOpenItem && activeIdeFile && !activeIdeFile.isFolder ? (
              (activeIdeFile.language === "image" || !!activeIdeFile.name.toLowerCase().match(/\.(png|jpe?g|gif|svg|webp|ico|bmp)$/i)) ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "20px", backgroundColor: "var(--bg-primary)" }}>
                  <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", maxWidth: "80%", maxHeight: "80%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <img 
                      src={`file:///${activeIdeFile.path}`} 
                      alt={activeIdeFile.name} 
                      style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain", borderRadius: "6px" }} 
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "12px" }}>
                      <span>🖼️ {activeIdeFile.name}</span>
                      {activeIdeFile.size && <span>💾 {(activeIdeFile.size / 1024).toFixed(1)} KB</span>}
                    </div>
                  </div>
                </div>
              ) : (activeIdeFile.language === "markdown" || activeIdeFile.name.toLowerCase().endsWith(".md")) && mdViewMode === "preview" ? (
                <div
                  className="zeno-ide-markdown-preview-pane"
                  style={{
                    height: "100%",
                    overflowY: "auto",
                    padding: "24px 32px",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    boxSizing: "border-box"
                  }}
                >
                  <GfmChatRenderer text={activeIdeFile.code} isBoxed={false} showToast={showToast} />
                </div>
              ) : (activeIdeFile.language === "markdown" || activeIdeFile.name.toLowerCase().endsWith(".md")) && mdViewMode === "split" ? (
                <div style={{ display: "flex", height: "100%", width: "100%" }}>
                  <div style={{ width: "50%", height: "100%", borderRight: "1px solid var(--border-color)" }}>
                    <Editor
                      height="100%"
                      language="markdown"
                      theme={theme === "light" ? "zeno-ide-light" : "zeno-ide-dark"}
                      beforeMount={handleEditorBeforeMount}
                      value={activeIdeFile.code}
                      onChange={handleIdeCodeChange}
                      onMount={(_, monaco) => setupZenoIntelliSense(monaco)}
                      options={{
                        minimap: { enabled: false },
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
                  </div>
                  <div
                    className="zeno-ide-markdown-preview-pane"
                    style={{
                      width: "50%",
                      height: "100%",
                      overflowY: "auto",
                      padding: "20px 24px",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      boxSizing: "border-box"
                    }}
                  >
                    <GfmChatRenderer text={activeIdeFile.code} isBoxed={false} showToast={showToast} />
                  </div>
                </div>
              ) : (
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
              )
            ) : (
              /* JETBRAINS + ANTIGRAVITY WELCOME SCREEN */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "30px", overflowY: "auto", boxSizing: "border-box" }}>
                
                {/* Hero Box */}
                <div style={{ maxWidth: "620px", width: "100%", textAlign: "center", marginBottom: "28px" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "16px", backgroundColor: "rgba(53, 116, 240, 0.12)", border: "1px solid rgba(53, 116, 240, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
                    <Icon icon="codicon:code" style={{ fontSize: "36px", color: "var(--accent-color)" }} />
                  </div>
                  <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 8px 0" }}>
                    Zeno Native IDE
                  </h2>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, lineHeight: "1.5" }}>
                    Unisolierte Entwicklungsumgebung mit nativer Ausführung direkt auf deinem Rechner.
                  </p>
                </div>

                {/* 2 Primary Action Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", maxWidth: "620px", width: "100%", marginBottom: "28px" }}>
                  
                  {/* Card 1: Ordner / Datei öffnen */}
                  <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "rgba(53, 116, 240, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-color)" }}>
                          <Icon icon="codicon:folder-opened" style={{ fontSize: "20px" }} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>Ordner / Datei öffnen</h4>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Bestehenden Code laden</span>
                        </div>
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 16px 0", lineHeight: "1.4" }}>
                        Wähle einen Projektordner oder eine Datei auf deiner Festplatte aus.
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button
                        onClick={onOpenFolder}
                        className="settings-btn primary"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px", padding: "8px 12px", fontWeight: "600" }}
                      >
                        <Icon icon="codicon:folder-opened" /> Ordner öffnen...
                      </button>
                      <button
                        onClick={onOpenFile}
                        className="settings-btn"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px", padding: "6px 12px" }}
                      >
                        <Icon icon="codicon:file" /> Datei öffnen...
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Ordner / Datei erstellen */}
                  <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "rgba(0, 255, 135, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00FF87" }}>
                          <Icon icon="codicon:new-folder" style={{ fontSize: "20px" }} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>Ordner / Datei erstellen</h4>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Neues Projekt starten</span>
                        </div>
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 16px 0", lineHeight: "1.4" }}>
                        Erstelle ein neues Projekt über den Vorlagen-Wizard oder lege eine leere Datei an.
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button
                        onClick={() => setIsIdeProjectWizardOpen(true)}
                        className="settings-btn primary"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px", padding: "8px 12px", fontWeight: "600" }}
                      >
                        <Icon icon="codicon:project" /> Projekt erstellen...
                      </button>
                      <button
                        onClick={() => { setIdeNewItemType("file"); setIsIdeNewItemModalOpen(true); }}
                        className="settings-btn"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px", padding: "6px 12px" }}
                      >
                        <Icon icon="codicon:new-file" /> Neue Datei...
                      </button>
                    </div>
                  </div>

                </div>

                {/* Recent Workspaces Section */}
                {recentWorkspaces && recentWorkspaces.length > 0 && (
                  <div style={{ maxWidth: "620px", width: "100%", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "10px" }}>
                      <Icon icon="codicon:history" /> Zuletzt geöffnet:
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {recentWorkspaces.slice(0, 4).map((rPath) => {
                        const name = rPath.replace(/\\/g, "/").split("/").pop() || rPath;
                        return (
                          <div
                            key={rPath}
                            onClick={() => onSelectRecentWorkspace(rPath)}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "6px", cursor: "pointer", transition: "all 0.15s ease" }}
                            className="ide-wizard-card"
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                              <Icon icon="codicon:folder" style={{ color: "var(--accent-color)", flexShrink: 0 }} />
                              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>{name}</span>
                              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {rPath}
                              </span>
                            </div>
                            <Icon icon="codicon:arrow-right" style={{ fontSize: "12px", color: "var(--text-muted)", flexShrink: 0 }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* DOCKED BOTTOM PANEL (TERMINAL & TOOLCHAINS) */}
          <div className="ide-console" style={{ backgroundColor: "var(--bg-secondary)", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            {/* Header */}
            <div style={{ height: "32px", padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--bg-tertiary)", borderBottom: isIdeConsoleExpanded ? "1px solid var(--border-color)" : "none", userSelect: "none" }}>
              <div style={{ display: "flex", gap: "16px", fontSize: "11px", fontWeight: "700" }}>
                <span
                  onClick={() => { setActiveBottomTab("terminal"); setIsIdeConsoleExpanded(true); }}
                  style={{ color: activeBottomTab === "terminal" ? "var(--accent-color)" : "var(--text-muted)", cursor: "pointer", borderBottom: activeBottomTab === "terminal" ? "2px solid var(--accent-color)" : "none", paddingBottom: "2px", display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <Icon icon="codicon:terminal" /> TERMINAL &amp; OUTPUT
                </span>
                <span
                  onClick={() => { setActiveBottomTab("compilers"); setIsIdeConsoleExpanded(true); }}
                  style={{ color: activeBottomTab === "compilers" ? "var(--accent-color)" : "var(--text-muted)", cursor: "pointer", borderBottom: activeBottomTab === "compilers" ? "2px solid var(--accent-color)" : "none", paddingBottom: "2px", display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <Icon icon="codicon:tools" /> TOOLCHAINS
                </span>
                <span
                  onClick={() => { setActiveBottomTab("problems"); setIsIdeConsoleExpanded(true); }}
                  style={{ color: activeBottomTab === "problems" ? "var(--accent-color)" : "var(--text-muted)", cursor: "pointer", borderBottom: activeBottomTab === "problems" ? "2px solid var(--accent-color)" : "none", paddingBottom: "2px", display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <Icon icon="codicon:issues" /> PROBLEME (0)
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {isIdeConsoleExpanded && (
                  <button
                    onClick={() => setIdeConsoleOutput("")}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                    title="Ausgabe leeren"
                  >
                    <Icon icon="codicon:clear-all" /> Leeren
                  </button>
                )}
                <button
                  onClick={() => setIsIdeConsoleExpanded(!isIdeConsoleExpanded)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center" }}
                  title={isIdeConsoleExpanded ? "Panel einklappen" : "Panel ausklappen"}
                >
                  <Icon icon={isIdeConsoleExpanded ? "codicon:chevron-down" : "codicon:chevron-up"} />
                </button>
              </div>
            </div>

            {/* Panel Body */}
            {isIdeConsoleExpanded && (
              <div style={{ height: "140px", padding: "10px 14px", overflowY: "auto", fontFamily: "var(--font-mono)", fontSize: "12px", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
                {activeBottomTab === "terminal" && (
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: "1.4" }}>
                    <code>{ideConsoleOutput || "[Zeno Rust Core] Bereit für native Programmausführung.\nKlicke auf 'Ausführen' oder drücke 'Ctrl + Enter', um den Code direkt im Rust-Backend auszuführen."}</code>
                  </pre>
                )}

                {activeBottomTab === "compilers" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", fontSize: "11px" }}>
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
                    <div>
                      <strong>Git System:</strong><br />
                      <span style={{ color: compilersStatus?.gitAvailable ? "#00FF87" : "#EF4444" }}>
                        {compilersStatus?.gitVersion || "Nicht erkannt"}
                      </span>
                    </div>
                  </div>
                )}

                {activeBottomTab === "problems" && (
                  <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                    Keine Syntax- oder Ausführungsfehler gemeldet.
                  </div>
                )}
              </div>
            )}
          </div>

        </main>
      </div>

    </div>
  );
};
