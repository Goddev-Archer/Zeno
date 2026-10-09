// ============================================================================
//   ZENO OBSIDIAN-STYLE COMMUNITY PLUGINS SETTINGS TAB
//   Verwaltung installierter Plugins, GitHub-Releases-Store & Entwickler-Leitfaden
// ============================================================================

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { pluginManager } from "../../services/pluginManagerService";
import { InstalledPlugin, CommunityPluginEntry, PluginCategory } from "../../types/pluginTypes";

interface PluginsSettingsTabProps {
  showToast: (msg: string) => void;
}

export const PluginsSettingsTab: React.FC<PluginsSettingsTabProps> = ({ showToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<"installed" | "community">("installed");
  const [installedList, setInstalledList] = useState<InstalledPlugin[]>([]);
  const [communityList, setCommunityList] = useState<CommunityPluginEntry[]>([]);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | "all">("all");
  const [installingIds, setInstallingIds] = useState<Set<string>>(new Set());
  const [isCheckingUpdates, setIsCheckingUpdates] = useState<boolean>(false);
  const [showDeveloperGuide, setShowDeveloperGuide] = useState<boolean>(false);

  // Sync state with Plugin Manager
  const refreshInstalled = () => {
    setInstalledList(pluginManager.getInstalledPlugins());
  };

  useEffect(() => {
    pluginManager.setToastHandler(showToast);
    refreshInstalled();
    const unsubscribe = pluginManager.onPluginChange(() => {
      refreshInstalled();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch Community Plugins on tab switch
  useEffect(() => {
    if (activeSubTab === "community" && communityList.length === 0) {
      setIsLoadingCommunity(true);
      pluginManager.fetchCommunityPlugins()
        .then((items) => {
          setCommunityList(items);
        })
        .finally(() => {
          setIsLoadingCommunity(false);
        });
    }
  }, [activeSubTab]);

  const handleTogglePlugin = async (pluginId: string, currentEnabled: boolean) => {
    if (currentEnabled) {
      await pluginManager.disablePlugin(pluginId);
      showToast(`Plugin deaktiviert.`);
    } else {
      const ok = await pluginManager.enablePlugin(pluginId);
      if (ok) {
        showToast(`Plugin aktiviert & live geladen! ✨`);
      }
    }
    refreshInstalled();
  };

  const handleInstall = async (entry: CommunityPluginEntry) => {
    setInstallingIds((prev) => new Set(prev).add(entry.id));
    const ok = await pluginManager.installPlugin(entry);
    setInstallingIds((prev) => {
      const next = new Set(prev);
      next.delete(entry.id);
      return next;
    });
    if (ok) {
      refreshInstalled();
      setActiveSubTab("installed");
    }
  };

  const handleUninstall = async (pluginId: string, name: string) => {
    if (window.confirm(`Möchtest du das Plugin "${name}" wirklich deinstallieren?`)) {
      await pluginManager.uninstallPlugin(pluginId);
      refreshInstalled();
    }
  };

  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    const count = await pluginManager.checkForUpdates();
    setIsCheckingUpdates(false);
    refreshInstalled();
    if (count > 0) {
      showToast(`🎉 ${count} Plugin-Update(s) gefunden!`);
    } else {
      showToast("✅ Alle installierten Plugins sind auf dem neuesten Stand.");
    }
  };

  const filteredCommunity = communityList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categories: Array<{ id: PluginCategory | "all"; label: string; icon: string }> = [
    { id: "all", label: "Alle Module", icon: "mage:dashboard" },
    { id: "transport", label: "Netzwerk & Transport", icon: "mage:share-2" },
    { id: "audio", label: "Audio & Streams", icon: "mage:music-note" },
    { id: "mesh", label: "Off-Grid & Funk", icon: "mage:radio" },
    { id: "utility", label: "Werkzeuge", icon: "mage:wrench" },
    { id: "theme", label: "Oberfläche & Themes", icon: "mage:paint-brush" }
  ];

  return (
    <div className="settings-tab-content" id="tab-plugins" style={{ paddingBottom: "80px" }}>
      {/* Header & Concept */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
        <div>
          <h3 style={{ margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: "8px", fontSize: "18px" }}>
            <Icon icon="mage:puzzle" style={{ color: "#A855F7" }} />
            Community-Plugins (Obsidian-Architektur)
          </h3>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", maxWidth: "600px", lineHeight: "1.5" }}>
            Modulare Aufsteck-Module nach dem 3-Dateien-Standard (<code>manifest.json</code>, <code>main.js</code>, <code>styles.css</code>).
            Der Quellcode wird dezentral und 100 % kostenlos über <strong>GitHub Releases</strong> bezogen — ohne Zwischenserver oder Tracking.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="settings-btn"
            onClick={handleCheckUpdates}
            disabled={isCheckingUpdates}
            style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}
            title="Prüft GitHub auf neuere Versionen"
          >
            <Icon icon={isCheckingUpdates ? "mage:spinner" : "mage:refresh"} className={isCheckingUpdates ? "spin" : ""} />
            {isCheckingUpdates ? "Prüfe..." : "Updates suchen"}
          </button>
          <button
            className="settings-btn"
            onClick={() => pluginManager.openPluginsFolder()}
            style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}
            title="Öffnet das lokale Verzeichnis ~/.zeno/plugins/"
          >
            <Icon icon="mage:folder" />
            Plugin-Ordner
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveSubTab("installed")}
          style={{
            background: activeSubTab === "installed" ? "rgba(168, 85, 247, 0.15)" : "transparent",
            color: activeSubTab === "installed" ? "#c084fc" : "var(--text-secondary)",
            border: activeSubTab === "installed" ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid transparent",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.15s ease"
          }}
        >
          <Icon icon="mage:box-3d" />
          Installierte Plugins
          <span style={{
            background: "rgba(255,255,255,0.1)",
            padding: "2px 6px",
            borderRadius: "10px",
            fontSize: "10px"
          }}>
            {installedList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("community")}
          style={{
            background: activeSubTab === "community" ? "rgba(168, 85, 247, 0.15)" : "transparent",
            color: activeSubTab === "community" ? "#c084fc" : "var(--text-secondary)",
            border: activeSubTab === "community" ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid transparent",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.15s ease"
          }}
        >
          <Icon icon="mage:compass" />
          Community-Katalog durchsuchen
        </button>
      </div>

      {/* TAB 1: INSTALLIERTE PLUGINS */}
      {activeSubTab === "installed" && (
        <div>
          {installedList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--bg-secondary)", borderRadius: "10px", border: "1px dashed var(--border-color)" }}>
              <Icon icon="mage:puzzle" style={{ fontSize: "36px", color: "var(--text-muted)", marginBottom: "10px" }} />
              <h4 style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>Noch keine Plugins installiert</h4>
              <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "var(--text-muted)" }}>
                Stöbere im Community-Katalog nach Erweiterungen für Matrix, Tor, Audio-Streaming oder LoRa-Funk.
              </p>
              <button
                className="settings-btn primary"
                onClick={() => setActiveSubTab("community")}
                style={{ fontSize: "12px", padding: "8px 16px" }}
              >
                <Icon icon="mage:compass" /> Community-Katalog öffnen
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {installedList.map((plugin) => (
                <div
                  key={plugin.manifest.id}
                  style={{
                    background: "var(--bg-secondary)",
                    border: plugin.enabled ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid var(--border-color)",
                    borderRadius: "10px",
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: plugin.enabled ? "0 4px 15px rgba(168, 85, 247, 0.08)" : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      background: plugin.enabled ? "rgba(168, 85, 247, 0.2)" : "rgba(255,255,255,0.05)",
                      color: plugin.enabled ? "#c084fc" : "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      flexShrink: 0,
                      overflow: "hidden"
                    }}>
                      {plugin.manifest.logoUrl ? (
                        <img 
                          src={plugin.manifest.logoUrl} 
                          alt={plugin.manifest.name} 
                          style={{ width: "28px", height: "28px", objectFit: "contain" }}
                          onError={(e) => { (e.currentTarget.style.display = "none"); }}
                        />
                      ) : (
                        <Icon icon={plugin.manifest.icon || "mage:puzzle"} />
                      )}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>
                          {plugin.manifest.name}
                        </h4>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "4px" }}>
                          v{plugin.manifest.version}
                        </span>
                        {plugin.hasUpdate && (
                          <span style={{ fontSize: "10px", color: "#F59E0B", background: "rgba(245, 158, 11, 0.15)", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
                            Update verfügbar (v{plugin.latestVersion})
                          </span>
                        )}
                        <span style={{
                          fontSize: "10px",
                          fontWeight: "600",
                          color: plugin.enabled ? "#10B981" : "var(--text-muted)",
                          background: plugin.enabled ? "rgba(16, 185, 129, 0.1)" : "rgba(255,255,255,0.05)",
                          padding: "2px 6px",
                          borderRadius: "4px"
                        }}>
                          {plugin.enabled ? "● Aktiv" : "○ Deaktiviert"}
                        </span>
                      </div>

                      <p style={{ margin: "0 0 8px 0", fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4", maxWidth: "560px" }}>
                        {plugin.manifest.description}
                      </p>

                      <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "10px", color: "var(--text-muted)" }}>
                        <span>von <strong>{plugin.manifest.author}</strong></span>
                        <a
                          href={`https://github.com/${plugin.manifest.repo}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <Icon icon="mage:github-circle" /> GitHub Repo
                        </a>
                        {plugin.manifest.permissions && plugin.manifest.permissions.length > 0 && (
                          <span>Rechte: {plugin.manifest.permissions.join(", ")}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Live Toggle */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                      className="settings-btn"
                      onClick={() => handleUninstall(plugin.manifest.id, plugin.manifest.name)}
                      style={{ fontSize: "11px", padding: "6px 10px", color: "#EF4444" }}
                      title="Plugin deinstallieren"
                    >
                      <Icon icon="mage:trash" />
                    </button>

                    {/* Toggle Switch */}
                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer", position: "relative" }}>
                      <input
                        type="checkbox"
                        checked={plugin.enabled}
                        onChange={() => handleTogglePlugin(plugin.manifest.id, plugin.enabled)}
                        style={{ display: "none" }}
                      />
                      <div style={{
                        width: "42px",
                        height: "22px",
                        borderRadius: "12px",
                        background: plugin.enabled ? "#A855F7" : "rgba(255,255,255,0.15)",
                        transition: "background 0.2s ease",
                        position: "relative"
                      }}>
                        <div style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          background: "#ffffff",
                          position: "absolute",
                          top: "3px",
                          left: plugin.enabled ? "23px" : "3px",
                          transition: "left 0.2s ease",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
                        }} />
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMMUNITY-KATALOG */}
      {activeSubTab === "community" && (
        <div>
          {/* Filter & Search Bar */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
              <Icon icon="mage:search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Plugins suchen (z.B. Matrix, Spotify, LoRa, Tor, Theme)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "8px 12px 8px 36px",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* Category Chips */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "18px", overflowX: "auto", paddingBottom: "4px" }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  background: selectedCategory === cat.id ? "rgba(168, 85, 247, 0.2)" : "var(--bg-secondary)",
                  color: selectedCategory === cat.id ? "#c084fc" : "var(--text-muted)",
                  border: selectedCategory === cat.id ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid var(--border-color)",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease"
                }}
              >
                <Icon icon={cat.icon} />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Community Plugins Grid */}
          {isLoadingCommunity ? (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
              <Icon icon="mage:spinner" className="spin" style={{ fontSize: "24px" }} />
              <p style={{ marginTop: "8px", fontSize: "12px" }}>Lade Community-Registry von GitHub...</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {filteredCommunity.map((entry) => {
                const isInstalled = installedList.some((p) => p.manifest.id === entry.id);
                const isInstalling = installingIds.has(entry.id);

                return (
                  <div
                    key={entry.id}
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "10px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            background: "rgba(168, 85, 247, 0.15)",
                            color: "#c084fc",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                            overflow: "hidden"
                          }}>
                            {entry.logoUrl ? (
                              <img 
                                src={entry.logoUrl} 
                                alt={entry.name} 
                                style={{ width: "24px", height: "24px", objectFit: "contain" }}
                                onError={(e) => { (e.currentTarget.style.display = "none"); }}
                              />
                            ) : (
                              <Icon icon={entry.icon} />
                            )}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>
                              {entry.name}
                            </h4>
                            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                              von {entry.author} • v{entry.version}
                            </span>
                          </div>
                        </div>

                        {entry.verified && (
                          <span style={{ fontSize: "9px", color: "#10B981", background: "rgba(16, 185, 129, 0.1)", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
                            ✓ Verifiziert
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "8px 0 12px 0", lineHeight: "1.4" }}>
                        {entry.description}
                      </p>

                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                        {entry.tags?.map((t) => (
                          <span key={t} style={{ fontSize: "9px", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px", color: "var(--text-muted)" }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "4px" }}>
                      <a
                        href={`https://github.com/${entry.repo}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: "11px", color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <Icon icon="mage:github-circle" /> GitHub ★ {entry.stars || 42}
                      </a>

                      {isInstalled ? (
                        <span style={{ fontSize: "11px", color: "#10B981", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Icon icon="mage:check" /> Installiert
                        </span>
                      ) : (
                        <button
                          className="settings-btn primary"
                          onClick={() => handleInstall(entry)}
                          disabled={isInstalling}
                          style={{ fontSize: "11px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px" }}
                        >
                          <Icon icon={isInstalling ? "mage:spinner" : "mage:download"} className={isInstalling ? "spin" : ""} />
                          {isInstalling ? "Lade Release..." : "Installieren"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DEVELOPER SECTION COLLAPSIBLE */}
      <div style={{ marginTop: "30px", background: "var(--bg-secondary)", borderRadius: "10px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
        <button
          onClick={() => setShowDeveloperGuide(!showDeveloperGuide)}
          style={{
            width: "100%",
            padding: "14px 18px",
            background: "transparent",
            border: "none",
            color: "var(--text-primary)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "600"
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Icon icon="mage:code" style={{ color: "#38BDF8" }} />
            Eigenes Plugin entwickeln (Der 3-Dateien-Standard)
          </span>
          <Icon icon={showDeveloperGuide ? "mage:chevron-up" : "mage:chevron-down"} />
        </button>

        {showDeveloperGuide && (
          <div style={{ padding: "0 18px 18px 18px", borderTop: "1px solid var(--border-color)", fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
            <p style={{ marginTop: "14px" }}>
              Zeno-Plugins folgen exakt dem 100 % kostenlosen Architektur-Modell von Obsidian. 
              Um ein Plugin zu veröffentlichen, erstelle ein öffentliches GitHub-Repository mit folgenden drei Dateien im Root-Verzeichnis:
            </p>
            <ol style={{ paddingLeft: "20px" }}>
              <li>
                <strong>manifest.json</strong>: Enthält Metadaten (<code>id</code>, <code>name</code>, <code>version</code>, <code>repo</code>, <code>permissions</code>).
              </li>
              <li>
                <strong>main.js</strong> (oder <code>plugin.wasm</code>): Exportiert standardmäßig ein Objekt mit <code>onload(api)</code> und <code>onunload()</code>.
              </li>
              <li>
                <strong>styles.css</strong>: Optionale CSS-Klassen, die beim Aktivieren automatisch injiziert und beim Deaktivieren restlos entfernt werden.
              </li>
            </ol>
            <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "6px", fontFamily: "monospace", fontSize: "10px" }}>
              {`// Beispiel: main.js
export default {
  onload(api) {
    api.registerCommand({ name: "/hello", execute: () => api.showNotice("Hallo aus dem Plugin!") });
  },
  onunload() {
    console.log("Aufgeräumt!");
  }
};`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
