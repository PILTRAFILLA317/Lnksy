import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// =============================================================
// Lnksy — Links
// =============================================================

const FREE_LINK_LIMIT = 25;

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

async function maxOrderInSection(
  ctx: any,
  sectionId: any,
): Promise<number> {
  const last = await ctx.db
    .query("links")
    .withIndex("by_section", (q: any) =>
      q.eq("sectionId", sectionId),
    )
    .order("desc")
    .first();
  return last ? last.orderIndex + 1 : 0;
}

// ─── Queries ─────────────────────────────────────────────────

export const getByProfile = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    return await ctx.db
      .query("links")
      .withIndex("by_profile", (q) =>
        q.eq("profileId", profileId),
      )
      .order("asc")
      .collect();
  },
});

export const getActiveByProfile = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    const now = Date.now();
    return await ctx.db
      .query("links")
      .withIndex("by_profile", (q) =>
        q.eq("profileId", profileId),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.or(
            q.eq(q.field("startAt"), undefined),
            q.lte(q.field("startAt"), now),
          ),
          q.or(
            q.eq(q.field("endAt"), undefined),
            q.gt(q.field("endAt"), now),
          ),
        ),
      )
      .order("asc")
      .collect();
  },
});

export const getBySection = query({
  args: { sectionId: v.id("linkSections") },
  handler: async (ctx, { sectionId }) => {
    return await ctx.db
      .query("links")
      .withIndex("by_section", (q) =>
        q.eq("sectionId", sectionId),
      )
      .order("asc")
      .collect();
  },
});

// ─── Mutations ───────────────────────────────────────────────

export const add = mutation({
  args: {
    userId: v.id("users"),
    sectionId: v.id("linkSections"),
    title: v.string(),
    url: v.string(),
    subtitle: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    platform: v.optional(v.string()),
  },
  handler: async (ctx, { userId, ...args }) => {
    const { profile } = await requireOwnerAndProfile(
      ctx,
      userId,
    );

    if (profile.plan === "FREE") {
      const allLinks = await ctx.db
        .query("links")
        .withIndex("by_profile", (q) =>
          q.eq("profileId", profile._id),
        )
        .collect();
      if (allLinks.length >= FREE_LINK_LIMIT) {
        throw new ConvexError(
          `El plan Free está limitado a ${FREE_LINK_LIMIT} links`,
        );
      }
    }

    const section = await ctx.db.get(args.sectionId);
    if (!section || section.profileId !== profile._id) {
      throw new ConvexError("Sección no encontrada");
    }

    const orderIndex = await maxOrderInSection(
      ctx,
      args.sectionId,
    );

    await ctx.db.insert("links", {
      profileId: profile._id,
      sectionId: args.sectionId,
      title: args.title.trim(),
      url: args.url.trim(),
      subtitle: args.subtitle?.trim() || undefined,
      imageUrl: args.imageUrl?.trim() || undefined,
      platform: args.platform?.trim() || undefined,
      orderIndex,
      isActive: true,
      highlight: false,
      startAt: undefined,
      endAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    userId: v.id("users"),
    linkId: v.id("links"),
    title: v.string(),
    url: v.string(),
    subtitle: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    platform: v.optional(v.string()),
    startAt: v.optional(v.number()),
    endAt: v.optional(v.number()),
    highlight: v.boolean(),
  },
  handler: async (ctx, { userId, ...args }) => {
    const { profile } = await requireOwnerAndProfile(
      ctx,
      userId,
    );
    const link = await ctx.db.get(args.linkId);
    if (!link || link.profileId !== profile._id) {
      throw new ConvexError("Link no encontrado");
    }
    await ctx.db.patch(args.linkId, {
      title: args.title.trim(),
      url: args.url.trim(),
      subtitle: args.subtitle?.trim() || undefined,
      imageUrl: args.imageUrl?.trim() || undefined,
      platform: args.platform?.trim() || undefined,
      startAt: args.startAt,
      endAt: args.endAt,
      highlight: args.highlight,
      updatedAt: Date.now(),
    });
  },
});

export const toggle = mutation({
  args: {
    userId: v.id("users"),
    linkId: v.id("links"),
  },
  handler: async (ctx, { userId, linkId }) => {
    const { profile } = await requireOwnerAndProfile(
      ctx,
      userId,
    );
    const link = await ctx.db.get(linkId);
    if (!link || link.profileId !== profile._id) {
      throw new ConvexError("Link no encontrado");
    }
    await ctx.db.patch(linkId, {
      isActive: !link.isActive,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    userId: v.id("users"),
    linkId: v.id("links"),
  },
  handler: async (ctx, { userId, linkId }) => {
    const { profile } = await requireOwnerAndProfile(
      ctx,
      userId,
    );
    const link = await ctx.db.get(linkId);
    if (!link || link.profileId !== profile._id) {
      throw new ConvexError("Link no encontrado");
    }
    await ctx.db.delete(linkId);
  },
});

export const duplicate = mutation({
  args: {
    userId: v.id("users"),
    linkId: v.id("links"),
  },
  handler: async (ctx, { userId, linkId }) => {
    const { profile } = await requireOwnerAndProfile(
      ctx,
      userId,
    );

    if (profile.plan === "FREE") {
      const allLinks = await ctx.db
        .query("links")
        .withIndex("by_profile", (q) =>
          q.eq("profileId", profile._id),
        )
        .collect();
      if (allLinks.length >= FREE_LINK_LIMIT) {
        throw new ConvexError("Límite de links alcanzado");
      }
    }

    const original = await ctx.db.get(linkId);
    if (!original || original.profileId !== profile._id) {
      throw new ConvexError("Link no encontrado");
    }

    const orderIndex = await maxOrderInSection(
      ctx,
      original.sectionId,
    );

    await ctx.db.insert("links", {
      profileId: profile._id,
      sectionId: original.sectionId,
      title: `${original.title} (copy)`,
      url: original.url,
      subtitle: original.subtitle,
      icon: original.icon,
      imageUrl: original.imageUrl,
      platform: original.platform,
      orderIndex,
      isActive: original.isActive,
      highlight: false,
      startAt: undefined,
      endAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const reorder = mutation({
  args: {
    userId: v.id("users"),
    order: v.array(v.id("links")),
  },
  handler: async (ctx, { userId, order }) => {
    const { profile } = await requireOwnerAndProfile(
      ctx,
      userId,
    );
    for (let i = 0; i < order.length; i++) {
      const link = await ctx.db.get(order[i]);
      if (!link || link.profileId !== profile._id) continue;
      await ctx.db.patch(order[i], {
        orderIndex: i,
        updatedAt: Date.now(),
      });
    }
  },
});

export const moveToSection = mutation({
  args: {
    userId: v.id("users"),
    linkId: v.id("links"),
    targetSectionId: v.id("linkSections"),
  },
  handler: async (ctx, { userId, linkId, targetSectionId }) => {
    const { profile } = await requireOwnerAndProfile(
      ctx,
      userId,
    );
    const link = await ctx.db.get(linkId);
    if (!link || link.profileId !== profile._id) {
      throw new ConvexError("Link no encontrado");
    }
    const targetSection = await ctx.db.get(targetSectionId);
    if (
      !targetSection ||
      targetSection.profileId !== profile._id
    ) {
      throw new ConvexError("Sección destino no encontrada");
    }
    const orderIndex = await maxOrderInSection(
      ctx,
      targetSectionId,
    );
    await ctx.db.patch(linkId, {
      sectionId: targetSectionId,
      orderIndex,
      updatedAt: Date.now(),
    });
  },
});
