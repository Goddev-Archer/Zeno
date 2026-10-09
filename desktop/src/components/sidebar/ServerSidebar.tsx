import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Server } from "../../types";
import { pluginManager } from "../../services/pluginManagerService";
import { PluginDockItem } from "../../types/pluginTypes";

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
  const [dockItems, setDockItems] = useState<PluginDockItem[]>(() => pluginManager.getDockItems());

  useEffect(() => {
    const unsub = pluginManager.onPluginChange(() => {
      setDockItems(pluginManager.getDockItems());
    });
    return unsub;
  }, []);

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

        {dockItems.length > 0 && (
          <>
            <div 
              className="server-separator plugin-dock-separator" 
              role="separator" 
              style={{ margin: "10px auto 4px auto", opacity: 0.65 }} 
              title="Plugin-Anwendungen"
            />
            <div className="plugin-dock-list" style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
              {dockItems.map((item) => (
                <button
                  key={item.id}
                  className={`server-icon plugin-dock-icon ${item.active ? "active" : ""}`}
                  onClick={item.onClick}
                  title={item.title}
                  style={{ position: "relative" }}
                >
                  {item.icon.startsWith("http") || item.icon.startsWith("/") ? (
                    <img src={item.icon} alt={item.title} style={{ width: "22px", height: "22px", borderRadius: "4px" }} />
                  ) : (
                    <Icon icon={item.icon} style={{ fontSize: "22px" }} />
                  )}
                  {item.badge !== undefined && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-3px",
                        right: "-3px",
                        background: "var(--accent-color, #3574f0)",
                        color: "#fff",
                        borderRadius: "10px",
                        padding: "1px 5px",
                        fontSize: "9px",
                        fontWeight: "700",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </nav>
    </aside>
  );
};
