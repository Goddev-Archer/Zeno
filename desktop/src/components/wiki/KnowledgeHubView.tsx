// ============================================================================
//   ZENO KNOWLEDGE HUB & SECURITY WIKI VIEW
//   Architektur- & Sicherheitsleitfäden für dezentrale Relays, Tor, Nostr, 
//   Cloudflare Blind Relays, Art. 10 GG Konformität und Krypto-Privatsphäre.
// ============================================================================

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { ZENO_WIKI_GUIDES } from "../../data/wikiGuides";
import { MarkdownReader } from "../common/MarkdownReader";

interface KnowledgeHubViewProps {
  showToast: (msg: string) => void;
}

export const KnowledgeHubView: React.FC<KnowledgeHubViewProps> = ({ showToast }) => {
  const [selectedWikiId, setSelectedWikiId] = useState<string>("cloudflare-relay-builder");
  const [wikiSearch, setWikiSearch] = useState<string>("");

  const filteredGuides = ZENO_WIKI_GUIDES.filter((g) =>
    g.title.toLowerCase().includes(wikiSearch.toLowerCase()) ||
    g.summary.toLowerCase().includes(wikiSearch.toLowerCase()) ||
    g.category.toLowerCase().includes(wikiSearch.toLowerCase())
  );

  const activeGuide = ZENO_WIKI_GUIDES.find((g) => g.id === selectedWikiId) || ZENO_WIKI_GUIDES[0];

  return (
    <div
      className="zeno-knowledge-hub-view"
      style={{
        padding: "20px 24px 60px 24px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        color: "var(--text-primary)"
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          padding: "18px 20px"
        }}
      >
        <div>
          <h2
            style={{
              margin: "0 0 6px 0",
              fontSize: "20px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--text-primary)"
            }}
          >
            <Icon icon="mage:book" style={{ color: "#38BDF8" }} />
            Knowledge Hub &amp; Security Wiki
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", maxWidth: "680px", lineHeight: "1.5" }}>
            Integrierte Architektur- und Sicherheitsleitfäden für dezentrale Blind-Relays, Tor-Onion-Routing, Nostr,
            Cloudflare Workers und grundgesetzkonforme Ende-zu-Ende-Verschlüsselung (Art. 10 GG).
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Wiki durchsuchen (z. B. Cloudflare, Nostr, Tor, PGP, Grundrechte, E2EE)..."
          value={wikiSearch}
          onChange={(e) => setWikiSearch(e.target.value)}
          style={{
            width: "100%",
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 14px 10px 38px",
            fontSize: "13px",
            color: "var(--text-primary)",
            outline: "none",
            boxSizing: "border-box"
          }}
        />
        <Icon
          icon="mage:search"
          style={{ position: "absolute", left: "14px", top: "12px", color: "var(--text-muted)", fontSize: "16px" }}
        />
      </div>

      {/* 2-Column Layout: Index Cards (Left) & Markdown Reader (Right) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: "18px",
          minHeight: "540px",
          alignItems: "start"
        }}
      >
        {/* Left Column: Guide Cards List */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            maxHeight: "calc(100vh - 240px)",
            overflowY: "auto",
            paddingRight: "4px"
          }}
        >
          {filteredGuides.map((guide) => {
            const isSelected = selectedWikiId === guide.id;
            return (
              <button
                key={guide.id}
                type="button"
                onClick={() => setSelectedWikiId(guide.id)}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: isSelected ? `1px solid ${guide.badgeColor}` : "1px solid var(--border-color)",
                  backgroundColor: isSelected ? `${guide.badgeColor}18` : "var(--bg-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: "700", color: "var(--text-muted)" }}>
                    {guide.category}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "600",
                      padding: "1px 7px",
                      borderRadius: "10px",
                      backgroundColor: `${guide.badgeColor}22`,
                      color: guide.badgeColor
                    }}
                  >
                    {guide.badge}
                  </span>
                </div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: isSelected ? "var(--text-primary)" : "var(--text-secondary, #cbd5e1)" }}>
                  {guide.title}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {guide.summary}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Markdown Reader View */}
        <div
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "20px 24px",
            maxHeight: "calc(100vh - 240px)",
            overflowY: "auto",
            boxSizing: "border-box"
          }}
        >
          {activeGuide && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Quick Actions if Cloudflare Builder */}
              {activeGuide.id === "cloudflare-relay-builder" && (
                <div
                  style={{
                    padding: "14px 18px",
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#F59E0B" }}>
                      ⚡ Interaktiver 1-Klick Relay Assistent
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Kopiere den fertigen Blind-Relay Worker-Code oder die Wrangler-Deploy-Befehle direkt in die Zwischenablage.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        const workerCode = `export default {
  async fetch(request, env) {
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("⚡ Zeno Blind Relay running. Connect via WebSocket (wss://).", { status: 200 });
    }
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    server.accept();
    server.addEventListener("message", (event) => { server.send(event.data); });
    return new Response(null, { status: 101, webSocket: client });
  },
};`;
                        navigator.clipboard.writeText(workerCode);
                        showToast("Cloudflare Worker Code kopiert! 📋");
                      }}
                      style={{
                        backgroundColor: "#F59E0B",
                        color: "#08090C",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px"
                      }}
                    >
                      <Icon icon="mage:copy" /> Worker-Code kopieren
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cmd = "npm i -g wrangler && wrangler login && wrangler deploy relay-worker.js --name zeno-relay";
                        navigator.clipboard.writeText(cmd);
                        showToast("Wrangler CLI Deploy-Befehle kopiert! 💻");
                      }}
                      style={{
                        backgroundColor: "var(--bg-tertiary)",
                        color: "#38BDF8",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px"
                      }}
                    >
                      <Icon icon="mage:terminal" /> CLI-Befehle kopieren
                    </button>
                  </div>
                </div>
              )}

              <MarkdownReader
                content={activeGuide.markdown}
                title={activeGuide.title}
                badge={activeGuide.badge}
                badgeColor={activeGuide.badgeColor}
                showCopyAll={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

