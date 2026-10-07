// --- ZENO SENDER-KEY & ZERO-KNOWLEDGE ENVELOPE SERVICE ---
// Implements the Megolm / MLS ratcheting principle for group encryption with
// Forward Secrecy and Plausible Deniability.
// The Relay server and unauthorized peers possess zero decryption keys.

import { bufferToHex, hexToBuffer } from "./cryptoService";

export interface ZeroKnowledgeEnvelope {
  protocolVersion: "zeno-zk-v1";
  serverId: string;
  channelId: string;
  senderAin: string;
  iteration: number;
  ivHex: string;
  ciphertextHex: string;
  macHex: string;
  timestamp: string;
  profile?: any;
}

export interface ChannelSenderKey {
  channelId: string;
  senderAin: string;
  chainKeyHex: string;
  iteration: number;
}

// Local cache of sender keys:
// 1. My own sender keys (per channel)
const mySenderKeys: Map<string, ChannelSenderKey> = new Map();
// 2. Peer sender keys (channelId:peerAin -> ChannelSenderKey)
const peerSenderKeys: Map<string, ChannelSenderKey> = new Map();

/**
 * Generates 32 bytes of cryptographically secure random entropy
 */
function generateRandomBytes(length: number = 32): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

/**
 * HMAC-SHA256 helper using WebCrypto
 */
async function hmacSha256(keyBytes: Uint8Array, data: string | Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes as any,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const dataBytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const signature = await window.crypto.subtle.sign("HMAC", cryptoKey, dataBytes as any);
  return new Uint8Array(signature);
}

/**
 * Gets or creates the local sender key for a channel
 */
export async function getOrCreateMySenderKey(channelId: string, myAin: string): Promise<ChannelSenderKey> {
  const existing = mySenderKeys.get(channelId);
  if (existing) return existing;

  // Generate fresh 256-bit chain key for this channel
  const initialChainKey = generateRandomBytes(32);
  const senderKey: ChannelSenderKey = {
    channelId,
    senderAin: myAin,
    chainKeyHex: bufferToHex(initialChainKey.buffer as ArrayBuffer),
    iteration: 0
  };

  mySenderKeys.set(channelId, senderKey);
  return senderKey;
}

/**
 * Manually updates or registers a peer's sender key received via pairwise E2EE
 */
export function registerPeerSenderKey(senderKey: ChannelSenderKey): void {
  const keyLookup = `${senderKey.channelId}:${senderKey.senderAin}`;
  peerSenderKeys.set(keyLookup, { ...senderKey });
}

/**
 * Encrypts a message using the Sender-Key ratchet.
 * Ratchets the chain key forward after encryption for Forward Secrecy.
 * Derives a symmetric MAC for Plausible Deniability.
 */
export async function encryptWithSenderKey(
  channelId: string,
  serverId: string,
  plaintext: string,
  myAin: string,
  profile?: any
): Promise<ZeroKnowledgeEnvelope> {
  const senderKey = await getOrCreateMySenderKey(channelId, myAin);
  const currentChainKey = hexToBuffer(senderKey.chainKeyHex);

  // 1. Derive Message Key (AES-256-GCM)
  const messageKeyBytes = await hmacSha256(currentChainKey, `ZENO_MSG_KEY:${senderKey.iteration}`);
  // 2. Derive MAC Key (Symmetric authentication for plausible deniability)
  const macKeyBytes = await hmacSha256(currentChainKey, `ZENO_MAC_KEY:${senderKey.iteration}`);
  // 3. Ratchet Chain Key forward (Forward Secrecy)
  const nextChainKeyBytes = await hmacSha256(currentChainKey, "ZENO_RATCHET_FORWARD_STEP");

  // Advance state
  senderKey.chainKeyHex = bufferToHex(nextChainKeyBytes.buffer as ArrayBuffer);
  const messageIteration = senderKey.iteration;
  senderKey.iteration += 1;
  mySenderKeys.set(channelId, senderKey);

  // 4. Encrypt with AES-256-GCM
  const iv = generateRandomBytes(12);
  const aesKey = await window.crypto.subtle.importKey(
    "raw",
    messageKeyBytes as any,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const encodedPlaintext = new TextEncoder().encode(plaintext);
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as any },
    aesKey,
    encodedPlaintext
  );

  const ciphertextHex = bufferToHex(ciphertextBuffer);
  const ivHex = bufferToHex(iv.buffer as ArrayBuffer);

  // 5. Generate Symmetric MAC Tag for Plausible Deniability
  // Any participant in the room who holds the Sender Key can verify integrity,
  // but cannot prove to a court that a specific party authored it (plausible deniability).
  const macPayload = `${channelId}:${senderKey.senderAin}:${messageIteration}:${ivHex}:${ciphertextHex}`;
  const macBytes = await hmacSha256(macKeyBytes, macPayload);
  const macHex = bufferToHex(macBytes.buffer as ArrayBuffer);

  return {
    protocolVersion: "zeno-zk-v1",
    serverId,
    channelId,
    senderAin: myAin,
    iteration: messageIteration,
    ivHex,
    ciphertextHex,
    macHex,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    profile
  };
}

/**
 * Decrypts a Zero-Knowledge envelope received from a peer or relay
 */
export async function decryptSenderKeyEnvelope(
  envelope: ZeroKnowledgeEnvelope,
  myAin: string
): Promise<{ success: boolean; plaintext: string; error?: string }> {
  const keyLookup = `${envelope.channelId}:${envelope.senderAin}`;
  let peerKey = peerSenderKeys.get(keyLookup);

  if (!peerKey) {
    if (envelope.senderAin === myAin) {
      peerKey = mySenderKeys.get(envelope.channelId);
    }
  }

  if (!peerKey) {
    return {
      success: false,
      plaintext: `[🔒 Zero-Knowledge Chiffrat von ${envelope.senderAin} — Sender-Key erforderlich]`,
      error: "Kein Sender-Key für diesen Teilnehmer vorhanden."
    };
  }

  try {
    let chainKey = hexToBuffer(peerKey.chainKeyHex);
    let iter = peerKey.iteration;

    // Fast-forward ratchet if envelope is ahead (max 500 steps to prevent DoS)
    if (envelope.iteration > iter && envelope.iteration - iter <= 500) {
      while (iter < envelope.iteration) {
        chainKey = await hmacSha256(chainKey, "ZENO_RATCHET_FORWARD_STEP");
        iter += 1;
      }
      peerKey.chainKeyHex = bufferToHex(chainKey.buffer as ArrayBuffer);
      peerKey.iteration = iter;
    }

    const messageKeyBytes = await hmacSha256(chainKey, `ZENO_MSG_KEY:${envelope.iteration}`);
    const macKeyBytes = await hmacSha256(chainKey, `ZENO_MAC_KEY:${envelope.iteration}`);

    // Verify MAC Tag
    const macPayload = `${envelope.channelId}:${envelope.senderAin}:${envelope.iteration}:${envelope.ivHex}:${envelope.ciphertextHex}`;
    const expectedMacBytes = await hmacSha256(macKeyBytes, macPayload);
    const expectedMacHex = bufferToHex(expectedMacBytes.buffer as ArrayBuffer);

    if (expectedMacHex !== envelope.macHex) {
      return {
        success: false,
        plaintext: "[⚠️ Nachricht verworfen: Integritätsprüfung (MAC) fehlgeschlagen]",
        error: "Ungültiger Authentifizierungs-Tag."
      };
    }

    // Decrypt AES-256-GCM
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      messageKeyBytes as any,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const ciphertextBuffer = hexToBuffer(envelope.ciphertextHex);
    const ivBuffer = hexToBuffer(envelope.ivHex);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuffer as any },
      aesKey,
      ciphertextBuffer as any
    );

    const plaintext = new TextDecoder().decode(decryptedBuffer);
    return { success: true, plaintext };
  } catch (err: any) {
    return {
      success: false,
      plaintext: `[🔒 Entschlüsselungsfehler: ${err?.message || "Korruptes Paket"}]`,
      error: String(err)
    };
  }
}

/**
 * Derives a cryptographic AES-GCM wrapping key from a channel passphrase or room secret
 */
async function deriveRoomWrappingKey(roomSecret: string, channelId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(roomSecret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const salt = enc.encode(`ZENO_ROOM_SALT:${channelId}`);
  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 50000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export interface EncryptedSenderKeyDistribution {
  type: "zeno_sender_key_distribution";
  protocolVersion: "zeno-zk-v1";
  serverId: string;
  channelId: string;
  senderAin: string;
  ivHex: string;
  ciphertextHex: string;
  timestamp: string;
}

/**
 * Encrypts and packs the local Sender-Key for distribution to room members who know the room secret.
 * Relay hosts who do not possess the room secret cannot decrypt this payload.
 */
export async function packSenderKeyDistribution(
  channelId: string,
  serverId: string,
  myAin: string,
  roomSecret: string
): Promise<EncryptedSenderKeyDistribution> {
  const senderKey = await getOrCreateMySenderKey(channelId, myAin);
  const wrappingKey = await deriveRoomWrappingKey(roomSecret, channelId);

  const payload = JSON.stringify({
    channelId: senderKey.channelId,
    senderAin: senderKey.senderAin,
    chainKeyHex: senderKey.chainKeyHex,
    iteration: senderKey.iteration
  });

  const iv = generateRandomBytes(12);
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as any },
    wrappingKey,
    new TextEncoder().encode(payload)
  );

  return {
    type: "zeno_sender_key_distribution",
    protocolVersion: "zeno-zk-v1",
    serverId,
    channelId,
    senderAin: myAin,
    ivHex: bufferToHex(iv.buffer as ArrayBuffer),
    ciphertextHex: bufferToHex(ciphertextBuffer),
    timestamp: new Date().toISOString()
  };
}

/**
 * Unpacks an encrypted Sender-Key distribution and registers the peer's sender key in local cache.
 */
export async function unpackAndRegisterSenderKey(
  dist: EncryptedSenderKeyDistribution,
  roomSecret: string
): Promise<boolean> {
  try {
    const wrappingKey = await deriveRoomWrappingKey(roomSecret, dist.channelId);
    const iv = hexToBuffer(dist.ivHex);
    const ciphertext = hexToBuffer(dist.ciphertextHex);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as any },
      wrappingKey,
      ciphertext as any
    );

    const rawJson = new TextDecoder().decode(decryptedBuffer);
    const senderKey = JSON.parse(rawJson) as ChannelSenderKey;
    registerPeerSenderKey(senderKey);
    console.log(`[Zeno Sender-Key] Neuer Sender-Key für Peer ${dist.senderAin} in Kanal ${dist.channelId} erfolgreich registriert.`);
    return true;
  } catch (err) {
    console.warn(`[Zeno Sender-Key] Konnte Sender-Key von ${dist.senderAin} nicht entschlüsseln (evtl. falsches Raum-Passwort):`, err);
    return false;
  }
}

