# 📖 Zeno Server-Setup & Git-Hosting Leitfaden

Dieser Leitfaden beschreibt das dezentrale **Git-Server-Modell von Zeno** und erklärt Schritt für Schritt, wie du deinen eigenen Zeno-Server über **GitHub**, **GitLab** oder einen **selbst gehosteten Git-Server (Gitea / Forgejo / Bare Git)** bereitstellst, verwaltest und mit deiner Community teilst.

---

## 🧭 1. Das Zeno Git-Server-Prinzip

Klassische Chat-Plattformen wie Discord hosten Server-Strukturen, Kanallisten und Berechtigungen auf proprietären, zentralen Unternehmensservern. Fällt dieser Server aus oder greift Zensur bzw. die geplante EU-Chatkontrolle, verliert die Community die Kontrolle über ihre Räume.

**Zenos Gegenentwurf:**
* **Git als Single Source of Truth:** Jeder Zeno-Server wird über ein deklaratives Manifest (`zeno-server.json`) definiert, das in einem Git-Repository liegt.
* **Maximale Zensurresistenz:** Da jedes Git-Repo dezentral geklont, geforkt und auf beliebigen Servern gespiegelt werden kann, kann ein Zeno-Server niemals gelöscht oder unzugänglich gemacht werden.
* **Kryptografische Absicherung:** Git speichert ausschließlich die Server-Metadaten (Kanal-Hierarchie, Beschreibung, E2EE-Schlüsselparameter und Relay-Endpunkte). Alle Nachrichten- und Audioinhalte sind mittels **AES-256-GCM** bzw. **SFrame** Ende-zu-Ende verschlüsselt und werden nur ephemer über Blind-Relays geroutet.

---

## 📄 2. Die Anatomie der `zeno-server.json`

Das Manifest beschreibt die Struktur deines Zeno-Servers:

```json
{
  "version": "1.0.0",
  "serverId": "srv-devlounge-2026",
  "name": "DevSecOps & Rust Lounge",
  "description": "Dezentrale Community für Rust-Entwickler & Kryptografie-Begeisterte",
  "icon": "🛡️",
  "iconLetter": "D",
  "encrypted": true,
  "ownerAin": "ZENO-8F3A-9B21-44E2",
  "createdAt": "2026-09-30T12:00:00.000Z",
  "gitRepo": {
    "provider": "github",
    "repoUrl": "https://github.com/dein-team/zeno-server-data",
    "branch": "main",
    "manifestPath": "zeno-server.json"
  },
  "relays": [
    "wss://relay.zeno-chat.org",
    "wss://backup-relay.zeno-chat.org"
  ],
  "categories": [
    {
      "name": "TEXTKANÄLE",
      "type": "text",
      "channels": [
        { "id": "chn-allgemein", "name": "allgemein" },
        { "id": "chn-rust-dev", "name": "rust-dev" },
        { "id": "chn-wasm-sandbox", "name": "wasm-sandbox" },
        { "id": "chn-git-feed", "name": "git-feed" }
      ]
    },
    {
      "name": "SPRACHKANÄLE",
      "type": "voice",
      "channels": [
        { "id": "voice-alpha", "name": "Voice Alpha" },
        { "id": "voice-pair-prog", "name": "Pair Programming 1" }
      ]
    }
  ]
}
```

---

## 🐙 3. Methode A: Servererstellung über GitHub

GitHub ist die schnellste Methode für öffentliche oder Open-Source-Communities.

### Schritt 1: Repository auf GitHub anlegen
1. Melde dich bei [GitHub](https://github.com) an.
2. Klicke auf **New Repository**.
3. Wähle einen Namen (z. B. `zeno-community-server`).
4. Wähle **Public** (damit Zeno-Clients das Manifest frei abrufen können) oder **Private** (erfordert persönliche Zugriffstoken).
5. Initialisiere das Repo mit einer `README.md`.

### Schritt 2: Manifest generieren & hochladen
* **Option 1 (Direkt in Zeno):** Öffne in der Zeno Desktop-App das `+`-Menü in der Server-Sidebar, gib Name und Beschreibung ein, wähle **GitHub** und klicke auf *Manifest kopieren* oder *Download*.
* **Option 2 (Terminal):**
  ```bash
  git clone https://github.com/<dein-user>/zeno-community-server.git
  cd zeno-community-server

  # Speichere die oben gezeigte zeno-server.json in diesem Verzeichnis
  git add zeno-server.json
  git commit -m "feat: add Zeno server manifest"
  git push origin main
  ```

### Schritt 3: Raw-URL & Einladungs-Link
Zeno nutzt direkt die Raw-URL des Manifests:
```
https://raw.githubusercontent.com/<dein-user>/zeno-community-server/main/zeno-server.json
```
Gib deinen Mitgliedern einfach deine GitHub-URL (`https://github.com/<dein-user>/zeno-community-server`) oder den generierten Einladungs-Code. Zeno löst die GitHub-URL automatisch auf!

---

## 🦊 4. Methode B: Servererstellung über GitLab

GitLab eignet sich hervorragend für Entwicklerteams, die Wert auf flexible CI/CD-Pipelines oder europäische Cloud-Standorte legen.

### Schritt 1: GitLab-Projekt erstellen
1. Öffne [GitLab.com](https://gitlab.com) oder deine selbstgehostete GitLab-Instanz.
2. Erstelle ein **New Project / Repository** (z. B. `zeno-server`).
3. Setze das Projekt auf **Public** oder nutze einen *Project Access Token* mit Leserechten (`read_repository`).

### Schritt 2: `zeno-server.json` pushen
```bash
git clone https://gitlab.com/<dein-user>/zeno-server.git
cd zeno-server
# Lege die zeno-server.json an
git add zeno-server.json
git commit -m "feat: initialize Zeno server"
git push origin main
```

### Schritt 3: In Zeno einbinden
Die GitLab-Raw-URL folgt folgendem Schema:
```
https://gitlab.com/<dein-user>/zeno-server/-/raw/main/zeno-server.json
```
Beim Beitreten in Zeno kannst du direkt `https://gitlab.com/<dein-user>/zeno-server` eingeben – Zeno erkennt GitLab automatisch.

---

## 🦺 5. Methode C: Eigener Git-Server (Gitea / Forgejo / Bare Git)

Für maximale Zensurresistenz, Privatsphäre und Unabhängigkeit von US-Cloudbetreibern empfiehlt sich ein eigener, selbst gehosteter Git-Server.

### 1. Gitea oder Forgejo (Empfohlen für Self-Host)
Gitea und Forgejo sind extrem ressourcensparend (laufen selbst auf einem Raspberry Pi):
1. Erstelle ein Repository in deiner Gitea/Forgejo-Instanz (z. B. `https://git.meinedomain.de/alice/zeno-server`).
2. Pushe die `zeno-server.json` in den `main`-Branch.
3. Die Raw-URL lautet:
   ```
   https://git.meinedomain.de/alice/zeno-server/raw/branch/main/zeno-server.json
   ```
4. Zeno unterstützt diese URLs direkt.

### 2. Bare Git + Nginx / Caddy Static Serving
Wenn du gar kein Web-Frontend brauchst, kannst du die Datei auch auf einem einfachen Linux-Server hosten:
```nginx
# Beispiel Nginx Konfiguration:
server {
    listen 443 ssl http2;
    server_name zeno.meinedomain.de;

    location /zeno-server.json {
        root /var/www/zeno-server;
        add_header Access-Control-Allow-Origin *; # Wichtig für Webview-Abrufe
        add_header Cache-Control "no-cache, must-revalidate";
    }
}
```

---

## 🔄 6. Server-Updates & Wartung (Der Git-Vorteil)

Das Geniale an Zenos Architektur: **Du musst keinen Server neustarten!**

* **Neuen Kanal anlegen:** Füge einfach in der `zeno-server.json` ein neues Kanal-Objekt in der Kategorie ein:
  ```json
  { "id": "chn-announcements", "name": "ankündigungen" }
  ```
* **Änderung übertragen:**
  ```bash
  git commit -am "feat: add announcements channel"
  git push origin main
  ```
* **Client-Aktualisierung:** Sobald die Zeno-Clients das nächste Mal die Server-Metadaten abfragen (oder auf *Aktualisieren* klicken), wird die neue Kanalliste nahtlos gerendert.

---

## 🔒 7. Datenschutz & Ende-zu-Ende-Verschlüsselung

| Aspekt | Was steht in Git? | Was bleibt privat auf dem Client? |
| :--- | :--- | :--- |
| **Server-Struktur** | Öffentlich (Name, Icon, Kanäle, Relays) | - |
| **Chat-Nachrichten** | ❌ **Niemals im Git-Repo** | Lokal mit **AES-256-GCM** verschlüsselt |
| **Audio/Voice Streams** | ❌ **Niemals im Git-Repo** | **SFrame WebRTC** Ende-zu-Ende verschlüsselt |
| **Private Schlüssel** | ❌ **Niemals im Git-Repo** | Sicher in der lokalen Tauri-Sandbox verwahrt |

---

## 🚀 8. Zusammenfassung

Mit dem Zeno Git-Server-Modell bist du dein eigener Plattform-Betreiber:
1. Manifest `zeno-server.json` in Zeno generieren.
2. Zu GitHub, GitLab oder deiner privaten Gitea-Instanz pushen.
3. Link teilen – Zeno erledigt den Rest dezentral und kryptografisch sicher!
