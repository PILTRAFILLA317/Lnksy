import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { api } from '$convex/_generated/api.js';
import type { Id } from '$convex/_generated/dataModel.js';

export const load: PageServerLoad = async ({ locals }) => {
  const templates = await locals.convex.query(api.templates.listTemplates, {});
  return { templates: templates ?? [] };
};

export const actions = {
  apply: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: 'Not authenticated' });

    const fd = await request.formData();
    const templateId = (fd.get('templateId') as string)?.trim();

    if (!templateId) return fail(400, { error: 'Template ID is required' });

    try {
      const result = await locals.convex.mutation(api.templates.applyTemplate, {
        userId: user.id as Id<'users'>,
        templateId,
      });
      return {
        success: true,
        savedLinksCount: result.savedLinksCount,
        templateId,
      };
    } catch (e: any) {
      const msg = e?.message ?? e?.data ?? 'Failed to apply template';
      return fail(400, { error: msg });
    }
  },
} satisfies Actions;
