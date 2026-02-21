import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types.js";
import { api } from "$convex/_generated/api.js";
import { mapProfile } from "$lib/utils/convex-mappers.js";
import type { Id } from "$convex/_generated/dataModel.js";

export const load: LayoutServerLoad = async ({
  locals,
  url,
}) => {
  const user = locals.user;

  // hooks.server.ts already redirects unauthenticated + unverified users,
  // but we double-check here for safety.
  if (!user) {
    redirect(
      303,
      `/auth/login?redirect=${encodeURIComponent(url.pathname)}`,
    );
  }

  const profileDoc = await locals.convex.query(
    api.profiles.getOwn,
    { userId: user.id as Id<"users"> },
  );
  const profile = profileDoc ? mapProfile(profileDoc) : null;

  if (
    !profile &&
    !url.pathname.startsWith("/app/onboarding")
  ) {
    redirect(303, "/app/onboarding/confirm");
  }

  return { user, profile };
};
