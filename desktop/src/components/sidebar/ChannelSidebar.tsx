import React from "react";
import { Icon } from "@iconify/react";
import { Server, Channel, Profile } from "../../types";

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
  onOpenSovereignModal
}) => {
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
          <header className="server-header">
            <h1 className="server-name">{activeServer?.name || "Server"}</h1>
            <button className="server-dropdown-toggle" onClick={() => showToast("Server-Menü geöffnet")}>
              <Icon icon="mage:chevron-down" />
            </button>
          </header>
          <div className="channel-list" key={activeServer?.id || "server"}>
            {(activeServer?.categories || []).map((cat) => {
              const isCollapsed = collapsedCategories[cat.name];
              return (
                <section key={cat.name} className="channel-category">
                  <button className="category-header" onClick={() => toggleCategory(cat.name)}>
                    <span className={`category-arrow ${isCollapsed ? "collapsed" : ""}`}>
                      <Icon icon="mage:chevron-down" />
                    </span>
                    <span className="category-name">{cat.name.toUpperCase()}</span>
                  </button>
                  
                  {!isCollapsed && (
                    <ul className="category-channels">
                      {cat.channels.map((ch, idx) => {
                        const isText = cat.type === "text";
                        const isChannelActive = activeChannel?.id === ch.id;
                        
                        return (
                          <li key={ch.id}>
                            <button
                              className={`channel-item channel-item-animate ${isChannelActive ? "active" : ""} ${!isText ? "voice-channel" : ""}`}
                              onClick={() => isText ? setActiveChannel(ch) : handleJoinVoice(ch.id, ch.name)}
                              style={{ "--idx": Math.min(idx, 6) } as React.CSSProperties}
                            >
                              <span className="channel-icon">
                                <Icon icon={isText ? "mage:hashtag" : "mage:volume-up"} />
                              </span>
                              <span className="channel-name">{ch.name}</span>
                            </button>

                            {!isText && (
                              <ul className="voice-connected-users" style={{ paddingLeft: "24px", marginTop: "4px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                {(ch.connectedUsers || ["CipherNaut (Du)", "Alex", "Elena"]).map((user, uIdx) => {
                                  const isSpeaking = uIdx === 0 && !muted && connectedVoice === ch.name;
                                  return (
                                    <li key={user} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: isSpeaking ? "#00FF87" : "#94A3B8", padding: "2px 6px", borderRadius: "6px", backgroundColor: isSpeaking ? "rgba(0, 255, 135, 0.08)" : "transparent" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div 
                                          className={`voice-user-avatar ${isSpeaking ? "user-speaking-ring" : ""}`}
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
                                            fontWeight: "700",
                                            border: isSpeaking ? "2px solid #00FF87" : "none",
                                            boxShadow: isSpeaking ? "0 0 10px rgba(0, 255, 135, 0.6)" : "none"
                                          }}
                                        >
                                          {user[0]}
                                        </div>
                                        <span>{user}</span>
                                      </div>
                                      <Icon 
                                        icon={isSpeaking ? "mage:volume-up" : (uIdx === 1 ? "mage:microphone-mute" : "mage:microphone")} 
                                        style={{ color: isSpeaking ? "#00FF87" : "#64748B", fontSize: "12px" }} 
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
          <div className="voice-indicator">
            <div className="voice-status">
              <span className="voice-status-icon">
                <Icon icon="mage:volume-up" className="voice-status-indicator pulse" style={{ color: "var(--accent-success, #59A869)", marginRight: "4px" }} />
              </span>
              <span className="voice-status-text">
                Verbunden mit <strong>{connectedVoice}</strong> ({formatVoiceTime(voiceDuration)})
              </span>
            </div>
            <button className="voice-disconnect" onClick={handleDisconnectVoice} title="Trennen">
              <Icon icon="mage:multiply" />
            </button>
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
