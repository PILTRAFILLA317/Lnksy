import type { ThemeConfig, ThemeOverrides } from './types.js';

export function resolveThemeConfig(
  config: ThemeConfig,
  overrides: ThemeOverrides
): ThemeConfig {
  return { ...config, ...overrides };
}

export function themeToCSS(config: ThemeConfig): string {
  return [
    `--lnksy-bg: ${config.bg}`,
    `--lnksy-text: ${config.text}`,
    `--lnksy-card-bg: ${config.cardBg}`,
    `--lnksy-card-text: ${config.cardText}`,
    `--lnksy-card-border: ${config.cardBorder}`,
    `--lnksy-card-radius: ${config.cardRadius}`,
    `--lnksy-font: ${config.font}`,
  ].join('; ');
}

export function isGradient(bg: string): boolean {
  return bg.includes('gradient');
}
