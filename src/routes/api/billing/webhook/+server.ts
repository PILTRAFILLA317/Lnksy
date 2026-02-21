import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { PUBLIC_CONVEX_SITE_URL } from '$env/static/public';

/**
 * Stripe webhook proxy.
 * Forwards the raw request to the Convex HTTP action which handles
 * signature verification, idempotency, and billing updates.
 */
export const POST: RequestHandler = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature') ?? '';

  if (!sig) {
    return json({ error: 'Missing signature' }, { status: 400 });
  }

  const res = await fetch(`${PUBLIC_CONVEX_SITE_URL}/stripe/webhook`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': sig,
    },
    body,
  });

  const data = await res.json();
  return json(data, { status: res.status });
};
