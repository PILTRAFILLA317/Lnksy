import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { api } from '$convex/_generated/api.js';
import type { Id } from '$convex/_generated/dataModel.js';

export const POST: RequestHandler = async ({ request, locals, fetch }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id as Id<"users">;
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return json({ error: 'No file' }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return json({ error: 'File too large' }, { status: 400 });
  }

  let uploadUrl: string;
  try {
    uploadUrl = await locals.convex.mutation(api.files.generateUploadUrl, { userId });
  } catch {
    return json({ error: 'Failed to get upload URL' }, { status: 500 });
  }

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadRes.ok) {
    return json({ error: 'Upload failed' }, { status: 500 });
  }

  const { storageId } = await uploadRes.json();
  const url = await locals.convex.mutation(api.files.getFileUrl, { storageId });

  return json({ url });
};
