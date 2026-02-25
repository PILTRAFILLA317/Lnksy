import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { api } from '$convex/_generated/api.js';
import type { Id } from '$convex/_generated/dataModel.js';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) redirect(303, '/auth/login');

  // Load template metadata for the picker
  const templates = await locals.convex.query(api.templates.listTemplates, {});
  return { templates: templates ?? [] };
};

export const actions = {
  apply: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) redirect(303, '/auth/login');

    const fd = await request.formData();
    // Fall back to 'minimal' if nothing was selected (skip)
    const templateId = (fd.get('templateId') as string)?.trim() || 'minimal';

    await locals.convex.mutation(api.templates.applyTemplate, {
      userId: user.id as Id<'users'>,
      templateId,
    });

    redirect(303, '/app');
  },
} satisfies Actions;
