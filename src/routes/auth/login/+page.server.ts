import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { createConvexClient } from "$lib/server/convex.js";
import {
	generateToken,
	hashToken,
	createSessionCookie,
	sessionExpiresAt,
} from "$lib/server/auth.js";
import { rateLimit } from "$lib/server/rate-limit.js";
import { api } from "$convex/_generated/api.js";

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user?.emailVerified) redirect(303, "/app");
	return {
		redirectTo: url.searchParams.get("redirect") ?? "",
	};
};

export const actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const ip = getClientAddress();
		const fd = await request.formData();
		const email = (fd.get("email") as string)
			?.trim()
			.toLowerCase();
		const password = fd.get("password") as string;
		const redirectTo = (fd.get("redirect") as string) || "";

		if (!email || !password) {
			return fail(400, {
				error: "Email y contraseña requeridos.",
				email,
				redirectTo,
			});
		}

		const key = `${ip}:${email}`;
		if (!rateLimit("auth:login", key)) {
			return fail(429, {
				error: "Demasiados intentos. Espera un momento.",
				email,
				redirectTo,
			});
		}

		const convex = createConvexClient();

		// Generate session token before calling login
		const sessionToken = generateToken();
		const sessHash = hashToken(sessionToken);
		const sessExpires = sessionExpiresAt();

		let result: { userId: string; emailVerified: boolean };
		try {
			result = await convex.mutation(api.customAuth.login, {
				email,
				password,
				sessionTokenHash: sessHash,
				sessionExpiresAt: sessExpires,
			});
		} catch {
			return fail(400, {
				error: "Email o contraseña incorrectos.",
				email,
				redirectTo,
			});
		}

		createSessionCookie(cookies, sessionToken);

		if (!result.emailVerified) {
			redirect(303, "/auth/verify-pending");
		}

		redirect(303, redirectTo || "/app");
	},
} satisfies Actions;
