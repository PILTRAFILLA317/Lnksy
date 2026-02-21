import { createHash, randomBytes } from "node:crypto";
import type { Cookies } from "@sveltejs/kit";

// =============================================================
// Lnksy — Auth helpers (server-only)
// =============================================================

const COOKIE_NAME = "__lnksy_session";
const SESSION_TTL_DAYS = 30;

/** SHA-256 hash of a token (for storing in DB). */
export function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

/** Generate a cryptographically random hex token. */
export function generateToken(): string {
	return randomBytes(32).toString("hex");
}

/** Set HttpOnly session cookie. */
export function createSessionCookie(
	cookies: Cookies,
	token: string,
): void {
	cookies.set(COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * SESSION_TTL_DAYS,
	});
}

/** Delete session cookie. */
export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(COOKIE_NAME, { path: "/" });
}

/** Read raw session token from cookie. */
export function getSessionToken(
	cookies: Cookies,
): string | undefined {
	return cookies.get(COOKIE_NAME);
}

/** Compute session expiry timestamp (ms). */
export function sessionExpiresAt(): number {
	return Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
}

/** Token expiry for verification/reset emails (1 hour). */
export function verificationExpiresAt(): number {
	return Date.now() + 60 * 60 * 1000;
}
