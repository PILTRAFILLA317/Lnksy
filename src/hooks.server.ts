import type { Handle } from '@sveltejs/kit';
import {
  createSupabaseServerClient,
  supabaseConfigured,
} from '$lib/server/supabase.js';

export const handle: Handle = async ({ event, resolve }) => {
  if (!supabaseConfigured()) {
    // Supabase not configured — let pages render without auth
    event.locals.safeGetSession = async () => ({
      session: null,
      user: null,
    });
    event.locals.session = null;
    event.locals.user = null;
    return resolve(event);
  }

  event.locals.supabase = createSupabaseServerClient(event.cookies);

  event.locals.safeGetSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession();
    if (!session) return { session: null, user: null };

    const {
      data: { user },
      error,
    } = await event.locals.supabase.auth.getUser();
    if (error) return { session: null, user: null };

    return { session, user };
  };

  const { session, user } = await event.locals.safeGetSession();
  event.locals.session = session;
  event.locals.user = user;

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return (
        name === 'content-range' ||
        name === 'x-supabase-api-version'
      );
    },
  });
};
