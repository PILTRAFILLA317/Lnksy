import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createSupabaseAdmin } from '$lib/server/supabase.js';
import { validateHandle } from '$lib/utils/handle.js';
import { rateLimit } from '$lib/server/rate-limit.js';

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
  const ip = getClientAddress();
  if (!rateLimit(`handle-check:${ip}`)) {
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

  const supabase = createSupabaseAdmin();

  // Check reserved slugs
  const { data: reserved } = await supabase
    .from('reserved_slugs')
    .select('slug')
    .eq('slug', handle)
    .maybeSingle();

  if (reserved) {
    return json({ available: false, error: 'Reserved' });
  }

  // Check existing profiles
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('handle', handle)
    .maybeSingle();

  return json({ available: !existing });
};
