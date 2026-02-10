import type { PageServerLoad } from './$types.js';
import { daysAgo } from '$lib/utils/helpers.js';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
  const { profile } = await parent();
  if (!profile) return { stats: [], linkStats: [], links: [] };

  const isPro = profile.plan === 'PRO';
  const range = isPro
    ? (url.searchParams.get('range') ?? '7')
    : '7';
  const days = parseInt(range, 10);
  const since = daysAgo(days);

  // Profile stats
  const { data: stats } = await locals.supabase
    .from('daily_profile_stats')
    .select('*')
    .eq('profile_id', profile.id)
    .gte('date', since)
    .order('date');

  // Link stats (Pro only)
  let linkStats: Array<{ link_id: string; date: string; clicks: number }> = [];
  if (isPro) {
    const { data: links } = await locals.supabase
      .from('links')
      .select('id')
      .eq('profile_id', profile.id);

    if (links?.length) {
      const linkIds = links.map((l: { id: string }) => l.id);
      const { data } = await locals.supabase
        .from('daily_link_stats')
        .select('*')
        .in('link_id', linkIds)
        .gte('date', since)
        .order('date');
      linkStats = data ?? [];
    }
  }

  // All links for display
  const { data: allLinks } = await locals.supabase
    .from('links')
    .select('id, title')
    .eq('profile_id', profile.id)
    .order('order_index');

  return {
    stats: stats ?? [],
    linkStats,
    links: allLinks ?? [],
    range: days,
  };
};
