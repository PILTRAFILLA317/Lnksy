import type { Profile, MainLinksLayout } from '$lib/types.js';
import { PRO_LAYOUTS } from '$lib/types.js';

type Plan = 'FREE' | 'PRO';

export function canAddSection(_plan: Plan): boolean {
  return true;
}

export function resolveEffectiveSectionLayout(
  plan: Plan,
  layout: MainLinksLayout,
): MainLinksLayout {
  if (plan === 'PRO' || !PRO_LAYOUTS.includes(layout)) return layout;
  return 'LIST_ICON';
}

export function canUseHero(plan: Plan): boolean {
  return plan === 'PRO';
}

export function canUseAvatarHero(plan: Plan): boolean {
  return plan === 'PRO';
}

export function canUseCustomTitle(plan: Plan): boolean {
  return plan === 'PRO';
}

export function canUseImageLayouts(plan: Plan): boolean {
  return plan === 'PRO';
}

export function canUploadLinkImages(plan: Plan): boolean {
  return plan === 'PRO';
}

export function canUsePremiumFont(plan: Plan): boolean {
  return plan === 'PRO';
}

export function canUsePremiumBackground(plan: Plan): boolean {
  return plan === 'PRO';
}

export function canRemoveBranding(plan: Plan): boolean {
  return plan === 'PRO';
}

/**
 * Resolve effective values for a profile, applying FREE
 * degradation if user downgraded from PRO.
 */
export function resolveEffectiveProfile(profile: Profile): {
  headerMode: Profile['header_mode'];
  displayTitle: string;
  mainLinksLayout: MainLinksLayout;
  fontId: string;
  backgroundId: string;
} {
  const plan = profile.plan;

  const headerMode =
    plan === 'PRO'
      ? profile.header_mode
      : 'AVATAR';

  const displayTitle =
    plan === 'PRO' && profile.display_title
      ? profile.display_title
      : profile.name ?? profile.handle;

  const mainLinksLayout =
    plan === 'PRO' || !PRO_LAYOUTS.includes(profile.main_links_layout)
      ? profile.main_links_layout
      : 'LIST_ICON';

  // Font/bg degradation: we don't have is_pro info here,
  // so we rely on the server to resolve. Pass through as-is.
  const fontId = profile.font_id;
  const backgroundId = profile.background_id;

  return {
    headerMode,
    displayTitle,
    mainLinksLayout,
    fontId,
    backgroundId,
  };
}
