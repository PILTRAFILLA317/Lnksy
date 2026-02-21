import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { api } from '$convex/_generated/api.js';
import type { MainLinksLayout, HeaderMode } from '$lib/types.js';
import { validateOverrides, filterOverridesByPlan } from '$lib/themes.js';
import {
  mapLink,
  mapLinkSection,
  mapTheme,
  mapFont,
  mapBackground,
  mapContact,
} from '$lib/utils/convex-mappers.js';
import {
  canUseHero,
  canUseCustomTitle,
  canUseImageLayouts,
  canUsePremiumFont,
  canUsePremiumBackground,
  canRemoveBranding,
} from '$lib/utils/plan.js';
import type { Id } from '$convex/_generated/dataModel.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { profile } = await parent();
  if (!profile) return { links: [], sections: [], themes: [], fonts: [], backgrounds: [], contacts: [] };

  const profileId = profile.id as any;

  const [links, sections, themes, fonts, backgrounds, contacts] =
    await Promise.all([
      locals.convex.query(api.links.getByProfile, { profileId }),
      locals.convex.query(api.sections.getByProfile, { profileId }),
      locals.convex.query(api.themes.list, {}),
      locals.convex.query(api.fonts.list, {}),
      locals.convex.query(api.backgrounds.list, {}),
      locals.convex.query(api.contacts.getByProfile, { profileId }),
    ]);

  return {
    links: (links ?? []).map(mapLink),
    sections: (sections ?? []).map(mapLinkSection),
    themes: (themes ?? []).map(mapTheme),
    fonts: (fonts ?? []).map(mapFont),
    backgrounds: (backgrounds ?? []).map(mapBackground),
    contacts: (contacts ?? []).map(mapContact),
  };
};

// ─── Helper ──────────────────────────────────────────────────

function convexError(e: unknown): string {
  return (e as any)?.message ?? (e as any)?.data ?? 'Error';
}

function getUserId(locals: App.Locals): Id<"users"> {
  if (!locals.user) throw new Error("Not authenticated");
  return locals.user.id as Id<"users">;
}

export const actions = {
  // --- Link actions ---

  addLink: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const sectionId = fd.get('sectionId') as string;
    const title = (fd.get('title') as string)?.trim();
    const url = (fd.get('url') as string)?.trim();

    if (!title || !url || !sectionId) {
      return fail(400, { error: 'Title, URL, and section are required' });
    }

    try {
      await locals.convex.mutation(api.links.add, {
        userId,
        sectionId: sectionId as any,
        title,
        url,
        subtitle: (fd.get('subtitle') as string)?.trim() || undefined,
        imageUrl: (fd.get('imageUrl') as string)?.trim() || undefined,
        platform: (fd.get('platform') as string)?.trim() || undefined,
      });
    } catch (e) {
      return fail(403, { error: convexError(e) });
    }

    return { success: true };
  },

  updateLink: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const linkId = fd.get('linkId') as string;
    const title = (fd.get('title') as string)?.trim();
    const url = (fd.get('url') as string)?.trim();

    if (!linkId || !title || !url) {
      return fail(400, { error: 'Missing required fields' });
    }

    const startAtRaw = fd.get('startAt') as string;
    const endAtRaw = fd.get('endAt') as string;

    try {
      await locals.convex.mutation(api.links.update, {
        userId,
        linkId: linkId as any,
        title,
        url,
        subtitle: (fd.get('subtitle') as string)?.trim() || undefined,
        imageUrl: (fd.get('imageUrl') as string)?.trim() || undefined,
        platform: (fd.get('platform') as string)?.trim() || undefined,
        startAt: startAtRaw ? new Date(startAtRaw).getTime() : undefined,
        endAt: endAtRaw ? new Date(endAtRaw).getTime() : undefined,
        highlight: fd.get('highlight') === 'on',
      });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  toggleLink: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const linkId = fd.get('linkId') as string;

    try {
      await locals.convex.mutation(api.links.toggle, { userId, linkId: linkId as any });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  deleteLink: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const linkId = fd.get('linkId') as string;

    try {
      await locals.convex.mutation(api.links.remove, { userId, linkId: linkId as any });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  duplicateLink: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const linkId = fd.get('linkId') as string;

    try {
      await locals.convex.mutation(api.links.duplicate, { userId, linkId: linkId as any });
    } catch (e) {
      return fail(403, { error: convexError(e) });
    }

    return { success: true };
  },

  reorder: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const orderJson = fd.get('order') as string;

    try {
      const order: string[] = JSON.parse(orderJson);
      await locals.convex.mutation(api.links.reorder, { userId, order: order as any });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  // --- Section actions ---

  addSection: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const title = (fd.get('title') as string)?.trim() || undefined;

    try {
      const sectionId = await locals.convex.mutation(api.sections.add, { userId, title });
      return { success: true, sectionId };
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }
  },

  updateSection: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const sectionId = fd.get('sectionId') as string;
    if (!sectionId) return fail(400, { error: 'Missing section ID' });

    const title = fd.get('title');
    const isVisible = fd.get('isVisible');

    try {
      await locals.convex.mutation(api.sections.update, {
        userId,
        sectionId: sectionId as any,
        title: title !== null ? ((title as string).trim() || undefined) : undefined,
        isVisible: isVisible !== null ? isVisible === 'true' : undefined,
      });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  updateSectionLayout: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const sectionId = fd.get('sectionId') as string;
    const layout = fd.get('layout') as MainLinksLayout;

    if (!sectionId || !layout) {
      return fail(400, { error: 'Missing section ID or layout' });
    }

    try {
      await locals.convex.mutation(api.sections.updateLayout, {
        userId,
        sectionId: sectionId as any,
        layout,
      });
    } catch (e) {
      return fail(403, { error: convexError(e) });
    }

    return { success: true };
  },

  deleteSection: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const sectionId = fd.get('sectionId') as string;

    try {
      await locals.convex.mutation(api.sections.remove, { userId, sectionId: sectionId as any });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  reorderSections: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const orderJson = fd.get('order') as string;

    try {
      const order: string[] = JSON.parse(orderJson);
      await locals.convex.mutation(api.sections.reorder, { userId, order: order as any });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  moveLink: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const linkId = fd.get('linkId') as string;
    const targetSectionId = fd.get('targetSectionId') as string;

    if (!linkId || !targetSectionId) {
      return fail(400, { error: 'Missing link or target section' });
    }

    try {
      await locals.convex.mutation(api.links.moveToSection, {
        userId,
        linkId: linkId as any,
        targetSectionId: targetSectionId as any,
      });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  // --- Appearance actions ---

  selectTheme: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const themeId = fd.get('themeId') as string;

    try {
      await locals.convex.mutation(api.profiles.selectTheme, { userId, themeId });
    } catch (e) {
      return fail(403, { error: convexError(e) });
    }

    return { success: true };
  },

  updateHeaderMode: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const mode = fd.get('headerMode') as HeaderMode;

    try {
      await locals.convex.mutation(api.profiles.updateHeaderMode, { userId, headerMode: mode });
    } catch (e) {
      return fail(403, { error: convexError(e) });
    }

    return { success: true };
  },

  uploadHero: async ({ request, locals }) => {
    const userId = getUserId(locals);

    const profileDoc = await locals.convex.query(api.profiles.getOwn, { userId });
    if (!profileDoc) return fail(404);

    if (!canUseHero(profileDoc.plan)) {
      return fail(403, { error: 'Hero image requires Pro' });
    }

    const fd = await request.formData();
    const file = fd.get('hero') as File;
    if (!file || file.size === 0) return fail(400, { error: 'No file' });
    if (file.size > 5 * 1024 * 1024) {
      return fail(400, { error: 'Max 5MB' });
    }

    let uploadUrl: string;
    try {
      uploadUrl = await locals.convex.mutation(api.files.generateUploadUrl, { userId });
    } catch (e) {
      return fail(500, { error: 'Failed to get upload URL' });
    }

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadRes.ok) {
      return fail(500, { error: 'Upload failed' });
    }

    const { storageId } = await uploadRes.json();
    const heroUrl = await locals.convex.mutation(api.files.getFileUrl, { storageId });

    try {
      await locals.convex.mutation(api.profiles.updateHero, { userId, heroUrl: heroUrl ?? '' });
    } catch (e) {
      return fail(500, { error: convexError(e) });
    }

    return { success: true };
  },

  updateDisplayTitle: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const title = (fd.get('displayTitle') as string)?.trim().slice(0, 60) || undefined;

    try {
      await locals.convex.mutation(api.profiles.updateDisplayTitle, { userId, displayTitle: title });
    } catch (e) {
      return fail(403, { error: convexError(e) });
    }

    return { success: true };
  },

  updateBio: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const bio = (fd.get('bio') as string)?.trim().slice(0, 300) || undefined;

    try {
      await locals.convex.mutation(api.profiles.updateBio, { userId, bio });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  updateContact: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const type = fd.get('type') as string;
    const value = (fd.get('value') as string)?.trim() ?? '';
    const enabled = fd.get('enabled') !== 'false';

    if (!type) return fail(400, { error: 'Missing contact type' });

    try {
      await locals.convex.mutation(api.contacts.upsert, {
        userId,
        type: type as any,
        value,
        isEnabled: enabled,
      });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  updateLayout: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const layout = fd.get('layout') as MainLinksLayout;

    try {
      await locals.convex.mutation(api.profiles.updateLayout, { userId, layout });
    } catch (e) {
      return fail(403, { error: convexError(e) });
    }

    return { success: true };
  },

  selectBackground: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const backgroundId = fd.get('backgroundId') as string;

    try {
      await locals.convex.mutation(api.profiles.selectBackground, { userId, backgroundId });
    } catch (e) {
      return fail(403, { error: convexError(e) });
    }

    return { success: true };
  },

  selectFont: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const fontId = fd.get('fontId') as string;

    try {
      await locals.convex.mutation(api.profiles.selectFont, { userId, fontId });
    } catch (e) {
      return fail(403, { error: convexError(e) });
    }

    return { success: true };
  },

  updateOverrides: async ({ request, locals }) => {
    const userId = getUserId(locals);

    const profileDoc = await locals.convex.query(api.profiles.getOwn, { userId });
    if (!profileDoc) return fail(404);

    const fd = await request.formData();
    const raw: Record<string, unknown> = {};
    for (const [key, value] of fd.entries()) {
      if (key.startsWith('override_') && value) {
        raw[key.replace('override_', '')] = value as string;
      }
    }

    const validated = validateOverrides(raw);
    const safeOverrides = filterOverridesByPlan(
      validated,
      profileDoc.plan as 'FREE' | 'PRO',
    );

    try {
      await locals.convex.mutation(api.profiles.updateOverrides, { userId, overrides: safeOverrides });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  resetOverrides: async ({ locals }) => {
    const userId = getUserId(locals);

    try {
      await locals.convex.mutation(api.profiles.resetOverrides, { userId });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  toggleBranding: async ({ locals }) => {
    const userId = getUserId(locals);

    try {
      await locals.convex.mutation(api.profiles.toggleBranding, { userId });
    } catch (e) {
      return fail(403, { error: convexError(e) });
    }

    return { success: true };
  },
} satisfies Actions;
