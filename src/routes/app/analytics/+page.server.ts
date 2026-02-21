import type { PageServerLoad } from './$types.js';
import { api } from '$convex/_generated/api.js';
import { daysAgo } from '$lib/utils/helpers.js';
import { mapDailyProfileStat, mapDailyLinkStat } from '$lib/utils/convex-mappers.js';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
  const { profile } = await parent();
  if (!profile) return { stats: [], linkStats: [], links: [], range: 7 };

  const isPro = profile.plan === 'PRO';
  const range = isPro ? (url.searchParams.get('range') ?? '7') : '7';
  const days = parseInt(range, 10);
  const since = daysAgo(days);

  const profileId = profile.id as any;

  // Profile stats
  const statsDocs = await locals.convex.query(api.analytics.getProfileStats, {
    profileId,
    since,
  });

  const stats = (statsDocs ?? []).map(mapDailyProfileStat);

  // Link stats (Pro only)
  let linkStats: Array<{ link_id: string; date: string; clicks: number }> = [];

  if (isPro) {
    const linkDocs = await locals.convex.query(api.links.getByProfile, { profileId });
    const linkIds = (linkDocs ?? []).map((l: any) => l._id);

    if (linkIds.length > 0) {
      const rawLinkStats = await locals.convex.query(api.analytics.getLinkStats, {
        linkIds,
        since,
      });
      linkStats = (rawLinkStats ?? []).map(mapDailyLinkStat);
    }
  }

  // All links for display
  const allLinkDocs = await locals.convex.query(api.links.getByProfile, { profileId });
  const links = (allLinkDocs ?? []).map((l: any) => ({ id: l._id, title: l.title }));

  return {
    stats,
    linkStats,
    links,
    range: days,
  };
};
