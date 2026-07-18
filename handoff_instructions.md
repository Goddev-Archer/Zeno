# Handoff & Development Instructions: Projekt Aegis

Dieses Dokument dient als direkte Anweisung und Kontextübergabe für das nachfolgende KI-Modell. Es beschreibt den aktuellen Stand des Projekts **Aegis** (einer Zero-Knowledge Discord-Alternative) sowie den exakten Fahrplan für die bevorstehende Implementierungsphase.

---

## 1. Projekt-Kontext & Aktueller Stand

* **Konzept-Datei:** [product_concept.md](file:///C:/Users/santamariac/source/noncsharp/repos/ProjectNameMissing/product_concept.md)
* **Entwicklungs- und UI-Plan:** [ui_plan.md](file:///C:/Users/santamariac/.gemini/antigravity-cli/brain/98ea924d-2566-4c01-bb17-bdad721bf40f/ui_plan.md) (enthält Design-System, Farb-Tokens und Layouts).
* **Review-Historie:** [concept_review.md](file:///C:/Users/santamariac/.gemini/antigravity-cli/brain/98ea924d-2566-4c01-bb17-bdad721bf40f/concept_review.md) (ausführliche Erklärungen zu Sandboxing und Verschlüsselung).

---

## 2. Beschlossene Architektur & technische Säulen

Das Team hat sich auf folgende technische Spezifikationen geeinigt:

1. **Tech-Stack:**
   * **Desktop-Wrapper:** Tauri (Rust-Backend + React/TypeScript-Frontend).
   * **E2EE Sprach-/Videokanäle:** Rust-natives WebRTC (unter Verwendung von `webrtc-rs` im Tauri-Rust-Backend) anstelle von Webview-basiertem WebRTC, um plattformübergreifenden Support für *SFrame Insertable Streams* zu garantieren.
2. **Plugin-Sandboxing (Hybrid-Modell):**
   * **UI-Sandbox:** Rendert Visuelles in HTML-`iframes` mit dem Attribut `sandbox="allow-scripts"`. Diese sind komplett isoliert (kein Zugriff auf Cookies, LocalStorage, DOM der Haupt-App).
   * **Logik-Sandbox:** Ausführung von Plugin-Code in einem Web Worker oder einer WASM-Umgebung.
   * **Kommunikation:** Über eine streng typisierte `postMessage`-API (RPC-Brücke) vermittelt durch die Haupt-App.
3. **Schlüssel-Management & Recovery (3-Stufen-Modell):**
   * *Stufe 1 (Geräte-Kopplung):* QR-Code-basiertes Pairing (temporärer X25519-Schlüsselaustausch).
   * *Stufe 2 (Verschlüsseltes Cloud-Backup):* Lokale Verschlüsselung der Keys mittels eines durch **Argon2id** abgeleiteten Schlüssels und Speicherung des verschlüsselten Blobs auf dem Server (Zero-Knowledge).
   * *Stufe 3 (Social Recovery):* Aufteilung des Master-Keys mittels **Shamir's Secret Sharing** (z. B. 3 aus 5 Treuhändern).
4. **BYOS (Bring Your Own Storage):**
   * Dateianhänge über 10 MB können über benutzerdefinierte Speicher (Nextcloud, WebDAV, AWS S3, Dropbox) hochgeladen werden. Der Client verschlüsselt die Datei lokal und teilt nur den verschlüsselten Link im Chat.
5. **UI-Aesthetic:**
   * JetBrains IDE "New UI"-Design (hohe Informationsdichte, 1px solide Rahmen, `#1E1F22` Haupthintergrund, `#2B2D30` Seitenleisten, Monospace-Details für IDs/Metadaten, `Inter` als Interface-Schrift).

---

## 3. Nächste Aufgaben (Next Steps) für das nächste Modell

Deine Aufgabe ist es, mit der Implementierung des interaktiven UI-Prototyps und der Projektstruktur zu beginnen. Gehe wie folgt vor:

### Schritt 1: Projekt-Setup
1. Initialisiere die Projektstruktur im Ordner `C:\Users\santamariac\source\noncsharp\repos\ProjectNameMissing\`.
2. Setze die Tauri-App mit React & TypeScript auf (nutze `--help` bei npx-Kommandos und führe sie non-interaktiv aus).
3. Richte das CSS-Designsystem gemäß den Farb-Tokens in `ui_plan.md` in `index.css` ein.

### Schritt 2: Layout & Grid-Implementierung
Erstelle das 4-Spalten-Layout der App:
1. **Server-Sidebar** (Schmale Icon-Leiste links).
2. **Kanal- und Status-Sidebar** (Kanäle, Direct Messages und das Benutzer-Profil-Panel im Fußbereich).
3. **Chat-Hauptbereich** (Header mit Kanalname, Nachrichten-Feed, Message-Input mit Code-Share-Buttons).
4. **Mitglieder-Sidebar** (Rechts, ausklappbar).

### Schritt 3: Komponenten-Mockups & Monaco-Integration
1. **Monaco Editor Mockup:** Implementiere das Monaco-Code-Sharing-Element im Chatverlauf. Bei Klick soll sich ein ansprechendes Modal mit einer Editier-Sandbox öffnen.
2. **BYOS-Einstellungsseite:** Baue ein Einstellungsmenü, in dem der Nutzer seine Nextcloud- oder S3-Daten für Dateianhänge konfigurieren kann.
3. **Device Pairing Flow:** Implementiere ein interaktives Mockup für den QR-Code-Kopplungsprozess.
