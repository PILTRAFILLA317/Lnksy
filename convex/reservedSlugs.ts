import { v } from "convex/values";
import { query } from "./_generated/server";

// =============================================================
// Lnksy — Reserved Slugs
// Equivalente a public.reserved_slugs + trigger check_reserved_slug
// =============================================================

/** Verificar si un slug está reservado */
export const isReserved = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const found = await ctx.db
      .query("reservedSlugs")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    return !!found;
  },
});

/** Lista completa de slugs reservados */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("reservedSlugs").collect();
    return all.map((r) => r.slug);
  },
});
