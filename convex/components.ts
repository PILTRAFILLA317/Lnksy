import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// =============================================================
// Lnksy — Profile Components (Page Builder Blocks)
// =============================================================

const FREE_COMPONENT_LIMIT = 6;

const COMPONENT_TYPES = [
	"links",
	"youtube",
	"spotify",
	"divider",
	"text",
	"live",
] as const;

const componentTypeValidator = v.union(
	v.literal("links"),
	v.literal("youtube"),
	v.literal("spotify"),
	v.literal("divider"),
	v.literal("text"),
	v.literal("live"),
);

// ─── Helpers ─────────────────────────────────────────────────

async function requireOwnerAndProfile(ctx: any, userId: string) {
	const profile = await ctx.db
		.query("profiles")
		.withIndex("by_owner", (q: any) => q.eq("ownerId", userId))
		.first();
	if (!profile) throw new ConvexError("Perfil no encontrado");
	return { profile };
}

function defaultConfig(type: string): Record<string, any> {
	switch (type) {
		case "links":
			return { layout: "LIST_ICON" };
		case "youtube":
			return { videoId: "", aspectRatio: "16:9" };
		case "spotify":
			return { embedUri: "", embedType: "track", compact: false };
		case "text":
			return { content: "", align: "center", variant: "plain" };
		case "divider":
			return { style: "line", height: 1 };
		case "live":
			return { url: "", platform: "twitch", label: "Watch me live" };
		default:
			return {};
	}
}

function validateConfig(type: string, config: any): Record<string, any> {
	const safe: Record<string, any> = {};

	switch (type) {
		case "links": {
			const validLayouts = ["LIST_ICON", "GRID_ICON", "GRID_IMAGE", "LIST_IMAGE"];
			safe.layout = validLayouts.includes(config?.layout)
				? config.layout
				: "LIST_ICON";
			break;
		}
		case "youtube": {
			safe.videoId =
				typeof config?.videoId === "string"
					? config.videoId.trim().slice(0, 100)
					: "";
			const validAR = ["16:9", "4:3", "1:1"];
			safe.aspectRatio = validAR.includes(config?.aspectRatio)
				? config.aspectRatio
				: "16:9";
			break;
		}
		case "spotify": {
			safe.embedUri =
				typeof config?.embedUri === "string"
					? config.embedUri.trim().slice(0, 200)
					: "";
			const validTypes = ["track", "album", "playlist", "artist"];
			safe.embedType = validTypes.includes(config?.embedType)
				? config.embedType
				: "track";
			safe.compact = config?.compact === true;
			break;
		}
		case "text": {
			safe.content =
				typeof config?.content === "string"
					? config.content.slice(0, 2000)
					: "";
			const validAligns = ["left", "center", "right"];
			safe.align = validAligns.includes(config?.align)
				? config.align
				: "center";
			const validVariants = ["plain", "callout", "cta"];
			safe.variant = validVariants.includes(config?.variant)
				? config.variant
				: "plain";
			break;
		}
		case "divider": {
			const validStyles = ["line", "dots", "space"];
			safe.style = validStyles.includes(config?.style)
				? config.style
				: "line";
			safe.height =
				typeof config?.height === "number"
					? Math.max(1, Math.min(config.height, 5))
					: 1;
			break;
		}
		case "live": {
			const rawUrl =
				typeof config?.url === "string" ? config.url.trim() : "";
			// Validate URL: only twitch.tv, kick.com, or safe https URLs
			let safeUrl = "";
			if (rawUrl) {
				try {
					const u = new URL(rawUrl);
					const host = u.hostname.replace(/^www\./, "");
					if (
						u.protocol === "https:" &&
						!rawUrl.toLowerCase().startsWith("javascript:")
					) {
						if (
							host === "twitch.tv" ||
							host === "kick.com" ||
							config?.platform === "other"
						) {
							safeUrl = rawUrl.slice(0, 500);
						}
					}
				} catch {
					// Invalid URL — leave empty
				}
			}
			safe.url = safeUrl;
			const validPlatforms = ["twitch", "kick", "other"];
			safe.platform = validPlatforms.includes(config?.platform)
				? config.platform
				: "twitch";
			safe.label =
				typeof config?.label === "string"
					? config.label.trim().slice(0, 100)
					: "Watch Live";
			break;
		}
	}

	return safe;
}

// ─── Queries ─────────────────────────────────────────────────

export const getByProfile = query({
	args: { profileId: v.id("profiles") },
	handler: async (ctx, { profileId }) => {
		return await ctx.db
			.query("profileComponents")
			.withIndex("by_profile", (q) => q.eq("profileId", profileId))
			.order("asc")
			.collect();
	},
});

export const getVisibleByProfile = query({
	args: { profileId: v.id("profiles") },
	handler: async (ctx, { profileId }) => {
		return await ctx.db
			.query("profileComponents")
			.withIndex("by_profile", (q) => q.eq("profileId", profileId))
			.filter((q) => q.eq(q.field("isVisible"), true))
			.order("asc")
			.collect();
	},
});

// ─── Mutations ───────────────────────────────────────────────

export const add = mutation({
	args: {
		userId: v.id("users"),
		type: componentTypeValidator,
		title: v.optional(v.string()),
		config: v.optional(v.any()),
	},
	handler: async (ctx, { userId, type, title, config }) => {
		const { profile } = await requireOwnerAndProfile(ctx, userId);

		// Enforce FREE component limit
		if (profile.plan === "FREE") {
			const existing = await ctx.db
				.query("profileComponents")
				.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
				.collect();
			if (existing.length >= FREE_COMPONENT_LIMIT) {
				throw new ConvexError(
					`Free plan is limited to ${FREE_COMPONENT_LIMIT} components. Upgrade to Pro for unlimited.`
				);
			}
		}

		// Get max orderIndex
		const all = await ctx.db
			.query("profileComponents")
			.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
			.order("desc")
			.first();
		const orderIndex = all ? all.orderIndex + 1 : 0;

		const validatedConfig = config
			? validateConfig(type, config)
			: defaultConfig(type);

		const componentId = await ctx.db.insert("profileComponents", {
			profileId: profile._id,
			type,
			title: title?.trim() || undefined,
			config: validatedConfig,
			orderIndex,
			isVisible: true,
			updatedAt: Date.now(),
		});

		return componentId;
	},
});

export const update = mutation({
	args: {
		userId: v.id("users"),
		componentId: v.id("profileComponents"),
		title: v.optional(v.string()),
		config: v.optional(v.any()),
	},
	handler: async (ctx, { userId, componentId, title, config }) => {
		const { profile } = await requireOwnerAndProfile(ctx, userId);

		const component = await ctx.db.get(componentId);
		if (!component || component.profileId !== profile._id) {
			throw new ConvexError("Component not found");
		}

		const patch: Record<string, any> = { updatedAt: Date.now() };
		if (title !== undefined) {
			patch.title = title.trim() || undefined;
		}
		if (config !== undefined) {
			patch.config = validateConfig(component.type, config);
		}

		await ctx.db.patch(componentId, patch);
	},
});

export const toggle = mutation({
	args: {
		userId: v.id("users"),
		componentId: v.id("profileComponents"),
	},
	handler: async (ctx, { userId, componentId }) => {
		const { profile } = await requireOwnerAndProfile(ctx, userId);

		const component = await ctx.db.get(componentId);
		if (!component || component.profileId !== profile._id) {
			throw new ConvexError("Component not found");
		}

		await ctx.db.patch(componentId, {
			isVisible: !component.isVisible,
			updatedAt: Date.now(),
		});
	},
});

export const duplicate = mutation({
	args: {
		userId: v.id("users"),
		componentId: v.id("profileComponents"),
	},
	handler: async (ctx, { userId, componentId }) => {
		const { profile } = await requireOwnerAndProfile(ctx, userId);

		// Enforce FREE limit
		if (profile.plan === "FREE") {
			const existing = await ctx.db
				.query("profileComponents")
				.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
				.collect();
			if (existing.length >= FREE_COMPONENT_LIMIT) {
				throw new ConvexError("Component limit reached");
			}
		}

		const original = await ctx.db.get(componentId);
		if (!original || original.profileId !== profile._id) {
			throw new ConvexError("Component not found");
		}

		// Get max orderIndex
		const last = await ctx.db
			.query("profileComponents")
			.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
			.order("desc")
			.first();
		const orderIndex = last ? last.orderIndex + 1 : 0;

		const newComponentId = await ctx.db.insert("profileComponents", {
			profileId: profile._id,
			type: original.type,
			title: original.title ? `${original.title} (copy)` : undefined,
			config: { ...original.config },
			orderIndex,
			isVisible: original.isVisible,
			updatedAt: Date.now(),
		});

		// If links type, duplicate all links too
		if (original.type === "links") {
			const links = await ctx.db
				.query("links")
				.withIndex("by_component", (q) => q.eq("componentId", componentId))
				.collect();
			for (const link of links) {
				await ctx.db.insert("links", {
					profileId: profile._id,
					componentId: newComponentId,
					title: link.title,
					url: link.url,
					subtitle: link.subtitle,
					icon: link.icon,
					imageUrl: link.imageUrl,
					platform: link.platform,
					orderIndex: link.orderIndex,
					isActive: link.isActive,
					highlight: false,
					startAt: undefined,
					endAt: undefined,
					updatedAt: Date.now(),
				});
			}
		}

		return newComponentId;
	},
});

export const remove = mutation({
	args: {
		userId: v.id("users"),
		componentId: v.id("profileComponents"),
	},
	handler: async (ctx, { userId, componentId }) => {
		const { profile } = await requireOwnerAndProfile(ctx, userId);

		const component = await ctx.db.get(componentId);
		if (!component || component.profileId !== profile._id) {
			throw new ConvexError("Component not found");
		}

		// Cascade delete links if type=links
		if (component.type === "links") {
			const links = await ctx.db
				.query("links")
				.withIndex("by_component", (q) => q.eq("componentId", componentId))
				.collect();
			for (const link of links) {
				await ctx.db.delete(link._id);
			}
		}

		await ctx.db.delete(componentId);
	},
});

export const reorder = mutation({
	args: {
		userId: v.id("users"),
		order: v.array(v.id("profileComponents")),
	},
	handler: async (ctx, { userId, order }) => {
		const { profile } = await requireOwnerAndProfile(ctx, userId);
		for (let i = 0; i < order.length; i++) {
			const component = await ctx.db.get(order[i]);
			if (!component || component.profileId !== profile._id) continue;
			await ctx.db.patch(order[i], {
				orderIndex: i,
				updatedAt: Date.now(),
			});
		}
	},
});

export const moveUp = mutation({
	args: {
		userId: v.id("users"),
		componentId: v.id("profileComponents"),
	},
	handler: async (ctx, { userId, componentId }) => {
		const { profile } = await requireOwnerAndProfile(ctx, userId);

		const all = await ctx.db
			.query("profileComponents")
			.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
			.order("asc")
			.collect();

		const idx = all.findIndex((c) => c._id === componentId);
		if (idx <= 0) return; // already first or not found

		// Swap orderIndex with previous
		const prev = all[idx - 1];
		const curr = all[idx];
		await ctx.db.patch(prev._id, { orderIndex: curr.orderIndex, updatedAt: Date.now() });
		await ctx.db.patch(curr._id, { orderIndex: prev.orderIndex, updatedAt: Date.now() });
	},
});

export const moveDown = mutation({
	args: {
		userId: v.id("users"),
		componentId: v.id("profileComponents"),
	},
	handler: async (ctx, { userId, componentId }) => {
		const { profile } = await requireOwnerAndProfile(ctx, userId);

		const all = await ctx.db
			.query("profileComponents")
			.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
			.order("asc")
			.collect();

		const idx = all.findIndex((c) => c._id === componentId);
		if (idx < 0 || idx >= all.length - 1) return; // already last or not found

		// Swap orderIndex with next
		const next = all[idx + 1];
		const curr = all[idx];
		await ctx.db.patch(next._id, { orderIndex: curr.orderIndex, updatedAt: Date.now() });
		await ctx.db.patch(curr._id, { orderIndex: next.orderIndex, updatedAt: Date.now() });
	},
});
