import React from "react";
import { Icon } from "@iconify/react";
import { Server, Channel, Message, Profile, MessageAttachment } from "../../types";
import { cleanUrl } from "../../utils/urlCleaner";

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
  connectedRelaysCount = 0,
  relayTooltip = "Multi-Relay Transport Status",
  onShowRelayDetails
}) => {
  return (
    <main className="chat-area">
      <header className="chat-header">
        <div className="chat-header-info">
          <span className="chat-header-icon"><Icon icon="mage:hashtag" /></span>
          <h2 className="chat-header-channel">{activeChannel?.name || "allgemein"}</h2>
          <span className="chat-header-divider" />
          <p className="chat-header-description">Kanal für {activeChannel?.name || "allgemein"} in {activeServer?.name || "Server"}</p>

          {/* Live Multi-Relay Status Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "2px 8px",
              borderRadius: "12px",
              backgroundColor: connectedRelaysCount > 0 ? "rgba(0, 255, 135, 0.12)" : "rgba(239, 68, 68, 0.12)",
              border: `1px solid ${connectedRelaysCount > 0 ? "rgba(0, 255, 135, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              fontSize: "10px",
              fontWeight: "600",
              color: connectedRelaysCount > 0 ? "#00FF87" : "#EF4444",
              marginLeft: "10px",
              cursor: onShowRelayDetails ? "pointer" : "default"
            }}
            onClick={onShowRelayDetails}
            title={relayTooltip}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: connectedRelaysCount > 0 ? "#00FF87" : "#EF4444",
                boxShadow: connectedRelaysCount > 0 ? "0 0 6px #00FF87" : "none"
              }}
            />
            <span>{connectedRelaysCount > 0 ? `${connectedRelaysCount} Relays aktiv` : "Relay verbindet..."}</span>
          </div>
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

        {(chatMessages[activeChannel?.id || "allgemein"] || []).map((msg, i) => {
          const urlMatch = msg.text ? msg.text.match(/(https?:\/\/[^\s]+)/) : null;
          const foundUrl = urlMatch ? urlMatch[0] : null;
          const urlDetails = foundUrl ? cleanUrl(foundUrl) : null;

          return (
            <article 
              key={i} 
              className="message message-animate"
              style={{ "--idx": Math.min(i, 6) } as React.CSSProperties}
            >
              <div 
                className={`message-avatar ${msg.color}`}
                onClick={() => setSelectedUserProfile(mockProfiles[msg.author] || null)}
                style={{ cursor: "pointer" }}
                title={`Profil von ${msg.author} anzeigen`}
              >
                {msg.author[0]}
              </div>
              <div className="message-body">
                <header className="message-header">
                  <span className={`message-author ${msg.color}`} onClick={() => setSelectedUserProfile(mockProfiles[msg.author] || null)} style={{ cursor: "pointer" }}>
                    {msg.author}
                  </span>
                  {mockProfiles[msg.author]?.role === "Bot" && <span className="badge bot-badge">BOT</span>}
                  <time className="message-timestamp">{msg.time}</time>
                </header>
                <div className="message-content">
                  <p>
                    {foundUrl && urlDetails ? (
                      <>
                        {msg.text.split(foundUrl)[0]}
                        <span 
                          style={{ color: "var(--glow-color-1, #3574F0)", textDecoration: "underline", cursor: "pointer", fontWeight: "600" }} 
                          onClick={() => openInPrivacyBrowser(foundUrl)}
                        >
                          {urlDetails.cleanedUrl}
                        </span>
                        {msg.text.split(foundUrl)[1]}
                      </>
                    ) : (
                      msg.text
                    )}
                  </p>

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
                          <Icon icon="mage:global" /> Im Browser öffnen
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
                  
                  {/* Embedded Code Block */}
                  {msg.code && (
                    <div className="code-block-wrapper" data-language="rust">
                      <header className="code-block-header">
                        <span className="code-block-language">Rust</span>
                        <div className="code-block-actions">
                          <button 
                            className="code-action-btn btn-open-editor" 
                            onClick={() => { setEditorCode(msg.code || ""); setEditorFilename("snippet.rs"); setEditorLanguage(detectLanguage(msg.code || "")); setEditorWorkflowStep("editor"); setIsEditorOpen(true); }}
                          >
                            Open in Editor
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
              </div>
            </article>
          );
        })}
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

        <form className="message-input-container" onSubmit={handleSendMessage}>
          <button className="input-action-btn" type="button" onClick={() => chatAttachmentInputRef.current?.click()} title="Anhang hinzufügen">
            <Icon icon="mage:plus" />
          </button>
          <div className="message-input-wrapper">
            <input
              type="text"
              className="message-input"
              id="chat-input-field"
              placeholder={`Nachrichten an #${activeChannel?.name || "allgemein"}`}
              value={inputText}
              onChange={(e) => {
                const val = e.target.value;
                setInputText(val);
                setShowCommandSuggestions(val.startsWith("/"));
              }}
              autoComplete="off"
            />
          </div>
          <div className="input-actions-right">
            <button className="input-action-btn" type="button" onClick={() => { setEditorCode(""); setEditorWorkflowStep("select_action"); setIsEditorOpen(true); }} title="Codeblock teilen">
              <Icon icon="mage:code" />
            </button>
            <button className="input-action-btn" type="button" onClick={() => showToast("Emojis sind deaktiviert")} title="Emoji hinzufügen">
              <Icon icon="mage:smile" />
            </button>
          </div>
        </form>
      </footer>
    </main>
  );
};
