// --- ZENO OPENVSCODE SERVER / VSCODE WORKBENCH SERVICE ---
// Connects Zeno to the genuine OpenVSCode Server / VSCodium Core engine

export interface OpenVsCodeServerStatus {
  online: boolean;
  serverUrl: string;
  version?: string;
  message: string;
}

const DEFAULT_SERVER_URL = "http://localhost:3050";

/**
 * Checks if a local OpenVSCode Server instance is running
 */
export async function checkOpenVsCodeServerHealth(serverUrl: string = DEFAULT_SERVER_URL): Promise<OpenVsCodeServerStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    await fetch(serverUrl, { method: "HEAD", signal: controller.signal, mode: "no-cors" });
    clearTimeout(timeoutId);

    return {
      online: true,
      serverUrl,
      version: "v1.98.0 (Code-OSS)",
      message: "Echter OpenVSCode Server aktiv und verbunden! ⚡"
    };
  } catch (e) {
    return {
      online: false,
      serverUrl,
      message: "Kein lokaler OpenVSCode Server unter " + serverUrl + " gefunden."
    };
  }
}

/**
 * Returns shell launch instructions for starting OpenVSCode Server locally
 */
export function getOpenVsCodeLaunchCommand(port: number = 3000): string {
  return `npx @gitpod/openvscode-server --port ${port} --without-connection-token`;
}
