import { createCookieSessionStorage } from "remix";

import { createFetchHandler, createWorkerAssetHandler } from "./adapter";

import type { CloudflareEnvironment, Context } from "../app/context.server";

// @ts-ignore
import * as build from "../build/index.js";

export { NoteDurableObject } from "../app/durable-objects/note.server";
export { UserDurableObject } from "../app/durable-objects/user.server";

const handleFetch = createFetchHandler<CloudflareEnvironment>({
  /**
   * Required: Remix build files
   */
  build: build as any,

  /**
   * Optional: Context to be available on `loader` or `action`, default to `undefined` if not defined
   * @param request Request
   * @param env Variables defined for the environment
   * @param ctx Exectuion context, i.e. ctx.waitUntil() or ctx.passThroughOnException();
   * @returns Context
   */
  getLoadContext(request, env, ctx): Context {
    let sessionStorage = createCookieSessionStorage({
      cookie: {
        isSigned: true,
        httpOnly: true,
        name: "__session",
        path: "/",
        sameSite: "lax",
        secrets: [env.SESSION_SECRET],
      },
    });

    return { env, ctx, sessionStorage };
  },

  /**
   * Required: Setup how the assets are served
   * 1) Call `createWorkerAssetHandler(build)` when using Worker Site
   * 2) Call `createPageAssetHandler()` when using Pages
   */
  handleAsset: createWorkerAssetHandler(build as any),

  /**
   * Optional: Enable cache for response from the Remix request handler, no cache by default
   * Experimental feature - Let me know if you run into problems with cache enabled
   */
  enableCache: false,
});

const worker: ExportedHandler<CloudflareEnvironment> = {
  fetch: handleFetch,
};

export default worker;
