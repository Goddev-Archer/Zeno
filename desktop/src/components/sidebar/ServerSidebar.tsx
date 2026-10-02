import React from "react";
import { Icon } from "@iconify/react";
import { Server } from "../../types";

interface ServerSidebarProps {
  servers: Server[];
  activeServerId: string;
  activeServer: Server;
  animatingServerId: string | null;
  onSelectServer: (server: Server) => void;
  onGoHome: () => void;
  onAddServerClick: () => void;
  onOpenInstanceBrowser: () => void;
}

export const ServerSidebar: React.FC<ServerSidebarProps> = ({
  servers,
  activeServerId,
  activeServer,
  animatingServerId,
  onSelectServer,
  onGoHome,
  onAddServerClick,
  onOpenInstanceBrowser
}) => {
  return (
    <aside className="server-sidebar">
      <button 
        className={`server-icon home-button ${activeServerId === "home" ? "active" : ""}`} 
        onClick={onGoHome} 
        title="Zeno Home"
      >
        <img src="/zeno_logo.svg" alt="Zeno Logo" style={{ width: "30px", height: "30px", borderRadius: "6px" }} />
      </button>

      <div className="server-separator" role="separator" />

      <nav className="server-list" aria-label="Server-Liste">
        {servers.map((srv) => (
          <button
            key={srv.id}
            className={`server-icon ${activeServer.id === srv.id && activeServerId !== "home" ? "active" : ""} ${animatingServerId === srv.id ? "indicator-animate" : ""}`}
            onClick={() => onSelectServer(srv)}
            title={srv.name}
          >
            <span className="server-icon-letter">{srv.iconLetter}</span>
          </button>
        ))}
        <button 
          className="server-icon" 
          id="btn-add-server" 
          onClick={onAddServerClick} 
          title="Server erstellen oder beitreten"
        >
          <span className="server-icon-letter">+</span>
        </button>
        <button 
          className="server-icon" 
          id="btn-discover-servers" 
          onClick={onOpenInstanceBrowser} 
          title="Instanzen-Browser / Öffentliche Server entdecken"
        >
          <Icon icon="mage:compass" style={{ fontSize: "20px" }} />
        </button>
      </nav>
    </aside>
  );
};
