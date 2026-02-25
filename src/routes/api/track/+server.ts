import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createConvexClient } from '$lib/server/convex.js';
import { api } from '$convex/_generated/api.js';
import { rateLimit } from '$lib/server/rate-limit.js';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const ip = getClientAddress();
  if (!rateLimit(`track:${ip}`)) {
    return json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await request.json();
  const { type, profileId, linkId, anonId, contactType, contactId } = body;

  if (!profileId || !anonId) {
    return json({ error: 'Missing fields' }, { status: 400 });
  }

  // No auth needed — public tracking mutations
  const convex = createConvexClient();

  if (type === 'page_view') {
    await convex.mutation(api.analytics.trackPageView, {
      profileId: profileId as any,
      anonId,
    });
    return json({ ok: true });
  }

  if (type === 'link_click') {
    if (!linkId) {
      return json({ error: 'Missing linkId' }, { status: 400 });
    }
    await convex.mutation(api.analytics.trackLinkClick, {
      profileId: profileId as any,
      linkId: linkId as any,
    });
    return json({ ok: true });
  }

  if (type === 'contact_click') {
    if (!contactType) {
      return json({ error: 'Missing contactType' }, { status: 400 });
    }
    await convex.mutation(api.analytics.trackContactClick, {
      profileId: profileId as any,
      contactType,
      contactId: contactId ?? undefined,
    });
    return json({ ok: true });
  }

  return json({ error: 'Invalid type' }, { status: 400 });
};
