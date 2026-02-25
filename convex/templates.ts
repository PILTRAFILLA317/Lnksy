import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// =============================================================
// Lnksy — Templates (hardcoded MVP)
// =============================================================

interface TemplateLink {
	title: string;
	url: string;
	platform?: string;
	subtitle?: string;
}

interface TemplateComponent {
	type: string;
	title?: string;
	config: Record<string, any>;
	links?: TemplateLink[];
}

type ContactType =
	| "whatsapp"
	| "telegram"
	| "phone"
	| "email"
	| "instagram"
	| "tiktok";

interface TemplateContact {
	/** Contact button type */
	type: ContactType;
	/** Placeholder value shown in the panel — clearly editable */
	value: string;
	/** Whether the button is visible on the public profile by default */
	isEnabled: boolean;
}

export interface TemplateDefinition {
	id: string;
	name: string;
	description: string;
	bestFor: string;
	emoji: string;
	isPro: boolean;
	components: TemplateComponent[];
	/**
	 * Contact button presets applied when the template is applied.
	 * Only creates contacts that don't already exist — never overwrites
	 * the user's existing contact configuration.
	 */
	defaultContacts?: TemplateContact[];
}

// ─── Template catalog (hardcoded) ────────────────────────────

export const TEMPLATES: TemplateDefinition[] = [
	{
		id: "minimal",
		name: "Minimal",
		description: "Clean and simple. Just your links, nothing extra.",
		bestFor: "Anyone starting out",
		emoji: "✦",
		isPro: false,
		components: [
			{
				type: "links",
				title: "Links",
				config: { layout: "LIST_ICON" },
				links: [
					{ title: "My Website", url: "https://example.com" },
					{
						title: "Twitter / X",
						url: "https://twitter.com",
						platform: "twitter",
					},
					{
						title: "Instagram",
						url: "https://instagram.com",
						platform: "instagram",
					},
				],
			},
		],
		defaultContacts: [
			// Starts disabled so it doesn't show publicly until the user fills it in
			{ type: "email", value: "hello@youremail.com", isEnabled: false },
		],
	},

	{
		id: "musician",
		name: "Musician / Artist",
		description:
			"Showcase your music, tour dates, and merch with a dedicated artist page.",
		bestFor: "Musicians, bands, artists, producers",
		emoji: "🎵",
		isPro: false,
		components: [
			{
				type: "spotify",
				title: "Latest Release",
				// embedUri empty → SpotifyBlock renders nothing until user pastes a link
				config: { embedUri: "", embedType: "album", compact: false },
			},
			{
				type: "links",
				title: "Listen",
				config: { layout: "LIST_ICON" },
				links: [
					{
						title: "Spotify",
						url: "https://open.spotify.com/artist/yourname",
						platform: "spotify",
						subtitle: "Stream my music",
					},
					{
						title: "Apple Music",
						url: "https://music.apple.com/artist/yourname",
						platform: "apple",
						subtitle: "Available on Apple Music",
					},
					{
						title: "YouTube",
						url: "https://youtube.com/@yourname",
						platform: "youtube",
						subtitle: "Music videos & more",
					},
				],
			},
			{
				type: "links",
				title: "Shows / Tickets",
				config: { layout: "LIST_ICON" },
				links: [
					{
						title: "Upcoming Shows",
						url: "https://example.com/shows",
						subtitle: "Buy tickets now",
					},
				],
			},
			{
				type: "links",
				title: "Merch & Support",
				config: { layout: "LIST_ICON" },
				links: [
					{
						title: "Official Merch",
						url: "https://example.com/merch",
						subtitle: "Wear the music",
					},
					{
						title: "Support on Patreon",
						url: "https://patreon.com/yourname",
						platform: "patreon",
						subtitle: "Access exclusive content",
					},
				],
			},
		],
		defaultContacts: [
			// Booking email — disabled until the artist fills in their address
			{ type: "email", value: "booking@yourname.com", isEnabled: false },
		],
	},

	{
		id: "content-creator",
		name: "Content Creator",
		description:
			"For streamers, YouTubers, and creators with Patreon, Ko-fi, or other support pages.",
		bestFor: "Streamers, YouTubers, creators",
		emoji: "🎬",
		isPro: false,
		components: [
			{
				type: "youtube",
				title: "Latest Video",
				config: { videoId: "", aspectRatio: "16:9" },
			},
			{
				type: "live",
				title: "Watch Live",
				config: {
					url: "",
					platform: "twitch",
					label: "Watch me live on Twitch",
				},
			},
			{
				type: "links",
				title: "Support",
				config: { layout: "LIST_ICON" },
				links: [
					{
						title: "Patreon",
						url: "https://patreon.com/yourname",
						platform: "patreon",
						subtitle: "Support my work",
					},
					{
						title: "Ko-fi",
						url: "https://ko-fi.com/yourname",
						platform: "kofi",
						subtitle: "Buy me a coffee",
					},
				],
			},
			{
				type: "links",
				title: "Social Links",
				config: { layout: "LIST_ICON" },
				links: [
					{
						title: "Discord",
						url: "https://discord.gg/yourserver",
						platform: "discord",
					},
					{
						title: "Twitter / X",
						url: "https://twitter.com/yourhandle",
						platform: "twitter",
					},
					{
						title: "Instagram",
						url: "https://instagram.com/yourhandle",
						platform: "instagram",
					},
				],
			},
		],
	},

	{
		id: "portfolio",
		name: "Portfolio",
		description:
			"Showcase your work and direct people to your best projects.",
		bestFor: "Developers, designers, photographers",
		emoji: "💼",
		isPro: false,
		components: [
			{
				type: "text",
				title: "About",
				config: {
					content:
						"👋 Hi, I'm [Name]. I build [things]. Here's my work:",
					align: "center",
					variant: "callout",
				},
			},
			{
				type: "links",
				title: "Featured Projects",
				config: { layout: "GRID_ICON" },
				links: [
					{
						title: "Project One",
						url: "https://example.com/project1",
						subtitle: "What it does",
					},
					{
						title: "Project Two",
						url: "https://example.com/project2",
						subtitle: "What it does",
					},
				],
			},
			{
				type: "links",
				title: "Elsewhere",
				config: { layout: "LIST_ICON" },
				links: [
					{
						title: "GitHub",
						url: "https://github.com/yourname",
						platform: "github",
					},
					{
						title: "Dribbble",
						url: "https://dribbble.com/yourname",
						platform: "dribbble",
					},
					{
						title: "LinkedIn",
						url: "https://linkedin.com/in/yourname",
						platform: "linkedin",
					},
				],
			},
		],
	},

	{
		id: "local",
		name: "Local",
		description:
			"Perfect for restaurants, shops, and local services with hours and location.",
		bestFor: "Restaurants, shops, local services",
		emoji: "📍",
		isPro: false,
		components: [
			{
				type: "links",
				title: "Contact",
				config: { layout: "LIST_ICON" },
				links: [
					{
						title: "Call us",
						url: "tel:+1234567890",
						subtitle: "Mon–Sat 9am–6pm",
					},
					{
						title: "WhatsApp",
						url: "https://wa.me/1234567890",
						platform: "whatsapp",
					},
					{
						title: "Get directions",
						url: "https://maps.google.com",
						subtitle: "Find us on Maps",
					},
				],
			},
			{
				type: "links",
				title: "Menu / Services",
				config: { layout: "GRID_ICON" },
				links: [
					{ title: "View Menu", url: "https://example.com/menu" },
					{
						title: "Book a table",
						url: "https://example.com/book",
					},
				],
			},
			{
				type: "text",
				title: "Hours & Location",
				config: {
					content:
						"📍 123 Main Street\n\n🕐 Mon–Fri: 9am – 8pm\n🕐 Sat–Sun: 10am – 6pm",
					align: "center",
					variant: "plain",
				},
			},
			{
				type: "links",
				title: "Reviews",
				config: { layout: "LIST_ICON" },
				links: [
					{
						title: "Google Reviews",
						url: "https://g.page/yourplace/review",
						subtitle: "Leave a review",
					},
					{
						title: "TripAdvisor",
						url: "https://tripadvisor.com",
						subtitle: "See our reviews",
					},
				],
			},
		],
		// Quick-tap buttons for the contact row — disabled until values are updated
		defaultContacts: [
			{ type: "phone", value: "+1 234 567 8900", isEnabled: false },
			{ type: "whatsapp", value: "+1 234 567 8900", isEnabled: false },
		],
	},

	{
		id: "shop",
		name: "Shop",
		description:
			"Drive sales with a focused page for products, drops, and policies.",
		bestFor: "Online stores, drops, products",
		emoji: "🛍️",
		isPro: false,
		components: [
			{
				type: "text",
				title: "New Drop",
				config: {
					content: "🔥 New drop available now — don't miss it.",
					align: "center",
					variant: "callout",
				},
			},
			{
				type: "links",
				title: "Shop",
				config: { layout: "GRID_ICON" },
				links: [
					{ title: "Shop All", url: "https://example.com/shop" },
					{
						title: "New Arrivals",
						url: "https://example.com/new",
					},
					{
						title: "Best Sellers",
						url: "https://example.com/bestsellers",
					},
				],
			},
			{
				type: "links",
				title: "Info",
				config: { layout: "LIST_ICON" },
				links: [
					{
						title: "Shipping Policy",
						url: "https://example.com/shipping",
					},
					{
						title: "Returns",
						url: "https://example.com/returns",
					},
					{
						title: "Contact Support",
						url: "https://example.com/contact",
					},
				],
			},
		],
	},

	{
		id: "coach",
		name: "Coach / Courses",
		description:
			"Convert visitors into clients or students with a clear call-to-action.",
		bestFor: "Coaches, educators, course creators",
		emoji: "🎓",
		isPro: false,
		components: [
			{
				type: "text",
				title: "Your transformation starts here",
				config: {
					content:
						"Ready to level up? 🚀 Book a free call or join the course below.",
					align: "center",
					variant: "callout",
				},
			},
			{
				type: "links",
				title: "Start Here",
				config: { layout: "LIST_ICON" },
				links: [
					{
						title: "Book a free call",
						url: "https://calendly.com/yourname",
						subtitle: "30 min, no commitment",
					},
					{
						title: "Free resource",
						url: "https://example.com/freebie",
						subtitle: "Download now",
					},
				],
			},
			{
				type: "links",
				title: "Offers",
				config: { layout: "LIST_ICON" },
				links: [
					{
						title: "1:1 Coaching",
						url: "https://example.com/coaching",
						subtitle: "Work with me directly",
					},
					{
						title: "Online Course",
						url: "https://example.com/course",
						subtitle: "Self-paced learning",
					},
				],
			},
			{
				type: "youtube",
				title: "Watch my intro",
				config: { videoId: "", aspectRatio: "16:9" },
			},
		],
		defaultContacts: [
			// Email for inquiries — disabled until the coach adds their address
			{ type: "email", value: "hello@yourname.com", isEnabled: false },
		],
	},
];

// ─── Queries ──────────────────────────────────────────────────

export const listTemplates = query({
	args: {},
	handler: async () => {
		// Return template metadata only (component details stay internal)
		return TEMPLATES.map(({ id, name, description, bestFor, emoji, isPro }) => ({
			id,
			name,
			description,
			bestFor,
			emoji,
			isPro,
		}));
	},
});

// ─── Mutations ────────────────────────────────────────────────

export const applyTemplate = mutation({
	args: {
		userId: v.id("users"),
		templateId: v.string(),
	},
	handler: async (ctx, { userId, templateId }) => {
		// 1. Find the template definition
		const template = TEMPLATES.find((t) => t.id === templateId);
		if (!template) throw new ConvexError("Template not found");

		// 2. Get user's profile
		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_owner", (q: any) => q.eq("ownerId", userId))
			.first();
		if (!profile) throw new ConvexError("Profile not found");

		// 3. Get all existing components
		const existingComponents = await ctx.db
			.query("profileComponents")
			.withIndex("by_profile", (q: any) =>
				q.eq("profileId", profile._id),
			)
			.collect();

		// 4. Collect existing links BEFORE deleting (to preserve in "Old links")
		type SavedLink = {
			title: string;
			url: string;
			platform?: string;
			subtitle?: string;
			isActive: boolean;
			orderIndex: number;
		};
		const savedLinks: SavedLink[] = [];

		for (const comp of existingComponents) {
			if (comp.type === "links") {
				const links = await ctx.db
					.query("links")
					.withIndex("by_component", (q: any) =>
						q.eq("componentId", comp._id),
					)
					.collect();
				for (const link of links) {
					savedLinks.push({
						title: link.title,
						url: link.url,
						platform: link.platform,
						subtitle: link.subtitle,
						isActive: link.isActive ?? true,
						orderIndex: link.orderIndex,
					});
				}
			}
		}

		// 5. Delete all existing components + their links (cascade)
		for (const comp of existingComponents) {
			const links = await ctx.db
				.query("links")
				.withIndex("by_component", (q: any) =>
					q.eq("componentId", comp._id),
				)
				.collect();
			for (const link of links) {
				await ctx.db.delete(link._id);
			}
			await ctx.db.delete(comp._id);
		}

		// 6. Create template components (orderIndex: 10, 20, 30…)
		let orderIndex = 10;

		for (const tComp of template.components) {
			const componentId = await ctx.db.insert("profileComponents", {
				profileId: profile._id,
				type: tComp.type as any,
				title: tComp.title ?? undefined,
				config: tComp.config,
				orderIndex,
				isVisible: true,
				updatedAt: Date.now(),
			});

			// Create placeholder links for links-type components
			if (
				tComp.type === "links" &&
				tComp.links &&
				tComp.links.length > 0
			) {
				for (let li = 0; li < tComp.links.length; li++) {
					const link = tComp.links[li];
					await ctx.db.insert("links", {
						profileId: profile._id,
						componentId,
						title: link.title,
						url: link.url,
						platform: link.platform ?? undefined,
						subtitle: link.subtitle ?? undefined,
						icon: undefined,
						imageUrl: undefined,
						orderIndex: li,
						isActive: true,
						highlight: false,
						startAt: undefined,
						endAt: undefined,
						updatedAt: Date.now(),
					});
				}
			}

			orderIndex += 10;
		}

		// 7. If user had existing links, preserve them in a hidden "Old links" component
		if (savedLinks.length > 0) {
			const oldLinksId = await ctx.db.insert("profileComponents", {
				profileId: profile._id,
				type: "links",
				title: "Old links",
				config: { layout: "LIST_ICON" },
				orderIndex,
				isVisible: false,
				updatedAt: Date.now(),
			});

			for (let i = 0; i < savedLinks.length; i++) {
				const link = savedLinks[i];
				await ctx.db.insert("links", {
					profileId: profile._id,
					componentId: oldLinksId,
					title: link.title,
					url: link.url,
					platform: link.platform ?? undefined,
					subtitle: link.subtitle ?? undefined,
					icon: undefined,
					imageUrl: undefined,
					orderIndex: i,
					isActive: link.isActive,
					highlight: false,
					startAt: undefined,
					endAt: undefined,
					updatedAt: Date.now(),
				});
			}
		}

		// 8. Apply default contact buttons (only for types not already present)
		//    This never overwrites existing user contacts.
		let addedContacts = 0;
		if (template.defaultContacts && template.defaultContacts.length > 0) {
			for (const tContact of template.defaultContacts) {
				// Check if the user already has this contact type configured
				const existing = await ctx.db
					.query("profileContacts")
					.withIndex("by_profile_type", (q: any) =>
						q
							.eq("profileId", profile._id)
							.eq("type", tContact.type),
					)
					.first();

				if (!existing) {
					// Find current max orderIndex for contacts
					const lastContact = await ctx.db
						.query("profileContacts")
						.withIndex("by_profile", (q: any) =>
							q.eq("profileId", profile._id),
						)
						.order("desc")
						.first();
					const contactOrderIndex = lastContact
						? lastContact.orderIndex + 1
						: addedContacts;

					await ctx.db.insert("profileContacts", {
						profileId: profile._id,
						type: tContact.type,
						value: tContact.value,
						orderIndex: contactOrderIndex,
						isEnabled: tContact.isEnabled,
					});
					addedContacts++;
				}
			}
		}

		return {
			applied: true,
			templateId,
			savedLinksCount: savedLinks.length,
			addedContacts,
		};
	},
});
