import { Server, Message, Profile, IdeFile, HubRuntimeItem, WidgetConfig, DmConversation, DirectMessage } from "../types";

/**
 * Standard-Workspace, der als Fallback dient, falls die lokale SQLite-Datenbank noch keine Server enthält.
 */
export const defaultServers: Server[] = [
  {
    id: "zeno-workspace",
    name: "Souveräner Workspace",
    iconLetter: "Z",
    description: "Lokaler, privater Standard-Workspace für Ende-zu-Ende verschlüsselte Kommunikation.",
    encrypted: true,
    categories: [
      {
        name: "Textkanäle",
        type: "text",
        channels: [
          { id: "allgemein", name: "allgemein", active: true },
          { id: "dev-talk", name: "dev-talk" }
        ]
      },
      {
        name: "Sprachkanäle",
        type: "voice",
        channels: [
          { id: "voice-lobby", name: "Voice Lobby" }
        ]
      }
    ]
  }
];

export const initialServers: Server[] = defaultServers;

/**
 * P2P Direct-Message & Selbstchat (Notizboard) Konfiguration
 * Keine Fake-Accounts mehr. Standardmäßig startet der Nutzer mit seinem
 * privaten "Notizen an mich selbst"-Notizboard.
 */
export const DEFAULT_SELF_CHAT_AIN = "ZENO-SELF-NOTE-MAIN";
export const MAX_SELF_CHATS = 5;

export const initialDmConversations: DmConversation[] = [
  {
    peerAin: DEFAULT_SELF_CHAT_AIN,
    peerName: "Notizen an mich selbst",
    peerAvatar: "📝",
    peerStatusQuote: "Privates Ende-zu-Ende verschlüsseltes Notizboard (Nur auf diesem Gerät)",
    connectionStatus: "p2p_direct",
    isSelfChat: true,
    selfChatTopic: "Allgemein",
    pingMs: 0,
    unreadCount: 0,
    lastMessage: {
      id: "self-note-welcome",
      senderAin: "self",
      recipientAin: "self",
      content: "Willkommen in deinem persönlichen Zeno-Notizboard! 📝\n\nHier kannst du Gedanken festhalten, To-Dos notieren, Code-Snippets zwischenspeichern und Links ablegen. Alles wird lokal auf deinem Rechner sicher gespeichert.",
      time: "09:00",
      timestamp: Date.now() - 3600000,
      status: "delivered",
      deliveryRoute: "p2p_direct",
      codeSnippet: {
        language: "markdown",
        title: "quick_ideas.md",
        code: "- [x] P2P-Verschlüsselung aktivieren\n- [ ] Multi-Monitor Popout testen\n- [ ] Eigene Notizen organisieren"
      }
    }
  }
];

export const initialDmMessages: Record<string, DirectMessage[]> = {
  [DEFAULT_SELF_CHAT_AIN]: [
    {
      id: "self-note-welcome",
      senderAin: "self",
      recipientAin: "self",
      content: "Willkommen in deinem persönlichen Zeno-Notizboard! 📝\n\nHier kannst du Gedanken festhalten, To-Dos notieren, Code-Snippets zwischenspeichern und Links ablegen. Alles wird lokal auf deinem Rechner sicher gespeichert.",
      time: "09:00",
      timestamp: Date.now() - 3600000,
      status: "delivered",
      deliveryRoute: "p2p_direct",
      codeSnippet: {
        language: "markdown",
        title: "quick_ideas.md",
        code: "- [x] P2P-Verschlüsselung aktivieren\n- [ ] Multi-Monitor Popout testen\n- [ ] Eigene Notizen organisieren"
      }
    }
  ]
};


/**
 * Keine Fake-Chat-Nachrichten mehr. Kanäle starten sauber leer
 * und laden echte Nachrichten ausschließlich aus der lokalen SQLite-Datenbank,
 * aus Git (README.md) oder live über dezentrale Relays.
 */
export const initialMessages: Record<string, Message[]> = {};

/**
 * Keine fiktiven Dummy-Profile mehr. Profile speisen sich ausschließlich
 * aus der lokal erstellten AIN-Identität des Nutzers und über den Relay-Gossip-Austausch
 * mit echten Peers.
 */
export const mockProfiles: Record<string, Profile> = {};

/**
 * Monaco IDE Default Workspace Template (WASM Sandbox)
 */
export const defaultWorkspace: IdeFile[] = [
  { name: "Cargo.toml", path: "Cargo.toml", code: `[package]\nname = "zeno_sandbox"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\naegis = "0.2.0"\n`, language: "toml", isFolder: false },
  { name: "src", path: "src", code: "", language: "", isFolder: true },
  { name: "main.rs", path: "src/main.rs", code: `// Zeno Rust WASM Sandbox\nfn main() {\n    println!("Willkommen in der Zeno Full-IDE!");\n    println!("Dieses Projekt läuft in einer vollkommen isolierten WASM-Sandbox.");\n}\n`, language: "rust", isFolder: false }
];

/**
 * Monaco IDE WebAssembly Runtime Katalog
 */
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
