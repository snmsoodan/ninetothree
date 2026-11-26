import { RecallFeed as RecallFeedSchema } from "@ninetothree/contracts";
import {
  OFFICIAL_SEARCHES,
  UPDATES_CHECK_LINK,
  UPDATES_EMPTY_BODY,
  UPDATES_EMPTY_TITLE,
  UPDATES_FOR_AGE,
  UPDATES_HEADING,
  UPDATES_HOW,
  UPDATES_INTRO,
  UPDATES_REPORT_LEAD,
  UPDATES_REPORT_LINK,
  UPDATES_REPORT_TAIL,
  UPDATES_REPORT_URL,
  UPDATES_SEARCHES_HEADING,
  UPDATES_SEARCHES_INTRO,
  curatedFeed,
  updatesModel,
  type AppState,
  type Feed,
  type UpdatesModel,
} from "@ninetothree/domain";

/**
 * Updates on the phone.
 *
 * The list, the windows and the sentences are `updatesModel`'s — the same
 * function `/updates` calls — so the two screens cannot drift. What is here is
 * the request, the curated fallback, and the words that surround the list.
 */

export interface UpdatesView extends UpdatesModel {
  heading: string;
  intro: string;
  how: string;
  checkLink: string;
  empty: { title: string; body: string };
  forHeading: string;
  searchesHeading: string;
  searchesIntro: string;
  searches: typeof OFFICIAL_SEARCHES;
  report: { lead: string; link: string; tail: string; url: string };
}

export function updatesView(input: {
  state: AppState;
  feed: Feed;
  loading: boolean;
  today: string;
}): UpdatesView {
  return {
    ...updatesModel(input),
    heading: UPDATES_HEADING,
    intro: UPDATES_INTRO,
    how: UPDATES_HOW,
    checkLink: UPDATES_CHECK_LINK,
    empty: { title: UPDATES_EMPTY_TITLE, body: UPDATES_EMPTY_BODY },
    forHeading: UPDATES_FOR_AGE,
    searchesHeading: UPDATES_SEARCHES_HEADING,
    searchesIntro: UPDATES_SEARCHES_INTRO,
    searches: OFFICIAL_SEARCHES,
    report: {
      lead: UPDATES_REPORT_LEAD,
      link: UPDATES_REPORT_LINK,
      tail: UPDATES_REPORT_TAIL,
      url: UPDATES_REPORT_URL,
    },
  };
}

export type Fetcher = (
  input: string,
  init?: { signal?: AbortSignal },
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

/**
 * One request, one answer.
 *
 * A failure is not an error state: the curated nine are already correct and
 * `curatedFeed()` is what the screen draws while the request is out and after
 * it fails, so the only thing this returns is a better list when one arrives.
 */
export async function fetchFeed(
  fetcher: Fetcher,
  signal?: AbortSignal,
  path = "/api/updates",
): Promise<Feed | null> {
  try {
    const response = await fetcher(path, signal ? { signal } : undefined);
    if (!response.ok) return null;
    const parsed = RecallFeedSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export { curatedFeed };
