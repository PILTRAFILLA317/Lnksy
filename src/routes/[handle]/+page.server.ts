import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { api } from '$convex/_generated/api.js';
import { createConvexClient } from '$lib/server/convex.js';
import { resolveEffectiveProfile, resolveEffectiveSectionLayout } from '$lib/utils/plan.js';
import {
  mapProfile,
  mapLink,
  mapLinkSection,
  mapTheme,
  mapFont,
  mapBackground,
  mapContact,
} from '$lib/utils/convex-mappers.js';
import type { Link, LinkSectionWithLinks } from '$lib/types.js';

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

  const [linksDoc, sectionsDoc, themeDoc, contactsDoc, fontDoc, bgDoc] =
    await Promise.all([
      convex.query(api.links.getActiveByProfile, { profileId }),
      convex.query(api.sections.getVisibleByProfile, { profileId }),
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
  const rawSections = (sectionsDoc ?? []).map(mapLinkSection);

  // Group links by section_id
  const linksBySection = new Map<string, Link[]>();
  for (const link of links) {
    const existing = linksBySection.get(link.section_id) ?? [];
    existing.push(link);
    linksBySection.set(link.section_id, existing);
  }

  const sectionsWithLinks: LinkSectionWithLinks[] = rawSections.map((s) => ({
    ...s,
    layout: resolveEffectiveSectionLayout(profile.plan, s.layout),
    links: linksBySection.get(s.id) ?? [],
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

  return {
    profile,
    effective,
    links,
    sections: sectionsWithLinks,
    theme,
    contacts,
    font,
    background,
  };
};
