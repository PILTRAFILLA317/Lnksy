import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getStripe } from '$lib/server/stripe.js';
import { createSupabaseAdmin } from '$lib/server/supabase.js';
import {
  STRIPE_PRICE_ID_MONTHLY,
  STRIPE_PRICE_ID_YEARLY,
} from '$env/dynamic/private';
import { APP_BASE_URL } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
  const { userId, email, period } = await request.json();

  if (!userId || !email) {
    return json({ error: 'Missing fields' }, { status: 400 });
  }

  const stripe = getStripe();
  const admin = createSupabaseAdmin();

  // Check or create billing record
  const { data: billing } = await admin
    .from('billing')
    .select('stripe_customer_id')
    .eq('owner_id', userId)
    .maybeSingle();

  let customerId = billing?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });
    customerId = customer.id;

    await admin
      .from('billing')
      .update({ stripe_customer_id: customerId })
      .eq('owner_id', userId);
  }

  const priceId =
    period === 'yearly' ? STRIPE_PRICE_ID_YEARLY : STRIPE_PRICE_ID_MONTHLY;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_BASE_URL}/app/billing?success=true`,
    cancel_url: `${APP_BASE_URL}/app/billing?canceled=true`,
    metadata: { userId },
  });

  return json({ url: session.url });
};
