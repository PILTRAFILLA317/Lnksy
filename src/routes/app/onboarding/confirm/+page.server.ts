import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { createSupabaseAdmin } from '$lib/server/supabase.js';
import { validateHandle } from '$lib/utils/handle.js';

export const load: PageServerLoad = async ({ url, locals }) => {
  const { user } = await locals.safeGetSession();
  if (!user) redirect(303, '/auth');

  // If user already has a profile, redirect to app
  const { data: existing } = await locals.supabase
    .from('profiles')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (existing) redirect(303, '/app');

  const handle = url.searchParams.get('handle') ?? '';
  return { handle };
};

export const actions = {
  default: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const handle = (formData.get('handle') as string)
      ?.toLowerCase()
      .trim();
    const confirmed = formData.get('confirmed') === 'on';

    if (!confirmed) {
      return fail(400, {
        error: 'You must confirm you understand',
        handle,
      });
    }

    const validation = validateHandle(handle);
    if (!validation.valid) {
      return fail(400, { error: validation.error, handle });
    }

    const admin = createSupabaseAdmin();

    // Check reserved
    const { data: reserved } = await admin
      .from('reserved_slugs')
      .select('slug')
      .eq('slug', handle)
      .maybeSingle();

    if (reserved) {
      return fail(400, { error: 'This handle is reserved', handle });
    }

    // Check taken
    const { data: taken } = await admin
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .maybeSingle();

    if (taken) {
      return fail(400, {
        error: 'This handle is already taken',
        handle,
      });
    }

    // Create profile
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .insert({
        owner_id: user.id,
        handle,
        name: user.user_metadata?.full_name ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        theme_id: 'default',
        plan: 'FREE',
      })
      .select()
      .single();

    if (profileErr) {
      return fail(500, {
        error: 'Failed to create profile. Try again.',
        handle,
      });
    }

    // Create example links
    await admin.from('links').insert([
      {
        profile_id: profile.id,
        title: 'My Website',
        url: 'https://example.com',
        order_index: 0,
      },
      {
        profile_id: profile.id,
        title: 'Twitter',
        url: 'https://twitter.com',
        order_index: 1,
      },
      {
        profile_id: profile.id,
        title: 'Instagram',
        url: 'https://instagram.com',
        order_index: 2,
      },
    ]);

    // Create billing record
    await admin.from('billing').insert({
      owner_id: user.id,
      profile_id: profile.id,
      plan: 'FREE',
      status: 'inactive',
    });

    redirect(303, '/app');
  },
} satisfies Actions;
