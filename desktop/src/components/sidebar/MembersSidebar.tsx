import React, { useMemo } from "react";
import { Icon } from "@iconify/react";
import { Profile, Server } from "../../types";

interface MembersSidebarProps {
  activeServerId: string;
  activeServer?: Server;
  isMembersOpen: boolean;
  currentUserName?: string;
  currentUserAin?: string;
  isServerOwner?: boolean;
  mockProfiles: Record<string, Profile>;
  onSelectProfile: (profile: Profile) => void;
  onlinePeers?: Array<{
    name: string;
    ain?: string;
    role?: string;
    avatarColor?: string;
    isOwner?: boolean;
  }>;
}

export const MembersSidebar: React.FC<MembersSidebarProps> = ({
  activeServerId,
  activeServer,
  isMembersOpen,
  currentUserName = "CipherNaut",
  currentUserAin,
  isServerOwner = true,
  mockProfiles,
  onSelectProfile,
  onlinePeers = []
}) => {
  if (activeServerId === "home") return null;

  // Local active sovereign user profile
  const localProfile: Profile = useMemo(() => {
    const existing = mockProfiles[currentUserName];
    const isOwner = isServerOwner || (activeServer?.ownerAin && activeServer.ownerAin === currentUserAin);

    return {
      id: existing?.id || "local-user",
      name: currentUserName,
      avatar: (currentUserName || "C")[0].toUpperCase(),
      avatarColor: existing?.avatarColor || "purple",
      avatarImage: existing?.avatarImage,
      avatarHoverEffect: existing?.avatarHoverEffect,
      avatarEffectFrame: existing?.avatarEffectFrame,
      role: isOwner ? "Server-Eigentümer" : (existing?.role || "Mitglied"),
      roleColor: isOwner ? "green" : (existing?.roleColor || "blue"),
      status: existing?.status || '"Souveräner Peer online"',
      fingerprint: currentUserAin || existing?.fingerprint || "ZENO-SOVEREIGN",
      bannerGradient: existing?.bannerGradient,
      badge: isOwner ? "👑" : existing?.badge,
      badgePosition: existing?.badgePosition,
      themePreset: existing?.themePreset
    };
  }, [currentUserName, currentUserAin, isServerOwner, activeServer, mockProfiles]);

  // Dynamic server members: from server manifest or P2P connected peers
  const serverMembers = useMemo(() => {
    const list: Profile[] = [];
    const seenNames = new Set<string>([currentUserName.toLowerCase()]);

    // 1. Add members from active server definition (if configured in manifest)
    if (activeServer?.members && activeServer.members.length > 0) {
      activeServer.members.forEach((m) => {
        if (!seenNames.has(m.name.toLowerCase())) {
          seenNames.add(m.name.toLowerCase());
          list.push(m);
        }
      });
    }

    // 2. Add real online peers connected via P2P relay
    onlinePeers.forEach((peer) => {
      if (!seenNames.has(peer.name.toLowerCase())) {
        seenNames.add(peer.name.toLowerCase());
        list.push({
          id: `peer-${peer.name}`,
          name: peer.name,
          avatar: peer.name[0].toUpperCase(),
          avatarColor: peer.avatarColor || "blue",
          role: peer.role || (peer.isOwner ? "Moderator" : "Peer"),
          roleColor: peer.isOwner ? "green" : "blue",
          status: '"P2P verbunden"',
          fingerprint: peer.ain || "ZENO-PEER"
        });
      }
    });

    return list;
  }, [activeServer, onlinePeers, currentUserName]);

  const isLocalOwner = localProfile.role === "Server-Eigentümer";

  return (
    <aside className={`members-sidebar ${isMembersOpen ? "" : "collapsed"}`}>
      {/* 1. EIGENTÜMER & MODERATION */}
      {isLocalOwner && (
        <section className="member-role-group" data-role="owner">
          <h3 className="role-group-header">EIGENTÜMER — 1</h3>
          <ul className="role-group-list">
            <li>
              <div 
                className="member-item" 
                onClick={() => onSelectProfile(localProfile)}
                title={`Souveränes Konto von ${localProfile.name} (${localProfile.fingerprint})`}
              >
                <div className="member-avatar-wrapper">
                  <div className={`member-avatar ${localProfile.avatarColor || "purple"}`}>
                    {localProfile.avatar}
                  </div>
                  <span className="status-dot online" />
                </div>
                <div className="member-info-col" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span className="member-name">{localProfile.name}</span>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>(Du)</span>
                  </div>
                  <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {localProfile.fingerprint.slice(0, 16)}...
                  </span>
                </div>
                <span className="badge supporter-badge" title="Server-Eigentümer">👑</span>
              </div>
            </li>
          </ul>
        </section>
      )}

      {/* 2. ONLINE PEERS */}
      <section className="member-role-group" data-role="online">
        <h3 className="role-group-header">
          ONLINE — {!isLocalOwner ? serverMembers.length + 1 : serverMembers.length}
        </h3>
        <ul className="role-group-list">
          {!isLocalOwner && (
            <li>
              <div 
                className="member-item" 
                onClick={() => onSelectProfile(localProfile)}
                title={`Konto von ${localProfile.name}`}
              >
                <div className="member-avatar-wrapper">
                  <div className={`member-avatar ${localProfile.avatarColor || "purple"}`}>
                    {localProfile.avatar}
                  </div>
                  <span className="status-dot online" />
                </div>
                <div className="member-info-col" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span className="member-name">{localProfile.name}</span>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>(Du)</span>
                  </div>
                  <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#64748B" }}>
                    {localProfile.fingerprint.slice(0, 14)}...
                  </span>
                </div>
              </div>
            </li>
          )}

          {serverMembers.map((member) => (
            <li key={member.name}>
              <div 
                className="member-item" 
                onClick={() => onSelectProfile(member)}
                title={`Peer ${member.name} (${member.fingerprint})`}
              >
                <div className="member-avatar-wrapper">
                  <div className={`member-avatar ${member.avatarColor || "blue"}`}>
                    {member.avatar || member.name[0]}
                  </div>
                  <span className="status-dot online" />
                </div>
                <div className="member-info-col" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span className="member-name">{member.name}</span>
                  <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#64748B" }}>
                    {member.fingerprint.slice(0, 14)}...
                  </span>
                </div>
                {member.role === "Moderator" && <span className="badge mod-badge">MOD</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. PEER DISCOVERY BANNER (When only local node is active) */}
      {serverMembers.length === 0 && (
        <div 
          className="peer-discovery-container"
          style={{
            margin: "12px 10px",
            padding: "10px 12px",
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            border: "1px dashed rgba(255, 255, 255, 0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#00FF87", fontSize: "11px", fontWeight: "600" }}>
            <Icon icon="octicon:shield-check-16" />
            <span>P2P-Server aktiv</span>
          </div>
          <p style={{ margin: 0, fontSize: "10px", color: "#94A3B8", lineHeight: "1.4" }}>
            Keine weiteren Peers verbunden. Teile das Git-Manifest (<code>zeno-server.json</code>) oder deine AIN, um Mitglieder einzuladen.
          </p>
        </div>
      )}
    </aside>
  );
};
