import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/dynamic/private';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!STRIPE_SECRET_KEY?.trim()) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }

    stripeInstance = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
  }
  return stripeInstance;
}
