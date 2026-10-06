// --- ZENO GIT SERVER MANIFEST HELPER & RESOLVER ---
import { Server, ZenoServerManifest, GitRepositoryConfig, Category } from "../types";

/**
 * Resolves a Git web/clone URL to the direct raw HTTP URL of zeno-server.json
 */
export function resolveRawManifestUrl(
  repoUrl: string,
  provider: "github" | "gitlab" | "gitea" | "custom_git",
  branch: string = "main",
  manifestPath: string = "zeno-server.json"
): string {
  const cleanUrl = repoUrl.trim().replace(/\.git$/i, "").replace(/\/+$/, "");

  // If the user already provided a direct raw JSON URL
  if (cleanUrl.endsWith(".json")) {
    return cleanUrl;
  }

  // GitHub: https://github.com/:owner/:repo -> https://raw.githubusercontent.com/:owner/:repo/:branch/:file
  if (provider === "github" || cleanUrl.includes("github.com")) {
    const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/i);
    if (match) {
      const [, owner, repo] = match;
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${manifestPath}`;
    }
  }

  // GitLab: https://gitlab.com/:owner/:repo -> https://gitlab.com/:owner/:repo/-/raw/:branch/:file
  if (provider === "gitlab" || cleanUrl.includes("gitlab.com")) {
    const match = cleanUrl.match(/gitlab\.com\/(.+)/i);
    if (match) {
      const path = match[1].replace(/^\/+|\/+$/g, "");
      return `https://gitlab.com/${path}/-/raw/${branch}/${manifestPath}`;
    }
  }

  // Codeberg or Gitea/Forgejo: https://codeberg.org/:owner/:repo -> /raw/branch/:branch/:file
  if (provider === "gitea" || cleanUrl.includes("codeberg.org")) {
    return `${cleanUrl}/raw/branch/${branch}/${manifestPath}`;
  }

  // Fallback Custom Git HTTP server
  return `${cleanUrl}/${manifestPath}`;
}

/**
 * Resolves a Git web/clone URL to the direct raw HTTP URL of README.md (Rules)
 */
export function resolveRawReadmeUrl(
  repoUrl: string,
  provider: "github" | "gitlab" | "gitea" | "custom_git" | "none" = "github",
  branch: string = "main"
): string {
  if (provider === "none") return "";
  return resolveRawManifestUrl(repoUrl, provider as any, branch, "README.md");
}

/**
 * Creates a compliant ZenoServerManifest
 */
export function createServerManifest(
  serverId: string,
  name: string,
  description: string,
  icon: string,
  encrypted: boolean,
  categories: Category[],
  gitRepo?: GitRepositoryConfig,
  ownerAin?: string,
  relays?: string[]
): ZenoServerManifest {
  return {
    version: "1.0.0",
    serverId,
    name,
    description,
    icon,
    iconLetter: icon || name.charAt(0).toUpperCase(),
    encrypted,
    ownerAin: ownerAin || "ZENO-ANONYMOUS",
    createdAt: new Date().toISOString(),
    gitRepo,
    relays: relays && relays.length > 0 ? relays : [
      "wss://relay.damus.io",
      "wss://nos.lol",
      "wss://relay.snort.social"
    ],
    categories
  };
}

/**
 * Converts a ZenoServerManifest into a client-ready Server model
 */
export function manifestToServer(manifest: ZenoServerManifest, rawManifestUrl?: string): Server {
  return {
    id: manifest.serverId || `srv-${Date.now()}`,
    name: manifest.name || "Unbenannter Server",
    iconLetter: manifest.iconLetter || manifest.icon || manifest.name?.charAt(0).toUpperCase() || "🌐",
    icon: manifest.icon || "🛡️",
    description: manifest.description || "",
    unreadCount: 0,
    encrypted: manifest.encrypted ?? true,
    ownerAin: manifest.ownerAin,
    manifestUrl: rawManifestUrl,
    gitRepo: manifest.gitRepo,
    relays: manifest.relays,
    categories: manifest.categories && manifest.categories.length > 0 ? manifest.categories : [
      {
        name: "TEXTKANÄLE",
        type: "text",
        channels: [
          { id: `c-${Date.now()}-1`, name: "allgemein" },
          { id: `c-${Date.now()}-2`, name: "dev-lounge" }
        ]
      },
      {
        name: "SPRACHKANÄLE",
        type: "voice",
        channels: [
          { id: `c-${Date.now()}-3`, name: "Sprachkanal Alpha" }
        ]
      }
    ]
  };
}

/**
 * Generates terminal bash commands to initialize and push zeno-server.json to a Git repo
 */
export function generateGitCommands(repoUrl: string, branch: string = "main"): string {
  const targetUrl = repoUrl ? repoUrl.trim() : "https://github.com/dein-user/mein-zeno-server.git";
  return [
    `# 1. Lokalen Server-Ordner erstellen`,
    `mkdir zeno-server-data && cd zeno-server-data`,
    `git init -b ${branch}`,
    ``,
    `# 2. Generierte zeno-server.json in diesen Ordner legen`,
    `git add zeno-server.json`,
    `git commit -m "feat: initialize Zeno decentralized server manifest"`,
    ``,
    `# 3. Remote verknüpfen & pushen`,
    `git remote add origin ${targetUrl}`,
    `git push -u origin ${branch}`
  ].join("\n");
}
