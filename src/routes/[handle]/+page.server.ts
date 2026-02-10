import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { createSupabaseAdmin } from '$lib/server/supabase.js';

export const load: PageServerLoad = async ({ params }) => {
  const admin = createSupabaseAdmin();

  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('handle', params.handle)
    .is('deleted_at', null)
    .maybeSingle();

  if (!profile) {
    error(404, 'Profile not found');
  }

  // Get active links within scheduling window
  const now = new Date().toISOString();
  const { data: links } = await admin
    .from('links')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('is_active', true)
    .or(`start_at.is.null,start_at.lte.${now}`)
    .or(`end_at.is.null,end_at.gt.${now}`)
    .order('order_index');

  // Get theme
  const { data: theme } = await admin
    .from('themes')
    .select('*')
    .eq('id', profile.theme_id)
    .single();

  return {
    profile,
    links: links ?? [],
    theme,
  };
};
