import React, { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { Server } from "../../types";
import {
  CURATED_INSTANCES,
  InstanceDirectoryEntry,
  directoryEntryToServer
} from "../../data/instanceCatalogData";
import { resolveRawManifestUrl, manifestToServer } from "../../utils/gitManifestHelper";

interface InstanceBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  servers: Server[];
  onJoinServer: (server: Server) => void;
  showToast: (msg: string) => void;
}

export const InstanceBrowserModal: React.FC<InstanceBrowserModalProps> = ({
  isOpen,
  onClose,
  servers,
  onJoinServer,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Alle");
  const [customRepoUrl, setCustomRepoUrl] = useState("");
  const [isImportingCustom, setIsImportingCustom] = useState(false);
  const [showCustomImport, setShowCustomImport] = useState(false);

  const categories = [
    "Alle",
    "Core & Privacy",
    "Entwicklung",
    "Privacy & Tor",
    "FOSS & Linux",
    "Gaming & Voice"
  ];

  // Filter instances by category and search query
  const filteredInstances = useMemo(() => {
    return CURATED_INSTANCES.filter((inst) => {
      const matchesCategory =
        selectedCategory === "Alle" || inst.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inst.name.toLowerCase().includes(q) ||
        inst.description.toLowerCase().includes(q) ||
        inst.tags.some((t) => t.toLowerCase().includes(q)) ||
        inst.gitRepo.repoUrl.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const isServerJoined = (instId: string, instName: string) => {
    return servers.some((s) => s.id === instId || s.name === instName);
  };

  const handleJoinCurated = (entry: InstanceDirectoryEntry) => {
    if (isServerJoined(entry.id, entry.name)) {
      showToast(`Du bist der Instanz "${entry.name}" bereits beigetreten.`);
      return;
    }
    const newServer = directoryEntryToServer(entry);
    onJoinServer(newServer);
    showToast(`🎉 Erfolgreich der dezentralen Instanz "${entry.name}" beigetreten!`);
  };

  const handleImportCustom = async () => {
    if (!customRepoUrl.trim()) {
      showToast("Bitte gib eine gültige Git-Repository-URL ein.");
      return;
    }

    setIsImportingCustom(true);
    showToast("Suche nach zeno-server.json Manifest...");

    try {
      const rawUrl = resolveRawManifestUrl(customRepoUrl, "github");
      const resp = await fetch(rawUrl);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: Datei zeno-server.json nicht gefunden.`);
      }

      const manifest = await resp.json();
      const importedServer = manifestToServer(manifest, rawUrl);
      importedServer.gitRepo = {
        provider: customRepoUrl.includes("gitlab")
          ? "gitlab"
          : customRepoUrl.includes("codeberg")
          ? "gitea"
          : "github",
        repoUrl: customRepoUrl,
        branch: "main",
        manifestPath: "zeno-server.json",
        rawManifestUrl: rawUrl,
        autoSync: true
      };

      onJoinServer(importedServer);
      showToast(`✨ Instanz "${importedServer.name}" aus Git erfolgreich importiert!`);
      setCustomRepoUrl("");
      setShowCustomImport(false);
    } catch (err: any) {
      console.warn("[Instance Browser] Konnte Manifest nicht laden:", err);
      showToast(`Fehler: ${err.message || "Manifest konnte nicht geladen werden"}`);
    } finally {
      setIsImportingCustom(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay open"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
    >
      <div
        style={{
          background: "var(--bg-primary, #18191B)",
          width: "920px",
          maxWidth: "95vw",
          height: "85vh",
          borderRadius: "14px",
          border: "1px solid var(--border-color, #3B4048)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0,0,0,0.75)",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-color, #3B4048)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--bg-secondary, #1E222D)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "rgba(53, 116, 240, 0.15)",
                color: "#3574F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px"
              }}
            >
              <Icon icon="mage:compass" />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--text-primary, #E3E4E8)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                Zeno Instanzen-Browser
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    background: "rgba(0, 255, 135, 0.12)",
                    color: "#00FF87",
                    padding: "2px 8px",
                    borderRadius: "6px"
                  }}
                >
                  Git-Dezentralisiert
                </span>
              </h2>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "12px",
                  color: "var(--text-muted, #9DA5B4)"
                }}
              >
                Entdecke öffentliche Zeno-Server oder verbinde deine eigene Git-Instanz via zeno-server.json.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setShowCustomImport(!showCustomImport)}
              style={{
                background: showCustomImport ? "var(--accent-primary, #3574F0)" : "rgba(255,255,255,0.06)",
                border: "1px solid var(--border-color, #3B4048)",
                color: "#E3E4E8",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
            >
              <Icon icon="mage:git-commit" />
              {showCustomImport ? "Katalog anzeigen" : "Git-URL importieren"}
            </button>
            <button
              className="editor-close-btn modal-close"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted, #9DA5B4)",
                cursor: "pointer",
                fontSize: "22px",
                padding: "6px",
                display: "flex",
                alignItems: "center"
              }}
            >
              <Icon icon="mage:multiply" />
            </button>
          </div>
        </header>

        {/* Custom Git Import Bar (Collapsible) */}
        {showCustomImport && (
          <div
            style={{
              padding: "16px 24px",
              background: "rgba(53, 116, 240, 0.08)",
              borderBottom: "1px solid var(--border-color, #3B4048)",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#3574F0", display: "flex", alignItems: "center", gap: "6px" }}>
              <Icon icon="mage:globe" />
              Beliebige Git-Instanz direkt verbinden:
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={customRepoUrl}
                onChange={(e) => setCustomRepoUrl(e.target.value)}
                placeholder="https://github.com/dein-team/unser-zeno-server (mit zeno-server.json)"
                style={{
                  flex: 1,
                  background: "var(--bg-primary, #18191B)",
                  border: "1px solid var(--border-color, #3B4048)",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  color: "#E3E4E8",
                  fontSize: "13px",
                  outline: "none"
                }}
                onKeyDown={(e) => e.key === "Enter" && handleImportCustom()}
              />
              <button
                onClick={handleImportCustom}
                disabled={isImportingCustom}
                style={{
                  background: "#00FF87",
                  color: "#0F1411",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 18px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: isImportingCustom ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: isImportingCustom ? 0.7 : 1
                }}
              >
                {isImportingCustom ? (
                  <>
                    <Icon icon="mage:spinner" className="spin" /> Importiere...
                  </>
                ) : (
                  <>
                    <Icon icon="mage:plus" /> Instanz beitreten
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Filter and Search Controls */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border-color, #3B4048)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            background: "var(--bg-primary, #18191B)"
          }}
        >
          {/* Category Tabs */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: selectedCategory === cat ? 700 : 500,
                  background:
                    selectedCategory === cat
                      ? "var(--accent-primary, #3574F0)"
                      : "rgba(255,255,255,0.05)",
                  color: selectedCategory === cat ? "#ffffff" : "var(--text-secondary, #B0B5C1)",
                  border: "1px solid",
                  borderColor:
                    selectedCategory === cat ? "#3574F0" : "var(--border-color, #3B4048)",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div
            style={{
              position: "relative",
              minWidth: "240px",
              flex: "1 1 240px",
              maxWidth: "340px"
            }}
          >
            <Icon
              icon="mage:search"
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted, #9DA5B4)",
                fontSize: "16px"
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Instanz, Tags oder Themen suchen..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "var(--bg-secondary, #1E222D)",
                border: "1px solid var(--border-color, #3B4048)",
                borderRadius: "8px",
                padding: "8px 12px 8px 34px",
                color: "#E3E4E8",
                fontSize: "12px",
                outline: "none"
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted, #9DA5B4)",
                  cursor: "pointer",
                  padding: "4px"
                }}
              >
                <Icon icon="mage:multiply" />
              </button>
            )}
          </div>
        </div>

        {/* Server Instances Grid */}
        <div
          style={{
            padding: "20px 24px",
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
            gap: "16px",
            flex: 1,
            alignContent: "start"
          }}
        >
          {filteredInstances.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "40px",
                textAlign: "center",
                color: "var(--text-muted, #9DA5B4)"
              }}
            >
              <Icon icon="mage:search-empty" style={{ fontSize: "40px", marginBottom: "12px" }} />
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
                Keine Instanzen für "{searchQuery}" in Kategorie "{selectedCategory}" gefunden.
              </p>
              <p style={{ margin: "6px 0 0 0", fontSize: "12px" }}>
                Du kannst jede beliebige Git-Instanz über die "Git-URL importieren" Schaltfläche manuell einbinden.
              </p>
            </div>
          ) : (
            filteredInstances.map((inst) => {
              const joined = isServerJoined(inst.id, inst.name);
              const totalChannels = inst.sampleCategories.reduce(
                (sum, c) => sum + c.channelNames.length,
                0
              );

              return (
                <div
                  key={inst.id}
                  style={{
                    background: "var(--bg-secondary, #1E222D)",
                    border: "1px solid var(--border-color, #3B4048)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
                    transition: "transform 0.15s ease, border-color 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#3574F0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color, #3B4048)";
                  }}
                >
                  {/* Card Banner Header */}
                  <div
                    style={{
                      height: "64px",
                      background: inst.bannerGradient,
                      position: "relative",
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "space-between"
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-20px",
                        left: "16px",
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        background: "#18191B",
                        border: "3px solid #1E222D",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.5)"
                      }}
                    >
                      {inst.icon}
                    </div>

                    <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
                      {inst.isOfficial && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            background: "rgba(0, 255, 135, 0.9)",
                            color: "#0F1411",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.4)"
                          }}
                        >
                          OFFIZIELL
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          background: "rgba(0, 0, 0, 0.6)",
                          color: "#E3E4E8",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          backdropFilter: "blur(4px)"
                        }}
                      >
                        {inst.category}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div
                    style={{
                      padding: "28px 16px 14px 16px",
                      flex: 1,
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "var(--text-primary, #E3E4E8)"
                        }}
                      >
                        {inst.name}
                      </h3>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted, #9DA5B4)",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <Icon icon="mage:users" /> {inst.memberCount.toLocaleString()}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: "8px 0 12px 0",
                        fontSize: "12px",
                        lineHeight: "1.4",
                        color: "var(--text-secondary, #B0B5C1)",
                        flex: 1
                      }}
                    >
                      {inst.description}
                    </p>

                    {/* Tags */}
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        flexWrap: "wrap",
                        marginBottom: "12px"
                      }}
                    >
                      {inst.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: "10px",
                            color: "var(--text-muted, #9DA5B4)",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            padding: "2px 6px",
                            borderRadius: "4px"
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Metadata Preview */}
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted, #9DA5B4)",
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderTop: "1px solid var(--border-color, #3B4048)",
                        marginBottom: "10px"
                      }}
                    >
                      <span>
                        <Icon icon="mage:hash" style={{ verticalAlign: "middle" }} /> {totalChannels} Kanäle ({inst.sampleCategories.length} Kat.)
                      </span>
                      <span>
                        <Icon icon="mage:wifi" style={{ verticalAlign: "middle" }} /> {inst.relays.length} Relays (Nostr/E2EE)
                      </span>
                    </div>

                    {/* Card Actions */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px"
                      }}
                    >
                      <a
                        href={inst.gitRepo.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Git Repository aufrufen"
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted, #9DA5B4)",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 8px",
                          borderRadius: "6px",
                          background: "rgba(255,255,255,0.03)"
                        }}
                      >
                        <Icon icon="mage:github-circle" /> Manifest
                      </a>

                      <button
                        onClick={() => handleJoinCurated(inst)}
                        disabled={joined}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: joined ? "default" : "pointer",
                          background: joined
                            ? "rgba(0, 255, 135, 0.12)"
                            : "var(--accent-primary, #3574F0)",
                          color: joined ? "#00FF87" : "#ffffff",
                          border: joined ? "1px solid #00FF87" : "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.15s ease"
                        }}
                      >
                        {joined ? (
                          <>
                            <Icon icon="mage:check" /> Beigetreten
                          </>
                        ) : (
                          <>
                            <Icon icon="mage:plus" /> Instanz beitreten
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <footer
          style={{
            padding: "14px 24px",
            borderTop: "1px solid var(--border-color, #3B4048)",
            background: "var(--bg-secondary, #1E222D)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-muted, #9DA5B4)",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Icon icon="mage:shield-check" style={{ color: "#00FF87" }} />
            Alle Instanzen synchronisieren sich rein dezentral über Git-Commits und E2EE-Relays. Kein zentraler Login erforderlich.
          </div>
          <button
            className="settings-btn"
            onClick={onClose}
            style={{
              fontSize: "12px",
              padding: "6px 16px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid var(--border-color, #3B4048)",
              color: "#E3E4E8",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Schließen
          </button>
        </footer>
      </div>
    </div>
  );
};
