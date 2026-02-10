import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { profile, user } = await parent();
  if (!profile || !user) return { billing: null };

  const { data: billing } = await locals.supabase
    .from('billing')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  return { billing };
};

export const actions = {
  checkout: async ({ locals, url }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const period = url.searchParams.get('period') ?? 'monthly';

    const res = await fetch(
      `${url.origin}/api/billing/checkout`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          period,
        }),
      }
    );

    const { url: checkoutUrl } = await res.json();
    if (checkoutUrl) redirect(303, checkoutUrl);
    return fail(500, { error: 'Failed to create checkout' });
  },

  portal: async ({ locals, url }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const res = await fetch(
      `${url.origin}/api/billing/portal`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      }
    );

    const { url: portalUrl } = await res.json();
    if (portalUrl) redirect(303, portalUrl);
    return fail(500, { error: 'Failed to open portal' });
  },
} satisfies Actions;
