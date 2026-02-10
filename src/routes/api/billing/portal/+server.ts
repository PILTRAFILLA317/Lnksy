import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getStripe } from '$lib/server/stripe.js';
import { createSupabaseAdmin } from '$lib/server/supabase.js';
import { APP_BASE_URL } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
  const { userId } = await request.json();

  if (!userId) {
    return json({ error: 'Missing userId' }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data: billing } = await admin
    .from('billing')
    .select('stripe_customer_id')
    .eq('owner_id', userId)
    .maybeSingle();

  if (!billing?.stripe_customer_id) {
    return json({ error: 'No billing record' }, { status: 404 });
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripe_customer_id,
    return_url: `${APP_BASE_URL}/app/billing`,
  });

  return json({ url: session.url });
};
