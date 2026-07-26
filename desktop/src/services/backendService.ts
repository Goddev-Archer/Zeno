// --- ZENO ZERO-KNOWLEDGE BACKEND AUTH & VAULT SYNC SERVICE ---
// Simulates / connects to Zeno Zero-Knowledge Backend API endpoints
// Implements Challenge-Response Authentication and Encrypted Profile Vault Sync.

import { UserIdentity, EncryptedVaultBlob } from "../types";
import { signAuthChallenge, verifyAuthSignature, encryptLocalVault } from "./cryptoService";

export interface AuthChallengeResponse {
  nonce: string;
  expiresAt: string;
}

export interface AuthVerifyResponse {
  success: boolean;
  sessionToken?: string;
  ain?: string;
  message: string;
}

export interface BackendVaultStore {
  [ain: string]: {
    publicKeyHex: string;
    encryptedVault?: EncryptedVaultBlob;
    updatedAt: string;
  };
}

// In-Memory / LocalStorage Mock DB for Server Persistence Simulation
const SERVER_STORAGE_KEY = "zeno_server_vault_db";

function getMockServerDb(): BackendVaultStore {
  const data = localStorage.getItem(SERVER_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse server DB", e);
    }
  }
  return {};
}

function saveMockServerDb(db: BackendVaultStore) {
  localStorage.setItem(SERVER_STORAGE_KEY, JSON.stringify(db));
}

// Active Active Nonces Memory
const activeNonces: Map<string, { nonce: string; expiresAt: number }> = new Map();

/**
 * 1. POST /api/v1/auth/challenge
 * Server issues a cryptographically random timestamped nonce challenge for the AIN
 */
export async function requestAuthChallenge(ain: string, publicKeyHex: string): Promise<AuthChallengeResponse> {
  const nonce = `ZENO-CHALLENGE-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
  const expiresAtMs = Date.now() + 5 * 60 * 1000; // 5 minute expiry

  activeNonces.set(ain, { nonce, expiresAt: expiresAtMs });

  // Register public key on server if new
  const db = getMockServerDb();
  if (!db[ain]) {
    db[ain] = {
      publicKeyHex,
      updatedAt: new Date().toISOString()
    };
    saveMockServerDb(db);
  }

  return {
    nonce,
    expiresAt: new Date(expiresAtMs).toISOString()
  };
}

/**
 * 2. POST /api/v1/auth/verify
 * Server verifies signature mathematically. If valid, issues Zero-Knowledge Session Token
 */
export async function verifyAuthChallenge(
  ain: string,
  publicKeyHex: string,
  nonce: string,
  signatureHex: string
): Promise<AuthVerifyResponse> {
  const activeNonce = activeNonces.get(ain);
  if (!activeNonce || activeNonce.nonce !== nonce) {
    return { success: false, message: "Ungültige oder abgelaufene Challenge." };
  }

  if (Date.now() > activeNonce.expiresAt) {
    activeNonces.delete(ain);
    return { success: false, message: "Challenge-Zeitfenster abgelaufen." };
  }

  // Mathematically verify signature
  const isValid = await verifyAuthSignature(nonce, signatureHex, publicKeyHex);

  if (!isValid) {
    return { success: false, message: "Kryptografische Signatur ist ungültig!" };
  }

  // Consume Nonce
  activeNonces.delete(ain);

  // Issue Zero-Knowledge Session Token
  const sessionToken = `ZENO-ZK-SESSION-${btoa(ain).substring(0, 16)}-${Date.now()}`;

  return {
    success: true,
    sessionToken,
    ain,
    message: "Zero-Knowledge Authentifizierung erfolgreich!"
  };
}

/**
 * 3. Full One-Click Zero-Knowledge Authentication Flow
 */
export async function executeZeroKnowledgeAuth(identity: UserIdentity): Promise<AuthVerifyResponse> {
  // Step A: Request Nonce
  const challenge = await requestAuthChallenge(identity.ain, identity.publicKeyHex);

  if (!identity.privateKeyEncryptedHex) {
    return { success: false, message: "Privater Schlüssel nicht lokal verfügbar." };
  }

  // Step B: Sign Nonce Locally
  const signatureHex = await signAuthChallenge(challenge.nonce, identity.privateKeyEncryptedHex);

  // Step C: Send Signature to Server & Verify
  return await verifyAuthChallenge(identity.ain, identity.publicKeyHex, challenge.nonce, signatureHex);
}

/**
 * 4. Sync Encrypted Profile Vault to Zero-Knowledge Backend
 */
export async function syncEncryptedVaultToServer(
  ain: string,
  sessionToken: string,
  profileDataJson: string,
  secretPasscode: string
): Promise<{ success: boolean; message: string }> {
  if (!sessionToken || !sessionToken.startsWith("ZENO-ZK-SESSION")) {
    return { success: false, message: "Keine gültige Server-Sitzung. Bitte erst authentifizieren." };
  }

  // Encrypt Vault locally with AES-256-GCM before sending
  const encryptedVault = await encryptLocalVault(profileDataJson, secretPasscode);

  const db = getMockServerDb();
  if (db[ain]) {
    db[ain].encryptedVault = encryptedVault;
    db[ain].updatedAt = new Date().toISOString();
    saveMockServerDb(db);
    return { success: true, message: "Verschlüsseltes Profil-Vault erfolgreich auf Server gespeichert! ☁️" };
  }

  return { success: false, message: "Account nicht auf Server gefunden." };
}

/**
 * 5. Fetch Encrypted Profile Vault from Server
 */
export async function fetchEncryptedVaultFromServer(
  ain: string,
  sessionToken: string
): Promise<{ success: boolean; vault?: EncryptedVaultBlob; message: string }> {
  if (!sessionToken || !sessionToken.startsWith("ZENO-ZK-SESSION")) {
    return { success: false, message: "Ungültige Server-Sitzung." };
  }

  const db = getMockServerDb();
  const entry = db[ain];

  if (entry && entry.encryptedVault) {
    return {
      success: true,
      vault: entry.encryptedVault,
      message: "Verschlüsseltes Vault vom Server geladen."
    };
  }

  return { success: false, message: "Kein Vault auf Server vorhanden." };
}
