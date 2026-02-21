import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { api } from '$convex/_generated/api.js';
import { mapBilling } from '$lib/utils/convex-mappers.js';
import type { Id } from '$convex/_generated/dataModel.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { profile, user } = await parent();
  if (!profile || !user) return { billing: null };

  const userId = user.id as Id<"users">;
  const billingDoc = await locals.convex.query(api.billing.getOwn, { userId });
  const billing = billingDoc ? mapBilling(billingDoc) : null;

  return { billing };
};

export const actions = {
  checkout: async ({ locals, url }) => {
    const user = locals.user;
    if (!user) return fail(401);

    const period = url.searchParams.get('period') ?? 'monthly';

    const res = await fetch(`${url.origin}/api/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        period,
      }),
    });

    const { url: checkoutUrl } = await res.json();
    if (checkoutUrl) redirect(303, checkoutUrl);
    return fail(500, { error: 'Failed to create checkout' });
  },

  portal: async ({ locals, url }) => {
    const user = locals.user;
    if (!user) return fail(401);

    const res = await fetch(`${url.origin}/api/billing/portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });

    const { url: portalUrl } = await res.json();
    if (portalUrl) redirect(303, portalUrl);
    return fail(500, { error: 'Failed to open portal' });
  },
} satisfies Actions;
