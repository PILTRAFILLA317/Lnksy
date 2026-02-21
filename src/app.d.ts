import type { ConvexHttpClient } from "convex/browser";
import type { Id } from "$convex/_generated/dataModel.js";

declare global {
  namespace App {
    interface Locals {
      convex: ConvexHttpClient;
      user: {
        id: Id<"users">;
        email: string;
        emailVerified: boolean;
      } | null;
    }
    interface PageData {
      user: {
        id: string;
        email: string;
        emailVerified: boolean;
      } | null;
    }
  }
}

export { };
