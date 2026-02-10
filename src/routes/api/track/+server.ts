import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createSupabaseAdmin } from '$lib/server/supabase.js';
import { rateLimit } from '$lib/server/rate-limit.js';

export const POST: RequestHandler = async ({
  request,
  getClientAddress,
}) => {
  const ip = getClientAddress();
  if (!rateLimit(`track:${ip}`)) {
    return json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await request.json();
  const { type, profileId, linkId, anonId } = body;

  if (!profileId || !anonId) {
    return json({ error: 'Missing fields' }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const today = new Date().toISOString().split('T')[0];

  if (type === 'page_view') {
    // Check if this is a unique visit (dedup by session)
    const { data: existing } = await admin
      .from('analytics_sessions')
      .select('id, last_seen_at')
      .eq('profile_id', profileId)
      .eq('anon_id', anonId)
      .maybeSingle();

    let isUnique = false;

    if (!existing) {
      // New session
      isUnique = true;
      await admin.from('analytics_sessions').insert({
        profile_id: profileId,
        anon_id: anonId,
      });
    } else {
      // Check if last seen was > 30 min ago
      const lastSeen = new Date(existing.last_seen_at).getTime();
      const thirtyMinAgo = Date.now() - 30 * 60 * 1000;

      if (lastSeen < thirtyMinAgo) {
        isUnique = true;
      }

      await admin
        .from('analytics_sessions')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', existing.id);
    }

    // Upsert daily stats
    const { data: stat } = await admin
      .from('daily_profile_stats')
      .select('views, uniques')
      .eq('profile_id', profileId)
      .eq('date', today)
      .maybeSingle();

    if (stat) {
      await admin
        .from('daily_profile_stats')
        .update({
          views: stat.views + 1,
          uniques: isUnique ? stat.uniques + 1 : stat.uniques,
        })
        .eq('profile_id', profileId)
        .eq('date', today);
    } else {
      await admin.from('daily_profile_stats').insert({
        profile_id: profileId,
        date: today,
        views: 1,
        uniques: isUnique ? 1 : 0,
        clicks: 0,
      });
    }

    return json({ ok: true });
  }

  if (type === 'link_click') {
    if (!linkId) {
      return json({ error: 'Missing linkId' }, { status: 400 });
    }

    // Increment profile clicks
    const { data: profileStat } = await admin
      .from('daily_profile_stats')
      .select('clicks')
      .eq('profile_id', profileId)
      .eq('date', today)
      .maybeSingle();

    if (profileStat) {
      await admin
        .from('daily_profile_stats')
        .update({ clicks: profileStat.clicks + 1 })
        .eq('profile_id', profileId)
        .eq('date', today);
    } else {
      await admin.from('daily_profile_stats').insert({
        profile_id: profileId,
        date: today,
        views: 0,
        uniques: 0,
        clicks: 1,
      });
    }

    // Increment link clicks
    const { data: linkStat } = await admin
      .from('daily_link_stats')
      .select('clicks')
      .eq('link_id', linkId)
      .eq('date', today)
      .maybeSingle();

    if (linkStat) {
      await admin
        .from('daily_link_stats')
        .update({ clicks: linkStat.clicks + 1 })
        .eq('link_id', linkId)
        .eq('date', today);
    } else {
      await admin.from('daily_link_stats').insert({
        link_id: linkId,
        date: today,
        clicks: 1,
      });
    }

    return json({ ok: true });
  }

  return json({ error: 'Invalid type' }, { status: 400 });
};
