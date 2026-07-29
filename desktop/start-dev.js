// --- ZENO DESKTOP DEV SERVER LAUNCHER ---
// Starts the Zeno Code-OSS Engine Server (port 3050) alongside the Vite Frontend Dev Server (port 1420)

import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const codeOssDir = path.resolve(__dirname, "../../Zeno-Code-OSS");

console.log("=======================================================");
console.log("⚡ [Zeno] Launching Zeno Code-OSS Engine & Vite Dev Server...");
console.log("=======================================================");

// 1. Start Zeno-Code-OSS Engine Server
let codeOssProc = null;
if (fs.existsSync(path.join(codeOssDir, "server.js"))) {
  console.log("🚀 [Zeno] Starting Zeno Code-OSS Engine Server...");
  codeOssProc = spawn("node", ["server.js"], {
    cwd: codeOssDir,
    env: { ...process.env },
    stdio: "inherit"
  });

  codeOssProc.on("error", (err) => {
    console.error("❌ [Zeno] Failed to start Code-OSS Engine:", err.message);
  });
} else {
  console.warn("⚠️ [Zeno] Zeno-Code-OSS directory not found at:", codeOssDir);
}

// 2. Start Vite Frontend Dev Server
console.log("🚀 [Zeno] Starting Vite Frontend Dev Server...");
let viteCmd, viteArgs;
if (process.platform === "win32") {
  viteCmd = process.env.ComSpec || "cmd.exe";
  viteArgs = ["/c", "npx", "vite"];
} else {
  viteCmd = "npx";
  viteArgs = ["vite"];
}

const viteProc = spawn(viteCmd, viteArgs, {
  cwd: __dirname,
  env: { ...process.env },
  stdio: "inherit"
});

viteProc.on("error", (err) => {
  console.error("❌ [Zeno] Failed to start Vite:", err.message);
});

// Clean termination on exit
const cleanup = () => {
  console.log("\n🛑 [Zeno] Stopping dev servers...");
  if (codeOssProc && !codeOssProc.killed) {
    codeOssProc.kill();
  }
  if (viteProc && !viteProc.killed) {
    viteProc.kill();
  }
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
