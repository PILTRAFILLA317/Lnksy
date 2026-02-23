import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { api } from '$convex/_generated/api.js';
import type { MainLinksLayout, HeaderMode } from '$lib/types.js';
import { validateOverrides, filterOverridesByPlan } from '$lib/themes.js';
import {
  mapLink,
  mapComponent,
  mapTheme,
  mapFont,
  mapBackground,
  mapContact,
} from '$lib/utils/convex-mappers.js';
import {
  canUseHero,
  canUseImageLayouts,
  canUsePremiumFont,
  canUsePremiumBackground,
} from '$lib/utils/plan.js';
import type { Id } from '$convex/_generated/dataModel.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { profile } = await parent();
  if (!profile) return { links: [], components: [], themes: [], fonts: [], backgrounds: [], contacts: [] };

  const profileId = profile.id as any;

  const [links, components, themes, fonts, backgrounds, contacts] =
    await Promise.all([
      locals.convex.query(api.links.getByProfile, { profileId }),
      locals.convex.query(api.components.getByProfile, { profileId }),
      locals.convex.query(api.themes.list, {}),
      locals.convex.query(api.fonts.list, {}),
      locals.convex.query(api.backgrounds.list, {}),
      locals.convex.query(api.contacts.getByProfile, { profileId }),
    ]);

  return {
    links: (links ?? []).map(mapLink),
    components: (components ?? []).map(mapComponent),
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
  // ─── Link actions ───────────────────────────────────────────

  addLink: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const componentId = fd.get('componentId') as string;
    const title = (fd.get('title') as string)?.trim();
    const url = (fd.get('url') as string)?.trim();

    if (!title || !url || !componentId) {
      return fail(400, { error: 'Title, URL, and component are required' });
    }

    try {
      await locals.convex.mutation(api.links.addToComponent, {
        userId,
        componentId: componentId as any,
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

  reorderLinks: async ({ request, locals }) => {
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

  // ─── Component actions ──────────────────────────────────────

  addComponent: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const type = fd.get('type') as string;
    const title = (fd.get('title') as string)?.trim() || undefined;

    if (!type) return fail(400, { error: 'Component type is required' });

    try {
      const componentId = await locals.convex.mutation(api.components.add, {
        userId,
        type: type as any,
        title,
      });
      return { success: true, componentId };
    } catch (e) {
      return fail(403, { error: convexError(e) });
    }
  },

  updateComponent: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const componentId = fd.get('componentId') as string;
    if (!componentId) return fail(400, { error: 'Missing component ID' });

    const title = fd.get('title') as string | null;
    const configRaw = fd.get('config') as string | null;

    try {
      await locals.convex.mutation(api.components.update, {
        userId,
        componentId: componentId as any,
        title: title !== null ? title : undefined,
        config: configRaw ? JSON.parse(configRaw) : undefined,
      });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  toggleComponent: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const componentId = fd.get('componentId') as string;
    if (!componentId) return fail(400, { error: 'Missing component ID' });

    try {
      await locals.convex.mutation(api.components.toggle, {
        userId,
        componentId: componentId as any,
      });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  duplicateComponent: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const componentId = fd.get('componentId') as string;
    if (!componentId) return fail(400, { error: 'Missing component ID' });

    try {
      await locals.convex.mutation(api.components.duplicate, {
        userId,
        componentId: componentId as any,
      });
    } catch (e) {
      return fail(403, { error: convexError(e) });
    }

    return { success: true };
  },

  deleteComponent: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const componentId = fd.get('componentId') as string;
    if (!componentId) return fail(400, { error: 'Missing component ID' });

    try {
      await locals.convex.mutation(api.components.remove, {
        userId,
        componentId: componentId as any,
      });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  reorderComponents: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const orderJson = fd.get('order') as string;

    try {
      const order: string[] = JSON.parse(orderJson);
      await locals.convex.mutation(api.components.reorder, {
        userId,
        order: order as any,
      });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  moveComponentUp: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const componentId = fd.get('componentId') as string;
    if (!componentId) return fail(400, { error: 'Missing component ID' });

    try {
      await locals.convex.mutation(api.components.moveUp, {
        userId,
        componentId: componentId as any,
      });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  moveComponentDown: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const componentId = fd.get('componentId') as string;
    if (!componentId) return fail(400, { error: 'Missing component ID' });

    try {
      await locals.convex.mutation(api.components.moveDown, {
        userId,
        componentId: componentId as any,
      });
    } catch (e) {
      return fail(400, { error: convexError(e) });
    }

    return { success: true };
  },

  // ─── Appearance actions ─────────────────────────────────────

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

  uploadAvatar: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const file = fd.get('avatar') as File;

    if (!file || file.size === 0) return fail(400, { error: 'No file' });
    if (file.size > 2 * 1024 * 1024) return fail(400, { error: 'Max 2MB' });
    if (!file.type.startsWith('image/')) return fail(400, { error: 'Must be an image' });

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

    if (!uploadRes.ok) return fail(500, { error: 'Upload failed' });

    const { storageId } = await uploadRes.json();
    const avatarUrl = await locals.convex.mutation(api.files.getFileUrl, { storageId });

    try {
      await locals.convex.mutation(api.profiles.updateAvatar, { userId, avatarUrl: avatarUrl ?? '' });
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

  // ── Background image (PRO) ───────────────────────────────
  uploadBackgroundImage: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const file = fd.get('bgImage') as File;

    if (!file || file.size === 0) return fail(400, { error: 'No file' });
    if (file.size > 8 * 1024 * 1024) return fail(400, { error: 'Max 8MB' });
    if (!file.type.startsWith('image/')) return fail(400, { error: 'Must be an image' });

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
    if (!uploadRes.ok) return fail(500, { error: 'Upload failed' });

    const { storageId } = await uploadRes.json();
    const imageUrl = await locals.convex.mutation(api.files.getFileUrl, { storageId });

    try {
      await locals.convex.mutation(api.profiles.updateBackgroundImage, {
        userId,
        backgroundImageUrl: imageUrl ?? '',
        backgroundOverlay: 0,
        backgroundBlurPx: 0,
      });
    } catch (e) {
      return fail(403, { error: convexError(e) });
    }

    return { success: true };
  },

  updateBackgroundSettings: async ({ request, locals }) => {
    const userId = getUserId(locals);
    const fd = await request.formData();
    const overlay = parseFloat(fd.get('overlay') as string ?? '0');
    const blur = parseFloat(fd.get('blur') as string ?? '0');
    const removeImage = fd.get('removeImage') === '1';

    try {
      const profileDoc = await locals.convex.query(api.profiles.getOwn, { userId });
      await locals.convex.mutation(api.profiles.updateBackgroundImage, {
        userId,
        backgroundImageUrl: removeImage ? undefined : (profileDoc?.backgroundImageUrl ?? undefined),
        backgroundOverlay: overlay,
        backgroundBlurPx: blur,
      });
    } catch (e) {
      return fail(403, { error: convexError(e) });
    }

    return { success: true };
  },
} satisfies Actions;
