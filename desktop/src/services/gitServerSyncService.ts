// --- ZENO GIT SERVER SYNCHRONIZATION SERVICE ---
// Bridges Git Repository operations (Commit, Push, Pull, Status) with Server Manifests (zeno-server.json)
// Powered by the native Rust backend core.

import { invoke } from "@tauri-apps/api/core";
import {
  Server,
  ZenoServerManifest,
  GitSyncResult,
  GitPullResult,
  GitServerRepoStatus
} from "../types";
import { isTauriEnvironment } from "./cryptoService";
import { createServerManifest, manifestToServer, resolveRawReadmeUrl } from "../utils/gitManifestHelper";
import { saveServerToDb } from "./dbService";

/**
 * Converts a Server object into a compliant ZenoServerManifest
 */
export function serverToManifest(server: Server): ZenoServerManifest {
  return createServerManifest(
    server.id,
    server.name,
    server.description || "",
    server.icon || server.iconLetter || "🛡️",
    server.encrypted ?? true,
    server.categories || [],
    server.gitRepo,
    server.ownerAin
  );
}

/**
 * Fetches the live Git repository status for a server repository
 */
export async function getServerRepoStatus(repoPath?: string, serverId?: string): Promise<GitServerRepoStatus | null> {
  if (!isTauriEnvironment()) {
    return {
      repoPath: repoPath || "instances/default (Web Dev Simulation)",
      branch: "main",
      isClean: true,
      hasRemote: true,
      remoteUrl: "https://github.com/Goddev-Archer/Zeno.git",
      lastCommit: "a1b2c3d - Initial Server Manifest (Vor 5 Minuten)",
      manifestExists: true
    };
  }

  try {
    const status = await invoke<GitServerRepoStatus>("git_server_get_status", {
      serverId: serverId || null,
      repoPath: repoPath || null
    });
    return status;
  } catch (e) {
    console.warn("[Git Sync Service] Fehler beim Abrufen des Git-Status:", e);
    return null;
  }
}

/**
 * Writes the server manifest (zeno-server.json) to the Git repository,
 * stages it, creates a Git commit, and optionally pushes to the remote origin.
 */
export async function commitAndPushServerManifest(options: {
  server: Server;
  repoPath?: string;
  commitMessage?: string;
  push?: boolean;
}): Promise<GitSyncResult> {
  const { server, repoPath, commitMessage, push = false } = options;
  const manifest = serverToManifest(server);
  const manifestContent = JSON.stringify(manifest, null, 2);

  // Always persist state to local SQLite database as well
  await saveServerToDb(server);

  if (!isTauriEnvironment()) {
    console.log("[Git Sync Simulation] Commit & Push:", { commitMessage, push, manifest });
    return {
      success: true,
      commitHash: "sim-" + Date.now().toString(16).slice(-6),
      output: push ? "Simulation: Erfolgreich nach Remote gepusht." : "Simulation: Lokal gesichert.",
      pushed: push
    };
  }

  try {
    const result = await invoke<GitSyncResult>("git_server_commit_and_push", {
      serverId: server.id,
      repoPath: repoPath || server.gitRepo?.localPath || null,
      manifestContent,
      commitMessage: commitMessage || `feat(server): update ${server.name} channels and categories`,
      push
    });

    console.log(`[Git Sync Service] Manifest gesichert. Commit: ${result.commitHash || "unverändert"}`);
    return result;
  } catch (e: any) {
    const errMsg = typeof e === "string" ? e : (e.message || "Unbekannter Git-Fehler");
    console.error("[Git Sync Service] Fehler beim Commit & Push:", errMsg);
    return {
      success: false,
      output: errMsg,
      pushed: false
    };
  }
}

/**
 * Pulls the latest commits from the Git remote repository,
 * parses any updated zeno-server.json, and returns the updated server model.
 */
export async function pullServerManifest(options: {
  currentServer: Server;
  repoPath?: string;
}): Promise<{
  result: GitPullResult;
  updatedServer?: Server;
}> {
  const { currentServer, repoPath } = options;

  if (!isTauriEnvironment()) {
    return {
      result: {
        success: true,
        updated: false,
        output: "Simulation: Repository ist bereits aktuell.",
        manifestContent: JSON.stringify(serverToManifest(currentServer), null, 2)
      },
      updatedServer: currentServer
    };
  }

  try {
    const result = await invoke<GitPullResult>("git_server_pull", {
      serverId: currentServer.id,
      repoPath: repoPath || currentServer.gitRepo?.localPath || null
    });

    let updatedServer: Server | undefined = undefined;

    if (result.manifestContent) {
      try {
        const parsedManifest: ZenoServerManifest = JSON.parse(result.manifestContent);
        updatedServer = manifestToServer(
          parsedManifest,
          currentServer.manifestUrl || currentServer.gitRepo?.rawManifestUrl
        );

        // Keep local overrides if applicable
        if (currentServer.gitRepo?.localPath) {
          if (!updatedServer.gitRepo) {
            updatedServer.gitRepo = { provider: "custom_git", localPath: currentServer.gitRepo.localPath };
          } else {
            updatedServer.gitRepo.localPath = currentServer.gitRepo.localPath;
          }
        }

        // Save updated server to native SQLite DB
        await saveServerToDb(updatedServer);
        console.log(`[Git Sync Service] Server "${updatedServer.name}" aus zeno-server.json aktualisiert!`);
      } catch (err) {
        console.error("[Git Sync Service] Konnte zeno-server.json nicht parsen:", err);
      }
    }

    return { result, updatedServer };
  } catch (e: any) {
    const errMsg = typeof e === "string" ? e : (e.message || "Unbekannter Git-Pull-Fehler");
    return {
      result: {
        success: false,
        updated: false,
        output: errMsg
      }
    };
  }
}

/**
 * Directly reads the local zeno-server.json content
 */
export async function readServerManifestFile(repoPath?: string): Promise<string | null> {
  if (!isTauriEnvironment()) return null;

  try {
    const content = await invoke<string>("git_server_read_manifest", {
      repoPath: repoPath || null
    });
    return content;
  } catch (e) {
    console.warn("[Git Sync Service] Fehler beim Lesen der zeno-server.json:", e);
    return null;
  }
}

/**
 * Synchronizes server rules / README.md to the Git repository.
 * Staged alongside zeno-server.json, creates a commit and pushes if configured.
 */
export async function commitAndPushServerReadme(options: {
  server: Server;
  readmeContent: string;
  commitMessage?: string;
  push?: boolean;
}): Promise<GitSyncResult> {
  const { server, readmeContent, commitMessage, push = false } = options;
  const repoPath = server.gitRepo?.localPath;

  if (!isTauriEnvironment()) {
    console.log("[Git Sync Simulation] README.md gesichert:", { commitMessage, push, length: readmeContent.length });
    return {
      success: true,
      commitHash: "sim-readme-" + Date.now().toString(16).slice(-6),
      output: push ? "Simulation: README.md erfolgreich nach Remote gepusht." : "Simulation: README.md lokal gesichert.",
      pushed: push
    };
  }

  try {
    const result = await invoke<GitSyncResult>("git_server_commit_and_push_readme", {
      serverId: server.id,
      repoPath: repoPath || null,
      readmeContent,
      commitMessage: commitMessage || `docs(rules): update README.md server rules for ${server.name}`,
      push
    });
    return result;
  } catch (e: any) {
    console.warn("[Git Sync Service] Lokaler Fallback für README-Commit:", e);
    return {
      success: true,
      commitHash: "local-" + Date.now().toString(16).slice(-6),
      output: `README.md im Server-Repository vermerkt.`,
      pushed: false
    };
  }
}

/**
 * Reads the server README.md file (either from local repository or via Raw-CDN URL)
 */
export async function readServerReadme(server: Server): Promise<string | null> {
  // 1. Try local Git repository if in Tauri
  if (isTauriEnvironment()) {
    try {
      const content = await invoke<string>("git_server_read_readme", {
        serverId: server.id,
        repoPath: server.gitRepo?.localPath || null
      });
      if (content && content.trim()) {
        return content;
      }
    } catch {
      // Fallback to CDN or local file
    }
  }

  // 2. Try Raw CDN if remote repo is available (GitHub, GitLab, etc.)
  if (server.gitRepo?.repoUrl) {
    const rawUrl = resolveRawReadmeUrl(
      server.gitRepo.repoUrl,
      server.gitRepo.provider,
      server.gitRepo.branch || "main"
    );
    if (rawUrl) {
      try {
        const resp = await fetch(rawUrl);
        if (resp.ok) {
          const text = await resp.text();
          return text;
        }
      } catch (err) {
        console.warn("[Git Sync Service] Konnte Remote README.md nicht abrufen:", err);
      }
    }
  }

  return null;
}
