import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { createConvexClient } from "$lib/server/convex.js";
import { getSessionToken, hashToken } from "$lib/server/auth.js";
import { api } from "$convex/_generated/api.js";

// =============================================================
// Lnksy — Server Hook (session + route protection)
// =============================================================

/** Paths that don't require auth. */
const PUBLIC_PREFIXES = [
  "/auth",
  "/api/track",
  "/api/billing/webhook",
  "/api/handle",
];

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  // Public profile pages: /[handle]
  // Matches single-segment paths that aren't /app, /auth, /api
  if (
    !pathname.startsWith("/app") &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_")
  ) {
    return true;
  }
  return false;
}

export const handle: Handle = async ({ event, resolve }) => {
  const convex = createConvexClient();
  event.locals.convex = convex;
  event.locals.user = null;

  // ── Resolve session ────────────────────────────────────────
  const rawToken = getSessionToken(event.cookies);
  if (rawToken) {
    try {
      const tokenHash = hashToken(rawToken);
      const user = await convex.query(
        api.customAuth.getUserBySession,
        { tokenHash },
      );
      if (user) {
        event.locals.user = {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
        };
      }
    } catch {
      // Invalid/expired session — treat as unauthenticated
    }
  }

  // ── Route protection ───────────────────────────────────────
  const { pathname } = event.url;

  if (pathname.startsWith("/app")) {
    if (!event.locals.user) {
      redirect(
        303,
        `/auth/login?redirect=${encodeURIComponent(pathname)}`,
      );
    }
    if (!event.locals.user.emailVerified) {
      redirect(303, "/auth/verify-pending");
    }
  }

  return resolve(event);
};
