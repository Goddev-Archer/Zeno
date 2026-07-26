import React from "react";
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
  if (!selectedUserProfile) return null;

  return (
    <div className="modal-overlay open" id="profile-card-modal">
      <div className={`profile-modal-card ${selectedUserProfile.themePreset || "default"}`}>
        {/* Scoped Custom CSS Template Injection */}
        {selectedUserProfile.customCss && (
          <style>{selectedUserProfile.customCss}</style>
        )}

        {/* Profile Banner */}
        <div 
          className="profile-card-banner" 
          style={{ background: selectedUserProfile.bannerGradient || "linear-gradient(135deg, #3574F0 0%, #1A44A5 100%)" }}
        >
          <button className="modal-close" onClick={onClose} title="Schließen">
            <Icon icon="mage:multiply" />
          </button>
        </div>

        <div className="profile-card-body">
          <div className="profile-avatar-wrapper">
            <div 
              className={`profile-card-avatar ${selectedUserProfile.avatarColor}`}
              style={selectedUserProfile.bgColor ? { backgroundColor: selectedUserProfile.bgColor } : {}}
            >
              {selectedUserProfile.avatar}
            </div>
            {selectedUserProfile.badge && (
              <span className={`profile-badge ${selectedUserProfile.badgePosition || "badge-center"}`}>
                {selectedUserProfile.badge}
              </span>
            )}
          </div>

          <h3 className="profile-card-name">{selectedUserProfile.name}</h3>
          <span className="profile-card-role">{selectedUserProfile.role.toUpperCase()}</span>
          {selectedUserProfile.status && <div className="profile-card-status">{selectedUserProfile.status}</div>}
          
          <div className="profile-card-section">
            <label>Kryptografischer Fingerprint</label>
            <div className="fingerprint-display">
              {selectedUserProfile.fingerprint}
            </div>
          </div>

          <div className="profile-card-actions">
            <button className="profile-action-btn primary" onClick={() => onStartChat(selectedUserProfile)}>
              Sicheren Chat starten
            </button>
            <button className="profile-action-btn" onClick={onVerifyIdentity}>
              Identität verifizieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
