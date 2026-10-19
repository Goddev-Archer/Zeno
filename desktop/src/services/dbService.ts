// --- ZENO SQLITE PERSISTENT DATABASE SERVICE ---
// Powered by Native Rust Backend Core (via Tauri rusqlite IPC).

import { invoke } from "@tauri-apps/api/core";
import { Server, Message } from "../types";
import { isTauriEnvironment } from "./cryptoService";

export interface DbServerRecord {
  id: string;
  name: string;
  iconLetter: string;
  icon?: string;
  description?: string;
  encrypted: boolean;
  ownerAin?: string;
  manifestUrl?: string;
  gitRepoJson?: string;
  categoriesJson: string;
  createdAt: string;
}

export interface DbMessageRecord {
  id?: number;
  channelId: string;
  author: string;
  text: string;
  time: string;
  color: string;
  code?: string;
  attachmentJson?: string;
  createdAt: string;
}

/**
 * Saves or updates a Server in the native Rust SQLite database, scoped to an account
 */
export async function saveServerToDb(server: Server, accountAin?: string): Promise<void> {
  if (!isTauriEnvironment()) return;

  try {
    const record: DbServerRecord = {
      id: server.id,
      name: server.name,
      iconLetter: server.iconLetter,
      icon: server.icon,
      description: server.description,
      encrypted: server.encrypted ?? true,
      ownerAin: server.ownerAin || accountAin,
      manifestUrl: server.manifestUrl,
      gitRepoJson: server.gitRepo ? JSON.stringify(server.gitRepo) : undefined,
      categoriesJson: JSON.stringify(server.categories || []),
      createdAt: new Date().toISOString()
    };

    await invoke("db_save_server", { server: record, accountAin: accountAin || server.ownerAin });
    console.log(`[Zeno SQLite] Server "${server.name}" für Account "${accountAin || server.ownerAin || 'global'}" in nativer DB gespeichert.`);
  } catch (e) {
    console.error("[Zeno SQLite] Fehler beim Speichern des Servers:", e);
  }
}

/**
 * Loads Servers for an account from the native Rust SQLite database
 */
export async function loadServersFromDb(accountAin?: string): Promise<Server[] | null> {
  if (!isTauriEnvironment()) return null;

  try {
    const records = await invoke<DbServerRecord[]>("db_get_servers", { accountAin });
    if (!records || records.length === 0) return null;

    return records.map((r) => ({
      id: r.id,
      name: r.name,
      iconLetter: r.iconLetter,
      icon: r.icon,
      description: r.description,
      unreadCount: 0,
      encrypted: r.encrypted,
      ownerAin: r.ownerAin,
      manifestUrl: r.manifestUrl,
      gitRepo: r.gitRepoJson ? JSON.parse(r.gitRepoJson) : undefined,
      categories: JSON.parse(r.categoriesJson || "[]")
    }));
  } catch (e) {
    console.error("[Zeno SQLite] Fehler beim Laden der Server:", e);
    return null;
  }
}

/**
 * Deletes a Server from the native Rust SQLite database for an account
 */
export async function deleteServerFromDb(serverId: string, accountAin?: string): Promise<void> {
  if (!isTauriEnvironment()) return;

  try {
    await invoke("db_delete_server", { serverId, accountAin });
    console.log(`[Zeno SQLite] Server "${serverId}" aus nativer DB gelöscht.`);
  } catch (e) {
    console.error("[Zeno SQLite] Fehler beim Löschen des Servers:", e);
  }
}

/**
 * Saves a Chat Message to the native Rust SQLite database
 */
export async function saveMessageToDb(channelId: string, message: Message): Promise<number | null> {
  if (!isTauriEnvironment()) return null;

  try {
    const record: DbMessageRecord = {
      channelId,
      author: message.author,
      text: message.text,
      time: message.time,
      color: message.color,
      code: message.code,
      attachmentJson: message.attachment ? JSON.stringify(message.attachment) : undefined,
      createdAt: new Date().toISOString()
    };

    const rowId = await invoke<number>("db_save_message", { message: record });
    return rowId;
  } catch (e) {
    console.error("[Zeno SQLite] Fehler beim Speichern der Nachricht:", e);
    return null;
  }
}

/**
 * Loads messages for a channel from the native Rust SQLite database
 */
export async function loadChannelMessagesFromDb(
  channelId: string,
  limit: number = 100,
  offset: number = 0
): Promise<Message[] | null> {
  if (!isTauriEnvironment()) return null;

  try {
    const records = await invoke<DbMessageRecord[]>("db_get_channel_messages", {
      channelId,
      limit,
      offset
    });

    if (!records) return null;

    return records
      .filter((r) => (r.text && r.text.trim().length > 0) || Boolean(r.code) || Boolean(r.attachmentJson))
      .map((r) => ({
        id: r.id ? String(r.id) : undefined,
        author: r.author,
        text: r.text,
        time: r.time,
        color: r.color,
        code: r.code,
        attachment: r.attachmentJson ? JSON.parse(r.attachmentJson) : undefined
      }));
  } catch (e) {
    console.error("[Zeno SQLite] Fehler beim Laden der Nachrichten:", e);
    return null;
  }
}

/**
 * Deletes a message from the SQLite database
 */
export async function deleteMessageFromDb(channelId: string, text: string): Promise<boolean> {
  if (!isTauriEnvironment()) return true;

  try {
    await invoke("db_delete_message", { channelId, text: text || "" });
    return true;
  } catch (e) {
    console.error("[Zeno SQLite] Fehler beim Löschen der Nachricht:", e);
    return false;
  }
}

/**
 * Deletes a message by its numeric primary key from the SQLite database
 */
export async function deleteMessageByIdFromDb(messageId: number): Promise<boolean> {
  if (!isTauriEnvironment()) return true;

  try {
    await invoke("db_delete_message_by_id", { messageId });
    return true;
  } catch (e) {
    console.error("[Zeno SQLite] Fehler beim Löschen der Nachricht per ID:", e);
    return false;
  }
}
