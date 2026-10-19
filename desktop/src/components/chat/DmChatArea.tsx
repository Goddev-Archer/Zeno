import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { DirectMessage, DmConversation } from "../../types";
import { GfmChatRenderer } from "./GfmChatRenderer";

interface DmChatAreaProps {
  activePeer: DmConversation;
  messages: DirectMessage[];
  currentUserName?: string;
  currentUserAin?: string;
  onSendMessage: (content: string, codeSnippet?: { language: string; code: string; title?: string }) => void;
  onDetachPopout?: () => void;
  onOpenInIde?: (code: string, language: string, title?: string) => void;
  openInPrivacyBrowser?: (url: string, title?: string) => void;
  showToast: (msg: string) => void;
  onToggleRightPanel?: () => void;
  isRightPanelOpen?: boolean;
}

export const DmChatArea: React.FC<DmChatAreaProps> = ({
  activePeer,
  messages,
  currentUserName = "CipherNaut",
  currentUserAin,
  onSendMessage,
  onDetachPopout,
  onOpenInIde,
  openInPrivacyBrowser,
  showToast,
  onToggleRightPanel,
  isRightPanelOpen = false
}) => {
  const [inputText, setInputText] = useState<string>("");
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [codeLanguage, setCodeLanguage] = useState<string>("rust");
  const [codeContent, setCodeContent] = useState<string>("");
  const [codeTitle, setCodeTitle] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showCodeModal) {
        setShowCodeModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCodeModal]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;
    onSendMessage(clean);
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleSendCodeSnippet = () => {
    if (!codeContent.trim()) {
      showToast("Code-Snippet darf nicht leer sein!");
      return;
    }
    onSendMessage(
      inputText.trim() || `[Code-Snippet: ${codeTitle || "snippet." + codeLanguage}]`,
      {
        language: codeLanguage,
        code: codeContent,
        title: codeTitle || undefined
      }
    );
    setCodeContent("");
    setCodeTitle("");
    setShowCodeModal(false);
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const getConnectionBadge = () => {
    if (activePeer.isSelfChat) {
      return (
        <span 
          className="p2p-status-pill self" 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "5px", 
            fontSize: "11px", 
            color: "var(--accent-oxide)", 
            background: "rgba(249, 115, 22, 0.12)", 
            padding: "2px 8px", 
            borderRadius: "12px", 
            border: "1px solid rgba(249, 115, 22, 0.3)",
            fontFamily: "var(--font-mono)"
          }}
        >
          <Icon icon="lucide:bookmark" style={{ fontSize: "11px" }} />
          <span>Lokales Notizboard (Offline Safe)</span>
        </span>
      );
    }

    switch (activePeer.connectionStatus) {
      case "p2p_direct":
        return (
          <span 
            className="p2p-status-pill direct" 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "5px", 
              fontSize: "11px", 
              color: "#10B981", 
              background: "rgba(16, 185, 129, 0.12)", 
              padding: "2px 8px", 
              borderRadius: "12px", 
              border: "1px solid rgba(16, 185, 129, 0.3)",
              fontFamily: "var(--font-mono)"
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />
            <span>P2P Direct ({activePeer.pingMs || 14}ms)</span>
          </span>
        );
      case "relay":
        return (
          <span 
            className="p2p-status-pill relay" 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "5px", 
              fontSize: "11px", 
              color: "#F59E0B", 
              background: "rgba(245, 158, 11, 0.12)", 
              padding: "2px 8px", 
              borderRadius: "12px", 
              border: "1px solid rgba(245, 158, 11, 0.3)",
              fontFamily: "var(--font-mono)"
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B" }} />
            <span>Relayed Envelope</span>
          </span>
        );
      default:
        return (
          <span 
            className="p2p-status-pill offline" 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "5px", 
              fontSize: "11px", 
              color: "var(--text-muted)", 
              background: "var(--bg-tertiary)", 
              padding: "2px 8px", 
              borderRadius: "12px", 
              border: "1px solid var(--border-color)",
              fontFamily: "var(--font-mono)"
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text-muted)" }} />
            <span>Offline (Lokale Warteschlange)</span>
          </span>
        );
    }
  };

  const getStatusBadge = (msg: DirectMessage) => {
    switch (msg.status) {
      case "queued":
        return (
          <span
            title="In lokaler Outbox (wird automatisch zugestellt, sobald Peer online kommt)"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "#F59E0B",
              background: "rgba(245, 158, 11, 0.1)",
              padding: "1px 6px",
              borderRadius: "4px",
              border: "1px solid rgba(245, 158, 11, 0.25)"
            }}
          >
            <Icon icon="mage:clock" style={{ fontSize: "11px" }} />
            <span>Outbox</span>
          </span>
        );
      case "sending":
        return (
          <span
            title="Wird über P2P-Mesh übertragen..."
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--accent-oxide)",
              background: "rgba(235, 87, 87, 0.1)",
              padding: "1px 6px",
              borderRadius: "4px"
            }}
          >
            <Icon icon="mage:dots-menu" style={{ fontSize: "11px" }} />
            <span>Sendet</span>
          </span>
        );
      case "delivered":
        if (msg.deliveryRoute === "byos_drop" || msg.deliveryRoute === "relay_envelope") {
          return (
            <span
              title="Im verschlüsselten Relay-Envelope hinterlegt"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                color: "#F59E0B",
                background: "rgba(245, 158, 11, 0.1)",
                padding: "1px 6px",
                borderRadius: "4px",
                border: "1px solid rgba(245, 158, 11, 0.25)"
              }}
            >
              <Icon icon="mage:box-3d" style={{ fontSize: "11px" }} />
              <span>Relay Drop</span>
            </span>
          );
        }
        return (
          <span
            title="Direkt über P2P-Verbindung zugestellt"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "#10B981",
              background: "rgba(16, 185, 129, 0.1)",
              padding: "1px 6px",
              borderRadius: "4px",
              border: "1px solid rgba(16, 185, 129, 0.25)"
            }}
          >
            <Icon icon="mage:check" style={{ fontSize: "11px" }} />
            <span>P2P</span>
          </span>
        );
      case "read":
        return (
          <span
            title="Vom Peer gelesen"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "#10B981",
              background: "rgba(16, 185, 129, 0.1)",
              padding: "1px 6px",
              borderRadius: "4px",
              border: "1px solid rgba(16, 185, 129, 0.25)"
            }}
          >
            <Icon icon="mage:eye" style={{ fontSize: "11px" }} />
            <span>Gelesen</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <main className="chat-area" style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
      {/* ── 1. DM CHAT HEADER ── */}
      <header className="chat-header">
        <div className="chat-header-left chat-header-info">
          {/* Peer Avatar */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", flexShrink: 0 }}>
            <div 
              className={`message-avatar ${activePeer.isSelfChat ? "orange" : "blue"}`}
              style={{
                width: "30px",
                height: "30px",
                fontSize: activePeer.isSelfChat ? "15px" : "13px",
                cursor: "default"
              }}
            >
              {activePeer.peerAvatar || (activePeer.peerName ? activePeer.peerName[0].toUpperCase() : "P")}
            </div>
            {!activePeer.isSelfChat && (
              <span
                style={{
                  position: "absolute",
                  bottom: "-1px",
                  right: "-1px",
                  width: "9px",
                  height: "9px",
                  borderRadius: "50%",
                  border: "2px solid var(--bg-primary)",
                  backgroundColor: activePeer.connectionStatus === "p2p_direct" ? "#10B981" : activePeer.connectionStatus === "relay" ? "#F59E0B" : "var(--text-muted)"
                }}
              />
            )}
          </div>

          <h2 className="chat-header-channel" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>{activePeer.peerName}</span>
            <span 
              style={{ 
                fontSize: "10px", 
                fontFamily: "var(--font-mono)", 
                color: "var(--text-muted)",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-color)",
                padding: "1px 6px",
                borderRadius: "4px",
                fontWeight: 400
              }}
            >
              {activePeer.peerAin.length > 20 ? `${activePeer.peerAin.substring(0, 10)}...${activePeer.peerAin.slice(-4)}` : activePeer.peerAin}
            </span>
          </h2>

          <span className="chat-header-divider" />
          <p className="chat-header-description">
            {activePeer.peerStatusQuote || "Serverloser Ende-zu-Ende verschlüsselter Direktkanal"}
          </p>
        </div>

        {/* Right Header Badges & Actions */}
        <div className="chat-header-actions" style={{ gap: "8px" }}>
          {getConnectionBadge()}

          <span 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "4px", 
              fontSize: "11px", 
              color: "var(--text-muted)", 
              fontFamily: "var(--font-mono)",
              background: "var(--bg-tertiary)",
              padding: "3px 8px",
              borderRadius: "6px",
              border: "1px solid var(--border-color)"
            }}
            title="Ende-zu-Ende verschlüsselt mit Argon2id & ChaCha20-Poly1305"
          >
            <Icon icon="mage:lock" style={{ color: "var(--accent-oxide)", fontSize: "12px" }} />
            <span>Zero-Knowledge E2EE</span>
          </span>

          {onDetachPopout && (
            <button
              type="button"
              onClick={onDetachPopout}
              title="In schwebendes Fenster ausdocken (Multi-Monitor Popout)"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                padding: "3px 8px",
                borderRadius: "var(--radius-sm, 6px)",
                fontSize: "11px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.borderColor = "var(--accent-color)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.borderColor = "var(--border-color)";
              }}
            >
              <Icon icon="mage:external-link" style={{ fontSize: "13px" }} />
              <span>Popout</span>
            </button>
          )}

          {onToggleRightPanel && (
            <button
              type="button"
              onClick={onToggleRightPanel}
              title={activePeer.isSelfChat ? "Notizbuch-Details & Snippets anzeigen" : "Peer-Sicherheit & Metriken anzeigen"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: isRightPanelOpen ? "rgba(249, 115, 22, 0.15)" : "var(--bg-tertiary)",
                border: isRightPanelOpen ? "1px solid var(--accent-oxide)" : "1px solid var(--border-color)",
                color: isRightPanelOpen ? "var(--accent-oxide)" : "var(--text-secondary)",
                padding: "3px 8px",
                borderRadius: "var(--radius-sm, 6px)",
                fontSize: "11px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <Icon icon={activePeer.isSelfChat ? "lucide:bookmark" : "lucide:shield-check"} style={{ fontSize: "13px" }} />
              <span>{activePeer.isSelfChat ? "Notizen" : "Sicherheit"}</span>
            </button>
          )}
        </div>
      </header>

      {/* ── 2. MESSAGES SCROLL CONTAINER ── */}
      <div 
        className="messages-container" 
        key={activePeer.peerAin}
        style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
      >
        <div className="date-separator" role="separator">
          <span className="date-separator-text">— Heute —</span>
        </div>

        {messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>💬</div>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "var(--text-primary)" }}>
              Direktnachricht mit {activePeer.peerName}
            </h3>
            <p style={{ margin: 0, fontSize: "13px", maxWidth: "420px", marginInline: "auto" }}>
              Dies ist der Beginn eures privaten, serverlosen P2P-Kanals. Alle Nachrichten werden lokal kryptografisch signiert und Ende-zu-Ende verschlüsselt übertragen.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderAin === "self" || msg.senderAin === currentUserAin;
            const authorName = isMe ? (currentUserName || "CipherNaut") : activePeer.peerName;
            const avatarChar = isMe
              ? (currentUserName ? currentUserName[0].toUpperCase() : "C")
              : (activePeer.peerAvatar || activePeer.peerName[0]?.toUpperCase() || "P");
            const avatarColor = isMe ? "purple" : "blue";

            return (
              <article
                key={msg.id || i}
                className="message message-animate"
                style={{ "--idx": Math.min(i, 6) } as React.CSSProperties}
              >
                <div 
                  className={`message-avatar ${avatarColor}`}
                  title={authorName}
                >
                  {avatarChar}
                </div>

                <div className="message-body">
                  <header className="message-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className={`message-author ${avatarColor}`}>
                        {authorName}
                      </span>

                      {isMe ? (
                        <span
                          style={{
                            fontSize: "9px",
                            fontFamily: "var(--font-mono)",
                            padding: "1px 5px",
                            borderRadius: "4px",
                            backgroundColor: "rgba(168, 85, 247, 0.15)",
                            color: "#C084FC",
                            border: "1px solid rgba(168, 85, 247, 0.3)"
                          }}
                        >
                          DU
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "9px",
                            fontFamily: "var(--font-mono)",
                            padding: "1px 5px",
                            borderRadius: "4px",
                            backgroundColor: "rgba(59, 130, 246, 0.12)",
                            color: "#93C5FD",
                            border: "1px solid rgba(59, 130, 246, 0.25)"
                          }}
                          title={activePeer.peerAin}
                        >
                          {activePeer.peerAin.length > 16 ? `${activePeer.peerAin.substring(0, 8)}...${activePeer.peerAin.slice(-4)}` : activePeer.peerAin}
                        </span>
                      )}

                      <time className="message-timestamp">{msg.time}</time>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {isMe ? (
                        getStatusBadge(msg)
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            fontSize: "10px",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-mono)"
                          }}
                          title="E2EE verschlüsselt empfangen"
                        >
                          <Icon icon="mage:lock" style={{ fontSize: "11px", color: "var(--accent-oxide)" }} />
                          <span>E2EE</span>
                        </span>
                      )}
                    </div>
                  </header>

                  <div className="message-content">
                    <GfmChatRenderer
                      text={msg.content}
                      onOpenPrivacyBrowser={openInPrivacyBrowser || ((url) => window.open(url, "_blank"))}
                      showToast={showToast}
                    />

                    {/* Embedded Code Snippet */}
                    {msg.codeSnippet && (
                      <div className="code-block-wrapper" style={{ marginTop: "8px" }}>
                        <header className="code-block-header">
                          <span className="code-block-language">
                            {msg.codeSnippet.title || msg.codeSnippet.language}
                          </span>
                          <div className="code-block-actions" style={{ display: "flex", gap: "6px" }}>
                            {onOpenInIde && (
                              <button
                                type="button"
                                className="code-action-btn"
                                onClick={() => onOpenInIde(msg.codeSnippet!.code, msg.codeSnippet!.language, msg.codeSnippet!.title)}
                                title="In der Zeno IDE öffnen"
                                style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}
                              >
                                <Icon icon="lucide:code" />
                                <span>In IDE</span>
                              </button>
                            )}
                            <button
                              type="button"
                              className="code-action-btn"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.codeSnippet!.code);
                                showToast("Code in Zwischenablage kopiert! 📋");
                              }}
                              title="Code kopieren"
                              style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}
                            >
                              <Icon icon="mage:copy" />
                              <span>Kopieren</span>
                            </button>
                          </div>
                        </header>
                        <pre className="code-block">
                          <code className={`language-${msg.codeSnippet.language}`}>{msg.codeSnippet.code}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── 3. CODE SNIPPET MODAL OVERLAY ── */}
      {showCodeModal && (
        <div
          className="dm-code-modal-backdrop"
          onClick={() => setShowCodeModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "550px",
              maxWidth: "92vw",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-lg, 12px)",
              padding: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon icon="lucide:code" style={{ color: "var(--accent-oxide)", fontSize: "18px" }} />
                <h3 style={{ margin: 0, fontSize: "15px", color: "var(--text-primary)" }}>Code-Snippet an @{activePeer.peerName} teilen</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="user-control-btn"
                title="Schließen"
              >
                <Icon icon="mage:multiply" style={{ fontSize: "16px" }} />
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <input
                type="text"
                placeholder="Dateiname / Titel (z. B. server.rs)"
                value={codeTitle}
                onChange={(e) => setCodeTitle(e.target.value)}
                style={{
                  flex: 1,
                  padding: "7px 12px",
                  borderRadius: "var(--radius-sm, 6px)",
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)"
                }}
              />
              <select
                value={codeLanguage}
                onChange={(e) => setCodeLanguage(e.target.value)}
                style={{
                  padding: "7px 12px",
                  borderRadius: "var(--radius-sm, 6px)",
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)"
                }}
              >
                <option value="rust">Rust</option>
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="go">Go</option>
                <option value="json">JSON</option>
                <option value="toml">TOML</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>

            <textarea
              rows={10}
              placeholder="// Code hier eingeben..."
              value={codeContent}
              onChange={(e) => setCodeContent(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm, 6px)",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                resize: "vertical"
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="settings-btn"
                style={{ padding: "6px 14px" }}
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSendCodeSnippet}
                className="settings-btn primary"
                style={{ padding: "6px 16px" }}
              >
                Snippet senden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. MESSAGE INPUT FOOTER (Matching Zeno Native ChatArea) ── */}
      <footer className="message-input-area" style={{ position: "relative" }}>
        <form
          className="message-input-container"
          onSubmit={handleSend}
        >
          <button
            type="button"
            className="input-action-btn"
            onClick={() => setShowCodeModal(true)}
            title="Code-Snippet einbetten (Rust, TS, Python...)"
          >
            <Icon icon="lucide:code" style={{ fontSize: "16px" }} />
          </button>

          <div className="message-input-wrapper">
            <textarea
              ref={textareaRef}
              className="message-input"
              id="dm-chat-input-field"
              rows={1}
              placeholder={
                activePeer.isSelfChat
                  ? "Notiz schreiben, To-Do erfassen oder Code-Snippet ablegen (Shift+Enter für Zeilenumbruch, Enter zum Speichern)..."
                  : `Nachricht an @${activePeer.peerName} (Shift+Enter für Zeilenumbruch, Enter zum Senden)...`
              }
              value={inputText}
              onChange={(e) => {
                const val = e.target.value;
                setInputText(val);
                // Auto-grow textarea
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 220)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              autoComplete="off"
            />
          </div>

          <div className="input-actions-right">
            <button
              className="input-action-btn send-btn"
              type="submit"
              title="Senden (Enter)"
              disabled={!inputText.trim()}
              style={{
                color: inputText.trim() ? "var(--accent-color, #38BDF8)" : undefined,
                cursor: inputText.trim() ? "pointer" : "default"
              }}
            >
              <Icon icon="lucide:send" style={{ fontSize: "16px" }} />
            </button>
          </div>
        </form>
      </footer>
    </main>
  );
};
