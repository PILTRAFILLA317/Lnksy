import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { createSupabaseAdmin } from '$lib/server/supabase.js';
import { resolveEffectiveProfile } from '$lib/utils/plan.js';

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

  const effective = resolveEffectiveProfile(profile);

  // Get active links within scheduling window
  const now = new Date().toISOString();
  const [
    { data: links },
    { data: theme },
    { data: contacts },
    { data: font },
    { data: background },
  ] = await Promise.all([
    admin
      .from('links')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('is_active', true)
      .or(`start_at.is.null,start_at.lte.${now}`)
      .or(`end_at.is.null,end_at.gt.${now}`)
      .order('order_index'),
    admin
      .from('themes')
      .select('*')
      .eq('id', profile.theme_id)
      .single(),
    admin
      .from('profile_contacts')
      .select('*')
      .eq('profile_id', profile.id)
      .order('order_index'),
    admin
      .from('fonts')
      .select('*')
      .eq('id', profile.font_id)
      .maybeSingle(),
    admin
      .from('backgrounds')
      .select('*')
      .eq('id', profile.background_id)
      .maybeSingle(),
  ]);

  // If font is PRO and user is FREE, fall back to null (use theme default)
  const effectiveFont =
    font && font.is_pro && profile.plan !== 'PRO' ? null : font;

  // If background is PRO and user is FREE, fall back to null
  const effectiveBackground =
    background && background.is_pro && profile.plan !== 'PRO'
      ? null
      : background;

  return {
    profile,
    effective,
    links: links ?? [],
    theme,
    contacts: contacts ?? [],
    font: effectiveFont,
    background: effectiveBackground,
  };
};
