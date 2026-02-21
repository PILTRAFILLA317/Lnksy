import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { createConvexClient } from "$lib/server/convex.js";
import {
	generateToken,
	hashToken,
	verificationExpiresAt,
} from "$lib/server/auth.js";
import { sendResetEmail } from "$lib/server/email.js";
import { rateLimit } from "$lib/server/rate-limit.js";
import { api } from "$convex/_generated/api.js";
import { APP_BASE_URL } from "$env/static/private";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.emailVerified) redirect(303, "/app");
	return {};
};

export const actions = {
	default: async ({ request, getClientAddress }) => {
		const ip = getClientAddress();
		const fd = await request.formData();
		const email = (fd.get("email") as string)
			?.trim()
			.toLowerCase();

		if (!email) {
			return fail(400, { error: "Email requerido.", email });
		}

		const key = `${ip}:${email}`;
		if (!rateLimit("auth:forgot", key)) {
			return fail(429, {
				error: "Demasiados intentos. Espera un momento.",
				email,
			});
		}

		const convex = createConvexClient();
		const rawToken = generateToken();
		const tokenHash = hashToken(rawToken);
		const expiresAt = verificationExpiresAt();

		try {
			const result = await convex.mutation(
				api.customAuth.requestPasswordReset,
				{ email, tokenHash, expiresAt },
			);

			if (result?.found) {
				const resetUrl =
					`${APP_BASE_URL}/auth/reset?token=${rawToken}`;
				await sendResetEmail(email, resetUrl);
			}
		} catch {
			// Silently ignore — don't leak email existence
		}

		// Always show success (don't leak email existence)
		return { sent: true, email };
	},
} satisfies Actions;
