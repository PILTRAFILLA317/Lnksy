import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { createSupabaseAdmin } from '$lib/server/supabase.js';
import { FREE_LINK_LIMIT } from '$lib/types.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { profile } = await parent();
  if (!profile) return { links: [], themes: [] };

  const { data: links } = await locals.supabase
    .from('links')
    .select('*')
    .eq('profile_id', profile.id)
    .order('order_index');

  const { data: themes } = await locals.supabase
    .from('themes')
    .select('*')
    .order('name');

  return {
    links: links ?? [],
    themes: themes ?? [],
  };
};

export const actions = {
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
    const title = (fd.get('title') as string)?.trim();
    const url = (fd.get('url') as string)?.trim();
    const subtitle = (fd.get('subtitle') as string)?.trim() || null;

    if (!title || !url) {
      return fail(400, { error: 'Title and URL are required' });
    }

    // Get max order
    const { data: maxLink } = await admin
      .from('links')
      .select('order_index')
      .eq('profile_id', profile.id)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxLink?.order_index ?? -1) + 1;

    await admin.from('links').insert({
      profile_id: profile.id,
      title,
      url,
      subtitle,
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
    const startAt = (fd.get('startAt') as string) || null;
    const endAt = (fd.get('endAt') as string) || null;
    const highlight = fd.get('highlight') === 'on';

    if (!linkId || !title || !url) {
      return fail(400, { error: 'Missing required fields' });
    }

    await admin
      .from('links')
      .update({ title, url, subtitle, start_at: startAt, end_at: endAt, highlight })
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
      .eq('profile_id', profile.id)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    await admin.from('links').insert({
      profile_id: profile.id,
      title: `${original.title} (copy)`,
      url: original.url,
      subtitle: original.subtitle,
      icon: original.icon,
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
} satisfies Actions;
