import { Server, Message, Profile, IdeFile, HubRuntimeItem, WidgetConfig } from "../types";

export const initialServers: Server[] = [
  {
    id: "zeno-dev",
    name: "Zeno Development",
    iconLetter: "Z",
    categories: [
      {
        name: "Textkanäle",
        type: "text",
        channels: [
          { id: "allgemein", name: "allgemein", active: true },
          { id: "dev-talk", name: "dev-talk" },
          { id: "ui-design", name: "ui-design" },
          { id: "kryptografie", name: "kryptografie" }
        ]
      },
      {
        name: "Sprachkanäle",
        type: "voice",
        channels: [
          { id: "voice-lobby", name: "Voice Lobby", connectedUsers: ["Max", "Lena"] },
          { id: "pair-programming", name: "Pair Programming" }
        ]
      }
    ]
  },
  {
    id: "gaming-hub",
    name: "Gaming Hub",
    iconLetter: "G",
    categories: [
      {
        name: "Textkanäle",
        type: "text",
        channels: [
          { id: "lobby", name: "lobby" },
          { id: "lfg", name: "lfg-gaming" },
          { id: "clips", name: "clips-and-highlights" }
        ]
      },
      {
        name: "Sprachkanäle",
        type: "voice",
        channels: [
          { id: "duo-1", name: "Duo Queue 1" },
          { id: "duo-2", name: "Duo Queue 2" },
          { id: "squad-room", name: "Squad Room" }
        ]
      }
    ]
  },
  {
    id: "design-team",
    name: "Design Team",
    iconLetter: "D",
    categories: [
      {
        name: "Textkanäle",
        type: "text",
        channels: [
          { id: "design-system", name: "design-system" },
          { id: "moodboards", name: "moodboards" },
          { id: "ux-research", name: "ux-research" }
        ]
      },
      {
        name: "Sprachkanäle",
        type: "voice",
        channels: [
          { id: "feedback-sync", name: "Feedback Sync" },
          { id: "brainstorming", name: "Brainstorming" }
        ]
      }
    ]
  },
  {
    id: "open-source",
    name: "Open Source",
    iconLetter: "O",
    categories: [
      {
        name: "Textkanäle",
        type: "text",
        channels: [
          { id: "announcements", name: "announcements" },
          { id: "general", name: "general" },
          { id: "issues", name: "issues-and-pr" }
        ]
      },
      {
        name: "Sprachkanäle",
        type: "voice",
        channels: [
          { id: "community-call", name: "Community Call" }
        ]
      }
    ]
  }
];

export const initialMessages: Record<string, Message[]> = {
  allgemein: [
    { author: "MaxShield", text: "Hat jemand schon den neuen SFrame-Branch getestet? Die Latenz im Voice ist deutlich besser.", time: "10:14", color: "blue" },
    { author: "LenaCrypt", text: "Ja, funktioniert super! Hier ist mein Benchmark-Script:", time: "10:16", color: "green", code: "use zeno_core::crypto::sframe;\nuse std::time::Instant;\n\nfn main() {\n    let key = sframe::generate_key();\n    let payload = vec![0u8; 960];\n    let start = Instant::now();\n    for _ in 0..10_000 {\n        let _ = sframe::encrypt(&key, &payload);\n    }\n    println!(\"10k encryptions: {:?}\", start.elapsed());\n}" },
    { author: "CipherNaut", text: "Nice! 🔥 Die Zahlen sehen vielversprechend aus. Schaut euch auch die neue Tauri v2 Doku an: https://tauri.app/v2/guides/?utm_source=twitter&utm_medium=social&fbclid=IwAR982317983", time: "10:18", color: "purple" },
    { author: "MaxShield", text: "Hier ist der Webrtc-RS Quellcode: https://github.com/webrtc-rs/webrtc?si=xyz123&utm_campaign=launch_announcement", time: "10:22", color: "blue" },
    { author: "LenaCrypt", text: "Kanal-Sender-Key erfolgreich rotiert. Alle aktiven Teilnehmer haben die neuen Ephemeral-Schlüssel erhalten.", time: "10:25", color: "green" }
  ],
  "dev-talk": [
    { author: "CipherNaut", text: "Wir müssen die WASM-Sandbox-Performance im Auge behalten. Die Speichergrenze ist auf 64 MB limitiert.", time: "09:12", color: "purple" },
    { author: "MaxShield", text: "Stimmt, ich mache dazu einen Benchmark mit der nativen Tauri IPC-Bridge.", time: "09:15", color: "blue" }
  ],
  "ui-design": [
    { author: "LenaCrypt", text: "Ich habe die neuen Entwürfe für das Zeno-Branding hochgeladen: Klare Typografie, barrierefreie Kontraste und diskrete Sicherheitsindikatoren.", time: "11:02", color: "green" }
  ],
  kryptografie: [
    { author: "LenaCrypt", text: "Das 3-Stufen-Modell für Key-Recovery (Gerätekopplung, lokales Paper-Backup, Shamir Secret Sharing) steht.", time: "14:20", color: "green" },
    { author: "MaxShield", text: "Kryptografischer Fingerprint für Kanal-Sender-Keys erfolgreich verifiziert: 0x8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890BCDEF12. Integrität bestätigt.", time: "14:25", color: "blue" }
  ],
  lobby: [
    { author: "MaxShield", text: "Willkommen in der Sovereign Workspace Lobby. Bereit für die nächste Peer-to-Peer Session? 🛰️", time: "18:44", color: "blue" }
  ]
};

export const mockProfiles: Record<string, Profile> = {
  MaxShield: {
    id: "maxshield",
    name: "MaxShield",
    avatar: "M",
    avatarColor: "blue",
    role: "Entwickler",
    roleColor: "blue",
    status: '"Latenz-Optimierung & E2EE Audits"',
    fingerprint: "0x8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890BCDEF12",
    bannerGradient: "linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)",
    badge: "⚡ CORE DEV",
    badgePosition: "badge-center",
    themePreset: "glassmorphism"
  },
  LenaCrypt: {
    id: "lenacrypt",
    name: "LenaCrypt",
    avatar: "L",
    avatarColor: "green",
    role: "Entwickler",
    roleColor: "green",
    status: '"Opus-Streams & SFrame standardisiert."',
    fingerprint: "0x2C3D4E5F67890BCDEF1234567890ABCDEF123456",
    bannerGradient: "linear-gradient(135deg, #00FF87 0%, #60EFFF 100%)",
    badge: "🛡️ ARCHITECT",
    badgePosition: "badge-center",
    themePreset: "matrix"
  },
  CipherNaut: {
    id: "ciphernaut",
    name: "CipherNaut",
    avatar: "C",
    avatarColor: "purple",
    bgColor: "var(--accent-purple, #9B6BDF)",
    role: "Unterstützer",
    roleColor: "warning",
    status: '"Zeno verschlüsselt meine Daten."',
    fingerprint: "0xA3F9D1E8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890",
    bannerGradient: "linear-gradient(135deg, #7928CA 0%, #FF0080 100%)",
    badge: "⚡ VIP CYBERNAUT",
    badgePosition: "badge-center",
    aboutMe: "Full-Stack Dev & Cryptography Enthusiast. Baue die Zukunft der privaten Echtzeit-Kommunikation mit Zeno! 🚀",
    socialLinks: [
      { platform: "github", url: "https://github.com", label: "GitHub" },
      { platform: "steam", url: "https://store.steampowered.com", label: "Steam" },
      { platform: "discord", url: "https://discord.gg", label: "Discord" }
    ],
    topGames: [
      { title: "Zeno IDE", hoursPlayed: "142 Std.", icon: "⚡" },
      { title: "Cyberpunk 2077", hoursPlayed: "88 Std.", icon: "🌆" },
      { title: "Valorant", hoursPlayed: "54 Std.", icon: "🎯" }
    ],
    themePreset: "cyberpunk",
    customCss: `
/* Custom Cyberpunk Profile Theme */
#profile-card-modal .profile-modal-card {
  border: 1px solid #FF0080;
  box-shadow: 0 0 25px rgba(255, 0, 128, 0.5), 0 0 50px rgba(121, 40, 202, 0.4);
}
#profile-card-modal .profile-card-name {
  color: #00DFD8 !important;
  text-shadow: 0 0 10px rgba(0, 223, 216, 0.8);
}
    `.trim()
  },
  ZenoBot: {
    id: "zenobot",
    name: "ZenoBot",
    avatar: "Z",
    avatarColor: "orange",
    role: "Bot",
    roleColor: "warning",
    status: '"Typisierter RPC-Brückenwächter."',
    fingerprint: "0x5F67890BCDEF1234567890ABCDEF1234567890AB",
    bannerGradient: "linear-gradient(135deg, #FF8008 0%, #FFC837 100%)",
    badge: "🤖 SYSTEM BOT",
    badgePosition: "badge-center",
    themePreset: "default"
  },
  DarkNode: {
    id: "darknode",
    name: "DarkNode",
    avatar: "D",
    avatarColor: "gray",
    role: "Offline",
    roleColor: "muted",
    status: '"Suche post-quantum Signaturen..."',
    fingerprint: "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
    bannerGradient: "linear-gradient(135deg, #f857a6 0%, #ff5858 100%)",
    badge: "🌙 NIGHT OWL",
    badgePosition: "badge-center",
    themePreset: "synthwave"
  },
  QuantumLeap: {
    id: "quantumleap",
    name: "QuantumLeap",
    avatar: "Q",
    avatarColor: "purple",
    role: "Offline",
    roleColor: "muted",
    status: '"QKD Entanglement aktiv."',
    fingerprint: "0xFE9876543210ABCDEF1234567890ABCDEF123456",
    bannerGradient: "linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)",
    badge: "⚛️ QUANTUM DEV",
    badgePosition: "badge-center",
    themePreset: "glassmorphism"
  }
};

export const defaultWorkspace: IdeFile[] = [
  { name: "Cargo.toml", path: "Cargo.toml", code: `[package]\nname = "zeno_sandbox"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\naegis = "0.2.0"\n`, language: "toml", isFolder: false },
  { name: "src", path: "src", code: "", language: "", isFolder: true },
  { name: "main.rs", path: "src/main.rs", code: `// Zeno Rust WASM Sandbox\nfn main() {\n    println!("Willkommen in der Zeno Full-IDE!");\n    println!("Dieses Projekt läuft in einer vollkommen isolierten WASM-Sandbox.");\n}\n`, language: "rust", isFolder: false }
];

export const HUB_RUNTIMES_CATALOG: HubRuntimeItem[] = [
  {
    id: "golang",
    langKey: "golang",
    name: "Golang WASM Compiler",
    version: "v1.22.4",
    size: "14.2 MB",
    provider: "Zeno Community Index",
    providerIcon: "⭐",
    badgeColor: "#3574F0",
    description: "Nativer Go-Compiler für WebAssembly. Kompiliert Go-Codeblöcke direkt in der Browser-WASI Sandbox.",
    tags: ["#golang", "#wasi", "#systems"],
    sampleFile: "main.go",
    sampleCode: "package main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"Hello Zeno Go WASM!\")\n}",
    icon: "vscode-icons:file-type-go"
  },
  {
    id: "ruby",
    langKey: "ruby",
    name: "Ruby.wasm (CRuby Engine)",
    version: "v3.3.1",
    size: "9.8 MB",
    provider: "WAPM Registry",
    providerIcon: "📦",
    badgeColor: "#EDA200",
    description: "Offizieller CRuby-WASM Interpreter von der Ruby Core Org. Unterstützt eval, stdlib & Gems.",
    tags: ["#ruby", "#scripting", "#wapm"],
    sampleFile: "script.rb",
    sampleCode: "puts 'Hello Zeno Ruby WASM!'\nputs 'Kryptografische Session aktiv'",
    icon: "vscode-icons:file-type-ruby"
  },
  {
    id: "perl",
    langKey: "perl",
    name: "Perl 5 WASM Interpreter",
    version: "v5.38.2",
    size: "5.4 MB",
    provider: "WAPM Registry",
    providerIcon: "📦",
    badgeColor: "#EDA200",
    description: "Perl 5 Interpreter kompiliert nach WASI. Führe Perl-Scripts & Regex in isolierter Umgebung aus.",
    tags: ["#perl", "#scripting", "#text"],
    sampleFile: "test.pl",
    sampleCode: "use strict;\nuse warnings;\n\nprint \"Hello Zeno Perl WASM!\\n\";",
    icon: "vscode-icons:file-type-perl"
  },
  {
    id: "php",
    langKey: "php",
    name: "PHP 8.3 CLI (PHP-WASM)",
    version: "v8.3.6",
    size: "8.1 MB",
    provider: "Zeno Community Index",
    providerIcon: "⭐",
    badgeColor: "#3574F0",
    description: "PHP 8.3 CLI & Engine in WebAssembly. Führe PHP-Skripte vollkommen clientseitig ohne Server aus.",
    tags: ["#php", "#web", "#scripting"],
    sampleFile: "index.php",
    sampleCode: "<?php\necho \"Hello Zeno PHP 8.3 WASM!\";\n?>",
    icon: "vscode-icons:file-type-php"
  },
  {
    id: "zig",
    langKey: "zig",
    name: "Zig Toolchain (WASI Target)",
    version: "v0.12.0",
    size: "18.5 MB",
    provider: "Zeno Community Index",
    providerIcon: "⭐",
    badgeColor: "#3574F0",
    description: "Zig Compiler & Build-System für WASI. Kompiliere extrem performanten & sicheren Zig-Code.",
    tags: ["#zig", "#systems", "#lowlevel"],
    sampleFile: "main.zig",
    sampleCode: "const std = @import(\"std\");\n\npub fn main() void {\n    std.debug.print(\"Hello Zeno Zig WASM!\\n\", .{});\n}",
    icon: "vscode-icons:file-type-zig"
  },
  {
    id: "sqlite",
    langKey: "sqlite",
    name: "SQLite 3 WASM DB Engine",
    version: "v3.45.0",
    size: "2.1 MB",
    provider: "WAPM Registry",
    providerIcon: "📦",
    badgeColor: "#EDA200",
    description: "SQLite 3 DB-Engine mit WASI VFS. Führe SQL-Abfragen & Schema-Migrationen lokal aus.",
    tags: ["#sql", "#database", "#storage"],
    sampleFile: "query.sql",
    sampleCode: "CREATE TABLE users (id INT, name TEXT);\nINSERT INTO users VALUES (1, 'CipherNaut');\nSELECT * FROM users;",
    icon: "vscode-icons:file-type-sqlite"
  },
  {
    id: "lua",
    langKey: "lua",
    name: "Lua 5.4 WASM VM",
    version: "v5.4.6",
    size: "1.2 MB",
    provider: "Zeno Community Index",
    providerIcon: "⭐",
    badgeColor: "#3574F0",
    description: "Leichtgewichtiger Lua 5.4 Interpreter. Extrem schneller Startup und minimaler Speicherbedarf.",
    tags: ["#lua", "#scripting", "#embed"],
    sampleFile: "main.lua",
    sampleCode: "print('Hello Zeno Lua 5.4 WASM!')",
    icon: "vscode-icons:file-type-lua"
  },
  {
    id: "python",
    langKey: "python",
    name: "Python Pyodide (Python WASM)",
    version: "v0.26.2",
    size: "12.8 MB",
    provider: "Zeno Community Index",
    providerIcon: "⭐",
    badgeColor: "#3574F0",
    description: "Vollständige Python 3.11 WASM-Umgebung mit NumPy & SciPy Unterstützung.",
    tags: ["#python", "#datascience", "#wasi"],
    sampleFile: "main.py",
    sampleCode: "print('Hello Zeno Python WASM!')",
    icon: "vscode-icons:file-type-python"
  },
  {
    id: "rust",
    langKey: "rust",
    name: "Rust Compiler & Aegis Crypto",
    version: "v1.78.0",
    size: "4.5 MB",
    provider: "Zeno Core",
    providerIcon: "🛡️",
    badgeColor: "#59A869",
    description: "Rust-Laufzeitsimulation und lokale Aegis Kryptografie-Pakete.",
    tags: ["#rust", "#crypto", "#zenocore"],
    sampleFile: "main.rs",
    sampleCode: "fn main() {\n    println!(\"Hello Zeno Rust WASM!\");\n}",
    icon: "vscode-icons:file-type-rust"
  },
  {
    id: "csharp",
    langKey: "csharp",
    name: ".NET CLR WASM Runtime (C#)",
    version: "v8.0.4",
    size: "8.2 MB",
    provider: "Zeno Core",
    providerIcon: "🛡️",
    badgeColor: "#59A869",
    description: ".NET CLR WASM Runtime zur lokalen Ausführung von C# Codeblöcken.",
    tags: ["#csharp", "#dotnet", "#zenocore"],
    sampleFile: "Program.cs",
    sampleCode: "using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine(\"Hello Zeno .NET WASM!\");\n    }\n}",
    icon: "vscode-icons:file-type-csharp"
  }
];

export const INITIAL_WIDGETS: WidgetConfig[] = [
  {
    id: "w1",
    type: "recent-files",
    title: "📂 Workspace & Dateiverlauf",
    bgColor: "",
    colSpan: 1,
    rowSpan: 1,
    order: 0,
    customCode: ""
  },
  {
    id: "w2",
    type: "git-status",
    title: "⚡ Git Repository Live-Status",
    bgColor: "",
    colSpan: 1,
    rowSpan: 1,
    order: 1,
    customCode: "",
    gitMode: "local",
    gitRepo: "dev/ProjectZeno/Zeno"
  }
];
