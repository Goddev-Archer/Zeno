import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Server, Channel, Profile } from "../../types";
import { ZeitschattenVoiceHalo } from "../common/ZeitschattenVoiceHalo";

interface ChannelSidebarProps {
  activeServerId: string;
  homeTab: "dashboard" | "wasm_hub" | "ide";
  activeServer: Server;
  activeChannel: Channel;
  collapsedCategories: Record<string, boolean>;
  connectedVoice: string | null;
  voiceDuration: number;
  theme: "dark" | "light";
  muted: boolean;
  deafened: boolean;
  mockProfiles: Record<string, Profile>;
  setHomeTab: (tab: "dashboard" | "wasm_hub" | "ide") => void;
  toggleCategory: (categoryName: string) => void;
  setActiveChannel: (channel: Channel) => void;
  handleJoinVoice: (channelId: string, channelName: string) => void;
  handleDisconnectVoice: () => void;
  handleThemeToggle: () => void;
  setMuted: (muted: boolean) => void;
  setDeafened: (deafened: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setSelectedUserProfile: (profile: Profile | null) => void;
  showToast: (msg: string) => void;
  formatVoiceTime: (seconds: number) => string;
  userAin?: string;
  userName?: string;
  onOpenSovereignModal?: () => void;
  onAddChannelClick?: (categoryName: string) => void;
  onDeleteChannel?: (categoryName: string, channelId: string) => void;
  onOpenGitSyncModal?: () => void;
  onAddCategoryClick?: () => void;
  isLocalSpeaking?: boolean;
  localAudioLevel?: number;
  activeVoiceSpeakers?: string[];
  voicePing?: number;
  onOpenVoiceSettings?: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  activeServerId,
  homeTab,
  activeServer,
  activeChannel,
  collapsedCategories,
  connectedVoice,
  voiceDuration,
  theme,
  muted,
  deafened,
  mockProfiles,
  setHomeTab,
  toggleCategory,
  setActiveChannel,
  handleJoinVoice,
  handleDisconnectVoice,
  handleThemeToggle,
  setMuted,
  setDeafened,
  setIsSettingsOpen,
  setSelectedUserProfile,
  showToast,
  formatVoiceTime,
  userAin,
  userName,
  onOpenSovereignModal,
  onAddChannelClick,
  onDeleteChannel,
  onOpenGitSyncModal,
  onAddCategoryClick,
  isLocalSpeaking = false,
  localAudioLevel = 0,
  activeVoiceSpeakers = [],
  voicePing = 14,
  onOpenVoiceSettings
}) => {
  const [serverMenuOpen, setServerMenuOpen] = useState(false);
  const [hoveredChannelId, setHoveredChannelId] = useState<string | null>(null);

  if (activeServerId === "home" && homeTab === "ide") return null;

  return (
    <aside className="channel-sidebar">
      {activeServerId === "home" ? (
        <>
          <header className="server-header">
            <h1 className="server-name">Zeno Home</h1>
            <Icon icon="mage:home" style={{ fontSize: "16px", color: "var(--text-muted)" }} />
          </header>
          <div className="channel-list">
            <section className="channel-category">
              <button className="category-header" style={{ cursor: "default" }}>
                <span className="category-name">NAVIGATION</span>
              </button>
              <ul className="category-channels">
                <li>
                  <button 
                    className={`channel-item ${homeTab === "dashboard" ? "active" : ""}`}
                    onClick={() => setHomeTab("dashboard")}
                  >
                    <span className="channel-icon"><Icon icon="mage:dashboard" /></span>
                    <span className="channel-name">Dashboard</span>
                  </button>
                </li>
                <li>
                  <button 
                    className={`channel-item ${homeTab === "wasm_hub" ? "active" : ""}`}
                    onClick={() => setHomeTab("wasm_hub")}
                  >
                    <span className="channel-icon"><Icon icon="mage:box-3d" style={{ color: "#3574F0" }} /></span>
                    <span className="channel-name">⚡ WASM Runtime Hub</span>
                  </button>
                </li>
                <li>
                  <button 
                    className={`channel-item ${homeTab === "ide" ? "active" : ""}`}
                    onClick={() => setHomeTab("ide")}
                  >
                    <span className="channel-icon"><Icon icon="mage:code" style={{ color: "#59A869" }} /></span>
                    <span className="channel-name">🛠️ Zeno Full-IDE</span>
                  </button>
                </li>
                <li>
                  <button className="channel-item" onClick={() => setIsSettingsOpen(true)}>
                    <span className="channel-icon"><Icon icon="mage:settings" /></span>
                    <span className="channel-name">Einstellungen</span>
                  </button>
                </li>
              </ul>
            </section>
          </div>
        </>
      ) : (
        <>
          <header className="server-header" style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
              <h1 className="server-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {activeServer?.name || "Server"}
              </h1>
              <button
                className="git-sync-header-badge"
                onClick={onOpenGitSyncModal}
                title="Git Server Manifest Synchronisation"
                style={{
                  background: "rgba(53, 116, 240, 0.15)",
                  border: "1px solid rgba(53, 116, 240, 0.35)",
                  borderRadius: "10px",
                  color: "#3574F0",
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "2px 6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                  flexShrink: 0
                }}
              >
                <Icon icon="octicon:git-branch-16" />
                <span>Git</span>
              </button>
            </div>
            <button
              className="server-dropdown-toggle"
              onClick={() => setServerMenuOpen(!serverMenuOpen)}
              title="Server-Menü"
            >
              <Icon icon={serverMenuOpen ? "mage:chevron-up" : "mage:chevron-down"} />
            </button>

            {/* Server Dropdown Popover */}
            {serverMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "12px",
                  right: "12px",
                  backgroundColor: "#18191B",
                  border: "1px solid #3574F0",
                  borderRadius: "10px",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  padding: "6px",
                  gap: "2px"
                }}
              >
                <button
                  onClick={() => {
                    setServerMenuOpen(false);
                    onAddChannelClick && onAddChannelClick(activeServer?.categories?.[0]?.name || "");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "6px",
                    color: "#E3E4E8",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(53, 116, 240, 0.15)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Icon icon="mage:plus" style={{ color: "#3574F0" }} />
                  Kanal erstellen
                </button>
                <button
                  onClick={() => {
                    setServerMenuOpen(false);
                    onAddCategoryClick && onAddCategoryClick();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "6px",
                    color: "#E3E4E8",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(53, 116, 240, 0.15)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Icon icon="mage:folder-plus" style={{ color: "#F2C94C" }} />
                  Kategorie erstellen
                </button>
                <button
                  onClick={() => {
                    setServerMenuOpen(false);
                    onOpenGitSyncModal && onOpenGitSyncModal();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "6px",
                    color: "#E3E4E8",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(53, 116, 240, 0.15)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Icon icon="octicon:git-branch-16" style={{ color: "#00FF87" }} />
                  Git-Manifest synchronisieren
                </button>
              </div>
            )}
          </header>
          <div className="channel-list" key={activeServer?.id || "server"}>
            {(activeServer?.categories || []).map((cat) => {
              const isCollapsed = collapsedCategories[cat.name];
              return (
                <section key={cat.name} className="channel-category">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingRight: "8px"
                    }}
                  >
                    <button
                      className="category-header"
                      onClick={() => toggleCategory(cat.name)}
                      style={{ flex: 1, paddingRight: "4px" }}
                    >
                      <span className={`category-arrow ${isCollapsed ? "collapsed" : ""}`}>
                        <Icon icon="mage:chevron-down" />
                      </span>
                      <span className="category-name">{cat.name.toUpperCase()}</span>
                    </button>
                    <button
                      title={`Kanal in "${cat.name}" hinzufügen`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddChannelClick && onAddChannelClick(cat.name);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#64748B",
                        cursor: "pointer",
                        padding: "2px 4px",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: "4px"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#FFF")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
                    >
                      <Icon icon="mage:plus" />
                    </button>
                  </div>
                  
                  {!isCollapsed && (
                    <ul className="category-channels">
                      {cat.channels.map((ch, idx) => {
                        const isText = cat.type === "text";
                        const isChannelActive = activeChannel?.id === ch.id;
                        
                        return (
                          <li
                            key={ch.id}
                            style={{ position: "relative", display: "flex", alignItems: "center" }}
                            onMouseEnter={() => setHoveredChannelId(ch.id)}
                            onMouseLeave={() => setHoveredChannelId(null)}
                          >
                            <button
                              className={`channel-item channel-item-animate ${isChannelActive ? "active" : ""} ${!isText ? "voice-channel" : ""}`}
                              onClick={() => isText ? setActiveChannel(ch) : handleJoinVoice(ch.id, ch.name)}
                              style={{ flex: 1, paddingRight: "26px", "--idx": Math.min(idx, 6) } as React.CSSProperties}
                            >
                              <span className="channel-icon">
                                <Icon icon={isText ? "mage:hashtag" : "mage:volume-up"} />
                              </span>
                              <span className="channel-name">{ch.name}</span>
                            </button>

                            {hoveredChannelId === ch.id && (
                              <button
                                title={`Kanal "${ch.name}" löschen`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Möchtest du den Kanal "${ch.name}" wirklich löschen?`)) {
                                    onDeleteChannel && onDeleteChannel(cat.name, ch.id);
                                  }
                                }}
                                style={{
                                  position: "absolute",
                                  right: "6px",
                                  background: "none",
                                  border: "none",
                                  color: "#64748B",
                                  fontSize: "13px",
                                  cursor: "pointer",
                                  padding: "3px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "4px"
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "#EB5757")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
                              >
                                <Icon icon="mage:trash" />
                              </button>
                            )}

                            {!isText && connectedVoice === ch.name && (
                              <ul className="voice-connected-users" style={{ paddingLeft: "24px", marginTop: "6px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                {/* Current Local User with Zeitschatten Halo */}
                                <li style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: isLocalSpeaking ? "#00FF87" : "#94A3B8", padding: "3px 6px", borderRadius: "6px", backgroundColor: isLocalSpeaking ? "rgba(0, 255, 135, 0.08)" : "transparent" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <ZeitschattenVoiceHalo isSpeaking={isLocalSpeaking} audioLevel={localAudioLevel} size={22}>
                                      <div 
                                        style={{
                                          width: "22px",
                                          height: "22px",
                                          borderRadius: "50%",
                                          backgroundColor: "#3574F0",
                                          color: "#FFF",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          fontSize: "10px",
                                          fontWeight: "700"
                                        }}
                                      >
                                        {(userName || "CipherNaut")[0].toUpperCase()}
                                      </div>
                                    </ZeitschattenVoiceHalo>
                                    <span style={{ fontWeight: isLocalSpeaking ? "700" : "500" }}>{userName || "CipherNaut"} (Du)</span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    {deafened ? (
                                      <span title="Taub gestellt"><Icon icon="mage:volume-mute" style={{ color: "#EF4444", fontSize: "12px" }} /></span>
                                    ) : muted ? (
                                      <span title="Stumm geschaltet"><Icon icon="mage:microphone-mute" style={{ color: "#EF4444", fontSize: "12px" }} /></span>
                                    ) : isLocalSpeaking ? (
                                      <span title="Spricht"><Icon icon="mage:volume-up" style={{ color: "#00FF87", fontSize: "12px" }} /></span>
                                    ) : (
                                      <span title="Mikrofon aktiv"><Icon icon="mage:microphone" style={{ color: "#64748B", fontSize: "12px" }} /></span>
                                    )}
                                  </div>
                                </li>

                                {/* Other Connected Channel Users */}
                                {(ch.connectedUsers || ["Alex", "Elena"])
                                  .filter((u) => !u.includes("(Du)") && u !== userName)
                                  .map((user) => {
                                    const isRemoteSpeaking = activeVoiceSpeakers.includes(user);
                                    return (
                                      <li key={user} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: isRemoteSpeaking ? "#00FF87" : "#94A3B8", padding: "3px 6px", borderRadius: "6px", backgroundColor: isRemoteSpeaking ? "rgba(0, 255, 135, 0.08)" : "transparent" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                          <ZeitschattenVoiceHalo isSpeaking={isRemoteSpeaking} audioLevel={0.6} size={22}>
                                            <div 
                                              style={{
                                                width: "22px",
                                                height: "22px",
                                                borderRadius: "50%",
                                                backgroundColor: "#2B2D30",
                                                color: "#FFF",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "10px",
                                                fontWeight: "700"
                                              }}
                                            >
                                              {user[0].toUpperCase()}
                                            </div>
                                          </ZeitschattenVoiceHalo>
                                          <span>{user}</span>
                                        </div>
                                        <Icon 
                                          icon={isRemoteSpeaking ? "mage:volume-up" : "mage:microphone"} 
                                          style={{ color: isRemoteSpeaking ? "#00FF87" : "#64748B", fontSize: "12px" }} 
                                        />
                                      </li>
                                    );
                                  })}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}

      {/* User Info Footer */}
      <footer className="user-panel">
        {connectedVoice && (
          <div className="voice-indicator" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", backgroundColor: "#0D0E12", borderBottom: "1px solid #1E222D" }}>
            <div className="voice-status" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="voice-status-icon">
                <Icon icon="mage:volume-up" className="voice-status-indicator pulse" style={{ color: isLocalSpeaking ? "#00FF87" : "#38BDF8" }} />
              </span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span className="voice-status-text" style={{ fontSize: "11px", color: "#FFF" }}>
                  <strong>{connectedVoice}</strong> ({formatVoiceTime(voiceDuration)})
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "9px", color: "#00FF87", fontFamily: "monospace" }}>
                    🟢 {voicePing}ms
                  </span>
                  {/* Live Mini VU-Meter */}
                  <div style={{ width: "36px", height: "4px", backgroundColor: "#1E222D", borderRadius: "2px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.min(localAudioLevel * 100, 100)}%`,
                        height: "100%",
                        backgroundColor: isLocalSpeaking ? "#00FF87" : "#38BDF8",
                        transition: "width 0.05s ease"
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {onOpenVoiceSettings && (
                <button
                  type="button"
                  onClick={onOpenVoiceSettings}
                  title="Sprache &amp; Audio-Einstellungen"
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
                >
                  <Icon icon="mage:settings" style={{ fontSize: "14px" }} />
                </button>
              )}
              <button className="voice-disconnect" onClick={handleDisconnectVoice} title="Trennen">
                <Icon icon="mage:multiply" />
              </button>
            </div>
          </div>
        )}

        <div 
          className="user-info" 
          style={{ cursor: "pointer" }}
          onClick={() => {
            if (onOpenSovereignModal) {
              onOpenSovereignModal();
            } else if (mockProfiles.CipherNaut) {
              setSelectedUserProfile(mockProfiles.CipherNaut);
            }
          }}
          title="Konto & souveräne Identität (12 Wörter / AIN) verwalten"
        >
          <div className="user-avatar-wrapper">
            <div className="user-avatar purple" style={{ backgroundColor: "#00FF87", color: "#08090C", fontWeight: "700" }}>
              {(userName || "C").charAt(0).toUpperCase()}
            </div>
            <span className="status-dot online" />
          </div>
          <div className="user-details" style={{ overflow: "hidden" }}>
            <span className="user-name" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {userName || "CipherNaut"}
              <Icon icon="mage:shield" style={{ fontSize: "11px", color: "#00FF87" }} />
            </span>
            <span className="user-id" style={{ fontFamily: "monospace", fontSize: "10px", color: "#94A3B8" }}>
              {userAin || "ZENO-ANONYMOUS"}
            </span>
          </div>
        </div>
        <div className="user-controls">
          <button 
            className="user-control-btn" 
            onClick={() => onOpenSovereignModal && onOpenSovereignModal()} 
            title="Souveränes Konto & 12-Wort-Phrase verwalten"
            style={{ color: "#00FF87" }}
          >
            <Icon icon="mage:shield" />
          </button>
          <button className="user-control-btn" onClick={handleThemeToggle} title="Design umschalten">
            <Icon icon={theme === "light" ? "mage:moon" : "mage:sun"} />
          </button>
          <button className={`user-control-btn ${muted ? "active" : ""}`} onClick={() => { setMuted(!muted); showToast(muted ? "Mikrofon aktiviert" : "Mikrofon stummgeschaltet"); }} title="Mikrofon">
            <Icon icon={muted ? "mage:microphone-mute" : "mage:microphone"} />
          </button>
          <button className={`user-control-btn ${deafened ? "active" : ""}`} onClick={() => { setDeafened(!deafened); showToast(deafened ? "Audio aktiviert" : "Audio stummgeschaltet"); }} title="Stummschalten">
            <Icon icon={deafened ? "mage:volume-mute" : "mage:volume-up"} />
          </button>
          <button className="user-control-btn" onClick={() => setIsSettingsOpen(true)} title="Einstellungen">
            <Icon icon="mage:settings" />
          </button>
        </div>
      </footer>
    </aside>
  );
};
