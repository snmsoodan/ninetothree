"use client";

import { useEffect } from "react";

/**
 * Registering in development is a trap: the worker caches the dev server's
 * HTML, and every subsequent edit is served from that cache until someone
 * clears it by hand. So the worker only exists in a production build, which
 * is also the only build a parent ever loads.
 */
export function shouldRegister(env: string | undefined, hasWorker: boolean): boolean {
  return env === "production" && hasWorker;
}

export function ServiceWorker() {
  useEffect(() => {
    if (!shouldRegister(process.env.NODE_ENV, "serviceWorker" in navigator)) return;
    /*
     * A failed registration is not worth telling a parent about. The app works
     * without a worker; it just does not work offline. A toast saying "offline
     * mode is unavailable" would be a worse experience than silently not
     * having it.
     */
    void navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
