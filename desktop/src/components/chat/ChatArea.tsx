import React from "react";
import { Icon } from "@iconify/react";
import { Server, Channel, Message, Profile, MessageAttachment } from "../../types";
import { cleanUrl } from "../../utils/urlCleaner";
import { GfmChatRenderer } from "./GfmChatRenderer";
import { shouldGroupChannelMessages } from "../../utils/chatUtils";

interface ChatAreaProps {
  activeServer: Server;
  activeChannel: Channel;
  chatMessages: Record<string, Message[]>;
  mockProfiles: Record<string, Profile>;
  isMembersOpen: boolean;
  inputText: string;
  showCommandSuggestions: boolean;
  pendingAttachment: MessageAttachment | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  chatAttachmentInputRef: React.RefObject<HTMLInputElement | null>;
  AVAILABLE_COMMANDS: Array<{ name: string; desc: string; icon: string }>;
  setIsMembersOpen: (open: boolean) => void;
  setSelectedUserProfile: (profile: Profile | null) => void;
  setInputText: (text: string) => void;
  setShowCommandSuggestions: (show: boolean) => void;
  setPendingAttachment: (att: MessageAttachment | null) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  handleChatAttachmentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openInPrivacyBrowser: (url: string, title?: string) => void;
  setEditorCode: (code: string) => void;
  setEditorFilename: (name: string) => void;
  setEditorLanguage: (lang: string) => void;
  setEditorWorkflowStep: (step: any) => void;
  setIsEditorOpen: (open: boolean) => void;
  detectLanguage: (code: string) => string;
  showToast: (msg: string) => void;
  connectedRelaysCount?: number;
  relayTooltip?: string;
  onShowRelayDetails?: () => void;
  currentUserAin?: string;
  currentUserName?: string;
  isServerOwner?: boolean;
  onAcceptRules?: (serverId: string, channelId: string) => void;
  hasAcceptedRules?: boolean;
  onDeleteMessage?: (channelId: string, messageId?: string, messageText?: string) => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onPatchSnippet?: (code: string, language: string, filename: string, messageId?: string, author?: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  activeServer,
  activeChannel,
  chatMessages,
  mockProfiles,
  isMembersOpen,
  inputText,
  showCommandSuggestions,
  pendingAttachment,
  messagesEndRef,
  chatAttachmentInputRef,
  AVAILABLE_COMMANDS,
  setIsMembersOpen,
  setSelectedUserProfile,
  setInputText,
  setShowCommandSuggestions,
  setPendingAttachment,
  handleSendMessage,
  handleChatAttachmentChange,
  openInPrivacyBrowser,
  setEditorCode,
  setEditorFilename,
  setEditorLanguage,
  setEditorWorkflowStep,
  setIsEditorOpen,
  detectLanguage,
  showToast,
  connectedRelaysCount: _connectedRelaysCount = 0,
  relayTooltip: _relayTooltip = "Multi-Relay Transport Status",
  onShowRelayDetails: _onShowRelayDetails,
  currentUserAin,
  currentUserName = "CipherNaut",
  isServerOwner = true,
  onAcceptRules,
  hasAcceptedRules = false,
  onDeleteMessage,
  isSidebarCollapsed = false,
  onToggleSidebar,
  onPatchSnippet
}) => {
  const isRulesChannel = activeChannel?.type === "rules" || activeChannel?.name?.toLowerCase() === "regelwerk";

  return (
    <main className="chat-area">
      <header className="chat-header">
        <div className="chat-header-left chat-header-info">
          {isSidebarCollapsed && onToggleSidebar && (
            <button
              className="chat-header-sidebar-toggle"
              onClick={onToggleSidebar}
              title="Seitenleiste einblenden (Strg+B)"
            >
              <Icon icon="codicon:layout-sidebar-left" />
            </button>
          )}
          <span className="chat-header-icon" style={{ color: isRulesChannel ? "#A855F7" : undefined }}>
            <Icon icon={isRulesChannel ? "mage:shield-check" : activeChannel?.type === "voice" ? "mage:volume-up" : "mage:hashtag"} />
          </span>
          <h2 className="chat-header-channel">{activeChannel?.name || "allgemein"}</h2>
          {isRulesChannel && (
            <span
              className="badge"
              style={{
                backgroundColor: "rgba(168, 85, 247, 0.15)",
                color: "#C084FC",
                border: "1px solid rgba(168, 85, 247, 0.35)",
                fontSize: "10px",
                fontWeight: "700",
                padding: "2px 8px",
                marginLeft: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
              title="Dieses Regelwerk wird nativ als README.md im Git-Repository synchronisiert"
            >
              <Icon icon="octicon:git-branch-16" style={{ fontSize: "11px" }} />
              README.MD REGELWERK
            </span>
          )}
          <span className="chat-header-divider" />
          <p className="chat-header-description">
            {isRulesChannel 
              ? `Offizielles Server-Regelwerk für ${activeServer?.name || "Server"} (Git-synchronisiert)`
              : `Kanal für ${activeChannel?.name || "allgemein"} in ${activeServer?.name || "Server"}`}
          </p>
        </div>
        <div className="chat-header-actions">
          <button 
            className="header-action-btn" 
            onClick={() => openInPrivacyBrowser("https://github.com/tauri-apps/tauri?utm_source=twitter&fbclid=123", "GitHub Tauri Repo")} 
            title="Systembrowser mit Link-Bereinigung öffnen"
          >
            <Icon icon="mage:shield-check" />
          </button>
          <button className="header-action-btn" onClick={() => showToast("Such-Layout ist im Prototyp deaktiviert")} title="Suche">
            <Icon icon="mage:search" />
          </button>
          <button 
            className={`header-action-btn ${isMembersOpen ? "active" : ""}`} 
            onClick={() => setIsMembersOpen(!isMembersOpen)} 
            title="Mitgliederliste anzeigen/ausblenden"
          >
            <Icon icon="mage:users" />
          </button>
        </div>
      </header>

      {/* Message Feed */}
      <div className="messages-container" key={activeChannel?.id || "allgemein"}>
        <div className="date-separator" role="separator">
          <span className="date-separator-text">— Heute —</span>
        </div>

        {(() => {
          const rawMsgs = chatMessages[activeChannel?.id || "allgemein"] || [];
          const validMsgs = rawMsgs.filter((msg) => !!msg.text?.trim() || !!msg.code || !!msg.attachment);

          return validMsgs.map((msg, i) => {
            const prevMsg = i > 0 ? validMsgs[i - 1] : null;
            const isGrouped = shouldGroupChannelMessages(prevMsg, msg, 2);
            const urlMatch = msg.text ? msg.text.match(/(https?:\/\/[^\s]+)/) : null;
            const foundUrl = urlMatch ? urlMatch[0] : null;
            const urlDetails = foundUrl ? cleanUrl(foundUrl) : null;
            const canDelete = isServerOwner || msg.author === (currentUserName || "CipherNaut");
            const authorProfile: Profile = mockProfiles[msg.author] || {
              id: `peer-${msg.author}`,
              name: msg.author,
              avatar: (msg.author || "P")[0].toUpperCase(),
              avatarColor: msg.color || "purple",
              role: "Teilnehmer",
              roleColor: "blue",
              status: '"Souveräner Peer online"',
              fingerprint: "ZENO-SOVEREIGN"
            };

            const renderMessageContent = () => (
              <div className="message-content">
                <GfmChatRenderer
                  text={msg.text}
                  isBoxed={msg.isBoxed || isRulesChannel}
                  author={msg.author}
                  time={msg.time}
                  onOpenPrivacyBrowser={openInPrivacyBrowser}
                  showToast={showToast}
                  onPatchSnippet={(code, lang, fname) => {
                    if (onPatchSnippet) {
                      onPatchSnippet(code, lang, fname, msg.id, msg.author);
                    }
                  }}
                  onDelete={canDelete ? () => {
                    if (window.confirm("Möchtest du diesen Eintrag wirklich löschen?")) {
                      onDeleteMessage && onDeleteMessage(activeChannel?.id || "allgemein", msg.id, msg.text);
                    }
                  } : undefined}
                />

                {/* Privacy Preserving Link Preview Card */}
                {foundUrl && urlDetails && (
                  <div className="privacy-link-card">
                    <div className="privacy-link-card-header">
                      <span className="privacy-link-card-title">
                        <Icon icon="mage:shield-check" style={{ color: "#59A869", fontSize: "16px" }} />
                        Privacy Link Preview
                      </span>
                      <span className="badge" style={{ backgroundColor: "rgba(89, 168, 105, 0.15)", color: "#59A869", border: "1px solid rgba(89, 168, 105, 0.3)", fontSize: "9px", padding: "2px 6px" }}>
                        🛡️ System-Browser (IP-Schutz)
                      </span>
                    </div>
                    <div className="privacy-link-card-url">
                      {urlDetails.cleanedUrl}
                    </div>
                    {urlDetails.strippedParams.length > 0 && (
                      <div style={{ fontSize: "10px", color: "#FFC66D", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Icon icon="mage:information-circle" />
                        {urlDetails.strippedParams.length} Tracking-Parameter automatisch entfernt ({urlDetails.strippedParams.join(", ")})
                      </div>
                    )}
                    <div className="privacy-link-card-actions">
                      <button 
                        className="settings-btn primary" 
                        onClick={() => openInPrivacyBrowser(foundUrl)} 
                        style={{ fontSize: "11px", padding: "4px 10px", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <Icon icon="lucide:globe" /> Im Browser öffnen
                      </button>
                      <button 
                        className="settings-btn" 
                        onClick={() => { navigator.clipboard.writeText(urlDetails.cleanedUrl); showToast("Saubere URL kopiert!"); }} 
                        style={{ fontSize: "11px", padding: "4px 10px", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <Icon icon="mage:copy" /> Saubere URL kopieren
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Embedded Code Block (Only shown if text does not already contain a fenced markdown code block) */}
                {msg.code && !msg.text?.includes("```") && (
                  <div className="code-block-wrapper" data-language="rust">
                    <header className="code-block-header">
                      <span className="code-block-language">Rust</span>
                      <div className="code-block-actions" style={{ display: "flex", gap: "6px" }}>
                        <button 
                          className="code-action-btn btn-patch-snippet"
                          style={{ 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: "4px", 
                            backgroundColor: "var(--accent-oxide)", 
                            color: "#FFFFFF",
                            border: "none",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600
                          }}
                          onClick={() => {
                            if (onPatchSnippet) {
                              onPatchSnippet(msg.code || "", detectLanguage(msg.code || ""), "snippet.rs", msg.id, msg.author);
                            } else {
                              setEditorCode(msg.code || "");
                              setEditorFilename("snippet.rs");
                              setEditorLanguage(detectLanguage(msg.code || ""));
                              setEditorWorkflowStep("editor");
                              setIsEditorOpen(true);
                            }
                          }}
                          title="Code im In-Chat Monaco Editor patchen"
                        >
                          <Icon icon="lucide:code" style={{ fontSize: "13px" }} />
                          <span>Im In-Chat-Editor patchen</span>
                        </button>

                        <button 
                          className="code-action-btn btn-open-editor" 
                          onClick={() => { setEditorCode(msg.code || ""); setEditorFilename("snippet.rs"); setEditorLanguage(detectLanguage(msg.code || "")); setEditorWorkflowStep("editor"); setIsEditorOpen(true); }}
                          title="Im Vollbild-Editor öffnen"
                        >
                          IDE
                        </button>
                      </div>
                    </header>
                    <pre className="code-block">
                      <code className="language-rust">{msg.code}</code>
                    </pre>
                  </div>
                )}

                {/* Message Attachment Rendering */}
                {msg.attachment && (
                  <div className="message-attachment-card">
                    {msg.attachment.dataUrl ? (
                      <div className="message-attachment-image-wrapper">
                        <img src={msg.attachment.dataUrl} alt={msg.attachment.name} className="message-attachment-image" />
                      </div>
                    ) : (
                      <div className="message-attachment-file-info">
                        <Icon icon="mage:file-records" className="attachment-file-icon" />
                        <div className="attachment-text-details">
                          <span className="attachment-filename">{msg.attachment.name}</span>
                          <span className="attachment-filesize">{msg.attachment.size}</span>
                        </div>
                        <button 
                          className="attachment-download-btn" 
                          onClick={() => {
                            const blob = new Blob(["Simulierter Dateiinhalt"], { type: msg.attachment?.type || "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = msg.attachment?.name || "file";
                            link.click();
                            URL.revokeObjectURL(url);
                            showToast(`Download von "${msg.attachment?.name}" gestartet`);
                          }}
                          title="Herunterladen"
                        >
                          <Icon icon="mage:download" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );

            if (isGrouped) {
              return (
                <article 
                  key={msg.id || i} 
                  className="message message-compact message-animate"
                  style={{ "--idx": Math.min(i, 6) } as React.CSSProperties}
                >
                  <div className="message-compact-gutter">
                    <time className="message-compact-timestamp" title={msg.time}>
                      {msg.time}
                    </time>
                  </div>
                  <div className="message-body message-compact-body">
                    <div className="message-compact-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {renderMessageContent()}
                      </div>
                      {canDelete && (
                        <button
                          type="button"
                          className="message-delete-action-btn message-compact-delete"
                          onClick={() => {
                            if (window.confirm("Möchtest du diese Nachricht wirklich löschen?")) {
                              onDeleteMessage && onDeleteMessage(activeChannel?.id || "allgemein", msg.id, msg.text);
                            }
                          }}
                          title="Nachricht löschen"
                        >
                          <Icon icon="mage:trash" />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            }

            return (
              <article 
                key={msg.id || i} 
                className="message message-animate"
                style={{ "--idx": Math.min(i, 6) } as React.CSSProperties}
              >
                <div 
                  className={`message-avatar ${msg.color}`}
                  onClick={() => setSelectedUserProfile(authorProfile)}
                  style={{ cursor: "pointer" }}
                  title={`Profil von ${msg.author} anzeigen`}
                >
                  {msg.author[0]}
                </div>
                <div className="message-body">
                  <header className="message-header" style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className={`message-author ${msg.color}`} onClick={() => setSelectedUserProfile(authorProfile)} style={{ cursor: "pointer" }}>
                        {msg.author}
                      </span>
                      {authorProfile.role === "Bot" && <span className="badge bot-badge">BOT</span>}
                      <time className="message-timestamp">{msg.time}</time>
                    </div>
                    {canDelete && (
                      <button
                        type="button"
                        className="message-delete-action-btn"
                        onClick={() => {
                          if (window.confirm("Möchtest du diese Nachricht wirklich löschen?")) {
                            onDeleteMessage && onDeleteMessage(activeChannel?.id || "allgemein", msg.id, msg.text);
                          }
                        }}
                        title="Nachricht löschen"
                      >
                        <Icon icon="mage:trash" />
                      </button>
                    )}
                  </header>
                  {renderMessageContent()}
                </div>
              </article>
            );
          });
        })()}

        {/* Sovereign Rules Verification & Unlock Banner */}
        {isRulesChannel && (
          <div className="rules-verification-banner">
            <div className="rules-verification-info">
              <div
                className="rules-verification-icon-wrap"
                style={{ color: hasAcceptedRules ? "#00FF87" : "#A855F7" }}
              >
                <Icon icon={hasAcceptedRules ? "mage:check-circle" : "mage:shield-check"} style={{ fontSize: "24px" }} />
              </div>
              <div className="rules-verification-text">
                <h4 className="rules-verification-title" style={{ margin: "0 0 2px 0", fontSize: "13px", fontWeight: "700", color: "#FFF" }}>
                  {hasAcceptedRules ? "Regelwerk verifiziert & bestätigt ✓" : "Souveräne Regelwerk-Freischaltung"}
                </h4>
                <p className="rules-verification-desc" style={{ margin: 0, fontSize: "11px", color: "#94A3B8", lineHeight: "1.4" }}>
                  {hasAcceptedRules
                    ? `Du hast dieses Regelwerk mit deiner souveränen Identität (${currentUserAin || "AIN"}) bestätigt und bist für diesen Server freigeschaltet.`
                    : "Bestätige dieses Regelwerk nativ mit deiner dezentralen Identität, um den vollen Server-Zugriff freizuschalten – ohne externe Verify-Bots."}
                </p>
              </div>
            </div>
            <div className="rules-verification-actions">
              {hasAcceptedRules ? (
                <div
                  className="rules-verified-pill"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    backgroundColor: "rgba(0, 255, 135, 0.12)",
                    border: "1px solid rgba(0, 255, 135, 0.3)",
                    color: "#00FF87",
                    fontSize: "11px",
                    fontWeight: "600"
                  }}
                >
                  <Icon icon="mage:check" /> Freigeschaltet
                </div>
              ) : (
                <button
                  type="button"
                  className="rules-accept-btn"
                  onClick={() => onAcceptRules && onAcceptRules(activeServer?.id || "", activeChannel?.id || "")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#A855F7",
                    border: "none",
                    color: "#FFF",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(168, 85, 247, 0.4)",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#9333EA")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#A855F7")}
                >
                  <Icon icon="mage:check" /> Regelwerk gelesen & freischalten
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Footer */}
      <footer className="message-input-area" style={{ position: "relative" }}>
        <input 
          type="file" 
          ref={chatAttachmentInputRef} 
          style={{ display: "none" }} 
          onChange={handleChatAttachmentChange} 
        />

        {showCommandSuggestions && (
          <div className="command-suggestions-popup">
            <header className="suggestions-header">
              <span>Verfügbare Befehle</span>
            </header>
            <div className="suggestions-list">
              {AVAILABLE_COMMANDS.filter((cmd) => cmd.name.toLowerCase().startsWith(inputText.toLowerCase())).map((cmd) => (
                <button 
                  key={cmd.name}
                  type="button"
                  className="suggestion-item"
                  onClick={() => {
                    setInputText(cmd.name + " ");
                    setShowCommandSuggestions(false);
                    document.getElementById("chat-input-field")?.focus();
                  }}
                >
                  <span className="suggestion-icon"><Icon icon={cmd.icon} /></span>
                  <div className="suggestion-details">
                    <span className="suggestion-name">{cmd.name}</span>
                    <span className="suggestion-desc">{cmd.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {pendingAttachment && (
          <div className="pending-attachment-preview">
            <div className="attachment-preview-content">
              {pendingAttachment.dataUrl ? (
                <img src={pendingAttachment.dataUrl} alt="Vorschau" className="attachment-preview-img" />
              ) : (
                <Icon icon="mage:file-records" className="attachment-preview-icon" />
              )}
              <div className="attachment-preview-info">
                <span className="attachment-preview-name">{pendingAttachment.name}</span>
                <span className="attachment-preview-size">{pendingAttachment.size}</span>
              </div>
            </div>
            <button 
              type="button" 
              className="attachment-preview-remove" 
              onClick={() => setPendingAttachment(null)}
              title="Anhang entfernen"
            >
              <Icon icon="mage:multiply" />
            </button>
          </div>
        )}

        {isRulesChannel && !isServerOwner ? (
          <div
            className="rules-input-locked"
            style={{
              padding: "14px 18px",
              margin: "6px 12px 10px 12px",
              backgroundColor: "rgba(24, 25, 27, 0.95)",
              border: "1px solid rgba(168, 85, 247, 0.25)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#94A3B8",
              fontSize: "12px"
            }}
          >
            <Icon icon="mage:lock" style={{ fontSize: "18px", color: "#A855F7", flexShrink: 0 }} />
            <span>
              🔒 <strong>Schreibgeschützt:</strong> Nur der Server-Eigentümer kann in diesem Regelwerkskanal schreiben. Bestätige das Regelwerk oben für deine Freischaltung.
            </span>
          </div>
        ) : (
          <>
            {isRulesChannel && isServerOwner && (
              <div
                className="git-owner-bar"
                style={{
                  padding: "6px 16px",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Icon icon="octicon:git-branch-16" />
                <span>
                  <strong>Eigentümer-Modus:</strong> Neue Nachrichten werden automatisch als <code>README.md</code> in Git synchronisiert. Tipp: Nutze <code>/boxed</code> für Card-Layout.
                </span>
              </div>
            )}
            <form
              className="message-input-container"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(e);
                const field = document.getElementById("chat-input-field") as HTMLTextAreaElement | null;
                if (field) field.style.height = "auto";
              }}
            >
              <button className="input-action-btn" type="button" onClick={() => chatAttachmentInputRef.current?.click()} title="Anhang hinzufügen">
                <Icon icon="mage:plus" />
              </button>
              <div className="message-input-wrapper">
                <textarea
                  className="message-input"
                  id="chat-input-field"
                  rows={1}
                  placeholder={
                    isRulesChannel
                      ? "Regelwerk verfassen (Markdown unterstützt, Shift+Enter für Zeilenumbruch)..."
                      : `Nachrichten an #${activeChannel?.name || "allgemein"} (Shift+Enter für Zeilenumbruch)`
                  }
                  value={inputText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInputText(val);
                    setShowCommandSuggestions(val.startsWith("/"));
                    // Auto-grow textarea height
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 220)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                      e.currentTarget.style.height = "auto";
                    }
                  }}
                  autoComplete="off"
                />
              </div>
              <div className="input-actions-right">
                <button className="input-action-btn" type="button" onClick={() => { setEditorCode(""); setEditorWorkflowStep("select_action"); setIsEditorOpen(true); }} title="Codeblock teilen">
                  <Icon icon="lucide:code" style={{ fontSize: "16px" }} />
                </button>
                <button
                  className="input-action-btn send-btn"
                  type="submit"
                  title="Senden (Enter)"
                  style={{ color: inputText.trim() ? "var(--accent-color, #38BDF8)" : undefined }}
                >
                  <Icon icon="lucide:send" style={{ fontSize: "16px" }} />
                </button>
              </div>
            </form>
          </>
        )}
      </footer>
    </main>
  );
};
