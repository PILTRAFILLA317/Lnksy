import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { createSupabaseAdmin } from '$lib/server/supabase.js';
import { FREE_LINK_LIMIT, PRO_LAYOUTS } from '$lib/types.js';
import type { MainLinksLayout, HeaderMode } from '$lib/types.js';
import {
  canUseHero,
  canUseCustomTitle,
  canUseImageLayouts,
  canUsePremiumFont,
  canUsePremiumBackground,
  canRemoveBranding,
} from '$lib/utils/plan.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { profile } = await parent();
  if (!profile) return { links: [], sections: [], themes: [], fonts: [], backgrounds: [], contacts: [] };

  const [
    { data: links },
    { data: sections },
    { data: themes },
    { data: fonts },
    { data: backgrounds },
    { data: contacts },
  ] = await Promise.all([
    locals.supabase
      .from('links')
      .select('*')
      .eq('profile_id', profile.id)
      .order('order_index'),
    locals.supabase
      .from('link_sections')
      .select('*')
      .eq('profile_id', profile.id)
      .order('order_index'),
    locals.supabase
      .from('themes')
      .select('*')
      .order('is_pro')
      .order('name'),
    locals.supabase.from('fonts').select('*').order('is_pro').order('name'),
    locals.supabase
      .from('backgrounds')
      .select('*')
      .order('is_pro')
      .order('name'),
    locals.supabase
      .from('profile_contacts')
      .select('*')
      .eq('profile_id', profile.id)
      .order('order_index'),
  ]);

  return {
    links: links ?? [],
    sections: sections ?? [],
    themes: themes ?? [],
    fonts: fonts ?? [],
    backgrounds: backgrounds ?? [],
    contacts: contacts ?? [],
  };
};

export const actions = {
  // --- Link actions ---

  addLink: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single();

    if (!profile) return fail(404);

    // Check limit
    if (profile.plan === 'FREE') {
      const { count } = await admin
        .from('links')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profile.id);

      if ((count ?? 0) >= FREE_LINK_LIMIT) {
        return fail(403, {
          error: `Free plan is limited to ${FREE_LINK_LIMIT} links`,
        });
      }
    }

    const fd = await request.formData();
    const sectionId = fd.get('sectionId') as string;
    const title = (fd.get('title') as string)?.trim();
    const url = (fd.get('url') as string)?.trim();
    const subtitle = (fd.get('subtitle') as string)?.trim() || null;
    const imageUrl = (fd.get('imageUrl') as string)?.trim() || null;
    const platform = (fd.get('platform') as string)?.trim() || null;

    if (!title || !url || !sectionId) {
      return fail(400, { error: 'Title, URL, and section are required' });
    }

    // Get max order within section
    const { data: maxLink } = await admin
      .from('links')
      .select('order_index')
      .eq('section_id', sectionId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxLink?.order_index ?? -1) + 1;

    await admin.from('links').insert({
      profile_id: profile.id,
      section_id: sectionId,
      title,
      url,
      subtitle,
      image_url: imageUrl,
      platform,
      order_index: nextOrder,
    });

    return { success: true };
  },

  updateLink: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!profile) return fail(404);

    const fd = await request.formData();
    const linkId = fd.get('linkId') as string;
    const title = (fd.get('title') as string)?.trim();
    const url = (fd.get('url') as string)?.trim();
    const subtitle = (fd.get('subtitle') as string)?.trim() || null;
    const imageUrl = (fd.get('imageUrl') as string)?.trim() || null;
    const platform = (fd.get('platform') as string)?.trim() || null;
    const startAt = (fd.get('startAt') as string) || null;
    const endAt = (fd.get('endAt') as string) || null;
    const highlight = fd.get('highlight') === 'on';

    if (!linkId || !title || !url) {
      return fail(400, { error: 'Missing required fields' });
    }

    await admin
      .from('links')
      .update({
        title,
        url,
        subtitle,
        image_url: imageUrl,
        platform,
        start_at: startAt,
        end_at: endAt,
        highlight,
      })
      .eq('id', linkId)
      .eq('profile_id', profile.id);

    return { success: true };
  },

  toggleLink: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!profile) return fail(404);

    const fd = await request.formData();
    const linkId = fd.get('linkId') as string;
    const isActive = fd.get('isActive') === 'true';

    await admin
      .from('links')
      .update({ is_active: !isActive })
      .eq('id', linkId)
      .eq('profile_id', profile.id);

    return { success: true };
  },

  deleteLink: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!profile) return fail(404);

    const fd = await request.formData();
    const linkId = fd.get('linkId') as string;

    await admin
      .from('links')
      .delete()
      .eq('id', linkId)
      .eq('profile_id', profile.id);

    return { success: true };
  },

  duplicateLink: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single();

    if (!profile) return fail(404);

    // Check limit
    if (profile.plan === 'FREE') {
      const { count } = await admin
        .from('links')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profile.id);

      if ((count ?? 0) >= FREE_LINK_LIMIT) {
        return fail(403, { error: 'Link limit reached' });
      }
    }

    const fd = await request.formData();
    const linkId = fd.get('linkId') as string;

    const { data: original } = await admin
      .from('links')
      .select('*')
      .eq('id', linkId)
      .eq('profile_id', profile.id)
      .single();

    if (!original) return fail(404);

    const { data: maxLink } = await admin
      .from('links')
      .select('order_index')
      .eq('section_id', original.section_id)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    await admin.from('links').insert({
      profile_id: profile.id,
      section_id: original.section_id,
      title: `${original.title} (copy)`,
      url: original.url,
      subtitle: original.subtitle,
      icon: original.icon,
      image_url: original.image_url,
      platform: original.platform,
      order_index: (maxLink?.order_index ?? 0) + 1,
    });

    return { success: true };
  },

  reorder: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!profile) return fail(404);

    const fd = await request.formData();
    const orderJson = fd.get('order') as string;

    try {
      const order: string[] = JSON.parse(orderJson);
      for (let i = 0; i < order.length; i++) {
        await admin
          .from('links')
          .update({ order_index: i })
          .eq('id', order[i])
          .eq('profile_id', profile.id);
      }
    } catch {
      return fail(400, { error: 'Invalid order data' });
    }

    return { success: true };
  },

  // --- Section actions ---

  addSection: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single();
    if (!profile) return fail(404);

    const fd = await request.formData();
    const title = (fd.get('title') as string)?.trim() || null;

    // Get max order
    const { data: maxSection } = await admin
      .from('link_sections')
      .select('order_index')
      .eq('profile_id', profile.id)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxSection?.order_index ?? -1) + 1;

    const { data: section } = await admin
      .from('link_sections')
      .insert({
        profile_id: profile.id,
        title,
        order_index: nextOrder,
      })
      .select('id')
      .single();

    return { success: true, sectionId: section?.id };
  },

  updateSection: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('owner_id', user.id)
      .single();
    if (!profile) return fail(404);

    const fd = await request.formData();
    const sectionId = fd.get('sectionId') as string;
    if (!sectionId) return fail(400, { error: 'Missing section ID' });

    const updates: Record<string, unknown> = {};
    const title = fd.get('title');
    if (title !== null) updates.title = (title as string).trim() || null;
    const isVisible = fd.get('isVisible');
    if (isVisible !== null) updates.is_visible = isVisible === 'true';

    await admin
      .from('link_sections')
      .update(updates)
      .eq('id', sectionId)
      .eq('profile_id', profile.id);

    return { success: true };
  },

  updateSectionLayout: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single();
    if (!profile) return fail(404);

    const fd = await request.formData();
    const sectionId = fd.get('sectionId') as string;
    const layout = fd.get('layout') as MainLinksLayout;

    if (!sectionId || !layout) {
      return fail(400, { error: 'Missing section ID or layout' });
    }

    if (
      PRO_LAYOUTS.includes(layout) &&
      !canUseImageLayouts(profile.plan)
    ) {
      return fail(403, { error: 'This layout requires Pro' });
    }

    await admin
      .from('link_sections')
      .update({ layout })
      .eq('id', sectionId)
      .eq('profile_id', profile.id);

    return { success: true };
  },

  deleteSection: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('owner_id', user.id)
      .single();
    if (!profile) return fail(404);

    const fd = await request.formData();
    const sectionId = fd.get('sectionId') as string;

    // Prevent deleting last section
    const { count } = await admin
      .from('link_sections')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profile.id);

    if ((count ?? 0) <= 1) {
      return fail(400, { error: 'Cannot delete the last section' });
    }

    await admin
      .from('link_sections')
      .delete()
      .eq('id', sectionId)
      .eq('profile_id', profile.id);

    return { success: true };
  },

  reorderSections: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('owner_id', user.id)
      .single();
    if (!profile) return fail(404);

    const fd = await request.formData();
    const orderJson = fd.get('order') as string;

    try {
      const order: string[] = JSON.parse(orderJson);
      for (let i = 0; i < order.length; i++) {
        await admin
          .from('link_sections')
          .update({ order_index: i })
          .eq('id', order[i])
          .eq('profile_id', profile.id);
      }
    } catch {
      return fail(400, { error: 'Invalid order data' });
    }

    return { success: true };
  },

  moveLink: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('owner_id', user.id)
      .single();
    if (!profile) return fail(404);

    const fd = await request.formData();
    const linkId = fd.get('linkId') as string;
    const targetSectionId = fd.get('targetSectionId') as string;

    if (!linkId || !targetSectionId) {
      return fail(400, { error: 'Missing link or target section' });
    }

    // Get max order in target section
    const { data: maxLink } = await admin
      .from('links')
      .select('order_index')
      .eq('section_id', targetSectionId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    await admin
      .from('links')
      .update({
        section_id: targetSectionId,
        order_index: (maxLink?.order_index ?? -1) + 1,
      })
      .eq('id', linkId)
      .eq('profile_id', profile.id);

    return { success: true };
  },

  // --- Appearance actions ---

  selectTheme: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single();
    if (!profile) return fail(404);

    const fd = await request.formData();
    const themeId = fd.get('themeId') as string;

    const { data: theme } = await admin
      .from('themes')
      .select('is_pro')
      .eq('id', themeId)
      .single();

    if (theme?.is_pro && profile.plan !== 'PRO') {
      return fail(403, { error: 'This theme requires Pro' });
    }

    await admin
      .from('profiles')
      .update({ theme_id: themeId })
      .eq('id', profile.id);
    return { success: true };
  },

  updateHeaderMode: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single();
    if (!profile) return fail(404);

    const fd = await request.formData();
    const mode = fd.get('headerMode') as HeaderMode;

    if (
      (mode === 'HERO' || mode === 'AVATAR_HERO') &&
      !canUseHero(profile.plan)
    ) {
      return fail(403, { error: 'Hero header requires Pro' });
    }

    await admin
      .from('profiles')
      .update({ header_mode: mode })
      .eq('id', profile.id);
    return { success: true };
  },

  uploadHero: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single();
    if (!profile) return fail(404);

    if (!canUseHero(profile.plan)) {
      return fail(403, { error: 'Hero image requires Pro' });
    }

    const fd = await request.formData();
    const file = fd.get('hero') as File;
    if (!file || file.size === 0) return fail(400, { error: 'No file' });
    if (file.size > 5 * 1024 * 1024) {
      return fail(400, { error: 'Max 5MB' });
    }

    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${user.id}/hero.${ext}`;

    await admin.storage.from('heroes').upload(path, file, { upsert: true });

    const {
      data: { publicUrl },
    } = admin.storage.from('heroes').getPublicUrl(path);

    await admin
      .from('profiles')
      .update({ hero_url: publicUrl })
      .eq('id', profile.id);
    return { success: true };
  },

  updateDisplayTitle: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single();
    if (!profile) return fail(404);

    if (!canUseCustomTitle(profile.plan)) {
      return fail(403, { error: 'Custom title requires Pro' });
    }

    const fd = await request.formData();
    const title = (fd.get('displayTitle') as string)?.trim().slice(0, 60) || null;

    await admin
      .from('profiles')
      .update({ display_title: title })
      .eq('id', profile.id);
    return { success: true };
  },

  updateBio: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('owner_id', user.id)
      .single();
    if (!profile) return fail(404);

    const fd = await request.formData();
    const bio = (fd.get('bio') as string)?.trim().slice(0, 300) || null;

    await admin
      .from('profiles')
      .update({ bio })
      .eq('id', profile.id);
    return { success: true };
  },

  updateContact: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('owner_id', user.id)
      .single();
    if (!profile) return fail(404);

    const fd = await request.formData();
    const type = fd.get('type') as string;
    const value = (fd.get('value') as string)?.trim();
    const enabled = fd.get('enabled') !== 'false';

    if (!type) return fail(400, { error: 'Missing contact type' });

    if (!value && !enabled) {
      // Delete contact only when disabling with no value
      await admin
        .from('profile_contacts')
        .delete()
        .eq('profile_id', profile.id)
        .eq('type', type);
      return { success: true };
    }

    // Upsert
    const { data: existing } = await admin
      .from('profile_contacts')
      .select('id')
      .eq('profile_id', profile.id)
      .eq('type', type)
      .maybeSingle();

    if (existing) {
      await admin
        .from('profile_contacts')
        .update({ value, is_enabled: enabled })
        .eq('id', existing.id);
    } else {
      const { data: maxC } = await admin
        .from('profile_contacts')
        .select('order_index')
        .eq('profile_id', profile.id)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      await admin.from('profile_contacts').insert({
        profile_id: profile.id,
        type,
        value,
        order_index: (maxC?.order_index ?? -1) + 1,
        is_enabled: enabled,
      });
    }
    return { success: true };
  },

  updateLayout: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single();
    if (!profile) return fail(404);

    const fd = await request.formData();
    const layout = fd.get('layout') as MainLinksLayout;

    if (
      PRO_LAYOUTS.includes(layout) &&
      !canUseImageLayouts(profile.plan)
    ) {
      return fail(403, { error: 'This layout requires Pro' });
    }

    await admin
      .from('profiles')
      .update({ main_links_layout: layout })
      .eq('id', profile.id);
    return { success: true };
  },

  selectBackground: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single();
    if (!profile) return fail(404);

    const fd = await request.formData();
    const bgId = fd.get('backgroundId') as string;

    const { data: bg } = await admin
      .from('backgrounds')
      .select('is_pro')
      .eq('id', bgId)
      .single();

    if (bg?.is_pro && !canUsePremiumBackground(profile.plan)) {
      return fail(403, { error: 'This background requires Pro' });
    }

    await admin
      .from('profiles')
      .update({ background_id: bgId })
      .eq('id', profile.id);
    return { success: true };
  },

  selectFont: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single();
    if (!profile) return fail(404);

    const fd = await request.formData();
    const fontId = fd.get('fontId') as string;

    const { data: font } = await admin
      .from('fonts')
      .select('is_pro')
      .eq('id', fontId)
      .single();

    if (font?.is_pro && !canUsePremiumFont(profile.plan)) {
      return fail(403, { error: 'This font requires Pro' });
    }

    await admin
      .from('profiles')
      .update({ font_id: fontId })
      .eq('id', profile.id);
    return { success: true };
  },

  updateOverrides: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single();
    if (!profile) return fail(404);
    if (profile.plan !== 'PRO') {
      return fail(403, { error: 'Customization requires Pro' });
    }

    const fd = await request.formData();
    const overrides: Record<string, string> = {};
    for (const [key, value] of fd.entries()) {
      if (key.startsWith('override_') && value) {
        overrides[key.replace('override_', '')] = value as string;
      }
    }

    await admin
      .from('profiles')
      .update({ theme_overrides: overrides })
      .eq('id', profile.id);
    return { success: true };
  },

  toggleBranding: async ({ locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('id, plan, branding_enabled')
      .eq('owner_id', user.id)
      .single();
    if (!profile) return fail(404);

    if (!canRemoveBranding(profile.plan)) {
      return fail(403, { error: 'Branding toggle requires Pro' });
    }

    await admin
      .from('profiles')
      .update({ branding_enabled: !profile.branding_enabled })
      .eq('id', profile.id);
    return { success: true };
  },
} satisfies Actions;
