import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { createSupabaseAdmin } from '$lib/server/supabase.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { profile } = await parent();

  const { data: themes } = await locals.supabase
    .from('themes')
    .select('*')
    .order('is_pro', { ascending: true })
    .order('name');

  return { themes: themes ?? [] };
};

export const actions = {
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

    // Check if theme is pro
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

    if (profile.plan !== 'PRO') {
      return fail(403, { error: 'Branding toggle requires Pro' });
    }

    await admin
      .from('profiles')
      .update({ branding_enabled: !profile.branding_enabled })
      .eq('id', profile.id);

    return { success: true };
  },
} satisfies Actions;
