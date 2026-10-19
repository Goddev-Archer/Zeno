import React, { useState, useEffect } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { Icon } from "@iconify/react";
import { Profile, Server, DmConversation, DirectMessage } from "../../types";

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
  // DM integration (Schritt 4)
  isDmMode?: boolean;
  activeDmPeer?: DmConversation;
  dmMessages?: DirectMessage[];
  onOpenInIde?: (code: string, language: string, title?: string) => void;
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
  onClosePanel,
  isDmMode = false,
  activeDmPeer,
  dmMessages = [],
  onOpenInIde
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

  if (activeServerId === "home" && !isDmMode) return null;
  if (!isOpen) return null;

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

  const sharedSnippets = (dmMessages || []).filter((m) => !!m.codeSnippet);
  const peerFingerprint = activeDmPeer?.peerAin
    ? `SHA256:${activeDmPeer.peerAin.replace(/[^A-F0-9]/gi, "").substring(0, 16).match(/.{2}/g)?.join(":") || "8F:3A:9B:21"}`
    : "SHA256:00:00:00:00";

  return (
    <aside className={`right-panel-island ${!isOpen ? "collapsed" : ""}`} aria-label="Rechtes Arbeitsbereich-Panel">
      {/* Island Header with Switchable Tabs */}
      <header className="right-island-header">
        <nav className="right-island-tabs" role="tablist">
          {isDmMode && activeDmPeer ? (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "members"}
              className={`right-tab-btn ${activeTab === "members" ? "active" : ""}`}
              onClick={() => setActiveTab("members")}
            >
              <Icon icon={activeDmPeer.isSelfChat ? "lucide:bookmark" : "lucide:shield-check"} className="tab-icon" />
              <span>{activeDmPeer.isSelfChat ? "Notizbuch" : "Sicherheit"}</span>
            </button>
          ) : (
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
          )}

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
          isDmMode && activeDmPeer ? (
            /* ══════════════════════════════════════════════════════════════
               DM PEER-SECURITY & NOTEBOOK INSPECTOR (SCHRITT 4)
               ══════════════════════════════════════════════════════════════ */
            <div className="members-content-scroll" style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Header Profile Card */}
              <div style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-island)", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    className={`message-avatar ${activeDmPeer.isSelfChat ? "orange" : "blue"}`}
                    style={{
                      width: "36px",
                      height: "36px",
                      fontSize: activeDmPeer.isSelfChat ? "16px" : "13px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    {activeDmPeer.peerAvatar || activeDmPeer.peerName[0]}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {activeDmPeer.peerName}
                    </h4>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      {activeDmPeer.isSelfChat ? (
                        <>
                          <Icon icon="lucide:bookmark" style={{ color: "var(--accent-oxide)" }} />
                          <span>Privates Notizboard</span>
                        </>
                      ) : (
                        <>
                          <Icon icon="lucide:radio" style={{ color: activeDmPeer.connectionStatus === "p2p_direct" ? "#10B981" : "#F59E0B" }} />
                          <span>{activeDmPeer.connectionStatus === "p2p_direct" ? "P2P Direkt-Kanal" : "Relayed Envelope"}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {activeDmPeer.peerStatusQuote && (
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.35 }}>
                    "{activeDmPeer.peerStatusQuote}"
                  </p>
                )}
              </div>

              {/* Security Metrics or Local Storage Card */}
              {!activeDmPeer.isSelfChat ? (
                <div style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-island)", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-relay)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
                    <Icon icon="lucide:shield-check" style={{ fontSize: "14px" }} />
                    <span>Sicherheits-Status & Fingerprint</span>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "3px" }}>
                      Safety Numbers (MITM-Prüfsumme):
                    </label>
                    <code style={{ display: "block", background: "var(--bg-island)", padding: "5px 8px", borderRadius: "6px", fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--accent-relay)", wordBreak: "break-all" }}>
                      {peerFingerprint}
                    </code>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "11px", color: "var(--text-secondary)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Verschlüsselung:</span>
                      <strong style={{ color: "var(--text-primary)" }}>Argon2id + ChaCha20</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>E2EE Status:</span>
                      <strong style={{ color: "var(--status-verified)" }}>Zero-Knowledge ✓</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Latenz:</span>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--status-verified)" }}>{activeDmPeer.pingMs || 14} ms</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-island)", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-oxide)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
                    <Icon icon="lucide:database" style={{ fontSize: "14px" }} />
                    <span>Lokaler Tresor-Status</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "11px", color: "var(--text-secondary)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Speicherort:</span>
                      <strong style={{ color: "var(--text-primary)" }}>100% Lokal (SQLite)</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Verschlüsselung:</span>
                      <strong style={{ color: "var(--accent-oxide)" }}>AES-256-GCM</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Gespeicherte Notizen:</span>
                      <strong style={{ color: "var(--text-primary)" }}>{(dmMessages || []).length}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Offline-Sicherheit:</span>
                      <strong style={{ color: "var(--status-verified)" }}>Gerät verlässt es nie ✓</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Shared Code Snippets */}
              <div style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-island)", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)", fontSize: "11px", fontWeight: "700" }}>
                    <Icon icon="lucide:code" style={{ fontSize: "14px", color: "var(--accent-oxide)" }} />
                    <span>Code-Snippets ({sharedSnippets.length})</span>
                  </div>
                </div>

                {sharedSnippets.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                    Bisher keine Snippets abgelegt.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {sharedSnippets.map((msg) => (
                      <div
                        key={msg.id}
                        style={{
                          background: "var(--bg-island)",
                          border: "1px solid var(--border-island)",
                          borderRadius: "6px",
                          padding: "6px 8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "6px"
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {msg.codeSnippet?.title || "Code-Snippet"}
                          </div>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                            {msg.codeSnippet?.language.toUpperCase()} • {msg.time}
                          </span>
                        </div>
                        {onOpenInIde && msg.codeSnippet && (
                          <button
                            type="button"
                            onClick={() => onOpenInIde(msg.codeSnippet!.code, msg.codeSnippet!.language, msg.codeSnippet!.title)}
                            title="In Zeno IDE laden"
                            style={{
                              padding: "3px 6px",
                              borderRadius: "4px",
                              background: "var(--bg-elevated)",
                              border: "1px solid var(--border-island)",
                              color: "var(--accent-oxide)",
                              fontSize: "10px",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px"
                            }}
                          >
                            <Icon icon="lucide:external-link" style={{ fontSize: "11px" }} />
                            IDE
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════════
               SERVER MEMBER LIST VIEW
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
          )
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
                <Icon icon="lucide:send" />
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
