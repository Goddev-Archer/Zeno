#!/usr/bin/env node
// ============================================================================
//   ZENO ZERO-KNOWLEDGE BLIND RELAY DAEMON (v1.0.0)
//   Architektur: Ephemerer In-Memory WebSocket-Transport (Zero-Knowledge Dumb Pipe)
//   Rechtliche Einordnung: Betreiberschutz gemäß Art. 10 GG / § 203 StGB / Art. 8 EMRK
// ============================================================================

import http from "node:http";

// Dynamic import of 'ws' for resilience & clear error reporting
let WebSocketServer, WebSocket;
try {
  const wsModule = await import("ws");
  WebSocketServer = wsModule.WebSocketServer || wsModule.default?.WebSocketServer;
  WebSocket = wsModule.WebSocket || wsModule.default?.WebSocket;
} catch (err) {
  console.error("❌ Das Paket 'ws' ist nicht installiert.");
  console.error("👉 Bitte führe im Verzeichnis 'relay/' folgendes aus: npm install");
  process.exit(1);
}

// --- KONFIGURATION & UMGEBUNGSVARIABLEN ---
const PORT = parseInt(process.env.PORT || "4242", 10);
const HOST = process.env.HOST || "0.0.0.0";
const MAX_PAYLOAD_BYTES = parseInt(process.env.MAX_PAYLOAD_BYTES || "524288", 10); // 512 KB
const RATE_LIMIT_PER_MINUTE = parseInt(process.env.RATE_LIMIT_PER_MINUTE || "120", 10);
const RING_BUFFER_SIZE = parseInt(process.env.CHANNEL_RING_BUFFER_SIZE || "50", 10);

// --- IN-MEMORY STATISTIKEN & LAUFZEITDATEN (KEIN DISK-SPEICHER) ---
const startTime = Date.now();
let totalMessagesRelayed = 0;
let totalBytesRelayed = 0;

// Client- und Kanalverwaltung (Reine Speicher-Pointer, null Persistenz)
// socket -> Set<channelId>
const clientSubscriptions = new Map();
// channelId -> Array<envelope> (Ring-Buffer für flüchtiges Catch-up)
const ephemeralChannelBuffers = new Map();
// Rate-Limiting: IP -> { count: number, resetAt: number }
const ipRateLimits = new Map();

/**
 * Überprüft das Rate-Limit einer Remote-IP-Adresse
 */
function checkRateLimit(ip) {
  const now = Date.now();
  let record = ipRateLimits.get(ip);
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + 60000 };
    ipRateLimits.set(ip, record);
    return true;
  }
  record.count += 1;
  return record.count <= RATE_LIMIT_PER_MINUTE;
}

// Aufräumen abgelaufener Rate-Limit-Einträge alle 5 Minuten
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRateLimits.entries()) {
    if (now > record.resetAt) ipRateLimits.delete(ip);
  }
}, 300000);

/**
 * Speichert ein verschlüsseltes Envelope im ephemeren Ring-Buffer
 */
function pushToChannelRingBuffer(channelId, envelope) {
  if (!channelId) return;
  if (!ephemeralChannelBuffers.has(channelId)) {
    ephemeralChannelBuffers.set(channelId, []);
  }
  const buffer = ephemeralChannelBuffers.get(channelId);
  buffer.push(envelope);
  if (buffer.length > RING_BUFFER_SIZE) {
    buffer.shift();
  }
}

// --- HTTP SERVER FÜR HEALTHCHECKS & METRIKEN ---
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        daemon: "zeno-relay",
        version: "1.0.0",
        clientsConnected: wss.clients.size,
        activeChannels: ephemeralChannelBuffers.size,
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000)
      })
    );
    return;
  }

  if (url.pathname === "/metrics") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    res.end(
      `# HELP zeno_relay_connected_clients Aktuelle Anzahl verbundener WebSocket-Clients\n` +
      `# TYPE zeno_relay_connected_clients gauge\n` +
      `zeno_relay_connected_clients ${wss.clients.size}\n\n` +
      `# HELP zeno_relay_messages_total Gesamtzahl blind weitergeleiteter Envelopes\n` +
      `# TYPE zeno_relay_messages_total counter\n` +
      `zeno_relay_messages_total ${totalMessagesRelayed}\n\n` +
      `# HELP zeno_relay_bytes_total Gesamtes übertragenes Datenvolumen in Bytes\n` +
      `# TYPE zeno_relay_bytes_total counter\n` +
      `zeno_relay_bytes_total ${totalBytesRelayed}\n\n` +
      `# HELP zeno_relay_uptime_seconds Daemon-Laufzeit in Sekunden\n` +
      `# TYPE zeno_relay_uptime_seconds gauge\n` +
      `zeno_relay_uptime_seconds ${uptime}\n`
    );
    return;
  }

  // Root Info-Seite (Rechtliche Erklärung & Status)
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Zeno Zero-Knowledge Relay</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f1015; color: #e3e4e8; padding: 2.5rem; max-width: 760px; margin: 0 auto; line-height: 1.6; }
    h1 { color: #528bff; margin-bottom: 0.5rem; }
    .badge { display: inline-block; background: #26282e; color: #57b6c2; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.85rem; font-family: monospace; }
    .card { background: #18191b; border: 1px solid #26282e; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; }
    .legal { background: #131418; border-left: 4px solid #6897bb; padding: 1rem 1.2rem; font-size: 0.9rem; color: #b0b4be; }
    code { background: #26282e; padding: 0.2rem 0.4rem; border-radius: 4px; color: #98c379; }
  </style>
</head>
<body>
  <h1>🛡️ Zeno Zero-Knowledge Relay</h1>
  <p><span class="badge">Status: Aktiv</span> &nbsp; <span class="badge">Protokoll: zeno-zk-v1 / Nostr NIP-01</span></p>
  
  <div class="card">
    <h3>📡 Relay-Metriken</h3>
    <ul>
      <li>Verbundene Clients: <strong>${wss.clients.size}</strong></li>
      <li>Weitergeleitete Envelopes: <strong>${totalMessagesRelayed}</strong></li>
      <li>Laufzeit: <strong>${Math.floor((Date.now() - startTime) / 1000)} Sekunden</strong></li>
      <li>Speicherung: <strong>0% (Ausschließlich RAM-Flüchtigkeit)</strong></li>
    </ul>
  </div>

  <div class="legal">
    <h4>⚖️ Rechtliche Betreiber-Erklärung (Fernmeldegeheimnis Art. 10 GG / § 203 StGB)</h4>
    <p>
      Dieser Server agiert als reines blinder Durchleiter (<em>Blind Relay / Dumb Pipe</em>). 
      Alle Nachrichten werden clientseitig über das Megolm/MLS-Sender-Key-Verfahren chifffriert (AES-256-GCM / HMAC-SHA256).
      Der Betreiber dieser Hardware besitzt zu keinem Zeitpunkt Entschlüsselungsschlüssel und ist technisch 
      außerstande, Nachrichteninhalte einzusehen, zu protokollieren oder offenzulegen.
    </p>
  </div>
</body>
</html>
  `);
});

// --- WEBSOCKET SERVER INITIALISIERUNG ---
const wss = new WebSocketServer({
  server,
  maxPayload: MAX_PAYLOAD_BYTES
});

wss.on("connection", (ws, req) => {
  const remoteIp = req.socket.remoteAddress || "unknown";
  clientSubscriptions.set(ws, new Set());

  ws.on("message", (rawMessage) => {
    // 1. Rate-Limit prüfen
    if (!checkRateLimit(remoteIp)) {
      try {
        ws.send(JSON.stringify({ type: "error", code: 429, message: "Rate limit überschritten." }));
      } catch {}
      return;
    }

    const byteLength = Buffer.byteLength(rawMessage);
    totalBytesRelayed += byteLength;
    totalMessagesRelayed += 1;

    let parsed;
    try {
      parsed = JSON.parse(rawMessage.toString());
    } catch {
      // Ignoriere nicht-JSON Daten
      return;
    }

    // 2. Kanal-Abonnement annehmen
    // Typ: { type: "subscribe", channelId: string }
    if (parsed.type === "subscribe" && parsed.channelId) {
      const subs = clientSubscriptions.get(ws) || new Set();
      subs.add(parsed.channelId);
      clientSubscriptions.set(ws, subs);

      // Sende die letzten flüchtigen Envelopes aus dem Ring-Buffer
      const cached = ephemeralChannelBuffers.get(parsed.channelId) || [];
      for (const envelope of cached) {
        try {
          ws.send(JSON.stringify(envelope));
        } catch {}
      }
      return;
    }

    // 3. Nostr NIP-01 REQ Filter-Handling
    if (Array.isArray(parsed) && parsed[0] === "REQ" && parsed[1]) {
      const subId = parsed[1];
      const filter = parsed[2] || {};
      const targetChannel = filter["#e"]?.[0] || filter.tags?.e || null;

      if (targetChannel) {
        const subs = clientSubscriptions.get(ws) || new Set();
        subs.add(targetChannel);
        clientSubscriptions.set(ws, subs);
      }

      // Sende EOSE (End of Stored Events)
      try {
        ws.send(JSON.stringify(["EOSE", subId]));
      } catch {}
      return;
    }

    // 4. Nostr NIP-01 CLOSE Handling
    if (Array.isArray(parsed) && parsed[0] === "CLOSE") {
      return;
    }

    // 5. Zero-Knowledge Blind Envelope Weiterleitung
    // Typen: zeno_zk_envelope, zeno_sender_key_distribution, zeno_message, zeno_profile_sync, Nostr EVENT
    let targetChannelId = null;

    if (parsed.type === "zeno_zk_envelope" && parsed.envelope) {
      targetChannelId = parsed.envelope.channelId;
      pushToChannelRingBuffer(targetChannelId, parsed);
    } else if (parsed.type === "zeno_sender_key_distribution") {
      targetChannelId = parsed.channelId;
    } else if (parsed.type === "zeno_message" && parsed.envelope) {
      targetChannelId = parsed.envelope.channelId;
      pushToChannelRingBuffer(targetChannelId, parsed);
    } else if (Array.isArray(parsed) && parsed[0] === "EVENT" && parsed[1]) {
      const eventObj = parsed[1];
      const eTag = eventObj.tags?.find((t) => t[0] === "e");
      if (eTag) targetChannelId = eTag[1];
    }

    // Blindes Multicasting an alle interessierten Clients (ohne Entschlüsselung)
    const outgoingPayload = typeof rawMessage === "string" ? rawMessage : rawMessage.toString();

    for (const client of wss.clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        const subs = clientSubscriptions.get(client);
        // Falls der Client keine spezifischen Filter hat oder den Kanal abonniert hat
        if (!targetChannelId || !subs || subs.size === 0 || subs.has(targetChannelId)) {
          try {
            client.send(outgoingPayload);
          } catch (sendErr) {
            // Verbindung möglicherweise abrupt getrennt
          }
        }
      }
    }
  });

  ws.on("close", () => {
    clientSubscriptions.delete(ws);
  });

  ws.on("error", () => {
    clientSubscriptions.delete(ws);
  });
});

// --- SERVER START & BANNER ---
server.listen(PORT, HOST, () => {
  console.log("==================================================================");
  console.log(" 🛡️  ZENO ZERO-KNOWLEDGE BLIND RELAY DAEMON v1.0.0 GESTARTET");
  console.log("==================================================================");
  console.log(` 🌐 Lauscht auf:             ws://${HOST}:${PORT}`);
  console.log(` 🩺 Health-Check Endpunkt:   http://${HOST}:${PORT}/health`);
  console.log(` 📊 Prometheus Metriken:    http://${HOST}:${PORT}/metrics`);
  console.log(` 🔒 Kryptografische Schicht: Megolm / MLS Sender Keys (AES-256-GCM)`);
  console.log(` ⚖️  Rechtlicher Status:     Art. 10 GG (Fernmeldegeheimnis) / § 203 StGB`);
  console.log(` 💾 Datenspeicherung:        0% (Ausschließlich RAM-Flüchtigkeit)`);
  console.log("==================================================================");
});

// Sanfter Shutdown bei Signalen
function gracefulShutdown(signal) {
  console.log(`\n🛑 Signal ${signal} empfangen. Beende Zeno Relay geordnet...`);
  wss.close(() => {
    server.close(() => {
      console.log("✅ Zeno Relay erfolgreich gestoppt.");
      process.exit(0);
    });
  });
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

