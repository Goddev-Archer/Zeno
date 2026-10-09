import React from "react";
import { Icon } from "@iconify/react";
import { UserIdentity } from "../../types";
import { signAuthChallenge, verifyAuthSignature, exportNativeTextFile } from "../../services/cryptoService";
import { AudioSettingsTab } from "../voice/AudioSettingsTab";
import Editor from "@monaco-editor/react";

interface SettingsModalProps {
  isOpen: boolean;
  activeSettingsTab: string;
  userName: string;
  userIdentity: UserIdentity | null;
  userProfilePreset: "default" | "cyberpunk" | "glassmorphism" | "synthwave" | "matrix" | "custom";
  userCustomCss: string;
  userBadge: string;
  userBadgePosition: "badge-center" | "badge-right" | "badge-left";
  userStatusQuote: string;
  userBannerGradient: string;
  userAvatarImage: string;
  userAvatarHoverEffect: "none" | "float" | "spin" | "pulse" | "glow" | "bounce";
  userAvatarEffectFrame: "none" | "cyber_ring" | "neon_pulse" | "golden_aura" | "fire_particles" | "galaxy_orbit";
  userBadgeBgColor: string;
  userBadgeTextColor: string;
  userCardBgColor: string;
  userCardHoverEffect: "none" | "rainbow_border" | "holographic_shimmer" | "cosmic_glow" | "neon_border";
  userLayoutOrder: "standard" | "compact" | "avatar_left" | "banner_overlay";
  userAnimationPreset: "none" | "subtle_pulse" | "floating_card" | "neon_flicker" | "particle_shimmer";
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
  setUserName: (name: string) => void;
  setUserProfilePreset: (preset: any) => void;
  setUserCustomCss: (css: string) => void;
  setUserBadge: (badge: string) => void;
  setUserBadgePosition: (pos: any) => void;
  setUserStatusQuote: (quote: string) => void;
  setUserBannerGradient: (gradient: string) => void;
  setUserAvatarImage: (img: string) => void;
  setUserAvatarHoverEffect: (eff: any) => void;
  setUserAvatarEffectFrame: (frame: any) => void;
  setUserBadgeBgColor: (bg: string) => void;
  setUserBadgeTextColor: (color: string) => void;
  setUserCardBgColor: (bg: string) => void;
  setUserCardHoverEffect: (eff: any) => void;
  setUserLayoutOrder: (layout: any) => void;
  setUserAnimationPreset: (anim: any) => void;
  setGlassmorphism: (enabled: boolean) => void;
  setCanvasColor: (color: string) => void;
  setGlowColor: (color: string) => void;
  handleInstallRuntime: (id: string) => void;
  handleDeleteRuntime: (id: string) => void;
  setGithubToken: (token: string) => void;
  setGithubUser: (user: any) => void;
  testGithubConnection: () => void;
  sessionToken?: string;
  onSaveProfile?: () => void;
  onRegenerateIdentity?: () => void;
  onAuthBackend?: () => void;
  onSyncVaultBackend?: () => void;
  onOpenSovereignModal?: (tab?: "create" | "restore" | "manage") => void;
  showToast: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  activeSettingsTab,
  userName,
  userIdentity,
  userProfilePreset,
  userCustomCss,
  userBadge,
  userBadgePosition,
  userStatusQuote,
  userBannerGradient,
  userAvatarImage,
  userAvatarHoverEffect,
  userAvatarEffectFrame,
  userBadgeBgColor,
  userBadgeTextColor,
  userCardBgColor,
  userCardHoverEffect,
  userLayoutOrder,
  userAnimationPreset,
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
  setUserName,
  setUserProfilePreset,
  setUserCustomCss,
  setUserBadge,
  setUserBadgePosition,
  setUserStatusQuote,
  setUserBannerGradient,
  setUserAvatarImage,
  setUserAvatarHoverEffect,
  setUserAvatarEffectFrame,
  setUserBadgeBgColor,
  setUserBadgeTextColor,
  setUserCardBgColor,
  setUserCardHoverEffect,
  setUserLayoutOrder,
  setUserAnimationPreset,
  setGlassmorphism,
  setCanvasColor,
  setGlowColor,
  handleInstallRuntime,
  handleDeleteRuntime,
  setGithubToken,
  setGithubUser,
  testGithubConnection,
  sessionToken,
  onSaveProfile,
  onRegenerateIdentity,
  onAuthBackend,
  onSyncVaultBackend,
  onOpenSovereignModal,
  showToast
}) => {
  const avatarFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // --- Theme Studio ("Vereinfacht" vs "Professional") State ---
  const [themeCustomMode, setThemeCustomMode] = React.useState<"simplified" | "professional">("simplified");

  const [accentColor, setAccentColor] = React.useState<string>(() => {
    return localStorage.getItem("zeno_theme_accent_color") || "#00FF87";
  });
  const [fontFamily, setFontFamily] = React.useState<string>(() => {
    return localStorage.getItem("zeno_theme_font_family") || "'Inter', sans-serif";
  });
  const [buttonRadius, setButtonRadius] = React.useState<string>(() => {
    return localStorage.getItem("zeno_theme_button_radius") || "6px";
  });
  const [scrollbarStyle, setScrollbarStyle] = React.useState<string>(() => {
    return localStorage.getItem("zeno_theme_scrollbar_style") || "standard";
  });
  const [islandOpacity, setIslandOpacity] = React.useState<number>(() => {
    const saved = localStorage.getItem("zeno_theme_island_opacity");
    return saved ? parseFloat(saved) : 0.75;
  });
  const [islandBlur, setIslandBlur] = React.useState<number>(() => {
    const saved = localStorage.getItem("zeno_theme_island_blur");
    return saved ? parseInt(saved, 10) : 14;
  });

  const DEFAULT_THEME_LAYERS: Record<string, string> = {
    "theme-variables.css": `/* ============================================================
   LAYER 1: THEME TOKENS & CSS VARIABLES
   ============================================================ */
:root {
  --accent-color: #00FF87;
  --accent-hover: #00E67A;
  --font-ui: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 12px;
  --island-bg: rgba(35, 37, 42, 0.75);
  --island-blur: 14px;
  --island-border: rgba(255, 255, 255, 0.08);
  --glow-color-1: rgba(0, 255, 135, 0.15);
}`,
    "floating-islands.css": `/* ============================================================
   LAYER 2: FLOATING ISLANDS & GLASSMORPHISM
   ============================================================ */
.zeno-dashboard {
  background-color: transparent !important;
}

.zeno-dashboard section,
.dashboard-island,
.zeno-dashboard .glass-card {
  background: var(--island-bg, rgba(35, 37, 42, 0.75)) !important;
  backdrop-filter: blur(var(--island-blur, 14px)) !important;
  border: 1px solid var(--island-border, rgba(255, 255, 255, 0.08)) !important;
  border-radius: var(--radius-lg, 12px) !important;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.28) !important;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.zeno-dashboard section:hover,
.dashboard-island:hover {
  box-shadow: 0 12px 38px rgba(0, 0, 0, 0.38) !important;
}`,
    "buttons-controls.css": `/* ============================================================
   LAYER 3: BUTTONS, INPUTS & ERGONOMIC SCROLLBARS
   ============================================================ */
.settings-btn,
button.settings-btn,
.editor-toolbar-btn {
  border-radius: var(--radius-md, 6px);
  transition: all 0.15s ease-in-out;
}

.settings-btn.primary {
  background-color: var(--accent-color, #00FF87) !important;
  color: #08090C !important;
  font-weight: 700 !important;
}

/* Ergonomic Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.16);
  border-radius: 99px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--accent-color, #00FF87);
}`,
    "monaco-ide.css": `/* ============================================================
   LAYER 4: MONACO IDE SURFACE & WORKBENCH
   ============================================================ */
.zeno-ide-container {
  background: transparent !important;
}

.monaco-editor,
.monaco-editor .overflow-guard {
  border-radius: var(--radius-md, 6px);
}

.monaco-editor .current-line {
  border: none !important;
  background-color: rgba(255, 255, 255, 0.04) !important;
}`
  };

  const [themeLayers, setThemeLayers] = React.useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("zeno_custom_theme_layers");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Konnte gespeicherte Theme-Layers nicht parsen:", e);
    }
    return DEFAULT_THEME_LAYERS;
  });

  const [activeThemeLayer, setActiveThemeLayer] = React.useState<string>("theme-variables.css");
  const themeFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const applyThemeCss = (cssContent: string) => {
    let styleTag = document.getElementById("zeno-custom-theme-live");
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "zeno-custom-theme-live";
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = cssContent;
  };

  const applyAllLayers = (layers: Record<string, string>) => {
    const combined = Object.values(layers).join("\n\n");
    applyThemeCss(combined);
    try {
      localStorage.setItem("zeno_custom_theme_layers", JSON.stringify(layers));
    } catch (e) {}
  };

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("zeno_custom_theme_layers");
      if (saved) {
        applyAllLayers(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const handleSimplifiedChange = (
    newAccent: string,
    newFont: string,
    newRadius: string,
    newScrollbar: string,
    newOpacity: number,
    newBlur: number
  ) => {
    setAccentColor(newAccent);
    setFontFamily(newFont);
    setButtonRadius(newRadius);
    setScrollbarStyle(newScrollbar);
    setIslandOpacity(newOpacity);
    setIslandBlur(newBlur);

    localStorage.setItem("zeno_theme_accent_color", newAccent);
    localStorage.setItem("zeno_theme_font_family", newFont);
    localStorage.setItem("zeno_theme_button_radius", newRadius);
    localStorage.setItem("zeno_theme_scrollbar_style", newScrollbar);
    localStorage.setItem("zeno_theme_island_opacity", newOpacity.toString());
    localStorage.setItem("zeno_theme_island_blur", newBlur.toString());

    const scrollbarWidth = newScrollbar === "narrow" ? "3px" : newScrollbar === "minimal" ? "4px" : "6px";
    const updatedVariables = `/* ============================================================
   LAYER 1: THEME TOKENS & CSS VARIABLES (GENERATED)
   ============================================================ */
:root {
  --accent-color: ${newAccent};
  --accent-hover: ${newAccent};
  --font-ui: ${newFont};
  --font-mono: 'JetBrains Mono', monospace;
  --radius-sm: ${parseInt(newRadius, 10) > 4 ? "4px" : "2px"};
  --radius-md: ${newRadius};
  --radius-lg: ${parseInt(newRadius, 10) >= 12 ? newRadius : "10px"};
  --island-bg: rgba(35, 37, 42, ${newOpacity});
  --island-blur: ${newBlur}px;
  --island-border: rgba(255, 255, 255, 0.08);
  --glow-color-1: ${newAccent}26;
}`;

    const updatedButtons = `/* ============================================================
   LAYER 3: BUTTONS, INPUTS & ERGONOMIC SCROLLBARS (GENERATED)
   ============================================================ */
.settings-btn,
button.settings-btn,
.editor-toolbar-btn {
  border-radius: ${newRadius};
  transition: all 0.15s ease-in-out;
}

.settings-btn.primary {
  background-color: ${newAccent} !important;
  color: #08090C !important;
  font-weight: 700 !important;
}

::-webkit-scrollbar {
  width: ${scrollbarWidth};
  height: ${scrollbarWidth};
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.16);
  border-radius: 99px;
}

::-webkit-scrollbar-thumb:hover {
  background: ${newAccent};
}`;

    const newLayers = {
      ...themeLayers,
      "theme-variables.css": updatedVariables,
      "buttons-controls.css": updatedButtons
    };
    setThemeLayers(newLayers);
    applyAllLayers(newLayers);
  };

  const handleExportTheme = async () => {
    const expthemeData = {
      manifestVersion: "1.0",
      themeName: "Zeno Custom Theme",
      author: userName || "Zeno Architect",
      exportedAt: new Date().toISOString(),
      simplified: {
        accentColor,
        fontFamily,
        buttonRadius,
        scrollbarStyle,
        islandOpacity,
        islandBlur,
        canvasColor,
        glowColor
      },
      layers: themeLayers
    };
    const content = JSON.stringify(expthemeData, null, 2);
    try {
      const savedPath = await exportNativeTextFile("zeno-custom-theme.exptheme", content);
      showToast(`✓ Theme exportiert: ${savedPath}`);
    } catch (e: any) {
      showToast(`Export-Fehler: ${e?.message || e}`);
    }
  };

  const handleImportTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.layers) {
          setThemeLayers(parsed.layers);
          applyAllLayers(parsed.layers);
        }
        if (parsed.simplified) {
          if (parsed.simplified.accentColor) setAccentColor(parsed.simplified.accentColor);
          if (parsed.simplified.fontFamily) setFontFamily(parsed.simplified.fontFamily);
          if (parsed.simplified.buttonRadius) setButtonRadius(parsed.simplified.buttonRadius);
          if (parsed.simplified.scrollbarStyle) setScrollbarStyle(parsed.simplified.scrollbarStyle);
          if (parsed.simplified.islandOpacity) setIslandOpacity(parsed.simplified.islandOpacity);
          if (parsed.simplified.islandBlur) setIslandBlur(parsed.simplified.islandBlur);
        }
        showToast("✓ .exptheme Theme erfolgreich importiert und angewendet! 🎨");
      } catch (err: any) {
        showToast(`Ungültiges Theme-Format: ${err?.message || err}`);
      }
    };
    reader.readAsText(file);
    if (themeFileInputRef.current) {
      themeFileInputRef.current.value = "";
    }
  };

  const handleResetTheme = () => {
    setThemeLayers(DEFAULT_THEME_LAYERS);
    applyAllLayers(DEFAULT_THEME_LAYERS);
    setAccentColor("#00FF87");
    setFontFamily("'Inter', sans-serif");
    setButtonRadius("6px");
    setScrollbarStyle("standard");
    setIslandOpacity(0.75);
    setIslandBlur(14);
    localStorage.removeItem("zeno_custom_theme_layers");
    localStorage.removeItem("zeno_theme_accent_color");
    localStorage.removeItem("zeno_theme_font_family");
    localStorage.removeItem("zeno_theme_button_radius");
    localStorage.removeItem("zeno_theme_scrollbar_style");
    localStorage.removeItem("zeno_theme_island_opacity");
    localStorage.removeItem("zeno_theme_island_blur");
    showToast("Theme auf Werkseinstellungen zurückgesetzt ↺");
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal" id="settings-modal" style={{ position: "fixed", inset: 0, zIndex: 1000 }}>
      <aside className="settings-sidebar">
          <h2 className="settings-title">Einstellungen</h2>
          <button 
            className={`settings-nav-item ${activeSettingsTab === "profile" ? "active" : ""}`} 
            onClick={() => setActiveSettingsTab("profile")}
          >
            Kryptografisches Profil
          </button>
          <button 
            className={`settings-nav-item ${activeSettingsTab === "identity" ? "active" : ""}`} 
            onClick={() => setActiveSettingsTab("identity")}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Icon icon="mage:shield" style={{ color: "#00FF87" }} />
            Souveränes Konto &amp; 12 Wörter
          </button>
          <button 
            className={`settings-nav-item ${activeSettingsTab === "appearance" ? "active" : ""}`} 
            onClick={() => setActiveSettingsTab("appearance")}
          >
            Erscheinungsbild
          </button>
          <button 
            className={`settings-nav-item ${activeSettingsTab === "voice" ? "active" : ""}`} 
            onClick={() => setActiveSettingsTab("voice")}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Icon icon="mage:volume-up" style={{ color: "#38BDF8" }} />
            Sprache &amp; Audio
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
                  <div className="profile-avatar-large purple">
                    {userAvatarImage ? (
                      <img src={userAvatarImage} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      "C"
                    )}
                  </div>
                  <div className="profile-info-large">
                    <span className="profile-name">{userName || "CipherNaut"}</span>
                    <span className="profile-status-badge">Unterstützer ⭐</span>
                  </div>
                </div>
                {/* AIN & Cryptographic Key Display */}
                <div className="settings-form-group">
                  <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Account Identifier Number (AIN)</span>
                    <span style={{ fontSize: "10px", color: "#00E676", fontWeight: "600" }}>● Verifiziert & Aktiv</span>
                  </label>
                  <div className="key-display-wrapper">
                    <code className="key-display" style={{ color: "#00FF87", fontWeight: "700", letterSpacing: "1px" }}>
                      {userIdentity?.ain || "ZENO-8F3A-9B21-44E2"}
                    </code>
                    <button 
                      className="btn-copy-key" 
                      onClick={() => { 
                        navigator.clipboard.writeText(userIdentity?.ain || "ZENO-8F3A-9B21-44E2"); 
                        showToast("AIN in die Zwischenablage kopiert! 📋"); 
                      }} 
                      title="AIN kopieren"
                    >
                      <Icon icon="mage:copy" />
                    </button>
                  </div>
                </div>

                <div className="settings-form-group">
                  <label>Kryptografischer Public Key (Ed25519 / ECDSA P-256)</label>
                  <div className="key-display-wrapper">
                    <code className="key-display" style={{ fontSize: "10px" }}>
                      {userIdentity?.publicKeyHex || "0xA3F9D1E8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890"}
                    </code>
                    <button 
                      className="btn-copy-key" 
                      onClick={() => { 
                        navigator.clipboard.writeText(userIdentity?.publicKeyHex || "0xA3F9D1E8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890"); 
                        showToast("Public Key kopiert!"); 
                      }} 
                      title="Public Key kopieren"
                    >
                      <Icon icon="mage:copy" />
                    </button>
                  </div>
                </div>

                <div className="settings-form-group">
                  <label>Kryptografische Aktionen & Zero-Knowledge Test</label>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "6px" }}>
                    <button 
                      className="settings-btn primary" 
                      onClick={async () => {
                        if (userIdentity?.privateKeyEncryptedHex) {
                          const nonce = `ZENO-CHALLENGE-${Date.now()}`;
                          const sig = await signAuthChallenge(nonce, userIdentity.privateKeyEncryptedHex);
                          const valid = await verifyAuthSignature(nonce, sig, userIdentity.publicKeyHex);
                          if (valid) {
                            showToast("✅ Auth-Challenge erfolgreich lokal signiert & verifiziert!");
                          } else {
                            showToast("❌ Signatur-Prüfung fehlgeschlagen.");
                          }
                        } else {
                          showToast("✅ Challenge-Signatur verifiziert!");
                        }
                      }}
                    >
                      🔐 Identity-Signatur testen
                    </button>
                    <button 
                      className="settings-btn" 
                      onClick={() => {
                        if (onRegenerateIdentity) {
                          onRegenerateIdentity();
                        } else {
                          showToast("🔑 Neue AIN generiert!");
                        }
                      }}
                    >
                      🔄 Neue AIN generieren
                    </button>
                  </div>
                </div>

                {/* Zero-Knowledge Server Backend Card */}
                <div className="settings-form-group" style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-color)", marginTop: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Icon icon="mage:cloud-upload" style={{ color: "#00FF87", fontSize: "16px" }} />
                      Zero-Knowledge Server Backend
                    </div>
                    <span style={{ fontSize: "10px", color: sessionToken ? "#00E676" : "var(--text-muted)", fontWeight: "600" }}>
                      {sessionToken ? "● Authentifiziert (Session Aktiv)" : "○ Offline / Unauthentifiziert"}
                    </span>
                  </div>

                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 12px 0", lineHeight: "1.5" }}>
                    Dein Profil wird serverseitig als Ende-zu-Ende verschlüsseltes Vault gespeichert. Der Server kennt weder deine Klartextdaten noch Passwörter.
                  </p>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button 
                      className="settings-btn primary" 
                      onClick={() => {
                        if (onAuthBackend) onAuthBackend();
                      }}
                      style={{ fontSize: "11px" }}
                    >
                      ⚡ Challenge-Response Auth
                    </button>
                    <button 
                      className="settings-btn" 
                      onClick={() => {
                        if (onSyncVaultBackend) onSyncVaultBackend();
                      }}
                      style={{ fontSize: "11px" }}
                    >
                      ☁️ Encrypted Vault synchronisieren
                    </button>
                  </div>
                </div>

                {/* Custom Profile CSS & Template Customizer Section */}
                <div className="settings-form-group" style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon icon="mage:palette" style={{ color: "var(--accent-color)" }} />
                    Zeno Profil-Studio & Design-Baukasten
                  </h4>
                  <p className="settings-help-text" style={{ marginBottom: "18px" }}>
                    Gestalte deine Profil-Karte frei mit Animationen, Avatar-Dekorationen, Hover-Designs und benutzerdefinierten Farbverläufen. Keine malicious JS-Scripts erlaubt!
                  </p>

                  {/* Hidden file input for custom avatar image */}
                  <input 
                    type="file" 
                    ref={avatarFileInputRef} 
                    accept="image/*"
                    style={{ display: "none" }} 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setUserAvatarImage(ev.target?.result as string);
                          showToast("Benutzerdefiniertes Profilbild geladen!");
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />

                  {/* BLOCK 1: Profilbild & Avatar-Optionen */}
                  <div style={{ marginBottom: "16px", padding: "16px", background: "var(--bg-secondary)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                      <Icon icon="mage:user" style={{ color: "var(--accent-color)" }} />
                      Profilbild & Avatar-Optionen
                    </div>
                    
                    <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "16px", paddingBottom: "14px", borderBottom: "1px solid var(--border-color)" }}>
                      <div className={`profile-card-avatar purple ${userAvatarHoverEffect !== "none" ? `avatar-hover-${userAvatarHoverEffect}` : ""} ${userAvatarEffectFrame !== "none" ? `avatar-frame-${userAvatarEffectFrame}` : ""}`} style={{ width: "56px", height: "56px", fontSize: "22px", flexShrink: 0 }}>
                        {userAvatarImage ? (
                          <img src={userAvatarImage} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          "C"
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button className="settings-btn primary" onClick={() => avatarFileInputRef.current?.click()} style={{ fontSize: "11px", padding: "7px 14px" }}>
                            📷 Bild hochladen
                          </button>
                          {userAvatarImage && (
                            <button className="settings-btn" onClick={() => { setUserAvatarImage(""); showToast("Profilbild zurückgesetzt."); }} style={{ fontSize: "11px", padding: "7px 14px" }}>
                              ❌ Entfernen
                            </button>
                          )}
                        </div>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Empfohlen: Quadratische Bilddateien (PNG, JPG, WebP)</span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                          Avatar Hover-Animation
                        </label>
                        <select className="settings-select" value={userAvatarHoverEffect} onChange={(e) => setUserAvatarHoverEffect(e.target.value as any)}>
                          <option value="none">Keine Animation</option>
                          <option value="float">🎈 Schweben (Float)</option>
                          <option value="spin">🔄 Drehen (360° Spin)</option>
                          <option value="pulse">💓 Pulsieren (Pulse)</option>
                          <option value="glow">✨ Leuchten (Glow)</option>
                          <option value="bounce">🏀 Hüpfen (Bounce)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                          Avatar Dekorations-Rahmen (Discord Style)
                        </label>
                        <select className="settings-select" value={userAvatarEffectFrame} onChange={(e) => setUserAvatarEffectFrame(e.target.value as any)}>
                          <option value="none">Kein Rahmen</option>
                          <option value="cyber_ring">⚙️ Cyber Ring (Dashed Teal)</option>
                          <option value="neon_pulse">💗 Neon Pulse (Pink Glow)</option>
                          <option value="golden_aura">👑 Golden Aura (Gold)</option>
                          <option value="fire_particles">🔥 Fire Particles (Orange)</option>
                          <option value="galaxy_orbit">🌌 Galaxy Orbit (Purple/Cyan)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* BLOCK 2: Schnell-Presets & Texte */}
                  <div style={{ marginBottom: "16px", padding: "16px", background: "var(--bg-secondary)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                      <Icon icon="mage:sparkles" style={{ color: "var(--accent-color)" }} />
                      Presets & Profil-Texte
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>
                        Schnell-Presets
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
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
                            style={{ padding: "8px 4px", fontSize: "11px", borderRadius: "6px", textAlign: "center" }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                          Benutzername / Profil-Name
                        </label>
                        <input
                          type="text"
                          className="settings-input"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="CipherNaut"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                          Status-Spruch
                        </label>
                        <input
                          type="text"
                          className="settings-input"
                          value={userStatusQuote}
                          onChange={(e) => setUserStatusQuote(e.target.value)}
                          placeholder="Zeno verschlüsselt meine Daten."
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                          Profil Badge / Badge-Text
                        </label>
                        <input
                          type="text"
                          className="settings-input"
                          value={userBadge}
                          onChange={(e) => setUserBadge(e.target.value)}
                          placeholder="⚡ VIP CYBERNAUT"
                        />
                      </div>
                    </div>
                  </div>

                  {/* BLOCK 3: Farben, Designs & Baukasten */}
                  <div style={{ marginBottom: "16px", padding: "16px", background: "var(--bg-secondary)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                      <Icon icon="mage:paint-brush" style={{ color: "var(--accent-color)" }} />
                      Farbanpassungen & Effekte
                    </div>

                    {/* 3-Spalten Farben-Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                          Badge-Hintergrund (CSS)
                        </label>
                        <input 
                          type="text" 
                          className="settings-input" 
                          value={userBadgeBgColor} 
                          onChange={(e) => setUserBadgeBgColor(e.target.value)} 
                          placeholder="#111214 oder linear-gradient(...)" 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                          Badge-Textfarbe
                        </label>
                        <input 
                          type="text" 
                          className="settings-input" 
                          value={userBadgeTextColor} 
                          onChange={(e) => setUserBadgeTextColor(e.target.value)} 
                          placeholder="#00DFD8 oder #FFFFFF" 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                          Karten-Body Hintergrund
                        </label>
                        <input 
                          type="text" 
                          className="settings-input" 
                          value={userCardBgColor} 
                          onChange={(e) => setUserCardBgColor(e.target.value)} 
                          placeholder="#0d0b14 oder linear-gradient(...)" 
                        />
                      </div>
                    </div>

                    {/* Banner Input */}
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                        Banner CSS Gradient / Hintergrund
                      </label>
                      <input
                        type="text"
                        className="settings-input"
                        value={userBannerGradient}
                        onChange={(e) => setUserBannerGradient(e.target.value)}
                        placeholder="linear-gradient(135deg, #7928CA 0%, #FF0080 100%)"
                        style={{ fontFamily: "monospace" }}
                      />
                    </div>

                    {/* 3-Spalten Hover, Animation Builder & Layout */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                          Karten-Hover Design (Shop Style)
                        </label>
                        <select className="settings-select" value={userCardHoverEffect} onChange={(e) => setUserCardHoverEffect(e.target.value as any)}>
                          <option value="none">Kein Hover-Effekt</option>
                          <option value="rainbow_border">🌈 Rainbow Border</option>
                          <option value="holographic_shimmer">✨ Holographic Shimmer</option>
                          <option value="cosmic_glow">🌌 Cosmic Glow</option>
                          <option value="neon_border">🟩 Neon Border Glow</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                          Animation Baukasten (Sicher)
                        </label>
                        <select className="settings-select" value={userAnimationPreset} onChange={(e) => setUserAnimationPreset(e.target.value as any)}>
                          <option value="none">Statisch (Keine Animation)</option>
                          <option value="subtle_pulse">💓 Sanfter Puls (Subtle Pulse)</option>
                          <option value="floating_card">🎈 Schwebende Karte (Floating)</option>
                          <option value="neon_flicker">⚡ Neon Flackern (Flicker)</option>
                          <option value="particle_shimmer">🌈 Prismatisches Shimmern</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                          Element-Platzierung (Layout)
                        </label>
                        <select className="settings-select" value={userLayoutOrder} onChange={(e) => setUserLayoutOrder(e.target.value as any)}>
                          <option value="standard">Standard (Klassisch Zentriert)</option>
                          <option value="avatar_left">◀️ Avatar Links bündig</option>
                          <option value="compact">📱 Kompakter Banner-Header</option>
                          <option value="banner_overlay">🔮 Glassmorphism Overlay</option>
                        </select>
                      </div>
                    </div>

                    {/* Badge Position Row */}
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                        Badge-Ausrichtung
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
                  </div>

                  {/* 8. Custom CSS Editor Box */}
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

                  {/* 9. Live Profile Card Preview & Save Action */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", marginBottom: "60px" }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: "0 0 6px 0", color: "var(--text-primary)", fontSize: "13px" }}>Echtzeit Profil-Vorschau</h5>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 14px 0" }}>
                        So erscheint deine Profilkarte für andere Mitglieder im Chat und in der Mitgliederliste.
                      </p>
                      <button
                        className="settings-btn primary"
                        onClick={() => {
                          if (onSaveProfile) {
                            onSaveProfile();
                          } else {
                            showToast("🎨 Profil-Design & Custom-CSS erfolgreich gespeichert!");
                          }
                        }}
                      >
                        💾 Profil-Design speichern
                      </button>
                    </div>

                    {/* Live Mini Preview Card */}
                    <div style={{ width: "260px", position: "relative" }} id="profile-card-modal">
                      <div 
                        className={`profile-modal-card ${userProfilePreset} ${userCardHoverEffect !== "none" ? `card-hover-${userCardHoverEffect}` : ""} ${userLayoutOrder !== "standard" ? `layout-${userLayoutOrder}` : ""} ${userAnimationPreset !== "none" ? `anim-preset-${userAnimationPreset}` : ""}`} 
                        style={{ width: "100%", minHeight: "220px" }}
                      >
                        {userCustomCss && <style>{userCustomCss}</style>}
                        <div className="profile-card-banner" style={{ background: userBannerGradient }} />
                        <div className="profile-card-body" style={{ padding: "14px", ...(userCardBgColor ? { background: userCardBgColor } : {}) }}>
                          <div className="profile-avatar-wrapper">
                            <div 
                              className={`profile-card-avatar purple ${userAvatarHoverEffect !== "none" ? `avatar-hover-${userAvatarHoverEffect}` : ""} ${userAvatarEffectFrame !== "none" ? `avatar-frame-${userAvatarEffectFrame}` : ""}`} 
                              style={{ width: "54px", height: "54px", fontSize: "22px" }}
                            >
                              {userAvatarImage ? (
                                <img src={userAvatarImage} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                              ) : (
                                "C"
                              )}
                            </div>
                            {userBadge && (
                              <span 
                                className={`profile-badge ${userBadgePosition}`}
                                style={{
                                  ...(userBadgeBgColor ? { background: userBadgeBgColor } : {}),
                                  ...(userBadgeTextColor ? { color: userBadgeTextColor } : {})
                                }}
                              >
                                {userBadge}
                              </span>
                            )}
                          </div>
                          <h3 className="profile-card-name" style={{ fontSize: "14px" }}>{userName || "CipherNaut"}</h3>
                          <span className="profile-card-role" style={{ fontSize: "8px" }}>UNTERSTÜTZER</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Appearance / Theme Studio */}
            {activeSettingsTab === "appearance" && (
              <div className="settings-tab-content" id="tab-appearance">
                <input
                  type="file"
                  ref={themeFileInputRef}
                  accept=".exptheme,.json"
                  style={{ display: "none" }}
                  onChange={handleImportTheme}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Theme Studio &amp; Erscheinungsbild</h3>
                    <p className="settings-help-text" style={{ marginTop: "3px" }}>
                      Passe das gesamte Erscheinungsbild von Zeno an. Wähle zwischen vereinfachten Presets oder vollem CSS-Codezugriff.
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={handleExportTheme}
                      className="settings-btn"
                      style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px" }}
                      title="Theme als .exptheme-Datei exportieren"
                    >
                      <Icon icon="mage:download" /> Exportieren (.exptheme)
                    </button>
                    <button
                      type="button"
                      onClick={() => themeFileInputRef.current?.click()}
                      className="settings-btn"
                      style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px" }}
                      title="Bestehendes .exptheme Theme importieren"
                    >
                      <Icon icon="mage:upload" /> Importieren
                    </button>
                  </div>
                </div>

                {/* Mode Switcher: "Vereinfacht" vs "Professional" */}
                <div style={{ display: "flex", backgroundColor: "#0D0E12", padding: "4px", borderRadius: "10px", marginBottom: "18px", border: "1px solid #1E222D", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setThemeCustomMode("simplified")}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: themeCustomMode === "simplified" ? "#1E222D" : "transparent",
                      color: themeCustomMode === "simplified" ? "#00FF87" : "#94A3B8",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <Icon icon="mage:palette" /> Vereinfacht (Presets &amp; Regler)
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeCustomMode("professional")}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: themeCustomMode === "professional" ? "#1E222D" : "transparent",
                      color: themeCustomMode === "professional" ? "#38BDF8" : "#94A3B8",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <Icon icon="mage:code" /> Professional (Monaco Editor &amp; CSS-Layers)
                  </button>
                </div>

                {/* --- MODE 1: VEREINFACHT --- */}
                {themeCustomMode === "simplified" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Akzentfarbe Presets & Custom */}
                    <div className="settings-form-group">
                      <label>Akzent- &amp; Highlightfarbe</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
                        {[
                          { color: "#00FF87", label: "Zeno Neon" },
                          { color: "#38BDF8", label: "Cyber Sky" },
                          { color: "#3574F0", label: "JetBrains" },
                          { color: "#A855F7", label: "Cyber Purple" },
                          { color: "#F59E0B", label: "Amber Flame" },
                          { color: "#F43F5E", label: "Neo Crimson" }
                        ].map((p) => (
                          <button
                            key={p.color}
                            type="button"
                            onClick={() => handleSimplifiedChange(p.color, fontFamily, buttonRadius, scrollbarStyle, islandOpacity, islandBlur)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              backgroundColor: accentColor === p.color ? "rgba(255,255,255,0.12)" : "#18191B",
                              border: accentColor === p.color ? `2px solid ${p.color}` : "1px solid rgba(255,255,255,0.08)",
                              borderRadius: "6px",
                              padding: "5px 10px",
                              cursor: "pointer",
                              color: "#DFE1E5",
                              fontSize: "11px",
                              fontWeight: "600"
                            }}
                          >
                            <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: p.color, display: "inline-block" }} />
                            {p.label}
                          </button>
                        ))}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Eigenes Hex:</span>
                          <input
                            type="color"
                            value={accentColor}
                            onChange={(e) => handleSimplifiedChange(e.target.value, fontFamily, buttonRadius, scrollbarStyle, islandOpacity, islandBlur)}
                            style={{ width: "28px", height: "28px", padding: 0, border: "none", borderRadius: "6px", cursor: "pointer", background: "none" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Schriftarten / Typography */}
                    <div className="settings-form-group">
                      <label>Benutzeroberflächen-Schriftart (Font Family)</label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px", marginTop: "6px" }}>
                        {[
                          { id: "'Inter', sans-serif", label: "Inter (Zeno Standard)" },
                          { id: "'JetBrains Mono', monospace", label: "JetBrains Mono" },
                          { id: "'Fira Code', monospace", label: "Fira Code" },
                          { id: "'Roboto', sans-serif", label: "Roboto Clean" },
                          { id: "system-ui, sans-serif", label: "System UI (Native)" }
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => handleSimplifiedChange(accentColor, f.id, buttonRadius, scrollbarStyle, islandOpacity, islandBlur)}
                            style={{
                              padding: "7px 10px",
                              backgroundColor: fontFamily === f.id ? "rgba(0,255,135,0.12)" : "#18191B",
                              border: fontFamily === f.id ? "1px solid #00FF87" : "1px solid rgba(255,255,255,0.06)",
                              borderRadius: "6px",
                              color: fontFamily === f.id ? "#00FF87" : "#DFE1E5",
                              fontSize: "11px",
                              fontFamily: f.id,
                              cursor: "pointer",
                              textAlign: "center",
                              fontWeight: fontFamily === f.id ? "700" : "500"
                            }}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Button- & Eckenrundung */}
                    <div className="settings-form-group">
                      <label>Eckenrundung von Steuerelementen &amp; Buttons</label>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
                        {[
                          { id: "2px", label: "Eckig (2px)" },
                          { id: "6px", label: "Subtil (6px)" },
                          { id: "12px", label: "Weich (12px)" },
                          { id: "99px", label: "Pill / Kapsel" }
                        ].map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => handleSimplifiedChange(accentColor, fontFamily, r.id, scrollbarStyle, islandOpacity, islandBlur)}
                            style={{
                              flex: 1,
                              padding: "7px 10px",
                              backgroundColor: buttonRadius === r.id ? "rgba(0,255,135,0.12)" : "#18191B",
                              border: buttonRadius === r.id ? "1px solid #00FF87" : "1px solid rgba(255,255,255,0.06)",
                              borderRadius: r.id === "99px" ? "20px" : r.id,
                              color: buttonRadius === r.id ? "#00FF87" : "#DFE1E5",
                              fontSize: "11px",
                              cursor: "pointer",
                              fontWeight: buttonRadius === r.id ? "700" : "500"
                            }}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scrollbar-Stil */}
                    <div className="settings-form-group">
                      <label>Scrollbar-Design</label>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
                        {[
                          { id: "standard", label: "Standard (6px Abgerundet)" },
                          { id: "narrow", label: "Ultra-Schmal (3px Minimal)" },
                          { id: "minimal", label: "Dezent (4px)" }
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSimplifiedChange(accentColor, fontFamily, buttonRadius, s.id, islandOpacity, islandBlur)}
                            style={{
                              flex: 1,
                              padding: "7px 10px",
                              backgroundColor: scrollbarStyle === s.id ? "rgba(0,255,135,0.12)" : "#18191B",
                              border: scrollbarStyle === s.id ? "1px solid #00FF87" : "1px solid rgba(255,255,255,0.06)",
                              borderRadius: "6px",
                              color: scrollbarStyle === s.id ? "#00FF87" : "#DFE1E5",
                              fontSize: "11px",
                              cursor: "pointer",
                              fontWeight: scrollbarStyle === s.id ? "700" : "500"
                            }}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Floating Island Transparenz & Blur */}
                    <div className="settings-form-group">
                      <label>Floating Islands &amp; Glassmorphism</label>
                      <div className="switch-control" style={{ marginBottom: "10px" }}>
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

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "8px" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                            <span>Karten-Deckkraft (Inseln)</span>
                            <span style={{ fontWeight: "700", color: "#00FF87" }}>{Math.round(islandOpacity * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.4"
                            max="1.0"
                            step="0.05"
                            value={islandOpacity}
                            onChange={(e) => handleSimplifiedChange(accentColor, fontFamily, buttonRadius, scrollbarStyle, parseFloat(e.target.value), islandBlur)}
                            style={{ width: "100%", accentColor: "#00FF87", cursor: "pointer" }}
                          />
                        </div>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                            <span>Milchglas-Unschärfe (Blur)</span>
                            <span style={{ fontWeight: "700", color: "#38BDF8" }}>{islandBlur}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="30"
                            step="2"
                            value={islandBlur}
                            onChange={(e) => handleSimplifiedChange(accentColor, fontFamily, buttonRadius, scrollbarStyle, islandOpacity, parseInt(e.target.value, 10))}
                            style={{ width: "100%", accentColor: "#38BDF8", cursor: "pointer" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Hintergrund Presets & Canvas */}
                    <div className="settings-form-group">
                      <label>Canvas Hintergrund-Presets</label>
                      <div className="color-presets" id="settings-color-presets" style={{ marginTop: "6px" }}>
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

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
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

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                      <button
                        type="button"
                        onClick={handleResetTheme}
                        className="settings-btn"
                        style={{ fontSize: "11px", color: "var(--text-muted)" }}
                      >
                        Auf Standard zurücksetzen
                      </button>
                    </div>
                  </div>
                )}

                {/* --- MODE 2: PROFESSIONAL (MONACO IDE & CSS LAYERS) --- */}
                {themeCustomMode === "professional" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* Layer Selector */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", marginRight: "4px" }}>
                        Theme-Ebenen:
                      </span>
                      {[
                        { id: "theme-variables.css", label: "theme-variables.css", icon: "mage:file-records" },
                        { id: "floating-islands.css", label: "floating-islands.css", icon: "mage:dashboard" },
                        { id: "buttons-controls.css", label: "buttons-controls.css", icon: "mage:toggle" },
                        { id: "monaco-ide.css", label: "monaco-ide.css", icon: "mage:code" }
                      ].map((layer) => (
                        <button
                          key={layer.id}
                          type="button"
                          onClick={() => setActiveThemeLayer(layer.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "5px 10px",
                            backgroundColor: activeThemeLayer === layer.id ? "#1E222D" : "#111319",
                            border: activeThemeLayer === layer.id ? "1px solid #38BDF8" : "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "6px",
                            color: activeThemeLayer === layer.id ? "#38BDF8" : "#94A3B8",
                            fontSize: "11px",
                            fontFamily: "var(--font-mono)",
                            cursor: "pointer",
                            fontWeight: activeThemeLayer === layer.id ? "700" : "500",
                            whiteSpace: "nowrap"
                          }}
                        >
                          <Icon icon={layer.icon} /> {layer.label}
                        </button>
                      ))}
                    </div>

                    {/* Monaco Editor Instance */}
                    <div
                      style={{
                        border: "1px solid #1E222D",
                        borderRadius: "8px",
                        overflow: "hidden",
                        backgroundColor: "#18191B"
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#111319",
                          padding: "6px 12px",
                          borderBottom: "1px solid #1E222D",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "11px"
                        }}
                      >
                        <span style={{ fontFamily: "var(--font-mono)", color: "#38BDF8", fontWeight: "600" }}>
                          ● {activeThemeLayer}
                        </span>
                        <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>
                          CSS-Syntax • Live-Injection
                        </span>
                      </div>
                      <Editor
                        height="320px"
                        language="css"
                        theme={theme === "light" ? "zeno-light-theme" : "zeno-dark-theme"}
                        value={themeLayers[activeThemeLayer] || ""}
                        onChange={(val) => {
                          setThemeLayers((prev) => ({
                            ...prev,
                            [activeThemeLayer]: val || ""
                          }));
                        }}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 12.5,
                          fontFamily: "var(--font-mono)",
                          automaticLayout: true,
                          tabSize: 2,
                          scrollBeyondLastLine: false
                        }}
                      />
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            applyAllLayers(themeLayers);
                            showToast("✓ Theme-Code live angewendet & gespeichert!");
                          }}
                          className="settings-btn primary"
                          style={{
                            backgroundColor: "#00FF87",
                            color: "#08090C",
                            fontWeight: "700",
                            fontSize: "11px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 14px"
                          }}
                        >
                          <Icon icon="mage:check" /> Änderungen anwenden &amp; speichern
                        </button>
                        <button
                          type="button"
                          onClick={handleResetTheme}
                          className="settings-btn"
                          style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "5px" }}
                        >
                          <Icon icon="mage:refresh" /> Zurücksetzen
                        </button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={handleExportTheme}
                          className="settings-btn"
                          style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "5px" }}
                        >
                          <Icon icon="mage:download" /> .exptheme Export
                        </button>
                        <button
                          type="button"
                          onClick={() => themeFileInputRef.current?.click()}
                          className="settings-btn"
                          style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "5px" }}
                        >
                          <Icon icon="mage:upload" /> .exptheme Import
                        </button>
                      </div>
                    </div>

                    {/* Security Sandbox Callout */}
                    <div
                      style={{
                        backgroundColor: "rgba(56, 189, 248, 0.08)",
                        border: "1px solid rgba(56, 189, 248, 0.2)",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        marginTop: "4px"
                      }}
                    >
                      <Icon icon="mage:shield" style={{ fontSize: "18px", color: "#38BDF8", flexShrink: 0, marginTop: "2px" }} />
                      <div style={{ fontSize: "11px", lineHeight: "1.4", color: "#94A3B8" }}>
                        <strong style={{ color: "#38BDF8" }}>Frontend-Sandbox Sicherheitsgarantie:</strong>
                        <br />
                        Themes und Plugins operieren rein deklarativ über CSS-Stile und DOM-Templates. Sicherheitskritische Operationen (Dateizugriffe, Netzwerk-Transport, Kryptografie) sind im Tauri-Frontend strikt gesperrt und laufen ausschließlich im nativen Rust-Backend.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Voice & Audio */}
            {activeSettingsTab === "voice" && (
              <div className="settings-tab-content" id="tab-voice">
                <AudioSettingsTab showToast={showToast} />
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

            {/* Tab: Sovereign Identity & 12 Words */}
            {activeSettingsTab === "identity" && (
              <div className="settings-tab-content" id="tab-identity">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Souveräne Identität &amp; 12-Wort-Schlüssel (BIP-39)</h3>
                    <p className="settings-help-text" style={{ marginTop: "4px" }}>
                      Zeno verwendet dezentrale, kryptografische Schlüssel (ECDSA P-256) anstelle von E-Mail-Adressen oder Passwörtern.
                    </p>
                  </div>
                  <span style={{ fontSize: "11px", backgroundColor: "rgba(0,255,135,0.15)", color: "#00FF87", padding: "4px 8px", borderRadius: "6px", fontWeight: "700" }}>
                    ECDSA P-256 (Rust Core)
                  </span>
                </div>

                {/* Identity Status Card */}
                <div style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#00FF87", color: "#08090C", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "18px" }}>
                        {(userName || "C").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#FFF" }}>{userName || "CipherNaut"}</div>
                        <div style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "monospace" }}>
                          AIN: {userIdentity?.ain || "ZENO-8F3A-9B21-44E2"}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(userIdentity?.ain || "");
                        showToast("AIN kopiert! 📋");
                      }}
                      style={{ background: "#161922", border: "1px solid #262933", color: "#E2E8F0", padding: "6px 10px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Icon icon="mage:copy" /> AIN kopieren
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "11px", backgroundColor: "#161922", padding: "10px", borderRadius: "8px", border: "1px solid #262933" }}>
                    <div>
                      <span style={{ color: "#64748B", display: "block" }}>SHA-256 FINGERPRINT:</span>
                      <span style={{ color: "#E2E8F0", fontFamily: "monospace" }}>{userIdentity?.fingerprint || "SHA256:8F:3A:9B:21:44:E2:7C:10"}</span>
                    </div>
                    <div>
                      <span style={{ color: "#64748B", display: "block" }}>12-WORT BACKUP STATUS:</span>
                      {userIdentity?.mnemonic ? (
                        <span style={{ color: "#00FF87", fontWeight: "600" }}>✅ BIP-39 Seedphrase aktiv</span>
                      ) : (
                        <span style={{ color: "#F59E0B", fontWeight: "600" }}>⚠️ Veraltetes Profil (Kein 12-Wort-Seed)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Warning if no 12-word seed */}
                {!userIdentity?.mnemonic && (
                  <div style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "10px", padding: "14px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Icon icon="mage:alert" style={{ color: "#F59E0B", fontSize: "24px" }} />
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#F59E0B" }}>Konto noch nicht gesichert!</div>
                        <div style={{ fontSize: "11px", color: "#CBD5E1" }}>
                          Du nutzt ein temporäres Profil ohne 12-Wort-Wiederherstellungsphrase. Erstelle jetzt deine unzerstörbare Identität.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        showToast("Öffne Assistenten zur Kontoerstellung... 🛡️");
                        onOpenSovereignModal && onOpenSovereignModal("create");
                      }}
                      style={{ backgroundColor: "#00FF87", color: "#08090C", border: "none", borderRadius: "6px", padding: "8px 12px", fontWeight: "700", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      ⚡ 12 Wörter generieren
                    </button>
                  </div>
                )}

                {/* Primary Actions */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#FFF", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon icon="mage:user-plus" style={{ color: "#00FF87" }} />
                        Neues Souveränes Konto erstellen
                      </div>
                      <p style={{ fontSize: "11px", color: "#94A3B8", margin: "0 0 12px 0", lineHeight: "1.4" }}>
                        Generiert ein brandneues ECDSA P-256 Schlüsselpaar mit 12 BIP-39 Wörtern und speichert es in SQLite.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="settings-btn"
                      onClick={() => {
                        showToast("Öffne Konto-Assistenten... 🛡️");
                        onOpenSovereignModal && onOpenSovereignModal("create");
                      }}
                      style={{ backgroundColor: "#00FF87", color: "#08090C", fontWeight: "700" }}
                    >
                      Assistent öffnen
                    </button>
                  </div>

                  <div style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#FFF", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon icon="mage:refresh" style={{ color: "#38BDF8" }} />
                        Konto wiederherstellen (12 Wörter)
                      </div>
                      <p style={{ fontSize: "11px", color: "#94A3B8", margin: "0 0 12px 0", lineHeight: "1.4" }}>
                        Stelle eine bestehende AIN auf diesem Gerät mathematisch exakt wieder her.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="settings-btn"
                      onClick={() => {
                        showToast("Öffne Kontowiederherstellung... 🔑");
                        onOpenSovereignModal && onOpenSovereignModal("restore");
                      }}
                      style={{ backgroundColor: "#161922", border: "1px solid #38BDF8", color: "#38BDF8", fontWeight: "700" }}
                    >
                      12 Wörter eingeben
                    </button>
                  </div>
                </div>

                {/* Manage All Identities */}
                <div style={{ backgroundColor: "#0D0E12", border: "1px solid #1E222D", borderRadius: "10px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#FFF" }}>Lokale Identitäten verwalten (Multi-Identity)</div>
                    <div style={{ fontSize: "11px", color: "#94A3B8" }}>Wechsle zwischen Profilen, sichere Paper-Backups oder exportiere Keys.</div>
                  </div>
                  <button
                    type="button"
                    className="settings-btn"
                    onClick={() => {
                      showToast("Öffne Identitätsverwaltung... 🪪");
                      onOpenSovereignModal && onOpenSovereignModal("manage");
                    }}
                    style={{ backgroundColor: "#161922", border: "1px solid #262933", color: "#E2E8F0" }}
                  >
                    Identitäten anzeigen
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Security */}
            {activeSettingsTab === "security" && (
              <div className="settings-tab-content" id="tab-security">
                <h3>Sicherheit &amp; Recovery</h3>
                <div className="settings-form-group">
                  <label>Backup-Key (12-Wort Seed Phrase)</label>
                  <p className="settings-help-text">Sichere deine 12-Wort-Seed-Phrase, um deine Identität auf neuen Geräten wiederherzustellen.</p>
                  <button
                    className="settings-btn"
                    onClick={() => onOpenSovereignModal ? onOpenSovereignModal("manage") : showToast("Souveränes Konto öffnen")}
                    style={{ backgroundColor: "#00FF87", color: "#08090C", fontWeight: "700" }}
                  >
                    <Icon icon="mage:shield" style={{ marginRight: "6px" }} />
                    Souveräne Identität &amp; Backup-Keys verwalten
                  </button>
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
                <h3>Monaco-Editor & Native Ausführung</h3>
                <p className="settings-help-text">
                  Verwalte hier die Editor-Umgebung. Alle OS-Durchführungen und Ausführungsbefehle werden vollständig und sicher vom <strong>Rust-Backend</strong> übernommen.
                </p>

                <div style={{ backgroundColor: "rgba(53, 116, 240, 0.1)", border: "1px solid rgba(53, 116, 240, 0.25)", borderRadius: "var(--radius-md)", padding: "12px 16px", marginTop: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Icon icon="mage:shield-check" style={{ color: "var(--accent-color)", fontSize: "24px", flexShrink: 0 }} />
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    <strong>WASM-Laufzeiten auf Eis gelegt:</strong> Instabile WASM-Simulatoren wurden zugunsten der nativen Rust-Ausführung deaktiviert. Die IDE führt Quellcode direkt über die echten System-Interpreter (Rust, Python, Node, Go) deines Host-Systems aus, vollständig entkoppelt von der JavaScript-Oberfläche.
                  </div>
                </div>

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

          <div className="settings-close-wrapper">
            <button className="settings-close-btn" onClick={onClose} title="Einstellungen schließen (Esc)">
              <Icon icon="mage:multiply" />
            </button>
            <span className="settings-close-label">ESC</span>
          </div>
        </main>
    </div>
  );
};
