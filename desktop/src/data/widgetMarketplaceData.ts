// --- ZENO COMMUNITY WIDGET MARKETPLACE DATA ---
// Open-source widgets indexed from public community repositories

export interface MarketplaceWidget {
  id: string;
  name: string;
  category: "utility" | "dev" | "privacy" | "audio" | "monitoring";
  description: string;
  author: string;
  repoUrl: string;
  version: string;
  stars: number;
  securityStatus: "audited" | "verified_open_source";
  icon: string;
  colSpan: 1 | 2;
  rowSpan: 1 | 2;
  defaultTitle: string;
  customCodeSample: string;
}

export const COMMUNITY_MARKETPLACE_WIDGETS: MarketplaceWidget[] = [
  {
    id: "system-perf-monitor",
    name: "System Performance Monitor",
    category: "monitoring",
    description: "Echtzeit-Anzeige für CPU, RAM, Speicher und Netzwerk-Auslastung deines PCs.",
    author: "CyberDev-Community",
    repoUrl: "https://github.com/Zeno-Network/widget-system-perf",
    version: "v1.2.0",
    stars: 342,
    securityStatus: "audited",
    icon: "mage:cpu",
    colSpan: 1,
    rowSpan: 1,
    defaultTitle: "🖥️ System Performance",
    customCodeSample: `<div style="font-family: monospace; font-size: 11px; color: #00FF87;">
  <div>CPU Core Load: 12% [||||.......]</div>
  <div>RAM Usage: 4.2 GB / 16 GB</div>
  <div>Net Traffic: 1.2 MB/s</div>
</div>`
  },
  {
    id: "crypto-todo-notes",
    name: "E2EE Crypto Scratchpad",
    category: "utility",
    description: "Ende-zu-Ende verschlüsselte Notizen & Aufgabenliste direkt auf deinem Dashboard.",
    author: "Zeno-Core-Team",
    repoUrl: "https://github.com/Zeno-Network/widget-crypto-notes",
    version: "v2.0.1",
    stars: 890,
    securityStatus: "audited",
    icon: "mage:edit",
    colSpan: 1,
    rowSpan: 1,
    defaultTitle: "📝 Crypto Notizen & Tasks",
    customCodeSample: `<div style="font-size: 12px; color: var(--text-primary);">
  <div style="margin-bottom: 4px;">✓ AIN Keypair generiert</div>
  <div style="margin-bottom: 4px;">✓ AES-256-GCM Vault aktiv</div>
  <div>○ Server-Manifest v2 prüfen</div>
</div>`
  },
  {
    id: "webhook-pinger",
    name: "API & Webhook Health Checker",
    category: "dev",
    description: "Überwache deine lokalen Server, APIs und Webhooks mit automatischem Ping-Status.",
    author: "NodeNaut",
    repoUrl: "https://github.com/Zeno-Network/widget-webhook-pinger",
    version: "v1.0.4",
    stars: 215,
    securityStatus: "verified_open_source",
    icon: "mage:wifi-full",
    colSpan: 1,
    rowSpan: 1,
    defaultTitle: "🌐 Webhook & Server Status",
    customCodeSample: `<div style="font-size: 11px; color: var(--text-secondary);">
  <div style="color: #00E676;">● Localhost API: 200 OK (4ms)</div>
  <div style="color: #00E676;">● Cloudflare Relay: 200 OK (12ms)</div>
</div>`
  },
  {
    id: "spotify-media-controller",
    name: "Spotify & Audio Player Widget",
    category: "audio",
    description: "Steuere deine Musik und erstelle Playlists für konzentriertes Coden.",
    author: "BeatNaut",
    repoUrl: "https://github.com/Zeno-Network/widget-spotify-controller",
    version: "v1.1.2",
    stars: 560,
    securityStatus: "audited",
    icon: "mage:play",
    colSpan: 1,
    rowSpan: 1,
    defaultTitle: "🎧 Audio & Playlist Control",
    customCodeSample: `<div style="font-size: 12px; color: var(--text-primary); text-align: center;">
  <div style="font-weight: 700; color: #00DFD8;">Synthwave Beats 2026</div>
  <div style="font-size: 10px; color: var(--text-muted);">Cyberpunk Audio Stream</div>
</div>`
  }
];
