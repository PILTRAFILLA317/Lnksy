import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { ConvexError } from "convex/values";

// =============================================================
// Lnksy — Analytics
// Equivalente a /api/track + daily_profile_stats + daily_link_stats
// + analytics_sessions (deduplicación por anonId)
// =============================================================

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Mutations (tracking) ─────────────────────────────────────

/**
 * Trackear page view — equivale a POST /api/track con type='page_view'.
 * Maneja deduplicación de visitas únicas vía analytics_sessions.
 */
export const trackPageView = mutation({
  args: {
    profileId: v.id("profiles"),
    anonId: v.string(),
  },
  handler: async (ctx, { profileId, anonId }) => {
    const today = todayDate();
    const now = Date.now();

    // ── Deduplicación (equivale a la tabla analytics_sessions) ──
    const session = await ctx.db
      .query("analyticsSessions")
      .withIndex("by_profile_anon", (q) =>
        q.eq("profileId", profileId).eq("anonId", anonId),
      )
      .first();

    let isUnique = false;

    if (!session) {
      // Nueva sesión
      isUnique = true;
      await ctx.db.insert("analyticsSessions", {
        profileId,
        anonId,
        lastSeenAt: now,
      });
    } else {
      // Sesión existente: es "única" si pasaron más de 30 min
      if (now - session.lastSeenAt > THIRTY_MINUTES_MS) {
        isUnique = true;
      }
      await ctx.db.patch(session._id, { lastSeenAt: now });
    }

    // ── Upsert daily_profile_stats ──
    const stat = await ctx.db
      .query("dailyProfileStats")
      .withIndex("by_profile_date", (q) =>
        q.eq("profileId", profileId).eq("date", today),
      )
      .first();

    if (stat) {
      await ctx.db.patch(stat._id, {
        views: stat.views + 1,
        uniques: isUnique ? stat.uniques + 1 : stat.uniques,
      });
    } else {
      await ctx.db.insert("dailyProfileStats", {
        profileId,
        date: today,
        views: 1,
        uniques: isUnique ? 1 : 0,
        clicks: 0,
        contactClicks: 0,
      });
    }
  },
});

/**
 * Trackear click en link — equivale a POST /api/track con type='link_click'.
 * Incrementa clicks en daily_profile_stats y daily_link_stats.
 */
export const trackLinkClick = mutation({
  args: {
    profileId: v.id("profiles"),
    linkId: v.id("links"),
  },
  handler: async (ctx, { profileId, linkId }) => {
    const today = todayDate();

    // Incrementar profile clicks
    const profileStat = await ctx.db
      .query("dailyProfileStats")
      .withIndex("by_profile_date", (q) =>
        q.eq("profileId", profileId).eq("date", today),
      )
      .first();

    if (profileStat) {
      await ctx.db.patch(profileStat._id, { clicks: profileStat.clicks + 1 });
    } else {
      await ctx.db.insert("dailyProfileStats", {
        profileId,
        date: today,
        views: 0,
        uniques: 0,
        clicks: 1,
        contactClicks: 0,
      });
    }

    // Incrementar link clicks
    const linkStat = await ctx.db
      .query("dailyLinkStats")
      .withIndex("by_link_date", (q) =>
        q.eq("linkId", linkId).eq("date", today),
      )
      .first();

    if (linkStat) {
      await ctx.db.patch(linkStat._id, { clicks: linkStat.clicks + 1 });
    } else {
      await ctx.db.insert("dailyLinkStats", {
        linkId,
        date: today,
        clicks: 1,
      });
    }
  },
});

/**
 * Trackear click en contacto — equivale a POST /api/track con type='contact_click'.
 * Incrementa contactClicks en daily_profile_stats.
 */
export const trackContactClick = mutation({
  args: {
    profileId: v.id("profiles"),
    contactType: v.string(),
    contactId: v.optional(v.string()),
  },
  handler: async (ctx, { profileId }) => {
    const today = todayDate();

    const stat = await ctx.db
      .query("dailyProfileStats")
      .withIndex("by_profile_date", (q) =>
        q.eq("profileId", profileId).eq("date", today),
      )
      .first();

    if (stat) {
      await ctx.db.patch(stat._id, { contactClicks: stat.contactClicks + 1 });
    } else {
      await ctx.db.insert("dailyProfileStats", {
        profileId,
        date: today,
        views: 0,
        uniques: 0,
        clicks: 0,
        contactClicks: 1,
      });
    }
  },
});

// ─── Queries ─────────────────────────────────────────────────

/**
 * Estadísticas de perfil — equivale al SELECT en /app/analytics.
 * Solo accesible por el dueño del perfil.
 */
export const getProfileStats = query({
  args: {
    userId: v.id("users"),
    profileId: v.id("profiles"),
    since: v.string(),
  },
  handler: async (ctx, { userId, profileId, since }) => {
    const profile = await ctx.db.get(profileId);
    if (!profile || profile.ownerId !== userId) return [];

    return await ctx.db
      .query("dailyProfileStats")
      .withIndex("by_profile_date", (q) =>
        q.eq("profileId", profileId).gte("date", since),
      )
      .order("asc")
      .collect();
  },
});

/**
 * Estadísticas de links — equivale al SELECT en /app/analytics (Pro only).
 * Solo accesible por el dueño.
 */
export const getLinkStats = query({
  args: {
    userId: v.id("users"),
    linkIds: v.array(v.id("links")),
    since: v.string(),
  },
  handler: async (ctx, { userId, linkIds, since }) => {
    const results = [];
    for (const linkId of linkIds) {
      const stats = await ctx.db
        .query("dailyLinkStats")
        .withIndex("by_link_date", (q) =>
          q.eq("linkId", linkId).gte("date", since),
        )
        .order("asc")
        .collect();
      results.push(...stats);
    }
    return results;
  },
});

/** Totales de un perfil (views, clicks, uniques sumados) */
export const getProfileTotals = query({
  args: {
    userId: v.id("users"),
    profileId: v.id("profiles"),
  },
  handler: async (ctx, { userId, profileId }) => {
    const profile = await ctx.db.get(profileId);
    if (!profile || profile.ownerId !== userId) return null;

    const stats = await ctx.db
      .query("dailyProfileStats")
      .withIndex("by_profile_date", (q) =>
        q.eq("profileId", profileId),
      )
      .collect();

    return stats.reduce(
      (acc, s) => ({
        views: acc.views + s.views,
        uniques: acc.uniques + s.uniques,
        clicks: acc.clicks + s.clicks,
        contactClicks: acc.contactClicks + s.contactClicks,
      }),
      { views: 0, uniques: 0, clicks: 0, contactClicks: 0 },
    );
  },
});
