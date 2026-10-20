import { assertValidLinks } from "./links";
import type { LinkEntry } from "./links";

import authoritative from "../links/authoritative.json";
import apps from "../links/apps.json";
import books from "../links/books.json";
import community from "../links/community.json";
import extra from "../links/extra.json";
import gear from "../links/gear.json";
import services from "../links/services.json";

/**
 * The whole catalogue, validated at module load. A malformed entry fails
 * the build rather than rendering a dead card to a parent.
 */
export const LINKS: LinkEntry[] = assertValidLinks([
  ...authoritative,
  ...apps,
  ...books,
  ...community,
  ...extra,
  ...gear,
  ...services,
]);

export const LINKS_BY_ID: ReadonlyMap<string, LinkEntry> = new Map(
  LINKS.map((link) => [link.id, link]),
);

export function getLink(id: string): LinkEntry | undefined {
  return LINKS_BY_ID.get(id);
}
