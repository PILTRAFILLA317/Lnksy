import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";
import { createConvexClient } from "$lib/server/convex.js";
import {
	hashToken,
	generateToken,
	createSessionCookie,
	sessionExpiresAt,
} from "$lib/server/auth.js";
import { api } from "$convex/_generated/api.js";

/**
 * Handles GET /auth/verify?token=RAW_TOKEN
 * Consumes the token, marks user verified, auto-login.
 */
export const load: PageServerLoad = async ({
	url,
	cookies,
}) => {
	const rawToken = url.searchParams.get("token");

	if (!rawToken) {
		redirect(303, "/auth/login");
	}

	const convex = createConvexClient();
	const tokenHash = hashToken(rawToken);

	// Generate a session for auto-login after verify
	const sessionToken = generateToken();
	const sessHash = hashToken(sessionToken);
	const sessExpires = sessionExpiresAt();

	try {
		await convex.mutation(api.customAuth.verifyEmail, {
			tokenHash,
			sessionTokenHash: sessHash,
			sessionExpiresAt: sessExpires,
		});
	} catch (e: any) {
		const msg = e?.message ?? "";
		if (msg.includes("TOKEN_EXPIRED")) {
			redirect(303, "/auth/verify-pending?error=expired");
		}
		redirect(303, "/auth/verify-pending?error=invalid");
	}

	createSessionCookie(cookies, sessionToken);
	redirect(303, "/app");
};
