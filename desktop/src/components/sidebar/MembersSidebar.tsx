import React from "react";
import { Profile } from "../../types";

interface MembersSidebarProps {
  activeServerId: string;
  isMembersOpen: boolean;
  mockProfiles: Record<string, Profile>;
  onSelectProfile: (profile: Profile) => void;
}

export const MembersSidebar: React.FC<MembersSidebarProps> = ({
  activeServerId,
  isMembersOpen,
  mockProfiles,
  onSelectProfile
}) => {
  if (activeServerId === "home") return null;

  return (
    <aside className={`members-sidebar ${isMembersOpen ? "" : "collapsed"}`}>
      <section className="member-role-group" data-role="entwickler">
        <h3 className="role-group-header">ONLINE — 3</h3>
        <ul className="role-group-list">
          {["MaxShield", "LenaCrypt", "CipherNaut"].map((user) => {
            const profile = mockProfiles[user];
            if (!profile) return null;
            return (
              <li key={user}>
                <div className="member-item" onClick={() => onSelectProfile(profile)}>
                  <div className="member-avatar-wrapper">
                    <div className={`member-avatar ${profile.avatarColor || "blue"}`}>{profile.avatar || user[0]}</div>
                    <span className="status-dot online" />
                  </div>
                  <span className="member-name">{profile.name || user}</span>
                  {profile.role === "Unterstützer" && <span className="badge supporter-badge">⭐</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="member-role-group" data-role="bots">
        <h3 className="role-group-header">BOTS — 1</h3>
        <ul className="role-group-list">
          <li>
            <div className="member-item" onClick={() => mockProfiles.ZenoBot && onSelectProfile(mockProfiles.ZenoBot)}>
              <div className="member-avatar-wrapper">
                <div className="member-avatar orange">Z</div>
                <span className="status-dot online" />
              </div>
              <span className="member-name">ZenoBot</span>
              <span className="badge bot-badge">BOT</span>
            </div>
          </li>
        </ul>
      </section>

      <section className="member-role-group" data-role="offline">
        <h3 className="role-group-header">OFFLINE — 2</h3>
        <ul className="role-group-list">
          {["DarkNode", "QuantumLeap"].map((user) => {
            const profile = mockProfiles[user];
            if (!profile) return null;
            return (
              <li key={user}>
                <div className="member-item offline" onClick={() => onSelectProfile(profile)}>
                  <div className="member-avatar-wrapper">
                    <div className="member-avatar gray">{profile.avatar || user[0]}</div>
                    <span className="status-dot offline" />
                  </div>
                  <span className="member-name">{profile.name || user}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
};
