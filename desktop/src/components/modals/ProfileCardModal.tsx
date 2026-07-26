import React, { useEffect } from "react";
import { Icon } from "@iconify/react";
import { Profile } from "../../types";

interface ProfileCardModalProps {
  selectedUserProfile: Profile | null;
  onClose: () => void;
  onStartChat: (profile: Profile) => void;
  onVerifyIdentity: () => void;
}

export const ProfileCardModal: React.FC<ProfileCardModalProps> = ({
  selectedUserProfile,
  onClose,
  onStartChat,
  onVerifyIdentity
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!selectedUserProfile) return null;

  const p = selectedUserProfile;
  const hoverClass = p.cardHoverEffect && p.cardHoverEffect !== "none" ? `card-hover-${p.cardHoverEffect}` : "";
  const layoutClass = p.layoutOrder && p.layoutOrder !== "standard" ? `layout-${p.layoutOrder}` : "";
  const animClass = p.animationPreset && p.animationPreset !== "none" ? `anim-preset-${p.animationPreset}` : "";
  const avatarHoverClass = p.avatarHoverEffect && p.avatarHoverEffect !== "none" ? `avatar-hover-${p.avatarHoverEffect}` : "";
  const avatarFrameClass = p.avatarEffectFrame && p.avatarEffectFrame !== "none" ? `avatar-frame-${p.avatarEffectFrame}` : "";

  return (
    <div className="modal-overlay open" id="profile-card-modal" onClick={onClose}>
      <div 
        className="profile-modal-wrapper"
        style={{ position: "relative", display: "inline-block" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Outside Profile Card */}
        <div className="profile-close-wrapper">
          <button className="settings-close-btn" onClick={onClose} title="Profil schließen (Esc)">
            <Icon icon="mage:multiply" />
          </button>
          <span className="settings-close-label">ESC</span>
        </div>

        <div className={`profile-modal-card ${p.themePreset || "default"} ${hoverClass} ${layoutClass} ${animClass}`}>
          {/* Scoped Custom CSS Template Injection */}
          {p.customCss && (
            <style>{p.customCss}</style>
          )}

          {/* Profile Banner */}
          <div 
            className="profile-card-banner" 
            style={{ background: p.bannerGradient || "linear-gradient(135deg, #3574F0 0%, #1A44A5 100%)" }}
          />

          <div className="profile-card-body" style={p.cardBgColor ? { background: p.cardBgColor } : {}}>
            <div className="profile-avatar-wrapper">
              <div 
                className={`profile-card-avatar ${p.avatarColor} ${avatarHoverClass} ${avatarFrameClass}`}
                style={p.bgColor ? { backgroundColor: p.bgColor } : {}}
              >
                {p.avatarImage ? (
                  <img src={p.avatarImage} alt={p.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  p.avatar
                )}
              </div>
              {p.badge && (
                <span 
                  className={`profile-badge ${p.badgePosition || "badge-center"}`}
                  style={{
                    ...(p.badgeBgColor ? { background: p.badgeBgColor } : {}),
                    ...(p.badgeTextColor ? { color: p.badgeTextColor } : {})
                  }}
                >
                  {p.badge}
                </span>
              )}
            </div>

            <h3 className="profile-card-name">{p.name}</h3>
            <span className="profile-card-role">{p.role.toUpperCase()}</span>
            {p.status && <div className="profile-card-status">{p.status}</div>}

            {/* Bio / About Me */}
            {p.aboutMe && (
              <div className="profile-card-section" style={{ marginTop: "12px", textAlign: "left" }}>
                <label style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", display: "block", marginBottom: "4px" }}>Über mich</label>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4", background: "rgba(0,0,0,0.15)", padding: "8px 10px", borderRadius: "6px" }}>
                  {p.aboutMe}
                </div>
              </div>
            )}

            {/* Top Games / Activity */}
            {p.topGames && p.topGames.length > 0 && (
              <div className="profile-card-section" style={{ marginTop: "12px", textAlign: "left" }}>
                <label style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", display: "block", marginBottom: "6px" }}>🎮 Spiele & Aktivitäten</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {p.topGames.map((game, i) => (
                    <div key={i} style={{ background: "var(--bg-tertiary, rgba(255,255,255,0.08))", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{game.icon || "🎮"}</span>
                      <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{game.title}</span>
                      {game.hoursPlayed && <span style={{ fontSize: "10px", opacity: 0.7 }}>({game.hoursPlayed})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links & Platforms */}
            {p.socialLinks && p.socialLinks.length > 0 && (
              <div className="profile-card-section" style={{ marginTop: "12px", textAlign: "left" }}>
                <label style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", display: "block", marginBottom: "6px" }}>🌐 Verknüpfte Konten</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {p.socialLinks.map((link, i) => {
                    const iconMap: Record<string, string> = {
                      github: "mage:github-circle",
                      steam: "mage:gamepad",
                      discord: "mage:message-round",
                      twitter: "mage:x",
                      spotify: "mage:play",
                      custom: "mage:link"
                    };
                    return (
                      <a 
                        key={i} 
                        href={link.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontSize: "11px", textDecoration: "none", transition: "all 0.2s" }}
                        title={link.url}
                      >
                        <Icon icon={iconMap[link.platform] || "mage:link"} style={{ fontSize: "14px", color: "var(--accent-color, #00FF87)" }} />
                        <span>{link.label || link.platform}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="profile-card-section" style={{ marginTop: "12px" }}>
              <label>Kryptografischer Fingerprint</label>
              <div className="fingerprint-display">
                {p.fingerprint}
              </div>
            </div>

            <div className="profile-card-actions">
              <button className="profile-action-btn primary" onClick={() => onStartChat(p)}>
                Sicheren Chat starten
              </button>
              <button className="profile-action-btn" onClick={onVerifyIdentity}>
                Identität verifizieren
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
