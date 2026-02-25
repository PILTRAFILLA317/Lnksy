import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { api } from '$convex/_generated/api.js';
import { validateHandle } from '$lib/utils/handle.js';
import type { Id } from '$convex/_generated/dataModel.js';

export const load: PageServerLoad = async ({ url, locals }) => {
  const user = locals.user;
  if (!user) redirect(303, '/auth/login');

  const existing = await locals.convex.query(api.profiles.getOwn, {
    userId: user.id as Id<"users">,
  });
  if (existing) redirect(303, '/app');

  const handle = url.searchParams.get('handle') ?? '';
  return { handle };
};

export const actions = {
  default: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const handle = (formData.get('handle') as string)?.toLowerCase().trim();
    const confirmed = formData.get('confirmed') === 'on';

    if (!confirmed) {
      return fail(400, { error: 'You must confirm you understand', handle });
    }

    const validation = validateHandle(handle);
    if (!validation.valid) {
      return fail(400, { error: validation.error, handle });
    }

    const userId = user.id as Id<"users">;
    try {
      await locals.convex.mutation(api.profiles.create, {
        userId,
        handle,
        name: undefined,
      });
    } catch (e: any) {
      const msg = e?.message ?? e?.data ?? 'Failed to create profile. Try again.';
      return fail(400, { error: msg, handle });
    }

    // Redirect to template selection — Minimal is applied as default if skipped
    redirect(303, '/app/onboarding/template');
  },
} satisfies Actions;
