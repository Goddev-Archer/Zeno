import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Category, Channel } from "../../types";

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialCategoryName?: string;
  onChannelCreated: (categoryName: string, channel: Channel, autoCommitGit: boolean) => void;
  showToast: (msg: string) => void;
  hasGitRepo?: boolean;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialCategoryName,
  onChannelCreated,
  showToast,
  hasGitRepo = false
}) => {
  const [channelType, setChannelType] = useState<"text" | "voice">("text");
  const [channelName, setChannelName] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [autoCommitGit, setAutoCommitGit] = useState<boolean>(hasGitRepo);

  useEffect(() => {
    if (isOpen) {
      if (initialCategoryName && categories.some((c) => c.name === initialCategoryName)) {
        setSelectedCategory(initialCategoryName);
        const cat = categories.find((c) => c.name === initialCategoryName);
        if (cat) setChannelType(cat.type);
      } else if (categories.length > 0) {
        setSelectedCategory(categories[0].name);
        setChannelType(categories[0].type);
      }
      setChannelName("");
      setAutoCommitGit(hasGitRepo);
    }
  }, [isOpen, initialCategoryName, categories, hasGitRepo]);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (channelType === "text") {
      // Slugify for text channels
      const slugified = raw.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");
      setChannelName(slugified);
    } else {
      setChannelName(raw);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = channelName.trim();
    if (!cleanName) {
      showToast("Bitte gib einen Kanalnamen ein!");
      return;
    }

    if (!selectedCategory) {
      showToast("Bitte wähle eine Zielkategorie aus!");
      return;
    }

    const newChannel: Channel = {
      id: `chn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      connectedUsers: channelType === "voice" ? [] : undefined
    };

    onChannelCreated(selectedCategory, newChannel, autoCommitGit);
    showToast(`Kanal #${cleanName} erstellt! 🎉`);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          width: "440px",
          maxWidth: "92vw",
          backgroundColor: "#1E1F22",
          border: "1px solid #3574F0",
          borderRadius: "12px",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(53, 116, 240, 0.2)",
          padding: "24px",
          color: "#E3E4E8",
          display: "flex",
          flexDirection: "column",
          gap: "18px"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "rgba(53, 116, 240, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3574F0",
                fontSize: "20px"
              }}
            >
              <Icon icon={channelType === "text" ? "mage:hashtag" : "mage:volume-up"} />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#FFF" }}>
                Kanal erstellen
              </h2>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                In Kategorie: <strong>{selectedCategory || "Auswählen"}</strong>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#64748B",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px"
            }}
          >
            <Icon icon="mage:multiply" />
          </button>
        </div>

        {/* Channel Type Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#94A3B8" }}>
            KANAL-TYP
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setChannelType("text")}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: channelType === "text" ? "1.5px solid #3574F0" : "1px solid #2B2D30",
                backgroundColor: channelType === "text" ? "rgba(53, 116, 240, 0.12)" : "#18191B",
                color: channelType === "text" ? "#FFF" : "#94A3B8",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px"
              }}
            >
              <Icon icon="mage:hashtag" style={{ color: "#3574F0", fontSize: "16px" }} />
              Text-Kanal
            </button>
            <button
              type="button"
              onClick={() => setChannelType("voice")}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: channelType === "voice" ? "1.5px solid #00FF87" : "1px solid #2B2D30",
                backgroundColor: channelType === "voice" ? "rgba(0, 255, 135, 0.12)" : "#18191B",
                color: channelType === "voice" ? "#FFF" : "#94A3B8",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px"
              }}
            >
              <Icon icon="mage:volume-up" style={{ color: "#00FF87", fontSize: "16px" }} />
              Sprach-Kanal
            </button>
          </div>
        </div>

        {/* Category Dropdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#94A3B8" }}>
            KATEGORIE
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: "10px 12px",
              backgroundColor: "#18191B",
              border: "1px solid #2B2D30",
              borderRadius: "8px",
              color: "#FFF",
              fontSize: "13px",
              outline: "none"
            }}
          >
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.type === "text" ? "Text" : "Sprache"})
              </option>
            ))}
          </select>
        </div>

        {/* Channel Name Input */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#94A3B8" }}>
              KANALNAME
            </label>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center"
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  color: "#64748B",
                  fontSize: "14px",
                  pointerEvents: "none"
                }}
              >
                {channelType === "text" ? "#" : "🔊"}
              </span>
              <input
                type="text"
                value={channelName}
                onChange={handleNameChange}
                placeholder={channelType === "text" ? "neuer-kanal" : "Lobby Alpha"}
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 32px",
                  backgroundColor: "#18191B",
                  border: "1px solid #2B2D30",
                  borderRadius: "8px",
                  color: "#FFF",
                  fontSize: "13px",
                  fontFamily: channelType === "text" ? "monospace" : "inherit",
                  outline: "none"
                }}
              />
            </div>
            <span style={{ fontSize: "11px", color: "#64748B" }}>
              {channelType === "text"
                ? "Kleinbuchstaben, Zahlen und Bindestriche empfohlen."
                : "Beliebiger Name für Sprachübertragungen."}
            </span>
          </div>

          {/* Auto Git Sync Checkbox */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              borderRadius: "8px",
              border: "1px solid #2B2D30",
              cursor: "pointer"
            }}
          >
            <input
              type="checkbox"
              checked={autoCommitGit}
              onChange={(e) => setAutoCommitGit(e.target.checked)}
              style={{ accentColor: "#3574F0", width: "16px", height: "16px" }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#E3E4E8" }}>
                Automatisch in zeno-server.json (Git) sichern
              </span>
              <span style={{ fontSize: "10px", color: "#64748B" }}>
                Aktualisiert das deklarative Manifest lokal und bereitet den Commit vor.
              </span>
            </div>
          </label>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #3B4048",
                backgroundColor: "transparent",
                color: "#94A3B8",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!channelName.trim()}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: channelName.trim() ? "#3574F0" : "#2B2D30",
                color: channelName.trim() ? "#FFF" : "#64748B",
                fontSize: "13px",
                fontWeight: "600",
                cursor: channelName.trim() ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: channelName.trim() ? "0 4px 12px rgba(53, 116, 240, 0.3)" : "none"
              }}
            >
              <Icon icon="mage:plus" />
              Kanal erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
