import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// =============================================================
// Lnksy — Convex Schema
// =============================================================

export default defineSchema({
  // ─── auth ───────────────────────────────────────────────────
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    emailVerified: v.boolean(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    tokenHash: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token_hash", ["tokenHash"])
    .index("by_user", ["userId"]),

  verificationTokens: defineTable({
    userId: v.id("users"),
    email: v.string(),
    tokenHash: v.string(),
    type: v.union(v.literal("verify"), v.literal("reset")),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token_hash", ["tokenHash"])
    .index("by_user_type", ["userId", "type"]),

  // ─── profiles ──────────────────────────────────────────────
  // Equivalente a public.profiles
  profiles: defineTable({
    ownerId: v.string(),
    handle: v.string(),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    heroUrl: v.optional(v.string()),
    heroPosition: v.union(
      v.literal("center"),
      v.literal("top"),
    ),
    headerMode: v.union(
      v.literal("AVATAR"),
      v.literal("HERO"),
      v.literal("AVATAR_HERO"),
    ),
    displayTitle: v.optional(v.string()),
    themeId: v.string(),
    themeOverrides: v.any(),
    backgroundId: v.optional(v.string()),
    fontId: v.string(),
    mainLinksLayout: v.union(
      v.literal("LIST_ICON"),
      v.literal("GRID_ICON"),
      v.literal("GRID_IMAGE"),
      v.literal("LIST_IMAGE"),
    ),
    plan: v.union(v.literal("FREE"), v.literal("PRO")),
    brandingEnabled: v.boolean(),
    deletedAt: v.optional(v.number()),
    // PRO: background image layer
    backgroundImageUrl: v.optional(v.string()),
    backgroundOverlay: v.optional(v.number()),   // 0..0.85
    backgroundBlurPx: v.optional(v.number()),    // 0..24
  })
    .index("by_owner", ["ownerId"])
    .index("by_handle", ["handle"]),

  // ─── profileComponents ─────────────────────────────────────
  profileComponents: defineTable({
    profileId: v.id("profiles"),
    type: v.union(
      v.literal("links"),
      v.literal("youtube"),
      v.literal("spotify"),
      v.literal("divider"),
      v.literal("text"),
    ),
    title: v.optional(v.string()),
    config: v.any(),
    orderIndex: v.number(),
    isVisible: v.boolean(),
    updatedAt: v.number(),
  }).index("by_profile", ["profileId", "orderIndex"]),

  // ─── linkSections ──────────────────────────────────────────
  // Kept for backward-compat during migration; new code uses profileComponents
  linkSections: defineTable({
    profileId: v.id("profiles"),
    title: v.optional(v.string()),
    layout: v.union(
      v.literal("LIST_ICON"),
      v.literal("GRID_ICON"),
      v.literal("GRID_IMAGE"),
      v.literal("LIST_IMAGE"),
    ),
    isVisible: v.boolean(),
    orderIndex: v.number(),
    options: v.any(),
    updatedAt: v.number(),
  }).index("by_profile", ["profileId", "orderIndex"]),

  // ─── links ─────────────────────────────────────────────────
  links: defineTable({
    profileId: v.id("profiles"),
    // componentId: preferred foreign key after migration
    componentId: v.optional(v.id("profileComponents")),
    // sectionId: legacy foreign key; kept for migration compatibility
    sectionId: v.optional(v.id("linkSections")),
    title: v.string(),
    url: v.string(),
    subtitle: v.optional(v.string()),
    icon: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    platform: v.optional(v.string()),
    orderIndex: v.number(),
    isActive: v.boolean(),
    highlight: v.boolean(),
    startAt: v.optional(v.number()),
    endAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_profile", ["profileId", "orderIndex"])
    .index("by_section", ["sectionId", "orderIndex"])
    .index("by_component", ["componentId", "orderIndex"]),

  // ─── profileContacts ───────────────────────────────────────
  profileContacts: defineTable({
    profileId: v.id("profiles"),
    type: v.union(
      v.literal("whatsapp"),
      v.literal("telegram"),
      v.literal("phone"),
      v.literal("email"),
      v.literal("instagram"),
      v.literal("tiktok"),
    ),
    value: v.string(),
    orderIndex: v.number(),
    isEnabled: v.boolean(),
  })
    .index("by_profile", ["profileId", "orderIndex"])
    .index("by_profile_type", ["profileId", "type"]),

  // ─── themes ────────────────────────────────────────────────
  themes: defineTable({
    themeId: v.string(),
    name: v.string(),
    isPro: v.boolean(),
    tags: v.array(v.string()),
    config: v.any(),
  })
    .index("by_theme_id", ["themeId"])
    .index("by_is_pro", ["isPro"]),

  // ─── fonts ─────────────────────────────────────────────────
  fonts: defineTable({
    fontId: v.string(),
    name: v.string(),
    family: v.string(),
    isPro: v.boolean(),
    url: v.optional(v.string()),
  })
    .index("by_font_id", ["fontId"])
    .index("by_is_pro", ["isPro"]),

  // ─── backgrounds ───────────────────────────────────────────
  backgrounds: defineTable({
    backgroundId: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("solid"),
      v.literal("gradient"),
      v.literal("pattern"),
    ),
    value: v.string(),
    isPro: v.boolean(),
    meta: v.any(),
  })
    .index("by_background_id", ["backgroundId"])
    .index("by_is_pro", ["isPro"])
    .index("by_type", ["type"]),

  // ─── reservedSlugs ─────────────────────────────────────────
  reservedSlugs: defineTable({
    slug: v.string(),
  }).index("by_slug", ["slug"]),

  // ─── dailyProfileStats ─────────────────────────────────────
  dailyProfileStats: defineTable({
    profileId: v.id("profiles"),
    date: v.string(),
    views: v.number(),
    uniques: v.number(),
    clicks: v.number(),
    contactClicks: v.number(),
  }).index("by_profile_date", ["profileId", "date"]),

  // ─── dailyLinkStats ────────────────────────────────────────
  dailyLinkStats: defineTable({
    linkId: v.id("links"),
    date: v.string(),
    clicks: v.number(),
  }).index("by_link_date", ["linkId", "date"]),

  // ─── analyticsSessions ─────────────────────────────────────
  analyticsSessions: defineTable({
    profileId: v.id("profiles"),
    anonId: v.string(),
    lastSeenAt: v.number(),
  }).index("by_profile_anon", ["profileId", "anonId"]),

  // ─── billing ───────────────────────────────────────────────
  billing: defineTable({
    ownerId: v.string(),
    profileId: v.optional(v.id("profiles")),
    stripeCustomerId: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),
    plan: v.union(v.literal("FREE"), v.literal("PRO")),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("trialing"),
    ),
    currentPeriodEnd: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_stripe_customer", ["stripeCustomerId"]),

  // ─── stripeWebhookEvents ───────────────────────────────────
  stripeWebhookEvents: defineTable({
    eventId: v.string(),
    receivedAt: v.number(),
  }).index("by_event_id", ["eventId"]),
});
