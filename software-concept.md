# Produkt-Konzept: Privatsphäre-orientierte Discord-Alternative (Zeno)

Dieses Dokument beschreibt das technische und konzeptionelle Design für eine moderne, Zero-Knowledge-basierte Kommunikationsplattform. Das Ziel ist es, die Usability und Echtzeit-Fähigkeiten von Discord mit maximaler Privatsphäre und Datensouveränität zu vereinen.

---

## 1. Systemarchitektur & Zero-Knowledge-Ansatz

Die Plattform wird als **Open-Source-Projekt** entwickelt. Die Server-Infrastruktur ist so konzipiert, dass der Betreiber keinerlei Zugriff auf Chat-Inhalte, Sprachströme oder Metadaten hat.

```mermaid
graph TD
    subgraph Client A (Sender)
        IdentityA[Kryptografische Identität]
        DBA[(Lokale DB)]
        SFrameA[SFrame Verschlüsselung]
    end

    subgraph Client B (Empfänger)
        IdentityB[Kryptografische Identität]
        DBB[(Lokale DB)]
        SFrameB[SFrame Entschlüsselung]
    end

    subgraph Server (Blind Router & Blob Store)
        SFU[WebRTC SFU - Blinder Router]
        BlobStore[Encrypted Message Store]
    end

    ClientA -->|1. E2EE Audio/Video| SFU
    SFU -->|2. Weiterleitung unlesbarer Streams| ClientB
    ClientA -->|3. Verschlüsselte Chat-Blobs| BlobStore
    BlobStore -->|4. Sync bei Anmeldung| ClientB
```

### Kernkomponenten:
1. **Identitätsmanagement:**
   - Keine E-Mail-Adresse oder Telefonnummer zur Registrierung erforderlich.
   - Konten basieren auf einem **lokal generierten kryptografischen Schlüsselpaar (Ed25519/X25519)**.
   - **Onboarding:** Ein-Klick-Registrierung (Schlüsselgenerierung im Hintergrund). Ein Backup-Key (Seed-Phrase) wird dem Nutzer nachträglich zur Sicherung angeboten.
   - **Bot-Schutz:** Clientseitiges Proof-of-Work (PoW) und datenschutzfreundliche CAPTCHAs (z.B. Cloudflare Turnstile/hCaptcha) bei der Registrierung, um automatisierte Spam-Erstellungen zu verhindern.

2. **Echtzeit-Kommunikation (Voice/Video):**
   - **E2EE WebRTC mit SFrame (Secure Frame):** Die Audiodaten werden direkt im Client verschlüsselt (mittels WebRTC Insertable Streams), bevor sie den Rechner verlassen.
   - Der Server agiert als **SFU (Selective Forwarding Unit)**. Er leitet die Audio- und Videodatenströme nur an die anderen Kanalkomponenten weiter, kann sie jedoch mangels Schlüssel nicht entschlüsseln.

3. **Nachrichtenspeicherung (Chat-History):**
   - Nachrichten werden clientseitig verschlüsselt (AES-GCM) und als unlesbare Blobs auf dem Server abgelegt.
   - Nur autorisierte Mitglieder eines Raums besitzen den symmetrischen Raum-Schlüssel, um diese Blobs zu entschlüsseln.
   - Neue Geräte erhalten die Raum-Schlüssel per P2P-Protokoll von bereits verifizierten Geräten des Nutzers.

---

## 2. Browsing & Web-Sicherheit

Ein Kern-Differenziator ist der Schutz des Nutzers beim Interagieren mit dem Internet innerhalb der App.

* **In-App Privacy Browser:** Links werden in einer isolierten Webview-Sandbox geöffnet. 
* **Brave-Inspired Shielding:** Integration von Werbe- und Tracker-Blockern direkt im Webview-Client, um Drive-by-Tracking zu verhindern.
* **Link-Cleaner:** Automatisches Entfernen von Tracking-Parametern (z.B. `utm_*`, `fbclid`, `gclid`) aus URLs, bevor sie geöffnet werden.
* **Privacy-Preserving Link Previews:** Der Server lädt Link-Vorschauen über ein rotierendes Proxy-Netzwerk, sodass die Zielwebseite niemals die IP-Adresse des Benutzers erfährt, wenn eine Vorschau in der App gerendert wird.

---

## 3. UI/UX: JetBrains-Designsprache & Personalisierung

Die App soll ein extrem strukturiertes, professionelles und ressourcenschonendes UI/UX bieten, inspiriert von JetBrains-Produkten (z.B. IntelliJ IDEA, Rider, Fleet).

```
+-------------------------------------------------------------------+
| [Server 1] | [# allgemein]                                     [X] |
| [Server 2] | [# voice-1 ]                                          |
|            |-------------------------------------------------------|
|            | [Benutzer A]   | [Nachricht 1: Hallo Welt!]           |
|            | [Benutzer B]   | [Nachricht 2: E2EE läuft.]           |
|            |                |                                      |
+------------+----------------+--------------------------------------|
| (•) Online | [Eingabefeld: Schreibe eine Nachricht...            ] |
+-------------------------------------------------------------------+
```

### Design-Philosophie:
* **Minimalistisch & Platzsparend:** Fokus auf hohe Informationsdichte, klare Kanten, feine Linien und dezente Kontraste.
* **Custom Themes & Baukasten (Hybrid-Modell):** 
  - **Farbliche Anpassung (Obsidian-Style):** Ein token-basiertes CSS-System auf `:root`-Ebene, gesteuert durch einen visuellen In-App-Baukasten oder das direkte Laden von `.css`-Dateien (vollkommen sicher vor XSS, da kein JavaScript in Themes erlaubt ist).
  - **Strukturelle Anpassung (IDE-Panel-Grid):** Modulare UI-Komponenten (Chat, Kanalliste, Editor etc.), die Nutzer per Drag-and-Drop frei anordnen können (ähnlich der Tool-Windows-Funktion in IntelliJ/Rider).
* **Plugin-Plattform ("Plugin-Base"):** Ein integrierter Marktplatz für Themes und funktionale Erweiterungen (Bots, Integrationen).
* **Integriertes Monaco Code-Editor-Interface:** Für Entwickler und Power-User gibt es eine eingebaute IDE-Schnittstelle (basierend auf Monaco Editor, wie in VS Code). Dies ermöglicht schnelle Code- und Style-Anpassungen direkt im Client, ohne externe Tools starten zu müssen.
* **In-Chat Collaborative Code Sharing & Editing:** Wenn ein Nutzer eine Quellcodedatei im Chat teilt, kann der Empfänger diese direkt in einer In-App-Monaco-Sandbox öffnen. Nach dem Bearbeiten und Testen kann der Code mit einem Klick als Antwort/Änderungsvorschlag direkt zurück in den Chat gesendet werden – ideal für schnelles kollaboratives Reviewen und Prototyping.


---

## 4. Sicherheitskonzept für Plugins & Themes

Da Drittanbieter-Plugins ein erhebliches Sicherheitsrisiko darstellen (z.B. Diebstahl privater Schlüssel), implementieren wir ein mehrstufiges Sicherheitskonzept:

### 1. Strikt deklarative Themes
* Themes dürfen **ausschließlich** statische Konfigurationsdateien (z.B. JSON oder CSS-Variablen) sein.
* **Kein JavaScript-Code in Themes erlaubt.** Dies verhindert XSS und Keylogging vollständig auf Designebene.

### 2. Sandboxing für Plugins (Hybrid-Modell)
* **Zweigeteilte Sandbox (Figma-Ansatz):**
  * **Logik-Sandbox:** Der funktionale Code des Plugins (Berechnungen, Logik) läuft in einem isolierten Background Thread (**Secure Web Worker** mit restriktiver CSP oder einer WASM-Runtime im Rust-Backend).
  * **UI-Sandbox:** Visuelle Benutzeroberflächen von Plugins werden in stark eingeschränkten HTML-`iframes` mit dem Attribut `sandbox="allow-scripts"` gerendert. Diese haben keinen Zugriff auf Cookies, LocalStorage oder das DOM der Hauptanwendung.
* **Kommunikationsbrücke:** Der Iframe und der Logik-Worker kommunizieren untereinander und mit der Hauptanwendung ausschließlich über eine streng typisierte Message-Post-API (RPC-Brücke).
* Plugins haben standardmäßig keinen Zugriff auf die privaten Schlüssel des Nutzers oder das Dateisystem.
* Ein feingliedriges **Berechtigungssystem** (ähnlich wie bei Android/WebExtensions) erfordert die explizite Freigabe durch den Nutzer (z.B. *"Dieses Plugin möchte auf das Mikrofon zugreifen"*).

### 3. Automatisierte Sicherheitsprüfung (Plugin-Base Pipeline)
* Vor der Veröffentlichung in der Plugin-Base durchläuft jedes Plugin eine CI/CD-Sicherheits-Pipeline:
  - **Statische Codeanalyse (AST-Scanning):** Suche nach verdächtigen Mustern wie `eval()`, unerlaubten Netzwerkverbindungen oder Zugriffen auf geschützte APIs.
  - **Antivirus-Scan via API:** Integration eines Enterprise-Scanners (z.B. Bitdefender-Cloud-API oder VirusTotal), um hochgeladene ZIPs/Builds auf bekannte Malware und Exploits zu prüfen.
  - **Code-Signierung:** Verifizierte Entwickler signieren ihre Plugins kryptografisch.

### 4. Open-Source-Transparenz & GitHub-Synchronisation
* **GitHub-Integration:** Die Plugin-Base ist eng mit GitHub (und Git-Alternativen) verzahnt. Entwickler können ihre Repositories direkt verknüpfen, und Releases werden automatisch synchronisiert und aus der App heraus hochgeladen.
* **In-App Source-Code Viewer (analog zu Windhawk):** Um maximale Transparenz und Vertrauen zu schaffen, können Nutzer den Quellcode jedes Plugins direkt in der App vor der Installation über das Monaco-Interface einsehen und mit der Live-Version vergleichen. Dies ermöglicht es technisch versierten Usern, Code-Auditierungen direkt im Client durchzuführen.

---

## 5. Monetarisierungs- & Nachhaltigkeitskonzept

Um den Betrieb und die Weiterentwicklung der Plattform nachhaltig zu finanzieren, ohne die Privatsphäre zu kompromittieren oder die Einstiegshürde für normale Nutzer zu erhöhen, wird ein faires Freemium-Modell etabliert:

### 1. Dateigrößen-Limitierung (Freemium-Bandbreite)
* **Kostenloser Kern-Service:** Das Erstellen von Servern, unbegrenzter Text-Chat und E2EE-Sprachkanäle sind für alle Nutzer dauerhaft kostenlos und unbegrenzt (wie bei Discord).
* **Dateianhänge & BYOS (Bring Your Own Storage):** 
  * *Free-Tier:* Anhänge und geteilte Dateien über die Aegis-Server sind auf maximal 10 MB beschränkt.
  * *Premium-Abo (Unterstützer-Modell):* Erhöhtes Limit (z. B. 500 MB oder unlimitiert) über die Aegis-Server gegen eine monatliche Gebühr.
  * *BYOS-Integration (Bring Your Own Storage - Opt-In):* Nutzer können im Client eigene Speicherlösungen (z. B. Nextcloud, WebDAV, AWS S3, Dropbox) hinterlegen. Aegis verschlüsselt die Dateien dann lokal und lädt sie direkt auf den Speicher des Nutzers hoch. Im Chat wird nur der verschlüsselte Link geteilt. Dieses Feature ist komplett kostenlos und entlastet die Aegis-Infrastruktur.

### 2. Kosmetische Unterstützer-Badges (Abonnements)
* Nutzer können die Plattform durch ein monatliches Abonnement direkt unterstützen.
* Als Anerkennung erhalten sie ein kosmetisches Supporter-Badge, das an ihre kryptografische Identität im offiziellen Netzwerk gekoppelt ist.

### 3. Marktplatz für Profilanpassungen (Creator-Economy)
* **Kostenlose Themes & Plugins:** Funktionale Erweiterungen (Plugins) und Client-Themes sind grundsätzlich kostenlos und quelloffen (Open Source). Um KI-generierten Spam zu verhindern und echte Designer/Künstler zu schützen, können Themes und Plugins nicht monetarisiert werden.
* **Kommerzielle Profilanpassungen (Opt-in):** Künstler und Designer können im integrierten Marktplatz dekorative Elemente für Nutzerprofile (wie Avatar-Rahmen, Profilkarten-Designs und Animationen) anbieten.
* **Händlerprovision (Merchant Cut):** Designer entscheiden selbst, ob sie ihre Designs kostenlos anbieten oder einen Preis festlegen. Bei kostenpflichtigen Profilanpassungen behält die Plattform eine kleine Händlergage (z. B. 10–15 %) zur Refinanzierung der Server-Infrastruktur ein.

---

## 6. Nächste Schritte zur Validierung & Umsetzung

1. **Technologie-Stack definieren:**
   - **Frontend/Desktop-Wrapper:** Tauri (Rust-Backend für maximale Performance und Sicherheit + React/TypeScript für das UI).
   - **E2EE Voice:** Rust-natives WebRTC (unter Verwendung von Bibliotheken wie `webrtc-rs` im Tauri-Backend). Dies garantiert plattformübergreifend konsistenten Support für SFrame (Secure Frame) Insertable Streams, unabhängig von den Einschränkungen der jeweiligen System-Webviews (Safari/WebKit vs. WebView2). Die Audio/Videoströme werden in Rust verarbeitet und an die WebRTC SFU (z. B. LiveKit/mediasoup) übertragen.
2. **Architektur-Prototyp (PoC):**
   - Bau eines minimalen Chat-Clients mit anonymer Schlüssel-Registrierung und verschlüsselter Nachrichtenübertragung.
3. **JetBrains-Design Mockup:**
   - Erstellung einer CSS-Struktur, die das charakteristische, strukturierte JetBrains-Layout abbildet.

