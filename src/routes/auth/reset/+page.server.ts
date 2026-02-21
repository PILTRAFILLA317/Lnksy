import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { createConvexClient } from "$lib/server/convex.js";
import {
	hashToken,
	generateToken,
	createSessionCookie,
	sessionExpiresAt,
} from "$lib/server/auth.js";
import { api } from "$convex/_generated/api.js";
import bcryptjs from "bcryptjs";

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get("token");
	if (!token) redirect(303, "/auth/forgot");
	return { token };
};

export const actions = {
	default: async ({ request, cookies }) => {
		const fd = await request.formData();
		const token = fd.get("token") as string;
		const newPassword = fd.get("newPassword") as string;
		const confirmPassword =
			fd.get("confirmPassword") as string;

		if (!token || !newPassword) {
			return fail(400, {
				error: "Todos los campos son obligatorios.",
				token,
			});
		}
		if (newPassword.length < 8) {
			return fail(400, {
				error:
					"La contraseña debe tener al menos 8 caracteres.",
				token,
			});
		}
		if (newPassword !== confirmPassword) {
			return fail(400, {
				error: "Las contraseñas no coinciden.",
				token,
			});
		}

		const convex = createConvexClient();
		const tokenHash = hashToken(token);
		const newPasswordHash = bcryptjs.hashSync(newPassword, 12);

		// Generate session for auto-login after reset
		const sessionToken = generateToken();
		const sessHash = hashToken(sessionToken);
		const sessExpires = sessionExpiresAt();

		try {
			await convex.mutation(api.customAuth.resetPassword, {
				tokenHash,
				newPasswordHash,
				sessionTokenHash: sessHash,
				sessionExpiresAt: sessExpires,
			});
		} catch (e: any) {
			const msg = e?.message ?? "";
			if (msg.includes("TOKEN_EXPIRED")) {
				return fail(400, {
					error:
						"El enlace ha caducado. Solicita uno nuevo.",
					token: "",
				});
			}
			return fail(400, {
				error: "Enlace inválido o ya utilizado.",
				token: "",
			});
		}

		createSessionCookie(cookies, sessionToken);
		redirect(303, "/app");
	},
} satisfies Actions;
