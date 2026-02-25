/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as backgrounds from "../backgrounds.js";
import type * as billing from "../billing.js";
import type * as components_ from "../components.js";
import type * as contacts from "../contacts.js";
import type * as customAuth from "../customAuth.js";
import type * as files from "../files.js";
import type * as fonts from "../fonts.js";
import type * as http from "../http.js";
import type * as links from "../links.js";
import type * as migrateToComponents from "../migrateToComponents.js";
import type * as profiles from "../profiles.js";
import type * as reservedSlugs from "../reservedSlugs.js";
import type * as sections from "../sections.js";
import type * as seed from "../seed.js";
import type * as templates from "../templates.js";
import type * as themes from "../themes.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  backgrounds: typeof backgrounds;
  billing: typeof billing;
  components: typeof components_;
  contacts: typeof contacts;
  customAuth: typeof customAuth;
  files: typeof files;
  fonts: typeof fonts;
  http: typeof http;
  links: typeof links;
  migrateToComponents: typeof migrateToComponents;
  profiles: typeof profiles;
  reservedSlugs: typeof reservedSlugs;
  sections: typeof sections;
  seed: typeof seed;
  templates: typeof templates;
  themes: typeof themes;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
