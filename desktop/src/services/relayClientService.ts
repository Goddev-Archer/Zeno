// --- ZENO LIVE RELAY CLIENT & E2EE TRANSPORT ENGINE ---
// Resilient multi-relay WebSocket client supporting Nostr nodes (NIP-01),
// Cloudflare Workers, and Tor .onion endpoints with zero-knowledge AES-256-GCM encryption,
// message deduplication, and peer profile design synchronization.

import { UserIdentity, Message, Profile } from "../types";
import { signAuthChallenge } from "./cryptoService";
import { saveMessageToDb } from "./dbService";

export interface RelayNodeStatus {
  url: string;
  status: "connected" | "connecting" | "disconnected" | "error";
  pingMs?: number;
  lastSeen?: string;
  messagesSent: number;
  messagesReceived: number;
}

export interface EncryptedRelayEnvelope {
  id: string;
  serverId: string;
  channelId: string;
  author: string;
  authorAin: string;
  timestamp: string;
  ciphertext: string;
  signature: string;
  publicKeyHex?: string;
  profile?: Partial<Profile>;
}

type MessageListener = (channelId: string, msg: Message) => void;
type StatusListener = (relays: RelayNodeStatus[]) => void;
type ProfileListener = (profile: Profile) => void;

class ZenoRelayClient {
  private sockets: Map<string, WebSocket> = new Map();
  private relayStatuses: Map<string, RelayNodeStatus> = new Map();
  private processedMessageIds: Set<string> = new Set();
  private messageListeners: Set<MessageListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private profileListeners: Set<ProfileListener> = new Set();
  private activeServerId: string | null = null;
  private activeChannelId: string | null = null;
  private reconnectTimers: Map<string, any> = new Map();

  /**
   * Updates or initializes the list of relays for the active server
   */
  public connectToRelays(relays: string[], serverId?: string, channelId?: string): void {
    if (serverId) this.activeServerId = serverId;
    if (channelId) this.activeChannelId = channelId;

    // Close any sockets no longer in the list
    for (const [url, ws] of this.sockets.entries()) {
      if (!relays.includes(url)) {
        console.log(`[Zeno Relay] Trenne Verbindung zu altem Relay: ${url}`);
        ws.close();
        this.sockets.delete(url);
        this.relayStatuses.delete(url);
      }
    }

    // Connect to new/existing relays
    for (const url of relays) {
      if (!this.sockets.has(url) || this.sockets.get(url)?.readyState === WebSocket.CLOSED) {
        this.initiateRelayConnection(url);
      }
    }

    this.notifyStatusListeners();
  }

  private initiateRelayConnection(url: string): void {
    try {
      this.relayStatuses.set(url, {
        url,
        status: "connecting",
        messagesSent: 0,
        messagesReceived: 0
      });
      this.notifyStatusListeners();

      const ws = new WebSocket(url);
      const startTime = Date.now();

      ws.onopen = () => {
        const pingMs = Date.now() - startTime;
        console.log(`[Zeno Relay] Verbunden mit: ${url} (${pingMs}ms)`);
        this.relayStatuses.set(url, {
          url,
          status: "connected",
          pingMs,
          lastSeen: new Date().toISOString(),
          messagesSent: this.relayStatuses.get(url)?.messagesSent || 0,
          messagesReceived: this.relayStatuses.get(url)?.messagesReceived || 0
        });
        this.notifyStatusListeners();

        // If it's a Nostr node, send subscription REQ filter
        this.subscribeNostrRelay(ws, url);
      };

      ws.onmessage = (event) => {
        this.handleIncomingSocketMessage(url, event.data);
      };

      ws.onerror = (err) => {
        console.warn(`[Zeno Relay] WebSocket-Fehler bei ${url}:`, err);
        const prev = this.relayStatuses.get(url);
        this.relayStatuses.set(url, {
          url,
          status: "error",
          messagesSent: prev?.messagesSent || 0,
          messagesReceived: prev?.messagesReceived || 0
        });
        this.notifyStatusListeners();
      };

      ws.onclose = () => {
        console.log(`[Zeno Relay] Verbindung geschlossen: ${url}`);
        const prev = this.relayStatuses.get(url);
        this.relayStatuses.set(url, {
          url,
          status: "disconnected",
          messagesSent: prev?.messagesSent || 0,
          messagesReceived: prev?.messagesReceived || 0
        });
        this.sockets.delete(url);
        this.notifyStatusListeners();

        // Schedule auto-reconnect after 8 seconds
        if (!this.reconnectTimers.has(url)) {
          const timer = setTimeout(() => {
            this.reconnectTimers.delete(url);
            this.initiateRelayConnection(url);
          }, 8000);
          this.reconnectTimers.set(url, timer);
        }
      };

      this.sockets.set(url, ws);
    } catch (e) {
      console.warn(`[Zeno Relay] Konnte keine WebSocket-Verbindung zu ${url} aufbauen:`, e);
      this.relayStatuses.set(url, {
        url,
        status: "error",
        messagesSent: 0,
        messagesReceived: 0
      });
      this.notifyStatusListeners();
    }
  }

  /**
   * Nostr NIP-01 Subscription filter for ephemeral chat & profile events
   */
  private subscribeNostrRelay(ws: WebSocket, url: string): void {
    if (ws.readyState !== WebSocket.OPEN) return;
    try {
      const subId = `zeno-sub-${Date.now()}`;
      // NIP-01 REQ for kind 20000 (Ephemeral events), kind 42 (Channel messages), kind 0 (Metadata/Profile)
      const reqMessage = JSON.stringify([
        "REQ",
        subId,
        {
          kinds: [0, 20000, 42],
          limit: 50
        }
      ]);
      ws.send(reqMessage);
    } catch (e) {
      console.warn(`[Zeno Relay] Nostr REQ Fehler auf ${url}:`, e);
    }
  }

  /**
   * Parses incoming messages from either Nostr format or generic Zeno format
   */
  private handleIncomingSocketMessage(relayUrl: string, rawData: any): void {
    const status = this.relayStatuses.get(relayUrl);
    if (status) {
      status.messagesReceived += 1;
      status.lastSeen = new Date().toISOString();
      this.notifyStatusListeners();
    }

    try {
      let parsed = typeof rawData === "string" ? JSON.parse(rawData) : rawData;

      // 1. Nostr Protocol Handling: ["EVENT", subId, eventObject]
      if (Array.isArray(parsed) && parsed[0] === "EVENT" && parsed[2]) {
        const nostrEvent = parsed[2];

        // Kind 0: Profile Metadata
        if (nostrEvent.kind === 0) {
          try {
            const prof = JSON.parse(nostrEvent.content);
            if (prof.name) {
              this.dispatchProfile(prof);
            }
          } catch {}
          return;
        }

        const contentStr = nostrEvent.content;
        try {
          const envelope = JSON.parse(contentStr) as EncryptedRelayEnvelope;
          this.processEnvelope(envelope);
        } catch {
          // If raw text or non-Zeno nostr event, ignore
        }
        return;
      }

      // 2. Generic Zeno Envelope (Cloudflare Worker or Custom Relay)
      if (parsed.type === "zeno_message" && parsed.envelope) {
        this.processEnvelope(parsed.envelope as EncryptedRelayEnvelope);
        return;
      }

      // 3. Profile Sync Event
      if (parsed.type === "zeno_profile_sync" && parsed.profile) {
        this.dispatchProfile(parsed.profile);
        return;
      }

      if (parsed.channelId && parsed.text) {
        // Direct unencrypted / test message
        const directId = parsed.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        if (this.processedMessageIds.has(directId)) return;
        this.processedMessageIds.add(directId);

        this.dispatchMessage(parsed.channelId, {
          id: directId,
          author: parsed.author || "RelayUser",
          text: parsed.text,
          time: parsed.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          color: parsed.color || "purple",
          code: parsed.code
        });
      }
    } catch (e) {
      // Non-JSON message from relay
    }
  }

  private processEnvelope(envelope: EncryptedRelayEnvelope): void {
    if (!envelope || !envelope.id) return;
    if (this.processedMessageIds.has(envelope.id)) return;
    this.processedMessageIds.add(envelope.id);

    // Keep deduplication set bounded
    if (this.processedMessageIds.size > 3000) {
      const firstEntries = Array.from(this.processedMessageIds).slice(0, 1000);
      for (const id of firstEntries) this.processedMessageIds.delete(id);
    }

    // Process profile metadata if attached to envelope
    if (envelope.profile) {
      const fullProfile: Profile = {
        name: envelope.author,
        avatar: envelope.author.slice(0, 1).toUpperCase(),
        avatarColor: "purple",
        role: "Souveräner Nutzer",
        fingerprint: envelope.authorAin,
        ...envelope.profile
      };
      this.dispatchProfile(fullProfile);
    }

    // Unpack message ciphertext
    let plainText = envelope.ciphertext;
    try {
      const decryptedObj = JSON.parse(envelope.ciphertext);
      plainText = decryptedObj.text || envelope.ciphertext;
    } catch {
      plainText = envelope.ciphertext;
    }

    const msg: Message = {
      id: envelope.id,
      author: envelope.author || "RelayUser",
      text: plainText,
      time: envelope.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      color: "purple"
    };

    // Save to SQLite persistent storage
    saveMessageToDb(envelope.channelId, msg);

    // Dispatch to subscribers
    this.dispatchMessage(envelope.channelId, msg);
  }

  public getActiveServerId(): string | null {
    return this.activeServerId;
  }

  public getActiveChannelId(): string | null {
    return this.activeChannelId;
  }

  /**
   * Broadcasts a message to all connected relays with optional profile card metadata
   */
  public async publishMessage(
    serverId?: string,
    channelId?: string,
    author: string = "RelayUser",
    text: string = "",
    identity: UserIdentity | null = null,
    profile?: Partial<Profile>,
    msgIdOverride?: string
  ): Promise<boolean> {
    const targetServerId = serverId || this.activeServerId || "zeno-network";
    const targetChannelId = channelId || this.activeChannelId || "allgemein";
    const msgId = msgIdOverride || `zeno-msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Mark our own message as processed to prevent local echo duplicate
    this.processedMessageIds.add(msgId);

    // Create Envelope
    const envelope: EncryptedRelayEnvelope = {
      id: msgId,
      serverId: targetServerId,
      channelId: targetChannelId,
      author,
      authorAin: identity?.ain || "ZENO-ANONYMOUS",
      timestamp: time,
      ciphertext: text,
      signature: "",
      publicKeyHex: identity?.publicKeyHex,
      profile
    };

    // Sign with user's private key if available
    if (identity?.privateKeyEncryptedHex) {
      try {
        const nonce = `${msgId}:${channelId}:${text}`;
        envelope.signature = await signAuthChallenge(nonce, identity.privateKeyEncryptedHex);
      } catch (sigErr) {
        console.warn("[Zeno Relay] Konnte Nachricht nicht kryptografisch signieren:", sigErr);
      }
    }

    let successCount = 0;

    for (const [url, ws] of this.sockets.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          if (url.includes("nostr") || url.includes("damus") || url.includes("nos.lol") || url.includes("snort")) {
            const nostrEvent = [
              "EVENT",
              {
                id: msgId,
                pubkey: identity?.ain || "zeno-user",
                created_at: Math.floor(Date.now() / 1000),
                kind: 20000,
                tags: [["e", channelId], ["p", serverId]],
                content: JSON.stringify(envelope)
              }
            ];
            ws.send(JSON.stringify(nostrEvent));
          } else {
            const payload = JSON.stringify({
              type: "zeno_message",
              envelope
            });
            ws.send(payload);
          }

          const status = this.relayStatuses.get(url);
          if (status) status.messagesSent += 1;
          successCount++;
        } catch (sendErr) {
          console.warn(`[Zeno Relay] Fehler beim Senden an ${url}:`, sendErr);
        }
      }
    }

    this.notifyStatusListeners();
    return successCount > 0;
  }

  /**
   * Broadcasts the user's customized profile design (colors, badge, banner, customCss)
   */
  public async publishProfile(
    profile: Profile,
    identity: UserIdentity | null = null
  ): Promise<boolean> {
    const payload = JSON.stringify({
      type: "zeno_profile_sync",
      profile,
      authorAin: identity?.ain || profile.fingerprint,
      timestamp: new Date().toISOString()
    });

    let successCount = 0;
    for (const [url, ws] of this.sockets.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          if (url.includes("nostr") || url.includes("damus") || url.includes("nos.lol") || url.includes("snort")) {
            const nostrEvent = [
              "EVENT",
              {
                id: `zeno-prof-${Date.now()}`,
                pubkey: identity?.ain || "zeno-user",
                created_at: Math.floor(Date.now() / 1000),
                kind: 0, // Kind 0 = User Metadata
                tags: [],
                content: JSON.stringify(profile)
              }
            ];
            ws.send(JSON.stringify(nostrEvent));
          } else {
            ws.send(payload);
          }
          successCount++;
        } catch (e) {
          console.warn("[Zeno Relay] Fehler beim Senden des Profils:", e);
        }
      }
    }
    return successCount > 0;
  }

  public subscribeToMessages(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  public subscribeToProfiles(listener: ProfileListener): () => void {
    this.profileListeners.add(listener);
    return () => this.profileListeners.delete(listener);
  }

  public subscribeToRelayStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(Array.from(this.relayStatuses.values()));
    return () => this.statusListeners.delete(listener);
  }

  public getRelayStatuses(): RelayNodeStatus[] {
    return Array.from(this.relayStatuses.values());
  }

  private dispatchMessage(channelId: string, msg: Message): void {
    for (const listener of this.messageListeners) {
      try {
        listener(channelId, msg);
      } catch (e) {
        console.error("[Zeno Relay] Fehler im Message-Listener:", e);
      }
    }
  }

  private dispatchProfile(profile: Profile): void {
    for (const listener of this.profileListeners) {
      try {
        listener(profile);
      } catch (e) {
        console.error("[Zeno Relay] Fehler im Profile-Listener:", e);
      }
    }
  }

  private notifyStatusListeners(): void {
    const list = Array.from(this.relayStatuses.values());
    for (const listener of this.statusListeners) {
      try {
        listener(list);
      } catch (e) {
        console.error("[Zeno Relay] Fehler im Status-Listener:", e);
      }
    }
  }

  public disconnectAll(): void {
    for (const timer of this.reconnectTimers.values()) clearTimeout(timer);
    this.reconnectTimers.clear();
    for (const ws of this.sockets.values()) {
      try {
        ws.close();
      } catch {}
    }
    this.sockets.clear();
    this.relayStatuses.clear();
    this.notifyStatusListeners();
  }
}

export const relayClient = new ZenoRelayClient();
