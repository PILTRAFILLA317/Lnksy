import { query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================
// Lnksy — Users (public queries)
// =============================================================

/**
 * Get user by ID — used by SvelteKit server after resolving
 * session in hooks.server.ts. Accepts an explicit userId
 * because there is no JWT-based ctx.auth anymore.
 */
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      id: user._id,
      email: user.email,
      emailVerified: user.emailVerified,
    };
  },
});
