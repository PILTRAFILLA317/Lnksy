import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const { user } = await locals.safeGetSession();

  if (!user) {
    redirect(303, `/auth?redirect=${encodeURIComponent(url.pathname)}`);
  }

  // Check if user has a profile
  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  // If no profile and not on onboarding, redirect to onboarding
  if (!profile && !url.pathname.startsWith('/app/onboarding')) {
    redirect(303, '/app/onboarding/confirm');
  }

  return { user, profile };
};
