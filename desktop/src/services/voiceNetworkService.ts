// --- ZENO VOICE & RELAY NETWORK SERVICE ---
// Powered by Native Rust Backend Core (via Tauri IPC & Event System).

import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { isTauriEnvironment } from "./cryptoService";

export interface VoiceSessionStatus {
  isConnected: boolean;
  channelId?: string;
  channelName?: string;
  userName?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  inputLevel: number;
  activeSpeakers: string[];
  connectedUsers: string[];
  pingMs: number;
}

export interface VoiceSignalPayload {
  channelId: string;
  sender: string;
  target?: string;
  signalType: "offer" | "answer" | "ice_candidate" | "speaking" | "user_joined" | "user_left";
  data: string;
}

export interface NetworkChatMessage {
  channelId: string;
  author: string;
  text: string;
  color: string;
  time: string;
  code?: string;
}

/**
 * Joins a Voice Channel in the native Rust Voice State Machine
 */
export async function joinVoiceChannel(
  channelId: string,
  channelName: string,
  userName: string
): Promise<VoiceSessionStatus | null> {
  if (!isTauriEnvironment()) return null;

  try {
    return await invoke<VoiceSessionStatus>("voice_join", {
      channelId,
      channelName,
      userName
    });
  } catch (e) {
    console.error("[Zeno Voice] Fehler beim Beitreten des Sprachkanals:", e);
    return null;
  }
}

/**
 * Leaves the current Voice Channel in Rust
 */
export async function leaveVoiceChannel(): Promise<VoiceSessionStatus | null> {
  if (!isTauriEnvironment()) return null;

  try {
    return await invoke<VoiceSessionStatus>("voice_leave");
  } catch (e) {
    console.error("[Zeno Voice] Fehler beim Verlassen des Sprachkanals:", e);
    return null;
  }
}

/**
 * Toggles Mute state in Rust
 */
export async function setVoiceMute(muted: boolean): Promise<VoiceSessionStatus | null> {
  if (!isTauriEnvironment()) return null;

  try {
    return await invoke<VoiceSessionStatus>("voice_set_mute", { muted });
  } catch (e) {
    console.error("[Zeno Voice] Fehler beim Setzen von Mute:", e);
    return null;
  }
}

/**
 * Toggles Deafen state in Rust
 */
export async function setVoiceDeafen(deafened: boolean): Promise<VoiceSessionStatus | null> {
  if (!isTauriEnvironment()) return null;

  try {
    return await invoke<VoiceSessionStatus>("voice_set_deafen", { deafened });
  } catch (e) {
    console.error("[Zeno Voice] Fehler beim Setzen von Deafen:", e);
    return null;
  }
}

/**
 * Updates Speaking state and RMS audio volume in Rust
 */
export async function updateVoiceSpeaking(
  isSpeaking: boolean,
  inputLevel: number
): Promise<VoiceSessionStatus | null> {
  if (!isTauriEnvironment()) return null;

  try {
    return await invoke<VoiceSessionStatus>("voice_update_speaking", {
      isSpeaking,
      inputLevel
    });
  } catch (e) {
    console.error("[Zeno Voice] Fehler beim Aktualisieren des Sprech-Status:", e);
    return null;
  }
}

/**
 * Sends a WebRTC signaling payload via Rust relay
 */
export async function sendVoiceSignal(signal: VoiceSignalPayload): Promise<void> {
  if (!isTauriEnvironment()) return;

  try {
    await invoke("voice_send_signal", { signal });
  } catch (e) {
    console.error("[Zeno Voice] Fehler beim Senden des Voice-Signals:", e);
  }
}

/**
 * Gets the current Voice Session status from Rust
 */
export async function getVoiceStatus(): Promise<VoiceSessionStatus | null> {
  if (!isTauriEnvironment()) return null;

  try {
    return await invoke<VoiceSessionStatus>("voice_get_status");
  } catch (e) {
    console.error("[Zeno Voice] Fehler beim Abrufen des Voice-Status:", e);
    return null;
  }
}

/**
 * Broadcasts a message to the Rust Network Relay
 */
export async function broadcastNetworkMessage(
  channelId: string,
  author: string,
  text: string,
  color: string,
  time: string,
  code?: string
): Promise<void> {
  if (!isTauriEnvironment()) return;

  try {
    await invoke("network_broadcast_message", {
      channelId,
      author,
      text,
      color,
      time,
      code
    });
  } catch (e) {
    console.error("[Zeno Relay] Fehler beim Senden an das Relay:", e);
  }
}

/**
 * Subscribes to live Voice State updates from the Rust Backend
 */
export async function subscribeToVoiceState(
  callback: (status: VoiceSessionStatus) => void
): Promise<UnlistenFn | null> {
  if (!isTauriEnvironment()) return null;

  try {
    return await listen<VoiceSessionStatus>("zeno://voice_state_changed", (event) => {
      callback(event.payload);
    });
  } catch (e) {
    console.error("[Zeno Voice] Fehler beim Abonnieren des Voice-Events:", e);
    return null;
  }
}

/**
 * Subscribes to live WebRTC Voice Signals from other peers
 */
export async function subscribeToVoiceSignals(
  callback: (signal: VoiceSignalPayload) => void
): Promise<UnlistenFn | null> {
  if (!isTauriEnvironment()) return null;

  try {
    return await listen<VoiceSignalPayload>("zeno://voice_signal", (event) => {
      callback(event.payload);
    });
  } catch (e) {
    console.error("[Zeno Voice] Fehler beim Abonnieren des Voice-Signal-Events:", e);
    return null;
  }
}

/**
 * Subscribes to live incoming messages from the Rust Relay
 */
export async function subscribeToIncomingMessages(
  callback: (message: NetworkChatMessage) => void
): Promise<UnlistenFn | null> {
  if (!isTauriEnvironment()) return null;

  try {
    return await listen<NetworkChatMessage>("zeno://message_received", (event) => {
      callback(event.payload);
    });
  } catch (e) {
    console.error("[Zeno Relay] Fehler beim Abonnieren des Message-Events:", e);
    return null;
  }
}
