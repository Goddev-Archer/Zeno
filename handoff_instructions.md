# Handoff & Development Instructions: Projekt Zeno

Dieses Dokument dient als zentrale Wissens- und Kontextübergabe für nachfolgende KI-Modelle und Entwickler. Es beschreibt den **aktuellen Stand (Oktober 2026, Version v0.2.1-alpha)** des Projekts **Zeno** – einer dezentralen, serverlosen und Zero-Knowledge-gesicherten Kommunikationsplattform & Entwickler-Workspace – sowie die unmittelbaren nächsten Implementierungsschritte.

---

## 1. Projekt-Kontext & Repository-Struktur

* **Repository-Wurzelverzeichnis:** `C:\dev\Zeno\`
* **Wichtige Spezifikationen & Dokumentationen:**
  * [README.md](file:///c:/dev/Zeno/README.md) / [README.en.md](file:///c:/dev/Zeno/README.en.md) (Offizielle Dokumentation, GG Art. 10 Datenschutzkonformität, Benefits)
  * [software-concept.md](file:///c:/dev/Zeno/software-concept.md) (Ausführliches Software- und Sicherheitskonzept, SFrame, Identitäten)
  * [SECURITY.md](file:///c:/dev/Zeno/SECURITY.md) (Responsible Disclosure Policy & PGP-Kontaktdaten)
  * [SERVER_GIT_GUIDE.md](file:///c:/dev/Zeno/SERVER_GIT_GUIDE.md) (Architektur der Git-basierten Server-Synchronisation)

### Verzeichnisstruktur
```text
C:\dev\Zeno\
├── desktop/                # Hauptanwendung: Tauri v2.0 (Rust) + React 19 + TypeScript + Vite
│   ├── src-tauri/          # Rust-Backend: SQLite, Native Git, Krypto, Voice-Protokoll, Popouts
│   │   ├── src/lib.rs      # Tauri-Befehle, Git-Bridge, Window-Management
│   │   ├── src/db.rs       # SQLite-Persistenz & Multi-Account-Isolation (rusqlite)
│   │   ├── src/crypto.rs   # Schlüsselableitung, Signierung, Zero-Knowledge-Primitive
│   │   └── src/voice_network.rs # WebRTC & SFrame E2EE Audio-Netzwerk
│   └── src/                # Frontend: JetBrains New UI Ästhetik, Monaco Editor, Chat, DMs
│       ├── components/     # Modulare UI-Komponenten (Chat, Sidebar, IDE, Modals)
│       ├── services/       # Tauri IPC & WebSocket Relay Client
│       └── types/          # Strenge TypeScript-Datenmodelle
├── relay/                  # Standalone WebSocket Relay-Server (Node.js / ws)
│   ├── server.mjs          # Blinder Nachrichten-Router mit Sender-Key-Unterstützung
│   ├── docker-compose.yml  # Container-Setup für selbstgehostete Relay-Knoten
│   └── systemd/            # Linux Systemd Service Unit (zeno-relay.service)
├── website/                # Offizielle Produkt- und Download-Website (React 19 + Vite)
├── releases/               # Signierte Distributions-Pakete (v0.1.0-alpha, v0.2.0-alpha, v0.2.1-alpha)
└── scripts/                # Automatisierung: package-release.ps1 (GPG-Signierung & Packaging)
```

---

## 2. Aktueller Implementierungsstand (v0.2.1-alpha)

Das Projekt befindet sich in einem fortgeschrittenen Alpha-Stadium. Folgende Kernsäulen sind realisiert:

### A. Vollwertiger Desktop-Client (`desktop/`)
1. **Identitätsmanagement & Multi-Account (SQLite):**
   - Jede Identität besitzt eine **AIN** (*Autonomous Identity Number*, z. B. `ZENO-xxxx-xxxx-xxxx`), Ed25519/X25519-Schlüsselpaare und optionale BIP-39 Recovery-Mnemonics.
   - In `desktop/src-tauri/src/db.rs` sichert eine lokale SQLite-Datenbank Server, Kanäle, Chatverläufe und Identitäten ab.
   - **Multi-Account-Isolation:** Mittels der Verknüpfungstabelle `account_servers` sehen verschiedene AIN-Accounts auf demselben Rechner nur die Server und Kanäle, denen sie tatsächlich beigetreten sind.
2. **Direct Messaging (DMs) & Popout-Fenster:**
   - E2EE Direktchats zwischen Peers (`DmChatArea.tsx`, `CreateDmModal.tsx`).
   - Drei Routing-Optionen: Direkte P2P-Verbindung (`p2p_direct`), blinder Relay-Umschlag (`relay_envelope`) oder verschlüsselter Datei-Drop (`byos_drop`).
   - **Popout-Modus:** Einzelne Chat-Konversationen können als eigenständige, rahmenlose Desktop-Fenster (`create_popout_window`) abgedockt werden.
   - Integrierter Selbst-Chat („Persönlicher Notiz- & Gedankenkanal“).
3. **Integrierte Zeno IDE & Monaco Editor:**
   - Monaco Editor ist sowohl direkt im Chat als auch als eigenständiger IDE-Workspace (`homeTab === "ide"`) integriert.
   - Syntax-Highlighting für TypeScript, Python, Rust, Go, C++, Markdown etc.
   - Code-Snippets aus Chats können mit einem Klick in den Editor übernommen oder aus dem Editor im Chat geteilt werden.
4. **Native Git-Source-Control:**
   - Vollständige Git-Integration ohne Drittanbieter-Tools direkt über das Rust-Backend (`desktop/src-tauri/src/lib.rs`).
   - Visuelle Diffs, Stage/Unstage, Commit, Branch-Verwaltung und Synchronisation im rechten Seitenleisten-Panel (`RightPanelIsland.tsx`).
5. **BYOS (Bring Your Own Storage):**
   - Vollständige Entkopplung großer Dateien (>10 MB) von Chatnachrichten. Lokale clientseitige Verschlüsselung und Upload auf Nextcloud / WebDAV oder AWS S3.
6. **Custom Titlebar & UI-Polish:**
   - Benutzerdefinierte, rahmenlose Fensterleiste (`CustomTitlebar.tsx`) mit Minimieren/Maximieren/Schließen, Theme-Umschalter (Dark/Light) und dynamischer Kontextanzeige.
   - Kollabierbare Seitenleiste (`sidebar-collapsed`), Glassmorphismus-Effekte und JetBrains-inspirierte Designsprache (`#1E1F22`, `#2B2D30`).

### B. Relay-Infrastruktur (`relay/`)
- Blinder WebSocket-Relay-Server (`server.mjs`) auf Basis von Node.js und `ws`.
- Leitet unlesbare, Ende-zu-Ende verschlüsselte Nachrichten-Blobs anhand von Raum- und Sender-Keys weiter, ohne Metadaten oder Klartext einzusehen.
- Produktionsreif mit Docker Compose und Systemd-Service-Konfiguration ausgestattet.

### C. Release-Pipeline & Signierung (`releases/` & `scripts/`)
- Alle Windows-Builds werden portabel als `.zip` verpackt.
- Kryptografische Verifikation durch offiziellen GPG-Schlüssel:
  - **Key ID:** `A3ACEB626EBFB7EC`
  - **Signatur:** `zeno-v0.2.0-alpha-windows-x64-portable.zip.asc`

---

## 3. Entwicklungs-Workflows & Lokaler Start

### Desktop-Anwendung starten
```powershell
cd c:\dev\Zeno\desktop
npm install
npm run tauri dev
```

### Relay-Server lokal starten
```powershell
cd c:\dev\Zeno\relay
npm install
npm start # Läuft auf ws://localhost:4000
```

### Offizielle Website starten
```powershell
cd c:\dev\Zeno\website
npm install
npm run dev # Läuft auf http://localhost:5173
```

### Release-Paket schnüren & signieren
```powershell
cd c:\dev\Zeno
.\scripts\package-release.ps1 -Version "0.2.0-alpha"
```

---

## 4. Konkrete nächste Aufgaben (Next Steps) für die Weiterentwicklung

Für die anstehende Arbeitsphase sind folgende Aufgaben mit höchster Priorität definiert:

### 1. E2EE Voice- & Videokanäle (WebRTC-RS / SFrame)
* **Ziel:** Fertigstellung der nativen Rust-Implementierung in `desktop/src-tauri/src/voice_network.rs`.
* **Aufgaben:**
  - Anbindung von `webrtc-rs` an die Tauri-IPC-Befehle, sodass Sprachkanäle im Server Audio-Frames clientseitig mit SFrame verschlüsseln.
  - Implementierung der Audio-Eingabe/-Ausgabe-Auswahl in den Einstellungen (`SettingsModal.tsx`).
  - Visuelle Sprecher-Indikatoren (grüner Ring / Audio-Ausschlag) in der Kanal- und Mitgliederleiste.

### 2. Social Recovery Flow & Shamir's Secret Sharing (Stufe 3)
* **Ziel:** Vollständige Umsetzung des 3-Stufen-Schlüsselmodells für Kontenwiederherstellung ohne zentrale E-Mail/Passwörter.
* **Aufgaben:**
  - UI-Wizard zur Aufteilung des Master-Schlüssels auf Vertrauenspersonen (z. B. 3 aus 5 Shares).
  - Einladungs- und Bestätigungs-Flow für Wiederherstellungskontakte via P2P-Direktnachricht.

### 3. Git-Server-Synchronisation vertiefen
* **Ziel:** Vollständige Dezentralisierung von Server-Konfigurationen und Rollen über Git-Repositories.
* **Aufgaben:**
  - Fehlerbehandlung und Konfliktlösung (Merge Conflicts) bei konkurrierenden Kanaländerungen verbessern.
  - Automatischer Hintergrund-Fetch/Pull für abonnierte Server-Repositories.

### 4. Code-Qualität, Tests & Bereinigung
* **Aufgaben:**
  - Ausstehende uncommitted Changes in `desktop/` und `website/` (Custom Titlebar, DMs, SQLite Account Isolation) reviewen, testen und sauber in Git committen.
  - Automatisierte CI/CD-Pipeline via GitHub Actions (`.github/workflows/`) für Cross-Platform-Builds (Windows, Linux AppImage, macOS DMG) einrichten.

---

## 4. Konkrete nächste Aufgaben (Next Steps) für die Weiterentwicklung

Für die anstehende Arbeitsphase sind folgende Aufgaben mit höchster Priorität definiert:

### 1. E2EE Voice- & Videokanäle (WebRTC-RS / SFrame)
* **Ziel:** Fertigstellung der nativen Rust-Implementierung in `desktop/src-tauri/src/voice_network.rs`.
* **Aufgaben:**
  - Anbindung von `webrtc-rs` an die Tauri-IPC-Befehle, sodass Sprachkanäle im Server Audio-Frames clientseitig mit SFrame verschlüsseln.
  - Implementierung der Audio-Eingabe/-Ausgabe-Auswahl in den Einstellungen (`SettingsModal.tsx`).
  - Visuelle Sprecher-Indikatoren (grüner Ring / Audio-Ausschlag) in der Kanal- und Mitgliederleiste.

### 2. Social Recovery Flow & Shamir's Secret Sharing (Stufe 3)
* **Ziel:** Vollständige Umsetzung des 3-Stufen-Schlüsselmodells für Kontenwiederherstellung ohne zentrale E-Mail/Passwörter.
* **Aufgaben:**
  - UI-Wizard zur Aufteilung des Master-Schlüssels auf Vertrauenspersonen (z. B. 3 aus 5 Shares).
  - Einladungs- und Bestätigungs-Flow für Wiederherstellungskontakte via P2P-Direktnachricht.

### 3. Git-Server-Synchronisation vertiefen
* **Ziel:** Vollständige Dezentralisierung von Server-Konfigurationen und Rollen über Git-Repositories.
* **Aufgaben:**
  - Fehlerbehandlung und Konfliktlösung (Merge Conflicts) bei konkurrierenden Kanaländerungen verbessern.
  - Automatischer Hintergrund-Fetch/Pull für abonnierte Server-Repositories.

### 4. Code-Qualität, Tests & Bereinigung
* **Aufgaben:**
  - Ausstehende uncommitted Changes in `desktop/` und `website/` (Custom Titlebar, DMs, SQLite Account Isolation) reviewen, testen und sauber in Git committen.
  - Automatisierte CI/CD-Pipeline via GitHub Actions (`.github/workflows/`) für Cross-Platform-Builds (Windows, Linux AppImage, macOS DMG) einrichten.

