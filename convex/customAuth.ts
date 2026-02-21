import { v } from "convex/values";
import {
	mutation,
	query,
	internalMutation,
	internalQuery,
} from "./_generated/server";
import bcryptjs from "bcryptjs";

// =============================================================
// Lnksy — Custom Auth (email + password)
// =============================================================

const BCRYPT_ROUNDS = 12;

// ─── Public mutations (called from SvelteKit) ────────────────

/**
 * Signup: create user with hashed password.
 * Returns the new userId.
 */
export const signup = mutation({
	args: {
		email: v.string(),
		passwordHash: v.string(),
	},
	handler: async (ctx, { email, passwordHash }) => {
		const existing = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", email))
			.first();
		if (existing) {
			throw new Error("ACCOUNT_EXISTS");
		}
		const userId = await ctx.db.insert("users", {
			email,
			passwordHash,
			emailVerified: false,
			createdAt: Date.now(),
		});
		return userId;
	},
});

/**
 * Login: verify password, create session.
 * Password comparison happens here (in the Convex runtime).
 * Returns { userId, emailVerified } or throws.
 */
export const login = mutation({
	args: {
		email: v.string(),
		password: v.string(),
		sessionTokenHash: v.string(),
		sessionExpiresAt: v.number(),
	},
	handler: async (
		ctx,
		{ email, password, sessionTokenHash, sessionExpiresAt },
	) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", email))
			.first();
		if (!user) {
			throw new Error("INVALID_CREDENTIALS");
		}

		const valid = bcryptjs.compareSync(password, user.passwordHash);
		if (!valid) {
			throw new Error("INVALID_CREDENTIALS");
		}

		// Create session
		await ctx.db.insert("sessions", {
			userId: user._id,
			tokenHash: sessionTokenHash,
			expiresAt: sessionExpiresAt,
			createdAt: Date.now(),
		});

		return {
			userId: user._id,
			emailVerified: user.emailVerified,
		};
	},
});

/**
 * Get current user by session token hash.
 */
export const getUserBySession = query({
	args: { tokenHash: v.string() },
	handler: async (ctx, { tokenHash }) => {
		const session = await ctx.db
			.query("sessions")
			.withIndex("by_token_hash", (q) =>
				q.eq("tokenHash", tokenHash),
			)
			.first();
		if (!session) return null;
		if (session.expiresAt < Date.now()) return null;

		const user = await ctx.db.get(session.userId);
		if (!user) return null;

		return {
			id: user._id,
			email: user.email,
			emailVerified: user.emailVerified,
		};
	},
});

/**
 * Store verification/reset token hash.
 */
export const storeVerificationToken = mutation({
	args: {
		userId: v.id("users"),
		email: v.string(),
		tokenHash: v.string(),
		type: v.union(v.literal("verify"), v.literal("reset")),
		expiresAt: v.number(),
	},
	handler: async (
		ctx,
		{ userId, email, tokenHash, type, expiresAt },
	) => {
		// Delete any existing tokens of the same type for user
		const existing = await ctx.db
			.query("verificationTokens")
			.withIndex("by_user_type", (q) =>
				q.eq("userId", userId).eq("type", type),
			)
			.collect();
		for (const tok of existing) {
			await ctx.db.delete(tok._id);
		}

		await ctx.db.insert("verificationTokens", {
			userId,
			email,
			tokenHash,
			type,
			expiresAt,
			createdAt: Date.now(),
		});
	},
});

/**
 * Verify email: consume token, mark user verified,
 * create session.
 */
export const verifyEmail = mutation({
	args: {
		tokenHash: v.string(),
		sessionTokenHash: v.string(),
		sessionExpiresAt: v.number(),
	},
	handler: async (
		ctx,
		{ tokenHash, sessionTokenHash, sessionExpiresAt },
	) => {
		const token = await ctx.db
			.query("verificationTokens")
			.withIndex("by_token_hash", (q) =>
				q.eq("tokenHash", tokenHash),
			)
			.first();
		if (!token) throw new Error("INVALID_TOKEN");
		if (token.type !== "verify") throw new Error("INVALID_TOKEN");
		if (token.expiresAt < Date.now()) {
			await ctx.db.delete(token._id);
			throw new Error("TOKEN_EXPIRED");
		}

		// Mark user verified
		await ctx.db.patch(token.userId, { emailVerified: true });

		// Delete the token
		await ctx.db.delete(token._id);

		// Create session (auto-login after verify)
		await ctx.db.insert("sessions", {
			userId: token.userId,
			tokenHash: sessionTokenHash,
			expiresAt: sessionExpiresAt,
			createdAt: Date.now(),
		});

		return { userId: token.userId };
	},
});

/**
 * Consume a reset token, update password, create session.
 */
export const resetPassword = mutation({
	args: {
		tokenHash: v.string(),
		newPasswordHash: v.string(),
		sessionTokenHash: v.string(),
		sessionExpiresAt: v.number(),
	},
	handler: async (
		ctx,
		{
			tokenHash,
			newPasswordHash,
			sessionTokenHash,
			sessionExpiresAt,
		},
	) => {
		const token = await ctx.db
			.query("verificationTokens")
			.withIndex("by_token_hash", (q) =>
				q.eq("tokenHash", tokenHash),
			)
			.first();
		if (!token) throw new Error("INVALID_TOKEN");
		if (token.type !== "reset") throw new Error("INVALID_TOKEN");
		if (token.expiresAt < Date.now()) {
			await ctx.db.delete(token._id);
			throw new Error("TOKEN_EXPIRED");
		}

		// Update password
		await ctx.db.patch(token.userId, {
			passwordHash: newPasswordHash,
		});

		// Delete all sessions for user (force re-login)
		const sessions = await ctx.db
			.query("sessions")
			.withIndex("by_user", (q) =>
				q.eq("userId", token.userId),
			)
			.collect();
		for (const s of sessions) {
			await ctx.db.delete(s._id);
		}

		// Delete the token
		await ctx.db.delete(token._id);

		// Create new session (auto-login after reset)
		await ctx.db.insert("sessions", {
			userId: token.userId,
			tokenHash: sessionTokenHash,
			expiresAt: sessionExpiresAt,
			createdAt: Date.now(),
		});

		return { userId: token.userId };
	},
});

/**
 * Request password reset.
 * Returns { found: true } if user exists (caller should
 * NOT expose this to the end user — always show success).
 */
export const requestPasswordReset = mutation({
	args: {
		email: v.string(),
		tokenHash: v.string(),
		expiresAt: v.number(),
	},
	handler: async (ctx, { email, tokenHash, expiresAt }) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", email))
			.first();
		if (!user) {
			return { found: false };
		}

		// Delete existing reset tokens
		const existing = await ctx.db
			.query("verificationTokens")
			.withIndex("by_user_type", (q) =>
				q.eq("userId", user._id).eq("type", "reset"),
			)
			.collect();
		for (const tok of existing) {
			await ctx.db.delete(tok._id);
		}

		await ctx.db.insert("verificationTokens", {
			userId: user._id,
			email,
			tokenHash,
			type: "reset",
			expiresAt,
			createdAt: Date.now(),
		});

		return { found: true };
	},
});

/**
 * Logout: delete session by token hash.
 */
export const logout = mutation({
	args: { tokenHash: v.string() },
	handler: async (ctx, { tokenHash }) => {
		const session = await ctx.db
			.query("sessions")
			.withIndex("by_token_hash", (q) =>
				q.eq("tokenHash", tokenHash),
			)
			.first();
		if (session) {
			await ctx.db.delete(session._id);
		}
	},
});

/**
 * Get user by email (for forgot-password flow).
 * Internal so it can't be called from client.
 */
export const getUserByEmail = internalQuery({
	args: { email: v.string() },
	handler: async (ctx, { email }) => {
		return await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", email))
			.first();
	},
});

/**
 * Hash password helper — runs in Convex runtime.
 * Called as a mutation so SvelteKit doesn't need
 * bcryptjs installed on the server.
 */
export const hashPassword = mutation({
	args: { password: v.string() },
	handler: async (_ctx, { password }) => {
		return bcryptjs.hashSync(password, BCRYPT_ROUNDS);
	},
});

// ─── Internal mutations ──────────────────────────────────────

/**
 * Store a reset token for forgot-password.
 * Called internally from an action.
 */
export const storeResetToken = internalMutation({
	args: {
		userId: v.id("users"),
		email: v.string(),
		tokenHash: v.string(),
		expiresAt: v.number(),
	},
	handler: async (ctx, { userId, email, tokenHash, expiresAt }) => {
		// Delete existing reset tokens for user
		const existing = await ctx.db
			.query("verificationTokens")
			.withIndex("by_user_type", (q) =>
				q.eq("userId", userId).eq("type", "reset"),
			)
			.collect();
		for (const tok of existing) {
			await ctx.db.delete(tok._id);
		}

		await ctx.db.insert("verificationTokens", {
			userId,
			email,
			tokenHash,
			type: "reset",
			expiresAt,
			createdAt: Date.now(),
		});
	},
});
