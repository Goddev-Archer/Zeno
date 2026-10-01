// --- ZENO CRYPTOGRAPHIC IDENTITY & AES-256-GCM SERVICE ---
// Powered by Native Rust Backend Core (via Tauri IPC) with WebCrypto fallback.

import { invoke } from "@tauri-apps/api/core";
import { UserIdentity, EncryptedVaultBlob, DbIdentityRecord } from "../types";

export function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
}

// Convert ArrayBuffer to Hex String
export function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

// Convert Hex String to Uint8Array
export function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Derives Account Identifier Number (AIN) from SHA-256 Public Key hash
 * Format: ZENO-XXXX-YYYY-ZZZZ (e.g. ZENO-8F3A-9B21-44E2)
 */
export function deriveAinFromPublicKey(publicKeyHex: string): { ain: string; fingerprint: string } {
  const cleanHex = publicKeyHex.replace(/[^0-9A-F]/gi, "").toUpperCase();
  const seg1 = cleanHex.substring(0, 4) || "8F3A";
  const seg2 = cleanHex.substring(4, 8) || "9B21";
  const seg3 = cleanHex.substring(8, 12) || "44E2";
  
  const ain = `ZENO-${seg1}-${seg2}-${seg3}`;
  const pairs = cleanHex.match(/.{1,2}/g) || [];
  const fingerprint = `SHA256:${pairs.slice(0, 8).join(":")}`;
  
  return { ain, fingerprint };
}

/**
 * 1. Generates a brand new 256-bit Cryptographic Identity
 * Prioritizes Native Rust Backend Core (P-256 with Zeroize).
 */
export async function generateCryptographicIdentity(): Promise<UserIdentity> {
  if (isTauriEnvironment()) {
    try {
      const rustIdentity = await invoke<UserIdentity>("crypto_generate_identity");
      console.log("[Zeno Crypto] Identity generated via Rust Backend Core:", rustIdentity.ain);
      return rustIdentity;
    } catch (e) {
      console.warn("[Zeno Crypto] Rust invocation failed, falling back to WebCrypto:", e);
    }
  }

  // Fallback to WebCrypto
  const keyPair = await window.crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );

  const exportedPubKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const pubKeyHex = bufferToHex(exportedPubKey);

  const exportedPrivKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const privKeyHex = bufferToHex(exportedPrivKey);

  const hashBuffer = await window.crypto.subtle.digest("SHA-256", exportedPubKey);
  const hashHex = bufferToHex(hashBuffer);

  const { ain, fingerprint } = deriveAinFromPublicKey(hashHex);

  return {
    ain,
    publicKeyHex: pubKeyHex,
    privateKeyEncryptedHex: privKeyHex,
    fingerprint,
    createdAt: new Date().toISOString()
  };
}

/**
 * Gets or creates the local User Cryptographic Identity from Storage
 */
export async function getOrRegisterUserIdentity(): Promise<UserIdentity> {
  const stored = localStorage.getItem("zeno_user_identity");
  if (stored) {
    try {
      return JSON.parse(stored) as UserIdentity;
    } catch (e) {
      console.error("Failed to parse stored user identity", e);
    }
  }

  const newIdentity = await generateCryptographicIdentity();
  localStorage.setItem("zeno_user_identity", JSON.stringify(newIdentity));
  return newIdentity;
}

/**
 * 2. Signs a Server Authentication Challenge Nonce
 * Prioritizes Native Rust Backend Core.
 */
export async function signAuthChallenge(nonce: string, privateKeyHex: string): Promise<string> {
  if (isTauriEnvironment()) {
    try {
      const sigHex = await invoke<string>("crypto_sign_challenge", {
        nonce,
        privateKeyHex
      });
      return sigHex;
    } catch (e) {
      console.warn("[Zeno Crypto] Rust sign_challenge failed, falling back to WebCrypto:", e);
    }
  }

  const enc = new TextEncoder();
  const data = enc.encode(nonce);
  const privKeyBytes = hexToBuffer(privateKeyHex);

  const key = await window.crypto.subtle.importKey(
    "pkcs8",
    privKeyBytes.buffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await window.crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    key,
    data
  );

  return bufferToHex(signature);
}

/**
 * 3. Verifies a Server Authentication Signature
 * Prioritizes Native Rust Backend Core.
 */
export async function verifyAuthSignature(
  nonce: string,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  if (isTauriEnvironment()) {
    try {
      return await invoke<boolean>("crypto_verify_signature", {
        nonce,
        signatureHex,
        publicKeyHex
      });
    } catch (e) {
      console.warn("[Zeno Crypto] Rust verify_signature failed, falling back to WebCrypto:", e);
    }
  }

  try {
    const enc = new TextEncoder();
    const data = enc.encode(nonce);
    const pubKeyBytes = hexToBuffer(publicKeyHex);
    const sigBytes = hexToBuffer(signatureHex);

    const key = await window.crypto.subtle.importKey(
      "spki",
      pubKeyBytes.buffer,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );

    return await window.crypto.subtle.verify(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      key,
      sigBytes,
      data
    );
  } catch (e) {
    console.error("Signature verification error:", e);
    return false;
  }
}

/**
 * 4. AES-256-GCM Local Data Encryption (Encryption-at-Rest)
 * Prioritizes Native Rust Backend Core.
 */
export async function encryptLocalVault(plaintext: string, passcode: string): Promise<EncryptedVaultBlob> {
  if (isTauriEnvironment()) {
    try {
      return await invoke<EncryptedVaultBlob>("crypto_encrypt_vault", {
        plaintext,
        passcode
      });
    } catch (e) {
      console.warn("[Zeno Crypto] Rust encrypt_vault failed, falling back to WebCrypto:", e);
    }
  }

  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passcode),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    enc.encode(plaintext)
  );

  return {
    ciphertextHex: bufferToHex(ciphertext),
    ivHex: bufferToHex(iv.buffer),
    saltHex: bufferToHex(salt.buffer),
    timestamp: new Date().toISOString()
  };
}

/**
 * 5. AES-256-GCM Local Data Decryption
 * Prioritizes Native Rust Backend Core.
 */
export async function decryptLocalVault(vault: EncryptedVaultBlob, passcode: string): Promise<string> {
  if (isTauriEnvironment()) {
    try {
      return await invoke<string>("crypto_decrypt_vault", {
        vault,
        passcode
      });
    } catch (e) {
      console.warn("[Zeno Crypto] Rust decrypt_vault failed, falling back to WebCrypto:", e);
    }
  }

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const ciphertextBytes = hexToBuffer(vault.ciphertextHex);
  const ivBytes = hexToBuffer(vault.ivHex);
  const saltBytes = hexToBuffer(vault.saltHex);

  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passcode),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    aesKey,
    ciphertextBytes
  );

  return dec.decode(decrypted);
}

/**
 * Generates a BIP-39 Sovereign 12-word cryptographic identity.
 * Powered by Rust backend (bip39 crate + P-256).
 */
export async function generateSovereignIdentity(): Promise<UserIdentity> {
  if (isTauriEnvironment()) {
    try {
      const rustIdentity = await invoke<UserIdentity>("crypto_generate_sovereign_identity");
      console.log("[Zeno Crypto] Sovereign identity generated via Rust:", rustIdentity.ain);
      return rustIdentity;
    } catch (e) {
      console.warn("[Zeno Crypto] Rust sovereign identity generation failed, falling back:", e);
    }
  }

  // Fallback to standard identity generator
  return generateCryptographicIdentity();
}

/**
 * Restores an identity deterministically from 12-word BIP-39 seed phrase.
 */
export async function importSovereignIdentity(words: string): Promise<UserIdentity> {
  if (isTauriEnvironment()) {
    try {
      const rustIdentity = await invoke<UserIdentity>("crypto_import_sovereign_identity", {
        words: words.trim()
      });
      console.log("[Zeno Crypto] Sovereign identity restored via Rust:", rustIdentity.ain);
      return rustIdentity;
    } catch (e) {
      console.error("[Zeno Crypto] Rust import_sovereign_identity error:", e);
      throw e;
    }
  }

  throw new Error("Sovereign Identity Import erfordert die native Rust-Laufzeitumgebung.");
}

/**
 * SQLite Identity Management (Persistent in zeno.db)
 */
export async function saveIdentityToDb(identity: DbIdentityRecord): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      await invoke("db_save_identity", { identity });
      return;
    } catch (e) {
      console.warn("[Zeno DB] Fehler beim Speichern der Identität in SQLite:", e);
    }
  }
  // LocalStorage fallback
  localStorage.setItem("zeno_user_identity", JSON.stringify(identity));
}

export async function getActiveIdentityFromDb(): Promise<DbIdentityRecord | null> {
  if (isTauriEnvironment()) {
    try {
      const res = await invoke<DbIdentityRecord | null>("db_get_active_identity");
      if (res) return res;
    } catch (e) {
      console.warn("[Zeno DB] Fehler beim Abrufen der aktiven Identität:", e);
    }
  }
  const stored = localStorage.getItem("zeno_user_identity");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        ain: parsed.ain,
        username: parsed.username || "CipherNaut",
        publicKeyHex: parsed.publicKeyHex,
        privateKeyEncryptedHex: parsed.privateKeyEncryptedHex,
        mnemonic: parsed.mnemonic,
        fingerprint: parsed.fingerprint,
        isActive: true,
        createdAt: parsed.createdAt || new Date().toISOString()
      };
    } catch (e) {
      return null;
    }
  }
  return null;
}

export async function getAllIdentitiesFromDb(): Promise<DbIdentityRecord[]> {
  if (isTauriEnvironment()) {
    try {
      return await invoke<DbIdentityRecord[]>("db_get_all_identities");
    } catch (e) {
      console.warn("[Zeno DB] Fehler beim Abrufen aller Identitäten:", e);
    }
  }
  const active = await getActiveIdentityFromDb();
  return active ? [active] : [];
}

export async function setActiveIdentityInDb(ain: string): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      await invoke("db_set_active_identity", { ain });
      return;
    } catch (e) {
      console.warn("[Zeno DB] Fehler beim Setzen der aktiven Identität:", e);
    }
  }
}

export async function deleteIdentityFromDb(ain: string): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      await invoke("db_delete_identity", { ain });
      return;
    } catch (e) {
      console.warn("[Zeno DB] Fehler beim Löschen der Identität:", e);
    }
  }
}

/**
 * Saves a text file directly to the user's Downloads or Desktop directory
 * via native Rust Tauri IPC, and reveals it in the File Explorer.
 * Falls back to standard HTML5 download in browser environments.
 */
export async function exportNativeTextFile(filename: string, content: string): Promise<string> {
  if (isTauriEnvironment()) {
    try {
      const savedPath = await invoke<string>("export_text_file", { filename, content });
      return savedPath;
    } catch (e) {
      console.warn("[Export] Nativer Export fehlgeschlagen, nutze Fallback:", e);
    }
  }

  // Fallback for Web/Browser
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return filename;
}
