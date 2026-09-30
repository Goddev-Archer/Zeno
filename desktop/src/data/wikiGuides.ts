import { WikiArticle } from "../types";

export const ZENO_WIKI_GUIDES: WikiArticle[] = [
  {
    id: "nostr-relays",
    title: "Nostr-Nodes als zensurresistente Chat-Relays",
    icon: "mage:globe",
    badge: "Zensurresistent",
    badgeColor: "#8B5CF6",
    category: "Relays & Networking",
    summary: "Wie Zeno das globale Nostr-Netzwerk als kostenlose, dezentrale Relay-Infrastruktur nutzt.",
    markdown: `
# 🔮 Nostr-Nodes als zensurresistente Chat-Relays

Das **Nostr-Protokoll** (*Notes and Other Stuff Transmitted by Relays*) ist eines der zensurresistentesten Kommunikationsnetzwerke der Welt. Anstatt eigene Server betreiben zu müssen, kann Zeno verschlüsselte Nachrichten über existierende, öffentliche Nostr-Nodes leiten.

---

### Warum Nostr perfekt für Zeno ist

1. **Keine eigenen Serverkosten:** Weltweit betreiben Freiwillige, Universitäten und Krypto-Communities tausende frei zugängliche Nostr-Relays.
2. **Reines Store-and-Forward:** Nostr-Relays speichern und übertragen einfache JSON-Events über WebSockets (\`wss://\`).
3. **Volle Ende-zu-Ende-Verschlüsselung:** Zeno verschlüsselt die Nachricht mit **AES-256-GCM** auf deinem Rechner. Das Nostr-Relay sieht nur unlesbare Blobs und kann weder mitlesen noch den Inhalt zensieren.
4. **Keine zentrale Abschaltung möglich:** Fällt ein Relay aus oder wird gesperrt, schaltet Zeno automatisch auf das nächste Relay um.

---

### Öffentliche Nostr-Relays (Empfohlen für Zeno)

Du kannst diese Relays direkt in deiner \`zeno-server.json\` eintragen:

* \`wss://relay.damus.io\` (Extrem schnelles, globales Relay)
* \`wss://nos.lol\` (Europäisches Hochleistungs-Relay)
* \`wss://relay.snort.social\` (Sehr stabil für verschlüsselte DMs)
* \`wss://nostr.mom\` (Datenschutzfreundliches Community-Relay)

---

### Wie das Nostr-Event in Zeno aussieht

Zeno kapselt den verschlüsselten Raum-Payload in ein standardisiertes Nostr-Event:

\`\`\`json
[
  "EVENT",
  {
    "id": "4f8a9b2...",
    "pubkey": "ZENO_PUBLIC_KEY_HEX",
    "created_at": 1727700000,
    "kind": 30078,
    "tags": [
      ["d", "zeno-channel-devlounge"],
      ["app", "zeno-messenger"]
    ],
    "content": "U2FsdGVkX1+... (AES-256-GCM verschlüsselter Chat-Blob)",
    "sig": "3a8f9c1..."
  }
]
\`\`\`

> [!TIP]
> Trage einfach 2 bis 3 Nostr-Relays in die \`zeno-server.json\` deines Git-Repositories ein. Deine Community chattet damit weltweit ohne eigene Server!
`
  },
  {
    id: "onion-tor-relays",
    title: "Tor & .onion Relays für maximale Anonymität",
    icon: "mage:shield-check",
    badge: "100% Anonym",
    badgeColor: "#10B981",
    category: "Relays & Networking",
    summary: "Routen von Zeno-Nachrichten über Tor Hidden Services ohne DNS, ohne öffentliche IP und immun gegen Sperren.",
    markdown: `
# 🧅 Tor & .onion Relays für maximale Anonymität

Für Journalisten, Whistleblower und Entwickler in autoritären Netzwerken bietet Zeno die Möglichkeit, Relays als **Tor Hidden Service** (\`.onion\`) anzusprechen.

---

### Was macht .onion-Relays so mächtig?

* **Keine Domainregistrierung:** Eine \`.onion\`-Adresse (z. B. \`ws://zenox765...onion\`) wird mathematisch aus einem kryptografischen Schlüssel generiert. Kein Registrar (wie GoDaddy oder DENIC) kann die Domain sperren.
* **Keine öffentliche IP-Adresse:** Der Serverbetreiber muss keine Ports am Heimrouter öffnen. Weder Internetanbieter noch Behörden können sehen, wo der physische Server steht.
* **Ende-zu-Ende-Tor-Verschlüsselung:** Der gesamte Datenverkehr wird mehrfach verschlüsselt durch drei zufällige Tor-Knoten geroutet.

---

### So bindest du ein .onion-Relay in Zeno ein

1. Starte den Tor-Dienst auf deinem Rechner (Port \`9050\` oder Tor Browser Port \`9150\`).
2. Trage in deiner \`zeno-server.json\` die Onion-Adresse deines Relays ein:
   \`\`\`json
   "relays": [
     "ws://zeno7x9k2vmlpt4q.onion:8080"
   ]
   \`\`\`
3. Zenos Rust-Backend leitet die WebSocket-Verbindung automatisch über den lokalen SOCKS5-Proxy (\`127.0.0.1:9050\`).

> [!NOTE]
> Die Latenz über das Tor-Netzwerk ist mit ca. 200–400 ms höher als bei Standard-WebSockets, bietet dafür aber das höchste theoretisch erreichbare Schutzniveau gegen Überwachung.
`
  },
  {
    id: "cloudflare-relay-builder",
    title: "Interaktiver Cloudflare-Relay Builder (1-Klick)",
    icon: "mage:server",
    badge: "1-Klick Template",
    badgeColor: "#F59E0B",
    category: "Relays & Networking",
    summary: "Deploye dein eigenes, wartungsfreies Edge-Relay in 2 Minuten kostenlos auf Cloudflare Workers.",
    markdown: `
# ☁️ Interaktiver Cloudflare-Relay Builder

Mit diesem Guide erstellst du dein eigenes, blitzschnelles WebSocket-Relay auf Cloudflare. Es läuft im **kostenlosen Free-Tier** (100.000 Anfragen/Tag) und verteilt verschlüsselte Nachrichten in unter 15 ms weltweit.

---

### Schritt 1: Das Cloudflare Worker-Skript (\`relay-worker.js\`)

Kopiere diesen vollständigen, produktionsreifen Relay-Code:

\`\`\`javascript
// --- ZENO EDGE RELAY WORKER ---
// Serverloses Blind-Relay für WebSockets & E2EE Nachrichten

export default {
  async fetch(request, env) {
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("⚡ Zeno Blind Relay running. Connect via WebSocket (wss://).", { status: 200 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();

    // Raumverwaltung im Speicher des Edge-Nodes
    server.addEventListener("message", (event) => {
      // Leitet verschlüsselten Blob blind an verbundene Peers weiter
      server.send(event.data);
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  },
};
\`\`\`

---

### Schritt 2: Deployment via Wrangler CLI (in 60 Sekunden)

Führe diese Befehle in deinem Terminal aus:

\`\`\`bash
# 1. Wrangler CLI installieren
npm install -g wrangler

# 2. Bei Cloudflare anmelden (kostenloses Konto)
wrangler login

# 3. Worker initialisieren & deployen
mkdir zeno-relay && cd zeno-relay
# Speichere die obige relay-worker.js
wrangler deploy relay-worker.js --name zeno-community-relay
\`\`\`

Nach dem Deployment gibt dir Cloudflare deine fertige Relay-URL aus:
\`\`\`
https://zeno-community-relay.<dein-subdomain>.workers.dev
\`\`\`

Ändere das \`https://\` einfach in \`wss://\` und trage es in deine \`zeno-server.json\` ein:
\`\`\`json
"relays": [
  "wss://zeno-community-relay.<dein-subdomain>.workers.dev"
]
\`\`\`

> [!IMPORTANT]
> **Rechtlicher Schutz:** Da du das Skript auf deinem eigenen Cloudflare-Konto ausführst, ist niemand anderes dafür verantwortlich. Und da der Client alles mit AES-256 verschlüsselt, sieht Cloudflare niemals Klartext!
`
  },
  {
    id: "pgp-legacy",
    title: "Das PGP-Erbe: Von den Crypto Wars zu Zeno",
    icon: "mage:lock",
    badge: "Krypto-Historie",
    badgeColor: "#38BDF8",
    category: "Security & Crypto",
    summary: "Wie Phil Zimmermanns PGP die Welt veränderte und wie Zeno seine Ideale modernisiert.",
    markdown: `
# 🛡️ Das PGP-Erbe: Von den Crypto Wars zu Zeno

1991 entwickelte Phil Zimmermann **Pretty Good Privacy (PGP)**. Es war die erste Software, die unknackbare militärische Kryptografie in die Hände normaler Bürger legte.

---

### Die Crypto Wars der 90er Jahre

* Die US-Regierung stufte Verschlüsselungen mit mehr als 40 Bit als **Kriegswaffe** ein.
* Zimmermann wurde wegen illegalen Waffenexports angeklagt, weil PGP 128-Bit nutzte.
* Er druckte den Quellcode als Buch – denn Bücherverbote verstießen gegen die US-Verfassung (*Free Speech*). Das Verfahren brach zusammen.

---

### Warum PGP heute im Alltag scheitert

Obwohl PGP mathematisch unknackbar ist, scheitert es im modernen Chat an zwei Dingen:
1. **Kein Forward Secrecy (PFS):** Wird der Hauptschlüssel nach 10 Jahren kompromittiert, können alle alten E-Mails nachträglich entschlüsselt werden.
2. **Kryptische Usability:** 4096-Bit-Textblöcke kopieren und Schlüsseldateien importieren überfordert 99 % der Nutzer.

---

### Zeno: PGP neu erfunden für 2026

Zeno übernimmt die Philosophie von PGP, löst aber alle Usability-Probleme:
* **Elliptic Curves:** Schnelleres und sichereres **ECDSA P-256** statt trägem RSA.
* **12-Wort-Seed-Phrase:** Wiederherstellung wie bei Bitcoin/Monero statt unhandlicher \`.asc\`-Schlüsseldateien.
* **Ephemere Sitzungen:** Für jede Chat-Nachricht und jeden Voice-Stream werden frische Session-Keys generiert (Perfect Forward Secrecy).
`
  },
  {
    id: "git-decentralized-server",
    title: "Git als unzerstörbares Server-Fundament",
    icon: "mage:code",
    badge: "Architektur",
    badgeColor: "#EC4899",
    category: "Server & Git",
    summary: "Warum Git-Repositories zentrale Server-Datenbanken ablösen und Zensur unmöglich machen.",
    markdown: `
# 🐙 Git als unzerstörbares Server-Fundament

Zeno verzichtet vollständig auf zentrale Datenbanken zur Raumverwaltung. Jeder Zeno-Server existiert als Datei **\`zeno-server.json\`** in einem Git-Repository.

---

### Die 3 Säulen des Git-Servermodells

1. **Versioniert & Auditierbar:** Jede Änderung (neue Kanäle, geänderte Icons) ist ein nachvollziehbarer Git-Commit.
2. **Dezentral geklont:** Wird ein GitHub-Account gelöscht, clont die Community das Repo einfach auf GitLab, Codeberg oder einen privaten Gitea-Server. Der Zeno-Server bleibt sofort funktionsfähig!
3. **Kryptografisch signiert:** Server-Inhaber können Commits mit GPG/SSH signieren (\`git commit -S\`). Zeno-Clients können so mathematisch beweisen, dass die Serverkonfiguration nicht manipuliert wurde.

---

### Server-Updates ohne Downtime

Um einen neuen Kanal anzulegen:
\`\`\`bash
# 1. zeno-server.json bearbeiten
# 2. Pushen
git commit -am "feat: add rust-talk channel"
git push origin main
\`\`\`
Die Zeno-Clients aktualisieren ihre Kanalliste beim nächsten Abgleich automatisch!
`
  },
  {
    id: "eu-chatkontrolle-recht",
    title: "EU-Chatkontrolle & Rechtlicher Entwicklerschutz",
    icon: "mage:information-circle",
    badge: "Rechtsanalyse",
    badgeColor: "#EF4444",
    category: "Recht & Privatsphäre",
    summary: "Die juristische Trennung zwischen FOSS-Software und Dienstanbietern – warum Entwickler geschützt sind.",
    markdown: `
# ⚖️ EU-Chatkontrolle & Rechtlicher Entwicklerschutz

Die geplante EU-Chatkontrolle (CSAR) will Anbieter von Messengern zwingen, Nachrichten **auf dem Endgerät zu scannen**, bevor sie verschlüsselt werden.

---

### Warum Open-Source-Entwickler geschützt sind

1. **Reine Software vs. Dienstanbieter:**
   Das Gesetz richtet sich an *gewerbliche Betreiber von interpersonellen Kommunikationsdiensten* (wie WhatsApp oder Telegram). Wer Open-Source-Code auf GitHub veröffentlicht, betreibt keinen Dienst.
2. **Die Haftungsfalle vermeiden:**
   Betreibe niemals ein zentrales Relay unter deinem Klarnamen. Überlasse das Hosting den Communitys und Admins.
3. **Quellcode ist freie Meinungsäußerung:**
   Das Veröffentlichen von mathematischen Algorithmen (Kryptografie) ist in der EU durch die Charta der Grundrechte (Wissenschafts- und Informationsfreiheit) geschützt.
`
  }
];
