import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { api } from '$convex/_generated/api.js';
import { validateHandle } from '$lib/utils/handle.js';
import { rateLimit } from '$lib/server/rate-limit.js';

export const GET: RequestHandler = async ({ url, getClientAddress, locals }) => {
  const ip = getClientAddress();
  if (!rateLimit('default', ip)) {
    return json({ error: 'Too many requests' }, { status: 429 });
  }

  const handle = url.searchParams.get('handle')?.toLowerCase();
  if (!handle) {
    return json({ available: false, error: 'Missing handle' });
  }

  const validation = validateHandle(handle);
  if (!validation.valid) {
    return json({ available: false, error: validation.error });
  }

  const result = await locals.convex.query(api.profiles.checkHandle, { handle });

  return json({ available: result.available, error: result.error });
};
