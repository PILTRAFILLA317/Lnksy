import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { createConvexClient } from "$lib/server/convex.js";
import {
	generateToken,
	hashToken,
	verificationExpiresAt,
} from "$lib/server/auth.js";
import { sendVerifyEmail } from "$lib/server/email.js";
import { rateLimit } from "$lib/server/rate-limit.js";
import { api } from "$convex/_generated/api.js";
import { APP_BASE_URL } from "$env/static/private";

export const load: PageServerLoad = async ({
	locals,
	url,
}) => {
	// If already verified, go to app
	if (locals.user?.emailVerified) redirect(303, "/app");
	// If not logged in at all, go to login
	if (!locals.user) redirect(303, "/auth/login");

	return {
		email: locals.user.email,
		error: url.searchParams.get("error") ?? null,
	};
};

export const actions = {
	resend: async ({ locals, getClientAddress }) => {
		if (!locals.user) redirect(303, "/auth/login");

		const ip = getClientAddress();
		const key = `${ip}:${locals.user.email}`;

		if (!rateLimit("auth:resend", key)) {
			return fail(429, {
				error: "Espera al menos 1 minuto entre reenvíos.",
			});
		}
		if (
			!rateLimit("auth:resend:hour", `hour:${locals.user.email}`)
		) {
			return fail(429, {
				error:
					"Has alcanzado el límite de reenvíos. Inténtalo más tarde.",
			});
		}

		const convex = createConvexClient();
		const rawToken = generateToken();
		const tokenHash = hashToken(rawToken);
		const expiresAt = verificationExpiresAt();

		await convex.mutation(
			api.customAuth.storeVerificationToken,
			{
				userId: locals.user.id as any,
				email: locals.user.email,
				tokenHash,
				type: "verify",
				expiresAt,
			},
		);

		const verifyUrl = `${APP_BASE_URL}/auth/verify?token=${rawToken}`;
		try {
			await sendVerifyEmail(locals.user.email, verifyUrl);
		} catch {
			return fail(500, {
				error:
					"No se pudo enviar el email. Inténtalo de nuevo.",
			});
		}

		return { success: true };
	},
} satisfies Actions;
