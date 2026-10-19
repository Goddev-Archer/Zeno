import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { DmConversation } from "../../types";
import { MAX_SELF_CHATS } from "../../data/mockData";

interface CreateDmModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingDms: DmConversation[];
  onCreatePeerDm: (ain: string, nickname: string) => void;
  onCreateSelfChat: (topicName: string, avatarEmoji?: string) => void;
  showToast: (msg: string) => void;
}

const SELF_CHAT_PRESETS = [
  { name: "Allgemeine Notizen", emoji: "📝" },
  { name: "Code & Snippets", emoji: "💻" },
  { name: "To-Do Liste", emoji: "✅" },
  { name: "Ideen & Entwürfe", emoji: "💡" },
  { name: "Temporäre Ablage", emoji: "📦" }
];

export const CreateDmModal: React.FC<CreateDmModalProps> = ({
  isOpen,
  onClose,
  existingDms,
  onCreatePeerDm,
  onCreateSelfChat,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<"peer" | "self">("peer");
  
  // Peer form state
  const [peerAinInput, setPeerAinInput] = useState<string>("");
  const [peerNicknameInput, setPeerNicknameInput] = useState<string>("");

  // Self-chat form state
  const [selfChatName, setSelfChatName] = useState<string>("");
  const [selectedEmoji, setSelectedEmoji] = useState<string>("📝");

  if (!isOpen) return null;

  const currentSelfChatsCount = existingDms.filter((d) => d.isSelfChat).length;
  const isSelfChatLimitReached = currentSelfChatsCount >= MAX_SELF_CHATS;

  const handleCreatePeer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAin = peerAinInput.trim().toUpperCase();
    if (!cleanAin) {
      showToast("Bitte gib eine gültige AIN ein.");
      return;
    }

    const cleanNick = peerNicknameInput.trim() || `Peer ${cleanAin.slice(-4)}`;
    onCreatePeerDm(cleanAin, cleanNick);
    setPeerAinInput("");
    setPeerNicknameInput("");
    onClose();
  };

  const handleCreateSelf = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSelfChatLimitReached) {
      showToast(`Best-Practice-Limit von ${MAX_SELF_CHATS} Notizbüchern erreicht.`);
      return;
    }

    const finalName = selfChatName.trim() || "Notizbuch";
    onCreateSelfChat(finalName, selectedEmoji);
    setSelfChatName("");
    onClose();
  };

  const handleSelectPreset = (preset: { name: string; emoji: string }) => {
    if (isSelfChatLimitReached) {
      showToast(`Best-Practice-Limit von ${MAX_SELF_CHATS} Notizbüchern erreicht.`);
      return;
    }
    onCreateSelfChat(preset.name, preset.emoji);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-window create-dm-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "480px",
          width: "92%",
          background: "var(--bg-island)",
          border: "1px solid var(--border-island)",
          borderRadius: "14px",
          padding: "24px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.65)"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "var(--text-primary)" }}>
              Neuen Chat starten
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
              Wähle zwischen einem P2P-Kontakt oder einem privaten Notizboard
            </p>
          </div>
          <button
            type="button"
            className="user-control-btn"
            onClick={onClose}
            title="Schließen"
            style={{ width: "30px", height: "30px", borderRadius: "8px" }}
          >
            <Icon icon="lucide:x" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            background: "var(--bg-island-alt)",
            padding: "4px",
            borderRadius: "8px",
            marginBottom: "20px"
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("peer")}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: activeTab === "peer" ? "600" : "500",
              background: activeTab === "peer" ? "var(--bg-elevated)" : "transparent",
              color: activeTab === "peer" ? "var(--text-primary)" : "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s ease"
            }}
          >
            <Icon icon="mage:user-plus" style={{ fontSize: "15px" }} />
            P2P-Kontakt
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("self")}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: activeTab === "self" ? "600" : "500",
              background: activeTab === "self" ? "var(--bg-elevated)" : "transparent",
              color: activeTab === "self" ? "var(--accent-oxide)" : "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s ease"
            }}
          >
            <Icon icon="mage:edit-pen" style={{ fontSize: "15px" }} />
            <span>Selbstchat / Notizboard</span>
            <span
              style={{
                fontSize: "10px",
                padding: "1px 6px",
                borderRadius: "10px",
                background: isSelfChatLimitReached ? "rgba(239, 68, 68, 0.2)" : "rgba(249, 115, 22, 0.15)",
                color: isSelfChatLimitReached ? "#EF4444" : "var(--accent-oxide)",
                fontWeight: "700"
              }}
            >
              {currentSelfChatsCount}/{MAX_SELF_CHATS}
            </span>
          </button>
        </div>

        {/* Tab 1: P2P Peer */}
        {activeTab === "peer" && (
          <form onSubmit={handleCreatePeer} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="settings-field">
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>
                Account Identifier Number (AIN)
              </label>
              <input
                type="text"
                className="zeno-input"
                placeholder="z. B. ZENO-8F3A-9B21-44E2"
                value={peerAinInput}
                onChange={(e) => setPeerAinInput(e.target.value)}
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--bg-canvas)",
                  border: "1px solid var(--border-island)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px"
                }}
              />
            </div>

            <div className="settings-field">
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>
                Nickname / Anzeigename (Optional)
              </label>
              <input
                type="text"
                className="zeno-input"
                placeholder="z. B. Alice (Dev Team)"
                value={peerNicknameInput}
                onChange={(e) => setPeerNicknameInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--bg-canvas)",
                  border: "1px solid var(--border-island)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontSize: "13px"
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                padding: "10px 12px",
                background: "rgba(56, 189, 248, 0.08)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                borderRadius: "8px",
                fontSize: "11px",
                color: "var(--text-secondary)"
              }}
            >
              <Icon icon="lucide:shield-check" style={{ fontSize: "16px", color: "var(--accent-relay)", flexShrink: 0, marginTop: "2px" }} />
              <span>
                P2P-Direktkanäle verbinden dich direkt über Ende-zu-Ende-Verschlüsselung (Argon2id + ChaCha20). Weder Zeno noch Dritte können eure Nachrichten mitlesen.
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
              <button
                type="button"
                className="settings-btn"
                onClick={onClose}
                style={{ padding: "8px 16px", borderRadius: "8px" }}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="settings-btn primary"
                disabled={!peerAinInput.trim()}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  background: "var(--accent-oxide)",
                  color: "#FFFFFF",
                  fontWeight: "600"
                }}
              >
                P2P-Chat starten
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Selbstchat / Notizboard */}
        {activeTab === "self" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                padding: "10px 12px",
                background: "rgba(249, 115, 22, 0.08)",
                border: "1px solid rgba(249, 115, 22, 0.25)",
                borderRadius: "8px",
                fontSize: "11px",
                color: "var(--text-secondary)"
              }}
            >
              <Icon icon="lucide:bookmark" style={{ fontSize: "16px", color: "var(--accent-oxide)", flexShrink: 0, marginTop: "2px" }} />
              <span>
                <strong>Selbstchats</strong> dienen als privates Notizboard für persönliche Gedanken, Code-Snippets, To-Dos und Zwischenspeicher. Sie werden 100% lokal auf deinem Computer gespeichert.
              </span>
            </div>

            {/* Quick Presets */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "8px", color: "var(--text-secondary)" }}>
                Schnellwahl / Empfohlene Themen:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {SELF_CHAT_PRESETS.map((preset) => {
                  const alreadyExists = existingDms.some(
                    (d) => d.isSelfChat && d.peerName.toLowerCase() === preset.name.toLowerCase()
                  );
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      disabled={isSelfChatLimitReached || alreadyExists}
                      onClick={() => handleSelectPreset(preset)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 10px",
                        background: alreadyExists ? "rgba(255, 255, 255, 0.02)" : "var(--bg-canvas)",
                        border: "1px solid var(--border-island)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: alreadyExists ? "var(--text-muted)" : "var(--text-primary)",
                        cursor: isSelfChatLimitReached || alreadyExists ? "not-allowed" : "pointer",
                        opacity: alreadyExists ? 0.5 : 1,
                        textAlign: "left",
                        transition: "border-color 0.15s ease, background 0.15s ease"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelfChatLimitReached && !alreadyExists) {
                          e.currentTarget.style.borderColor = "var(--accent-oxide)";
                          e.currentTarget.style.background = "var(--bg-elevated)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelfChatLimitReached && !alreadyExists) {
                          e.currentTarget.style.borderColor = "var(--border-island)";
                          e.currentTarget.style.background = "var(--bg-canvas)";
                        }
                      }}
                    >
                      <span style={{ fontSize: "14px" }}>{preset.emoji}</span>
                      <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {preset.name}
                      </span>
                      {alreadyExists && <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>aktiv</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Name */}
            <form onSubmit={handleCreateSelf} style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
                Oder eigenes Notizbuch benennen:
              </label>
              
              {/* Emoji selector */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Symbol:</span>
                {["📝", "💻", "✅", "💡", "📦", "🔒", "⭐"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      border: selectedEmoji === emoji ? "1px solid var(--accent-oxide)" : "1px solid var(--border-island)",
                      background: selectedEmoji === emoji ? "rgba(249, 115, 22, 0.15)" : "var(--bg-canvas)",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer"
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  className="zeno-input"
                  placeholder="z. B. Projekt Zeno Backlog"
                  value={selfChatName}
                  onChange={(e) => setSelfChatName(e.target.value)}
                  disabled={isSelfChatLimitReached}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    background: "var(--bg-canvas)",
                    border: "1px solid var(--border-island)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "13px"
                  }}
                />
                <button
                  type="submit"
                  disabled={isSelfChatLimitReached || !selfChatName.trim()}
                  className="settings-btn primary"
                  style={{
                    padding: "9px 16px",
                    borderRadius: "8px",
                    background: "var(--accent-oxide)",
                    color: "#FFFFFF",
                    fontWeight: "600",
                    whiteSpace: "nowrap"
                  }}
                >
                  Erstellen
                </button>
              </div>
            </form>

            {isSelfChatLimitReached && (
              <p style={{ margin: 0, fontSize: "11px", color: "var(--status-danger)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon icon="tabler:alert-triangle" />
                Best-Practice-Limit erreicht: Maximal {MAX_SELF_CHATS} Notizbücher zur optimalen Übersicht.
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
              <button
                type="button"
                className="settings-btn"
                onClick={onClose}
                style={{ padding: "8px 16px", borderRadius: "8px" }}
              >
                Schließen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
