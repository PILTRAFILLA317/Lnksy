import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getStripe } from '$lib/server/stripe.js';
import { createSupabaseAdmin } from '$lib/server/supabase.js';
import { STRIPE_WEBHOOK_SECRET } from '$env/dynamic/private';
import type Stripe from 'stripe';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Idempotency check
  const { data: existing } = await admin
    .from('stripe_webhook_events')
    .select('event_id')
    .eq('event_id', event.id)
    .maybeSingle();

  if (existing) {
    return json({ received: true, duplicate: true });
  }

  await admin
    .from('stripe_webhook_events')
    .insert({ event_id: event.id });

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        await admin
          .from('billing')
          .update({
            subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            status: 'active',
            plan: 'PRO',
          })
          .eq('owner_id', userId);

        await admin
          .from('profiles')
          .update({ plan: 'PRO' })
          .eq('owner_id', userId);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const { data: billing } = await admin
        .from('billing')
        .select('owner_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();

      if (billing) {
        const isActive =
          sub.status === 'active' || sub.status === 'trialing';
        const plan = isActive ? 'PRO' : 'FREE';

        await admin
          .from('billing')
          .update({
            status: sub.status as string,
            plan,
            current_period_end: new Date(
              sub.current_period_end * 1000
            ).toISOString(),
          })
          .eq('owner_id', billing.owner_id);

        await admin
          .from('profiles')
          .update({ plan })
          .eq('owner_id', billing.owner_id);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const { data: billing } = await admin
        .from('billing')
        .select('owner_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();

      if (billing) {
        await admin
          .from('billing')
          .update({
            status: 'canceled',
            plan: 'FREE',
            subscription_id: null,
            current_period_end: null,
          })
          .eq('owner_id', billing.owner_id);

        await admin
          .from('profiles')
          .update({ plan: 'FREE' })
          .eq('owner_id', billing.owner_id);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await admin
        .from('billing')
        .update({ status: 'past_due' })
        .eq('stripe_customer_id', customerId);
      break;
    }
  }

  return json({ received: true });
};
