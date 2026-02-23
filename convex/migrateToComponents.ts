import { internalMutation } from "./_generated/server";

/**
 * One-time migration: linkSections → profileComponents
 *
 * Run via Convex dashboard or CLI:
 *   npx convex run migrateToComponents:run
 *
 * Safe to run multiple times (idempotent).
 */
export const run = internalMutation({
	args: {},
	handler: async (ctx) => {
		const profiles = await ctx.db.query("profiles").collect();
		let migratedSections = 0;
		let migratedLinks = 0;

		for (const profile of profiles) {
			// Get all existing sections for this profile
			const sections = await ctx.db
				.query("linkSections")
				.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
				.order("asc")
				.collect();

			for (const section of sections) {
				// Check if already migrated (idempotent: look for component with same orderIndex + type)
				const existing = await ctx.db
					.query("profileComponents")
					.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
					.filter((q) =>
						q.and(
							q.eq(q.field("type"), "links"),
							q.eq(q.field("orderIndex"), section.orderIndex),
						),
					)
					.first();

				if (existing) {
					// Already migrated, but ensure links are pointed to this component
					const sectionLinks = await ctx.db
						.query("links")
						.withIndex("by_section", (q) => q.eq("sectionId", section._id))
						.collect();
					for (const link of sectionLinks) {
						if (!link.componentId || link.componentId !== existing._id) {
							await ctx.db.patch(link._id, { componentId: existing._id });
							migratedLinks++;
						}
					}
					continue;
				}

				// Create component from section
				const componentId = await ctx.db.insert("profileComponents", {
					profileId: profile._id,
					type: "links",
					title: section.title ?? undefined,
					config: { layout: section.layout ?? "LIST_ICON" },
					orderIndex: section.orderIndex,
					isVisible: section.isVisible,
					updatedAt: Date.now(),
				});
				migratedSections++;

				// Migrate all links in this section
				const sectionLinks = await ctx.db
					.query("links")
					.withIndex("by_section", (q) => q.eq("sectionId", section._id))
					.collect();

				for (const link of sectionLinks) {
					await ctx.db.patch(link._id, { componentId });
					migratedLinks++;
				}
			}

			// If profile has NO sections and NO components yet, create a default links component
			if (sections.length === 0) {
				const existingComponents = await ctx.db
					.query("profileComponents")
					.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
					.first();

				if (!existingComponents) {
					await ctx.db.insert("profileComponents", {
						profileId: profile._id,
						type: "links",
						title: undefined,
						config: { layout: profile.mainLinksLayout ?? "LIST_ICON" },
						orderIndex: 0,
						isVisible: true,
						updatedAt: Date.now(),
					});
					migratedSections++;
				}
			}
		}

		console.log(
			`Migration complete: ${migratedSections} sections → components, ${migratedLinks} links updated`,
		);
		return { migratedSections, migratedLinks };
	},
});
