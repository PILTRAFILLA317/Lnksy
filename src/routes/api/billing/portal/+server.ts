import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getStripe } from '$lib/server/stripe.js';
import { createConvexClient } from '$lib/server/convex.js';
import { api } from '$convex/_generated/api.js';
import { APP_BASE_URL } from '$env/dynamic/private';
import type { Id } from '$convex/_generated/dataModel.js';

export const POST: RequestHandler = async ({ request }) => {
  const { userId } = await request.json();

  if (!userId) {
    return json({ error: 'Missing userId' }, { status: 400 });
  }

  if (!APP_BASE_URL?.trim()) {
    return json({ error: 'Billing is not configured: APP_BASE_URL is missing' }, { status: 503 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (error) {
    console.error('Billing portal unavailable:', error);
    return json({ error: 'Billing is not configured: STRIPE_SECRET_KEY is missing' }, { status: 503 });
  }

  const convex = createConvexClient();
  const uid = userId as Id<"users">;
  const billingDoc = await convex.query(api.billing.getOwn, { userId: uid });

  if (!billingDoc?.stripeCustomerId) {
    return json({ error: 'No billing record' }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: billingDoc.stripeCustomerId,
    return_url: `${APP_BASE_URL}/app/billing`,
  });

  return json({ url: session.url });
};
