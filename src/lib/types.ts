// --- Profile ---

export type HeaderMode = 'AVATAR' | 'HERO' | 'AVATAR_HERO';
export type HeroPosition = 'center' | 'top';
export type MainLinksLayout =
  | 'LIST_ICON'
  | 'GRID_ICON'
  | 'GRID_IMAGE'
  | 'LIST_IMAGE';

export interface Profile {
  id: string;
  owner_id: string;
  handle: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  hero_url: string | null;
  hero_position: HeroPosition;
  header_mode: HeaderMode;
  display_title: string | null;
  theme_id: string;
  theme_overrides: ThemeOverrides;
  background_id: string;
  font_id: string;
  main_links_layout: MainLinksLayout;
  plan: 'FREE' | 'PRO';
  branding_enabled: boolean;
  created_at: string;
  deleted_at: string | null;
  // PRO: background image layer
  background_image_url: string | null;
  background_overlay: number;   // 0..0.85
  background_blur_px: number;   // 0..24
}

// --- Components ---

export type ComponentType = 'links' | 'youtube' | 'spotify' | 'divider' | 'text';

export interface ProfileComponent {
  id: string;
  profile_id: string;
  type: ComponentType;
  title: string | null;
  config: Record<string, any>;
  order_index: number;
  is_visible: boolean;
  updated_at: string;
}

export interface ProfileComponentWithLinks extends ProfileComponent {
  links: Link[];
}

// --- Link Sections ---

export interface LinkSection {
  id: string;
  profile_id: string;
  title: string | null;
  layout: MainLinksLayout;
  is_visible: boolean;
  order_index: number;
  options: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LinkSectionWithLinks extends LinkSection {
  links: Link[];
}

// --- Links ---

export interface Link {
  id: string;
  profile_id: string;
  component_id: string | null;
  section_id: string | null;
  title: string;
  url: string;
  subtitle: string | null;
  icon: string | null;
  image_url: string | null;
  platform: string | null;
  order_index: number;
  is_active: boolean;
  highlight: boolean;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- Contacts ---

export type ContactType =
  | 'whatsapp'
  | 'telegram'
  | 'phone'
  | 'email'
  | 'instagram'
  | 'tiktok';

export interface ProfileContact {
  id: string;
  profile_id: string;
  type: ContactType;
  value: string;
  order_index: number;
  is_enabled: boolean;
  created_at: string;
}

// --- Theme ---

export interface Theme {
  id: string;
  name: string;
  is_pro: boolean;
  tags: string[];
  config: ThemeConfig;
}

export interface ThemeConfig {
  // ── Core colors ──────────────────────────────────────────────
  bg: string;
  text: string;
  muted?: string;
  accent?: string;

  // ── Cards / link surfaces ────────────────────────────────────
  cardBg: string;
  cardText: string;
  cardBorder: string;
  cardRadius: string;
  cardShadow?: string;

  // ── Buttons ──────────────────────────────────────────────────
  /** 'filled'|'outline' existing; 'soft'|'glass' new variants */
  buttonVariant: 'filled' | 'outline' | 'soft' | 'glass';
  buttonRadius?: string;

  // ── Typography ───────────────────────────────────────────────
  font: string;

  // ── Effects ──────────────────────────────────────────────────
  backdropBlur?: string;
  shadowIntensity?: 'none' | 'soft' | 'medium' | 'strong';

  // ── Visual style tokens (NEW) ────────────────────────────────
  /** Overall card surface look */
  surfaceVariant?: 'flat' | 'card' | 'glass';
  /** Link button style override */
  linkVariant?: 'flat' | 'card';
  /** Icon color mode — PRO-gated at render time */
  iconStyle?: 'mono' | 'brand';
  /** Vertical spacing density */
  density?: 'compact' | 'comfortable';

  // ── Background preset (embedded in theme) ────────────────────
  backgroundPreset?: {
    type: 'solid' | 'gradient' | 'pattern';
    value: string;
  };
}

// Keys allowed in user overrides (security whitelist)
export type OverrideKey =
  | 'bg'
  | 'text'
  | 'accent'
  | 'cardBg'
  | 'cardText'
  | 'cardRadius'
  | 'buttonVariant'
  | 'buttonRadius'
  | 'shadowIntensity'
  | 'iconStyle';

export type ThemeOverrides = Partial<Pick<ThemeConfig, OverrideKey>>;

// Studio preview controls (stored in studio store, not DB)
export type PreviewZoomMode = 'FIT' | '90' | '100' | '110';
export type PreviewOrientation = 'portrait' | 'landscape';

// --- Font ---

export interface Font {
  id: string;
  name: string;
  family: string;
  is_pro: boolean;
  url: string | null;
}

// --- Background ---

export interface Background {
  id: string;
  name: string;
  type: 'solid' | 'gradient' | 'pattern';
  value: string;
  is_pro: boolean;
}

// --- Analytics ---

export interface DailyProfileStat {
  profile_id: string;
  date: string;
  views: number;
  uniques: number;
  clicks: number;
  contact_clicks: number;
}

export interface DailyLinkStat {
  link_id: string;
  date: string;
  clicks: number;
}

// --- Billing ---

export interface Billing {
  id: string;
  owner_id: string;
  profile_id: string | null;
  stripe_customer_id: string | null;
  subscription_id: string | null;
  plan: 'FREE' | 'PRO';
  status:
    | 'active'
    | 'inactive'
    | 'past_due'
    | 'canceled'
    | 'trialing';
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

// --- Validation ---

export interface HandleValidation {
  valid: boolean;
  error?: string;
}

// --- Constants ---

export const FREE_LINK_LIMIT = 25;
export const FREE_COMPONENT_LIMIT = 6;
export const FREE_THEME_COUNT = 3;
export const PRO_LAYOUTS: MainLinksLayout[] = [
  'GRID_IMAGE',
  'LIST_IMAGE',
];
export const FREE_LAYOUTS: MainLinksLayout[] = [
  'LIST_ICON',
  'GRID_ICON',
];

// Classic tags (existing) + new tags
export const ALL_THEME_TAGS = [
  // classic
  'dark', 'light', 'gradient', 'glass', 'pastel',
  'neon', 'minimal', 'bold', 'warm', 'cool', 'nature', 'brutalist',
  // new
  'pill', 'sharp', 'soft-shadow', 'no-shadow', 'high-contrast',
  'monochrome', 'brand-icons', 'outline', 'card', 'flat',
  'creator', 'business',
] as const;

export type ThemeTag = typeof ALL_THEME_TAGS[number];
