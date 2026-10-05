// --- ZENO NATIVE IDE BACKEND SERVICE ---
// Powered 100% by the Rust backend core.
// Strictly decouples the JavaScript UI overlay from any OS execution,
// keeping file handling, code compilation, and tool execution secured in Rust.

import { invoke } from "@tauri-apps/api/core";
import { NativeExecutionResult, SystemCompilersStatus } from "../types";
import { isTauriEnvironment } from "./cryptoService";

/**
 * Runs code natively via the Rust backend.
 * Analyzes the file extension, invokes the native toolchain (cargo/rustc, python, node, go),
 * and returns real stdout, stderr, execution time, and exit codes.
 */
export async function executeCodeNatively(
  filePath: string,
  code?: string
): Promise<NativeExecutionResult> {
  if (!isTauriEnvironment()) {
    console.log("[Web Simulation] executeCodeNatively:", filePath);
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    return {
      success: true,
      stdout: `[Web Dev Simulation] File: ${filePath}\nNative execution simulated (Tauri Rust backend inactive in web dev mode).\nCode syntax valid (${ext.toUpperCase()}).`,
      stderr: "",
      exitCode: 0,
      durationMs: 12,
      runner: "Zeno Web Simulator (Dev Mode)"
    };
  }

  try {
    const result = await invoke<NativeExecutionResult>("ide_run_code_native", {
      filePath,
      code: code || null
    });
    return result;
  } catch (e: any) {
    const errorMsg = typeof e === "string" ? e : (e.message || "Unbekannter Ausführungsfehler im Rust-Backend");
    return {
      success: false,
      stdout: "",
      stderr: `Rust Backend Ausführungsfehler: ${errorMsg}`,
      exitCode: 1,
      durationMs: 0,
      runner: "Zeno Rust Backend Core"
    };
  }
}

/**
 * Probes the user's host OS for real compilers, runtimes, and tools
 * (rustc, python, node, git, go) via Rust.
 */
export async function getSystemCompilers(): Promise<SystemCompilersStatus> {
  if (!isTauriEnvironment()) {
    return {
      rustAvailable: true,
      rustVersion: "rustc 1.85.0 (Web Simulation)",
      pythonAvailable: true,
      pythonVersion: "Python 3.12.0 (Web Simulation)",
      nodeAvailable: true,
      nodeVersion: "v22.12.0 (Web Simulation)",
      gitAvailable: true,
      gitVersion: "git version 2.47.1 (Web Simulation)",
      goAvailable: false,
      goVersion: undefined
    };
  }

  try {
    return await invoke<SystemCompilersStatus>("ide_get_system_compilers");
  } catch (e) {
    console.warn("Fehler beim Abrufen der System-Compiler:", e);
    return {
      rustAvailable: false,
      pythonAvailable: false,
      nodeAvailable: false,
      gitAvailable: false,
      goAvailable: false
    };
  }
}

/**
 * Creates a folder in the workspace safely via Rust backend.
 */
export async function createWorkspaceFolder(folderPath: string): Promise<void> {
  if (!isTauriEnvironment()) return;
  await invoke("ide_create_folder", { folderPath });
}

/**
 * Reads a workspace file safely via Rust backend.
 */
export async function readWorkspaceFile(name: string): Promise<string> {
  if (!isTauriEnvironment()) return `// Web simulation for ${name}`;
  return await invoke<string>("read_workspace_file", { name });
}

/**
 * Writes/saves a workspace file safely via Rust backend.
 */
export async function writeWorkspaceFile(name: string, content: string): Promise<void> {
  if (!isTauriEnvironment()) return;
  await invoke("write_workspace_file", { name, content });
}

/**
 * Deletes a workspace file safely via Rust backend.
 */
export async function deleteWorkspaceFile(name: string): Promise<void> {
  if (!isTauriEnvironment()) return;
  await invoke("delete_workspace_file", { name });
}

/**
 * Lists workspace files safely via Rust backend.
 */
export async function listWorkspaceFiles(): Promise<Array<{ name: string; language: string }>> {
  if (!isTauriEnvironment()) return [];
  return await invoke<Array<{ name: string; language: string }>>("list_workspace_files");
}
