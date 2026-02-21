import { v } from "convex/values";
import { query } from "./_generated/server";

// =============================================================
// Lnksy — Backgrounds (catálogo de solo lectura)
// Equivalente a public.backgrounds con política "Anyone can read backgrounds"
// =============================================================

/** Todos los fondos */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("backgrounds").order("asc").collect();
  },
});

/** Fondos gratuitos */
export const listFree = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("backgrounds")
      .withIndex("by_is_pro", (q) => q.eq("isPro", false))
      .collect();
  },
});

/** Fondos por tipo */
export const listByType = query({
  args: {
    type: v.union(v.literal("solid"), v.literal("gradient"), v.literal("pattern")),
  },
  handler: async (ctx, { type }) => {
    return await ctx.db
      .query("backgrounds")
      .withIndex("by_type", (q) => q.eq("type", type))
      .collect();
  },
});

/** Obtener fondo por ID string (e.g. "solid-white", "gradient-sunset") */
export const getById = query({
  args: { backgroundId: v.string() },
  handler: async (ctx, { backgroundId }) => {
    return await ctx.db
      .query("backgrounds")
      .withIndex("by_background_id", (q) => q.eq("backgroundId", backgroundId))
      .first();
  },
});
