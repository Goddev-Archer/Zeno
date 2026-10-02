// --- ZENO DECENTRALIZED INSTANCES & SERVER DIRECTORY CATALOG ---
// Curated list of public, decentralized Git-based Zeno server instances.

import { Server, Category } from "../types";

export interface InstanceDirectoryEntry {
  id: string;
  name: string;
  iconLetter: string;
  icon: string;
  category: "Core & Privacy" | "Entwicklung" | "Privacy & Tor" | "FOSS & Linux" | "Gaming & Voice";
  description: string;
  longDescription: string;
  memberCount: number;
  tags: string[];
  bannerGradient: string;
  isOfficial?: boolean;
  gitRepo: {
    provider: "github" | "gitlab" | "gitea";
    repoUrl: string;
    branch: string;
    manifestPath: string;
  };
  relays: string[];
  sampleCategories: Array<{
    name: string;
    type: "text" | "voice";
    channelNames: string[];
  }>;
}

export const CURATED_INSTANCES: InstanceDirectoryEntry[] = [
  {
    id: "zeno-inst-core",
    name: "Zeno Sovereign Core",
    iconLetter: "🛡️",
    icon: "🛡️",
    category: "Core & Privacy",
    description: "Offizielle Zeno-Zentralinstanz für Protokoll-Updates, Zero-Knowledge-Identitäten und dezentrales Testnet.",
    longDescription: "Die offizielle Hauptinstanz des Zeno-Netzwerks. Hier werden neue kryptografische Spezifikationen, E2EE-Relay-Architekturen und Sovereign-Identitäten diskutiert und live getestet. Keine zentralen Logs, vollständige P2P-Transparenz.",
    memberCount: 1420,
    tags: ["Official", "Zero-Knowledge", "Nostr-Mesh", "E2EE"],
    bannerGradient: "linear-gradient(135deg, #1E222D 0%, #3574F0 100%)",
    isOfficial: true,
    gitRepo: {
      provider: "github",
      repoUrl: "https://github.com/zeno-network/instance-sovereign-core",
      branch: "main",
      manifestPath: "zeno-server.json"
    },
    relays: ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.snort.social"],
    sampleCategories: [
      {
        name: "ANKÜNDIGUNGEN & CORE",
        type: "text",
        channelNames: ["ankündigungen", "release-notes", "roadmap-2026"]
      },
      {
        name: "COMMUNITY & DEV",
        type: "text",
        channelNames: ["allgemein", "feedback-lounge", "bug-bounty"]
      },
      {
        name: "SPRACHKANÄLE (WEBRTC)",
        type: "voice",
        channelNames: ["Sovereign Lounge Alpha", "Community Round Table"]
      }
    ]
  },
  {
    id: "zeno-inst-rustaceans",
    name: "Rustaceans & WASM Lab",
    iconLetter: "🦀",
    icon: "🦀",
    category: "Entwicklung",
    description: "Rust-Entwickler, WebAssembly-Pioniere, Systems-Programming und integriertes WASI-Debugging.",
    longDescription: "Treffpunkt für Low-Level-Programmierer. Tausche dich über Rust Tokio Async, Tauri v2 Architecture, WASM Sandboxing, Crate Releases und Memory-Safety-Algorithmen aus.",
    memberCount: 894,
    tags: ["Rust", "WASM", "Tokio", "Tauri", "Systems"],
    bannerGradient: "linear-gradient(135deg, #381A08 0%, #D45A25 100%)",
    gitRepo: {
      provider: "github",
      repoUrl: "https://github.com/zeno-network/instance-rustaceans",
      branch: "main",
      manifestPath: "zeno-server.json"
    },
    relays: ["wss://nos.lol", "wss://relay.damus.io"],
    sampleCategories: [
      {
        name: "RUST ENTWICKLUNG",
        type: "text",
        channelNames: ["rust-core", "tokio-async", "crate-showcase", "wasm-wasi"]
      },
      {
        name: "SYSTEM ARCHITEKTUR",
        type: "text",
        channelNames: ["crypto-primitives", "p2p-mesh", "performance-benchmarks"]
      },
      {
        name: "PAIR PROGRAMMING AUDIO",
        type: "voice",
        channelNames: ["Pair Programming #1", "Code Review Stage"]
      }
    ]
  },
  {
    id: "zeno-inst-cypherpunk",
    name: "Cypherpunk Tor Mesh",
    iconLetter: "🧅",
    icon: "🧅",
    category: "Privacy & Tor",
    description: "Maximale Anonymität. Routing über Tor Hidden Services (.onion) und E2EE-Nostr-Relays. Kein Log, kein Tracking.",
    longDescription: "Gewidmet dem Geist des Cypherpunk-Manifests von Eric Hughes: 'Privacy is necessary for an open society in the electronic age.' Alle Nachrichten durchlaufen Tor-Sockets und Onion-Relays.",
    memberCount: 612,
    tags: ["Tor", "Onion", "Anonymity", "Zero-Log", "Cypherpunk"],
    bannerGradient: "linear-gradient(135deg, #16101E 0%, #7928CA 100%)",
    gitRepo: {
      provider: "gitea",
      repoUrl: "https://codeberg.org/cypherpunk/zeno-tor-instance",
      branch: "main",
      manifestPath: "zeno-server.json"
    },
    relays: ["ws://zeno4tor267hidden.onion", "wss://relay.damus.io"],
    sampleCategories: [
      {
        name: "OPSEC & KRYPTOGRAFIE",
        type: "text",
        channelNames: ["darknet-discussions", "opsec-audit", "pgp-keys", "zero-knowledge"]
      },
      {
        name: "DEZENTRALE FREIHEIT",
        type: "text",
        channelNames: ["freie-kommunikation", "anti-zensur", "whistleblower-tech"]
      },
      {
        name: "ENCRYPTED VOICE",
        type: "voice",
        channelNames: ["Noise-Shrouded Voice", "Whisper Room"]
      }
    ]
  },
  {
    id: "zeno-inst-foss",
    name: "FOSS & Linux Collective",
    iconLetter: "🐧",
    icon: "🐧",
    category: "FOSS & Linux",
    description: "Open-Source-Enthusiasten, Arch/Debian/NixOS-Nutzer, Self-Hosting & F-Droid-App-Entwicklung.",
    longDescription: "Die Heimat freier Software. Ob GNU/Linux Kernel, NixOS Flakes, F-Droid Build-Rezepte, Self-Hosting auf Raspberry Pis oder Nextcloud — 100% quelloffen und frei von proprietärem Ballast.",
    memberCount: 1105,
    tags: ["Linux", "F-Droid", "OpenSource", "Self-Host", "GPL"],
    bannerGradient: "linear-gradient(135deg, #0F1411 0%, #00FF87 100%)",
    gitRepo: {
      provider: "gitlab",
      repoUrl: "https://gitlab.com/foss-community/zeno-linux-collective",
      branch: "main",
      manifestPath: "zeno-server.json"
    },
    relays: ["wss://relay.damus.io", "wss://nos.lol"],
    sampleCategories: [
      {
        name: "LINUX & FOSS",
        type: "text",
        channelNames: ["distro-talk", "nixos-flakes", "self-hosted", "f-droid-packaging"]
      },
      {
        name: "HARDWARE & SYSADMIN",
        type: "text",
        channelNames: ["homelab-hardware", "wireguard-vpn", "docker-compose"]
      },
      {
        name: "AUDIO LOUNGE",
        type: "voice",
        channelNames: ["Linux Stammtisch", "Hardware Bastelrunde"]
      }
    ]
  },
  {
    id: "zeno-inst-local-ai",
    name: "Local AI & Private Agents",
    iconLetter: "🧠",
    icon: "🧠",
    category: "Entwicklung",
    description: "Community für lokale Sprachmodelle (llama.cpp, Ollama, ONNX Runtime) und datenschutzfreundliche KI-Tools.",
    longDescription: "Künstliche Intelligenz ohne Datenabfluss an Big Tech. Diskussionen über GGUF-Quantisierung, lokale RAG-Pipelines, dezentrale Inferenz und agentische Assistenten auf eigener Hardware.",
    memberCount: 740,
    tags: ["Local-AI", "Ollama", "llama.cpp", "GGUF", "Private-ML"],
    bannerGradient: "linear-gradient(135deg, #1F1B24 0%, #9A5334 100%)",
    gitRepo: {
      provider: "github",
      repoUrl: "https://github.com/zeno-network/instance-local-ai",
      branch: "main",
      manifestPath: "zeno-server.json"
    },
    relays: ["wss://relay.snort.social", "wss://nos.lol"],
    sampleCategories: [
      {
        name: "LOKALE MODELLE",
        type: "text",
        channelNames: ["modelle-und-benchmarks", "ollama-setup", "rag-and-vectors"]
      },
      {
        name: "AGENTISCHES CODING",
        type: "text",
        channelNames: ["offline-copilots", "prompts-and-evals", "edge-inference"]
      },
      {
        name: "VOICE LAB",
        type: "voice",
        channelNames: ["AI Round Table", "GPU Workstation Talk"]
      }
    ]
  },
  {
    id: "zeno-inst-gaming",
    name: "P2P Voice & Gaming Lounge",
    iconLetter: "🎮",
    icon: "🎮",
    category: "Gaming & Voice",
    description: "Ultra-Low-Latency WebRTC Sprachkanäle, Gaming-Sessions und lockerer Austausch mit Kristall-Klang.",
    longDescription: "Kein Discord-Tracking mehr beim Gaming. Reine P2P WebRTC Audioübertragung mit automatischer Echo-Unterdrückung und VAD. Perfekt für Coop-Sessions, Indie-Games und LAN-Partys.",
    memberCount: 980,
    tags: ["WebRTC", "Voice", "Gaming", "Low-Latency", "P2P"],
    bannerGradient: "linear-gradient(135deg, #17120F 0%, #FF8800 100%)",
    gitRepo: {
      provider: "github",
      repoUrl: "https://github.com/zeno-network/instance-gaming-lounge",
      branch: "main",
      manifestPath: "zeno-server.json"
    },
    relays: ["wss://nos.lol", "wss://relay.damus.io"],
    sampleCategories: [
      {
        name: "GAMING COMMUNITY",
        type: "text",
        channelNames: ["gaming-allgemein", "clips-and-highlights", "indie-games"]
      },
      {
        name: "SQUAD SPRACHKANÄLE",
        type: "voice",
        channelNames: ["Squad Alpha (Low-Latency)", "Squad Bravo", "Chill Lounge"]
      }
    ]
  }
];

/**
 * Converts an InstanceDirectoryEntry into a full, live Zeno Server ready for SQLite & React State
 */
export function directoryEntryToServer(entry: InstanceDirectoryEntry): Server {
  const categories: Category[] = entry.sampleCategories.map((cat, catIdx) => ({
    name: cat.name,
    type: cat.type,
    channels: cat.channelNames.map((chName, chIdx) => ({
      id: `chn-${entry.id}-${catIdx}-${chIdx}`,
      name: chName
    }))
  }));

  return {
    id: entry.id,
    name: entry.name,
    iconLetter: entry.iconLetter,
    icon: entry.icon,
    description: entry.description,
    unreadCount: 0,
    encrypted: true,
    bannerGradient: entry.bannerGradient,
    memberCount: entry.memberCount,
    isOfficial: entry.isOfficial,
    tags: entry.tags,
    gitRepo: {
      provider: entry.gitRepo.provider,
      repoUrl: entry.gitRepo.repoUrl,
      branch: entry.gitRepo.branch,
      manifestPath: entry.gitRepo.manifestPath,
      autoSync: true
    },
    relays: entry.relays,
    categories
  };
}
