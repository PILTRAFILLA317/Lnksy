import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { createSupabaseAdmin } from '$lib/server/supabase.js';

export const load: PageServerLoad = async ({ parent }) => {
  const { profile } = await parent();
  return { profile };
};

export const actions = {
  updateProfile: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();
    const fd = await request.formData();

    const name = (fd.get('name') as string)?.trim() || null;
    const bio = (fd.get('bio') as string)?.trim() || null;

    await admin
      .from('profiles')
      .update({ name, bio })
      .eq('owner_id', user.id);

    return { success: true };
  },

  uploadAvatar: async ({ request, locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

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

    const admin = createSupabaseAdmin();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadErr } = await admin.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      return fail(500, { error: 'Upload failed' });
    }

    const {
      data: { publicUrl },
    } = admin.storage.from('avatars').getPublicUrl(path);

    await admin
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('owner_id', user.id);

    return { success: true };
  },

  deleteAccount: async ({ locals }) => {
    const { user } = await locals.safeGetSession();
    if (!user) return fail(401);

    const admin = createSupabaseAdmin();

    // Soft delete
    await admin
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('owner_id', user.id);

    // Sign out
    await locals.supabase.auth.signOut();

    return { success: true, deleted: true };
  },
} satisfies Actions;
