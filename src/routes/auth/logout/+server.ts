import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";
import { createConvexClient } from "$lib/server/convex.js";
import {
	getSessionToken,
	hashToken,
	clearSessionCookie,
} from "$lib/server/auth.js";
import { api } from "$convex/_generated/api.js";

export const POST: RequestHandler = async ({ cookies }) => {
	const rawToken = getSessionToken(cookies);

	if (rawToken) {
		const convex = createConvexClient();
		const tokenHash = hashToken(rawToken);
		try {
			await convex.mutation(api.customAuth.logout, {
				tokenHash,
			});
		} catch {
			// Session may already be expired/deleted
		}
	}

	clearSessionCookie(cookies);
	redirect(303, "/");
};
