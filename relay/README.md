# 🛡️ Zeno Zero-Knowledge Blind Relay (`zeno-relay`)

> **Ultraschlanker, blinder WebSocket-Relay-Daemon für das dezentrale Zeno-Kommunikationsnetzwerk.**  
> Konform mit **Art. 10 GG** (Fernmeldegeheimnis), **§ 203 StGB** (Berufsgeheimnisträger) und **Art. 8 EMRK**.

---

## 📌 Was ist `zeno-relay`?

`zeno-relay` ist ein rein ephemerer WebSocket-Transportknoten (*Blind Relay* bzw. *Dumb Pipe*). 
Er leitet verschlüsselte Datenpakete (*Zero-Knowledge Envelopes*) zwischen Zeno-Clients weiter, ohne jemals Einsicht in den Klartext zu haben oder kryptografische Schlüssel zu besitzen.

### 🔒 Garantien für Relay-Betreiber:
1. **0 % Entschlüsselungsfähigkeit:** Alle Nachrichten werden vor dem Senden über das clientseitige **Megolm/MLS-Sender-Key-Verfahren (AES-256-GCM / HMAC-SHA256)** chifffriert. Selbst wenn der Betreiber den physischen Server besitzt, das Betriebssystem kontrolliert oder den Datenverkehr mitschneidet, sieht er ausschließlich unentzifferbaren Chiffretext.
2. **Keine Persistenz & 0 % Festplattenspeicher:** Es gibt weder eine SQLite-, Postgres- noch Redis-Datenbank. Alle Daten existieren ausschließlich als flüchtige Pointer im RAM.
3. **Plausible Deniability:** Symmetrische HMAC-Authentifizierungs-Tags anstelle von starren Identitätssignaturen schützen Absender und Betreiber vor staatlicher Nötigung.
4. **Vollständiger Betreiberschutz:** Durch das nachweisliche Unvermögen, Inhalte zu entschlüsseln, fällt der Relay-Betreiber unter das Provider-Privileg und kann juristisch niemals zur Herausgabe von Klartexten gezwungen werden.

---

## 🚀 Schnellstart

### Option 1: Mit Docker & Docker Compose (Empfohlen, 30 Sekunden)

```bash
cd relay
docker compose up -d
```

Überprüfe den Status:
```bash
docker compose logs -f
curl http://localhost:4242/health
```

---

### Option 2: Direkt mit Node.js / Bun (Bare Metal)

**Voraussetzungen:** Node.js 18+ oder Bun

```bash
cd relay
npm install
npm start
```

Der Relay-Server lauscht standardmäßig auf `ws://0.0.0.0:4242`.

---

### Option 3: Als Linux Systemd-Dienst

1. Ordner auf den Server kopieren (z. B. nach `/opt/zeno-relay`):
   ```bash
   sudo mkdir -p /opt/zeno-relay
   sudo cp -r package.json server.mjs /opt/zeno-relay/
   cd /opt/zeno-relay && sudo npm install --omit=dev
   ```

2. Systemd-Unit installieren und aktivieren:
   ```bash
   sudo cp systemd/zeno-relay.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now zeno-relay
   sudo systemctl status zeno-relay
   ```

---

## 🌐 Reverse Proxy & TLS (WSS)

In der Praxis sollte der Relay über eine TLS-verschlüsselte WebSocket-Verbindung (`wss://`) bereitgestellt werden.

### Caddy (Automatische Let's Encrypt Zertifikate)
```caddyfile
relay.deine-domain.de {
    reverse_proxy localhost:4242
}
```

### Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name relay.deine-domain.de;

    ssl_certificate /etc/letsencrypt/live/relay.deine-domain.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/relay.deine-domain.de/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4242;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

---

## 🧅 Tor .onion Hidden Service

Für maximalen Zensurschutz und Metadaten-Anonymität:

Füge folgende Zeilen in deine `/etc/tor/torrc` ein:
```text
HiddenServiceDir /var/lib/tor/zeno_relay/
HiddenServicePort 80 127.0.0.1:4242
```
Starte Tor neu: `sudo systemctl restart tor`.  
Deine Onion-Adresse findest du in `/var/lib/tor/zeno_relay/hostname`.

---

## ⚙️ Umgebungsvariablen

| Variable | Standardwert | Beschreibung |
| :--- | :--- | :--- |
| `PORT` | `4242` | Port, auf dem der HTTP/WebSocket-Server lauscht |
| `HOST` | `0.0.0.0` | Netzwerk-Interface Bind-Adresse |
| `RATE_LIMIT_PER_MINUTE` | `180` | Maximale Pakete pro Minute und Client-IP |
| `MAX_PAYLOAD_BYTES` | `524288` | Maximalgröße eines Envelopes (512 KB) |
| `CHANNEL_RING_BUFFER_SIZE` | `50` | Anzahl flüchtiger Nachrichten im RAM pro Kanal |

---

## 🩺 Endpunkte

- `GET /` — Informations- und Betreiberseite mit rechtlicher Klarstellung
- `GET /health` — JSON Health-Check (`{"status":"healthy","uptimeSeconds":120}`)
- `GET /metrics` — Prometheus Metriken (`zeno_relay_connected_clients`, `zeno_relay_messages_total`)

---

## 📱 Einbindung in Zeno

Trage deine Relay-Adresse in Zeno ein:
1. Öffne die **Server-Einstellungen** (oder das **Netzwerk-Dashboard**).
2. Füge unter **Relays** deine URL hinzu:
   `wss://relay.deine-domain.de` oder `ws://192.168.1.100:4242`
3. Alle geschützten Kanäle kommunizieren nun automatisch verschlüsselt über dein eigenes Relay!

