import { ConvexHttpClient } from "convex/browser";
import { PUBLIC_CONVEX_URL } from "$env/static/public";

// =============================================================
// Lnksy — Convex HTTP Client (server-only)
// =============================================================

/**
 * Create a Convex HTTP client for server-side use.
 * No auth token is needed — all auth is handled via
 * SvelteKit session cookies + trusted server calls.
 */
export function createConvexClient(): ConvexHttpClient {
  return new ConvexHttpClient(PUBLIC_CONVEX_URL);
}
