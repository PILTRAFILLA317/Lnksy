import { Resend } from "resend";
import {
	RESEND_API_KEY,
	EMAIL_FROM,
} from "$env/static/private";

// =============================================================
// Lnksy — Email helpers (Resend)
// =============================================================

const resend = new Resend(RESEND_API_KEY);
const from = EMAIL_FROM || "Lnksy <onboarding@resend.dev>";

/**
 * Send verification email with a clickable link.
 */
export async function sendVerifyEmail(
	to: string,
	verifyUrl: string,
): Promise<void> {
	const { error } = await resend.emails.send({
		from,
		to,
		subject: "Verifica tu email — Lnksy",
		html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#111">Verifica tu email</h2>
        <p>Haz clic en el siguiente enlace para verificar tu cuenta:</p>
        <p>
          <a href="${verifyUrl}"
             style="display:inline-block;padding:12px 24px;
                    background:#4f46e5;color:#fff;text-decoration:none;
                    border-radius:8px;font-weight:600">
            Verificar email
          </a>
        </p>
        <p style="color:#666;font-size:0.85em;margin-top:24px">
          Este enlace caduca en 1 hora.<br/>
          Si no solicitaste esto, ignora este mensaje.
        </p>
      </div>
    `,
	});
	if (error) {
		console.error("Resend error (verify):", error);
		throw new Error("No se pudo enviar el email de verificación.");
	}
}

/**
 * Send password-reset email with a clickable link.
 */
export async function sendResetEmail(
	to: string,
	resetUrl: string,
): Promise<void> {
	const { error } = await resend.emails.send({
		from,
		to,
		subject: "Restablece tu contraseña — Lnksy",
		html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#111">Restablece tu contraseña</h2>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:12px 24px;
                    background:#4f46e5;color:#fff;text-decoration:none;
                    border-radius:8px;font-weight:600">
            Restablecer contraseña
          </a>
        </p>
        <p style="color:#666;font-size:0.85em;margin-top:24px">
          Este enlace caduca en 1 hora.<br/>
          Si no solicitaste esto, ignora este mensaje.
        </p>
      </div>
    `,
	});
	if (error) {
		console.error("Resend error (reset):", error);
		throw new Error("No se pudo enviar el email de recuperación.");
	}
}
