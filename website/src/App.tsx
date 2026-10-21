import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { ZenoLogo } from "./ZenoLogo";
import "./App.css";

interface ReleaseInfo {
  tagName: string;
  downloadUrl: string;
  assetName: string;
  assetSize: string;
  isDynamic: boolean;
}

const DEFAULT_RELEASE: ReleaseInfo = {
  tagName: "v0.2.1-alpha",
  downloadUrl: "https://github.com/Goddev-Archer/Zeno/releases/download/v0.2.1-alpha/zeno-v0.2.1-alpha-windows-x64-portable.zip",
  assetName: "zeno-v0.2.1-alpha-windows-x64-portable.zip",
  assetSize: "ca. 68 MB",
  isDynamic: false,
};

export const App: React.FC = () => {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeMockServer, setActiveMockServer] = useState<string>("zeno");
  const [mockPatched, setMockPatched] = useState<boolean>(false);
  const [release, setRelease] = useState<ReleaseInfo>(DEFAULT_RELEASE);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Dynamically resolve the latest Alpha Release from GitHub
  useEffect(() => {
    let isMounted = true;
    const fetchLatestAlpha = async () => {
      try {
        const res = await fetch("https://api.github.com/repos/Goddev-Archer/Zeno/releases", {
          headers: { Accept: "application/vnd.github.v3+json" }
        });
        if (!res.ok) return;

        const releases = await res.json();
        if (!Array.isArray(releases) || releases.length === 0) return;

        // Pick latest non-draft release (pre-releases / alphas are explicitly included)
        const latest = releases.find((r: any) => !r.draft) || releases[0];
        if (!latest) return;

        const tag = latest.tag_name || "v0.2.1-alpha";
        let downloadUrl = `https://github.com/Goddev-Archer/Zeno/releases/download/${tag}/zeno-${tag}-windows-x64-portable.zip`;
        let assetName = `zeno-${tag}-windows-x64-portable.zip`;
        let assetSize = "ca. 68 MB";

        if (Array.isArray(latest.assets) && latest.assets.length > 0) {
          // Prefer Windows portable .zip asset
          const zipAsset = latest.assets.find((a: any) =>
            typeof a.name === "string" && a.name.endsWith(".zip") && (a.name.toLowerCase().includes("windows") || a.name.toLowerCase().includes("win"))
          ) || latest.assets.find((a: any) =>
            typeof a.name === "string" && a.name.endsWith(".zip")
          ) || latest.assets.find((a: any) =>
            typeof a.name === "string" && a.name.endsWith(".exe")
          ) || latest.assets[0];

          if (zipAsset) {
            downloadUrl = zipAsset.browser_download_url;
            assetName = zipAsset.name;
            if (zipAsset.size) {
              assetSize = `${(zipAsset.size / (1024 * 1024)).toFixed(1)} MB`;
            }
          }
        }

        if (isMounted) {
          setRelease({
            tagName: tag,
            downloadUrl,
            assetName,
            assetSize,
            isDynamic: true,
          });
        }
      } catch {
        // Fallback silently to DEFAULT_RELEASE
      }
    };

    fetchLatestAlpha();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="zeno-website-root">
      {/* ═══════════════════════════════════════════════════════════════
           1. FLOATING NAVBAR
           ═══════════════════════════════════════════════════════════════ */}
      <header className="floating-navbar-container">
        <nav className="floating-navbar">
          <a href="#" className="nav-brand" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ZenoLogo size={28} withFrame colorMode="brand" />
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, letterSpacing: "0.12em", fontSize: "16px" }}>
              ZENO
            </span>
          </a>

          <div className="nav-links">
            <a href="#instances" className="nav-link">Zeno-Instances</a>
            <a href="#in-chat-ide" className="nav-link">In-Chat IDE</a>
            <a href="#zero-knowledge" className="nav-link">Zero-Knowledge & Argon2id</a>
            <a href="#plugins" className="nav-link">Plugins & Packet Radio</a>
            <a href="#downloads" className="nav-link">Download</a>
          </div>

          <div className="nav-actions">
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === "dark" ? "Zu 'Warm Parchment' Light-Theme wechseln" : "Zu 'Carbon & Oxide' Dark-Theme wechseln"}
            >
              <Icon icon={theme === "dark" ? "mage:sun" : "mage:moon"} />
            </button>

            <a
              href="https://github.com/Goddev-Archer/Zeno"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-github-btn"
            >
              <Icon icon="mdi:github" style={{ fontSize: "16px" }} />
              <span>GitHub</span>
            </a>
          </div>
        </nav>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
           2. HERO SECTION
           ═══════════════════════════════════════════════════════════════ */}
      <section className="hero-section">
        <div className="hero-pill-badge">
          <span className="pulse-dot" />
          <span>Zero-Knowledge & Decentralized Developer Workspace</span>
          <span className="text-oxide">{release.tagName}</span>
        </div>

        <h1 className="hero-title">
          Die datenschutzorientierte, extrem leichtgewichtige{" "}
          <span className="gradient-text">Entwickler-Alternative</span> zu Discord.
        </h1>

        <p className="hero-subtitle">
          Ende-zu-Ende-verschlüsselt, ohne speichernde Zentral-Server. Mit integriertem Monaco-Editor, 
          P2P-Mesh, Argon2id und minimalem RAM-Footprint von nur ~64 MB dank Rust &amp; Tauri v2.
        </p>

        <div className="hero-cta-group">
          <a
            href={release.downloadUrl}
            className="btn-primary-download"
            title={`Zeno ${release.tagName} direkt herunterladen (${release.assetName})`}
          >
            <Icon icon="mage:download" style={{ fontSize: "18px" }} />
            <span>Zeno {release.tagName} herunterladen (.zip)</span>
          </a>

          <a
            href="https://github.com/Goddev-Archer/Zeno"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary-gh"
          >
            <Icon icon="mdi:github" style={{ fontSize: "18px" }} />
            <span>Quellcode auf GitHub</span>
          </a>
        </div>

        <div className="hero-platform-specs">
          <span><Icon icon="mdi:microsoft-windows" /> Windows (x64 Native Standalone)</span>
          <span>•</span>
          <span><Icon icon="mdi:linux" /> Linux AppImage</span>
          <span>•</span>
          <span><Icon icon="mdi:apple" /> macOS (Apple Silicon &amp; Intel)</span>
        </div>

        {/* ── Interactive Floating-Island App Preview ── */}
        <div className="app-preview-container">
          <div className="app-preview-island-wrapper">
            {/* Island 1: Morphing Instance-Bar */}
            <aside className="mock-island mock-server-bar">
              <button 
                type="button" 
                className={`mock-server-icon ${activeMockServer === "zeno" ? "active" : ""}`}
                onClick={() => setActiveMockServer("zeno")}
                title="Zeno Dev (P2P)"
              >
                <ZenoLogo size={24} colorMode="brand" />
              </button>

              <div style={{ width: "24px", height: "1px", background: "var(--border-island)" }} />

              <button 
                type="button" 
                className={`mock-server-icon ${activeMockServer === "rust" ? "active" : ""}`}
                onClick={() => setActiveMockServer("rust")}
                title="Rust Core (Relay)"
              >
                R
              </button>
              <button 
                type="button" 
                className={`mock-server-icon ${activeMockServer === "radio" ? "active" : ""}`}
                onClick={() => setActiveMockServer("radio")}
                title="LoRa Mesh (Radio)"
              >
                L
              </button>
            </aside>

            {/* Island 2: Channels */}
            <aside className="mock-island mock-channel-island">
              <header className="mock-header">
                <span>Zeno Development</span>
                <span className="text-emerald" style={{ fontSize: "10px", fontWeight: 700 }}>E2EE ✓</span>
              </header>
              <div className="mock-chan-list">
                <div className="mock-chan-item active">
                  <Icon icon="mage:message-conversation" />
                  <span># general-mesh</span>
                </div>
                <div className="mock-chan-item">
                  <Icon icon="mage:code" />
                  <span># rust-core-e2ee</span>
                </div>
                <div className="mock-chan-item">
                  <Icon icon="mage:volume-up" />
                  <span>🔊 Sprachkanal Alpha</span>
                </div>
                <div className="mock-chan-item">
                  <Icon icon="mage:file-records" />
                  <span>📖 Knowledge Hub</span>
                </div>
              </div>
            </aside>

            {/* Island 3: Chat with Snippet Patching */}
            <main className="mock-island mock-chat-island">
              <div>
                <div className="mock-chat-msg">
                  <div className="mock-avatar">A</div>
                  <div className="mock-msg-bubble">
                    <strong style={{ color: "var(--accent-relay)" }}>Alice (Peer-01)</strong>
                    <p style={{ marginTop: "2px" }}>
                      Habe den neuen E2EE-Stream-Handler in Rust geschrieben. Kann jemand das Snippet testen?
                    </p>
                    <div className="mock-code-box">
                      <span>fn decrypt_packet(p: &amp;[u8]) -&gt; Result&lt;Vec&lt;u8&gt;&gt;</span>
                      <button 
                        type="button" 
                        className="mock-patch-btn"
                        onClick={() => setMockPatched(true)}
                        title="Im In-Chat-Editor öffnen"
                      >
                        ⚡ Im In-Chat-Editor patchen
                      </button>
                    </div>
                  </div>
                </div>

                {mockPatched && (
                  <div className="mock-chat-msg" style={{ animation: "fadeIn 0.3s ease" }}>
                    <div className="mock-avatar" style={{ background: "var(--accent-relay)" }}>B</div>
                    <div className="mock-msg-bubble" style={{ borderColor: "var(--accent-oxide)" }}>
                      <strong style={{ color: "var(--accent-oxide)" }}>Bob (Du)</strong>
                      <span className="text-muted" style={{ fontSize: "10px", marginLeft: "6px" }}>Gepatchtes Snippet</span>
                      <p style={{ fontSize: "11px", color: "var(--status-verified)", marginTop: "2px" }}>
                        ✓ AES-GCM Auth-Tag-Prüfung und Nonce-Validierung ergänzt:
                      </p>
                      <div className="mock-code-box" style={{ color: "var(--status-verified)" }}>
                        <span>cipher.decrypt(nonce, payload.as_ref())?</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px", background: "var(--bg-canvas)", border: "1px solid var(--border-island)", borderRadius: "8px", padding: "8px 12px" }}>
                <span className="text-muted" style={{ fontSize: "12px" }}>Nachricht an #general-mesh... (Zero-Knowledge signiert)</span>
              </div>
            </main>

            {/* Island 4: In-Chat Monaco IDE Island */}
            <aside className="mock-island mock-right-island">
              <div className="mock-editor-title">
                <Icon icon="mage:code" />
                <span>Monaco Snippet Patcher</span>
              </div>
              <div className="mock-editor-code">
                <span className="text-muted">// In-Chat Monaco Live-Patching</span><br />
                <span className="text-oxide">fn</span> <span className="text-relay">verify_and_decrypt</span>() &#123;<br />
                &nbsp;&nbsp;<span className="text-oxide">let</span> key = derive_argon2id();<br />
                &nbsp;&nbsp;cipher.verify_tag()?;<br />
                &nbsp;&nbsp;Ok(payload)<br />
                &#125;
              </div>
              <button 
                type="button" 
                className="mock-send-patch-btn"
                onClick={() => setMockPatched(true)}
              >
                Gepatchtes Snippet zurücksenden ↵
              </button>
            </aside>

            {/* Island 5: Technical Status Bar */}
            <footer className="mock-status-island">
              <span>🛡️ Zero-Knowledge: <strong className="text-emerald">Verified</strong></span>
              <span>🔒 Storage: <strong className="text-oxide">Argon2id Locked</strong></span>
              <span>📡 Transport: <strong className="text-relay">P2P Mesh</strong></span>
              <span>⚡ WebView2 RAM: <strong className="text-emerald">64 MB</strong></span>
            </footer>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
           3. BENTO GRID ARCHITEKTUR-SEKTION
           ═══════════════════════════════════════════════════════════════ */}
      <section id="zero-knowledge" className="bento-section">
        <header className="section-header">
          <p className="section-tag">Architektur &amp; Vertrauen</p>
          <h2 className="section-title">Gebaut für absolute Souveränität.</h2>
          <p className="section-desc">
            Keine Datenkraken, keine zentralen Chat-Logs und kein ressourcenfressender Electron-Bloatware-Stack.
          </p>
        </header>

        <div className="bento-grid">
          {/* Bento Card 1: Serverlosigkeit */}
          <article className="bento-card col-8">
            <div>
              <div className="bento-icon-wrapper">
                <Icon icon="mage:shield-check" />
              </div>
              <h3 className="bento-card-title">Serverlose P2P-Topologie &amp; Zero-Knowledge</h3>
              <p className="bento-card-desc">
                Zeno speichert keine Nachrichten auf zentralen Servern. Die Kommunikation erfolgt direkt 
                zwischen Peers über Ende-zu-Ende-verschlüsselte WebRTC- und WebSocket-Relay-Kanäle. 
                Selbst wenn ein Relay-Paket abgefangen wird, ist der kryptografische Ciphertext dank moderner 
                Curve25519- und ChaCha20-Poly1305-Verschlüsselung mathematisch unknackbar.
              </p>
            </div>
            <div className="bento-telemetry-badge">
              <Icon icon="mage:lock" className="text-oxide" />
              <span>Zero Message Storage • Ephemeres Routing • Pure Sovereignty</span>
            </div>
          </article>

          {/* Bento Card 2: Extrem niedriger RAM-Footprint */}
          <article className="bento-card col-4">
            <div>
              <div className="bento-icon-wrapper" style={{ color: "var(--status-verified)" }}>
                <Icon icon="mage:cpu" />
              </div>
              <h3 className="bento-card-title">64 MB statt 2 GB RAM</h3>
              <p className="bento-card-desc">
                Während Discord und Slack Gigabytes an Speicher für ihren Chromium-Unterbau verschwenden, 
                setzt Zeno auf <strong>Rust und Tauri v2</strong> mit nativen Betriebssystem-WebViews.
              </p>
            </div>
            <div className="bento-telemetry-badge">
              <span className="text-emerald" style={{ fontWeight: 700 }}>~64 MB WebView2 Footprint</span>
            </div>
          </article>

          {/* Bento Card 3: In-Chat Monaco IDE & Patching */}
          <article id="in-chat-ide" className="bento-card col-4">
            <div>
              <div className="bento-icon-wrapper" style={{ color: "var(--accent-relay)" }}>
                <Icon icon="mage:code" />
              </div>
              <h3 className="bento-card-title">In-Chat Monaco IDE</h3>
              <p className="bento-card-desc">
                Code-Snippets im Chat sind nicht bloß passiver Text: Mit einem Klick lädst du Snippets 
                in den integrierten Monaco-Editor, nimmst Patches vor und postest das überarbeitete Snippet 
                direkt als Review-Antwort zurück.
              </p>
            </div>
            <div className="bento-telemetry-badge">
              <Icon icon="mage:sparkles" className="text-relay" />
              <span>Live-Syntax-Highlighting • In-Chat PR-Flow</span>
            </div>
          </article>

          {/* Bento Card 4: Lokaler Argon2id-Schutz */}
          <article className="bento-card col-4">
            <div>
              <div className="bento-icon-wrapper">
                <Icon icon="mage:key" />
              </div>
              <h3 className="bento-card-title">Argon2id Key Derivation</h3>
              <p className="bento-card-desc">
                Deine lokalen Daten liegen in einer verschlüsselten SQLite-Datenbank auf deinem Rechner. 
                Der Hauptschlüssel wird mittels speicherharter <strong>Argon2id</strong>-Schlüsselableitung 
                aus deinem Passphrase-Master generiert und widersteht selbst GPU-Brute-Force-Angriffen.
              </p>
            </div>
            <div className="bento-telemetry-badge">
              <Icon icon="mage:check-circle" className="text-emerald" />
              <span>AES-256-GCM • Zero-Leak Storage</span>
            </div>
          </article>

          {/* Bento Card 5: Packet Radio & Modifizierbarkeit */}
          <article id="plugins" className="bento-card col-4">
            <div>
              <div className="bento-icon-wrapper" style={{ color: "var(--accent-oxide)" }}>
                <Icon icon="mage:radar" />
              </div>
              <h3 className="bento-card-title">LoRa &amp; Packet Radio</h3>
              <p className="bento-card-desc">
                Zeno unterstützt neben Tor und WebSockets auch <strong>Off-Grid Packet Radio</strong> über 
                LoRa-Transceiver. Bleibe selbst bei Internetausfällen und Zensur über freie Funkfrequenzen verbunden.
              </p>
            </div>
            <div className="bento-telemetry-badge">
              <Icon icon="mage:radio" className="text-oxide" />
              <span>WASM-Plugins • LoRa Off-Grid • Tor Onion</span>
            </div>
          </article>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
           4. DOWNLOADS & GPG VERIFICATION
           ═══════════════════════════════════════════════════════════════ */}
      <section id="downloads" className="download-section">
        <div className="download-box">
          <div>
            <p className="section-tag">Offizieller Release</p>
            <h2 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "14px" }}>
              Zeno {release.tagName} herunterladen
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "15px" }}>
              Voll funktionsfähiger, autarker Standalone-Build. Keine Node.js- oder Rust-Installation 
              erforderlich. Startet sofort mit integriertem Frontend, portablem Node-Runner und nativem Core.
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
              <a 
                href={release.downloadUrl}
                className="btn-primary-download"
                title={`Direktdownload: ${release.assetName}`}
              >
                <Icon icon="mdi:microsoft-windows" style={{ fontSize: "18px" }} />
                <span>Windows x64 (.zip Portable) • {release.assetSize}</span>
              </a>

              <a 
                href="https://github.com/Goddev-Archer/Zeno/releases"
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary-gh"
              >
                <Icon icon="mdi:github" style={{ fontSize: "18px" }} />
                <span>Alle Releases auf GitHub</span>
              </a>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              <span>Datei: <code>{release.assetName}</code></span>
              <span>•</span>
              <span>Signiert mit GPG Key ID: <strong>A3ACEB626EBFB7EC</strong></span>
              {release.isDynamic && (
                <>
                  <span>•</span>
                  <span style={{ color: "#10B981", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />
                    Auto-Sync aktiv
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Terminal GPG Verification Mock */}
          <div className="terminal-box">
            <div className="terminal-bar">
              <span className="term-dot" style={{ background: "#EF4444" }} />
              <span className="term-dot" style={{ background: "#F59E0B" }} />
              <span className="term-dot" style={{ background: "#10B981" }} />
            </div>
            <p style={{ color: "var(--text-muted)" }}># 1. Öffentlichen Zeno-Schlüssel importieren</p>
            <p style={{ color: "var(--accent-oxide)" }}>$ gpg --import zeno-release-public-key.asc</p>
            <br />
            <p style={{ color: "var(--text-muted)" }}># 2. Echtheit der Release-Binary prüfen</p>
            <p style={{ color: "var(--accent-oxide)" }}>$ gpg --verify {release.assetName}.asc {release.assetName}</p>
            <p style={{ color: "var(--status-verified)", marginTop: "4px" }}>
              gpg: Good signature from "Goddev Archer (Zeno Release Signing Key)" [ultimate]
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
           5. FOOTER
           ═══════════════════════════════════════════════════════════════ */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ZenoLogo size={24} withFrame colorMode="brand" />
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.1em" }}>
              ZENO MESSENGER &amp; WORKSPACE
            </span>
          </div>

          <p className="footer-copy">
            100% Free &amp; Open Source • Zero Telemetry Guarantee • Released under{" "}
            <a
              href="https://github.com/Goddev-Archer/Zeno/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-license-link"
            >
              Apache License 2.0
            </a>
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <a
              href="mailto:goddevarcher@outlook.com"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--text-secondary)",
                textDecoration: "none",
                fontSize: "13px",
                fontFamily: "var(--font-mono)",
                transition: "color 0.15s ease",
              }}
              className="footer-email-link"
              title="Entwickler- & Security-Kontakt per E-Mail"
            >
              <Icon icon="mdi:email-outline" style={{ fontSize: "16px" }} />
              <span>goddevarcher@outlook.com</span>
            </a>

            <a
              href="https://github.com/Goddev-Archer/Zeno"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", transition: "color 0.15s ease" }}
              title="GitHub Repository"
            >
              <Icon icon="mdi:github" style={{ fontSize: "20px" }} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
