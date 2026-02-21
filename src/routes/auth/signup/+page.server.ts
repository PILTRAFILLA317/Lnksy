import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { createConvexClient } from "$lib/server/convex.js";
import {
	generateToken,
	hashToken,
	createSessionCookie,
	sessionExpiresAt,
	verificationExpiresAt,
} from "$lib/server/auth.js";
import { sendVerifyEmail } from "$lib/server/email.js";
import { rateLimit } from "$lib/server/rate-limit.js";
import { api } from "$convex/_generated/api.js";
import { APP_BASE_URL } from "$env/static/private";
import bcryptjs from "bcryptjs";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(303, "/app");
	return {};
};

export const actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const ip = getClientAddress();
		const fd = await request.formData();
		const email = (fd.get("email") as string)
			?.trim()
			.toLowerCase();
		const password = fd.get("password") as string;
		const confirmPassword = fd.get("confirmPassword") as string;

		if (!email || !password || !confirmPassword) {
			return fail(400, {
				error: "Todos los campos son obligatorios.",
				email,
			});
		}
		if (password.length < 8) {
			return fail(400, {
				error: "La contraseña debe tener al menos 8 caracteres.",
				email,
			});
		}
		if (password !== confirmPassword) {
			return fail(400, {
				error: "Las contraseñas no coinciden.",
				email,
			});
		}

		// Rate limit
		const key = `${ip}:${email}`;
		if (!rateLimit("auth:signup", key)) {
			return fail(429, {
				error: "Demasiados intentos. Espera un momento.",
				email,
			});
		}

		const convex = createConvexClient();

		// Hash password on the server
		const passwordHash = bcryptjs.hashSync(password, 12);

		let userId: string;
		try {
			userId = await convex.mutation(api.customAuth.signup, {
				email,
				passwordHash,
			});
		} catch (e: any) {
			if (e?.message?.includes("ACCOUNT_EXISTS")) {
				return fail(400, {
					error: "Ya existe una cuenta con ese email.",
					email,
				});
			}
			return fail(500, {
				error: "Error al registrarse. Inténtalo de nuevo.",
				email,
			});
		}

		// Generate verification token
		const rawToken = generateToken();
		const tokenHash = hashToken(rawToken);
		const expiresAt = verificationExpiresAt();

		await convex.mutation(
			api.customAuth.storeVerificationToken,
			{
				userId: userId as any,
				email,
				tokenHash,
				type: "verify",
				expiresAt,
			},
		);

		// Send verification email
		const verifyUrl = `${APP_BASE_URL}/auth/verify?token=${rawToken}`;
		try {
			await sendVerifyEmail(email, verifyUrl);
		} catch {
			// User created but email failed — they can resend
		}

		// Create session (unverified user — hooks will block /app)
		const sessionToken = generateToken();
		const sessHash = hashToken(sessionToken);
		const sessExpires = sessionExpiresAt();

		await convex.mutation(api.customAuth.login, {
			email,
			password,
			sessionTokenHash: sessHash,
			sessionExpiresAt: sessExpires,
		});

		createSessionCookie(cookies, sessionToken);
		redirect(303, "/auth/verify-pending");
	},
} satisfies Actions;
