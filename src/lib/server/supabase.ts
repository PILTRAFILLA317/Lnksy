import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Cookies } from '@sveltejs/kit';
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
} from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

function getSupabaseEnv() {
  const url = PUBLIC_SUPABASE_URL;
  const anonKey = PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY. ' +
        'Copy .env.example to .env and fill in your Supabase credentials.'
    );
  }
  return { url, anonKey };
}

export function supabaseConfigured(): boolean {
  return !!PUBLIC_SUPABASE_URL && !!PUBLIC_SUPABASE_ANON_KEY;
}

export function createSupabaseServerClient(cookies: Cookies) {
  const { url, anonKey } = getSupabaseEnv();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, {
            ...options,
            path: '/',
          });
        });
      },
    },
  });
}

export function createSupabaseAdmin() {
  const { url } = getSupabaseEnv();
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY env var.');
  }
  return createClient(url, SUPABASE_SERVICE_ROLE_KEY);
}
