export interface Profile {
  id: string;
  owner_id: string;
  handle: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  theme_id: string;
  theme_overrides: ThemeOverrides;
  plan: 'FREE' | 'PRO';
  branding_enabled: boolean;
  created_at: string;
  deleted_at: string | null;
}

export interface Link {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  subtitle: string | null;
  icon: string | null;
  order_index: number;
  is_active: boolean;
  highlight: boolean;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Theme {
  id: string;
  name: string;
  is_pro: boolean;
  config: ThemeConfig;
}

export interface ThemeConfig {
  bg: string;
  text: string;
  cardBg: string;
  cardText: string;
  cardBorder: string;
  cardRadius: string;
  buttonVariant: 'filled' | 'outline';
  font: string;
  backdropBlur?: string;
}

export type ThemeOverrides = Partial<ThemeConfig>;

export interface DailyProfileStat {
  profile_id: string;
  date: string;
  views: number;
  uniques: number;
  clicks: number;
}

export interface DailyLinkStat {
  link_id: string;
  date: string;
  clicks: number;
}

export interface Billing {
  id: string;
  owner_id: string;
  profile_id: string | null;
  stripe_customer_id: string | null;
  subscription_id: string | null;
  plan: 'FREE' | 'PRO';
  status: 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing';
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface HandleValidation {
  valid: boolean;
  error?: string;
}

export const FREE_LINK_LIMIT = 25;
export const FREE_THEME_COUNT = 3;
