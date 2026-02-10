import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({
  locals,
  depends,
}) => {
  depends('supabase:auth');
  const { session, user } = await locals.safeGetSession();
  return { session, user };
};
