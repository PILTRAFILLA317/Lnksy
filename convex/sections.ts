import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// =============================================================
// Lnksy — Link Sections
// =============================================================

async function requireOwnerAndProfile(
  ctx: any,
  userId: string,
) {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_owner", (q: any) =>
      q.eq("ownerId", userId),
    )
    .first();
  if (!profile) throw new ConvexError("Perfil no encontrado");
  return { profile };
}

// ─── Queries ─────────────────────────────────────────────────

export const getByProfile = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    return await ctx.db
      .query("linkSections")
      .withIndex("by_profile", (q) =>
        q.eq("profileId", profileId),
      )
      .order("asc")
      .collect();
  },
});

export const getVisibleByProfile = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    return await ctx.db
      .query("linkSections")
      .withIndex("by_profile", (q) =>
        q.eq("profileId", profileId),
      )
      .filter((q) => q.eq(q.field("isVisible"), true))
      .order("asc")
      .collect();
  },
});

// ─── Mutations ───────────────────────────────────────────────

export const add = mutation({
  args: {
    userId: v.id("users"),
    title: v.optional(v.string()),
  },
  handler: async (ctx, { userId, title }) => {
    const { profile } = await requireOwnerAndProfile(
      ctx,
      userId,
    );

    const lastSection = await ctx.db
      .query("linkSections")
      .withIndex("by_profile", (q) =>
        q.eq("profileId", profile._id),
      )
      .order("desc")
      .first();
    const orderIndex = lastSection
      ? lastSection.orderIndex + 1
      : 0;

    const sectionId = await ctx.db.insert("linkSections", {
      profileId: profile._id,
      title: title?.trim() || undefined,
      layout: "LIST_ICON",
      isVisible: true,
      orderIndex,
      options: {},
      updatedAt: Date.now(),
    });

    return sectionId;
  },
});

export const update = mutation({
  args: {
    userId: v.id("users"),
    sectionId: v.id("linkSections"),
    title: v.optional(v.string()),
    isVisible: v.optional(v.boolean()),
  },
  handler: async (ctx, { userId, ...args }) => {
    const { profile } = await requireOwnerAndProfile(
      ctx,
      userId,
    );
    const section = await ctx.db.get(args.sectionId);
    if (!section || section.profileId !== profile._id) {
      throw new ConvexError("Sección no encontrada");
    }
    const patch: Record<string, any> = {
      updatedAt: Date.now(),
    };
    if (args.title !== undefined) {
      patch.title = args.title.trim() || undefined;
    }
    if (args.isVisible !== undefined) {
      patch.isVisible = args.isVisible;
    }
    await ctx.db.patch(args.sectionId, patch);
  },
});

export const updateLayout = mutation({
  args: {
    userId: v.id("users"),
    sectionId: v.id("linkSections"),
    layout: v.union(
      v.literal("LIST_ICON"),
      v.literal("GRID_ICON"),
      v.literal("GRID_IMAGE"),
      v.literal("LIST_IMAGE"),
    ),
  },
  handler: async (ctx, { userId, sectionId, layout }) => {
    const { profile } = await requireOwnerAndProfile(
      ctx,
      userId,
    );
    const section = await ctx.db.get(sectionId);
    if (!section || section.profileId !== profile._id) {
      throw new ConvexError("Sección no encontrada");
    }
    const PRO_LAYOUTS = ["GRID_IMAGE", "LIST_IMAGE"];
    if (
      PRO_LAYOUTS.includes(layout) &&
      profile.plan !== "PRO"
    ) {
      throw new ConvexError("Este layout requiere Pro");
    }
    await ctx.db.patch(sectionId, {
      layout,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    userId: v.id("users"),
    sectionId: v.id("linkSections"),
  },
  handler: async (ctx, { userId, sectionId }) => {
    const { profile } = await requireOwnerAndProfile(
      ctx,
      userId,
    );
    const allSections = await ctx.db
      .query("linkSections")
      .withIndex("by_profile", (q) =>
        q.eq("profileId", profile._id),
      )
      .collect();
    if (allSections.length <= 1) {
      throw new ConvexError(
        "No se puede eliminar la única sección",
      );
    }
    const section = await ctx.db.get(sectionId);
    if (!section || section.profileId !== profile._id) {
      throw new ConvexError("Sección no encontrada");
    }
    const sectionLinks = await ctx.db
      .query("links")
      .withIndex("by_section", (q) =>
        q.eq("sectionId", sectionId),
      )
      .collect();
    for (const link of sectionLinks) {
      await ctx.db.delete(link._id);
    }
    await ctx.db.delete(sectionId);
  },
});

export const reorder = mutation({
  args: {
    userId: v.id("users"),
    order: v.array(v.id("linkSections")),
  },
  handler: async (ctx, { userId, order }) => {
    const { profile } = await requireOwnerAndProfile(
      ctx,
      userId,
    );
    for (let i = 0; i < order.length; i++) {
      const section = await ctx.db.get(order[i]);
      if (!section || section.profileId !== profile._id) {
        continue;
      }
      await ctx.db.patch(order[i], {
        orderIndex: i,
        updatedAt: Date.now(),
      });
    }
  },
});
