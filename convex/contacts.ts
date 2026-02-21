import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// =============================================================
// Lnksy — Profile Contacts
// =============================================================

const contactTypeValidator = v.union(
  v.literal("whatsapp"),
  v.literal("telegram"),
  v.literal("phone"),
  v.literal("email"),
  v.literal("instagram"),
  v.literal("tiktok"),
);

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
      .query("profileContacts")
      .withIndex("by_profile", (q) =>
        q.eq("profileId", profileId),
      )
      .order("asc")
      .collect();
  },
});

export const getEnabledByProfile = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    return await ctx.db
      .query("profileContacts")
      .withIndex("by_profile", (q) =>
        q.eq("profileId", profileId),
      )
      .filter((q) => q.eq(q.field("isEnabled"), true))
      .order("asc")
      .collect();
  },
});

// ─── Mutations ───────────────────────────────────────────────

export const upsert = mutation({
  args: {
    userId: v.id("users"),
    type: contactTypeValidator,
    value: v.string(),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, { userId, type, value, isEnabled }) => {
    const { profile } = await requireOwnerAndProfile(
      ctx,
      userId,
    );

    if (!value && !isEnabled) {
      const existing = await ctx.db
        .query("profileContacts")
        .withIndex("by_profile_type", (q) =>
          q
            .eq("profileId", profile._id)
            .eq("type", type),
        )
        .first();
      if (existing) await ctx.db.delete(existing._id);
      return;
    }

    const existing = await ctx.db
      .query("profileContacts")
      .withIndex("by_profile_type", (q) =>
        q.eq("profileId", profile._id).eq("type", type),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value, isEnabled });
    } else {
      const lastContact = await ctx.db
        .query("profileContacts")
        .withIndex("by_profile", (q) =>
          q.eq("profileId", profile._id),
        )
        .order("desc")
        .first();
      const orderIndex = lastContact
        ? lastContact.orderIndex + 1
        : 0;

      await ctx.db.insert("profileContacts", {
        profileId: profile._id,
        type,
        value,
        orderIndex,
        isEnabled,
      });
    }
  },
});

export const remove = mutation({
  args: {
    userId: v.id("users"),
    type: contactTypeValidator,
  },
  handler: async (ctx, { userId, type }) => {
    const { profile } = await requireOwnerAndProfile(
      ctx,
      userId,
    );
    const contact = await ctx.db
      .query("profileContacts")
      .withIndex("by_profile_type", (q) =>
        q.eq("profileId", profile._id).eq("type", type),
      )
      .first();
    if (contact) await ctx.db.delete(contact._id);
  },
});
