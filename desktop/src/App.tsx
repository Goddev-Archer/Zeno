import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import "./App.css";

// Configure Monaco Environment to prevent dynamic worker fetch errors in Vite
if (typeof window !== "undefined") {
  (window as any).MonacoEnvironment = {
    getWorker: function () {
      const workerCode = `
        self.onmessage = function() {};
      `;
      const blob = new Blob([workerCode], { type: "application/javascript" });
      return new Worker(URL.createObjectURL(blob));
    }
  };
}

loader.config({ monaco });

// --- TYPES & INTERFACES ---
interface Channel {
  id: string;
  name: string;
  active?: boolean;
  connectedUsers?: string[];
}

interface Category {
  name: string;
  type: "text" | "voice";
  channels: Channel[];
}

interface Server {
  id: string;
  name: string;
  iconLetter: string;
  categories: Category[];
}

interface MessageAttachment {
  name: string;
  size: string;
  dataUrl?: string;
  type: string;
}

interface Message {
  author: string;
  text: string;
  time: string;
  color: string;
  code?: string;
  attachment?: MessageAttachment;
}

interface Profile {
  name: string;
  avatar: string;
  avatarColor: string;
  bgColor?: string;
  role: string;
  roleColor?: string;
  status?: string;
  fingerprint: string;
}

interface Toast {
  id: number;
  message: string;
}

interface RecentFile {
  name: string;
  code: string;
  language: string;
}

interface IdeFile {
  name: string;
  path: string;
  code: string;
  language: string;
  isFolder: boolean;
}



const KNOWN_TRACKING_PARAMS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id",
  "fbclid", "gclid", "msclkid", "ttclid", "si", "igsh", "ref", "_hsenc", "mc_eid",
  "twclid", "yclid"
];

function cleanUrl(rawUrl: string): { cleanedUrl: string; strippedParams: string[] } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { cleanedUrl: "", strippedParams: [] };
  }
  try {
    const validUrl = rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : `https://${rawUrl}`;
    const parsed = new URL(validUrl);
    const strippedParams: string[] = [];
    const searchParams = new URLSearchParams(parsed.search);

    KNOWN_TRACKING_PARAMS.forEach((param) => {
      if (searchParams.has(param)) {
        strippedParams.push(param);
        searchParams.delete(param);
      }
    });

    parsed.search = searchParams.toString();
    return { cleanedUrl: parsed.toString(), strippedParams };
  } catch {
    return { cleanedUrl: rawUrl, strippedParams: [] };
  }
}

// --- WASM RUNTIME HUB TYPES & CATALOG ---
interface HubRuntimeItem {
  id: string;
  langKey: string;
  name: string;
  version: string;
  size: string;
  provider: "Zeno Community Index" | "WAPM Registry" | "Zeno Core" | "Custom WASM";
  providerIcon: string;
  badgeColor: string;
  description: string;
  tags: string[];
  sampleFile: string;
  sampleCode: string;
  icon: string;
}

const HUB_RUNTIMES_CATALOG: HubRuntimeItem[] = [
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

// --- WIDGET SYSTEM TYPES ---
type WidgetType = "recent-files" | "git-status" | "weather" | "privacy-guard" | "custom";
type WidgetColSpan = 1 | 2;
type WidgetRowSpan = 1 | 2;
interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  bgColor: string;
  colSpan: WidgetColSpan;
  rowSpan: WidgetRowSpan;
  order: number;
  customCode: string;
  gitMode?: "local" | "github";
  gitRepo?: string;
}

// --- MULTI-LANGUAGE INTELLISENSE ENGINE FOR MONACO ---
let isIntelliSenseRegistered = false;

function setupZenoIntelliSense(monaco: any) {
  if (isIntelliSenseRegistered || !monaco) return;
  isIntelliSenseRegistered = true;

  // Register Custom Zeno Themes
  monaco.editor.defineTheme('zeno-dark-theme', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5C6370', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'CF8E6D', fontStyle: 'bold' },
      { token: 'string', foreground: '6A8759' },
      { token: 'number', foreground: '6897BB' },
      { token: 'regexp', foreground: '9A5334' },
      { token: 'type', foreground: 'A9B7C6' },
      { token: 'class', foreground: 'A9B7C6' },
      { token: 'function', foreground: '57B6C2' },
      { token: 'variable', foreground: 'A9B7C6' }
    ],
    colors: {
      'editor.background': '#18191B',
      'editor.foreground': '#E3E4E8',
      'editor.lineHighlightBackground': '#26282E',
      'editor.selectionBackground': '#214283',
      'editorCursor.foreground': '#528BFF',
      'editorWhitespace.foreground': '#3B4048',
      'editorLineNumber.foreground': '#4B5263',
      'editorLineNumber.activeForeground': '#E3E4E8'
    }
  });

  monaco.editor.defineTheme('zeno-light-theme', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5C6370', fontStyle: 'italic' },
      { token: 'keyword', foreground: '0033B3', fontStyle: 'bold' },
      { token: 'string', foreground: '067D17' },
      { token: 'number', foreground: '1750EB' },
      { token: 'function', foreground: '00627A' }
    ],
    colors: {
      'editor.background': '#E3E4E8',
      'editor.foreground': '#060607',
      'editor.lineHighlightBackground': '#DFE1E5',
      'editor.selectionBackground': '#A6D2FF',
      'editorCursor.foreground': '#0066CC',
      'editorLineNumber.foreground': '#ADADAD',
      'editorLineNumber.activeForeground': '#060607'
    }
  });

  // TypeScript / JavaScript Diagnostics
  if (monaco.languages.typescript) {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    });
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    });
  }

  // Define Language Rules, Keywords, Stdlib Functions & Snippets
  const languageDefinitions: Record<string, { keywords: string[]; std: string[]; snippets: Array<{ label: string; insert: string; doc: string }> }> = {
    rust: {
      keywords: ["fn", "let", "mut", "pub", "struct", "impl", "enum", "match", "use", "mod", "trait", "where", "async", "await", "unsafe", "loop", "while", "for", "if", "else", "return", "type", "const", "static"],
      std: ["println!", "eprintln!", "format!", "vec!", "panic!", "Option", "Result", "Some", "None", "Ok", "Err", "String", "Vec", "HashMap", "Box", "Arc", "Mutex"],
      snippets: [
        { label: "fn main", insert: "fn main() {\n    println!(\"${1:Hello World}\");\n}", doc: "Main funktion in Rust" },
        { label: "struct", insert: "struct ${1:MyStruct} {\n    ${2:field}: ${3:String},\n}", doc: "Struct Definition" },
        { label: "impl", insert: "impl ${1:MyStruct} {\n    pub fn new() -> Self {\n        Self {}\n    }\n}", doc: "Impl Block" }
      ]
    },
    python: {
      keywords: ["def", "class", "import", "from", "return", "if", "elif", "else", "try", "except", "finally", "with", "as", "for", "while", "async", "await", "lambda", "global", "nonlocal", "pass", "break", "continue"],
      std: ["print", "len", "range", "list", "dict", "set", "str", "int", "float", "open", "enumerate", "zip", "isinstance", "type", "dir", "map", "filter", "sum", "max", "min"],
      snippets: [
        { label: "main guard", insert: "if __name__ == '__main__':\n    ${1:main()}", doc: "Python Main Guard" },
        { label: "def function", insert: "def ${1:function_name}(${2:args}):\n    \"\"\"${3:Docstring}\"\"\"\n    ${4:pass}", doc: "Funktionsdefinition" },
        { label: "class definition", insert: "class ${1:MyClass}:\n    def __init__(self, ${2:args}):\n        ${3:pass}", doc: "Klassendefinition" }
      ]
    },
    golang: {
      keywords: ["package", "import", "func", "var", "const", "type", "struct", "interface", "return", "if", "else", "for", "range", "switch", "case", "select", "go", "defer", "chan", "map"],
      std: ["fmt.Println", "fmt.Printf", "fmt.Sprintf", "make", "append", "len", "panic", "recover", "copy"],
      snippets: [
        { label: "package main", insert: "package main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"${1:Hello World}\")\n}", doc: "Go Main Package" },
        { label: "if err != nil", insert: "if err != nil {\n    return ${1:err}\n}", doc: "Go Error Check" }
      ]
    },
    csharp: {
      keywords: ["using", "namespace", "class", "struct", "interface", "public", "private", "protected", "static", "void", "async", "Task", "string", "int", "bool", "var", "return", "if", "else", "foreach", "switch", "get", "set", "override"],
      std: ["Console.WriteLine", "Console.Write", "Console.ReadLine", "Math.Abs", "List<T>", "Dictionary<K,V>", "Enumerable", "Console"],
      snippets: [
        { label: "static main", insert: "using System;\n\nclass Program {\n    static void Main(string[] args) {\n        Console.WriteLine(\"${1:Hello World}\");\n    }\n}", doc: "C# Main Method" },
        { label: "prop auto", insert: "public ${1:string} ${2:MyProperty} { get; set; }", doc: "Auto-Property" }
      ]
    },
    cpp: {
      keywords: ["include", "namespace", "class", "struct", "public", "private", "auto", "const", "template", "typename", "virtual", "override", "return", "if", "else", "for", "while", "using", "typedef"],
      std: ["std::cout", "std::cin", "std::endl", "std::vector", "std::string", "std::map", "std::shared_ptr", "std::unique_ptr", "std::make_shared"],
      snippets: [
        { label: "int main", insert: "#include <iostream>\n\nint main() {\n    std::cout << \"${1:Hello World}\" << std::endl;\n    return 0;\n}", doc: "C++ Main Function" }
      ]
    },
    ruby: {
      keywords: ["def", "end", "class", "module", "require", "include", "attr_accessor", "if", "elsif", "else", "unless", "do", "yield", "return", "begin", "rescue"],
      std: ["puts", "print", "p", "raise", "each", "map", "select", "reject"],
      snippets: [
        { label: "def method", insert: "def ${1:method_name}(${2:args})\n  ${3:# code}\nend", doc: "Ruby Method" }
      ]
    },
    perl: {
      keywords: ["use", "strict", "warnings", "my", "our", "sub", "if", "elsif", "else", "unless", "foreach", "while", "return"],
      std: ["print", "say", "die", "warn", "push", "pop", "shift", "split", "join"],
      snippets: [
        { label: "subroutine", insert: "sub ${1:name} {\n    my (${2:\\$args}) = @_;\n    ${3:# code}\n}", doc: "Perl Subroutine" }
      ]
    },
    php: {
      keywords: ["php", "namespace", "use", "class", "interface", "trait", "public", "private", "protected", "function", "return", "if", "else", "foreach", "match"],
      std: ["echo", "print_r", "var_dump", "count", "array_map", "isset", "empty"],
      snippets: [
        { label: "<?php tag", insert: "<?php\n\n${1:echo 'Hello World';}\n", doc: "PHP Opening Tag" }
      ]
    },
    zig: {
      keywords: ["const", "var", "fn", "pub", "usingnamespace", "import", "struct", "enum", "union", "error", "try", "catch", "defer", "errdefer", "if", "else", "while", "for", "switch"],
      std: ["std.debug.print", "std.log.info", "std.mem.allocator", "@import"],
      snippets: [
        { label: "pub fn main", insert: "const std = @import(\"std\");\n\npub fn main() !void {\n    std.debug.print(\"${1:Hello World}\\n\", .{});\n}", doc: "Zig Main Function" }
      ]
    },
    lua: {
      keywords: ["function", "end", "local", "if", "then", "elseif", "else", "for", "while", "do", "repeat", "until", "return", "require", "nil"],
      std: ["print", "type", "tostring", "tonumber", "table.insert", "string.format"],
      snippets: [
        { label: "function", insert: "local function ${1:name}(${2:args})\n    ${3:-- code}\nend", doc: "Lua Function" }
      ]
    },
    sql: {
      keywords: ["SELECT", "FROM", "WHERE", "JOIN", "LEFT JOIN", "INNER JOIN", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "INSERT INTO", "UPDATE", "DELETE", "CREATE TABLE", "ALTER TABLE", "DROP TABLE"],
      std: ["COUNT", "SUM", "AVG", "MAX", "MIN", "COALESCE", "NOW"],
      snippets: [
        { label: "SELECT FROM", insert: "SELECT ${1:*} FROM ${2:table_name} WHERE ${3:condition};", doc: "SQL Query" }
      ]
    }
  };

  // Register completion items & hovers for all languages
  Object.keys(languageDefinitions).forEach((lang) => {
    const def = languageDefinitions[lang];
    
    monaco.languages.registerCompletionItemProvider(lang, {
      triggerCharacters: [".", ":", ">", "(", " ", "<", '"', "'"],
      provideCompletionItems: (model: any, position: any) => {
        const wordInfo = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: wordInfo.startColumn,
          endColumn: wordInfo.endColumn
        };

        const items: any[] = [];

        // 1. Snippets
        def.snippets.forEach((snip) => {
          items.push({
            label: snip.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            documentation: snip.doc,
            insertText: snip.insert,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          });
        });

        // 2. Keywords
        def.keywords.forEach((kw) => {
          items.push({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range
          });
        });

        // 3. Std functions
        def.std.forEach((st) => {
          items.push({
            label: st,
            kind: monaco.languages.CompletionItemKind.Function,
            documentation: `Zeno WASI Stdlib: ${st}`,
            insertText: st,
            range
          });
        });

        return { suggestions: items };
      }
    });

    // Hover Tooltip Provider
    monaco.languages.registerHoverProvider(lang, {
      provideHover: (model: any, position: any) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;

        const w = word.word;
        if (def.keywords.includes(w)) {
          return {
            contents: [
              { value: `**${lang.toUpperCase()} Schlüsselwort**: \`${w}\`` },
              { value: `Integraler Bestandteil der Sprach-Syntax von ${lang.toUpperCase()}.` }
            ]
          };
        } else if (def.std.includes(w)) {
          return {
            contents: [
              { value: `**${lang.toUpperCase()} Standard-Funktion**: \`${w}\`` },
              { value: `Ausführbar in der Zeno WASI Sandbox-Laufzeitumgebung.` }
            ]
          };
        }
        return null;
      }
    });
  });
}

// --- MOCK DATABASE ---
const initialServers: Server[] = [
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

const initialMessages: Record<string, Message[]> = {
  allgemein: [
    { author: "MaxShield", text: "Hat jemand schon den neuen SFrame-Branch getestet? Die Latenz im Voice ist deutlich besser.", time: "10:14", color: "blue" },
    { author: "LenaCrypt", text: "Ja, funktioniert super! Hier ist mein Benchmark-Script:", time: "10:16", color: "green", code: "use zeno_core::crypto::sframe;\nuse std::time::Instant;\n\nfn main() {\n    let key = sframe::generate_key();\n    let payload = vec![0u8; 960];\n    let start = Instant::now();\n    for _ in 0..10_000 {\n        let _ = sframe::encrypt(&key, &payload);\n    }\n    println!(\"10k encryptions: {:?}\", start.elapsed());\n}" },
    { author: "CipherNaut", text: "Nice! 🔥 Die Zahlen sehen vielversprechend aus. Schaut euch auch die neue Tauri v2 Doku an: https://tauri.app/v2/guides/?utm_source=twitter&utm_medium=social&fbclid=IwAR982317983", time: "10:18", color: "purple" },
    { author: "MaxShield", text: "Hier ist der Webrtc-RS Quellcode: https://github.com/webrtc-rs/webrtc?si=xyz123&utm_campaign=launch_announcement", time: "10:22", color: "blue" }
  ],
  "dev-talk": [
    { author: "CipherNaut", text: "Wir müssen die WASM-Sandbox-Performance im Auge behalten.", time: "09:12", color: "purple" },
    { author: "MaxShield", text: "Stimmt, ich mache dazu einen Benchmark.", time: "09:15", color: "blue" }
  ],
  "ui-design": [
    { author: "LenaCrypt", text: "Ich habe die neuen Entwürfe für das Zeno-Branding hochgeladen. Was meint ihr?", time: "11:02", color: "green" }
  ],
  kryptografie: [
    { author: "LenaCrypt", text: "Das 3-Stufen-Modell für Key-Recovery (Gerätekopplung, Cloud-Backup, Social Recovery) steht.", time: "14:20", color: "green" }
  ],
  lobby: [
    { author: "MaxShield", text: "Moin, zockt heute jemand? 🎮", time: "18:44", color: "blue" }
  ]
};

const mockProfiles: Record<string, Profile> = {
  MaxShield: {
    name: "MaxShield",
    avatar: "M",
    avatarColor: "blue",
    role: "Entwickler",
    roleColor: "blue",
    status: '"Latenz-Optimierung läuft..."',
    fingerprint: "0x8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890BCDEF12"
  },
  LenaCrypt: {
    name: "LenaCrypt",
    avatar: "L",
    avatarColor: "green",
    role: "Entwickler",
    roleColor: "green",
    status: '"Opus-Streams & SFrame standardisiert."',
    fingerprint: "0x2C3D4E5F67890BCDEF1234567890ABCDEF123456"
  },
  CipherNaut: {
    name: "CipherNaut",
    avatar: "C",
    avatarColor: "purple",
    bgColor: "var(--accent-purple, #9B6BDF)",
    role: "Unterstützer",
    roleColor: "warning",
    status: '"Zeno verschlüsselt meine Daten."',
    fingerprint: "0xA3F9D1E8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890"
  },
  ZenoBot: {
    name: "ZenoBot",
    avatar: "Z",
    avatarColor: "orange",
    role: "Bot",
    roleColor: "warning",
    status: '"Typisierter RPC-Brückenwächter."',
    fingerprint: "0x5F67890BCDEF1234567890ABCDEF1234567890AB"
  },
  DarkNode: {
    name: "DarkNode",
    avatar: "D",
    avatarColor: "gray",
    role: "Offline",
    roleColor: "muted",
    status: '"Offline - Tor relay ist online."',
    fingerprint: "0xBCDEF1234567890ABCDEF1234567890ABCDEF123"
  },
  QuantumLeap: {
    name: "QuantumLeap",
    avatar: "Q",
    avatarColor: "gray",
    role: "Offline",
    roleColor: "muted",
    status: '"Suche post-quantum Signaturen..."',
    fingerprint: "0xABCDEF1234567890ABCDEF1234567890ABCDEF12"
  }
};

const darkPresets = [
  { color: "#18191B", title: "Default Dark" },
  { color: "#0F1015", title: "Deep Space" },
  { color: "#0F1411", title: "Forest Green" },
  { color: "#150F1A", title: "Nebula Purple" }
];

const lightPresets = [
  { color: "#E3E4E8", title: "Default Light" },
  { color: "#DCE2EC", title: "Soft Blue" },
  { color: "#DCECE0", title: "Soft Green" },
  { color: "#E5DCEC", title: "Soft Lavender" }
];

// --- HELPER FUNCTIONS ---
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function detectLanguage(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return "javascript";
  
  if (trimmed.startsWith("<html") || trimmed.startsWith("<!DOCTYPE html") || (trimmed.includes("<div") && trimmed.includes("</div>"))) {
    return "html";
  }
  if (trimmed.includes("body {") || trimmed.includes("margin:") || (trimmed.includes("color:") && trimmed.includes("{") && trimmed.includes("}"))) {
    return "css";
  }
  if (trimmed.includes("fn main()") || trimmed.includes("use std::") || trimmed.includes("println!(") || trimmed.includes("pub fn ")) {
    return "rust";
  }
  if (trimmed.includes("def ") && (trimmed.includes("print(") || trimmed.includes("import ") || trimmed.includes(":\n"))) {
    return "python";
  }
  if (trimmed.startsWith("{") && trimmed.endsWith("}") && trimmed.includes("\"")) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch (e) {}
  }
  if (trimmed.includes("#include <") || trimmed.includes("std::cout") || trimmed.includes("int main(")) {
    return "cpp";
  }
  if (trimmed.includes("interface ") || trimmed.includes("type ") || trimmed.includes("as string") || trimmed.includes(": string") || trimmed.includes(": number")) {
    return "typescript";
  }
  return "javascript";
}

function getLanguageFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case "rs": return "rust";
    case "py": return "python";
    case "js": return "javascript";
    case "ts": return "typescript";
    case "tsx": return "typescript";
    case "jsx": return "javascript";
    case "cpp": return "cpp";
    case "c": return "cpp";
    case "h": return "cpp";
    case "cs": return "csharp";
    case "java": return "java";
    case "go": return "go";
    case "sql": return "sql";
    case "md": return "markdown";
    case "html": return "html";
    case "htm": return "html";
    case "css": return "css";
    case "json": return "json";
    default: return "javascript";
  }
}

const AVAILABLE_COMMANDS = [
  { name: "/code", desc: "Monaco Editor mit neuer Datei öffnen", icon: "mage:code" },
  { name: "/editor", desc: "Monaco Editor mit neuer Datei öffnen", icon: "mage:code" },
  { name: "/theme", desc: "Design umschalten (dunkel/hell)", icon: "mage:moon" },
  { name: "/mute", desc: "Mikrofon stumm- oder freischalten", icon: "mage:microphone-mute" },
  { name: "/deafen", desc: "Audio stumm- oder freischalten", icon: "mage:volume-mute" },
  { name: "/help", desc: "Hilfe-Informationen im Chat anzeigen", icon: "mage:information-circle" }
];

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "w-recent",  type: "recent-files",  title: "Zuletzt bearbeitete Dateien", bgColor: "", colSpan: 1, rowSpan: 1, order: 0, customCode: "" },
  { id: "w-git",     type: "git-status",    title: "Git Repository Status",       bgColor: "", colSpan: 1, rowSpan: 1, order: 1, customCode: "" },
  { id: "w-weather", type: "weather",       title: "Lokale Zeit & Wetter",         bgColor: "", colSpan: 1, rowSpan: 1, order: 2, customCode: "" },
  { id: "w-privacy", type: "privacy-guard", title: "Zeno Privacy Guard",           bgColor: "", colSpan: 1, rowSpan: 1, order: 3, customCode: "" },
];

function getContrastColor(hex: string): string {
  if (!hex) return "var(--text-primary)";
  const c = hex.replace("#", "");
  if (c.length !== 6) return "var(--text-primary)";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? "#0d0f14" : "#f4f4f5";
}

interface LiveGitStatus {
  branch: string;
  is_clean: boolean;
  modified: number;
  added: number;
  deleted: number;
  untracked: number;
}

interface LiveGitCommit {
  hash: string;
  message: string;
  date: string;
}

async function safeInvoke<T>(cmd: string, args?: any): Promise<T> {
  if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<T>(cmd, args);
  }
  throw new Error("Tauri-Umgebung nicht verfügbar.");
}

function getCurrentTimestamp(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

export default function App() {
  // --- STATE ---
  const [servers, setServers] = useState<Server[]>(initialServers);
  const [activeServerId, setActiveServerId] = useState<string>("home");
  const [animatingServerId, setAnimatingServerId] = useState<string | null>(null);
  const activeServer = servers.find((s) => s.id === activeServerId) || servers[0];
  
  const [activeChannel, setActiveChannel] = useState<Channel>(initialServers[0].categories[0].channels[0]);
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>(initialMessages);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  
  // Customizer / Appearance State
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [canvasColor, setCanvasColor] = useState<string>("#18191B");
  const [glowColor, setGlowColor] = useState<string>("#3574F0");
  const [glassmorphism, setGlassmorphism] = useState<boolean>(true);
  
  // User Controls State
  const [muted, setMuted] = useState<boolean>(false);
  const [deafened, setDeafened] = useState<boolean>(false);
  const [isMembersOpen, setIsMembersOpen] = useState<boolean>(true);
  
  // Modals & Panels State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>("profile");
  const [selectedUserProfile, setSelectedUserProfile] = useState<Profile | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isEditorDirty, setIsEditorDirty] = useState<boolean>(false);
  const [editorCode, setEditorCode] = useState<string>("");
  const [editorLanguage, setEditorLanguage] = useState<string>("rust");
  const [editorFilename, setEditorFilename] = useState<string>("main.rs");
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [editorWorkflowStep, setEditorWorkflowStep] = useState<"select_action" | "input_filename" | "editor">("select_action");
  const [editorOutput, setEditorOutput] = useState<string>("");



  // Home Navigation & WASM Hub States
  const [homeTab, setHomeTab] = useState<"dashboard" | "wasm_hub" | "ide">("dashboard");
  const [wasmHubSearchQuery, setWasmHubSearchQuery] = useState<string>("");
  const [wasmHubFilter, setWasmHubFilter] = useState<"all" | "community" | "wapm" | "installed">("all");
  const [isCustomWasmModalOpen, setIsCustomWasmModalOpen] = useState<boolean>(false);
  const [customWasmName, setCustomWasmName] = useState<string>("");
  const [customWasmUrl, setCustomWasmUrl] = useState<string>("");

  // Zeno Full-IDE Workspace States
  const defaultWorkspace: IdeFile[] = [
    { name: "Cargo.toml", path: "Cargo.toml", code: `[package]\nname = "zeno_sandbox"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\naegis = "0.2.0"\n`, language: "toml", isFolder: false },
    { name: "src", path: "src", code: "", language: "", isFolder: true },
    { name: "main.rs", path: "src/main.rs", code: `// Zeno Rust WASM Sandbox\nfn main() {\n    println!("Willkommen in der Zeno Full-IDE!");\n    println!("Dieses Projekt läuft in einer vollkommen isolierten WASM-Sandbox.");\n}\n`, language: "rust", isFolder: false }
  ];

  const [ideFiles, setIdeFiles] = useState<IdeFile[]>(defaultWorkspace);
  const [ideOpenTabs, setIdeOpenTabs] = useState<string[]>(["src/main.rs", "Cargo.toml"]);
  const [ideActiveFilePath, setIdeActiveFilePath] = useState<string>("src/main.rs");
  const [ideConsoleOutput, setIdeConsoleOutput] = useState<string>("[zeno-ide] Workspace geladen. Klicke auf 'Run' in der Toolbar, um den Code auszuführen.\n");
  const [isIdeConsoleExpanded, setIsIdeConsoleExpanded] = useState<boolean>(true);
  const [isIdeProjectWizardOpen, setIsIdeProjectWizardOpen] = useState<boolean>(false);
  const [isIdeNewItemModalOpen, setIsIdeNewItemModalOpen] = useState<boolean>(false);
  const [ideNewItemType, setIdeNewItemType] = useState<"file" | "folder">("file");
  const [ideNewItemParentPath, setIdeNewItemParentPath] = useState<string>("");
  const [ideNewItemName, setIdeNewItemName] = useState<string>("");
  const [ideExpandedFolders, setIdeExpandedFolders] = useState<Record<string, boolean>>({ "src": true });

  // Zeno IDE Sidebar Panel States (VS Code replication)
  const [ideSidebarTab, setIdeSidebarTab] = useState<"explorer" | "git" | "extensions" | "gitlens">("explorer");
  const [ideGitMessage, setIdeGitMessage] = useState<string>("");
  const [ideGitChanges, setIdeGitChanges] = useState<string[]>(["Cargo.toml", "src/main.rs"]);
  const [ideExtensionsSearchQuery, setIdeExtensionsSearchQuery] = useState<string>("");
  const [ideExtensions, setIdeExtensions] = useState<any[]>([
    { id: "prettier", name: "Prettier - Code formatter", description: "Standardmäßiger Code-Formatter für Monaco-Dateien.", version: "v10.2.1", downloads: "45.1M", rating: "4.8", icon: "logos:prettier", author: "Esben Petersen", installed: false },
    { id: "rust-analyzer", name: "rust-analyzer", description: "Bietet fortgeschrittene Auto-Vervollständigung und Diagnosen für Rust.", version: "v0.3.2064", downloads: "2.8M", rating: "4.9", icon: "vscode-icons:file-type-rust", author: "The rust-analyzer authors", installed: false },
    { id: "python-intellisense", name: "Python Support", description: "Umfassende Syntax-Highlighting und Code-Analysen für Python.", version: "v2026.4.1", downloads: "112M", rating: "4.7", icon: "logos:python", author: "Microsoft", installed: false },
    { id: "gitlens", name: "GitLens — Git supercharged", description: "Visualisiere Code-Autorenschaft und Git-Historie direkt in Zeno.", version: "v14.9.0", downloads: "29M", rating: "4.8", icon: "logos:git-icon", author: "GitKraken", installed: false },
    { id: "eslint", name: "ESLint Checker", description: "Bietet Echtzeit-Syntax- und Formatierungs-Validierung in Zeno.", version: "v2.4.4", downloads: "48M", rating: "4.6", icon: "logos:eslint", author: "Microsoft", installed: false },
    { id: "zeno-theme-changer", name: "Neon Glow Theme Pack", description: "Erweitert Zeno-Oberflächen um Cyberpunk Neon Glow Designs.", version: "v1.0.0", downloads: "15k", rating: "5.0", icon: "mage:lightning-bolt", author: "Zeno Community", installed: false }
  ]);

  const formatDownloads = (count: number) => {
    if (!count) return "0";
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(0) + "k";
    return count.toString();
  };

  const fetchExtensionsFromMarketplace = async (query: string) => {
    try {
      let url = "https://open-vsx.org/api/-/search?q=*&size=15";
      if (query.trim()) {
        url = `https://open-vsx.org/api/-/search?q=${encodeURIComponent(query)}&size=15`;
      }
      const response = await fetch(url);
      if (!response.ok) return;
      const data = await response.json();
      
      if (data && data.extensions) {
        const mapped = data.extensions.map((ext: any) => {
          const isInstalled = ideExtensions.find(e => e.id === ext.uuid || e.id === `${ext.namespace}.${ext.name}`)?.installed || false;
          return {
            id: ext.uuid || `${ext.namespace}.${ext.name}`,
            namespace: ext.namespace,
            name: ext.displayName || ext.name,
            description: ext.description || "Keine Beschreibung verfügbar.",
            version: ext.version,
            downloads: formatDownloads(ext.downloadCount),
            rating: ext.averageRating ? ext.averageRating.toFixed(1) : "N/A",
            icon: ext.files?.icon || "mage:box-3d",
            author: ext.namespace,
            installed: isInstalled
          };
        });
        setIdeExtensions(mapped);
      }
    } catch (err) {
      console.error("Fehler beim Laden von Open VSX:", err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchExtensionsFromMarketplace(ideExtensionsSearchQuery);
    }, 450);
    return () => clearTimeout(delayDebounceFn);
  }, [ideExtensionsSearchQuery]);

  const handleExtensionInstall = (id: string) => {
    setIdeExtensions((prev) =>
      prev.map((ext) => {
        if (ext.id === id) {
          showToast(`Plugin "${ext.name}" wird installiert...`);
          setTimeout(() => {
            showToast(`Plugin "${ext.name}" erfolgreich installiert!`);
            const extIdLower = ext.id.toLowerCase();
            const extNameLower = ext.name.toLowerCase();
            if (extIdLower.includes("gitlens") || extNameLower.includes("gitlens")) {
              showToast("Info: GitLens wurde in die IDE-Aktivitätsleiste übersetzt!");
            } else if (extIdLower.includes("theme") || extNameLower.includes("theme") || extIdLower.includes("glow")) {
              setCanvasColor("#2e0854");
              setGlowColor("#ff007f");
              showToast("Neon Glow Theme aktiviert!");
            }
          }, 1200);
          return { ...ext, installed: true };
        }
        return ext;
      })
    );
  };

  const handleExtensionUninstall = (id: string) => {
    setIdeExtensions((prev) =>
      prev.map((ext) => {
        if (ext.id === id) {
          showToast(`Plugin "${ext.name}" deinstalliert.`);
          if (ext.id === "zeno-theme-changer") {
            setCanvasColor(theme === "light" ? "#E3E4E8" : "#18191B");
            setGlowColor("#3574F0");
          }
          return { ...ext, installed: false };
        }
        return ext;
      })
    );
  };

  const handleIdeGitCommit = () => {
    if (!ideGitMessage.trim()) {
      showToast("Bitte gib eine Commit-Nachricht ein.");
      return;
    }
    showToast(`Git Commit "${ideGitMessage}" erfolgreich! Synchronisiere mit Remote...`);
    setIdeConsoleOutput((prev) => prev + `[git] git commit -m "${ideGitMessage}"\n[git] 2 Dateien geändert.\n[git] git push origin main\n[git] Synchronisierung abgeschlossen.\n\n`);
    setIdeGitMessage("");
    setIdeGitChanges([]);
  };

  const openInPrivacyBrowser = async (targetUrl: string, _title?: string) => {
    if (!targetUrl || typeof targetUrl !== "string") return;
    const { cleanedUrl, strippedParams } = cleanUrl(targetUrl);
    if (!cleanedUrl) return;

    try {
      await safeInvoke("plugin:opener|open_url", { url: cleanedUrl });
    } catch {
      window.open(cleanedUrl, "_blank");
    }

    if (strippedParams.length > 0) {
      showToast(`🛡️ Link gereinigt! (${strippedParams.join(", ")}) Im System-Browser geöffnet`);
    } else {
      showToast("🌐 Gereinigter Link im System-Browser geöffnet");
    }
  };
  const [editorRuntimes, setEditorRuntimes] = useState<Record<string, "installed" | "not_installed" | "installing">>({
    javascript: "installed",
    typescript: "installed",
    python: "not_installed",
    rust: "not_installed",
    csharp: "not_installed",
    cpp: "not_installed"
  });
  const [weatherMode, setWeatherMode] = useState<"wttr" | "custom">("wttr");
  const [weatherApiKey, setWeatherApiKey] = useState<string>("");
  const [weatherApiUrl, setWeatherApiUrl] = useState<string>("https://api.openweathermap.org/data/2.5/weather?q={city}&appid={key}&units=metric&lang=de");
  const [realWeatherData, setRealWeatherData] = useState<{
    temp: string;
    condition: string;
    icon: string;
    humidity: string;
    wind: string;
    forecast?: Array<{
      date: string;
      tempMin: string;
      tempMax: string;
      morningTemp: string;
      morningIcon: string;
      noonTemp: string;
      noonIcon: string;
      eveningTemp: string;
      eveningIcon: string;
      nightTemp: string;
      nightIcon: string;
    }>;
  } | null>(null);

  const [liveGitStatus, setLiveGitStatus] = useState<LiveGitStatus | null>(null);
  const [liveGitCommits, setLiveGitCommits] = useState<LiveGitCommit[]>([]);
  const [gitError, setGitError] = useState<string | null>(null);

  const fetchLiveGitData = async () => {
    try {
      setGitError(null);
      const status = await safeInvoke<LiveGitStatus>("get_git_status");
      setLiveGitStatus(status);
      const log = await safeInvoke<LiveGitCommit[]>("get_git_log");
      setLiveGitCommits(log);
    } catch (e: any) {
      console.warn("Git integration failed:", e);
      setGitError(e.message || String(e));
    }
  };

  useEffect(() => {
    fetchLiveGitData();
    const interval = setInterval(fetchLiveGitData, 15000);
    return () => clearInterval(interval);
  }, []);

  const [githubToken, setGithubToken] = useState<string>("");
  const [githubUser, setGithubUser] = useState<{ login: string; name: string | null; avatarUrl: string } | null>(null);
  const [githubConnecting, setGithubConnecting] = useState<boolean>(false);

  const testGithubConnection = async () => {
    if (!githubToken.trim()) return;
    setGithubConnecting(true);
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${githubToken.trim()}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (!res.ok) {
        throw new Error(`GitHub API Fehler: HTTP ${res.status}`);
      }
      const data = await res.json();
      setGithubUser({
        login: data.login,
        name: data.name,
        avatarUrl: data.avatar_url,
      });
      showToast(`GitHub-Verbindung hergestellt: @${data.login}`);
      fetchGithubRepos(githubToken.trim());
    } catch (e: any) {
      console.error(e);
      showToast("GitHub-Verbindung fehlgeschlagen: " + (e.message || String(e)));
      setGithubUser(null);
    } finally {
      setGithubConnecting(false);
    }
  };

  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [dashboardEditMode, setDashboardEditMode] = useState<boolean>(false);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [swappingWidgetIds, setSwappingWidgetIds] = useState<string[]>([]);
  const updateWidget = (id: string, patch: Partial<WidgetConfig>) =>
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  const deleteWidget = (id: string) =>
    setWidgets((prev) => prev.filter((w) => w.id !== id).map((w, i) => ({ ...w, order: i })));

  // --- GITHUB REPOS & DETAILS STORE ---
  const [githubRepos, setGithubRepos] = useState<{ fullName: string; name: string; stars: number }[]>([]);
  const [githubRepoData, setGithubRepoData] = useState<Record<string, any>>({});
  const [githubReposLoading, setGithubReposLoading] = useState<boolean>(false);
  const [gitWidgetTabs, setGitWidgetTabs] = useState<Record<string, string>>({});

  const fetchGithubRepos = async (token = githubToken) => {
    if (!token.trim()) return;
    setGithubReposLoading(true);
    try {
      const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const repos = data.map((r: any) => ({
        fullName: r.full_name,
        name: r.name,
        stars: r.stargazers_count,
      }));
      setGithubRepos(repos);
    } catch (e) {
      console.warn("Failed to fetch GitHub repos:", e);
    } finally {
      setGithubReposLoading(false);
    }
  };

  const fetchGithubRepoDetails = async (repo: string) => {
    if (!githubToken.trim() || !repo) return;
    try {
      const headers = {
        Authorization: `Bearer ${githubToken.trim()}`,
        Accept: "application/vnd.github.v3+json",
      };

      const repoRes = await fetch(`https://api.github.com/repos/${repo}`, { headers });
      if (!repoRes.ok) throw new Error(`Repo HTTP ${repoRes.status}`);
      const repoInfo = await repoRes.json();

      const commitsRes = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=5`, { headers });
      const commitsData = commitsRes.ok ? await commitsRes.json() : [];
      const commits = commitsData.map((c: any) => ({
        hash: c.sha.slice(0, 7),
        message: c.commit.message.split("\n")[0],
        date: new Date(c.commit.author.date).toLocaleDateString("de-DE", { day: "numeric", month: "short" }),
      }));

      const issuesRes = await fetch(`https://api.github.com/repos/${repo}/issues?state=open&per_page=5`, { headers });
      const issuesData = issuesRes.ok ? await issuesRes.json() : [];
      const issues = issuesData
        .filter((i: any) => !i.pull_request)
        .map((i: any) => ({
          number: i.number,
          title: i.title,
          url: i.html_url,
        }));

      const pullsRes = await fetch(`https://api.github.com/repos/${repo}/pulls?state=open&per_page=5`, { headers });
      const pullsData = pullsRes.ok ? await pullsRes.json() : [];
      const pulls = pullsData.map((p: any) => ({
        number: p.number,
        title: p.title,
        url: p.html_url,
      }));

      const branchesRes = await fetch(`https://api.github.com/repos/${repo}/branches?per_page=5`, { headers });
      const branchesData = branchesRes.ok ? await branchesRes.json() : [];
      const branches = branchesData.map((b: any) => b.name);

      setGithubRepoData((prev) => ({
        ...prev,
        [repo]: {
          stars: repoInfo.stargazers_count,
          defaultBranch: repoInfo.default_branch,
          description: repoInfo.description,
          commits,
          issues,
          pulls,
          branches,
        },
      }));
    } catch (e) {
      console.warn(`Failed to fetch details for ${repo}:`, e);
    }
  };

  useEffect(() => {
    if (!githubToken.trim()) return;
    const activeGithubRepos = widgets
      .filter(w => w.type === "git-status" && w.gitMode === "github" && w.gitRepo)
      .map(w => w.gitRepo!);
    if (activeGithubRepos.length === 0) return;
    const fetchAllActive = () => {
      activeGithubRepos.forEach(repo => {
        fetchGithubRepoDetails(repo);
      });
    };
    fetchAllActive();
    const interval = setInterval(fetchAllActive, 30000);
    return () => clearInterval(interval);
  }, [widgets, githubToken]);

  useEffect(() => {
    if (githubToken.trim()) {
      fetchGithubRepos();
    }
  }, [githubToken]);

  const moveWidget = (id: string, direction: "left" | "right") => {
    setWidgets((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((w) => w.id === id);
      if (index === -1) return prev;
      const newIndex = direction === "left" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= sorted.length) return prev;
      
      const currentOrder = sorted[index].order;
      const targetOrder = sorted[newIndex].order;
      const targetId = sorted[newIndex].id;
      
      setSwappingWidgetIds([id, targetId]);
      setTimeout(() => {
        setSwappingWidgetIds([]);
      }, 350);
      
      return prev.map((w) => {
        if (w.id === id) return { ...w, order: targetOrder };
        if (w.id === targetId) return { ...w, order: currentOrder };
        return w;
      });
    });
  };

  const addCustomWidget = () => {
    const id = "w-custom-" + Date.now();
    const defaultCode = `// Das Widget wird in einer sicheren Sandbox ausgeführt.
// Gib einen HTML-String zurück (inklusive Script-Tags für Interaktivität).
// Du kannst CSS-Variablen wie var(--glow-color-1) oder var(--text-primary) nutzen.

return \`
  <div style="display: flex; flex-direction: column; gap: 10px; height: 100%; justify-content: center; align-items: center; text-align: center; padding: 10px;">
    <div style="font-size: 24px; font-weight: 800; color: var(--glow-color-1, #3574F0); text-shadow: 0 0 10px rgba(53, 116, 240, 0.3);" id="counter">0</div>
    <div style="font-size: 11px; color: var(--text-muted); font-weight: 500;">Interaktiver Zähler</div>
    <div style="display: flex; gap: 6px;">
      <button id="btn-dec" style="background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: 600;">-1</button>
      <button id="btn-inc" style="background: var(--glow-color-1, #3574F0); color: white; border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: 600;">+1</button>
    </div>
  </div>
  <script>
    let count = 0;
    const c = document.getElementById('counter');
    document.getElementById('btn-inc').onclick = () => { count++; c.innerText = count; };
    document.getElementById('btn-dec').onclick = () => { count--; c.innerText = count; };
  </script>
\`;`;
    setWidgets((prev) => [...prev, { id, type: "custom", title: "Neues Widget", bgColor: "", colSpan: 1, rowSpan: 1, order: prev.length, customCode: defaultCode }]);
    setEditingWidgetId(id);
  };
  const handleWidgetDrop = (targetId: string) => {
    if (!draggedWidgetId || draggedWidgetId === targetId) return;
    setWidgets((prev) => {
      const srcOrder = prev.find((w) => w.id === draggedWidgetId)!.order;
      const tgtOrder = prev.find((w) => w.id === targetId)!.order;
      return prev.map((w) => {
        if (w.id === draggedWidgetId) return { ...w, order: tgtOrder };
        if (w.id === targetId) return { ...w, order: srcOrder };
        return w;
      });
    });
    setDraggedWidgetId(null);
  };
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([
    { name: "main.rs", code: "fn main() {\n    println!(\"Hello World!\");\n}", language: "rust" },
    { name: "index.js", code: "console.log(\"Hello Zeno!\");", language: "javascript" },
    { name: "main.py", code: "print(\"Hello Zeno!\")", language: "python" }
  ]);

  const addRecentFile = (name: string, code: string, lang: string) => {
    setRecentFiles((prev) => {
      const filtered = prev.filter((f) => f.name !== name);
      return [{ name, code, language: lang }, ...filtered].slice(0, 5);
    });
  };



  
  // Chat Input State
  const [inputText, setInputText] = useState<string>("");
  const [pendingAttachment, setPendingAttachment] = useState<{ name: string; size: string; dataUrl?: string; type: string } | null>(null);
  const chatAttachmentInputRef = useRef<HTMLInputElement | null>(null);
  const [showCommandSuggestions, setShowCommandSuggestions] = useState<boolean>(false);
  
  // Voice Simulation State
  const [connectedVoice, setConnectedVoice] = useState<string | null>(null);
  const [voiceDuration, setVoiceDuration] = useState<number>(0);
  const voiceTimerRef = useRef<any>(null);

  // Toast Notifications State
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef<number>(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- TOAST TRIGGER ---
  const showToast = (message: string) => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // --- DASHBOARD STATES & EFFECT ---
  const [dashboardLocation, setDashboardLocation] = useState<string>("Berlin");
  const [dashboardTime, setDashboardTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      let offsetHours = 0;
      const loc = dashboardLocation.toLowerCase();
      if (loc.includes("new york") || loc.includes("nyc") || loc.includes("usa")) offsetHours = -6;
      else if (loc.includes("tokyo") || loc.includes("tokio") || loc.includes("japan")) offsetHours = 7;
      else if (loc.includes("london") || loc.includes("uk") || loc.includes("england")) offsetHours = -1;
      
      date.setHours(date.getHours() + offsetHours);
      setDashboardTime(date.toTimeString().slice(0, 5) + " Uhr");
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [dashboardLocation]);

  // --- SETTINGS STORE (OPTION 3) ---
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);

  const loadSavedSettings = async () => {
    try {
      const data = await safeInvoke<string>("load_settings");
      if (data && data !== "{}") {
        const config = JSON.parse(data);
        if (config.widgets) setWidgets(config.widgets);
        if (config.dashboardLocation) setDashboardLocation(config.dashboardLocation);
        if (config.weatherMode) setWeatherMode(config.weatherMode);
        if (config.weatherApiUrl) setWeatherApiUrl(config.weatherApiUrl);
        if (config.weatherApiKey) setWeatherApiKey(config.weatherApiKey);
        if (config.githubToken) setGithubToken(config.githubToken);
        if (config.githubUser) setGithubUser(config.githubUser);
        if (config.recentFiles) setRecentFiles(config.recentFiles);
      }
    } catch (e) {
      console.warn("Failed to load settings:", e);
    } finally {
      setSettingsLoaded(true);
    }
  };

  const saveCurrentSettings = async () => {
    try {
      const payload = JSON.stringify({
        widgets,
        dashboardLocation,
        weatherMode,
        weatherApiUrl,
        weatherApiKey,
        githubToken,
        githubUser,
        recentFiles
      });
      await safeInvoke("save_settings", { settings: payload });
    } catch (e) {
      console.warn("Failed to save settings:", e);
    }
  };

  useEffect(() => {
    if (settingsLoaded) {
      saveCurrentSettings();
    }
  }, [widgets, dashboardLocation, weatherMode, weatherApiUrl, weatherApiKey, githubToken, githubUser, recentFiles, settingsLoaded]);

  // --- WORKSPACE FILESYSTEM (OPTION 2) ---
  const openWorkspaceFile = async (name: string, language: string) => {
    try {
      const code = await safeInvoke<string>("read_workspace_file", { name });
      setEditorFilename(name);
      setEditorLanguage(language);
      setEditorCode(code);
      setEditorWorkflowStep("editor");
      setEditorOutput("");
      setIsEditorOpen(true);
      setIsEditorDirty(false);
      
      setRecentFiles(prev => {
        const filtered = prev.filter(f => f.name !== name);
        return [{ name, language, code: "" }, ...filtered].slice(0, 10);
      });
    } catch (e) {
      console.warn("Read workspace file failed, using memory:", e);
      setEditorFilename(name);
      setEditorLanguage(language);
      setEditorWorkflowStep("editor");
      setEditorOutput("");
      setIsEditorOpen(true);
      setIsEditorDirty(false);
    }
  };

  const createNewWorkspaceFile = async (filename: string) => {
    const lang = getLanguageFromExtension(filename);
    const initialCode = filename.endsWith(".rs") ? "fn main() {\n    println!(\"Hello World!\");\n}" :
                        filename.endsWith(".py") ? "print(\"Hello World!\")" :
                        filename.endsWith(".js") || filename.endsWith(".ts") ? "console.log(\"Hello World!\");" : "";
    try {
      await safeInvoke("write_workspace_file", { name: filename, content: initialCode });
      showToast(`Datei "${filename}" auf Festplatte erstellt.`);
      setEditorFilename(filename);
      setEditorLanguage(lang);
      setEditorCode(initialCode);
      setEditorWorkflowStep("editor");
      setIsEditorDirty(false);
      
      setRecentFiles(prev => {
        const filtered = prev.filter(f => f.name !== filename);
        return [{ name: filename, language: lang, code: "" }, ...filtered].slice(0, 10);
      });
    } catch (e) {
      console.warn("Create file failed, using memory:", e);
      setEditorFilename(filename);
      setEditorLanguage(lang);
      setEditorCode(initialCode);
      setEditorWorkflowStep("editor");
      setIsEditorDirty(false);
      setRecentFiles(prev => [{ name: filename, language: lang, code: initialCode }, ...prev.filter(f => f.name !== filename)]);
    }
  };

  const removeRecentFileFromHistory = (name: string) => {
    setRecentFiles(prev => prev.filter(f => f.name !== name));
    showToast(`Aus Historie entfernt: ${name}`);
  };

  // Initial load
  useEffect(() => {
    loadSavedSettings();
  }, []);

  // Fetch real weather data — wttr.in (no key, privacy-friendly) or user-supplied custom API
  const [weatherFetching, setWeatherFetching] = useState(false);
  const fetchRealWeather = async () => {
    if (!dashboardLocation.trim()) { showToast("Bitte einen Standort eingeben."); return; }
    setWeatherFetching(true);
    try {
      if (weatherMode === "wttr") {
        // wttr.in: city name only, no API key, open source, self-hostable
        const city = encodeURIComponent(dashboardLocation.trim());
        const res = await fetch(`https://wttr.in/${city}?format=j1`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const cur = data.current_condition?.[0];
        if (!cur) throw new Error("Ungültige Antwort von wttr.in");
        const tempC = cur.temp_C;
        const desc = cur.lang_de?.[0]?.value || cur.weatherDesc?.[0]?.value || "Unbekannt";
        const humidity = cur.humidity + "%";
        const windKmph = cur.windspeedKmph + " km/h";
        const code = parseInt(cur.weatherCode, 10);
        let icon = "mage:sun";
        if (code >= 200 && code < 300) icon = "mage:lightning";
        else if (code >= 300 && code < 400) icon = "mage:cloudy";
        else if (code >= 500 && code < 600) icon = "mage:cloudy";
        else if (code >= 600 && code < 700) icon = "mage:cloudy";
        else if (code >= 700 && code < 800) icon = "mage:cloudy";
        else if (code === 800) icon = "mage:sun";
        else if (code > 800) icon = "mage:cloudy";

        // Parse 3-day forecast with 1/4 day temperatures
        const forecast = (data.weather || []).map((day: any) => {
          const dateObj = new Date(day.date);
          const weekday = dateObj.toLocaleDateString('de-DE', { weekday: 'short' });
          const formattedDate = dateObj.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });

          const getHourData = (index: number) => {
            const h = day.hourly?.[index] || {};
            const code = parseInt(h.weatherCode || "800", 10);
            let hIcon = "mage:sun";
            if (code >= 200 && code < 300) hIcon = "mage:lightning";
            else if (code >= 300 && code < 700) hIcon = "mage:cloudy";
            else if (code >= 700 && code < 800) hIcon = "mage:cloudy";
            else if (code > 800) hIcon = "mage:cloudy";

            return {
              temp: h.tempC ? h.tempC + "°C" : "?°C",
              icon: hIcon
            };
          };

          const night = getHourData(0); // 00:00
          const morning = getHourData(2); // 06:00
          const noon = getHourData(4); // 12:00
          const evening = getHourData(6); // 18:00

          return {
            date: `${weekday}, ${formattedDate}`,
            tempMin: day.mintempC + "°C",
            tempMax: day.maxtempC + "°C",
            morningTemp: morning.temp,
            morningIcon: morning.icon,
            noonTemp: noon.temp,
            noonIcon: noon.icon,
            eveningTemp: evening.temp,
            eveningIcon: evening.icon,
            nightTemp: night.temp,
            nightIcon: night.icon
          };
        });

        setRealWeatherData({ temp: tempC + "°C", condition: desc, icon, humidity, wind: windKmph, forecast });
        showToast(`Wetterdaten für ${dashboardLocation} aktualisiert (wttr.in)`);
      } else if (weatherMode === "custom") {
        if (!weatherApiKey.trim() && weatherApiUrl.includes("{key}")) {
          showToast("Bitte einen API-Key eingeben."); setWeatherFetching(false); return;
        }
        const url = weatherApiUrl
          .replace("{city}", encodeURIComponent(dashboardLocation.trim()))
          .replace("{key}", weatherApiKey.trim());
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Try OpenWeatherMap shape; fall back gracefully
        const temp = data.main?.temp !== undefined ? Math.round(data.main.temp) + "°C" : "?";
        const condition = data.weather?.[0]?.description || data.condition?.text || "Unbekannt";
        const humidity = (data.main?.humidity ?? data.current?.humidity ?? "?") + "%";
        const wind = Math.round(data.wind?.speed ?? data.current?.wind_kph ?? 0) + " km/h";
        const oid = data.weather?.[0]?.id;
        let icon = "mage:sun";
        if (oid) {
          if (oid >= 200 && oid < 300) icon = "mage:lightning";
          else if (oid >= 300 && oid < 600) icon = "mage:cloudy";
          else if (oid >= 600 && oid < 700) icon = "mage:cloudy";
          else if (oid > 800) icon = "mage:cloudy";
        }
        setRealWeatherData({ temp, condition, icon, humidity, wind });
        showToast(`Wetterdaten für ${dashboardLocation} aktualisiert (Custom API)`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast("Fehler beim Abrufen: " + msg);
    } finally {
      setWeatherFetching(false);
    }
  };

  useEffect(() => {
    fetchRealWeather();
  }, [weatherMode]);

  // --- DYNAMIC BACKGROUND & THEME SYNC ---
  useEffect(() => {
    document.body.style.setProperty("--bg-canvas", canvasColor);
    const opacity1 = theme === "light" ? 0.12 : 0.18;
    const opacity2 = theme === "light" ? 0.06 : 0.09;
    document.body.style.setProperty("--glow-color-1", hexToRgba(glowColor, opacity1));
    document.body.style.setProperty("--glow-color-2", hexToRgba(glowColor, opacity2));
    
    if (theme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }

    if (glassmorphism) {
      document.body.classList.add("glass-effect");
    } else {
      document.body.classList.remove("glass-effect");
    }
  }, [canvasColor, glowColor, theme, glassmorphism]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSettingsOpen(false);
        setSelectedUserProfile(null);
        setIsEditorOpen(false);
        setIsIdeProjectWizardOpen(false);
        setIsIdeNewItemModalOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const chatInput = document.getElementById("chat-input-field");
        if (chatInput) chatInput.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- SCROLL TO BOTTOM ---
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeChannel]);

  // --- VOICE CHAT CONNECT TIMER ---
  useEffect(() => {
    if (connectedVoice) {
      setVoiceDuration(0);
      voiceTimerRef.current = setInterval(() => {
        setVoiceDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (voiceTimerRef.current) {
        clearInterval(voiceTimerRef.current);
        voiceTimerRef.current = null;
      }
    }
    return () => {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    };
  }, [connectedVoice]);

  const formatVoiceTime = (secs: number) => {
    const mm = String(Math.floor(secs / 60)).padStart(2, "0");
    const ss = String(secs % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // --- CORE UI ACTIONS ---
  const handleServerSelect = (server: Server) => {
    setAnimatingServerId(server.id);
    setActiveServerId(server.id);
    // Auto-select first text channel on server change
    const firstTextChan = server.categories.find((c) => c.type === "text")?.channels[0];
    if (firstTextChan) {
      setActiveChannel(firstTextChan);
    }
    setTimeout(() => {
      setAnimatingServerId(null);
    }, 300);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !pendingAttachment) return;

    const trimmedInput = inputText.trim();
    setShowCommandSuggestions(false);

    if (trimmedInput.startsWith("/code ") || trimmedInput.startsWith("/editor ")) {
      const spaceIdx = trimmedInput.indexOf(" ");
      const code = trimmedInput.substring(spaceIdx + 1);
      setEditorCode(code);
      setEditorLanguage(detectLanguage(code));
      setEditorFilename("unnamed.js");
      setEditorWorkflowStep("editor");
      setEditorOutput("");
      setIsEditorOpen(true);
      setInputText("");
      return;
    } else if (trimmedInput === "/code" || trimmedInput === "/editor") {
      setEditorCode("");
      setEditorLanguage("javascript");
      setEditorFilename("unnamed.js");
      setEditorWorkflowStep("select_action");
      setEditorOutput("");
      setIsEditorOpen(true);
      setInputText("");
      return;
    } else if (trimmedInput === "/theme") {
      handleThemeToggle();
      setInputText("");
      return;
    } else if (trimmedInput === "/mute") {
      setMuted(!muted);
      showToast(!muted ? "Mikrofon stummgeschaltet" : "Mikrofon aktiviert");
      setInputText("");
      return;
    } else if (trimmedInput === "/deafen") {
      setDeafened(!deafened);
      showToast(!deafened ? "Audio stummgeschaltet" : "Audio aktiviert");
      setInputText("");
      return;
    } else if (trimmedInput === "/help") {
      const helpMsg: Message = {
        author: "ZenoBot",
        text: "Hier sind die verfügbaren Befehle:\n• /code - Monaco Editor öffnen\n• /theme - Design wechseln\n• /mute - Stumm schalten\n• /deafen - Audio deaktivieren\n• /help - Diese Liste anzeigen",
        time: getCurrentTimestamp(),
        color: "orange"
      };
      setChatMessages((prev) => ({
        ...prev,
        [activeChannel.id]: [...(prev[activeChannel.id] || []), helpMsg]
      }));
      setInputText("");
      return;
    }

    const newMsg: Message = {
      author: "CipherNaut",
      text: inputText || (pendingAttachment ? `Datei gesendet: ${pendingAttachment.name}` : ""),
      time: getCurrentTimestamp(),
      color: "purple",
      attachment: pendingAttachment ? {
        name: pendingAttachment.name,
        size: pendingAttachment.size,
        dataUrl: pendingAttachment.dataUrl,
        type: pendingAttachment.type
      } : undefined
    };

    setChatMessages((prev) => ({
      ...prev,
      [activeChannel.id]: [...(prev[activeChannel.id] || []), newMsg]
    }));
    setInputText("");
    setPendingAttachment(null);
  };

  const toggleCategory = (catName: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const handleJoinVoice = (chId: string, chName: string) => {
    setConnectedVoice(chName);
    
    // Add "CipherNaut" to the connectedUsers list of this channel, and remove from any other voice channel
    setServers((prevServers) =>
      prevServers.map((srv) => ({
        ...srv,
        categories: srv.categories.map((cat) => ({
          ...cat,
          channels: cat.channels.map((ch) => {
            if (cat.type === "voice") {
              let users = ch.connectedUsers ? [...ch.connectedUsers] : [];
              if (ch.id === chId) {
                if (!users.includes("CipherNaut")) {
                  users.push("CipherNaut");
                }
              } else {
                users = users.filter((u) => u !== "CipherNaut");
              }
              return { ...ch, connectedUsers: users };
            }
            return ch;
          })
        }))
      }))
    );

    showToast(`Sprachkanal #${chName} beigetreten`);
  };

  const handleDisconnectVoice = () => {
    setConnectedVoice(null);
    
    setServers((prevServers) =>
      prevServers.map((srv) => ({
        ...srv,
        categories: srv.categories.map((cat) => ({
          ...cat,
          channels: cat.channels.map((ch) => {
            if (cat.type === "voice" && ch.connectedUsers) {
              return {
                ...ch,
                connectedUsers: ch.connectedUsers.filter((u) => u !== "CipherNaut")
              };
            }
            return ch;
          })
        }))
      }))
    );

    showToast("Sprachverbindung getrennt");
  };

  const handleOpenFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target?.result as string;
      const detectedLang = getLanguageFromExtension(file.name);
      setEditorCode(contents);
      setEditorFilename(file.name);
      setEditorLanguage(detectedLang);
      setEditorWorkflowStep("editor");
      setEditorOutput("");
      addRecentFile(file.name, contents, detectedLang);
      showToast(`Datei "${file.name}" geladen`);
    };
    reader.readAsText(file);
  };

  const handleSaveFile = () => {
    try {
      const blob = new Blob([editorCode], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = editorFilename;
      link.click();
      URL.revokeObjectURL(url);
      
      addRecentFile(editorFilename, editorCode, editorLanguage);
      setIsEditorDirty(false);
      showToast(`Datei "${editorFilename}" erfolgreich gespeichert!`);
    } catch (err: any) {
      showToast(`Fehler beim Speichern: ${err.message}`);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        if (isEditorOpen) {
          e.preventDefault();
          handleSaveFile();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditorOpen, editorCode, editorFilename, editorLanguage]);

  useEffect(() => {
    if (!isEditorOpen) {
      setIsEditorDirty(false);
    }
  }, [isEditorOpen]);

  const handleRenameFile = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setIsRenaming(false);
      return;
    }
    
    setRecentFiles((prev) =>
      prev.map((f) =>
        f.name === editorFilename
          ? { ...f, name: trimmed, language: getLanguageFromExtension(trimmed) }
          : f
      )
    );

    setEditorFilename(trimmed);
    setEditorLanguage(getLanguageFromExtension(trimmed));
    setIsRenaming(false);
    showToast(`Datei umbenannt in "${trimmed}"`);
  };

  const handleDeleteCurrentFile = async () => {
    if (window.confirm(`Möchtest du die Datei "${editorFilename}" wirklich permanent von der Festplatte löschen?`)) {
      try {
        await safeInvoke("delete_workspace_file", { name: editorFilename });
        showToast(`Datei "${editorFilename}" gelöscht.`);
      } catch (e) {
        showToast(`Datei "${editorFilename}" gelöscht (Simulation)`);
      }
      setRecentFiles((prev) => prev.filter((f) => f.name !== editorFilename));
      setEditorCode("");
      setEditorFilename("main.rs");
      setEditorLanguage("rust");
      setEditorWorkflowStep("select_action");
      setEditorOutput("");
    }
  };

  const handleInstallRuntime = (lang: string) => {
    setEditorRuntimes((prev) => ({ ...prev, [lang]: "installing" }));
    showToast(`Herunterladen der ${lang.toUpperCase()}-Umgebung gestartet...`);
    setTimeout(() => {
      setEditorRuntimes((prev) => ({ ...prev, [lang]: "installed" }));
      showToast(`Laufzeitumgebung für ${lang.toUpperCase()} erfolgreich installiert!`);
    }, 2000);
  };

  const handleDeleteRuntime = (lang: string) => {
    if (window.confirm(`Möchtest du die Laufzeitumgebung für ${lang.toUpperCase()} deinstallieren?`)) {
      setEditorRuntimes((prev) => ({ ...prev, [lang]: "not_installed" }));
      showToast(`Laufzeitumgebung für ${lang.toUpperCase()} entfernt.`);
    }
  };

  const handleChatAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeKb = (file.size / 1024).toFixed(1);
    const sizeStr = `${sizeKb} KB`;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPendingAttachment({
          name: file.name,
          size: sizeStr,
          dataUrl: event.target?.result as string,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    } else {
      setPendingAttachment({
        name: file.name,
        size: sizeStr,
        type: file.type
      });
    }
    showToast(`Anhang "${file.name}" bereit zum Senden`);
  };

  // --- ZENO IDE HELPERS ---
  const handleIdeFileSelect = (filePath: string) => {
    if (!ideOpenTabs.includes(filePath)) {
      setIdeOpenTabs((prev) => [...prev, filePath]);
    }
    setIdeActiveFilePath(filePath);
  };

  const handleIdeFileClose = (filePath: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = ideOpenTabs.filter((t) => t !== filePath);
    setIdeOpenTabs(updated);
    if (ideActiveFilePath === filePath && updated.length > 0) {
      setIdeActiveFilePath(updated[updated.length - 1]);
    }
  };

  const handleIdeFileCreate = () => {
    if (!ideNewItemName.trim()) return;
    const cleanName = ideNewItemName.trim();
    const newPath = ideNewItemParentPath ? `${ideNewItemParentPath}/${cleanName}` : cleanName;

    // Check duplicate
    if (ideFiles.some((f) => f.path === newPath)) {
      showToast("Datei existiert bereits!");
      return;
    }

    const lang = getLanguageFromExtension(cleanName);
    const newFile: IdeFile = {
      name: cleanName,
      path: newPath,
      code: `// ${cleanName} - Created in Zeno IDE\n`,
      language: lang,
      isFolder: false
    };

    setIdeFiles((prev) => [...prev, newFile]);
    handleIdeFileSelect(newPath);
    setIsIdeNewItemModalOpen(false);
    setIdeNewItemName("");
    showToast(`Datei "${cleanName}" erstellt.`);
  };

  const handleIdeFolderCreate = () => {
    if (!ideNewItemName.trim()) return;
    const cleanName = ideNewItemName.trim();
    const newPath = ideNewItemParentPath ? `${ideNewItemParentPath}/${cleanName}` : cleanName;

    // Check duplicate
    if (ideFiles.some((f) => f.path === newPath)) {
      showToast("Ordner existiert bereits!");
      return;
    }

    const newFolder: IdeFile = {
      name: cleanName,
      path: newPath,
      code: "",
      language: "",
      isFolder: true
    };

    setIdeFiles((prev) => [...prev, newFolder]);
    if (ideNewItemParentPath) {
      setIdeExpandedFolders((prev) => ({ ...prev, [ideNewItemParentPath]: true }));
    }
    setIsIdeNewItemModalOpen(false);
    setIdeNewItemName("");
    showToast(`Ordner "${cleanName}" erstellt.`);
  };

  const handleIdeItemDelete = (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Möchtest du "${filePath}" wirklich löschen?`)) {
      setIdeFiles((prev) => prev.filter((f) => f.path !== filePath && !f.path.startsWith(filePath + "/")));
      handleIdeFileClose(filePath);
      showToast(`Element gelöscht.`);
    }
  };

  const handleIdeGenerateProject = (type: string) => {
    let files: IdeFile[] = [];
    let open: string[] = [];
    let active = "";

    if (type === "rust") {
      files = [
        { name: "Cargo.toml", path: "Cargo.toml", code: `[package]\nname = "zeno_cargo_app"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\n`, language: "toml", isFolder: false },
        { name: "src", path: "src", code: "", language: "", isFolder: true },
        { name: "main.rs", path: "src/main.rs", code: `// Zeno Rust app template\nfn main() {\n    println!("Hello from Zeno Rust Cargo Template!");\n}\n`, language: "rust", isFolder: false }
      ];
      open = ["src/main.rs", "Cargo.toml"];
      active = "src/main.rs";
    } else if (type === "go") {
      files = [
        { name: "go.mod", path: "go.mod", code: `module zeno_go_app\n\ngo 1.22\n`, language: "toml", isFolder: false },
        { name: "main.go", path: "main.go", code: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from Zeno Go Template!")\n}\n`, language: "golang", isFolder: false }
      ];
      open = ["main.go", "go.mod"];
      active = "main.go";
    } else if (type === "python") {
      files = [
        { name: "main.py", path: "main.py", code: `# Zeno Python app template\nimport sys\n\ndef main():\n    print("Hello from Zeno Python Template!")\n    print(f"Python version: {sys.version}")\n\nif __name__ == "__main__":\n    main()\n`, language: "python", isFolder: false },
        { name: "requirements.txt", path: "requirements.txt", code: `numpy\nrequests\n`, language: "txt", isFolder: false }
      ];
      open = ["main.py", "requirements.txt"];
      active = "main.py";
    } else if (type === "web") {
      files = [
        { name: "index.html", path: "index.html", code: `<!DOCTYPE html>\n<html>\n<head>\n  <title>Zeno Web App</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello from Zeno Web Sandbox!</h1>\n  <button id="btn">Click me</button>\n  <script src="script.js"></script>\n</body>\n</html>\n`, language: "html", isFolder: false },
        { name: "style.css", path: "style.css", code: `body {\n  font-family: sans-serif;\n  background: #18191B;\n  color: #E3E4E8;\n  text-align: center;\n  padding-top: 100px;\n}\nbutton {\n  background: #3574F0;\n  color: white;\n  border: none;\n  padding: 10px 20px;\n  border-radius: 6px;\n  cursor: pointer;\n}\n`, language: "css", isFolder: false },
        { name: "script.js", path: "script.js", code: `// Zeno Web App script\ndocument.getElementById("btn").onclick = () => {\n  alert("Hello Web App!");\n};\n`, language: "javascript", isFolder: false }
      ];
      open = ["index.html", "script.js", "style.css"];
      active = "index.html";
    }

    setIdeFiles(files);
    setIdeOpenTabs(open);
    setIdeActiveFilePath(active);
    setIdeConsoleOutput(`[zeno-ide] Neues ${type.toUpperCase()}-Projekt generiert.\n`);
    setIsIdeProjectWizardOpen(false);
    showToast(`${type.toUpperCase()}-Projekt erfolgreich generiert!`);
  };

  const handleIdeRun = () => {
    const activeFile = ideFiles.find((f) => f.path === ideActiveFilePath);
    if (!activeFile || activeFile.isFolder) {
      showToast("Bitte wähle eine gültige Datei zum Ausführen aus.");
      return;
    }

    const codeToRun = activeFile.code;
    const lang = activeFile.language.toLowerCase();
    
    setIdeConsoleOutput((prev) => prev + `\n[zeno-ide] Starte Ausführung für ${activeFile.name} (${lang.toUpperCase()})...\n`);

    const runtimeStatus = editorRuntimes[lang] || "installed";
    if (runtimeStatus === "not_installed") {
      setIdeConsoleOutput((prev) => prev + `Fehler: Die Laufzeitumgebung für "${lang.toUpperCase()}" ist nicht installiert.\nBitte lade sie im WASM Runtime Hub herunter.\n`);
      return;
    }

    if (lang === "javascript" || lang === "typescript") {
      let cleanedCode = codeToRun;
      if (lang === "typescript") {
        cleanedCode = codeToRun
          .replace(/:\s*(string|number|boolean|any|void|object|unknown|never)/g, "")
          .replace(/as\s+(string|number|boolean|any|void|object|unknown|never)/g, "")
          .replace(/interface\s+\w+\s*\{[^}]*\}/g, "")
          .replace(/type\s+\w+\s*=\s*[^;]+;/g, "");
      }

      const workerCode = `
        const outputs = [];
        const customConsole = {
          log: (...args) => {
            outputs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
          },
          error: (...args) => {
            outputs.push("ERROR: " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
          },
          warn: (...args) => {
            outputs.push("WARN: " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
          }
        };

        self.onmessage = function(e) {
          try {
            const fn = new Function('console', e.data);
            fn(customConsole);
            self.postMessage({ success: true, output: outputs.join('\\n') || '✓ JS/TS Code ausgeführt (keine Ausgaben).' });
          } catch (err) {
            self.postMessage({ success: false, output: "Laufzeitfehler: " + err.message + "\\n" + outputs.join('\\n') });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      worker.onmessage = (e) => {
        setIdeConsoleOutput((prev) => prev + e.data.output + "\n");
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };

      worker.onerror = (e) => {
        setIdeConsoleOutput((prev) => prev + "Syntaxfehler oder Kompilierungsfehler: " + e.message + "\n");
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };

      worker.postMessage(cleanedCode);
    } else if (lang === "python") {
      if (!(window as any).loadPyodide) {
        setIdeConsoleOutput((prev) => prev + "Lade Python WASM-Sandbox von CDN...\n");
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
        script.async = true;
        script.onload = async () => {
          try {
            setIdeConsoleOutput((prev) => prev + "Initialisiere Python WASM-Laufzeitumgebung...\n");
            const pyodideInstance = await (window as any).loadPyodide();
            (window as any).pyodide = pyodideInstance;
            runPythonInIde(pyodideInstance, codeToRun);
          } catch (err: any) {
            setIdeConsoleOutput((prev) => prev + "Initialisierungsfehler: " + err.message + "\n");
          }
        };
        script.onerror = () => {
          setIdeConsoleOutput((prev) => prev + "Fehler: Pyodide-Skript konnte nicht von CDN geladen werden.\n");
        };
        document.head.appendChild(script);
      } else {
        const run = async () => {
          if (!(window as any).pyodide) {
            setIdeConsoleOutput((prev) => prev + "Initialisiere Python WASM-Laufzeitumgebung...\n");
            (window as any).pyodide = await (window as any).loadPyodide();
          }
          runPythonInIde((window as any).pyodide, codeToRun);
        };
        run();
      }
    } else {
      // Simulate execution output for compilation languages based on simple patterns
      setTimeout(() => {
        let stdout = "";
        if (lang === "rust") {
          if (codeToRun.includes("println!(")) {
            const matches = codeToRun.match(/println!\(\s*"([^"]+)"\s*(?:,\s*([^)]+))?\s*\)/g);
            if (matches) {
              stdout = matches.map(m => {
                const content = m.match(/"([^"]+)"/);
                return content ? content[1] : "";
              }).join("\n");
            }
          }
          setIdeConsoleOutput((prev) => prev + "[zeno-rust] Kompilierung erfolgreich.\nBuild abgeschlossen! Starte Programm...\n\n" + (stdout || "✓ Code ausgeführt (keine Ausgaben).") + "\n");
        } else if (lang === "golang" || lang === "go") {
          if (codeToRun.includes("Println(")) {
            const matches = codeToRun.match(/Println\(\s*"([^"]+)"\s*\)/g);
            if (matches) {
              stdout = matches.map(m => {
                const content = m.match(/"([^"]+)"/);
                return content ? content[1] : "";
              }).join("\n");
            }
          }
          setIdeConsoleOutput((prev) => prev + "[zeno-go] Go WASM Engine gestartet...\n\n" + (stdout || "✓ Go-Programm beendet (0 Exit Code).") + "\n");
        } else if (lang === "csharp") {
          if (codeToRun.includes("Console.WriteLine(")) {
            const matches = codeToRun.match(/WriteLine\(\s*"([^"]+)"\s*\)/g);
            if (matches) {
              stdout = matches.map(m => {
                const content = m.match(/"([^"]+)"/);
                return content ? content[1] : "";
              }).join("\n");
            }
          }
          setIdeConsoleOutput((prev) => prev + "[zeno-clr] Kompiliere .NET C# Code (WASM Runtime)...\nBuild erfolgreich!\n\n" + (stdout || "✓ C#-Programm beendet.") + "\n");
        } else if (lang === "cpp") {
          if (codeToRun.includes("std::cout <<")) {
            const matches = codeToRun.match(/std::cout\s*<<\s*"([^"]+)"/g);
            if (matches) {
              stdout = matches.map(m => {
                const content = m.match(/"([^"]+)"/);
                return content ? content[1] : "";
              }).join("\n");
            }
          }
          setIdeConsoleOutput((prev) => prev + "[zeno-cpp] Kompilierung erfolgreich!\n\n" + (stdout || "✓ C++ Programm beendet.") + "\n");
        } else if (lang === "ruby") {
          if (codeToRun.includes("puts ")) {
            const matches = codeToRun.match(/puts\s+["']([^"']+)["']/g);
            if (matches) {
              stdout = matches.map(m => {
                const content = m.match(/["']([^"']+)["']/);
                return content ? content[1] : "";
              }).join("\n");
            }
          }
          setIdeConsoleOutput((prev) => prev + "[zeno-ruby] Ruby 3.3.1 WASM VM ausgeführt.\n\n" + (stdout || "✓ Ruby Script beendet.") + "\n");
        } else if (lang === "perl") {
          if (codeToRun.includes("print ")) {
            const matches = codeToRun.match(/print\s+["']([^"']+)["']/g);
            if (matches) {
              stdout = matches.map(m => {
                const content = m.match(/["']([^"']+)["']/);
                return content ? content[1] : "";
              }).join("\n");
            }
          }
          setIdeConsoleOutput((prev) => prev + "[zeno-perl] Perl 5.38 WASM Interpreter ausgeführt.\n\n" + (stdout || "✓ Perl Script beendet.") + "\n");
        } else if (lang === "php") {
          if (codeToRun.includes("echo ")) {
            const matches = codeToRun.match(/echo\s+["']([^"']+)["']/g);
            if (matches) {
              stdout = matches.map(m => {
                const content = m.match(/["']([^"']+)["']/);
                return content ? content[1] : "";
              }).join("\n");
            }
          }
          setIdeConsoleOutput((prev) => prev + "[zeno-php] PHP 8.3.6 WASM Engine ausgeführt.\n\n" + (stdout || "✓ PHP Skript beendet.") + "\n");
        } else if (lang === "zig") {
          if (codeToRun.includes("print(")) {
            const matches = codeToRun.match(/print\s*\(\s*"([^"]+)"/g);
            if (matches) {
              stdout = matches.map(m => {
                const content = m.match(/"([^"]+)"/);
                return content ? content[1] : "";
              }).join("\n");
            }
          }
          setIdeConsoleOutput((prev) => prev + "[zeno-zig] Zig Build ok. Führe WASI Binary aus...\n\n" + (stdout || "✓ Zig Code beendet.") + "\n");
        } else if (lang === "lua") {
          if (codeToRun.includes("print(")) {
            const matches = codeToRun.match(/print\s*\(\s*["']([^"']+)["']\s*\)/g);
            if (matches) {
              stdout = matches.map(m => {
                const content = m.match(/["']([^"']+)["']/);
                return content ? content[1] : "";
              }).join("\n");
            }
          }
          setIdeConsoleOutput((prev) => prev + "[zeno-lua] Lua 5.4 VM ausgeführt.\n\n" + (stdout || "✓ Lua Script beendet.") + "\n");
        } else if (lang === "sql" || lang === "sqlite") {
          setIdeConsoleOutput((prev) => prev + "[zeno-sqlite] SQLite v3.45.0 WASM Ready.\n> CREATE TABLE users (id INT, name TEXT);\n> INSERT INTO users VALUES (1, 'CipherNaut');\n> SELECT * FROM users;\n\n1 | CipherNaut\n✓ Query in 0.4ms ausgeführt.\n");
        } else {
          setIdeConsoleOutput((prev) => prev + `[zeno-ide] Ausführung für Sprache ${lang.toUpperCase()} beendet.\n`);
        }
      }, 800);
    }
  };

  const runPythonInIde = (pyodide: any, pyCode: string) => {
    try {
      pyodide.runPython(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
      `);
      pyodide.runPython(pyCode);
      const stdout = pyodide.runPython("sys.stdout.getvalue()");
      const stderr = pyodide.runPython("sys.stderr.getvalue()");
      const result = (stdout + "\n" + stderr).trim();
      setIdeConsoleOutput((prev) => prev + (result || "✓ Python Code ausgeführt (keine Ausgaben).") + "\n");
    } catch (err: any) {
      setIdeConsoleOutput((prev) => prev + "Python Fehler: " + err.message + "\n");
    }
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    setCanvasColor(nextTheme === "light" ? "#E3E4E8" : "#18191B");
    showToast(nextTheme === "light" ? "Helles Design aktiviert" : "Dunkles Design aktiviert");
  };

  const handleEditorRun = () => {
    const codeToRun = editorCode;
    const lang = editorLanguage.toLowerCase();

    const runtimeStatus = editorRuntimes[lang] || "installed";
    if (runtimeStatus === "not_installed") {
      setEditorOutput(`Fehler: Die Laufzeitumgebung für "${lang.toUpperCase()}" ist nicht installiert.\n\nBitte gehe in die Einstellungen (Zahnrad-Symbol unten links) -> Registerkarte "Monaco-Editor" und klicke auf "Download & Installieren", um diese Laufzeitunterstützung einzubinden.`);
      return;
    } else if (runtimeStatus === "installing") {
      setEditorOutput(`Laufzeitumgebung für "${lang.toUpperCase()}" wird momentan heruntergeladen und installiert...\nBitte warte kurz und versuche es dann erneut.`);
      return;
    }

    if (lang === "javascript" || lang === "typescript") {
      setEditorOutput("Kompiliere & starte JS/TS Sandbox...");
      
      // Clean TypeScript types for simple runner execution (removing basic type annotations)
      let cleanedCode = codeToRun;
      if (lang === "typescript") {
        cleanedCode = codeToRun
          .replace(/:\s*(string|number|boolean|any|void|object|unknown|never)/g, "")
          .replace(/as\s+(string|number|boolean|any|void|object|unknown|never)/g, "")
          .replace(/interface\s+\w+\s*\{[^}]*\}/g, "")
          .replace(/type\s+\w+\s*=\s*[^;]+;/g, "");
      }

      const workerCode = `
        const outputs = [];
        const customConsole = {
          log: (...args) => {
            outputs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
          },
          error: (...args) => {
            outputs.push("ERROR: " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
          },
          warn: (...args) => {
            outputs.push("WARN: " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
          }
        };

        self.onmessage = function(e) {
          try {
            const fn = new Function('console', e.data);
            fn(customConsole);
            self.postMessage({ success: true, output: outputs.join('\\n') || '✓ Code ausgeführt (keine Ausgaben).' });
          } catch (err) {
            self.postMessage({ success: false, output: "Laufzeitfehler: " + err.message + "\\n" + outputs.join('\\n') });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      let isFinished = false;

      worker.onmessage = (e) => {
        isFinished = true;
        setEditorOutput(e.data.output);
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };

      worker.onerror = (e) => {
        isFinished = true;
        setEditorOutput("Syntaxfehler oder Kompilierungsfehler: " + e.message);
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };

      worker.postMessage(cleanedCode);

      // Safety timeout
      setTimeout(() => {
        if (!isFinished) {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          setEditorOutput("Zeitüberschreitung: Das Programm wurde nach 5 Sekunden beendet (möglicherweise eine Endlosschleife).");
        }
      }, 5000);

    } else if (lang === "python") {
      setEditorOutput("Lade Python WASM-Sandbox von CDN...");
      
      const loadPyodideAndRun = async () => {
        try {
          if (!(window as any).loadPyodide) {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
            script.async = true;
            script.onload = async () => {
              try {
                setEditorOutput("Initialisiere Python WASM-Laufzeitumgebung...");
                const pyodideInstance = await (window as any).loadPyodide();
                (window as any).pyodide = pyodideInstance;
                executePython(pyodideInstance, codeToRun);
              } catch (err: any) {
                setEditorOutput("Initialisierungsfehler: " + err.message);
              }
            };
            script.onerror = () => {
              setEditorOutput("Fehler: Pyodide-Skript konnte nicht von CDN geladen werden.");
            };
            document.head.appendChild(script);
          } else {
            if (!(window as any).pyodide) {
              setEditorOutput("Initialisiere Python WASM-Laufzeitumgebung...");
              (window as any).pyodide = await (window as any).loadPyodide();
            }
            executePython((window as any).pyodide, codeToRun);
          }
        } catch (err: any) {
          setEditorOutput("Fehler: " + err.message);
        }
      };

      const executePython = (pyodide: any, pyCode: string) => {
        setEditorOutput("Führe Python Code in WebAssembly-Sandbox aus...\n");
        try {
          // Setup stdout/stderr capturing
          pyodide.runPython(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
          `);

          // Run user code
          pyodide.runPython(pyCode);

          // Get outputs
          const stdout = pyodide.runPython("sys.stdout.getvalue()");
          const stderr = pyodide.runPython("sys.stderr.getvalue()");

          const result = (stdout + "\n" + stderr).trim();
          setEditorOutput(result || "✓ Python Code ausgeführt (keine Ausgaben).");
        } catch (err: any) {
          setEditorOutput("Python Fehler: " + err.message);
        }
      };

      loadPyodideAndRun();

    } else if (lang === "rust" || lang === "cpp") {
      setEditorOutput(`[zeno-compiler-sandbox] Kompiliere ${lang.toUpperCase()} Code...\n`);
      
      setTimeout(() => {
        if (lang === "rust") {
          if (!codeToRun.includes("fn main")) {
            setEditorOutput((prev) => prev + "error[E0601]: main function not found in crate\n  --> src/main.rs\n  |\n  = note: consider adding a `fn main() {}` function");
            return;
          }
          
          let stdout = "";
          if (codeToRun.includes("println!(")) {
            const matches = codeToRun.match(/println!\(\s*"([^"]+)"\s*(?:,\s*([^)]+))?\s*\)/g);
            if (matches) {
              stdout = matches.map(m => {
                const content = m.match(/"([^"]+)"/);
                return content ? content[1] : "";
              }).join("\n");
            }
          }
          
          setEditorOutput((prev) => prev + "Build abgeschlossen! Starte Programm...\n\n" + (stdout || "✓ Code ausgeführt (keine Ausgaben)."));
        } else if (lang === "cpp") {
          if (!codeToRun.includes("main()")) {
            setEditorOutput((prev) => prev + "error: main function not found");
            return;
          }
          let stdout = "";
          if (codeToRun.includes("std::cout <<")) {
            const matches = codeToRun.match(/std::cout\s*<<\s*"([^"]+)"/g);
            if (matches) {
              stdout = matches.map(m => {
                const content = m.match(/"([^"]+)"/);
                return content ? content[1] : "";
              }).join("\n");
            }
          }
          setEditorOutput((prev) => prev + "Kompilierung erfolgreich!\n\n" + (stdout || "✓ C++ Programm beendet."));
        }
      }, 1200);
    } else if (lang === "csharp") {
      setEditorOutput(`[zeno-clr-sandbox] Kompiliere .NET C# Code (WASM Runtime)...\n`);
      
      setTimeout(() => {
        if (!codeToRun.includes("Main") && !codeToRun.includes("Console.")) {
          setEditorOutput((prev) => prev + "error CS5001: Program does not contain a static 'Main' method suitable for an entry point");
          return;
        }
        
        let stdout = "";
        if (codeToRun.includes("Console.WriteLine(") || codeToRun.includes("Console.Write(")) {
          const matches = codeToRun.match(/Console\.Write(?:Line)?\s*\(\s*"([^"]+)"\s*(?:,\s*([^)]+))?\s*\)/g);
          if (matches) {
            stdout = matches.map(m => {
              const content = m.match(/"([^"]+)"/);
              return content ? content[1] : "";
            }).join("\n");
          }
        }
        
        setEditorOutput((prev) => prev + "Build erfolgreich (0 Fehler, .NET CLR WASM Ready)!\n\n" + (stdout || "✓ C#-Programm beendet."));
      }, 1000);
    } else if (lang === "golang" || lang === "go") {
      setEditorOutput(`[zeno-wasm-wasi] Starte Golang WASM Runtime...\n`);
      setTimeout(() => {
        let stdout = "";
        if (codeToRun.includes("fmt.Println(")) {
          const matches = codeToRun.match(/fmt\.Println\s*\(\s*"([^"]+)"\s*\)/g);
          if (matches) {
            stdout = matches.map(m => {
              const content = m.match(/"([^"]+)"/);
              return content ? content[1] : "";
            }).join("\n");
          }
        }
        setEditorOutput((prev) => prev + "Go WASM Binary geladen (WASI Standalone Engine).\n\n" + (stdout || "✓ Go-Programm beendet (0 Exit Code)."));
      }, 1000);
    } else if (lang === "ruby") {
      setEditorOutput(`[zeno-wasm-wasi] Starte CRuby WASM Interpreter (ruby.wasm)...\n`);
      setTimeout(() => {
        let stdout = "";
        if (codeToRun.includes("puts ")) {
          const matches = codeToRun.match(/puts\s+["']([^"']+)["']/g);
          if (matches) {
            stdout = matches.map(m => {
              const content = m.match(/["']([^"']+)["']/);
              return content ? content[1] : "";
            }).join("\n");
          }
        }
        setEditorOutput((prev) => prev + "Ruby 3.3.1 WASM VM ausgeführt.\n\n" + (stdout || "✓ Ruby Script beendet."));
      }, 1000);
    } else if (lang === "perl") {
      setEditorOutput(`[zeno-wasm-wasi] Starte Perl 5 WASM Interpreter...\n`);
      setTimeout(() => {
        let stdout = "";
        if (codeToRun.includes("print ")) {
          const matches = codeToRun.match(/print\s+["']([^"']+)["']/g);
          if (matches) {
            stdout = matches.map(m => {
              const content = m.match(/["']([^"']+)["']/);
              return content ? content[1] : "";
            }).join("\n");
          }
        }
        setEditorOutput((prev) => prev + "Perl 5.38 WASM Interpreter ausgeführt.\n\n" + (stdout || "✓ Perl Script beendet."));
      }, 1000);
    } else if (lang === "php") {
      setEditorOutput(`[zeno-wasm-wasi] Starte PHP 8.3 CLI (PHP-WASM)...\n`);
      setTimeout(() => {
        let stdout = "";
        if (codeToRun.includes("echo ")) {
          const matches = codeToRun.match(/echo\s+["']([^"']+)["']/g);
          if (matches) {
            stdout = matches.map(m => {
              const content = m.match(/["']([^"']+)["']/);
              return content ? content[1] : "";
            }).join("\n");
          }
        }
        setEditorOutput((prev) => prev + "PHP 8.3.6 WASM Engine ausgeführt.\n\n" + (stdout || "✓ PHP Skript beendet."));
      }, 1000);
    } else if (lang === "zig") {
      setEditorOutput(`[zeno-wasm-wasi] Kompiliere Zig Code (WASI Target)...\n`);
      setTimeout(() => {
        let stdout = "";
        if (codeToRun.includes("std.debug.print") || codeToRun.includes("std.log.info")) {
          const matches = codeToRun.match(/print\s*\(\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g);
          if (matches) {
            stdout = matches.map(m => {
              const content = m.match(/"([^"]+)"/);
              return content ? content[1] : "";
            }).join("\n");
          }
        }
        setEditorOutput((prev) => prev + "Zig Build ok. Führe WASI Binary aus...\n\n" + (stdout || "✓ Zig Code beendet."));
      }, 1000);
    } else if (lang === "lua") {
      setEditorOutput(`[zeno-wasm-wasi] Starte Lua 5.4 WASM Interpreter...\n`);
      setTimeout(() => {
        let stdout = "";
        if (codeToRun.includes("print(")) {
          const matches = codeToRun.match(/print\s*\(\s*["']([^"']+)["']\s*\)/g);
          if (matches) {
            stdout = matches.map(m => {
              const content = m.match(/["']([^"']+)["']/);
              return content ? content[1] : "";
            }).join("\n");
          }
        }
        setEditorOutput((prev) => prev + "Lua 5.4 VM ausgeführt.\n\n" + (stdout || "✓ Lua Script beendet."));
      }, 1000);
    } else if (lang === "sql" || lang === "sqlite") {
      setEditorOutput(`[zeno-wasm-wasi] Initialisiere SQLite WASM DB Engine (In-Memory VFS)...\n`);
      setTimeout(() => {
        setEditorOutput((prev) => prev + "SQLite v3.45.0 WASM Ready.\n> CREATE TABLE zeno_users (id INT, name TEXT);\n> INSERT INTO zeno_users VALUES (1, 'CipherNaut');\n> SELECT * FROM zeno_users;\n\n1 | CipherNaut\n✓ Query in 0.4ms ausgeführt.");
      }, 800);
    } else {
      setEditorOutput(`Kompilierung für ${lang.toUpperCase()} nicht unterstützt. Installiere diese Sprachumgebung im WASM Runtime Hub auf der Startseite.`);
    }
  };

  const activeIdeFile = ideFiles.find((f) => f.path === ideActiveFilePath);

  const handleIdeCodeChange = (newVal: string | undefined) => {
    setIdeFiles((prev) =>
      prev.map((f) => (f.path === ideActiveFilePath ? { ...f, code: newVal || "" } : f))
    );
  };

  const renderIdeFileTree = () => {
    const sorted = [...ideFiles].sort((a, b) => {
      const aParts = a.path.split('/');
      const bParts = b.path.split('/');
      const len = Math.min(aParts.length, bParts.length);
      for (let i = 0; i < len; i++) {
        if (aParts[i] !== bParts[i]) {
          const aIsFolder = i < aParts.length - 1 || a.isFolder;
          const bIsFolder = i < bParts.length - 1 || b.isFolder;
          if (aIsFolder !== bIsFolder) {
            return aIsFolder ? -1 : 1;
          }
          return aParts[i].localeCompare(bParts[i]);
        }
      }
      return aParts.length - bParts.length;
    });

    return sorted.map((file) => {
      const parts = file.path.split('/');
      const depth = parts.length - 1;
      const parentPath = parts.slice(0, -1).join('/');

      let isVisible = true;
      let currentParent = parentPath;
      while (currentParent) {
        if (ideExpandedFolders[currentParent] === false) {
          isVisible = false;
          break;
        }
        const nextParts = currentParent.split('/');
        nextParts.pop();
        currentParent = nextParts.join('/');
      }

      if (!isVisible) return null;

      const isFolder = file.isFolder;
      const isExpanded = ideExpandedFolders[file.path] !== false;
      const isActive = ideActiveFilePath === file.path;

      return (
        <div
          key={file.path}
          className={`ide-tree-item ${isActive ? "active" : ""}`}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          onClick={() => {
            if (isFolder) {
              setIdeExpandedFolders((prev) => ({
                ...prev,
                [file.path]: !isExpanded
              }));
            } else {
              handleIdeFileSelect(file.path);
            }
          }}
        >
          <span className="ide-tree-icon">
            <Icon
              icon={
                isFolder
                  ? (isExpanded ? "mage:chevron-down" : "mage:chevron-right")
                  : (file.language === "rust" ? "vscode-icons:file-type-rust" :
                     file.language === "python" ? "vscode-icons:file-type-python" :
                     file.language === "golang" ? "vscode-icons:file-type-go" :
                     file.language === "csharp" ? "vscode-icons:file-type-csharp" :
                     file.language === "cpp" ? "vscode-icons:file-type-cpp" :
                     file.language === "javascript" ? "vscode-icons:file-type-js" :
                     file.language === "typescript" ? "vscode-icons:file-type-typescript" :
                     file.language === "html" ? "vscode-icons:file-type-html" :
                     file.language === "css" ? "vscode-icons:file-type-css" :
                     file.language === "toml" ? "vscode-icons:file-type-toml" :
                     "mage:file-records")
              }
              style={{
                fontSize: "14px",
                marginRight: "6px",
                color: isFolder ? "var(--accent-color)" : "inherit"
              }}
            />
          </span>
          <span className="ide-tree-name">{file.name}</span>

          <div className="ide-tree-actions" onClick={(e) => e.stopPropagation()}>
            {isFolder && (
              <>
                <button
                  onClick={() => {
                    setIdeNewItemType("file");
                    setIdeNewItemParentPath(file.path);
                    setIsIdeNewItemModalOpen(true);
                  }}
                  title="Neue Datei"
                >
                  <Icon icon="mage:plus" />
                </button>
                <button
                  onClick={() => {
                    setIdeNewItemType("folder");
                    setIdeNewItemParentPath(file.path);
                    setIsIdeNewItemModalOpen(true);
                  }}
                  title="Neuer Ordner"
                >
                  <Icon icon="mage:folder-open" />
                </button>
              </>
            )}
            <button onClick={(e) => handleIdeItemDelete(file.path, e)} title="Löschen">
              <Icon icon="mage:trash-3" />
            </button>
          </div>
        </div>
      );
    });
  };

  const isIdeActive = activeServerId === "home" && homeTab === "ide";

  return (
    <div className={`app-layout ${isIdeActive ? "in-ide" : ""}`}>
      {/* 1. SERVER SIDEBAR */}
      <aside className="server-sidebar">
        <button 
          className={`server-icon home-button ${activeServerId === "home" ? "active" : ""}`} 
          onClick={() => { setActiveServerId("home"); setHomeTab("dashboard"); }} 
          title="Zeno Home"
        >
          <img src="/zeno_logo.svg" alt="Zeno Logo" style={{ width: "30px", height: "30px", borderRadius: "6px" }} />
        </button>

        <div className="server-separator" role="separator" />

        <nav className="server-list" aria-label="Server-Liste">
          {servers.map((srv) => (
            <button
              key={srv.id}
              className={`server-icon ${activeServer.id === srv.id && activeServerId !== "home" ? "active" : ""} ${animatingServerId === srv.id ? "indicator-animate" : ""}`}
              onClick={() => handleServerSelect(srv)}
              title={srv.name}
            >
              <span className="server-icon-letter">{srv.iconLetter}</span>
            </button>
          ))}
          <button 
            className="server-icon" 
            id="btn-add-server" 
            onClick={() => showToast("Server-Erstellung ist im Prototyp deaktiviert")} 
            title="Server hinzufügen"
          >
            <span className="server-icon-letter">+</span>
          </button>
        </nav>
      </aside>

      {/* 2. CHANNEL SIDEBAR */}
      {!(activeServerId === "home" && homeTab === "ide") && (
        <aside className="channel-sidebar">
        {activeServerId === "home" ? (
          <>
            <header className="server-header">
              <h1 className="server-name">Zeno Home</h1>
              <Icon icon="mage:home" style={{ fontSize: "16px", color: "var(--text-muted)" }} />
            </header>
            <div className="channel-list">
              <section className="channel-category">
                <button className="category-header" style={{ cursor: "default" }}>
                  <span className="category-name">NAVIGATION</span>
                </button>
                <ul className="category-channels">
                  <li>
                    <button 
                      className={`channel-item ${homeTab === "dashboard" ? "active" : ""}`}
                      onClick={() => setHomeTab("dashboard")}
                    >
                      <span className="channel-icon"><Icon icon="mage:dashboard" /></span>
                      <span className="channel-name">Dashboard</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`channel-item ${homeTab === "wasm_hub" ? "active" : ""}`}
                      onClick={() => setHomeTab("wasm_hub")}
                    >
                      <span className="channel-icon"><Icon icon="mage:box-3d" style={{ color: "#3574F0" }} /></span>
                      <span className="channel-name">⚡ WASM Runtime Hub</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`channel-item ${homeTab === "ide" ? "active" : ""}`}
                      onClick={() => setHomeTab("ide")}
                    >
                      <span className="channel-icon"><Icon icon="mage:code" style={{ color: "#59A869" }} /></span>
                      <span className="channel-name">🛠️ Zeno Full-IDE</span>
                    </button>
                  </li>
                  <li>
                    <button className="channel-item" onClick={() => setIsSettingsOpen(true)}>
                      <span className="channel-icon"><Icon icon="mage:settings" /></span>
                      <span className="channel-name">Einstellungen</span>
                    </button>
                  </li>
                </ul>
              </section>
            </div>
          </>
        ) : (
          <>
            <header className="server-header">
              <h1 className="server-name">{activeServer.name}</h1>
              <button className="server-dropdown-toggle" onClick={() => showToast("Server-Menü geöffnet")}>
                <Icon icon="mage:chevron-down" />
              </button>
            </header>
            <div className="channel-list" key={activeServer.id}>
          {activeServer.categories.map((cat) => {
            const isCollapsed = collapsedCategories[cat.name];
            return (
              <section key={cat.name} className="channel-category">
                <button className="category-header" onClick={() => toggleCategory(cat.name)}>
                  <span className={`category-arrow ${isCollapsed ? "collapsed" : ""}`}>
                    <Icon icon="mage:chevron-down" />
                  </span>
                  <span className="category-name">{cat.name.toUpperCase()}</span>
                </button>
                
                {!isCollapsed && (
                  <ul className="category-channels">
                    {cat.channels.map((ch, idx) => {
                      const isText = cat.type === "text";
                      const isChannelActive = activeChannel.id === ch.id;
                      
                      return (
                        <li key={ch.id}>
                          <button
                            className={`channel-item channel-item-animate ${isChannelActive ? "active" : ""} ${!isText ? "voice-channel" : ""}`}
                            onClick={() => isText ? setActiveChannel(ch) : handleJoinVoice(ch.id, ch.name)}
                            style={{ "--idx": Math.min(idx, 6) } as React.CSSProperties}
                          >
                            <span className="channel-icon">
                              <Icon icon={isText ? "mage:hashtag" : "mage:volume-up"} />
                            </span>
                            <span className="channel-name">{ch.name}</span>
                          </button>

                          {/* Connected voice users */}
                          {!isText && ch.connectedUsers && (
                            <ul className="voice-connected-users">
                              {ch.connectedUsers.map((u) => (
                                <li key={u} className="voice-user">
                                  <span className="voice-user-avatar">{u[0]}</span>
                                  <span className="voice-user-name">{u}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
          </>
        )}

        {/* User Info Footer */}
        <footer className="user-panel">
          {/* Voice Connected State Area */}
          {connectedVoice && (
            <div className="voice-indicator">
              <div className="voice-status">
                <span className="voice-status-icon">
                  <Icon icon="mage:volume-up" className="voice-status-indicator pulse" style={{ color: "var(--accent-success, #59A869)", marginRight: "4px" }} />
                </span>
                <span className="voice-status-text">
                  Verbunden mit <strong>{connectedVoice}</strong> ({formatVoiceTime(voiceDuration)})
                </span>
              </div>
              <button className="voice-disconnect" onClick={handleDisconnectVoice} title="Trennen">
                <Icon icon="mage:multiply" />
              </button>
            </div>
          )}

          <div 
            className="user-info" 
            style={{ cursor: "pointer" }}
            onClick={() => setSelectedUserProfile(mockProfiles.CipherNaut)}
          >
            <div className="user-avatar-wrapper">
              <div className="user-avatar purple">C</div>
              <span className="status-dot online" />
            </div>
            <div className="user-details">
              <span className="user-name">CipherNaut</span>
              <span className="user-id">0xA3F...8B2</span>
            </div>
          </div>
          <div className="user-controls">
            <button className="user-control-btn" onClick={handleThemeToggle} title="Design umschalten">
              <Icon icon={theme === "light" ? "mage:moon" : "mage:sun"} />
            </button>
             <button className={`user-control-btn ${muted ? "active" : ""}`} onClick={() => { setMuted(!muted); showToast(muted ? "Mikrofon aktiviert" : "Mikrofon stummgeschaltet"); }} title="Mikrofon">
              <Icon icon={muted ? "mage:microphone-mute" : "mage:microphone"} />
            </button>
            <button className={`user-control-btn ${deafened ? "active" : ""}`} onClick={() => { setDeafened(!deafened); showToast(deafened ? "Audio aktiviert" : "Audio stummgeschaltet"); }} title="Stummschalten">
              <Icon icon={deafened ? "mage:volume-mute" : "mage:volume-up"} />
            </button>
            <button className="user-control-btn" onClick={() => setIsSettingsOpen(true)} title="Einstellungen">
              <Icon icon="mage:settings" />
            </button>
          </div>
        </footer>
      </aside>
      )}

      {/* 3. CHAT MAIN AREA */}
      <main className="chat-area">
        {activeServerId === "home" ? (
          homeTab === "dashboard" ? (
          <div className="zeno-dashboard" style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>
            <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "8px" }}>
              <div className="dashboard-welcome">
                <h1 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)" }}>Willkommen zurück, CipherNaut</h1>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Dein privates, sicheres Workspace-Dashboard. Zero-Knowledge, 100% clientseitig.</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {dashboardEditMode && (
                  <button className="settings-btn primary" onClick={addCustomWidget} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "6px 12px" }}>
                    <Icon icon="mage:plus" /> Widget
                  </button>
                )}
                <button className={`settings-btn ${dashboardEditMode ? "primary" : ""}`} onClick={() => { setDashboardEditMode((v) => !v); setEditingWidgetId(null); }} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "6px 12px" }}>
                  <Icon icon={dashboardEditMode ? "mage:check" : "mage:settings"} />
                  {dashboardEditMode ? "Fertig" : "Dashboard bearbeiten"}
                </button>
              </div>
            </header>

            <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gridAutoRows: "minmax(220px, auto)", gap: "16px", padding: "16px 0", flex: 1 }}>
              {[...widgets].sort((a, b) => a.order - b.order).map((widget) => {
                const hasBg = !!widget.bgColor;
                const fgColor = hasBg ? getContrastColor(widget.bgColor) : "var(--text-primary)";
                const fgMuted = hasBg ? getContrastColor(widget.bgColor) + "99" : "var(--text-muted)";
                const cardBg = hasBg ? widget.bgColor : "var(--bg-secondary)";
                const isDragging = draggedWidgetId === widget.id;
                return (
                  <div
                    key={widget.id}
                    draggable={dashboardEditMode}
                    onDragStart={(e) => {
                      if (e.dataTransfer) {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", widget.id);
                      }
                      setTimeout(() => {
                        setDraggedWidgetId(widget.id);
                      }, 0);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer) {
                        e.dataTransfer.dropEffect = "move";
                      }
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleWidgetDrop(widget.id);
                    }}
                    onDragEnd={() => setDraggedWidgetId(null)}
                    className={swappingWidgetIds.includes(widget.id) ? "widget-swapping" : ""}
                    style={{ gridColumn: `span ${widget.colSpan}`, gridRow: `span ${widget.rowSpan}`, backgroundColor: cardBg, border: `1px solid ${hasBg ? "transparent" : "var(--border-color)"}`, borderRadius: "var(--radius-lg)", padding: "16px", display: "flex", flexDirection: "column", position: "relative", opacity: isDragging ? 0.4 : 1, transition: "opacity 0.2s, box-shadow 0.2s", boxShadow: dashboardEditMode ? "0 0 0 2px var(--glow-color-1,#3574F0)55" : "none", cursor: dashboardEditMode ? "grab" : "default", minHeight: widget.rowSpan === 2 ? "460px" : "220px" }}
                  >
                    {dashboardEditMode && (() => {
                      const sorted = [...widgets].sort((a, b) => a.order - b.order);
                      const idx = sorted.findIndex((w) => w.id === widget.id);
                      const isFirst = idx === 0;
                      const isLast = idx === sorted.length - 1;
                      return (
                        <div style={{ position: "absolute", top: "8px", right: "8px", display: "flex", gap: "4px", zIndex: 10, pointerEvents: "auto" }}>
                          {!isFirst && (
                            <button onClick={() => moveWidget(widget.id, "left")} title="Nach vorne verschieben" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", color: "var(--text-primary)", fontSize: "13px", display: "flex", alignItems: "center" }}>
                              <Icon icon="mage:chevron-left" />
                            </button>
                          )}
                          {!isLast && (
                            <button onClick={() => moveWidget(widget.id, "right")} title="Nach hinten verschieben" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", color: "var(--text-primary)", fontSize: "13px", display: "flex", alignItems: "center" }}>
                              <Icon icon="mage:chevron-right" />
                            </button>
                          )}
                          <button onClick={() => setEditingWidgetId(editingWidgetId === widget.id ? null : widget.id)} style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", color: "var(--text-primary)", fontSize: "13px", display: "flex", alignItems: "center" }}><Icon icon="mage:settings" /></button>
                          <button onClick={() => deleteWidget(widget.id)} style={{ background: "rgba(200,50,50,0.12)", border: "1px solid rgba(200,50,50,0.25)", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", color: "#e05252", fontSize: "13px", display: "flex", alignItems: "center" }}><Icon icon="mage:trash" /></button>
                        </div>
                      );
                    })()}
                    {dashboardEditMode && editingWidgetId === widget.id && (
                      <div style={{ position: "absolute", top: "44px", right: "8px", width: "240px", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "12px", zIndex: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.6px" }}>Widget-Einstellungen</span>
                        <div>
                          <label style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Titel</label>
                          <input className="settings-input" value={widget.title} onChange={(e) => updateWidget(widget.id, { title: e.target.value })} style={{ fontSize: "11px", padding: "5px 8px", maxWidth: "none", width: "100%" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Hintergrundfarbe</label>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <input type="color" value={widget.bgColor || "#1a1f2e"} onChange={(e) => updateWidget(widget.id, { bgColor: e.target.value })} style={{ width: "32px", height: "28px", border: "none", borderRadius: "6px", cursor: "pointer", padding: "1px" }} />
                            <input className="settings-input" value={widget.bgColor} placeholder="leer = Standard" onChange={(e) => updateWidget(widget.id, { bgColor: e.target.value })} style={{ fontSize: "10px", padding: "5px 8px", flex: 1, fontFamily: "var(--font-mono)" }} />
                            {widget.bgColor && <button onClick={() => updateWidget(widget.id, { bgColor: "" })} style={{ background: "none", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "3px 5px", cursor: "pointer", color: "var(--text-muted)", fontSize: "10px" }}>x</button>}
                          </div>
                          {widget.bgColor && <p style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "4px" }}>Vordergrundfarbe: <span style={{ fontFamily: "var(--font-mono)" }}>{fgColor}</span></p>}
                        </div>
                        <div>
                          <label style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Größe</label>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                            {([["1x1", 1, 1], ["2x1 Breit", 2, 1], ["1x2 Hoch", 1, 2], ["2x2 Groß", 2, 2]] as [string, WidgetColSpan, WidgetRowSpan][]).map(([label, col, row]) => (
                              <button key={label} onClick={() => updateWidget(widget.id, { colSpan: col, rowSpan: row })} style={{ fontSize: "10px", padding: "4px 6px", borderRadius: "6px", border: `1px solid ${widget.colSpan === col && widget.rowSpan === row ? "var(--glow-color-1,#3574F0)" : "var(--border-color)"}`, background: widget.colSpan === col && widget.rowSpan === row ? "rgba(53,116,240,0.15)" : "var(--bg-tertiary)", color: "var(--text-primary)", cursor: "pointer" }}>{label}</button>
                            ))}
                          </div>
                        </div>
                        {widget.type === "custom" && (
                          <div>
                            <label style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>JavaScript (return HTML)</label>
                            <textarea value={widget.customCode} onChange={(e) => updateWidget(widget.id, { customCode: e.target.value })} spellCheck={false} style={{ width: "100%", height: "120px", fontSize: "10px", fontFamily: "var(--font-mono)", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "var(--text-primary)", padding: "6px 8px", resize: "vertical", boxSizing: "border-box" }} />
                            <p style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "3px" }}>JS-Code der einen HTML-String zurückgibt (return).</p>
                          </div>
                        )}
                        {widget.type === "git-status" && (
                          <div>
                            <label style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Datenquelle</label>
                            <select 
                              className="settings-input" 
                              value={widget.gitMode || "local"} 
                              onChange={(e) => {
                                const mode = e.target.value as "local" | "github";
                                updateWidget(widget.id, { 
                                  gitMode: mode,
                                  title: mode === "github" ? "GitHub Repository" : "Git Repository Status"
                                });
                              }}
                              style={{ width: "100%", fontSize: "11px", padding: "5px 8px", marginBottom: "8px" }}
                            >
                              <option value="local">Lokal (System-Git)</option>
                              <option value="github">GitHub API (Cloud)</option>
                            </select>
                            
                            {widget.gitMode === "github" && (
                              <div>
                                <label style={{ fontSize: "9px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Repository</label>
                                {githubToken ? (
                                  githubReposLoading ? (
                                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Lade Repos...</span>
                                  ) : (
                                    <select
                                      className="settings-input"
                                      value={widget.gitRepo || ""}
                                      onChange={(e) => {
                                        const repo = e.target.value;
                                        updateWidget(widget.id, { 
                                          gitRepo: repo,
                                          title: repo ? `GitHub: ${repo.split("/")[1]}` : "GitHub Repository"
                                        });
                                      }}
                                      style={{ width: "100%", fontSize: "11px", padding: "5px 8px" }}
                                    >
                                      <option value="">-- Wähle Repo --</option>
                                      {githubRepos.map((r) => (
                                        <option key={r.fullName} value={r.fullName}>{r.fullName}</option>
                                      ))}
                                    </select>
                                  )
                                ) : (
                                  <p style={{ fontSize: "9px", color: "#e05252" }}>Trage zuerst deinen GitHub-Token in den Einstellungen ein.</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, pointerEvents: dashboardEditMode ? "none" : "auto", height: "100%", minHeight: 0 }}>
                      <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}`, paddingBottom: "10px", marginBottom: "12px", paddingRight: dashboardEditMode ? "56px" : "0px" }}>
                      {dashboardEditMode && <span style={{ fontSize: "14px", color: fgMuted, cursor: "grab", userSelect: "none" }} title="Ziehen zum Verschieben">⠿</span>}
                      <span style={{ fontSize: "18px", color: hasBg ? fgColor : "var(--accent-color)" }}>
                        <Icon icon={widget.type === "recent-files" ? "mage:file-records" : widget.type === "git-status" ? "mage:github" : widget.type === "weather" ? "mage:sun" : widget.type === "privacy-guard" ? "mage:shield" : "mage:code"} />
                      </span>
                      <h3 style={{ fontSize: "13px", fontWeight: "600", color: fgColor, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{widget.title}</h3>
                    </div>
                    {widget.type === "recent-files" && (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {recentFiles.map((file) => (
                            <div key={file.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: hasBg ? fgColor + "11" : "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}` }}>
                              <div onClick={() => openWorkspaceFile(file.name, file.language)} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", flex: 1, minWidth: 0 }}>
                                <Icon icon={file.language === "rust" ? "vscode-icons:file-type-rust" : file.language === "python" ? "vscode-icons:file-type-python" : file.language === "javascript" ? "vscode-icons:file-type-js" : "mage:file-records"} style={{ fontSize: "16px", flexShrink: 0 }} />
                                <span style={{ fontSize: "12px", fontWeight: "500", color: fgColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</span>
                              </div>
                              <span style={{ fontSize: "9px", color: fgMuted, fontWeight: "600" }}>{file.language.toUpperCase()}</span>
                            </div>
                          ))}
                          {recentFiles.length === 0 && <p style={{ fontSize: "11px", color: fgMuted, textAlign: "center", padding: "16px" }}>Keine Dateien.</p>}
                        </div>
                        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                          <button className="settings-btn primary" onClick={() => { setEditorCode(""); setEditorWorkflowStep("input_filename"); setIsEditorOpen(true); }} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "6px 12px" }}><Icon icon="mage:plus" /> Neue Datei</button>
                          <button className="settings-btn" onClick={() => { setEditorWorkflowStep("select_action"); setIsEditorOpen(true); }} style={{ fontSize: "11px", padding: "6px 12px" }}><Icon icon="mage:file-records" /> Editor</button>
                        </div>
                      </div>
                    )}
                    {widget.type === "git-status" && (() => {
                      const isGithub = widget.gitMode === "github";
                      if (isGithub) {
                        if (!githubToken.trim()) {
                          return (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative", height: "100%", width: "100%", overflow: "hidden", borderRadius: "8px" }}>
                              <img 
                                src="/github_placeholder.jpg" 
                                alt="Hier könnten Ihre Repos angezeigt werden" 
                                style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }} 
                              />
                              <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(255,255,255,0.05)", pointerEvents: "none" }} />
                            </div>
                          );
                        }
                        const repoName = widget.gitRepo;
                        if (!repoName) {
                          return (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "8px", textAlign: "center", padding: "16px" }}>
                              <Icon icon="mage:settings" style={{ fontSize: "28px", color: fgMuted }} />
                              <span style={{ fontSize: "11px", color: fgMuted }}>Kein Repository ausgewählt. Klicke oben rechts auf das Zahnrad im Edit-Modus.</span>
                            </div>
                          );
                        }
                        const data = githubRepoData[repoName];
                        if (!data) {
                          return (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "8px", padding: "20px" }}>
                              <span style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "var(--glow-color-1,#3574F0)", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                              <span style={{ fontSize: "11px", color: fgMuted }}>Lade Repository-Daten...</span>
                            </div>
                          );
                        }
                        const activeTab = gitWidgetTabs[widget.id] || "commits";
                        const setActiveTab = (tab: string) => setGitWidgetTabs(prev => ({ ...prev, [widget.id]: tab }));
                        return (
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", minHeight: 0 }}>
                            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingBottom: "10px", borderBottom: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}` }}>
                                <div>
                                  <span style={{ fontSize: "10px", color: fgMuted, display: "block" }}>Default Branch</span>
                                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#F05032", display: "flex", alignItems: "center", gap: "4px" }}>
                                    <Icon icon="mage:code" style={{ fontSize: "14px" }} /> {data.defaultBranch || "main"}
                                  </span>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <span style={{ fontSize: "10px", color: fgMuted, display: "block" }}>Sterne</span>
                                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#FFC66D", display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                                    ⭐ {data.stars} Stars
                                  </span>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: "4px", marginBottom: "12px", borderBottom: `1px solid ${hasBg ? fgColor + "11" : "rgba(255,255,255,0.05)"}`, paddingBottom: "4px" }}>
                                {[
                                  { id: "commits", label: "Commits" },
                                  { id: "issues", label: `Issues (${data.issues?.length || 0})` },
                                  { id: "pulls", label: `PRs (${data.pulls?.length || 0})` },
                                  { id: "branches", label: "Branches" }
                                ].map(tab => (
                                  <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                      fontSize: "10px",
                                      padding: "4px 8px",
                                      background: activeTab === tab.id ? (hasBg ? fgColor + "22" : "var(--bg-tertiary)") : "none",
                                      border: "none",
                                      borderRadius: "4px",
                                      color: activeTab === tab.id ? fgColor : fgMuted,
                                      cursor: "pointer",
                                      fontWeight: "600",
                                      transition: "all 0.15s"
                                    }}
                                  >
                                    {tab.label}
                                  </button>
                                ))}
                              </div>
                              <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                                {activeTab === "commits" && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {data.commits && data.commits.map((c: any) => (
                                      <div key={c.hash} style={{ display: "flex", gap: "8px", fontSize: "11px", alignItems: "center" }}>
                                        <span style={{ color: "var(--glow-color-1,#3574F0)", fontFamily: "var(--font-mono)", fontWeight: "600", flexShrink: 0 }}>{c.hash}</span>
                                        <span style={{ color: fgColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }} title={c.message}>{c.message}</span>
                                        <span style={{ fontSize: "9px", color: fgMuted, flexShrink: 0 }}>{c.date}</span>
                                      </div>
                                    ))}
                                    {(!data.commits || data.commits.length === 0) && (
                                      <span style={{ fontSize: "11px", color: fgMuted }}>Keine Commits vorhanden.</span>
                                    )}
                                  </div>
                                )}
                                {activeTab === "issues" && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {data.issues && data.issues.map((i: any) => (
                                      <a key={i.number} href={i.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: "6px", fontSize: "11px", textDecoration: "none", color: fgColor, alignItems: "center" }}>
                                        <span style={{ color: "#e05252", fontWeight: "600", flexShrink: 0 }}>#{i.number}</span>
                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }} title={i.title}>{i.title}</span>
                                      </a>
                                    ))}
                                    {(!data.issues || data.issues.length === 0) && (
                                      <span style={{ fontSize: "11px", color: "#59A869", fontWeight: "600" }}>✓ Keine offenen Issues!</span>
                                    )}
                                  </div>
                                )}
                                {activeTab === "pulls" && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {data.pulls && data.pulls.map((p: any) => (
                                      <a key={p.number} href={p.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: "6px", fontSize: "11px", textDecoration: "none", color: fgColor, alignItems: "center" }}>
                                        <span style={{ color: "#59A869", fontWeight: "600", flexShrink: 0 }}>#{p.number}</span>
                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }} title={p.title}>{p.title}</span>
                                      </a>
                                    ))}
                                    {(!data.pulls || data.pulls.length === 0) && (
                                      <span style={{ fontSize: "11px", color: fgMuted }}>Keine offenen Pull Requests.</span>
                                    )}
                                  </div>
                                )}
                                {activeTab === "branches" && (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                    {data.branches && data.branches.map((b: string) => (
                                      <span key={b} className="badge" style={{ backgroundColor: "rgba(53,116,240,0.1)", color: "var(--glow-color-1,#3574F0)", border: "1px solid rgba(53,116,240,0.2)", fontSize: "10px", padding: "3px 8px", borderRadius: "4px" }}>
                                        {b}
                                      </span>
                                    ))}
                                    {(!data.branches || data.branches.length === 0) && (
                                      <span style={{ fontSize: "11px", color: fgMuted }}>Keine Branches geladen.</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                              <button className="settings-btn" onClick={() => { fetchGithubRepoDetails(repoName); showToast("GitHub-Daten aktualisiert"); }} style={{ fontSize: "11px", padding: "6px 12px" }}>Aktualisieren</button>
                              <a href={`https://github.com/${repoName}`} target="_blank" rel="noopener noreferrer" className="settings-btn primary" style={{ fontSize: "11px", padding: "6px 12px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                Auf GitHub öffnen
                              </a>
                            </div>
                          </div>
                        );
                      }
                      if (gitError) {
                        return (
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                              <div style={{ fontSize: "9px", color: "#e05252", padding: "6px 8px", background: "rgba(224,82,82,0.1)", borderRadius: "var(--radius-sm)", marginBottom: "10px", border: "1px solid rgba(224,82,82,0.2)" }} title={gitError}>
                                ⚠️ Kein lokales Git-Repo oder Befehl nicht verfügbar.
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "20px 10px", gap: "8px", marginTop: "10px" }}>
                                <Icon icon="mage:code" style={{ fontSize: "24px", color: fgMuted }} />
                                <span style={{ fontSize: "11px", color: fgMuted }}>Initialisiere ein Git-Repository (<code>git init</code>) im Workspace, um den Status anzuzeigen.</span>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                              <button className="settings-btn" onClick={() => { fetchLiveGitData(); showToast("Git-Status aktualisiert"); }} style={{ fontSize: "11px", padding: "6px 12px" }}>Aktualisieren</button>
                            </div>
                          </div>
                        );
                      }
                      const displayBranch = liveGitStatus?.branch || "main (Simuliert)";
                      const isClean = liveGitStatus ? liveGitStatus.is_clean : true;
                      const commits = liveGitStatus && liveGitCommits.length > 0 ? liveGitCommits : [
                        { hash: "5a69096", message: "Dashboard widget system: drag, resize, custom colors", date: "vor 2 Std." },
                        { hash: "140a9f0", message: "feat(weather): three-mode weather widget", date: "vor 4 Std." },
                        { hash: "0f551dc", message: "Add Monaco Editor runtime settings", date: "vor 1 Tag" }
                      ];
                      return (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", borderBottom: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}`, paddingBottom: "10px" }}>
                              <div>
                                <span style={{ fontSize: "10px", color: fgMuted, display: "block" }}>Branch</span>
                                <span style={{ fontSize: "12px", fontWeight: "600", color: "#F05032", display: "flex", alignItems: "center", gap: "4px" }}><Icon icon="mage:code" style={{ fontSize: "14px" }} /> {displayBranch}</span>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <span style={{ fontSize: "10px", color: fgMuted, display: "block" }}>Status</span>
                                {isClean ? (
                                  <span className="badge" style={{ backgroundColor: "rgba(89,168,105,0.15)", color: "#59A869", border: "1px solid rgba(89,168,105,0.2)", fontSize: "10px", padding: "2px 6px" }}>Clean</span>
                                ) : (
                                  <span className="badge" style={{ backgroundColor: "rgba(224,82,82,0.15)", color: "#e05252", border: "1px solid rgba(224,82,82,0.2)", fontSize: "10px", padding: "2px 6px" }}>
                                    {liveGitStatus ? `${liveGitStatus.modified + liveGitStatus.added + liveGitStatus.deleted + liveGitStatus.untracked} Änderungen` : "Geändert"}
                                  </span>
                                )}
                              </div>
                            </div>
                            {liveGitStatus && !isClean && (
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px", fontSize: "10px" }}>
                                {liveGitStatus.modified > 0 && <span style={{ color: "#FFC66D" }}>{liveGitStatus.modified} modifiziert</span>}
                                {liveGitStatus.added > 0 && <span style={{ color: "#59A869" }}>{liveGitStatus.added} neu</span>}
                                {liveGitStatus.deleted > 0 && <span style={{ color: "#e05252" }}>{liveGitStatus.deleted} gelöscht</span>}
                                {liveGitStatus.untracked > 0 && <span style={{ color: fgMuted }}>{liveGitStatus.untracked} unversioniert</span>}
                              </div>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <span style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", color: fgMuted, display: "block", marginBottom: "4px" }}>Letzte Commits</span>
                              {commits.map((c) => (
                                <div key={c.hash} style={{ display: "flex", gap: "8px", fontSize: "11px", alignItems: "center" }}>
                                  <span style={{ color: "var(--glow-color-1,#3574F0)", fontFamily: "var(--font-mono)", fontWeight: "600", flexShrink: 0 }}>{c.hash}</span>
                                  <span style={{ color: fgColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }} title={c.message}>{c.message}</span>
                                  <span style={{ fontSize: "9px", color: fgMuted, flexShrink: 0 }}>{c.date}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                            <button className="settings-btn" onClick={() => { fetchLiveGitData(); showToast("Git-Status aktualisiert"); }} style={{ fontSize: "11px", padding: "6px 12px" }}>Aktualisieren</button>
                            <button className="settings-btn" onClick={() => showToast("Zeno ist lokal und führt Push-Befehle nur über dein System-Git aus")} style={{ fontSize: "11px", padding: "6px 12px" }}>Push (Lokal)</button>
                          </div>
                        </div>
                      );
                    })()}
                    {widget.type === "weather" && (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="text"
                            className="settings-input"
                            placeholder="Standort (z. B. Berlin) + Enter"
                            value={dashboardLocation}
                            onChange={(e) => { setDashboardLocation(e.target.value); setRealWeatherData(null); }}
                            onKeyDown={(e) => { if (e.key === "Enter") fetchRealWeather(); }}
                            style={{ flex: 1, padding: "6px 10px", fontSize: "12px", maxWidth: "none" }}
                          />
                          <select className="settings-input" value={weatherMode} onChange={(e) => { setWeatherMode(e.target.value as "wttr" | "custom"); setRealWeatherData(null); }} style={{ padding: "6px 8px", fontSize: "11px", width: "auto", flexShrink: 0 }}>
                            <option value="wttr">wttr.in</option>
                            <option value="custom">Custom API</option>
                          </select>
                        </div>
                        {weatherMode === "custom" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "8px 10px", backgroundColor: hasBg ? fgColor + "11" : "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}` }}>
                            <input type="text" className="settings-input" value={weatherApiUrl} onChange={(e) => setWeatherApiUrl(e.target.value)} style={{ fontSize: "10px", padding: "5px 8px", maxWidth: "none", fontFamily: "var(--font-mono)" }} />
                            <input type="password" className="settings-input" placeholder="API-Key" value={weatherApiKey} onChange={(e) => setWeatherApiKey(e.target.value)} style={{ fontSize: "11px", padding: "5px 8px", maxWidth: "none" }} />
                          </div>
                        )}
                        {!realWeatherData ? (
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "20px", textAlign: "center" }}>
                            {weatherFetching ? (
                              <>
                                <span style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "var(--glow-color-1,#3574F0)", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                                <span style={{ fontSize: "11px", color: fgMuted }}>Lade Wetterdaten...</span>
                              </>
                            ) : (
                              <>
                                <Icon icon="mage:sun" style={{ fontSize: "28px", color: fgMuted }} />
                                <span style={{ fontSize: "11px", color: fgMuted }}>Keine Wetterdaten geladen</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: hasBg ? fgColor + "11" : "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}` }}>
                              <div>
                                <span style={{ fontSize: "24px", fontWeight: "700", display: "block", color: fgColor }}>{realWeatherData.temp}</span>
                                <span style={{ fontSize: "12px", fontWeight: "600", color: fgMuted }}>{dashboardLocation}</span>
                                <span style={{ fontSize: "10px", display: "block", color: "var(--glow-color-1,#3574F0)", marginTop: "4px" }}>{dashboardTime}</span>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <Icon icon={realWeatherData.icon} style={{ fontSize: "28px", color: "#FFC66D", display: "block", marginLeft: "auto", marginBottom: "2px" }} />
                                <span style={{ fontSize: "11px", color: fgColor, display: "block" }}>{realWeatherData.condition}</span>
                                <span style={{ fontSize: "9px", color: fgMuted, display: "block" }}>{realWeatherData.humidity} / {realWeatherData.wind}</span>
                              </div>
                            </div>

                            {realWeatherData.forecast && realWeatherData.forecast.length > 0 && (
                              <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${hasBg ? fgColor + "22" : "var(--border-color)"}` }}>
                                <span style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", color: fgMuted, display: "block", marginBottom: "8px" }}>3-Tage-Vorhersage (wttr.in)</span>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr repeat(4, 1fr)", gap: "4px", paddingBottom: "4px", borderBottom: `1px solid ${hasBg ? fgColor + "15" : "var(--border-color)"}`, fontSize: "8px", fontWeight: "bold", textTransform: "uppercase", color: fgMuted, textAlign: "center" }}>
                                    <div style={{ textAlign: "left" }}>Tag</div>
                                    <div>Nacht</div>
                                    <div>Morgen</div>
                                    <div>Mittag</div>
                                    <div>Abend</div>
                                  </div>
                                  {realWeatherData.forecast.map((f, idx) => (
                                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.2fr repeat(4, 1fr)", gap: "4px", alignItems: "center", padding: "6px 0", borderBottom: idx < 2 ? `1px solid ${hasBg ? fgColor + "10" : "rgba(255,255,255,0.05)"}` : "none", textAlign: "center" }}>
                                      <div style={{ textAlign: "left", fontSize: "10px", fontWeight: "600", color: fgColor }}>{f.date}</div>
                                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                        <Icon icon={f.nightIcon} style={{ fontSize: "12px", color: "#FFC66D" }} />
                                        <span style={{ fontSize: "9px", color: fgColor, fontWeight: "500" }}>{f.nightTemp}</span>
                                      </div>
                                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                        <Icon icon={f.morningIcon} style={{ fontSize: "12px", color: "#FFC66D" }} />
                                        <span style={{ fontSize: "9px", color: fgColor, fontWeight: "500" }}>{f.morningTemp}</span>
                                      </div>
                                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                        <Icon icon={f.noonIcon} style={{ fontSize: "12px", color: "#FFC66D" }} />
                                        <span style={{ fontSize: "9px", color: fgColor, fontWeight: "500" }}>{f.noonTemp}</span>
                                      </div>
                                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                        <Icon icon={f.eveningIcon} style={{ fontSize: "12px", color: "#FFC66D" }} />
                                        <span style={{ fontSize: "9px", color: fgColor, fontWeight: "500" }}>{f.eveningTemp}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        <button className="settings-btn primary" onClick={fetchRealWeather} disabled={weatherFetching} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px", padding: "6px 12px" }}>
                          {weatherFetching ? "Lade..." : "Aktualisieren"}
                        </button>
                        <p style={{ fontSize: "9px", color: fgMuted, lineHeight: "1.4", marginTop: "auto" }}>
                          {weatherMode === "wttr" && "🌐 wttr.in: kein Account, kein Tracking."}
                          {weatherMode === "custom" && "🔑 API-Key bleibt lokal."}
                        </p>
                      </div>
                    )}
                    {widget.type === "privacy-guard" && (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {([["Schlüsselhoheit", "Aktiv & Lokal", "#59A869"], ["E2E Verschlüsselung", "AES-GCM-256 + SFrame", "#59A869"], ["Storage Backup", "BYOS", "#FFC66D"], ["Isolations-Sandbox", "WASM Aktiv", "#59A869"]] as [string, string, string][]).map(([label, val, color]) => (
                            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "11px", color: fgMuted }}>{label}</span>
                              <span className="badge" style={{ backgroundColor: color + "22", color, border: `1px solid ${color}33`, fontSize: "10px", padding: "2px 6px" }}>{val}</span>
                            </div>
                          ))}
                        </div>
                        <p style={{ fontSize: "9px", color: fgMuted, marginTop: "10px", lineHeight: "1.3" }}>Alle Systemfunktionen vollverschlüsselt. Metadaten clientseitig isoliert.</p>
                      </div>
                    )}
                    {widget.type === "custom" && (
                      <div style={{ flex: 1, overflow: "hidden", borderRadius: "var(--radius-sm)" }}>
                        <iframe
                          srcDoc={(() => {
                            let html = "<span style='color:red'>Kein Code</span>";
                            try {
                              // eslint-disable-next-line no-new-func
                              const r = new Function(widget.customCode)();
                              if (typeof r === "string") html = r;
                            } catch (e: unknown) { html = `<span style='color:#e05252;font-size:11px'>Fehler: ${(e as Error).message}</span>`; }
                            return `<!DOCTYPE html><html><head><style>
                            :root {
                              --bg-primary: ${theme === "light" ? "#FFFFFF" : "#1E1F22"};
                              --bg-secondary: ${theme === "light" ? "#F2F3F5" : "#2B2D30"};
                              --bg-tertiary: ${theme === "light" ? "#EBECF0" : "#1A1B1D"};
                              --border-color: ${theme === "light" ? "#DFE1E5" : "#3f4248"};
                              --text-primary: ${theme === "light" ? "#060607" : "#F2F3F5"};
                              --text-muted: ${theme === "light" ? "#5C6370" : "#949BA4"};
                              --glow-color-1: ${glowColor};
                            }
                            *{box-sizing:border-box;margin:0;padding:0}
                            body{font-family:system-ui,sans-serif;font-size:12px;background:${widget.bgColor || "transparent"};color:${fgColor};padding:8px;overflow:auto;height:100vh;}
                            </style></head><body>${html}</body></html>`;
                          })()}
                          sandbox="allow-scripts"
                          style={{ width: "100%", height: "100%", border: "none", background: "transparent" }}
                          title={widget.title}
                        />
                      </div>
                    )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          ) : homeTab === "wasm_hub" ? (
            <div className="wasm-hub-view">
              <header className="wasm-hub-header">
                <div className="wasm-hub-title-area">
                  <h2>
                    <Icon icon="mage:box-3d" style={{ color: "var(--accent-color)" }} />
                    ⚡ Zeno WASM Runtime Hub & Marketplace
                  </h2>
                  <p>Lade isolierte WebAssembly-Laufzeiten (WASI) von WAPM & dem Zeno Community Index herunter.</p>
                </div>

                <button
                  className="settings-btn primary"
                  onClick={() => setIsCustomWasmModalOpen(true)}
                  style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "8px 14px" }}
                >
                  <Icon icon="mage:plus" /> Eigene WASM-URL Hinzufügen
                </button>
              </header>

              {/* Toolbar / Search & Filter */}
              <div className="wasm-hub-toolbar">
                <div className="wasm-hub-search-wrapper">
                  <Icon icon="mage:search" style={{ color: "var(--text-muted)", fontSize: "14px" }} />
                  <input
                    type="text"
                    className="wasm-hub-search-input"
                    placeholder="Laufzeit suchen (z.B. Go, Ruby, Perl, SQLite, #scripting)..."
                    value={wasmHubSearchQuery}
                    onChange={(e) => setWasmHubSearchQuery(e.target.value)}
                  />
                  {wasmHubSearchQuery && (
                    <button
                      onClick={() => setWasmHubSearchQuery("")}
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                    >
                      <Icon icon="mage:multiply" />
                    </button>
                  )}
                </div>

                <div className="wasm-hub-filter-tabs">
                  <button
                    className={`wasm-hub-filter-btn ${wasmHubFilter === "all" ? "active" : ""}`}
                    onClick={() => setWasmHubFilter("all")}
                  >
                    Alle Runtimes ({HUB_RUNTIMES_CATALOG.length})
                  </button>
                  <button
                    className={`wasm-hub-filter-btn ${wasmHubFilter === "community" ? "active" : ""}`}
                    onClick={() => setWasmHubFilter("community")}
                  >
                    ⭐ Zeno Community Index
                  </button>
                  <button
                    className={`wasm-hub-filter-btn ${wasmHubFilter === "wapm" ? "active" : ""}`}
                    onClick={() => setWasmHubFilter("wapm")}
                  >
                    📦 WAPM Registry
                  </button>
                  <button
                    className={`wasm-hub-filter-btn ${wasmHubFilter === "installed" ? "active" : ""}`}
                    onClick={() => setWasmHubFilter("installed")}
                  >
                    ✅ Installiert
                  </button>
                </div>
              </div>

              {/* WASM Runtime Cards Grid */}
              <div className="wasm-hub-grid">
                {HUB_RUNTIMES_CATALOG.filter((item) => {
                  // Filter by tab
                  if (wasmHubFilter === "community" && item.provider !== "Zeno Community Index") return false;
                  if (wasmHubFilter === "wapm" && item.provider !== "WAPM Registry") return false;
                  if (wasmHubFilter === "installed" && editorRuntimes[item.langKey] !== "installed") return false;

                  // Filter by search query
                  if (wasmHubSearchQuery.trim()) {
                    const q = wasmHubSearchQuery.toLowerCase();
                    const matchesName = item.name.toLowerCase().includes(q);
                    const matchesDesc = item.description.toLowerCase().includes(q);
                    const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));
                    const matchesProvider = item.provider.toLowerCase().includes(q);
                    return matchesName || matchesDesc || matchesTags || matchesProvider;
                  }

                  return true;
                }).map((item) => {
                  const runtimeStatus = editorRuntimes[item.langKey] || "not_installed";

                  return (
                    <div key={item.id} className="wasm-hub-card">
                      <div className="wasm-card-top">
                        <div className="wasm-card-icon-title">
                          <Icon icon={item.icon} className="wasm-card-icon" />
                          <div>
                            <h3 className="wasm-card-name">{item.name}</h3>
                            <span className="wasm-card-version">{item.version} • {item.size}</span>
                          </div>
                        </div>
                        <span
                          className="wasm-card-provider-badge"
                          style={{
                            backgroundColor: `${item.badgeColor}18`,
                            color: item.badgeColor,
                            border: `1px solid ${item.badgeColor}33`
                          }}
                        >
                          {item.providerIcon} {item.provider}
                        </span>
                      </div>

                      <p className="wasm-card-desc">{item.description}</p>

                      <div className="wasm-card-tags">
                        {item.tags.map((t) => (
                          <span key={t} className="wasm-tag">{t}</span>
                        ))}
                      </div>

                      <div className="wasm-card-actions">
                        {runtimeStatus === "installed" ? (
                          <>
                            <span style={{ fontSize: "11px", color: "#59A869", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Icon icon="mage:check-circle" /> Bereit & Gecacht
                            </span>
                            <button
                              className="settings-btn primary"
                              onClick={() => {
                                setEditorFilename(item.sampleFile);
                                setEditorLanguage(item.langKey);
                                setEditorCode(item.sampleCode);
                                setEditorWorkflowStep("editor");
                                setEditorOutput("");
                                setIsEditorOpen(true);
                                showToast(`Monaco-Editor für ${item.name} geöffnet!`);
                              }}
                              style={{ fontSize: "11px", padding: "4px 10px" }}
                            >
                              🚀 Ausprobieren
                            </button>
                          </>
                        ) : runtimeStatus === "installing" ? (
                          <span style={{ fontSize: "11px", color: "#FFC66D", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Icon icon="mage:spinner-round" className="spin" /> WASM Download läuft...
                          </span>
                        ) : (
                          <>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                              🛡️ WASI Isolated
                            </span>
                            <button
                              className="settings-btn"
                              onClick={() => handleInstallRuntime(item.langKey)}
                              style={{ fontSize: "11px", padding: "4px 10px", color: "var(--accent-color)" }}
                            >
                              <Icon icon="mage:download" style={{ marginRight: "4px" }} /> Download & Cachen
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="zeno-ide-workspace">
              {/* VS Code styled Activity Bar (narrow sidebar menu) */}
              <div className="ide-activity-bar">
                <div className="ide-activity-top">
                  <button 
                    className={`ide-activity-btn ${ideSidebarTab === "explorer" ? "active" : ""}`}
                    onClick={() => setIdeSidebarTab("explorer")}
                    title="Explorer"
                  >
                    <Icon icon="mage:file-records" />
                  </button>

                  <button 
                    className={`ide-activity-btn ${ideSidebarTab === "git" ? "active" : ""}`}
                    onClick={() => setIdeSidebarTab("git")}
                    title="Source Control (Git)"
                  >
                    <Icon icon="mage:git-branch" />
                    {ideGitChanges.length > 0 && (
                      <span className="ide-activity-badge">{ideGitChanges.length}</span>
                    )}
                  </button>

                  <button 
                    className={`ide-activity-btn ${ideSidebarTab === "extensions" ? "active" : ""}`}
                    onClick={() => setIdeSidebarTab("extensions")}
                    title="Plugins / Extensions"
                  >
                    <Icon icon="mage:box-3d" />
                  </button>

                  {/* GitLens Extension translated option! Rendered ONLY when GitLens is installed! */}
                  {ideExtensions.find(ext => ext.id === "gitlens")?.installed && (
                    <button 
                      className={`ide-activity-btn gitlens-opt ${ideSidebarTab === "gitlens" ? "active" : ""}`}
                      onClick={() => setIdeSidebarTab("gitlens")}
                      title="GitLens History Map"
                      style={{ color: "#E05555" }}
                    >
                      <Icon icon="octicon:history-16" />
                    </button>
                  )}
                </div>

                <div className="ide-activity-bottom">
                  <button className="ide-activity-btn" onClick={() => setIsSettingsOpen(true)} title="Einstellungen">
                    <Icon icon="mage:settings" />
                  </button>
                </div>
              </div>

              {/* IDE Side Panel (width 260px) */}
              <aside className="ide-sidebar">
                {ideSidebarTab === "explorer" && (
                  <>
                    <div className="ide-sidebar-header">
                      <span className="ide-project-title">
                        Explorer
                      </span>
                      <div className="ide-sidebar-actions">
                        <button 
                          className="ide-sidebar-btn" 
                          onClick={() => {
                            setIdeNewItemType("file");
                            setIdeNewItemParentPath("");
                            setIsIdeNewItemModalOpen(true);
                          }}
                          title="Neue Datei erstellen"
                        >
                          <Icon icon="mage:plus" />
                        </button>
                        <button 
                          className="ide-sidebar-btn" 
                          onClick={() => {
                            setIdeNewItemType("folder");
                            setIdeNewItemParentPath("");
                            setIsIdeNewItemModalOpen(true);
                          }}
                          title="Neuer Ordner erstellen"
                        >
                          <Icon icon="mage:folder-open" />
                        </button>
                        <button 
                          className="ide-sidebar-btn" 
                          onClick={() => setIsIdeProjectWizardOpen(true)}
                          title="Projekt aus Vorlage generieren"
                        >
                          <Icon icon="mage:box-3d" style={{ color: "var(--accent-color)" }} />
                        </button>
                      </div>
                    </div>

                    <div className="ide-tree-container">
                      <div className="ide-sidebar-section-title">ZENO-WORKSPACE</div>
                      {renderIdeFileTree()}
                      {ideFiles.length === 0 && (
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", padding: "16px", textAlign: "center" }}>
                          Workspace leer. Generiere ein Projekt über das Würfel-Symbol.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {ideSidebarTab === "git" && (
                  <div className="ide-git-panel" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "14px" }}>
                    <div className="ide-sidebar-header" style={{ padding: "0 0 10px 0", borderBottom: "1px solid var(--border-color)", marginBottom: "14px" }}>
                      <span className="ide-project-title">Source Control</span>
                    </div>

                    <div className="ide-git-input-wrapper" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <textarea
                        className="settings-input"
                        placeholder="Commit-Nachricht (Strg+Enter zum Committen)..."
                        value={ideGitMessage}
                        onChange={(e) => setIdeGitMessage(e.target.value)}
                        style={{ width: "100%", height: "70px", resize: "none", fontSize: "11px", padding: "8px" }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                            handleIdeGitCommit();
                          }
                        }}
                      />
                      <button 
                        className="settings-btn primary"
                        onClick={handleIdeGitCommit}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px", padding: "8px" }}
                      >
                        <Icon icon="mage:git-branch" /> Commit & Push
                      </button>
                    </div>

                    <div className="ide-git-changes-section" style={{ marginTop: "20px", flex: 1, overflowY: "auto" }}>
                      <div className="ide-sidebar-section-title" style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Änderungen</span>
                        <span className="badge" style={{ backgroundColor: "var(--bg-tertiary)" }}>{ideGitChanges.length}</span>
                      </div>
                      
                      {ideGitChanges.map((change) => (
                        <div key={change} className="ide-git-change-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", fontSize: "12px", borderRadius: "4px", cursor: "pointer", transition: "background 0.2s" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Icon icon="mage:file-records" style={{ color: "var(--text-muted)", fontSize: "13px" }} />
                            <span>{change}</span>
                          </span>
                          <span style={{ color: "#FFC66D", fontWeight: "bold", fontSize: "11px" }}>M</span>
                        </div>
                      ))}

                      {ideGitChanges.length === 0 && (
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginTop: "24px" }}>
                          Keine ungespeicherten Änderungen vorhanden.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {ideSidebarTab === "extensions" && (
                  <div className="ide-extensions-panel" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "14px" }}>
                    <div className="ide-sidebar-header" style={{ padding: "0 0 10px 0", borderBottom: "1px solid var(--border-color)", marginBottom: "14px" }}>
                      <span className="ide-project-title">Plugin-Installer</span>
                    </div>

                    {/* Search Field */}
                    <div style={{ position: "relative", marginBottom: "14px" }}>
                      <input
                        type="text"
                        className="settings-input"
                        placeholder="Erweiterungen durchsuchen..."
                        value={ideExtensionsSearchQuery}
                        onChange={(e) => setIdeExtensionsSearchQuery(e.target.value)}
                        style={{ width: "100%", paddingRight: "26px", fontSize: "11px", height: "30px" }}
                      />
                      <Icon icon="mage:search" style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    </div>

                    {/* Extensions List */}
                    <div className="extensions-list" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                      {ideExtensions
                        .filter(ext => {
                          if (!ideExtensionsSearchQuery.trim()) return true;
                          const q = ideExtensionsSearchQuery.toLowerCase();
                          return ext.name.toLowerCase().includes(q) || ext.description.toLowerCase().includes(q);
                        })
                        .map((ext) => (
                          <div key={ext.id} className="extension-card" style={{ display: "flex", gap: "10px", padding: "10px", backgroundColor: "var(--bg-tertiary)", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                            <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {ext.icon.startsWith("http") ? (
                                <img src={ext.icon} alt={ext.name} style={{ width: "32px", height: "32px", borderRadius: "4px" }} />
                              ) : (
                                <Icon icon={ext.icon} style={{ fontSize: "28px" }} />
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                                {ext.name}
                              </h4>
                              <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "2px 0 6px 0", lineHeight: "1.3" }}>
                                {ext.description}
                              </p>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                                  {ext.downloads} downloads
                                </span>
                                {ext.installed ? (
                                  <button
                                    onClick={() => handleExtensionUninstall(ext.id)}
                                    className="settings-btn"
                                    style={{ fontSize: "9px", padding: "2px 6px", border: "1px solid var(--accent-danger)", color: "var(--accent-danger)" }}
                                  >
                                    Deinstallieren
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleExtensionInstall(ext.id)}
                                    className="settings-btn primary"
                                    style={{ fontSize: "9px", padding: "2px 8px" }}
                                  >
                                    Installieren
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* GitLens Extension Panel */}
                {ideSidebarTab === "gitlens" && (
                  <div className="ide-gitlens-panel" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "14px" }}>
                    <div className="ide-sidebar-header" style={{ padding: "0 0 10px 0", borderBottom: "1px solid var(--border-color)", marginBottom: "14px" }}>
                      <span className="ide-project-title" style={{ color: "#E05555" }}>GitLens History Map</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, overflowY: "auto" }}>
                      <div className="gitlens-info" style={{ padding: "10px", backgroundColor: "rgba(224, 85, 85, 0.1)", borderRadius: "6px", border: "1px solid rgba(224, 85, 85, 0.2)" }}>
                        <p style={{ fontSize: "11px", color: "var(--text-primary)", margin: 0 }}>
                          GitLens hat das Platzierungsziel erfolgreich von der standardmäßigen VS-Code-Ansicht in das <strong>Zeno Aktivitäts-Menü</strong> übersetzt.
                        </p>
                      </div>

                      <div className="gitlens-history-timeline" style={{ marginTop: "14px" }}>
                        <div className="ide-sidebar-section-title">COMMITS VERLAUF</div>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                          {[
                            { author: "CipherNaut", time: "Vor 10 Min.", msg: "feat: Add full-IDE layout Option B" },
                            { author: "CipherNaut", time: "Vor 2 Std.", msg: "fix: Monaco Themes dynamic light/dark loading" },
                            { author: "LenaCrypt", time: "Gestern", msg: "refactor: WASM isolates memory management" }
                          ].map((commit, idx) => (
                            <div key={idx} style={{ padding: "8px", borderLeft: "2px solid var(--border-color)", paddingLeft: "10px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                                <span>{commit.author}</span>
                                <span>{commit.time}</span>
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--text-primary)", fontWeight: "500", marginTop: "4px" }}>
                                {commit.msg}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </aside>

              {/* Main Editor & Console Container */}
              <div className="ide-editor-container">
                {/* Tabs Bar */}
                <div className="ide-tabs-bar">
                  {ideOpenTabs.map((tabPath) => {
                    const isActive = tabPath === ideActiveFilePath;
                    const fileName = tabPath.split("/").pop() || tabPath;
                    const fileObj = ideFiles.find((f) => f.path === tabPath);
                    const lang = fileObj?.language || "";

                    return (
                      <div
                        key={tabPath}
                        className={`ide-tab ${isActive ? "active" : ""}`}
                        onClick={() => handleIdeFileSelect(tabPath)}
                      >
                        <Icon 
                          icon={
                            lang === "rust" ? "vscode-icons:file-type-rust" :
                            lang === "python" ? "vscode-icons:file-type-python" :
                            lang === "golang" ? "vscode-icons:file-type-go" :
                            lang === "csharp" ? "vscode-icons:file-type-csharp" :
                            lang === "cpp" ? "vscode-icons:file-type-cpp" :
                            lang === "javascript" ? "vscode-icons:file-type-js" :
                            lang === "typescript" ? "vscode-icons:file-type-typescript" :
                            lang === "html" ? "vscode-icons:file-type-html" :
                            lang === "css" ? "vscode-icons:file-type-css" :
                            lang === "toml" ? "vscode-icons:file-type-toml" :
                            "mage:file-records"
                          } 
                          style={{ fontSize: "13px" }}
                        />
                        <span>{fileName}</span>
                        <button
                          className="ide-tab-close"
                          onClick={(e) => handleIdeFileClose(tabPath, e)}
                        >
                          <Icon icon="mage:multiply" style={{ fontSize: "10px" }} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Editor Area */}
                <div className="ide-editor-wrapper">
                  {activeIdeFile && !activeIdeFile.isFolder ? (
                    <>
                      {/* Editor Toolbar overlay */}
                      <div style={{ position: "absolute", top: "10px", right: "20px", zIndex: 10, display: "flex", gap: "8px" }}>
                        <button
                          className="editor-toolbar-btn primary btn-run"
                          onClick={handleIdeRun}
                          style={{ fontSize: "11px", padding: "4px 10px", height: "26px" }}
                          title="Code ausführen"
                        >
                          <Icon icon="mage:play" /> Run Sandbox
                        </button>
                        <button
                          className="editor-toolbar-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(activeIdeFile.code);
                            showToast("Code kopiert!");
                          }}
                          style={{ fontSize: "11px", padding: "4px 8px", height: "26px" }}
                          title="In Zwischenablage kopieren"
                        >
                          <Icon icon="mage:copy" /> Copy
                        </button>
                      </div>

                      <Editor
                        height="100%"
                        language={activeIdeFile.language}
                        theme={theme === "light" ? "zeno-light-theme" : "zeno-dark-theme"}
                        value={activeIdeFile.code}
                        onChange={handleIdeCodeChange}
                        onMount={(_, monaco) => setupZenoIntelliSense(monaco)}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13,
                          fontFamily: "var(--font-mono)",
                          automaticLayout: true,
                          quickSuggestions: { other: true, comments: true, strings: true },
                          suggestOnTriggerCharacters: true,
                          acceptSuggestionOnEnter: "on",
                          tabCompletion: "on",
                          snippetSuggestions: "top",
                          wordBasedSuggestions: "allDocuments",
                          parameterHints: { enabled: true }
                        }}
                      />
                    </>
                  ) : (
                    <div className="ide-no-editors-screen">
                      <div className="ide-watermark-container">
                        <img 
                          src="/zeno_logo.svg" 
                          alt="Zeno Logo" 
                          className="ide-watermark-logo"
                          style={{ width: "80px", height: "80px", opacity: 0.15, filter: "grayscale(30%)", marginBottom: "16px" }} 
                        />
                        <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", opacity: 0.8, marginBottom: "24px" }}>
                          Zeno Workspace Editor
                        </h3>
                      </div>

                      <div className="ide-shortcut-list">
                        <div className="ide-shortcut-item">
                          <span className="ide-shortcut-action">Datei erstellen</span>
                          <span className="ide-shortcut-keys">
                            <kbd>Ctrl</kbd> + <kbd>N</kbd>
                          </span>
                        </div>
                        <div className="ide-shortcut-item">
                          <span className="ide-shortcut-action">Projekt-Template generieren</span>
                          <span className="ide-shortcut-keys">
                            <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>G</kbd>
                          </span>
                        </div>
                        <div className="ide-shortcut-item">
                          <span className="ide-shortcut-action">WASM Runtime Hub</span>
                          <span className="ide-shortcut-keys">
                            <kbd>Ctrl</kbd> + <kbd>H</kbd>
                          </span>
                        </div>
                        <div className="ide-shortcut-item">
                          <span className="ide-shortcut-action">Konsole ein-/ausblenden</span>
                          <span className="ide-shortcut-keys">
                            <kbd>Ctrl</kbd> + <kbd>`</kbd>
                          </span>
                        </div>
                      </div>

                      <div className="ide-quick-actions" style={{ display: "flex", gap: "10px", marginTop: "32px" }}>
                        <button 
                          className="settings-btn"
                          onClick={() => {
                            setIdeNewItemType("file");
                            setIdeNewItemParentPath("");
                            setIsIdeNewItemModalOpen(true);
                          }}
                          style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "8px 14px" }}
                        >
                          <Icon icon="mage:plus" /> Neue Datei
                        </button>
                        <button 
                          className="settings-btn primary"
                          onClick={() => setIsIdeProjectWizardOpen(true)}
                          style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "8px 14px" }}
                        >
                          <Icon icon="mage:box-3d" /> Projekt generieren
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Collapsible Console Bottom Area */}
                <div 
                  className={`ide-console ${isIdeConsoleExpanded ? "" : "collapsed"}`}
                  style={{ height: isIdeConsoleExpanded ? "220px" : "35px" }}
                >
                  <div 
                    className="ide-console-header"
                    onClick={() => setIsIdeConsoleExpanded(!isIdeConsoleExpanded)}
                  >
                    <span className="ide-console-title">
                      <Icon icon="mage:dashboard" />
                      WASM Sandbox-Ausgabe & Logs
                    </span>
                    <div className="ide-console-actions">
                      <button
                        className="ide-sidebar-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIdeConsoleOutput("");
                          showToast("Konsole gelöscht.");
                        }}
                        title="Konsole leeren"
                      >
                        <Icon icon="mage:trash-3" style={{ fontSize: "12px" }} />
                      </button>
                      <Icon 
                        icon={isIdeConsoleExpanded ? "mage:chevron-down" : "mage:chevron-up"} 
                        style={{ fontSize: "14px", color: "var(--text-muted)" }} 
                      />
                    </div>
                  </div>
                  {isIdeConsoleExpanded && (
                    <pre className="ide-console-output" style={{ flex: 1, margin: 0, overflowY: "auto" }}>
                      <code>{ideConsoleOutput || "[zeno-console] Keine Ausgaben vorhanden."}</code>
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )
        ) : (
          <>
            <header className="chat-header">
          <div className="chat-header-info">
            <span className="chat-header-icon"><Icon icon="mage:hashtag" /></span>
            <h2 className="chat-header-channel">{activeChannel.name}</h2>
            <span className="chat-header-divider" />
            <p className="chat-header-description">Kanal für {activeChannel.name} in {activeServer.name}</p>
          </div>
          <div className="chat-header-actions">
            <button 
              className="header-action-btn" 
              onClick={() => openInPrivacyBrowser("https://github.com/tauri-apps/tauri?utm_source=twitter&fbclid=123", "GitHub Tauri Repo")} 
              title="In-App Privacy Browser öffnen"
            >
              <Icon icon="mage:shield-check" />
            </button>
            <button className="header-action-btn" onClick={() => showToast("Such-Layout ist im Prototyp deaktiviert")} title="Suche">
              <Icon icon="mage:search" />
            </button>
            <button 
              className={`header-action-btn ${isMembersOpen ? "active" : ""}`} 
              onClick={() => setIsMembersOpen(!isMembersOpen)} 
              title="Mitgliederliste anzeigen/ausblenden"
            >
              <Icon icon="mage:users" />
            </button>
          </div>
        </header>

        {/* Message Feed */}
        <div className="messages-container" key={activeChannel.id}>
          <div className="date-separator" role="separator">
            <span className="date-separator-text">— Heute —</span>
          </div>

          {(chatMessages[activeChannel.id] || []).map((msg, i) => {
            const urlMatch = msg.text ? msg.text.match(/(https?:\/\/[^\s]+)/) : null;
            const foundUrl = urlMatch ? urlMatch[0] : null;
            const urlDetails = foundUrl ? cleanUrl(foundUrl) : null;

            return (
              <article 
                key={i} 
                className="message message-animate"
                style={{ "--idx": Math.min(i, 6) } as React.CSSProperties}
              >
                <div className={`message-avatar ${msg.color}`}>{msg.author[0]}</div>
                <div className="message-body">
                  <header className="message-header">
                    <span className={`message-author ${msg.color}`} onClick={() => setSelectedUserProfile(mockProfiles[msg.author] || null)} style={{ cursor: "pointer" }}>
                      {msg.author}
                    </span>
                    {mockProfiles[msg.author]?.role === "Bot" && <span className="badge bot-badge">BOT</span>}
                    <time className="message-timestamp">{msg.time}</time>
                  </header>
                  <div className="message-content">
                    <p>
                      {foundUrl && urlDetails ? (
                        <>
                          {msg.text.split(foundUrl)[0]}
                          <span 
                            style={{ color: "var(--glow-color-1, #3574F0)", textDecoration: "underline", cursor: "pointer", fontWeight: "600" }} 
                            onClick={() => openInPrivacyBrowser(foundUrl)}
                          >
                            {urlDetails.cleanedUrl}
                          </span>
                          {msg.text.split(foundUrl)[1]}
                        </>
                      ) : (
                        msg.text
                      )}
                    </p>

                    {/* Privacy Preserving Link Preview Card */}
                    {foundUrl && urlDetails && (
                      <div className="privacy-link-card">
                        <div className="privacy-link-card-header">
                          <span className="privacy-link-card-title">
                            <Icon icon="mage:shield-check" style={{ color: "#59A869", fontSize: "16px" }} />
                            Privacy Link Preview
                          </span>
                          <span className="badge" style={{ backgroundColor: "rgba(89, 168, 105, 0.15)", color: "#59A869", border: "1px solid rgba(89, 168, 105, 0.3)", fontSize: "9px", padding: "2px 6px" }}>
                            🛡️ Proxy (IP geschützt)
                          </span>
                        </div>
                        <div className="privacy-link-card-url">
                          {urlDetails.cleanedUrl}
                        </div>
                        {urlDetails.strippedParams.length > 0 && (
                          <div style={{ fontSize: "10px", color: "#FFC66D", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Icon icon="mage:information-circle" />
                            {urlDetails.strippedParams.length} Tracking-Parameter automatisch entfernt ({urlDetails.strippedParams.join(", ")})
                          </div>
                        )}
                        <div className="privacy-link-card-actions">
                          <button 
                            className="settings-btn primary" 
                            onClick={() => openInPrivacyBrowser(foundUrl)} 
                            style={{ fontSize: "11px", padding: "4px 10px", display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            <Icon icon="mage:global" /> In Privacy Browser öffnen
                          </button>
                          <button 
                            className="settings-btn" 
                            onClick={() => { navigator.clipboard.writeText(urlDetails.cleanedUrl); showToast("Saubere URL kopiert!"); }} 
                            style={{ fontSize: "11px", padding: "4px 10px", display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            <Icon icon="mage:copy" /> Saubere URL kopieren
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Embedded Code Block */}
                  {msg.code && (
                    <div className="code-block-wrapper" data-language="rust">
                      <header className="code-block-header">
                        <span className="code-block-language">Rust</span>
                        <div className="code-block-actions">
                          <button 
                            className="code-action-btn btn-open-editor" 
                            onClick={() => { setEditorCode(msg.code || ""); setEditorFilename("snippet.rs"); setEditorLanguage(detectLanguage(msg.code || "")); setEditorWorkflowStep("editor"); setIsEditorOpen(true); }}
                          >
                            Open in Editor
                          </button>
                        </div>
                      </header>
                      <pre className="code-block">
                        <code className="language-rust">{msg.code}</code>
                      </pre>
                    </div>
                  )}

                  {/* Message Attachment Rendering */}
                  {msg.attachment && (
                    <div className="message-attachment-card">
                      {msg.attachment.dataUrl ? (
                        <div className="message-attachment-image-wrapper">
                          <img src={msg.attachment.dataUrl} alt={msg.attachment.name} className="message-attachment-image" />
                        </div>
                      ) : (
                        <div className="message-attachment-file-info">
                          <Icon icon="mage:file-records" className="attachment-file-icon" />
                          <div className="attachment-text-details">
                            <span className="attachment-filename">{msg.attachment.name}</span>
                            <span className="attachment-filesize">{msg.attachment.size}</span>
                          </div>
                          <button 
                            className="attachment-download-btn" 
                            onClick={() => {
                              const blob = new Blob(["Simulierter Dateiinhalt"], { type: msg.attachment?.type || "text/plain" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = msg.attachment?.name || "file";
                              link.click();
                              URL.revokeObjectURL(url);
                              showToast(`Download von "${msg.attachment?.name}" gestartet`);
                            }}
                            title="Herunterladen"
                          >
                            <Icon icon="mage:download" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Footer */}
        <footer className="message-input-area" style={{ position: "relative" }}>
          {/* Hidden file input for attachments */}
          <input 
            type="file" 
            ref={chatAttachmentInputRef} 
            style={{ display: "none" }} 
            onChange={handleChatAttachmentChange} 
          />

          {/* Slash Command Suggestions Popup */}
          {showCommandSuggestions && (
            <div className="command-suggestions-popup">
              <header className="suggestions-header">
                <span>Verfügbare Befehle</span>
              </header>
              <div className="suggestions-list">
                {AVAILABLE_COMMANDS.filter((cmd) => cmd.name.toLowerCase().startsWith(inputText.toLowerCase())).map((cmd) => (
                  <button 
                    key={cmd.name}
                    type="button"
                    className="suggestion-item"
                    onClick={() => {
                      setInputText(cmd.name + " ");
                      setShowCommandSuggestions(false);
                      document.getElementById("chat-input-field")?.focus();
                    }}
                  >
                    <span className="suggestion-icon"><Icon icon={cmd.icon} /></span>
                    <div className="suggestion-details">
                      <span className="suggestion-name">{cmd.name}</span>
                      <span className="suggestion-desc">{cmd.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pending Attachment Preview */}
          {pendingAttachment && (
            <div className="pending-attachment-preview">
              <div className="attachment-preview-content">
                {pendingAttachment.dataUrl ? (
                  <img src={pendingAttachment.dataUrl} alt="Vorschau" className="attachment-preview-img" />
                ) : (
                  <Icon icon="mage:file-records" className="attachment-preview-icon" />
                )}
                <div className="attachment-preview-info">
                  <span className="attachment-preview-name">{pendingAttachment.name}</span>
                  <span className="attachment-preview-size">{pendingAttachment.size}</span>
                </div>
              </div>
              <button 
                type="button" 
                className="attachment-preview-remove" 
                onClick={() => setPendingAttachment(null)}
                title="Anhang entfernen"
              >
                <Icon icon="mage:multiply" />
              </button>
            </div>
          )}

          <form className="message-input-container" onSubmit={handleSendMessage}>
            <button className="input-action-btn" type="button" onClick={() => chatAttachmentInputRef.current?.click()} title="Anhang hinzufügen">
              <Icon icon="mage:plus" />
            </button>
            <div className="message-input-wrapper">
              <input
                type="text"
                className="message-input"
                id="chat-input-field"
                placeholder={`Nachricht an # ${activeChannel.name}`}
                value={inputText}
                onChange={(e) => {
                  const val = e.target.value;
                  setInputText(val);
                  setShowCommandSuggestions(val.startsWith("/"));
                }}
                autoComplete="off"
              />
            </div>
            <div className="input-actions-right">
              <button className="input-action-btn" type="button" onClick={() => { setEditorCode(""); setEditorWorkflowStep("select_action"); setIsEditorOpen(true); }} title="Codeblock teilen">
                <Icon icon="mage:code" />
              </button>
              <button className="input-action-btn" type="button" onClick={() => showToast("Emojis sind deaktiviert")} title="Emoji hinzufügen">
                <Icon icon="mage:smile" />
              </button>
            </div>
          </form>
        </footer>
          </>
        )}
      </main>

      {/* 4. MEMBERS SIDEBAR */}
      {activeServerId !== "home" && (
        <aside className={`members-sidebar ${isMembersOpen ? "" : "collapsed"}`}>
          <section className="member-role-group" data-role="entwickler">
            <h3 className="role-group-header">ONLINE — 3</h3>
            <ul className="role-group-list">
              {["MaxShield", "LenaCrypt", "CipherNaut"].map((user) => {
                const profile = mockProfiles[user];
                return (
                  <li key={user}>
                    <div className="member-item" onClick={() => setSelectedUserProfile(profile)}>
                      <div className="member-avatar-wrapper">
                        <div className={`member-avatar ${profile.avatarColor}`}>{profile.avatar}</div>
                        <span className="status-dot online" />
                      </div>
                      <span className="member-name">{profile.name}</span>
                      {profile.role === "Unterstützer" && <span className="badge supporter-badge">⭐</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="member-role-group" data-role="bots">
            <h3 className="role-group-header">BOTS — 1</h3>
            <ul className="role-group-list">
              <li>
                <div className="member-item" onClick={() => setSelectedUserProfile(mockProfiles.ZenoBot)}>
                  <div className="member-avatar-wrapper">
                    <div className="member-avatar orange">Z</div>
                    <span className="status-dot online" />
                  </div>
                  <span className="member-name">ZenoBot</span>
                  <span className="badge bot-badge">BOT</span>
                </div>
              </li>
            </ul>
          </section>

          <section className="member-role-group" data-role="offline">
            <h3 className="role-group-header">OFFLINE — 2</h3>
            <ul className="role-group-list">
              {["DarkNode", "QuantumLeap"].map((user) => {
                const profile = mockProfiles[user];
                return (
                  <li key={user}>
                    <div className="member-item offline" onClick={() => setSelectedUserProfile(profile)}>
                      <div className="member-avatar-wrapper">
                        <div className="member-avatar gray">{profile.avatar}</div>
                        <span className="status-dot offline" />
                      </div>
                      <span className="member-name">{profile.name}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      )}

      {/* 5. CODE EDITOR MODAL */}
      <div className={`modal-overlay ${isEditorOpen ? "open" : ""}`} id="editor-modal">
        {/* Hidden file picker input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: "none" }} 
          onChange={handleFileChange} 
        />

        <div className="code-editor-modal">
          {editorWorkflowStep === "select_action" && (
            <div className="editor-onboarding">
              <header className="onboarding-header">
                <h3>Wie möchtest du starten?</h3>
                <button className="editor-close-btn modal-close" onClick={() => setIsEditorOpen(false)}>
                  <Icon icon="mage:multiply" />
                </button>
              </header>
              <div className="onboarding-cards">
                <button className="onboarding-card" onClick={() => setEditorWorkflowStep("input_filename")}>
                  <div className="onboarding-card-icon"><Icon icon="mage:plus" /></div>
                  <div className="onboarding-card-text">
                    <h4>Neue Datei erstellen</h4>
                    <p>Erstelle ein leeres Dokument und bestimme die Syntax über die Dateiendung.</p>
                  </div>
                </button>
                <button className="onboarding-card" onClick={handleOpenFileClick}>
                  <div className="onboarding-card-icon"><Icon icon="mage:folder-open" /></div>
                  <div className="onboarding-card-text">
                    <h4>Lokale Datei öffnen</h4>
                    <p>Lade ein Dokument von deiner Festplatte in die sichere Ausführungs-Sandbox.</p>
                  </div>
                </button>
              </div>

              <div className="recent-files-section">
                <h4>Kürzlich geöffnete Dateien</h4>
                <div className="recent-files-list">
                  {recentFiles.map((file) => (
                    <button 
                      key={file.name} 
                      className="recent-file-item"
                      onClick={() => openWorkspaceFile(file.name, file.language)}
                      style={{ position: "relative" }}
                    >
                      <Icon 
                        icon={
                          file.language === "rust" ? "vscode-icons:file-type-rust" :
                          file.language === "python" ? "vscode-icons:file-type-python" :
                          file.language === "csharp" ? "vscode-icons:file-type-csharp" :
                          file.language === "cpp" ? "vscode-icons:file-type-cpp" :
                          file.language === "javascript" ? "vscode-icons:file-type-js" :
                          file.language === "typescript" ? "vscode-icons:file-type-typescript" :
                          file.language === "html" ? "vscode-icons:file-type-html" :
                          file.language === "css" ? "vscode-icons:file-type-css" :
                          file.language === "json" ? "vscode-icons:file-type-json" :
                          "mage:file-records"
                        } 
                        className="recent-file-icon"
                      />
                      <div className="recent-file-details" style={{ flex: 1 }}>
                        <span className="recent-file-name">{file.name}</span>
                        <span className="recent-file-lang">{file.language.toUpperCase()}</span>
                      </div>
                      <span 
                        className="recent-file-delete-btn"
                        onClick={(e) => { e.stopPropagation(); removeRecentFileFromHistory(file.name); }}
                        title="Aus Historie entfernen"
                      >
                        <Icon icon="mage:trash-3" />
                      </span>
                    </button>
                  ))}
                  {recentFiles.length === 0 && (
                    <p className="no-recent-files">Keine kürzlich geöffneten Dateien.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {editorWorkflowStep === "input_filename" && (
            <div className="editor-filename-input-view">
              <header className="onboarding-header">
                <h3>Neue Datei benennen</h3>
                <button className="editor-close-btn modal-close" onClick={() => setEditorWorkflowStep("select_action")} title="Zurück">
                  <Icon icon="mage:arrow-left" />
                </button>
              </header>
              <div className="filename-input-container">
                <p className="settings-help-text">Wähle einen Namen mit Endung (z.B. <code>main.py</code>, <code>index.js</code>, <code>benchmark.rs</code>).</p>
                <input 
                  type="text" 
                  className="settings-input" 
                  placeholder="Dateiname (z.B. main.rs)"
                  id="editor-new-filename-field"
                  defaultValue="main.rs"
                  style={{ width: "100%", margin: "16px 0", maxWidth: "none" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const input = e.currentTarget.value.trim() || "main.rs";
                      createNewWorkspaceFile(input);
                    }
                  }}
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    className="settings-btn primary" 
                    onClick={() => {
                      const inputEl = document.getElementById("editor-new-filename-field") as HTMLInputElement;
                      const input = inputEl?.value.trim() || "main.rs";
                      createNewWorkspaceFile(input);
                    }}
                  >
                    Erstellen
                  </button>
                  <button className="settings-btn" onClick={() => setEditorWorkflowStep("select_action")}>
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}

          {editorWorkflowStep === "editor" && (
            <>
              <header className="editor-modal-header">
                <div className="editor-modal-title-area">
                  {isRenaming ? (
                    <input
                      type="text"
                      className="editor-filename-rename-input"
                      defaultValue={editorFilename}
                      onBlur={(e) => handleRenameFile(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRenameFile(e.currentTarget.value);
                        } else if (e.key === "Escape") {
                          setIsRenaming(false);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="editor-filename editable" 
                      onClick={() => setIsRenaming(true)}
                      title="Klicke zum Umbenennen"
                    >
                      {editorFilename}
                      {isEditorDirty && <span style={{ color: "var(--glow-color-1, #3574F0)", marginLeft: "6px", fontSize: "10px" }} title="Ungespeicherte Änderungen">●</span>}
                      <Icon icon="mage:edit" className="filename-edit-icon" style={{ marginLeft: "6px", fontSize: "12px", opacity: 0.6 }} />
                    </span>
                  )}
                  <span className="badge language-badge">{editorLanguage.toUpperCase()}</span>
                </div>
                <button className="editor-close-btn modal-close" onClick={() => setIsEditorOpen(false)} title="Schließen">
                  <Icon icon="mage:multiply" />
                </button>
              </header>

              <div className="editor-code-area" style={{ minHeight: "400px" }}>
                <Editor
                  height="100%"
                  language={editorLanguage}
                  theme={theme === "light" ? "zeno-light-theme" : "zeno-dark-theme"}
                  value={editorCode}
                  onChange={(val) => {
                    setEditorCode(val || "");
                    setIsEditorDirty(true);
                  }}
                  onMount={(_, monaco) => setupZenoIntelliSense(monaco)}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: "var(--font-mono)",
                    automaticLayout: true,
                    quickSuggestions: { other: true, comments: true, strings: true },
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnEnter: "on",
                    tabCompletion: "on",
                    snippetSuggestions: "top",
                    wordBasedSuggestions: "allDocuments",
                    parameterHints: { enabled: true }
                  }}
                />
              </div>

              <footer className="editor-modal-toolbar">
                <button className="editor-toolbar-btn primary btn-run" onClick={handleEditorRun} title="Ausführen">
                  <Icon icon="mage:play" /> Run
                </button>
                <button 
                  className="editor-toolbar-btn btn-copy" 
                  onClick={() => { navigator.clipboard.writeText(editorCode); showToast("Code kopiert!"); }} 
                  title="Kopieren"
                >
                  <Icon icon="mage:copy" /> Copy
                </button>
                <button 
                  className="editor-toolbar-btn btn-save" 
                  onClick={handleSaveFile} 
                  title="Speichern (Ctrl+S)"
                >
                  <Icon icon="lucide:save" /> Save {isEditorDirty && <span style={{ fontSize: "10px", color: "var(--glow-color-1, #3574F0)", marginLeft: "2px" }}>●</span>}
                </button>
                <button 
                  className="editor-toolbar-btn btn-suggest-edit" 
                  onClick={() => {
                    setChatMessages((prev) => ({
                      ...prev,
                      [activeChannel.id]: [...(prev[activeChannel.id] || []), {
                        author: "CipherNaut",
                        text: `Änderungsvorschlag für ${editorFilename} gesendet:`,
                        time: getCurrentTimestamp(),
                        color: "purple",
                        code: editorCode
                      }]
                    }));
                    setIsEditorOpen(false);
                    showToast("Änderungsvorschlag gesendet!");
                  }} 
                  title="Änderung vorschlagen"
                >
                  <Icon icon="mage:message-round" /> Suggest
                </button>
                <button 
                  className="editor-toolbar-btn btn-delete-file" 
                  onClick={handleDeleteCurrentFile} 
                  title="Aus Workspace löschen"
                  style={{ color: "var(--accent-danger, #E05555)", marginLeft: "auto" }}
                >
                  <Icon icon="mage:trash-3" /> Delete
                </button>
              </footer>

              {editorOutput && (
                <pre className="editor-output">
                  <code>{editorOutput}</code>
                </pre>
              )}
            </>
          )}
        </div>
      </div>

      {/* 6. DISCORD-STYLE FULLSCREEN SETTINGS MODAL */}
      <div className={`modal-overlay ${isSettingsOpen ? "open" : ""}`} id="settings-modal">
        <div className="settings-modal">
          <aside className="settings-sidebar">
            <div className="settings-sidebar-header">BENUTZER-EINSTELLUNGEN</div>
            <button 
              className={`settings-nav-item ${activeSettingsTab === "profile" ? "active" : ""}`} 
              onClick={() => setActiveSettingsTab("profile")}
            >
              Mein Profil
            </button>
            <button 
              className={`settings-nav-item ${activeSettingsTab === "appearance" ? "active" : ""}`} 
              onClick={() => setActiveSettingsTab("appearance")}
            >
              Erscheinungsbild
            </button>
            <button 
              className={`settings-nav-item ${activeSettingsTab === "byos" ? "active" : ""}`} 
              onClick={() => setActiveSettingsTab("byos")}
            >
              BYOS (Speicher)
            </button>
            <button 
              className={`settings-nav-item ${activeSettingsTab === "security" ? "active" : ""}`} 
              onClick={() => setActiveSettingsTab("security")}
            >
              Sicherheit & Keys
            </button>
            <button 
              className={`settings-nav-item ${activeSettingsTab === "editor" ? "active" : ""}`} 
              onClick={() => setActiveSettingsTab("editor")}
            >
              Monaco-Editor
            </button>
            <button 
              className={`settings-nav-item ${activeSettingsTab === "github" ? "active" : ""}`} 
              onClick={() => setActiveSettingsTab("github")}
            >
              GitHub-Integration
            </button>
          </aside>

          <main className="settings-content">
            <div className="settings-close-wrapper">
              <button className="settings-close-btn" onClick={() => setIsSettingsOpen(false)} title="Schließen">
                <Icon icon="mage:multiply" />
              </button>
              <span className="settings-close-label">ESC</span>
            </div>

            <div>
              {/* Tab: Profile */}
              {activeSettingsTab === "profile" && (
                <div className="settings-tab-content" id="tab-profile">
                  <h3>Kryptografisches Profil</h3>
                  <div className="settings-profile-card">
                    <div className="profile-avatar-large purple">C</div>
                    <div className="profile-info-large">
                      <span className="profile-name">CipherNaut</span>
                      <span className="profile-status-badge">Unterstützer ⭐</span>
                    </div>
                  </div>
                  <div className="settings-form-group">
                    <label>Kryptografische ID (Ed25519 Public Key)</label>
                    <div className="key-display-wrapper">
                      <code className="key-display">0xA3F9D1E8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890</code>
                      <button 
                        className="btn-copy-key" 
                        onClick={() => { navigator.clipboard.writeText("0xA3F9D1E8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890"); showToast("Public Key kopiert!"); }} 
                        title="Kopieren"
                      >
                        <Icon icon="mage:copy" />
                      </button>
                    </div>
                  </div>
                  <div className="settings-form-group">
                    <label>Geräte-Kopplung (Device Pairing)</label>
                    <p className="settings-help-text">Kopple ein weiteres Gerät durch Scannen des Pairing-Codes.</p>
                    <button className="settings-btn" onClick={() => showToast("Gerätekopplung gestartet")}>Pairing starten</button>
                  </div>
                </div>
              )}

              {/* Tab: Appearance */}
              {activeSettingsTab === "appearance" && (
                <div className="settings-tab-content" id="tab-appearance">
                  <h3>Erscheinungsbild & Canvas</h3>
                  <div className="settings-form-group">
                    <label>Milchglas-Effekt (Glassmorphism)</label>
                    <div className="switch-control">
                      <span>Transparenz- und Blur-Effekte aktivieren</span>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={glassmorphism} 
                          onChange={(e) => setGlassmorphism(e.target.checked)} 
                        />
                        <span className="slider" />
                      </label>
                    </div>
                  </div>
                  <div className="settings-form-group">
                    <label>Hintergrund-Presets</label>
                    <div className="color-presets" id="settings-color-presets">
                      {(theme === "light" ? lightPresets : darkPresets).map((preset) => (
                        <button
                          key={preset.color}
                          className={`preset-btn ${canvasColor === preset.color ? "active" : ""}`}
                          style={{ backgroundColor: preset.color }}
                          title={preset.title}
                          onClick={() => setCanvasColor(preset.color)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="settings-form-group">
                    <div className="custom-color-control">
                      <label htmlFor="settings-canvas-color">Eigene Hintergrundfarbe:</label>
                      <input 
                        type="color" 
                        id="settings-canvas-color" 
                        value={canvasColor} 
                        onChange={(e) => setCanvasColor(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="settings-form-group">
                    <div className="custom-color-control">
                      <label htmlFor="settings-glow-color">Radial-Glow Farbe:</label>
                      <input 
                        type="color" 
                        id="settings-glow-color" 
                        value={glowColor} 
                        onChange={(e) => setGlowColor(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: BYOS */}
              {activeSettingsTab === "byos" && (
                <div className="settings-tab-content" id="tab-byos">
                  <h3>Bring Your Own Storage (BYOS)</h3>
                  <p className="settings-help-text">Verbinde deinen eigenen Cloud-Speicher für Datei-Uploads über 10 MB.</p>
                  <div className="settings-form-group">
                    <label htmlFor="byos-provider">Speicher-Provider</label>
                    <select id="byos-provider" className="settings-select">
                      <option value="nextcloud">Nextcloud (WebDAV)</option>
                      <option value="s3">AWS S3 / MinIO</option>
                      <option value="dropbox">Dropbox API</option>
                    </select>
                  </div>
                  <div className="settings-form-group">
                    <label htmlFor="byos-url">Server-URL</label>
                    <input type="text" id="byos-url" className="settings-input" defaultValue="https://cloud.zeno-chat.de/remote.php/dav/files/" />
                  </div>
                  <div className="settings-form-group">
                    <label htmlFor="byos-user">Benutzername / Key ID</label>
                    <input type="text" id="byos-user" className="settings-input" defaultValue="cipher_naut" />
                  </div>
                  <button className="settings-btn primary" onClick={() => { setIsSettingsOpen(false); showToast("BYOS-Einstellungen gespeichert!"); }}>
                    Verbindung testen & Speichern
                  </button>
                </div>
              )}

              {/* Tab: Security */}
              {activeSettingsTab === "security" && (
                <div className="settings-tab-content" id="tab-security">
                  <h3>Sicherheit & Recovery</h3>
                  <div className="settings-form-group">
                    <label>Backup-Key (Seed Phrase)</label>
                    <p className="settings-help-text">Sichere deine 12-Wort-Seed-Phrase, um deine Identität auf neuen Geräten wiederherzustellen.</p>
                    <button className="settings-btn" onClick={() => showToast("Seed Phrase: apple banana cherry ...")}>Backup-Key anzeigen</button>
                  </div>
                  <div className="settings-form-group">
                    <label>Social Recovery (Treuhänder)</label>
                    <p className="settings-help-text">Teile deinen Key via Shamir's Secret Sharing auf 5 vertrauenswürdige Kontakte auf.</p>
                    <button className="settings-btn" onClick={() => showToast("Social Recovery Setup gestartet")}>Social Recovery einrichten</button>
                  </div>
                </div>
              )}

              {/* Tab: Monaco-Editor */}
              {activeSettingsTab === "editor" && (
                <div className="settings-tab-content" id="tab-editor">
                  <h3>Monaco-Editor Laufzeitumgebungen</h3>
                  <p className="settings-help-text">
                    Verwalte hier die clientseitigen Sandboxen und Compiler-Bibliotheken für verschiedene Programmiersprachen.
                  </p>

                  <div className="runtime-settings-list" style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {[
                      { id: "javascript", name: "JavaScript / TypeScript Sandbox", desc: "Native isolierte Sandbox-Laufzeit im Web Worker. Keine Downloads erforderlich.", size: "0 MB (integriert)", icon: "vscode-icons:file-type-js" },
                      { id: "python", name: "Python WebAssembly Playground (Pyodide)", desc: "Lokale Python-Ausführung über den Pyodide WASM-Interpreter.", size: "12.8 MB", icon: "vscode-icons:file-type-python" },
                      { id: "rust", name: "Rust Compiler Simulator & Aegis Crypto", desc: "Rust-Laufzeitsimulation und lokale Aegis Kryptografie-Pakete.", size: "4.5 MB", icon: "vscode-icons:file-type-rust" },
                      { id: "csharp", name: ".NET Sandbox Simulator (C#)", desc: ".NET CLR Simulator zur clientseitigen Ausführung von C#-Codeblöcken.", size: "8.2 MB", icon: "vscode-icons:file-type-csharp" },
                      { id: "cpp", name: "C / C++ Compiler Simulator (WASM-based)", desc: "WebAssembly-basierter gcc/g++-Simulator zur lokalen Code-Validierung.", size: "6.1 MB", icon: "vscode-icons:file-type-cpp" }
                    ].map((rt) => {
                      const status = editorRuntimes[rt.id];
                      return (
                        <div key={rt.id} className="runtime-card" style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "16px",
                          backgroundColor: "var(--bg-tertiary)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "var(--radius-md)",
                          gap: "16px"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <Icon icon={rt.icon} style={{ fontSize: "28px", flexShrink: 0 }} />
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>{rt.name}</span>
                              <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{rt.desc}</span>
                              <span style={{ fontSize: "9px", color: "var(--glow-color-1, #3574F0)", fontWeight: "600", marginTop: "4px" }}>Größe: {rt.size}</span>
                            </div>
                          </div>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                            {status === "installed" ? (
                              <>
                                <span className="badge" style={{ backgroundColor: "rgba(89, 168, 105, 0.15)", color: "#59A869", border: "1px solid rgba(89, 168, 105, 0.3)" }}>Bereit</span>
                                {rt.id !== "javascript" && (
                                  <button className="settings-btn" onClick={() => handleDeleteRuntime(rt.id)} style={{ padding: "6px 12px", color: "var(--accent-danger)" }}>Deinstallieren</button>
                                )}
                              </>
                            ) : status === "installing" ? (
                              <>
                                <span className="badge" style={{ backgroundColor: "rgba(255, 198, 109, 0.15)", color: "#FFC66D", border: "1px solid rgba(255, 198, 109, 0.3)" }}>Installiert...</span>
                                <div className="spinner" style={{ width: "16px", height: "16px", border: "2px solid var(--border-color)", borderTopColor: "var(--accent-color)", borderRadius: "50%", animation: "zeno-pulse 1s linear infinite" }} />
                              </>
                            ) : (
                              <>
                                <span className="badge" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>Nicht installiert</span>
                                <button className="settings-btn primary" onClick={() => handleInstallRuntime(rt.id)} style={{ padding: "6px 12px" }}>Download & Installieren</button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab: GitHub-Integration */}
              {activeSettingsTab === "github" && (
                <div className="settings-tab-content" id="tab-github">
                  <h3>GitHub-Integration (100% lokal & privat)</h3>
                  <p className="settings-help-text">
                    Verbinde dein GitHub-Konto direkt über deinen Webbrowser mit der GitHub-API. 
                    <strong> Wichtig:</strong> Dein Token verbleibt ausschließlich lokal auf diesem Gerät im Speicher der App. 
                    Es wird niemals an einen Zeno-Server gesendet.
                  </p>

                  <div className="settings-form-group" style={{ marginTop: "20px" }}>
                    <label>Personal Access Token (PAT)</label>
                    <p className="settings-help-text">
                      Erstelle ein Token mit <code>repo</code>-Rechten auf GitHub, um deinen Repository-Status abzufragen und Commits einzusehen.
                    </p>
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <input 
                        type="password" 
                        className="settings-input" 
                        placeholder="ghp_..." 
                        value={githubToken} 
                        onChange={(e) => {
                          setGithubToken(e.target.value);
                          setGithubUser(null);
                        }}
                        style={{ flex: 1, maxWidth: "none" }}
                      />
                      <button 
                        className="settings-btn primary" 
                        onClick={testGithubConnection} 
                        disabled={githubConnecting || !githubToken.trim()}
                        style={{ flexShrink: 0 }}
                      >
                        {githubConnecting ? "Verbinde..." : "Verbindung testen"}
                      </button>
                    </div>
                  </div>

                  {githubUser && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginTop: "16px",
                      padding: "12px",
                      backgroundColor: "rgba(89, 168, 105, 0.1)",
                      border: "1px solid rgba(89, 168, 105, 0.3)",
                      borderRadius: "var(--radius-md)"
                    }}>
                      <img 
                        src={githubUser.avatarUrl} 
                        alt="GitHub Avatar" 
                        style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid #59A869" }}
                      />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#59A869" }}>✓ Erfolgreich verbunden</span>
                        <span style={{ fontSize: "11px", color: "var(--text-primary)", fontWeight: "600" }}>
                          {githubUser.name || githubUser.login} (@{githubUser.login})
                        </span>
                      </div>
                    </div>
                  )}

                  <div style={{
                    marginTop: "24px",
                    padding: "16px",
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-lg)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px"
                  }}>
                    <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>Sicherheitsprotokoll & Transparenz</span>
                    <ul style={{ fontSize: "11px", color: "var(--text-muted)", paddingLeft: "16px", lineHeight: "1.6" }}>
                      <li>Direct-Client-Request: Keine API-Proxy-Server oder Cloud-Gateways. Die Anfrage erfolgt direkt von deiner lokalen IP zu GitHub.</li>
                      <li>Speicherort: Der Token wird ausschließlich in deiner lokalen Desktop-App-Sandbox gespeichert.</li>
                      <li>Minimalberechtigung: Verwende am besten ein feinkörniges (Fine-grained) Token mit Nur-Lese-Rechten auf ausgewählte Repositories.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* 7. PROFILE DETAILS MODAL */}
      <div className={`modal-overlay ${selectedUserProfile ? "open" : ""}`} id="profile-modal">
        {selectedUserProfile && (
          <div className="profile-modal-card">
            <header className="profile-card-header">
              <button className="modal-close" onClick={() => setSelectedUserProfile(null)} title="Schließen">
                <Icon icon="mage:multiply" />
              </button>
            </header>
            <div className="profile-card-body">
              <div 
                className={`profile-card-avatar ${selectedUserProfile.avatarColor}`}
                style={selectedUserProfile.bgColor ? { backgroundColor: selectedUserProfile.bgColor } : {}}
              >
                {selectedUserProfile.avatar}
              </div>
              <h3 className="profile-card-name">{selectedUserProfile.name}</h3>
              <span className="profile-card-role">{selectedUserProfile.role.toUpperCase()}</span>
              {selectedUserProfile.status && <div className="profile-card-status">{selectedUserProfile.status}</div>}
              
              <div className="profile-card-section">
                <label>Kryptografischer Fingerprint</label>
                <div className="fingerprint-display">
                  {selectedUserProfile.fingerprint}
                </div>
              </div>

              <div className="profile-card-actions">
                <button className="profile-action-btn primary" onClick={() => { setSelectedUserProfile(null); showToast(`Sicherer DM-Chat mit ${selectedUserProfile.name} gestartet`); }}>
                  Sicheren Chat starten
                </button>
                <button className="profile-action-btn" onClick={() => showToast("Kryptografische Identität verifiziert!")}>
                  Identität verifizieren
                </button>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* 7. CUSTOM WASM RUNTIME MODAL */}
      <div className={`modal-overlay ${isCustomWasmModalOpen ? "open" : ""}`}>
        <div className="zeno-dialog-modal" style={{ width: "500px", height: "auto", minHeight: "340px", borderRadius: "12px", padding: "24px", position: "relative" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon icon="mage:box-3d" style={{ color: "var(--accent-color)" }} />
              Eigene WASM-Laufzeit einbinden
            </h3>
            <button className="editor-close-btn modal-close" onClick={() => setIsCustomWasmModalOpen(false)}>
              <Icon icon="mage:multiply" />
            </button>
          </header>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <p className="settings-help-text">
              Binde ein benutzerdefiniertes `.wasm` Paket von deiner eigenen URL oder der WAPM-Registry ein. Die Laufzeit wird isoliert in der WASI-Sandbox ausgeführt.
            </p>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                SPRACH-NAME / TITEL
              </label>
              <input
                type="text"
                className="settings-input"
                placeholder="z. B. Elixir Engine (WASI)"
                value={customWasmName}
                onChange={(e) => setCustomWasmName(e.target.value)}
                style={{ width: "100%", maxWidth: "none" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                WASM-BINARY URL (.wasm)
              </label>
              <input
                type="text"
                className="settings-input"
                placeholder="https://wapm.io/download/elixir/elixir.wasm"
                value={customWasmUrl}
                onChange={(e) => setCustomWasmUrl(e.target.value)}
                style={{ width: "100%", maxWidth: "none" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
              <button className="settings-btn" onClick={() => setIsCustomWasmModalOpen(false)}>
                Abbrechen
              </button>
              <button
                className="settings-btn primary"
                onClick={() => {
                  if (!customWasmName.trim() || !customWasmUrl.trim()) {
                    showToast("Bitte Titel und URL eingeben.");
                    return;
                  }
                  showToast(`Benutzerdefinierte WASM-Laufzeit "${customWasmName}" erfolgreich eingebunden!`);
                  setIsCustomWasmModalOpen(false);
                  setCustomWasmName("");
                  setCustomWasmUrl("");
                }}
              >
                Laufzeit Registrieren
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 8. IDE PROJECT WIZARD MODAL */}
      <div className={`modal-overlay ${isIdeProjectWizardOpen ? "open" : ""}`}>
        <div className="zeno-dialog-modal" style={{ width: "600px", height: "auto", borderRadius: "12px", padding: "24px", position: "relative" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon icon="mage:box-3d" style={{ color: "var(--accent-color)" }} />
              Neues Projekt generieren
            </h3>
            <button className="editor-close-btn modal-close" onClick={() => setIsIdeProjectWizardOpen(false)}>
              <Icon icon="mage:multiply" />
            </button>
          </header>

          <p className="settings-help-text" style={{ marginBottom: "14px" }}>
            Wähle eine Projektvorlage. Alle Dateien werden in deinem virtuellen Zeno-Workspace generiert und können direkt ausgeführt werden.
          </p>

          <div className="ide-wizard-grid">
            <div className="ide-wizard-card" onClick={() => handleIdeGenerateProject("rust")}>
              <Icon icon="vscode-icons:file-type-rust" className="ide-wizard-card-icon" />
              <div className="ide-wizard-card-details">
                <h4>Rust Cargo App</h4>
                <p>Erstellt Cargo.toml und src/main.rs mit Print-Ausgaben.</p>
              </div>
            </div>

            <div className="ide-wizard-card" onClick={() => handleIdeGenerateProject("go")}>
              <Icon icon="vscode-icons:file-type-go" className="ide-wizard-card-icon" />
              <div className="ide-wizard-card-details">
                <h4>Go Module App</h4>
                <p>Erstellt go.mod und main.go mit fmt-Paket.</p>
              </div>
            </div>

            <div className="ide-wizard-card" onClick={() => handleIdeGenerateProject("python")}>
              <Icon icon="vscode-icons:file-type-python" className="ide-wizard-card-icon" />
              <div className="ide-wizard-card-details">
                <h4>Python App</h4>
                <p>Erstellt main.py und requirements.txt.</p>
              </div>
            </div>

            <div className="ide-wizard-card" onClick={() => handleIdeGenerateProject("web")}>
              <Icon icon="vscode-icons:file-type-html" className="ide-wizard-card-icon" />
              <div className="ide-wizard-card-details">
                <h4>Static Web App</h4>
                <p>Template mit index.html, style.css und script.js.</p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
            <button className="settings-btn" onClick={() => setIsIdeProjectWizardOpen(false)}>
              Abbrechen
            </button>
          </div>
        </div>
      </div>

      {/* 9. IDE CREATE ITEM MODAL */}
      <div className={`modal-overlay ${isIdeNewItemModalOpen ? "open" : ""}`}>
        <div className="zeno-dialog-modal" style={{ width: "400px", height: "auto", borderRadius: "12px", padding: "20px", position: "relative" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>
              {ideNewItemType === "file" ? "Neue Datei erstellen" : "Neuer Ordner erstellen"}
            </h3>
            <button className="editor-close-btn modal-close" onClick={() => setIsIdeNewItemModalOpen(false)}>
              <Icon icon="mage:multiply" />
            </button>
          </header>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {ideNewItemParentPath && (
              <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", gap: "4px" }}>
                <span>Speicherort:</span>
                <code style={{ color: "var(--accent-color)" }}>/{ideNewItemParentPath}</code>
              </div>
            )}

            <div>
              <label style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                NAME
              </label>
              <input
                type="text"
                className="settings-input"
                placeholder={ideNewItemType === "file" ? "z. B. main.rs oder index.js" : "z. B. src oder assets"}
                value={ideNewItemName}
                onChange={(e) => setIdeNewItemName(e.target.value)}
                style={{ width: "100%", maxWidth: "none" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (ideNewItemType === "file") handleIdeFileCreate();
                    else handleIdeFolderCreate();
                  }
                }}
                autoFocus
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button className="settings-btn" onClick={() => setIsIdeNewItemModalOpen(false)}>
                Abbrechen
              </button>
              <button
                className="settings-btn primary"
                onClick={() => {
                  if (ideNewItemType === "file") handleIdeFileCreate();
                  else handleIdeFolderCreate();
                }}
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
