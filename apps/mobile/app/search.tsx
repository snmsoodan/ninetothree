/**
 * Search, on the phone.
 *
 * The web fetches `/search-index.json` after it paints. A phone has the packs
 * and the links in the bundle already, so the index is built once at start-up
 * from the same `buildIndex` the generator runs, and a search works in a
 * tunnel. A result that is a step or a week is a route; a link leaves the app.
 */
import { useMemo, useState } from "react";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { LINKS } from "@ninetothree/content/link-registry";
import { PACKS } from "@ninetothree/content/registry";
import { guideIndex } from "@ninetothree/domain";
import { Search, type SearchHandlers } from "../src/search-screen";
import { searchModel, type SearchRow } from "../src/search";
import type { Href } from "../src/routes";

/** Built once per process, not once per keystroke. */
const INDEX = guideIndex(PACKS, LINKS);

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const model = useMemo(() => searchModel({ docs: INDEX, query }), [query]);

  const handlers: SearchHandlers = {
    onQueryChange: setQuery,
    onOpen: (row: SearchRow) => {
      if (row.external) {
        void Linking.openURL(row.href);
        return;
      }
      router.push(row.href as Href);
    },
  };

  return <Search model={model} handlers={handlers} />;
}
