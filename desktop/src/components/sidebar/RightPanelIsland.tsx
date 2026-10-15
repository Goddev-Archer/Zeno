import React, { useState, useEffect } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { Icon } from "@iconify/react";
import { Profile, Server } from "../../types";

export interface PatchedSnippetData {
  code: string;
  language: string;
  filename: string;
  originalMessageId?: string;
  senderName?: string;
}

interface RightPanelIslandProps {
  activeServerId: string;
  activeServer?: Server;
  isOpen: boolean;
  currentUserName?: string;
  currentUserAin?: string;
  isServerOwner?: boolean;
  mockProfiles: Record<string, Profile>;
  onSelectProfile: (profile: Profile) => void;
  onlinePeers?: Array<{
    name: string;
    ain?: string;
    role?: string;
    avatarColor?: string;
    isOwner?: boolean;
  }>;
  // Snippet patcher integration
  activeSnippet: PatchedSnippetData | null;
  onSendPatchedSnippet: (code: string, language: string, filename: string) => void;
  onCloseSnippetPatcher: () => void;
  theme: "dark" | "light";
  onClosePanel: () => void;
}

export const RightPanelIsland: React.FC<RightPanelIslandProps> = ({
  activeServerId,
  activeServer,
  isOpen,
  currentUserName = "CipherNaut",
  currentUserAin,
  isServerOwner = true,
  mockProfiles,
  onSelectProfile,
  onlinePeers = [],
  activeSnippet,
  onSendPatchedSnippet,
  onCloseSnippetPatcher,
  theme,
  onClosePanel
}) => {
  const [activeTab, setActiveTab] = useState<"members" | "patcher">("members");
  const [editorCode, setEditorCode] = useState<string>("");
  const [editorLanguage, setEditorLanguage] = useState<string>("rust");
  const [editorFilename, setEditorFilename] = useState<string>("snippet.rs");

  // Automatically switch to patcher tab when a snippet is loaded
  useEffect(() => {
    if (activeSnippet) {
      setEditorCode(activeSnippet.code);
      setEditorLanguage(activeSnippet.language || "rust");
      setEditorFilename(activeSnippet.filename || "snippet.rs");
      setActiveTab("patcher");
    }
  }, [activeSnippet]);

  if (activeServerId === "home") return null;

  // Custom Monaco Editor Theme Registration
  const handleEditorWillMount = (monaco: Monaco) => {
    // 1. Dark Theme: Carbon & Oxide
    monaco.editor.defineTheme("zeno-carbon-oxide", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "71717A", fontStyle: "italic" },
        { token: "keyword", foreground: "F97316", fontStyle: "bold" },
        { token: "string", foreground: "10B981" },
        { token: "number", foreground: "38BDF8" },
        { token: "type", foreground: "38BDF8" },
        { token: "function", foreground: "FB923C" },
        { token: "variable", foreground: "F4F4F6" }
      ],
      colors: {
        "editor.background": "#121217",
        "editor.foreground": "#F4F4F6",
        "editorLineNumber.foreground": "#3F3F46",
        "editorLineNumber.activeForeground": "#F97316",
        "editorCursor.foreground": "#F97316",
        "editor.selectionBackground": "#262633",
        "editor.lineHighlightBackground": "#17171E"
      }
    });

    // 2. Light Theme: Warm Parchment
    monaco.editor.defineTheme("zeno-warm-parchment", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "78716C", fontStyle: "italic" },
        { token: "keyword", foreground: "EA580C", fontStyle: "bold" },
        { token: "string", foreground: "059669" },
        { token: "number", foreground: "0284C7" },
        { token: "type", foreground: "0284C7" },
        { token: "function", foreground: "EA580C" },
        { token: "variable", foreground: "18181B" }
      ],
      colors: {
        "editor.background": "#F5F1E8",
        "editor.foreground": "#18181B",
        "editorLineNumber.foreground": "#A8A29E",
        "editorLineNumber.activeForeground": "#EA580C",
        "editorCursor.foreground": "#EA580C",
        "editor.selectionBackground": "#E4DECF",
        "editor.lineHighlightBackground": "#ECE6DA"
      }
    });
  };

  const handleSendPatched = () => {
    onSendPatchedSnippet(editorCode, editorLanguage, editorFilename);
  };

  const isOwner = isServerOwner || (activeServer?.ownerAin && activeServer.ownerAin === currentUserAin);

  // Local active user profile
  const localProfile: Profile = {
    id: "local-user",
    name: currentUserName,
    avatar: (currentUserName || "C")[0].toUpperCase(),
    avatarColor: "var(--accent-oxide)",
    role: isOwner ? "Server-Eigentümer" : "Mitglied",
    roleColor: isOwner ? "green" : "blue",
    status: "Souveräner Peer online",
    badge: isOwner ? "👑" : undefined,
    fingerprint: currentUserAin || "SOVEREIGN-USER"
  };

  // Member profiles calculation
  const allProfiles = [localProfile, ...Object.values(mockProfiles).filter(p => p.name !== currentUserName)];
  const totalPeersCount = allProfiles.length + onlinePeers.length;

  return (
    <aside className={`right-panel-island ${!isOpen ? "collapsed" : ""}`} aria-label="Rechtes Arbeitsbereich-Panel">
      {/* Island Header with Switchable Tabs */}
      <header className="right-island-header">
        <nav className="right-island-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "members"}
            className={`right-tab-btn ${activeTab === "members" ? "active" : ""}`}
            onClick={() => setActiveTab("members")}
          >
            <Icon icon="mage:users" className="tab-icon" />
            <span>Mitglieder</span>
            <span className="tab-badge">{totalPeersCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "patcher"}
            className={`right-tab-btn ${activeTab === "patcher" ? "active" : ""}`}
            onClick={() => setActiveTab("patcher")}
          >
            <Icon icon="mage:code" className="tab-icon" />
            <span>In-Chat IDE</span>
            {activeSnippet && <span className="tab-pulse-dot" title="Aktives Snippet geladen" />}
          </button>
        </nav>

        <button 
          className="right-island-close-btn" 
          onClick={onClosePanel} 
          title="Panel schließen"
          type="button"
        >
          <Icon icon="mage:multiply" />
        </button>
      </header>

      {/* Island Body Content */}
      <div className="right-island-body">
        {activeTab === "members" ? (
          /* ══════════════════════════════════════════════════════════════
             MEMBER LIST VIEW
             ══════════════════════════════════════════════════════════════ */
          <div className="members-content-scroll">
            <div className="members-category-group">
              <h4 className="members-category-title">
                <span>ONLINE PEERS</span>
                <span className="category-count">{allProfiles.length}</span>
              </h4>

              <div className="members-list-items">
                {allProfiles.map((prof) => (
                  <button
                    key={prof.id}
                    className="member-item-btn"
                    onClick={() => onSelectProfile(prof)}
                    type="button"
                  >
                    <div className="member-avatar-wrapper">
                      {prof.avatarImage ? (
                        <img src={prof.avatarImage} alt={prof.name} className="member-avatar-img" />
                      ) : (
                        <div className="member-avatar-fallback" style={{ backgroundColor: prof.avatarColor || "var(--accent-oxide)" }}>
                          {prof.avatar || prof.name[0]}
                        </div>
                      )}
                      <span className="member-status-dot online" />
                    </div>

                    <div className="member-text-meta">
                      <div className="member-name-row">
                        <span className="member-display-name">{prof.name}</span>
                        {prof.badge && <span className="member-badge-pill">{prof.badge}</span>}
                      </div>
                      <span className="member-status-quote">{prof.status || "Zero-Knowledge Peer"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════════
             MONACO IN-CHAT-IDE & SNIPPET PATCHER
             ══════════════════════════════════════════════════════════════ */
          <div className="patcher-content-container">
            {/* Snippet Header Meta */}
            <div className="patcher-meta-header">
              <div className="patcher-file-tag">
                <Icon icon="mage:file" className="file-icon" />
                <span className="file-name">{editorFilename}</span>
                <span className="file-lang-pill">{editorLanguage}</span>
              </div>

              {activeSnippet?.senderName && (
                <div className="patcher-sender-meta">
                  <span>Autor: <strong>{activeSnippet.senderName}</strong></span>
                </div>
              )}

              <button
                type="button"
                className="patcher-close-snippet-btn"
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", padding: "2px" }}
                onClick={() => {
                  onCloseSnippetPatcher();
                  setActiveTab("members");
                }}
                title="Snippet schließen & zu Mitgliedern zurückkehren"
              >
                <Icon icon="mage:multiply" />
              </button>
            </div>

            {/* Embedded Monaco Editor */}
            <div className="patcher-editor-frame">
              <Editor
                height="100%"
                language={editorLanguage}
                value={editorCode}
                theme={theme === "dark" ? "zeno-carbon-oxide" : "zeno-warm-parchment"}
                beforeMount={handleEditorWillMount}
                onChange={(val) => setEditorCode(val || "")}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  fontFamily: "var(--font-mono)",
                  lineNumbers: "on",
                  roundedSelection: true,
                  automaticLayout: true,
                  padding: { top: 8, bottom: 8 }
                }}
              />
            </div>

            {/* Action Bar: Send Patched Snippet back to chat */}
            <div className="patcher-actions-bar">
              <button 
                type="button" 
                className="patcher-revert-btn"
                onClick={() => {
                  if (activeSnippet) setEditorCode(activeSnippet.code);
                }}
                title="Auf Original-Code zurücksetzen"
              >
                <Icon icon="mage:reload" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                className="patcher-send-btn"
                onClick={handleSendPatched}
                title="Gepatchten Code als Antwort im Kanal posten"
              >
                <Icon icon="mage:send" />
                <span>Gepatchtes Snippet zurücksenden</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default RightPanelIsland;
