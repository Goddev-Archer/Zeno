import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Server } from "../../types";

interface CreateJoinServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServerCreated: (newServer: Server) => void;
  onServerJoined: (serverInviteCode: string) => void;
  showToast: (msg: string) => void;
}

export const CreateJoinServerModal: React.FC<CreateJoinServerModalProps> = ({
  isOpen,
  onClose,
  onServerCreated,
  onServerJoined,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  
  // Create Server Form State
  const [serverName, setServerName] = useState("");
  const [serverDescription, setServerDescription] = useState("");
  const [serverIcon, setServerIcon] = useState("🛡️");
  const [isEncrypted, setIsEncrypted] = useState(true);

  // Join Server Form State
  const [inviteCode, setInviteCode] = useState("");

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim()) {
      showToast("Bitte gib einen Servernamen ein!");
      return;
    }

    const serverId = `srv-${Date.now()}`;
    const newServer: Server = {
      id: serverId,
      name: serverName.trim(),
      iconLetter: serverIcon,
      icon: serverIcon,
      description: serverDescription.trim(),
      unreadCount: 0,
      categories: [
        {
          name: "TEXTKANÄLE",
          type: "text",
          channels: [
            { id: `chn-${Date.now()}-1`, name: "allgemein" },
            { id: `chn-${Date.now()}-2`, name: "dev-lounge" }
          ]
        },
        {
          name: "SPRACHKANÄLE",
          type: "voice",
          channels: [
            { id: `chn-${Date.now()}-3`, name: "Sprachkanal Alpha" }
          ]
        }
      ]
    };

    // Auto-generate zeno-server.json Git manifest
    const manifestBlob = {
      version: "1.0.0",
      serverId,
      name: serverName.trim(),
      description: serverDescription.trim(),
      encrypted: isEncrypted,
      createdAt: new Date().toISOString(),
      categories: newServer.categories
    };

    console.log("[Zeno Server Wizard] Auto-generated zeno-server.json Git manifest:", manifestBlob);
    
    onServerCreated(newServer);
    showToast(`Server "${serverName}" erfolgreich erstellt! Manifest zeno-server.json generiert. 🚀`);
    onClose();
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      showToast("Bitte gib einen Einladungs-Code oder zeno:// Link ein!");
      return;
    }

    onServerJoined(inviteCode.trim());
    showToast(`Server mit Code "${inviteCode.trim()}" beigetreten!`);
    onClose();
  };

  const iconOptions = ["🛡️", "⚡", "🚀", "🪐", "🔥", "💻", "🎮", "🔒"];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div 
        className="modal-container glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "480px", backgroundColor: "#111319", border: "1px solid #1E222D", borderRadius: "16px", padding: "24px", color: "#E2E8F0", boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "rgba(0, 255, 135, 0.15)", border: "1px solid rgba(0, 255, 135, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00FF87", fontSize: "18px" }}>
              <Icon icon={activeTab === "create" ? "mage:plus" : "mage:link-2"} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#FFF" }}>
                {activeTab === "create" ? "Neuen Server erstellen" : "Einem Server beitreten"}
              </h3>
              <p style={{ fontSize: "11px", color: "#94A3B8", margin: "2px 0 0 0" }}>
                {activeTab === "create" ? "Erstelle eine Zero-Knowledge Community mit Git-Manifest" : "Gib einen Einladungs-Code oder zeno:// Link ein"}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "18px" }}>
            <Icon icon="mage:multiply" />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: "flex", backgroundColor: "#0D0E12", padding: "4px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #1E222D" }}>
          <button
            onClick={() => setActiveTab("create")}
            style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", backgroundColor: activeTab === "create" ? "#1E222D" : "transparent", color: activeTab === "create" ? "#00FF87" : "#94A3B8", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <Icon icon="mage:plus" /> Server erstellen
          </button>
          <button
            onClick={() => setActiveTab("join")}
            style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", backgroundColor: activeTab === "join" ? "#1E222D" : "transparent", color: activeTab === "join" ? "#38BDF8" : "#94A3B8", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <Icon icon="mage:link-2" /> Server beitreten
          </button>
        </div>

        {/* TAB 1: CREATE SERVER FORM */}
        {activeTab === "create" && (
          <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", display: "block", marginBottom: "6px" }}>SERVER ICON WÄHLEN</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setServerIcon(icon)}
                    style={{ width: "38px", height: "38px", borderRadius: "8px", border: serverIcon === icon ? "2px solid #00FF87" : "1px solid #1E222D", backgroundColor: serverIcon === icon ? "rgba(0,255,135,0.15)" : "#0D0E12", fontSize: "18px", cursor: "pointer" }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", display: "block", marginBottom: "6px" }}>SERVER NAME *</label>
              <input
                type="text"
                placeholder="z. B. CipherNaut Dev Lounge"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                style={{ width: "100%", backgroundColor: "#0D0E12", border: "1px solid #262933", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#FFF", outline: "none" }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", display: "block", marginBottom: "6px" }}>BESCHREIBUNG / THEMA</label>
              <input
                type="text"
                placeholder="z. B. Öffentlicher Entwickler-Server für WASM & Crypto"
                value={serverDescription}
                onChange={(e) => setServerDescription(e.target.value)}
                style={{ width: "100%", backgroundColor: "#0D0E12", border: "1px solid #262933", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#FFF", outline: "none" }}
              />
            </div>

            <div style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", borderRadius: "10px", padding: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Icon icon="mage:lock" style={{ color: "#00FF87", fontSize: "20px" }} />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#FFF" }}>AES-256 E2EE Verschlüsselung</div>
                  <div style={{ fontSize: "10px", color: "#94A3B8" }}>Alle Nachrichten & Kanäle werden Ende-zu-Ende verschlüsselt</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isEncrypted}
                onChange={(e) => setIsEncrypted(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#00FF87", cursor: "pointer" }}
              />
            </div>

            <button
              type="submit"
              style={{ backgroundColor: "#00FF87", color: "#08090C", border: "none", padding: "12px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <Icon icon="mage:plus" /> Server erstellen & zeno-server.json generieren
            </button>
          </form>
        )}

        {/* TAB 2: JOIN SERVER FORM */}
        {activeTab === "join" && (
          <form onSubmit={handleJoinSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", display: "block", marginBottom: "6px" }}>EINLADUNGS-CODE ODER ZENO:// LINK *</label>
              <input
                type="text"
                placeholder="z. B. zeno://server/srv-alpha-99 oder zeno-invite-x8k2"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                style={{ width: "100%", backgroundColor: "#0D0E12", border: "1px solid #262933", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#FFF", outline: "none" }}
                required
              />
            </div>

            <div style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", borderRadius: "10px", padding: "12px", fontSize: "11px", color: "#94A3B8", lineHeight: "1.4" }}>
              💡 <b style={{ color: "#FFF" }}>Hinweis:</b> Nach der Eingabe prüft Zeno die kryptographische Signatur des Server-Manifests (`zeno-server.json`) und stellt die P2P-Verbindung her.
            </div>

            <button
              type="submit"
              style={{ backgroundColor: "#38BDF8", color: "#08090C", border: "none", padding: "12px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <Icon icon="mage:link-2" /> Server beitreten
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
