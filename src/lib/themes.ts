import type { ThemeConfig, ThemeOverrides, OverrideKey } from './types.js';

// ---------------------------------------------------------------------------
// Theme resolution
// ---------------------------------------------------------------------------

export function resolveThemeConfig(
  config: ThemeConfig,
  overrides: ThemeOverrides,
): ThemeConfig {
  return { ...config, ...overrides };
}

// ---------------------------------------------------------------------------
// CSS variable generation
// ---------------------------------------------------------------------------

export function themeToCSS(config: ThemeConfig): string {
  const shadow = getCardShadow(config);
  const vars: string[] = [
    `--lnksy-bg: ${config.bg}`,
    `--lnksy-text: ${config.text}`,
    `--lnksy-muted: ${config.muted ?? config.text}`,
    `--lnksy-accent: ${config.accent ?? '#6366f1'}`,
    `--lnksy-card-bg: ${config.cardBg}`,
    `--lnksy-card-text: ${config.cardText}`,
    `--lnksy-card-border: ${config.cardBorder}`,
    `--lnksy-card-radius: ${config.cardRadius}`,
    `--lnksy-card-shadow: ${shadow}`,
    `--lnksy-button-radius: ${config.buttonRadius ?? config.cardRadius}`,
    `--lnksy-font: ${config.font}`,
    `--lnksy-backdrop-blur: ${config.backdropBlur ?? '0px'}`,
    // New tokens
    `--lnksy-surface: ${config.surfaceVariant ?? 'card'}`,
    `--lnksy-density: ${config.density ?? 'comfortable'}`,
  ];
  return vars.join('; ');
}

export function isGradient(bg: string): boolean {
  return bg.includes('gradient');
}

// ---------------------------------------------------------------------------
// Shadow intensity → CSS box-shadow mapping
// ---------------------------------------------------------------------------

export const SHADOW_MAP: Record<NonNullable<ThemeConfig['shadowIntensity']>, string> = {
  none: 'none',
  soft: '0 1px 4px rgba(0,0,0,0.06)',
  medium: '0 2px 10px rgba(0,0,0,0.12)',
  strong: '0 4px 20px rgba(0,0,0,0.22)',
};

export function getCardShadow(config: ThemeConfig): string {
  if (config.cardShadow) return config.cardShadow;
  if (config.shadowIntensity) return SHADOW_MAP[config.shadowIntensity];
  return 'none';
}

// ---------------------------------------------------------------------------
// Override validation — server and client both import this
// ---------------------------------------------------------------------------

const SAFE_HEX = /^#[0-9a-fA-F]{6}$/;
const SAFE_RADIUS = /^\d{1,4}px$/;

export const OVERRIDE_WHITELIST: Record<OverrideKey, RegExp> = {
  bg: SAFE_HEX,
  text: SAFE_HEX,
  accent: SAFE_HEX,
  cardBg: new RegExp(`^(${SAFE_HEX.source}|transparent)$`),
  cardText: SAFE_HEX,
  cardRadius: SAFE_RADIUS,
  buttonVariant: /^(filled|outline|soft|glass)$/,
  buttonRadius: SAFE_RADIUS,
  shadowIntensity: /^(none|soft|medium|strong)$/,
  iconStyle: /^(mono|brand)$/,
};

/** Keys FREE users may override */
export const FREE_OVERRIDE_KEYS: OverrideKey[] = ['accent', 'cardRadius', 'buttonRadius'];

/** Keys PRO users may override */
export const PRO_OVERRIDE_KEYS: OverrideKey[] = Object.keys(
  OVERRIDE_WHITELIST,
) as OverrideKey[];

/**
 * Validates and sanitizes raw override input.
 * Returns only keys that pass the whitelist regex.
 */
export function validateOverrides(
  raw: Record<string, unknown>,
): ThemeOverrides {
  const safe: ThemeOverrides = {};
  for (const [key, value] of Object.entries(raw)) {
    const k = key as OverrideKey;
    const pattern = OVERRIDE_WHITELIST[k];
    if (pattern && typeof value === 'string' && pattern.test(value.trim())) {
      (safe as Record<string, string>)[k] = value.trim();
    }
  }
  return safe;
}

/**
 * Filters validated overrides to the keys allowed by the given plan.
 */
export function filterOverridesByPlan(
  overrides: ThemeOverrides,
  plan: 'FREE' | 'PRO',
): ThemeOverrides {
  const allowed = plan === 'PRO' ? PRO_OVERRIDE_KEYS : FREE_OVERRIDE_KEYS;
  return Object.fromEntries(
    Object.entries(overrides).filter(([k]) => allowed.includes(k as OverrideKey)),
  ) as ThemeOverrides;
}

// ---------------------------------------------------------------------------
// Contrast utilities (WCAG 2.1 relative luminance)
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Returns WCAG contrast ratio between two hex colors (1–21). */
export function contrastRatio(hex1: string, hex2: string): number {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  if (!c1 || !c2) return 1;
  const l1 = relativeLuminance(...c1);
  const l2 = relativeLuminance(...c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Returns true if the contrast ratio is at least 4.5 (WCAG AA normal text). */
export function hasAdequateContrast(fg: string, bg: string): boolean {
  return contrastRatio(fg, bg) >= 4.5;
}
