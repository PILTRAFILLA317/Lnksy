import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createSupabaseServerClient } from '$lib/server/supabase.js';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const handle = url.searchParams.get('handle');
  const redirectParam = url.searchParams.get('redirect');
  const redirectTarget =
    redirectParam && redirectParam.startsWith('/')
      ? redirectParam
      : null;

  const supabase = createSupabaseServerClient(cookies);

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (tokenHash && type) {
    await supabase.auth.verifyOtp({
      type: type as
        | 'magiclink'
        | 'signup'
        | 'invite'
        | 'recovery'
        | 'email_change',
      token_hash: tokenHash,
    });
  }

  // Check if user already has a profile
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (profile) {
      redirect(303, redirectTarget ?? '/app');
    }
  }

  if (handle) {
    redirect(303, `/app/onboarding/confirm?handle=${handle}`);
  }

  redirect(303, '/app/onboarding/confirm');
};
