import React from "react";
import { Icon } from "@iconify/react";
import { HubRuntimeItem } from "../../types";

interface WasmHubProps {
  hubCatalog: HubRuntimeItem[];
  wasmHubSearchQuery: string;
  wasmHubFilter: "all" | "community" | "wapm" | "installed";
  editorRuntimes: Record<string, "installed" | "not_installed" | "installing">;
  setIsCustomWasmModalOpen: (open: boolean) => void;
  setWasmHubSearchQuery: (query: string) => void;
  setWasmHubFilter: (filter: "all" | "community" | "wapm" | "installed") => void;
  setEditorFilename: (name: string) => void;
  setEditorLanguage: (lang: string) => void;
  setEditorCode: (code: string) => void;
  setEditorWorkflowStep: (step: any) => void;
  setEditorOutput: (out: string) => void;
  setIsEditorOpen: (open: boolean) => void;
  handleInstallRuntime: (langKey: string) => void;
  showToast: (msg: string) => void;
}

export const WasmHub: React.FC<WasmHubProps> = ({
  hubCatalog,
  wasmHubSearchQuery,
  wasmHubFilter,
  editorRuntimes,
  setIsCustomWasmModalOpen,
  setWasmHubSearchQuery,
  setWasmHubFilter,
  setEditorFilename,
  setEditorLanguage,
  setEditorCode,
  setEditorWorkflowStep,
  setEditorOutput,
  setIsEditorOpen,
  handleInstallRuntime,
  showToast
}) => {
  return (
    <div className="wasm-hub-view">
      <header className="wasm-hub-header">
        <div className="wasm-hub-title-area">
          <h2>
            <Icon icon="mage:box-3d" style={{ color: "var(--accent-color)" }} />
            ⚡ Zeno WASM Runtime Hub & Marketplace
          </h2>
          <p>Lade isolierte WebAssembly-Laufzeiten (WASI) von WAPM & dem Zeno Community Index herunter.</p>
        </div>

        <button
          className="settings-btn primary"
          onClick={() => setIsCustomWasmModalOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "8px 14px" }}
        >
          <Icon icon="mage:plus" /> Eigene WASM-URL Hinzufügen
        </button>
      </header>

      {/* Toolbar / Search & Filter */}
      <div className="wasm-hub-toolbar">
        <div className="wasm-hub-search-wrapper">
          <Icon icon="mage:search" style={{ color: "var(--text-muted)", fontSize: "14px" }} />
          <input
            type="text"
            className="wasm-hub-search-input"
            placeholder="Laufzeit suchen (z.B. Go, Ruby, Perl, SQLite, #scripting)..."
            value={wasmHubSearchQuery}
            onChange={(e) => setWasmHubSearchQuery(e.target.value)}
          />
          {wasmHubSearchQuery && (
            <button
              onClick={() => setWasmHubSearchQuery("")}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            >
              <Icon icon="mage:multiply" />
            </button>
          )}
        </div>

        <div className="wasm-hub-filter-tabs">
          <button
            className={`wasm-hub-filter-btn ${wasmHubFilter === "all" ? "active" : ""}`}
            onClick={() => setWasmHubFilter("all")}
          >
            Alle Runtimes ({hubCatalog.length})
          </button>
          <button
            className={`wasm-hub-filter-btn ${wasmHubFilter === "community" ? "active" : ""}`}
            onClick={() => setWasmHubFilter("community")}
          >
            ⭐ Zeno Community Index
          </button>
          <button
            className={`wasm-hub-filter-btn ${wasmHubFilter === "wapm" ? "active" : ""}`}
            onClick={() => setWasmHubFilter("wapm")}
          >
            📦 WAPM Registry
          </button>
          <button
            className={`wasm-hub-filter-btn ${wasmHubFilter === "installed" ? "active" : ""}`}
            onClick={() => setWasmHubFilter("installed")}
          >
            ✅ Installiert
          </button>
        </div>
      </div>

      {/* WASM Runtime Cards Grid */}
      <div className="wasm-hub-grid">
        {hubCatalog.filter((item) => {
          if (wasmHubFilter === "community" && item.provider !== "Zeno Community Index") return false;
          if (wasmHubFilter === "wapm" && item.provider !== "WAPM Registry") return false;
          if (wasmHubFilter === "installed" && editorRuntimes[item.langKey] !== "installed") return false;

          if (wasmHubSearchQuery.trim()) {
            const q = wasmHubSearchQuery.toLowerCase();
            const matchesName = item.name.toLowerCase().includes(q);
            const matchesDesc = item.description.toLowerCase().includes(q);
            const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));
            const matchesProvider = item.provider.toLowerCase().includes(q);
            return matchesName || matchesDesc || matchesTags || matchesProvider;
          }

          return true;
        }).map((item) => {
          const runtimeStatus = editorRuntimes[item.langKey] || "not_installed";

          return (
            <div key={item.id} className="wasm-hub-card">
              <div className="wasm-card-top">
                <div className="wasm-card-icon-title">
                  <Icon icon={item.icon} className="wasm-card-icon" />
                  <div>
                    <h3 className="wasm-card-name">{item.name}</h3>
                    <span className="wasm-card-version">{item.version} • {item.size}</span>
                  </div>
                </div>
                <span
                  className="wasm-card-provider-badge"
                  style={{
                    backgroundColor: `${item.badgeColor}18`,
                    color: item.badgeColor,
                    border: `1px solid ${item.badgeColor}33`
                  }}
                >
                  {item.providerIcon} {item.provider}
                </span>
              </div>

              <p className="wasm-card-desc">{item.description}</p>

              <div className="wasm-card-tags">
                {item.tags.map((t) => (
                  <span key={t} className="wasm-tag">{t}</span>
                ))}
              </div>

              <div className="wasm-card-actions">
                {runtimeStatus === "installed" ? (
                  <>
                    <span style={{ fontSize: "11px", color: "#59A869", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Icon icon="mage:check-circle" /> Bereit & Gecacht
                    </span>
                    <button
                      className="settings-btn primary"
                      onClick={() => {
                        setEditorFilename(item.sampleFile);
                        setEditorLanguage(item.langKey);
                        setEditorCode(item.sampleCode);
                        setEditorWorkflowStep("editor");
                        setEditorOutput("");
                        setIsEditorOpen(true);
                        showToast(`Monaco-Editor für ${item.name} geöffnet!`);
                      }}
                      style={{ fontSize: "11px", padding: "4px 10px" }}
                    >
                      🚀 Ausprobieren
                    </button>
                  </>
                ) : runtimeStatus === "installing" ? (
                  <span style={{ fontSize: "11px", color: "#FFC66D", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Icon icon="mage:spinner-round" className="spin" /> WASM Download läuft...
                  </span>
                ) : (
                  <>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      🛡️ WASI Isolated
                    </span>
                    <button
                      className="settings-btn"
                      onClick={() => handleInstallRuntime(item.langKey)}
                      style={{ fontSize: "11px", padding: "4px 10px", color: "var(--accent-color)" }}
                    >
                      <Icon icon="mage:download" style={{ marginRight: "4px" }} /> Download & Cachen
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
