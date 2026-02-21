import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { api } from '$convex/_generated/api.js';
import type { Id } from '$convex/_generated/dataModel.js';
import { clearSessionCookie, getSessionToken, hashToken } from '$lib/server/auth.js';

export const load: PageServerLoad = async ({ parent }) => {
  const { profile } = await parent();
  return { profile };
};

export const actions = {
  updateProfile: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401);

    const userId = user.id as Id<"users">;
    const fd = await request.formData();
    const name = (fd.get('name') as string)?.trim() || undefined;
    const bio = (fd.get('bio') as string)?.trim() || undefined;

    try {
      await locals.convex.mutation(api.profiles.update, { userId, name, bio });
    } catch (e: any) {
      return fail(400, { error: e?.message ?? 'Update failed' });
    }

    return { success: true };
  },

  uploadAvatar: async ({ request, locals, fetch }) => {
    const user = locals.user;
    if (!user) return fail(401);

    const userId = user.id as Id<"users">;
    const fd = await request.formData();
    const file = fd.get('avatar') as File;

    if (!file || file.size === 0) {
      return fail(400, { error: 'No file provided' });
    }

    if (file.size > 2 * 1024 * 1024) {
      return fail(400, { error: 'File too large (max 2MB)' });
    }

    if (!file.type.startsWith('image/')) {
      return fail(400, { error: 'Must be an image' });
    }

    let uploadUrl: string;
    try {
      uploadUrl = await locals.convex.mutation(api.files.generateUploadUrl, { userId });
    } catch {
      return fail(500, { error: 'Failed to get upload URL' });
    }

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadRes.ok) {
      return fail(500, { error: 'Upload failed' });
    }

    const { storageId } = await uploadRes.json();
    const avatarUrl = await locals.convex.mutation(api.files.getFileUrl, { storageId });

    try {
      await locals.convex.mutation(api.profiles.updateAvatar, {
        userId,
        avatarUrl: avatarUrl ?? '',
      });
    } catch (e: any) {
      return fail(500, { error: e?.message ?? 'Failed to save avatar' });
    }

    return { success: true };
  },

  deleteAccount: async ({ locals, cookies }) => {
    const user = locals.user;
    if (!user) return fail(401);

    const userId = user.id as Id<"users">;

    try {
      await locals.convex.mutation(api.profiles.softDelete, { userId });
    } catch (e: any) {
      return fail(500, { error: e?.message ?? 'Delete failed' });
    }

    // Clear session
    const rawToken = getSessionToken(cookies);
    if (rawToken) {
      try {
        await locals.convex.mutation(api.customAuth.logout, {
          tokenHash: hashToken(rawToken),
        });
      } catch { /* ignore */ }
    }
    clearSessionCookie(cookies);

    redirect(303, '/');
  },
} satisfies Actions;
