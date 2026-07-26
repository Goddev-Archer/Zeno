// --- ZENO TYPINGS & INTERFACES ---

export interface Channel {
  id: string;
  name: string;
  active?: boolean;
  connectedUsers?: string[];
}

export interface Category {
  name: string;
  type: "text" | "voice";
  channels: Channel[];
}

export interface Server {
  id: string;
  name: string;
  iconLetter: string;
  categories: Category[];
}

export interface MessageAttachment {
  name: string;
  size: string;
  dataUrl?: string;
  type: string;
}

export interface Message {
  author: string;
  text: string;
  time: string;
  color: string;
  code?: string;
  attachment?: MessageAttachment;
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
