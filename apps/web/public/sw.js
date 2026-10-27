/*
 * A hand-written service worker, not Workbox.
 *
 * The whole point of this file is one rule, and a library would hide it:
 *
 *   A page is fetched from the network first, always. The cache is a
 *   fallback for when the network is gone, never a shortcut for when it is
 *   slow.
 *
 * That rule exists because the safety page and the triage tree are the two
 * screens a parent opens at 3am, and a recall notice that is three deploys
 * old is worse than no recall notice at all. Serving a cached copy while
 * online would make "we checked this" a lie. So a navigation waits for the
 * network, and only a real failure falls back to the cache — and the page
 * says so when it does.
 *
 * Static assets are the opposite: `/_next/static/*` is content-hashed, so a
 * cached copy can never be stale. Those are cache-first, which is what makes
 * the second visit fast.
 */

const CACHE = "ntt-v1";

/*
 * The shell. Every one of these is a route a parent might open with no
 * signal: the week they are on, the safety page, the triage tree, the shelf
 * of pinned things, and the settings page that turns notifications off.
 *
 * `/week` is cached rather than each of the 85 `/week/<id>` pages, because
 * the week view resolves the current pack on the client from localStorage —
 * the shell is the same HTML for all of them.
 */
const PRECACHE = [
  // `/today`, not `/`: the root URL is a server redirect, and a cached 307 is
  // not a page. The dashboard is the screen a parent opens with no signal.
  "/today",
  "/week",
  "/safety",
  "/triage",
  "/shelf",
  "/library",
  "/settings",
  "/offline.html",
  "/icon-192.png",
  "/icon-512.png",
  "/maskable-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      /*
       * Individually, not `addAll`. `addAll` rejects the whole install if one
       * URL fails, which would leave a parent with no service worker at all
       * because a single icon 404'd. A partial precache is still useful.
       */
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "reload" });
            if (response.ok) await cache.put(url, response);
          } catch {
            /* Offline during install. The runtime cache will fill in. */
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

/** Content-hashed, so a cached copy is never the wrong copy. */
function isImmutable(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(?:png|svg|woff2?|ico)$/.test(url.pathname)
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    /*
     * Only a 200 is worth keeping. A 404 or a 500 cached here would be served
     * back to a parent offline as though it were the page.
     */
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const hit = await cache.match(request);
    if (hit) return hit;
    if (request.mode === "navigate") {
      /*
       * A plain HTML file, not a Next route. A route would need its own
       * chunks, and a chunk that fails to load turns this into "an
       * application error has occurred" — the opposite of the point.
       */
      const offline = await cache.match("/offline.html");
      if (offline) return offline;
    }
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  /* The worker itself must never be served from its own cache. */
  if (url.pathname === "/sw.js") return;

  event.respondWith(isImmutable(url) ? cacheFirst(request) : networkFirst(request));
});
