import React from "react";
import { Icon } from "@iconify/react";

interface SettingsModalProps {
  isOpen: boolean;
  activeSettingsTab: string;
  userProfilePreset: "default" | "cyberpunk" | "glassmorphism" | "synthwave" | "matrix" | "custom";
  userCustomCss: string;
  userBadge: string;
  userBadgePosition: "badge-center" | "badge-right" | "badge-left";
  userStatusQuote: string;
  userBannerGradient: string;
  glassmorphism: boolean;
  canvasColor: string;
  glowColor: string;
  theme: "dark" | "light";
  lightPresets: Array<{ color: string; title: string }>;
  darkPresets: Array<{ color: string; title: string }>;
  editorRuntimes: Record<string, "installed" | "not_installed" | "installing">;
  githubToken: string;
  githubUser: { login: string; name: string; avatarUrl: string } | null;
  githubConnecting: boolean;
  onClose: () => void;
  setActiveSettingsTab: (tab: string) => void;
  setUserProfilePreset: (preset: any) => void;
  setUserCustomCss: (css: string) => void;
  setUserBadge: (badge: string) => void;
  setUserBadgePosition: (pos: any) => void;
  setUserStatusQuote: (quote: string) => void;
  setUserBannerGradient: (gradient: string) => void;
  setGlassmorphism: (enabled: boolean) => void;
  setCanvasColor: (color: string) => void;
  setGlowColor: (color: string) => void;
  handleInstallRuntime: (id: string) => void;
  handleDeleteRuntime: (id: string) => void;
  setGithubToken: (token: string) => void;
  setGithubUser: (user: any) => void;
  testGithubConnection: () => void;
  showToast: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  activeSettingsTab,
  userProfilePreset,
  userCustomCss,
  userBadge,
  userBadgePosition,
  userStatusQuote,
  userBannerGradient,
  glassmorphism,
  canvasColor,
  glowColor,
  theme,
  lightPresets,
  darkPresets,
  editorRuntimes,
  githubToken,
  githubUser,
  githubConnecting,
  onClose,
  setActiveSettingsTab,
  setUserProfilePreset,
  setUserCustomCss,
  setUserBadge,
  setUserBadgePosition,
  setUserStatusQuote,
  setUserBannerGradient,
  setGlassmorphism,
  setCanvasColor,
  setGlowColor,
  handleInstallRuntime,
  handleDeleteRuntime,
  setGithubToken,
  setGithubUser,
  testGithubConnection,
  showToast
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay open" id="settings-modal">
      <div className="settings-panel">
        <aside className="settings-sidebar">
          <h2 className="settings-title">Einstellungen</h2>
          <button 
            className={`settings-nav-item ${activeSettingsTab === "profile" ? "active" : ""}`} 
            onClick={() => setActiveSettingsTab("profile")}
          >
            Kryptografisches Profil
          </button>
          <button 
            className={`settings-nav-item ${activeSettingsTab === "appearance" ? "active" : ""}`} 
            onClick={() => setActiveSettingsTab("appearance")}
          >
            Erscheinungsbild
          </button>
          <button 
            className={`settings-nav-item ${activeSettingsTab === "byos" ? "active" : ""}`} 
            onClick={() => setActiveSettingsTab("byos")}
          >
            BYOS-Speicher
          </button>
          <button 
            className={`settings-nav-item ${activeSettingsTab === "security" ? "active" : ""}`} 
            onClick={() => setActiveSettingsTab("security")}
          >
            Sicherheit & Keys
          </button>
          <button 
            className={`settings-nav-item ${activeSettingsTab === "editor" ? "active" : ""}`} 
            onClick={() => setActiveSettingsTab("editor")}
          >
            Monaco-Editor
          </button>
          <button 
            className={`settings-nav-item ${activeSettingsTab === "github" ? "active" : ""}`} 
            onClick={() => setActiveSettingsTab("github")}
          >
            GitHub-Integration
          </button>
        </aside>

        <main className="settings-content">
          <div className="settings-close-wrapper">
            <button className="settings-close-btn" onClick={onClose} title="Schließen">
              <Icon icon="mage:multiply" />
            </button>
            <span className="settings-close-label">ESC</span>
          </div>

          <div>
            {/* Tab: Profile */}
            {activeSettingsTab === "profile" && (
              <div className="settings-tab-content" id="tab-profile">
                <h3>Kryptografisches Profil</h3>
                <div className="settings-profile-card">
                  <div className="profile-avatar-large purple">C</div>
                  <div className="profile-info-large">
                    <span className="profile-name">CipherNaut</span>
                    <span className="profile-status-badge">Unterstützer ⭐</span>
                  </div>
                </div>
                <div className="settings-form-group">
                  <label>Kryptografische ID (Ed25519 Public Key)</label>
                  <div className="key-display-wrapper">
                    <code className="key-display">0xA3F9D1E8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890</code>
                    <button 
                      className="btn-copy-key" 
                      onClick={() => { navigator.clipboard.writeText("0xA3F9D1E8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890"); showToast("Public Key kopiert!"); }} 
                      title="Kopieren"
                    >
                      <Icon icon="mage:copy" />
                    </button>
                  </div>
                </div>
                <div className="settings-form-group">
                  <label>Geräte-Kopplung (Device Pairing)</label>
                  <p className="settings-help-text">Kopple ein weiteres Gerät durch Scannen des Pairing-Codes.</p>
                  <button className="settings-btn" onClick={() => showToast("Gerätekopplung gestartet")}>Pairing starten</button>
                </div>

                {/* Custom Profile CSS & Template Customizer Section */}
                <div className="settings-form-group" style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border-color)" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#FFF", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon icon="mage:palette" style={{ color: "var(--accent-color)" }} />
                    Profil-Design & Custom-CSS Templates
                  </h4>
                  <p className="settings-help-text" style={{ marginBottom: "16px" }}>
                    Passe deine Profil-Karte mit Theme-Presets oder eigenem Custom-CSS an. Andere Nutzer sehen dein Custom-Design, wenn sie auf dein Profil klicken!
                  </p>

                  {/* Theme Presets Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginBottom: "20px" }}>
                    {[
                      { id: "cyberpunk", label: "⚡ Cyberpunk", gradient: "linear-gradient(135deg, #7928CA 0%, #FF0080 100%)", badge: "⚡ VIP CYBERNAUT" },
                      { id: "glassmorphism", label: "❄️ Glassmorphism", gradient: "linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)", badge: "❄️ FROSTED GLASS" },
                      { id: "synthwave", label: "🌅 Synthwave 80s", gradient: "linear-gradient(135deg, #f857a6 0%, #ff5858 100%)", badge: "🌅 RETRO WAVE" },
                      { id: "matrix", label: "🟩 Matrix Hacker", gradient: "linear-gradient(135deg, #00FF87 0%, #60EFFF 100%)", badge: "🟩 MATRIX CORE" },
                      { id: "default", label: "🎨 Standard", gradient: "linear-gradient(135deg, #3574F0 0%, #1A44A5 100%)", badge: "⭐ VERIFIZIERT" }
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        className={`settings-btn ${userProfilePreset === preset.id ? "primary" : ""}`}
                        onClick={() => {
                          setUserProfilePreset(preset.id as any);
                          setUserBannerGradient(preset.gradient);
                          setUserBadge(preset.badge);
                          showToast(`Profil-Theme "${preset.label}" angewendet!`);
                        }}
                        style={{ padding: "8px 6px", fontSize: "11px", borderRadius: "8px", textAlign: "center" }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Inputs & Alignment Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        Status-Spruch
                      </label>
                      <input
                        type="text"
                        className="settings-input"
                        value={userStatusQuote}
                        onChange={(e) => setUserStatusQuote(e.target.value)}
                        placeholder="Zeno verschlüsselt meine Daten."
                        style={{ width: "100%", padding: "8px 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#FFF", fontSize: "12px" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        Profil Badge / Badge-Text
                      </label>
                      <input
                        type="text"
                        className="settings-input"
                        value={userBadge}
                        onChange={(e) => setUserBadge(e.target.value)}
                        placeholder="⚡ VIP CYBERNAUT"
                        style={{ width: "100%", padding: "8px 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#FFF", fontSize: "12px" }}
                      />
                    </div>
                  </div>

                  {/* Badge Position Grid */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                      Badge-Ausrichtung (Standard: Zentriert)
                    </label>
                    <div style={{ display: "flex", gap: "10px" }}>
                      {[
                        { id: "badge-center", label: "🎯 Zentriert (Standard)" },
                        { id: "badge-right", label: "↗️ Rechts unten" },
                        { id: "badge-left", label: "↖️ Links unten" }
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          className={`settings-btn ${userBadgePosition === pos.id ? "primary" : ""}`}
                          onClick={() => setUserBadgePosition(pos.id as any)}
                          style={{ flex: 1, padding: "8px", fontSize: "11px", borderRadius: "6px", textAlign: "center" }}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Banner Gradient Input */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                      Banner CSS Gradient / Hintergrund
                    </label>
                    <input
                      type="text"
                      className="settings-input"
                      value={userBannerGradient}
                      onChange={(e) => setUserBannerGradient(e.target.value)}
                      placeholder="linear-gradient(135deg, #7928CA 0%, #FF0080 100%)"
                      style={{ width: "100%", padding: "8px 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "#FFF", fontSize: "12px", fontFamily: "monospace" }}
                    />
                  </div>

                  {/* Custom CSS Editor Box */}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)" }}>
                        Custom CSS Code-Editor (Live-Styling)
                      </label>
                      <span style={{ fontSize: "10px", color: "#00E676" }}>● Scoped to #profile-card-modal</span>
                    </div>
                    <textarea
                      value={userCustomCss}
                      onChange={(e) => setUserCustomCss(e.target.value)}
                      rows={6}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: "#111214",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        color: "#00FF87",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        lineHeight: "1.5",
                        resize: "vertical"
                      }}
                    />
                  </div>

                  {/* Live Profile Card Preview & Save Action */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px" }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: "0 0 6px 0", color: "#FFF", fontSize: "13px" }}>Echtzeit Profil-Vorschau</h5>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 14px 0" }}>
                        So erscheint deine Profilkarte für andere Mitglieder im Chat und in der Mitgliederliste.
                      </p>
                      <button
                        className="settings-btn primary"
                        onClick={() => showToast("🎨 Profil-Design & Custom-CSS erfolgreich gespeichert!")}
                      >
                        💾 Profil-Design speichern
                      </button>
                    </div>

                    {/* Live Mini Preview Card */}
                    <div style={{ width: "260px", position: "relative" }}>
                      <div className={`profile-modal-card ${userProfilePreset}`} style={{ width: "100%", minHeight: "220px" }}>
                        {userCustomCss && <style>{userCustomCss}</style>}
                        <div className="profile-card-banner" style={{ background: userBannerGradient }} />
                        <div className="profile-card-body" style={{ padding: "14px" }}>
                          <div className="profile-avatar-wrapper">
                            <div className="profile-card-avatar purple" style={{ width: "54px", height: "54px", fontSize: "22px" }}>C</div>
                            {userBadge && <span className={`profile-badge ${userBadgePosition}`}>{userBadge}</span>}
                          </div>
                          <h3 className="profile-card-name" style={{ fontSize: "14px" }}>CipherNaut</h3>
                          <span className="profile-card-role" style={{ fontSize: "8px" }}>UNTERSTÜTZER</span>
                          <div className="profile-card-status" style={{ fontSize: "10px" }}>"{userStatusQuote}"</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Appearance */}
            {activeSettingsTab === "appearance" && (
              <div className="settings-tab-content" id="tab-appearance">
                <h3>Erscheinungsbild & Canvas</h3>
                <div className="settings-form-group">
                  <label>Milchglas-Effekt (Glassmorphism)</label>
                  <div className="switch-control">
                    <span>Transparenz- und Blur-Effekte aktivieren</span>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={glassmorphism} 
                        onChange={(e) => setGlassmorphism(e.target.checked)} 
                      />
                      <span className="slider" />
                    </label>
                  </div>
                </div>
                <div className="settings-form-group">
                  <label>Hintergrund-Presets</label>
                  <div className="color-presets" id="settings-color-presets">
                    {(theme === "light" ? lightPresets : darkPresets).map((preset) => (
                      <button
                        key={preset.color}
                        className={`preset-btn ${canvasColor === preset.color ? "active" : ""}`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.title}
                        onClick={() => setCanvasColor(preset.color)}
                      />
                    ))}
                  </div>
                </div>
                <div className="settings-form-group">
                  <div className="custom-color-control">
                    <label htmlFor="settings-canvas-color">Eigene Hintergrundfarbe:</label>
                    <input 
                      type="color" 
                      id="settings-canvas-color" 
                      value={canvasColor} 
                      onChange={(e) => setCanvasColor(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="settings-form-group">
                  <div className="custom-color-control">
                    <label htmlFor="settings-glow-color">Radial-Glow Farbe:</label>
                    <input 
                      type="color" 
                      id="settings-glow-color" 
                      value={glowColor} 
                      onChange={(e) => setGlowColor(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: BYOS */}
            {activeSettingsTab === "byos" && (
              <div className="settings-tab-content" id="tab-byos">
                <h3>Bring Your Own Storage (BYOS)</h3>
                <p className="settings-help-text">Verbinde deinen eigenen Cloud-Speicher für Datei-Uploads über 10 MB.</p>
                <div className="settings-form-group">
                  <label htmlFor="byos-provider">Speicher-Provider</label>
                  <select id="byos-provider" className="settings-select">
                    <option value="nextcloud">Nextcloud (WebDAV)</option>
                    <option value="s3">AWS S3 / MinIO</option>
                    <option value="dropbox">Dropbox API</option>
                  </select>
                </div>
                <div className="settings-form-group">
                  <label htmlFor="byos-url">Server-URL</label>
                  <input type="text" id="byos-url" className="settings-input" defaultValue="https://cloud.zeno-chat.de/remote.php/dav/files/" />
                </div>
                <div className="settings-form-group">
                  <label htmlFor="byos-user">Benutzername / Key ID</label>
                  <input type="text" id="byos-user" className="settings-input" defaultValue="cipher_naut" />
                </div>
                <button className="settings-btn primary" onClick={() => { onClose(); showToast("BYOS-Einstellungen gespeichert!"); }}>
                  Verbindung testen & Speichern
                </button>
              </div>
            )}

            {/* Tab: Security */}
            {activeSettingsTab === "security" && (
              <div className="settings-tab-content" id="tab-security">
                <h3>Sicherheit & Recovery</h3>
                <div className="settings-form-group">
                  <label>Backup-Key (Seed Phrase)</label>
                  <p className="settings-help-text">Sichere deine 12-Wort-Seed-Phrase, um deine Identität auf neuen Geräten wiederherzustellen.</p>
                  <button className="settings-btn" onClick={() => showToast("Seed Phrase: apple banana cherry ...")}>Backup-Key anzeigen</button>
                </div>
                <div className="settings-form-group">
                  <label>Social Recovery (Treuhänder)</label>
                  <p className="settings-help-text">Teile deinen Key via Shamir's Secret Sharing auf 5 vertrauenswürdige Kontakte auf.</p>
                  <button className="settings-btn" onClick={() => showToast("Social Recovery Setup gestartet")}>Social Recovery einrichten</button>
                </div>
              </div>
            )}

            {/* Tab: Monaco-Editor */}
            {activeSettingsTab === "editor" && (
              <div className="settings-tab-content" id="tab-editor">
                <h3>Monaco-Editor Laufzeitumgebungen</h3>
                <p className="settings-help-text">
                  Verwalte hier die clientseitigen Sandboxen und Compiler-Bibliotheken für verschiedene Programmiersprachen.
                </p>

                <div className="runtime-settings-list" style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[
                    { id: "javascript", name: "JavaScript / TypeScript Sandbox", desc: "Native isolierte Sandbox-Laufzeit im Web Worker. Keine Downloads erforderlich.", size: "0 MB (integriert)", icon: "vscode-icons:file-type-js" },
                    { id: "python", name: "Python WebAssembly Playground (Pyodide)", desc: "Lokale Python-Ausführung über den Pyodide WASM-Interpreter.", size: "12.8 MB", icon: "vscode-icons:file-type-python" },
                    { id: "rust", name: "Rust Compiler Simulator & Aegis Crypto", desc: "Rust-Laufzeitsimulation und lokale Aegis Kryptografie-Pakete.", size: "4.5 MB", icon: "vscode-icons:file-type-rust" },
                    { id: "csharp", name: ".NET Sandbox Simulator (C#)", desc: ".NET CLR Simulator zur clientseitigen Ausführung von C#-Codeblöcken.", size: "8.2 MB", icon: "vscode-icons:file-type-csharp" },
                    { id: "cpp", name: "C / C++ Compiler Simulator (WASM-based)", desc: "WebAssembly-basierter gcc/g++-Simulator zur lokalen Code-Validierung.", size: "6.1 MB", icon: "vscode-icons:file-type-cpp" }
                  ].map((rt) => {
                    const status = editorRuntimes[rt.id];
                    return (
                      <div key={rt.id} className="runtime-card" style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px",
                        backgroundColor: "var(--bg-tertiary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "var(--radius-md)",
                        gap: "16px"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <Icon icon={rt.icon} style={{ fontSize: "28px", flexShrink: 0 }} />
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>{rt.name}</span>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{rt.desc}</span>
                            <span style={{ fontSize: "9px", color: "var(--glow-color-1, #3574F0)", fontWeight: "600", marginTop: "4px" }}>Größe: {rt.size}</span>
                          </div>
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                          {status === "installed" ? (
                            <>
                              <span className="badge" style={{ backgroundColor: "rgba(89, 168, 105, 0.15)", color: "#59A869", border: "1px solid rgba(89, 168, 105, 0.3)" }}>Bereit</span>
                              {rt.id !== "javascript" && (
                                <button className="settings-btn" onClick={() => handleDeleteRuntime(rt.id)} style={{ padding: "6px 12px", color: "var(--accent-danger)" }}>Deinstallieren</button>
                              )}
                            </>
                          ) : status === "installing" ? (
                            <>
                              <span className="badge" style={{ backgroundColor: "rgba(255, 198, 109, 0.15)", color: "#FFC66D", border: "1px solid rgba(255, 198, 109, 0.3)" }}>Installiert...</span>
                              <div className="spinner" style={{ width: "16px", height: "16px", border: "2px solid var(--border-color)", borderTopColor: "var(--accent-color)", borderRadius: "50%", animation: "zeno-pulse 1s linear infinite" }} />
                            </>
                          ) : (
                            <>
                              <span className="badge" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>Nicht installiert</span>
                              <button className="settings-btn primary" onClick={() => handleInstallRuntime(rt.id)} style={{ padding: "6px 12px" }}>Download & Installieren</button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab: GitHub-Integration */}
            {activeSettingsTab === "github" && (
              <div className="settings-tab-content" id="tab-github">
                <h3>GitHub-Integration (100% lokal & privat)</h3>
                <p className="settings-help-text">
                  Verbinde dein GitHub-Konto direkt über deinen Webbrowser mit der GitHub-API. 
                  <strong> Wichtig:</strong> Dein Token verbleibt ausschließlich lokal auf diesem Gerät im Speicher der App. 
                  Es wird niemals an einen Zeno-Server gesendet.
                </p>

                <div className="settings-form-group" style={{ marginTop: "20px" }}>
                  <label>Personal Access Token (PAT)</label>
                  <p className="settings-help-text">
                    Erstelle ein Token mit <code>repo</code>-Rechten auf GitHub, um deinen Repository-Status abzufragen und Commits einzusehen.
                  </p>
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <input 
                      type="password" 
                      className="settings-input" 
                      placeholder="ghp_..." 
                      value={githubToken} 
                      onChange={(e) => {
                        setGithubToken(e.target.value);
                        setGithubUser(null);
                      }}
                      style={{ flex: 1, maxWidth: "none" }}
                    />
                    <button 
                      className="settings-btn primary" 
                      onClick={testGithubConnection} 
                      disabled={githubConnecting || !githubToken.trim()}
                      style={{ flexShrink: 0 }}
                    >
                      {githubConnecting ? "Verbinde..." : "Verbindung testen"}
                    </button>
                  </div>
                </div>

                {githubUser && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginTop: "16px",
                    padding: "12px",
                    backgroundColor: "rgba(89, 168, 105, 0.1)",
                    border: "1px solid rgba(89, 168, 105, 0.3)",
                    borderRadius: "var(--radius-md)"
                  }}>
                    <img 
                      src={githubUser.avatarUrl} 
                      alt="GitHub Avatar" 
                      style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid #59A869" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#59A869" }}>✓ Erfolgreich verbunden</span>
                      <span style={{ fontSize: "11px", color: "var(--text-primary)", fontWeight: "600" }}>
                        {githubUser.name || githubUser.login} (@{githubUser.login})
                      </span>
                    </div>
                  </div>
                )}

                <div style={{
                  marginTop: "24px",
                  padding: "16px",
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-lg)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>Sicherheitsprotokoll & Transparenz</span>
                  <ul style={{ fontSize: "11px", color: "var(--text-muted)", paddingLeft: "16px", lineHeight: "1.6" }}>
                    <li>Direct-Client-Request: Keine API-Proxy-Server oder Cloud-Gateways. Die Anfrage erfolgt direkt von deiner lokalen IP zu GitHub.</li>
                    <li>Speicherort: Der Token wird ausschließlich in deiner lokalen Desktop-App-Sandbox gespeichert.</li>
                    <li>Minimalberechtigung: Verwende am besten ein feinkörniges (Fine-grained) Token mit Nur-Lese-Rechten auf ausgewählte Repositories.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
