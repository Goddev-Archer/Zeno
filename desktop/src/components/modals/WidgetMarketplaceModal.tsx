import React from "react";
import { Icon } from "@iconify/react";
import { COMMUNITY_MARKETPLACE_WIDGETS, MarketplaceWidget } from "../../data/widgetMarketplaceData";

interface WidgetMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallWidget: (widget: MarketplaceWidget) => void;
  showToast: (msg: string) => void;
}

export const WidgetMarketplaceModal: React.FC<WidgetMarketplaceModalProps> = ({
  isOpen,
  onClose,
  onInstallWidget,
  showToast
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay open" style={{ position: "fixed", inset: 0, zIndex: 1050, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--bg-primary)", width: "760px", maxWidth: "90vw", maxHeight: "85vh", borderRadius: "14px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", boxShadow: "0 20px 50px rgba(0,0,0,0.6)", overflow: "hidden" }}>
        
        {/* Header */}
        <header style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon icon="mage:box-3d" style={{ color: "#00FF87" }} />
              Zeno Open-Source Widget Marketplace
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
              Durchsuche von der Community entwickelte, quelloffene Widgets. Quellcode ist öffentlich auf GitHub prüfbar.
            </p>
          </div>
          <button className="editor-close-btn modal-close" onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "20px" }}>
            <Icon icon="mage:multiply" />
          </button>
        </header>

        {/* Body / Widget List */}
        <div style={{ padding: "24px", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", flex: 1 }}>
          {COMMUNITY_MARKETPLACE_WIDGETS.map((item) => (
            <div key={item.id} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(0,255,135,0.1)", color: "#00FF87", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                      <Icon icon={item.icon} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>{item.name}</h4>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>von {item.author} • {item.version}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: "10px", color: "#00FF87", background: "rgba(0,255,135,0.1)", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
                    ✓ Open-Source
                  </span>
                </div>

                <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "8px 0 12px 0", lineHeight: "1.4" }}>
                  {item.description}
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "8px" }}>
                <a 
                  href={item.repoUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Icon icon="mage:github-circle" /> Repository ★ {item.stars}
                </a>

                <button 
                  className="settings-btn primary" 
                  onClick={() => {
                    onInstallWidget(item);
                    showToast(`Widget "${item.name}" im Dashboard installiert! 🎉`);
                  }}
                  style={{ fontSize: "11px", padding: "6px 12px" }}
                >
                  <Icon icon="mage:plus" /> Hinzufügen
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer style={{ padding: "14px 24px", borderTop: "1px solid var(--border-color)", background: "var(--bg-secondary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            💡 Möchtest du eigene Widgets veröffentlichen? Erstelle ein Pull Request im Zeno-Widget-Repo!
          </span>
          <button className="settings-btn" onClick={onClose} style={{ fontSize: "11px" }}>
            Schließen
          </button>
        </footer>

      </div>
    </div>
  );
};
