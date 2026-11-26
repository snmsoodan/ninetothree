/**
 * The route table, in one place, because a deep link is a promise.
 *
 * Every path here is the same string the web server serves: /today, /week/24,
 * /library, /read/sleep. That is deliberate and it is the cheapest kind of
 * parity — a link texted to a parent opens the same page whether they tap it
 * on a laptop or a phone, and nothing has to be rewritten in between.
 */

/** The scheme registered in app.json, and the host the universal link uses. */
export const SCHEME = "ninetothree";
export const HOST = "ninetothree.com";

/**
 * The weeks the product actually has, in one place.
 *
 * A link to `/week/3` is not a week before pregnancy and `/week/43` is not a
 * birthday; both are typos, and opening a blank week for one is worse than
 * saying the page is not here. The screen and the link parser both read this,
 * because a range written twice is a range that disagrees with itself.
 */
export const FIRST_WEEK = 4;
export const LAST_WEEK = 42;

/** A route segment as a week, or `null` when it is not one of ours. */
export function parseWeekNumber(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !/^\d{1,2}$/.test(value)) return null;
  const week = Number(value);
  return week >= FIRST_WEEK && week <= LAST_WEEK ? week : null;
}

export type TabName = "today" | "library" | "shelf" | "together" | "settings";

/** The five glyphs, named here so the tab bar cannot ask Feather for a word. */
export type TabIcon = "sun" | "book-open" | "bookmark" | "users" | "settings";

export interface Tab {
  readonly name: TabName;
  readonly href: Href;
  readonly label: string;
  readonly icon: TabIcon;
  /** Paths that keep this tab lit. The week is a detail page of "This week". */
  readonly also: readonly string[];
}

/**
 * The five tabs a parent uses, in the order the web's header has them.
 *
 * Safety and Updates are not tabs on the phone: safety is one tap from every
 * header, because "something is wrong right now" must never be behind a menu,
 * and updates is a badge on the week rather than a place to browse.
 */
export const TABS: readonly Tab[] = [
  { name: "today", href: "/today", label: "This week", icon: "sun", also: ["/week"] },
  { name: "library", href: "/library", label: "Library", icon: "book-open", also: ["/read"] },
  { name: "shelf", href: "/shelf", label: "Shelf", icon: "bookmark", also: [] },
  { name: "together", href: "/together", label: "Together", icon: "users", also: [] },
  { name: "settings", href: "/settings", label: "Settings", icon: "settings", also: [] },
];

/** Every path the app can open, as a union rather than a string. */
export type Href =
  | "/today"
  | "/week"
  | "/library"
  | "/read"
  | "/shelf"
  | "/together"
  | "/updates"
  | "/settings"
  | "/triage"
  | "/appointments"
  | "/history"
  | "/onboarding"
  | "/signin"
  | `/week/${number}`
  | `/read/${string}`;

/** The stack screens that live outside the tabs, and their titles. */
export const STACK_SCREENS = [
  { path: "/week/[id]", title: "Week" },
  { path: "/read/[slug]", title: "Reading" },
  { path: "/updates", title: "Updates" },
  { path: "/triage", title: "Something's wrong" },
  { path: "/appointments", title: "Appointments" },
  { path: "/history", title: "History" },
  { path: "/onboarding", title: "Welcome" },
  { path: "/signin", title: "Sign in" },
] as const;

/**
 * Which tab a path belongs to. `/week/24` lights "This week", which is the one
 * case where a screen is not its own tab — the same rule the web applies.
 */
export function tabForPath(pathname: string): TabName | null {
  const clean = stripQuery(pathname);
  // A tab keeps its light for its own sub-pages as well as for itself: a setting
  // is not a sixth tab, and a parent who drilled into one should not look up and
  // find nothing selected. The `/` in the test is what keeps `/weekly` from
  // lighting `/week`.
  const under = (prefix: string) => clean === prefix || clean.startsWith(`${prefix}/`);
  for (const tab of TABS) {
    if (under(tab.href) || tab.also.some(under)) return tab.name;
  }
  return null;
}

export function weekHref(id: number): Href {
  return `/week/${id}`;
}

export function readHref(slug: string): Href {
  return `/read/${slug}`;
}

/** The canonical https address for a route, for the share sheet and for QR codes. */
export function webUrl(href: Href): string {
  return `https://${HOST}${href}`;
}

/** The same route as a custom-scheme link, which works before universal links are verified. */
export function appUrl(href: Href): string {
  return `${SCHEME}://${href.replace(/^\//, "")}`;
}

/**
 * Turn any inbound link into a route this app can open, or `null`.
 *
 * Accepts `ninetothree://week/24`, `https://ninetothree.com/week/24`,
 * `https://www.ninetothree.com/week/24?utm=…` and a bare `/week/24`, and
 * refuses anything that is not one of those — a link from a stranger is not a
 * reason to open a screen. The web's marketing paths (`/`, `/privacy`,
 * `/terms`) map to `null` rather than to a missing route.
 */
export function parseIncomingUrl(raw: string): Href | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let path: string | null = null;

  if (trimmed.startsWith("/")) {
    path = trimmed;
  } else if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    const scheme = trimmed.slice(0, trimmed.indexOf("://")).toLowerCase();
    if (scheme === SCHEME) {
      // ninetothree://week/24 — the part after the scheme is the path, with no
      // leading slash, and a triple-slash form yields an empty authority.
      path = `/${trimmed.slice(trimmed.indexOf("://") + 3).replace(/^\/+/, "")}`;
    } else if (scheme === "https" || scheme === "http") {
      const rest = trimmed.slice(trimmed.indexOf("://") + 3);
      const slash = rest.indexOf("/");
      const authority = (slash === -1 ? rest : rest.slice(0, slash))
        .toLowerCase()
        .replace(/:\d+$/, "");
      if (authority !== HOST && authority !== `www.${HOST}`) return null;
      path = slash === -1 ? "/" : rest.slice(slash);
    } else {
      return null;
    }
  }

  if (path === null) return null;
  const clean = normalisePath(stripQuery(path));
  if (!clean) return null;

  // The front door goes to This week, exactly as the website's `/` does. A
  // universal link to nothing is still a link someone tapped.
  if (clean === "/") return "/today";
  if (clean === "/today" || clean === "/week") return clean;
  if (clean === "/library" || clean === "/read") return clean;
  if (clean === "/shelf" || clean === "/together" || clean === "/settings") return clean;
  if (clean === "/updates" || clean === "/triage" || clean === "/appointments") return clean;
  if (clean === "/history" || clean === "/onboarding" || clean === "/signin") return clean;

  const week = /^\/week\/(\d{1,3})$/.exec(clean);
  if (week) {
    const number = parseWeekNumber(week[1]);
    return number === null ? null : weekHref(number);
  }

  const read = /^\/read\/([a-z0-9][a-z0-9-]{0,79})$/.exec(clean);
  if (read) return readHref(read[1]!);

  return null;
}

function stripQuery(path: string): string {
  const cut = path.search(/[?#]/);
  return cut === -1 ? path : path.slice(0, cut);
}

/**
 * Collapse `//`, resolve nothing, and refuse `..`. A path that needs resolving
 * is a path that was not a route, so it becomes `null` rather than a guess.
 */
function normalisePath(path: string): string | null {
  if (!path.startsWith("/")) return null;
  if (path.includes("..")) return null;
  if ((path.match(/\//g) ?? []).length === 1) return path;
  const collapsed = path.replace(/\/{2,}/g, "/").replace(/\/$/, "");
  return collapsed || "/";
}
