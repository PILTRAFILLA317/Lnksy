import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { api } from '$convex/_generated/api.js';
import { createConvexClient } from '$lib/server/convex.js';
import { resolveEffectiveProfile, resolveEffectiveSectionLayout } from '$lib/utils/plan.js';
import {
  mapProfile,
  mapLink,
  mapComponent,
  mapTheme,
  mapFont,
  mapBackground,
  mapContact,
} from '$lib/utils/convex-mappers.js';
import type { Link, ProfileComponent, ProfileComponentWithLinks } from '$lib/types.js';

export const load: PageServerLoad = async ({ params }) => {
  // Public page — no auth needed
  const convex = createConvexClient();

  const profileDoc = await convex.query(api.profiles.getByHandle, {
    handle: params.handle,
  });

  if (!profileDoc) {
    error(404, 'Profile not found');
  }

  const profileId = profileDoc._id;

  const [linksDoc, componentsDoc, themeDoc, contactsDoc, fontDoc, bgDoc] =
    await Promise.all([
      convex.query(api.links.getActiveByProfile, { profileId }),
      convex.query(api.components.getVisibleByProfile, { profileId }),
      convex.query(api.themes.getById, { themeId: profileDoc.themeId }),
      convex.query(api.contacts.getEnabledByProfile, { profileId }),
      profileDoc.fontId
        ? convex.query(api.fonts.getById, { fontId: profileDoc.fontId })
        : Promise.resolve(null),
      profileDoc.backgroundId
        ? convex.query(api.backgrounds.getById, { backgroundId: profileDoc.backgroundId })
        : Promise.resolve(null),
    ]);

  const profile = mapProfile(profileDoc);
  const effective = resolveEffectiveProfile(profile as any);

  const links = (linksDoc ?? []).map(mapLink);
  const rawComponents = (componentsDoc ?? []).map(mapComponent);

  // Group links by component_id
  const linksByComponent = new Map<string, Link[]>();
  for (const link of links) {
    if (!link.component_id) continue;
    const existing = linksByComponent.get(link.component_id) ?? [];
    existing.push(link);
    linksByComponent.set(link.component_id, existing);
  }

  // Build components with links, applying plan gating to layouts
  const componentsWithLinks: ProfileComponentWithLinks[] = rawComponents.map((c: ProfileComponent) => ({
    ...c,
    config: c.type === 'links'
      ? { ...c.config, layout: resolveEffectiveSectionLayout(profile.plan, c.config?.layout ?? 'LIST_ICON') }
      : c.config,
    links: c.type === 'links' ? (linksByComponent.get(c.id) ?? []) : [],
  }));

  const theme = themeDoc ? mapTheme(themeDoc) : null;
  const contacts = (contactsDoc ?? []).map(mapContact);

  // Respect plan restrictions for Pro-only assets
  const font =
    fontDoc && fontDoc.isPro && profile.plan !== 'PRO' ? null : fontDoc ? mapFont(fontDoc) : null;
  const background =
    bgDoc && bgDoc.isPro && profile.plan !== 'PRO'
      ? null
      : bgDoc
        ? mapBackground(bgDoc)
        : null;

  // PRO-gated: background image is only rendered for PRO profiles
  const bgImageUrl = profile.plan === 'PRO' ? (profile.background_image_url ?? null) : null;
  const bgOverlay = profile.plan === 'PRO' ? (profile.background_overlay ?? 0) : 0;
  const bgBlurPx = profile.plan === 'PRO' ? (profile.background_blur_px ?? 0) : 0;

  return {
    profile,
    effective,
    components: componentsWithLinks,
    theme,
    contacts,
    font,
    background,
    bgImageUrl,
    bgOverlay,
    bgBlurPx,
  };
};
