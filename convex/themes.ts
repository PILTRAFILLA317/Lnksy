import { v } from "convex/values";
import { query } from "./_generated/server";

// =============================================================
// Lnksy — Themes (catálogo de solo lectura)
// Equivalente a public.themes con política "Anyone can read themes"
// =============================================================

/** Todos los temas ordenados (free primero) */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("themes").order("asc").collect();
  },
});

/** Temas gratuitos */
export const listFree = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("themes")
      .withIndex("by_is_pro", (q) => q.eq("isPro", false))
      .collect();
  },
});

/** Temas Pro */
export const listPro = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("themes")
      .withIndex("by_is_pro", (q) => q.eq("isPro", true))
      .collect();
  },
});

/** Obtener tema por ID string (e.g. "default", "midnight") */
export const getById = query({
  args: { themeId: v.string() },
  handler: async (ctx, { themeId }) => {
    return await ctx.db
      .query("themes")
      .withIndex("by_theme_id", (q) => q.eq("themeId", themeId))
      .first();
  },
});

/** Temas filtrados por tags */
export const listByTags = query({
  args: { tags: v.array(v.string()) },
  handler: async (ctx, { tags }) => {
    if (tags.length === 0) {
      return await ctx.db.query("themes").order("asc").collect();
    }
    const all = await ctx.db.query("themes").order("asc").collect();
    return all.filter((t) => tags.some((tag) => t.tags.includes(tag)));
  },
});
