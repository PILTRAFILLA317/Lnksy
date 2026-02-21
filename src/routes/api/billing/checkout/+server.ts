import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getStripe } from '$lib/server/stripe.js';
import { createConvexClient } from '$lib/server/convex.js';
import { api } from '$convex/_generated/api.js';
import type { Id } from '$convex/_generated/dataModel.js';
import {
  STRIPE_PRICE_ID_MONTHLY,
  STRIPE_PRICE_ID_YEARLY,
  APP_BASE_URL,
} from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
  const { userId, email, period } = await request.json();

  if (!userId || !email) {
    return json({ error: 'Missing fields' }, { status: 400 });
  }

  if (!APP_BASE_URL?.trim()) {
    return json({ error: 'Billing is not configured: APP_BASE_URL is missing' }, { status: 503 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (error) {
    console.error('Billing checkout unavailable:', error);
    return json({ error: 'Billing is not configured: STRIPE_SECRET_KEY is missing' }, { status: 503 });
  }

  const convex = createConvexClient();
  const uid = userId as Id<"users">;

  // Ensure billing record exists
  await convex.mutation(api.billing.ensureBillingRecord, { userId: uid });

  // Get billing record to find existing Stripe customer
  const billingDoc = await convex.query(api.billing.getOwn, { userId: uid });
  let customerId = billingDoc?.stripeCustomerId ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });
    customerId = customer.id;

    await convex.mutation(api.billing.setStripeCustomer, {
      userId: uid,
      stripeCustomerId: customerId,
    });
  }

  const priceId =
    period === 'yearly' ? STRIPE_PRICE_ID_YEARLY : STRIPE_PRICE_ID_MONTHLY;

  if (!priceId?.trim()) {
    return json(
      { error: 'Billing is not configured: Stripe price ID is missing for selected period' },
      { status: 503 }
    );
  }

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
