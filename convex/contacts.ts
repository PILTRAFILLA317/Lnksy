import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// =============================================================
// Lnksy — Profile Contacts
// =============================================================

const PREDEFINED_CONTACT_TYPES = [
  "whatsapp",
  "telegram",
  "phone",
  "email",
  "instagram",
  "tiktok",
] as const;

const contactTypeValidator = v.union(
  v.literal("whatsapp"),
  v.literal("telegram"),
  v.literal("phone"),
  v.literal("email"),
  v.literal("instagram"),
  v.literal("tiktok"),
  v.literal("custom_link"),
);

const VALID_ICON_IDS = new Set([
  "globe", "link", "star", "heart", "music", "camera",
  "map-pin", "shopping-bag", "calendar", "send",
  "github", "linkedin", "twitter", "facebook", "discord",
  "youtube", "twitch", "threads", "pinterest", "snapchat",
]);

const ALLOWED_URL_SCHEMES = ["http:", "https:", "mailto:", "tel:"];
const FREE_CONTACT_LIMIT = 8;

// ─── Helpers ─────────────────────────────────────────────────

async function requireOwnerAndProfile(ctx: any, userId: string) {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_owner", (q: any) => q.eq("ownerId", userId))
    .first();
  if (!profile) throw new ConvexError("Perfil no encontrado");
  return { profile };
}

function validateContactUrl(rawUrl: string): string {
  const url = rawUrl.trim();
  if (!url) throw new ConvexError("URL is required");

  // Allow mailto: and tel: directly (URL constructor rejects them unreliably)
  if (url.startsWith("mailto:")) {
    const addr = url.slice(7);
    if (!addr) throw new ConvexError("Invalid mailto address");
    return url;
  }
  if (url.startsWith("tel:")) {
    const num = url.slice(4);
    if (!num) throw new ConvexError("Invalid tel number");
    return url;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ConvexError(
      "Invalid URL. Enter a valid URL starting with http://, https://, mailto:, or tel:",
    );
  }

  if (!ALLOWED_URL_SCHEMES.includes(parsed.protocol)) {
    throw new ConvexError(
      "URL scheme not allowed. Only http, https, mailto, and tel are permitted.",
    );
  }

  return url;
}

async function assertContactLimit(ctx: any, profile: any): Promise<void> {
  if (profile.plan === "PRO") return;

  const contacts = await ctx.db
    .query("profileContacts")
    .withIndex("by_profile", (q: any) => q.eq("profileId", profile._id))
    .collect();

  if (contacts.length >= FREE_CONTACT_LIMIT) {
    throw new ConvexError(
      `Contact limit reached. Free plan allows up to ${FREE_CONTACT_LIMIT} contacts. Upgrade to Pro for unlimited contacts.`,
    );
  }
}

// ─── Queries ─────────────────────────────────────────────────

export const getByProfile = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    return await ctx.db
      .query("profileContacts")
      .withIndex("by_profile", (q) => q.eq("profileId", profileId))
      .order("asc")
      .collect();
  },
});

export const getEnabledByProfile = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    return await ctx.db
      .query("profileContacts")
      .withIndex("by_profile", (q) => q.eq("profileId", profileId))
      .filter((q) => q.eq(q.field("isEnabled"), true))
      .order("asc")
      .collect();
  },
});

// ─── Mutations (predefined types) ────────────────────────────

/**
 * Create or update a predefined contact type (whatsapp, telegram, phone, email, instagram, tiktok).
 * Deletes the entry when both value is empty and isEnabled is false.
 */
export const upsert = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("whatsapp"),
      v.literal("telegram"),
      v.literal("phone"),
      v.literal("email"),
      v.literal("instagram"),
      v.literal("tiktok"),
    ),
    value: v.string(),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, { userId, type, value, isEnabled }) => {
    const { profile } = await requireOwnerAndProfile(ctx, userId);

    if (!value && !isEnabled) {
      const existing = await ctx.db
        .query("profileContacts")
        .withIndex("by_profile_type", (q: any) =>
          q.eq("profileId", profile._id).eq("type", type),
        )
        .first();
      if (existing) await ctx.db.delete(existing._id);
      return;
    }

    const existing = await ctx.db
      .query("profileContacts")
      .withIndex("by_profile_type", (q: any) =>
        q.eq("profileId", profile._id).eq("type", type),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value, isEnabled });
    } else {
      // Check limit only when creating new
      await assertContactLimit(ctx, profile);

      const lastContact = await ctx.db
        .query("profileContacts")
        .withIndex("by_profile", (q: any) => q.eq("profileId", profile._id))
        .order("desc")
        .first();
      const orderIndex = lastContact ? lastContact.orderIndex + 1 : 0;

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

/** Remove a predefined contact by type. */
export const remove = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("whatsapp"),
      v.literal("telegram"),
      v.literal("phone"),
      v.literal("email"),
      v.literal("instagram"),
      v.literal("tiktok"),
    ),
  },
  handler: async (ctx, { userId, type }) => {
    const { profile } = await requireOwnerAndProfile(ctx, userId);
    const contact = await ctx.db
      .query("profileContacts")
      .withIndex("by_profile_type", (q: any) =>
        q.eq("profileId", profile._id).eq("type", type),
      )
      .first();
    if (contact) await ctx.db.delete(contact._id);
  },
});

// ─── Mutations (custom_link) ──────────────────────────────────

/** Create a new custom link contact. */
export const createCustom = mutation({
  args: {
    userId: v.id("users"),
    url: v.string(),
    icon: v.string(),
    label: v.optional(v.string()),
  },
  handler: async (ctx, { userId, url, icon, label }) => {
    const { profile } = await requireOwnerAndProfile(ctx, userId);
    await assertContactLimit(ctx, profile);

    const validatedUrl = validateContactUrl(url);

    if (!VALID_ICON_IDS.has(icon)) {
      throw new ConvexError("Invalid icon selection");
    }

    const lastContact = await ctx.db
      .query("profileContacts")
      .withIndex("by_profile", (q: any) => q.eq("profileId", profile._id))
      .order("desc")
      .first();
    const orderIndex = lastContact ? lastContact.orderIndex + 1 : 0;

    await ctx.db.insert("profileContacts", {
      profileId: profile._id,
      type: "custom_link",
      value: validatedUrl,
      url: validatedUrl,
      icon,
      label: label?.trim() || undefined,
      orderIndex,
      isEnabled: true,
    });
  },
});

/** Update a custom link contact by ID. */
export const updateCustom = mutation({
  args: {
    userId: v.id("users"),
    contactId: v.id("profileContacts"),
    url: v.string(),
    icon: v.string(),
    label: v.optional(v.string()),
  },
  handler: async (ctx, { userId, contactId, url, icon, label }) => {
    const { profile } = await requireOwnerAndProfile(ctx, userId);

    const contact = await ctx.db.get(contactId);
    if (!contact || contact.profileId !== profile._id) {
      throw new ConvexError("Contact not found");
    }
    if (contact.type !== "custom_link") {
      throw new ConvexError("Use upsert for predefined contact types");
    }

    const validatedUrl = validateContactUrl(url);

    if (!VALID_ICON_IDS.has(icon)) {
      throw new ConvexError("Invalid icon selection");
    }

    await ctx.db.patch(contactId, {
      value: validatedUrl,
      url: validatedUrl,
      icon,
      label: label?.trim() || undefined,
    });
  },
});

// ─── Mutations (any contact by ID) ───────────────────────────

/** Remove any contact by ID. */
export const removeById = mutation({
  args: {
    userId: v.id("users"),
    contactId: v.id("profileContacts"),
  },
  handler: async (ctx, { userId, contactId }) => {
    const { profile } = await requireOwnerAndProfile(ctx, userId);
    const contact = await ctx.db.get(contactId);
    if (!contact || contact.profileId !== profile._id) {
      throw new ConvexError("Contact not found");
    }
    await ctx.db.delete(contactId);
  },
});

/** Toggle isEnabled for any contact by ID. */
export const toggleById = mutation({
  args: {
    userId: v.id("users"),
    contactId: v.id("profileContacts"),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, { userId, contactId, isEnabled }) => {
    const { profile } = await requireOwnerAndProfile(ctx, userId);
    const contact = await ctx.db.get(contactId);
    if (!contact || contact.profileId !== profile._id) {
      throw new ConvexError("Contact not found");
    }
    await ctx.db.patch(contactId, { isEnabled });
  },
});

/** Move a contact one position up in the order. */
export const moveUp = mutation({
  args: {
    userId: v.id("users"),
    contactId: v.id("profileContacts"),
  },
  handler: async (ctx, { userId, contactId }) => {
    const { profile } = await requireOwnerAndProfile(ctx, userId);
    const contact = await ctx.db.get(contactId);
    if (!contact || contact.profileId !== profile._id) {
      throw new ConvexError("Contact not found");
    }

    const contacts = await ctx.db
      .query("profileContacts")
      .withIndex("by_profile", (q: any) => q.eq("profileId", profile._id))
      .order("asc")
      .collect();

    const idx = contacts.findIndex((c: any) => c._id === contactId);
    if (idx <= 0) return;

    const prev = contacts[idx - 1];
    await ctx.db.patch(contact._id, { orderIndex: prev.orderIndex });
    await ctx.db.patch(prev._id, { orderIndex: contact.orderIndex });
  },
});

/** Move a contact one position down in the order. */
export const moveDown = mutation({
  args: {
    userId: v.id("users"),
    contactId: v.id("profileContacts"),
  },
  handler: async (ctx, { userId, contactId }) => {
    const { profile } = await requireOwnerAndProfile(ctx, userId);
    const contact = await ctx.db.get(contactId);
    if (!contact || contact.profileId !== profile._id) {
      throw new ConvexError("Contact not found");
    }

    const contacts = await ctx.db
      .query("profileContacts")
      .withIndex("by_profile", (q: any) => q.eq("profileId", profile._id))
      .order("asc")
      .collect();

    const idx = contacts.findIndex((c: any) => c._id === contactId);
    if (idx >= contacts.length - 1) return;

    const next = contacts[idx + 1];
    await ctx.db.patch(contact._id, { orderIndex: next.orderIndex });
    await ctx.db.patch(next._id, { orderIndex: contact.orderIndex });
  },
});
