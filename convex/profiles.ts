import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { ConvexError } from "convex/values";

// =============================================================
// Lnksy — Profiles
// =============================================================

const HANDLE_REGEX = /^[a-z0-9]([a-z0-9-]{1,22}[a-z0-9])?$/;

export function validateHandle(handle: string): string | null {
  if (!HANDLE_REGEX.test(handle)) {
    return "Formato de handle inválido";
  }
  if (handle.includes("---")) {
    return "El handle no puede contener triple guión";
  }
  if (handle.startsWith("--") || handle.endsWith("--")) {
    return "Formato de handle inválido";
  }
  return null;
}

async function requireOwnProfile(
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
  return profile;
}

// ─── Queries ─────────────────────────────────────────────────

/** Perfil público por handle */
export const getByHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .first();
  },
});

/** Perfil propio — requires userId from SvelteKit server */
export const getOwn = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .first();
  },
});

/** Verificar disponibilidad de handle */
export const checkHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    const err = validateHandle(handle);
    if (err) return { available: false, error: err };

    const reserved = await ctx.db
      .query("reservedSlugs")
      .withIndex("by_slug", (q) => q.eq("slug", handle))
      .first();
    if (reserved) {
      return { available: false, error: "Este handle está reservado" };
    }

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle))
      .first();
    return {
      available: !existing,
      error: existing ? "Handle ya está en uso" : undefined,
    };
  },
});

// ─── Mutations ───────────────────────────────────────────────

/** Crear perfil (al registrarse) */
export const create = mutation({
  args: {
    userId: v.id("users"),
    handle: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { userId, handle, name }) => {
    const handleError = validateHandle(handle);
    if (handleError) throw new ConvexError(handleError);

    const reserved = await ctx.db
      .query("reservedSlugs")
      .withIndex("by_slug", (q) => q.eq("slug", handle))
      .first();
    if (reserved) {
      throw new ConvexError("Este handle está reservado");
    }

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle))
      .first();
    if (existing) {
      throw new ConvexError("Handle ya está en uso");
    }

    const ownProfile = await ctx.db
      .query("profiles")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .first();
    if (ownProfile) {
      throw new ConvexError("Ya tienes un perfil creado");
    }

    const profileId = await ctx.db.insert("profiles", {
      ownerId: userId,
      handle,
      name: name?.trim() || undefined,
      bio: undefined,
      avatarUrl: undefined,
      heroUrl: undefined,
      heroPosition: "center",
      headerMode: "AVATAR",
      displayTitle: undefined,
      themeId: "default",
      themeOverrides: {},
      backgroundId: "solid-white",
      fontId: "inter",
      mainLinksLayout: "LIST_ICON",
      plan: "FREE",
      brandingEnabled: true,
      deletedAt: undefined,
    });

    await ctx.db.insert("linkSections", {
      profileId,
      title: undefined,
      layout: "LIST_ICON",
      isVisible: true,
      orderIndex: 0,
      options: {},
      updatedAt: Date.now(),
    });

    await ctx.db.insert("billing", {
      ownerId: userId,
      profileId,
      plan: "FREE",
      status: "inactive",
      updatedAt: Date.now(),
    });

    return profileId;
  },
});

/** Actualizar nombre/bio */
export const update = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, { userId, ...args }) => {
    const profile = await requireOwnProfile(ctx, userId);
    await ctx.db.patch(profile._id, {
      name: args.name?.trim() || undefined,
      bio: args.bio?.trim() || undefined,
    });
  },
});

/** Actualizar URL de avatar */
export const updateAvatar = mutation({
  args: {
    userId: v.id("users"),
    avatarUrl: v.string(),
  },
  handler: async (ctx, { userId, avatarUrl }) => {
    const profile = await requireOwnProfile(ctx, userId);
    await ctx.db.patch(profile._id, { avatarUrl });
  },
});

/** Actualizar hero image URL (Pro) */
export const updateHero = mutation({
  args: {
    userId: v.id("users"),
    heroUrl: v.string(),
  },
  handler: async (ctx, { userId, heroUrl }) => {
    const profile = await requireOwnProfile(ctx, userId);
    if (profile.plan !== "PRO") {
      throw new ConvexError("La imagen hero requiere Pro");
    }
    await ctx.db.patch(profile._id, { heroUrl });
  },
});

/** Actualizar header mode */
export const updateHeaderMode = mutation({
  args: {
    userId: v.id("users"),
    headerMode: v.union(
      v.literal("AVATAR"),
      v.literal("HERO"),
      v.literal("AVATAR_HERO"),
    ),
  },
  handler: async (ctx, { userId, headerMode }) => {
    const profile = await requireOwnProfile(ctx, userId);
    if (
      (headerMode === "HERO" || headerMode === "AVATAR_HERO") &&
      profile.plan !== "PRO"
    ) {
      throw new ConvexError("El header hero requiere Pro");
    }
    await ctx.db.patch(profile._id, { headerMode });
  },
});

/** Actualizar título personalizado (Pro) */
export const updateDisplayTitle = mutation({
  args: {
    userId: v.id("users"),
    displayTitle: v.optional(v.string()),
  },
  handler: async (ctx, { userId, displayTitle }) => {
    const profile = await requireOwnProfile(ctx, userId);
    if (profile.plan !== "PRO") {
      throw new ConvexError(
        "El título personalizado requiere Pro",
      );
    }
    await ctx.db.patch(profile._id, {
      displayTitle:
        displayTitle?.trim().slice(0, 60) || undefined,
    });
  },
});

/** Actualizar bio */
export const updateBio = mutation({
  args: {
    userId: v.id("users"),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, { userId, bio }) => {
    const profile = await requireOwnProfile(ctx, userId);
    await ctx.db.patch(profile._id, {
      bio: bio?.trim().slice(0, 300) || undefined,
    });
  },
});

/** Seleccionar tema */
export const selectTheme = mutation({
  args: {
    userId: v.id("users"),
    themeId: v.string(),
  },
  handler: async (ctx, { userId, themeId }) => {
    const profile = await requireOwnProfile(ctx, userId);
    const theme = await ctx.db
      .query("themes")
      .withIndex("by_theme_id", (q) =>
        q.eq("themeId", themeId),
      )
      .first();
    if (!theme) throw new ConvexError("Tema no encontrado");
    if (theme.isPro && profile.plan !== "PRO") {
      throw new ConvexError("Este tema requiere Pro");
    }
    await ctx.db.patch(profile._id, { themeId });
  },
});

/** Seleccionar background */
export const selectBackground = mutation({
  args: {
    userId: v.id("users"),
    backgroundId: v.string(),
  },
  handler: async (ctx, { userId, backgroundId }) => {
    const profile = await requireOwnProfile(ctx, userId);
    const bg = await ctx.db
      .query("backgrounds")
      .withIndex("by_background_id", (q) =>
        q.eq("backgroundId", backgroundId),
      )
      .first();
    if (!bg) throw new ConvexError("Fondo no encontrado");
    if (bg.isPro && profile.plan !== "PRO") {
      throw new ConvexError("Este fondo requiere Pro");
    }
    await ctx.db.patch(profile._id, { backgroundId });
  },
});

/** Seleccionar fuente */
export const selectFont = mutation({
  args: {
    userId: v.id("users"),
    fontId: v.string(),
  },
  handler: async (ctx, { userId, fontId }) => {
    const profile = await requireOwnProfile(ctx, userId);
    const font = await ctx.db
      .query("fonts")
      .withIndex("by_font_id", (q) =>
        q.eq("fontId", fontId),
      )
      .first();
    if (!font) throw new ConvexError("Fuente no encontrada");
    if (font.isPro && profile.plan !== "PRO") {
      throw new ConvexError("Esta fuente requiere Pro");
    }
    await ctx.db.patch(profile._id, { fontId });
  },
});

/** Actualizar theme overrides */
export const updateOverrides = mutation({
  args: {
    userId: v.id("users"),
    overrides: v.any(),
  },
  handler: async (ctx, { userId, overrides }) => {
    const profile = await requireOwnProfile(ctx, userId);
    await ctx.db.patch(profile._id, {
      themeOverrides: overrides,
    });
  },
});

/** Resetear overrides */
export const resetOverrides = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const profile = await requireOwnProfile(ctx, userId);
    await ctx.db.patch(profile._id, { themeOverrides: {} });
  },
});

/** Actualizar layout principal */
export const updateLayout = mutation({
  args: {
    userId: v.id("users"),
    layout: v.union(
      v.literal("LIST_ICON"),
      v.literal("GRID_ICON"),
      v.literal("GRID_IMAGE"),
      v.literal("LIST_IMAGE"),
    ),
  },
  handler: async (ctx, { userId, layout }) => {
    const profile = await requireOwnProfile(ctx, userId);
    if (
      (layout === "GRID_IMAGE" || layout === "LIST_IMAGE") &&
      profile.plan !== "PRO"
    ) {
      throw new ConvexError("Este layout requiere Pro");
    }
    await ctx.db.patch(profile._id, {
      mainLinksLayout: layout,
    });
  },
});

/** Toggle branding */
export const toggleBranding = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const profile = await requireOwnProfile(ctx, userId);
    if (profile.plan !== "PRO") {
      throw new ConvexError("Ocultar branding requiere Pro");
    }
    await ctx.db.patch(profile._id, {
      brandingEnabled: !profile.brandingEnabled,
    });
  },
});

/** Soft delete */
export const softDelete = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const profile = await requireOwnProfile(ctx, userId);
    await ctx.db.patch(profile._id, { deletedAt: Date.now() });
  },
});

// ─── Internal mutations ──────────────────────────────────────

/** Actualizar plan — solo se llama internamente */
export const updatePlan = internalMutation({
  args: {
    ownerId: v.string(),
    plan: v.union(v.literal("FREE"), v.literal("PRO")),
  },
  handler: async (ctx, { ownerId, plan }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .first();
    if (profile) {
      await ctx.db.patch(profile._id, { plan });
    }
  },
});
