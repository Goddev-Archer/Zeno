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

import { IdeEntry } from "../types";

/**
 * Opens a native OS Folder Picker dialog via the Rust backend.
 * Returns the selected absolute path, or null if canceled.
 */
export async function openFolderDialog(): Promise<string | null> {
  if (!isTauriEnvironment()) {
    // Web simulation fallback
    const mockPath = prompt("Projektordner-Pfad eingeben (z. B. C:\\dev\\MeinProjekt):", "C:\\dev\\MeinProjekt");
    return mockPath || null;
  }
  try {
    const path = await invoke<string | null>("ide_open_folder_dialog");
    return path;
  } catch (e) {
    console.warn("Fehler beim Öffnen des Ordner-Dialogs:", e);
    return null;
  }
}

/**
 * Opens a native OS File Picker dialog via the Rust backend.
 * Returns the selected absolute path, or null if canceled.
 */
export async function openFileDialog(): Promise<string | null> {
  if (!isTauriEnvironment()) {
    const mockFile = prompt("Dateipfad eingeben (z. B. C:\\dev\\script.py):", "C:\\dev\\script.py");
    return mockFile || null;
  }
  try {
    const path = await invoke<string | null>("ide_open_file_dialog");
    return path;
  } catch (e) {
    console.warn("Fehler beim Öffnen des Datei-Dialogs:", e);
    return null;
  }
}

/**
 * Reads directory entries directly from disk via Rust.
 */
export async function readDirectory(dirPath: string): Promise<IdeEntry[]> {
  if (!isTauriEnvironment()) {
    return [
      { name: "main.rs", path: `${dirPath}/main.rs`, isFolder: false, language: "rust", size: 120 },
      { name: "README.md", path: `${dirPath}/README.md`, isFolder: false, language: "markdown", size: 450 },
      { name: "src", path: `${dirPath}/src`, isFolder: true, language: "" }
    ];
  }
  return await invoke<IdeEntry[]>("ide_read_directory", { dirPath });
}

/**
 * Reads a file's raw content directly from disk.
 */
export async function readFileContent(filePath: string): Promise<string> {
  if (!isTauriEnvironment()) {
    return `// Simulierte Datei geladen von ${filePath}\nconsole.log("Hello from Zeno Web!");\n`;
  }
  return await invoke<string>("ide_read_file", { filePath });
}

/**
 * Writes content to a file directly on disk.
 */
export async function writeFileContent(filePath: string, content: string): Promise<void> {
  if (!isTauriEnvironment()) return;
  await invoke("ide_write_file", { filePath, content });
}

/**
 * Creates a new empty file on disk.
 */
export async function createFileEntry(filePath: string): Promise<void> {
  if (!isTauriEnvironment()) return;
  await invoke("ide_create_file", { filePath });
}

/**
 * Creates a new directory on disk.
 */
export async function createFolderEntry(folderPath: string): Promise<void> {
  if (!isTauriEnvironment()) return;
  await invoke("ide_create_folder", { folderPath });
}

/**
 * Deletes a file or directory on disk.
 */
export async function deleteEntry(path: string): Promise<void> {
  if (!isTauriEnvironment()) return;
  await invoke("ide_delete_entry", { path });
}

/**
 * Renames a file or directory on disk.
 */
export async function renameEntry(oldPath: string, newPath: string): Promise<void> {
  if (!isTauriEnvironment()) return;
  await invoke("ide_rename_entry", { oldPath, newPath });
}

/**
 * Legacy Workspace Support
 */
export async function createWorkspaceFolder(folderPath: string): Promise<void> {
  await createFolderEntry(folderPath);
}

export async function readWorkspaceFile(name: string): Promise<string> {
  return await readFileContent(name);
}

export async function writeWorkspaceFile(name: string, content: string): Promise<void> {
  await writeFileContent(name, content);
}

export async function deleteWorkspaceFile(name: string): Promise<void> {
  await deleteEntry(name);
}

export async function listWorkspaceFiles(): Promise<Array<{ name: string; language: string }>> {
  if (!isTauriEnvironment()) return [];
  return await invoke<Array<{ name: string; language: string }>>("list_workspace_files");
}
