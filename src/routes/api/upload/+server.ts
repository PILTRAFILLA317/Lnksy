import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createSupabaseAdmin } from '$lib/server/supabase.js';
import { createSupabaseServerClient } from '$lib/server/supabase.js';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return json({ error: 'No file' }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return json({ error: 'File too large' }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadErr } = await admin.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (uploadErr) {
    return json({ error: 'Upload failed' }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from('avatars').getPublicUrl(path);

  return json({ url: publicUrl });
};
