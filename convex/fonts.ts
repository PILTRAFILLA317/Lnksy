import { v } from "convex/values";
import { query } from "./_generated/server";

// =============================================================
// Lnksy — Fonts (catálogo de solo lectura)
// Equivalente a public.fonts con política "Anyone can read fonts"
// =============================================================

/** Todas las fuentes */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("fonts").order("asc").collect();
  },
});

/** Fuentes gratuitas */
export const listFree = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("fonts")
      .withIndex("by_is_pro", (q) => q.eq("isPro", false))
      .collect();
  },
});

/** Fuentes Pro */
export const listPro = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("fonts")
      .withIndex("by_is_pro", (q) => q.eq("isPro", true))
      .collect();
  },
});

/** Obtener fuente por ID string (e.g. "inter", "space-grotesk") */
export const getById = query({
  args: { fontId: v.string() },
  handler: async (ctx, { fontId }) => {
    return await ctx.db
      .query("fonts")
      .withIndex("by_font_id", (q) => q.eq("fontId", fontId))
      .first();
  },
});
