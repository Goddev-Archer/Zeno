// --- ZENO TYPINGS & INTERFACES ---

export interface Channel {
  id: string;
  name: string;
  type?: "text" | "voice" | "rules";
  active?: boolean;
  connectedUsers?: string[];
  syncFile?: string; // e.g. "README.md"
  rulesReadBy?: string[]; // AINs of users who confirmed reading the rules
  isEncrypted?: boolean;
}

export interface Category {
  name: string;
  type: "text" | "voice" | "rules";
  channels: Channel[];
}

export type RelayType = "cloudflare_worker" | "nostr" | "onion" | "custom_ws";

export interface RelayConfig {
  type: RelayType;
  url: string;
  name?: string;
  isTor?: boolean;
  pubKey?: string;
}

export interface WikiArticle {
  id: string;
  title: string;
  icon: string;
  badge: string;
  badgeColor: string;
  category: "Security & Crypto" | "Relays & Networking" | "Server & Git" | "Recht & Privatsphäre";
  summary: string;
  markdown: string;
}

export interface GitRepositoryConfig {
  provider: "github" | "gitlab" | "gitea" | "custom_git" | "none";
  repoUrl?: string;
  branch?: string;
  manifestPath?: string;
  rawManifestUrl?: string;
  localPath?: string;
  autoSync?: boolean;
}

export interface GitSyncResult {
  success: boolean;
  commitHash?: string;
  output: string;
  pushed: boolean;
}

export interface GitPullResult {
  success: boolean;
  updated: boolean;
  output: string;
  manifestContent?: string;
}

export interface GitServerRepoStatus {
  repoPath: string;
  branch: string;
  isClean: boolean;
  hasRemote: boolean;
  remoteUrl?: string;
  lastCommit?: string;
  manifestExists: boolean;
}

export interface ZenoServerManifest {
  version: string;
  serverId: string;
  name: string;
  description?: string;
  icon?: string;
  iconLetter?: string;
  encrypted: boolean;
  ownerAin?: string;
  createdAt: string;
  gitRepo?: GitRepositoryConfig;
  relays?: string[];
  categories: Category[];
}

export interface Server {
  id: string;
  name: string;
  iconLetter: string;
  icon?: string;
  description?: string;
  unreadCount?: number;
  categories: Category[];
  gitRepo?: GitRepositoryConfig;
  manifestUrl?: string;
  encrypted?: boolean;
  ownerAin?: string;
  relays?: string[];
  bannerGradient?: string;
  memberCount?: number;
  isOfficial?: boolean;
  protocol?: "P2P" | "WS" | "Relay" | "Packet Radio";
  tags?: string[];
  members?: Profile[];
  rulesReadBy?: string[];
}


export interface MessageAttachment {
  name: string;
  size: string;
  dataUrl?: string;
  type: string;
}

export interface Message {
  id?: string;
  author: string;
  text: string;
  time: string;
  timestamp?: number;
  color: string;
  code?: string;
  attachment?: MessageAttachment;
  isBoxed?: boolean;
  isRulesDoc?: boolean;
  syncFile?: string;
  rulesReadBy?: string[];
  isEncrypted?: boolean;
}

export interface SocialLink {
  platform: "github" | "steam" | "discord" | "twitter" | "spotify" | "custom";
  url: string;
  label?: string;
}

export interface TopGame {
  title: string;
  hoursPlayed?: string;
  icon?: string;
}

export interface Profile {
  id?: string;
  name: string;
  avatar: string;
  avatarColor: string;
  avatarImage?: string;
  avatarHoverEffect?: "none" | "float" | "spin" | "pulse" | "glow" | "bounce";
  avatarEffectFrame?: "none" | "cyber_ring" | "neon_pulse" | "golden_aura" | "fire_particles" | "galaxy_orbit";
  bgColor?: string;
  role: string;
  roleColor?: string;
  status?: string;
  fingerprint: string;
  bannerGradient?: string;
  badge?: string;
  badgePosition?: "badge-center" | "badge-right" | "badge-left";
  badgeBgColor?: string;
  badgeTextColor?: string;
  cardBgColor?: string;
  cardHoverEffect?: "none" | "rainbow_border" | "holographic_shimmer" | "cosmic_glow" | "neon_border";
  layoutOrder?: "standard" | "compact" | "avatar_left" | "banner_overlay";
  animationPreset?: "none" | "subtle_pulse" | "floating_card" | "neon_flicker" | "particle_shimmer";
  themePreset?: "default" | "cyberpunk" | "glassmorphism" | "synthwave" | "matrix" | "custom";
  customCss?: string;
  aboutMe?: string;
  socialLinks?: SocialLink[];
  topGames?: TopGame[];
}

export interface Toast {
  id: number;
  message: string;
}

export interface RecentFile {
  name: string;
  code: string;
  language: string;
}

export interface IdeFile {
  name: string;
  path: string;
  code: string;
  language: string;
  isFolder: boolean;
  children?: IdeFile[];
  size?: number;
  isOpen?: boolean;
}

export interface IdeEntry {
  name: string;
  path: string;
  isFolder: boolean;
  language: string;
  size?: number;
}

export interface IdeGitFileChange {
  path: string;
  status: "M" | "A" | "D" | "U" | "R" | string;
  isStaged: boolean;
}

export interface IdeWorkspaceGitStatus {
  isRepo: boolean;
  branch: string;
  staged: IdeGitFileChange[];
  unstaged: IdeGitFileChange[];
  ahead: number;
  behind: number;
}

export interface HubRuntimeItem {
  id: string;
  langKey: string;
  name: string;
  version: string;
  size: string;
  provider: "Zeno Community Index" | "WAPM Registry" | "Zeno Core" | "Custom WASM";
  providerIcon: string;
  badgeColor: string;
  description: string;
  tags: string[];
  sampleFile: string;
  sampleCode: string;
  icon: string;
}

export type WidgetType = "recent-files" | "git-status" | "weather" | "privacy-guard" | "custom";
export type WidgetColSpan = 1 | 2;
export type WidgetRowSpan = 1 | 2;

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  bgColor: string;
  colSpan: WidgetColSpan;
  rowSpan: WidgetRowSpan;
  order: number;
  customCode: string;
  gitMode?: "local" | "github";
  gitRepo?: string;
}

export interface LiveGitStatus {
  branch: string;
  uncommittedChanges: number;
  stagedFiles: string[];
}

export interface LiveGitCommit {
  hash: string;
  message: string;
  timeAgo: string;
  author: string;
}

export interface UserIdentity {
  ain: string;
  publicKeyHex: string;
  privateKeyEncryptedHex?: string;
  mnemonic?: string;
  fingerprint: string;
  createdAt: string;
}

export interface DbIdentityRecord {
  ain: string;
  username: string;
  publicKeyHex: string;
  privateKeyEncryptedHex?: string;
  mnemonic?: string;
  fingerprint: string;
  isActive: boolean;
  createdAt: string;
}

export interface EncryptedVaultBlob {
  ciphertextHex: string;
  ivHex: string;
  saltHex: string;
  timestamp: string;
}

export interface NativeExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  runner: string;
}

export interface SystemCompilersStatus {
  rustAvailable: boolean;
  rustVersion?: string;
  pythonAvailable: boolean;
  pythonVersion?: string;
  nodeAvailable: boolean;
  nodeVersion?: string;
  gitAvailable: boolean;
  gitVersion?: string;
  goAvailable: boolean;
  goVersion?: string;
}

// --- DIRECT MESSAGES (PEER-TO-PEER & BYOS) ---

export type DmDeliveryRoute = "p2p_direct" | "relay_envelope" | "byos_drop" | "local_cache";
export type DmMessageStatus = "queued" | "sending" | "delivered" | "read";
export type DmPeerConnectionStatus = "p2p_direct" | "relay" | "offline";

export interface DirectMessage {
  id: string;
  senderAin: string;
  recipientAin: string;
  content: string;
  time: string;
  timestamp: number;
  status: DmMessageStatus;
  deliveryRoute: DmDeliveryRoute;
  codeSnippet?: {
    language: string;
    code: string;
    title?: string;
  };
  attachment?: MessageAttachment;
}

export interface DmConversation {
  peerAin: string;
  peerName: string;
  peerAvatar?: string;
  peerStatusQuote?: string;
  connectionStatus: DmPeerConnectionStatus;
  pingMs?: number;
  unreadCount: number;
  lastMessage?: DirectMessage;
  isPopout?: boolean;
  isSelfChat?: boolean;
  selfChatTopic?: string;
}


