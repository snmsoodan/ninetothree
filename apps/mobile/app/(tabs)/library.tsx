/**
 * The library, on the phone.
 *
 * The catalogue is already in the bundle, so there is nothing to fetch and no
 * loading state: the tab opens full. Filters are local to the screen — they are
 * not a preference a parent expects to survive closing the app, and the web
 * does not remember them either.
 */
import { useCallback, useMemo, useState } from "react";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { LINKS } from "@ninetothree/content/link-registry";
import type { CostChoice, DomainChoice, LibraryFilters } from "@ninetothree/domain";
import { Library, type LibraryHandlers } from "../../src/library-screen";
import { EMPTY_FILTERS, libraryModel } from "../../src/library";

export default function LibraryScreen() {
  const router = useRouter();
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS);

  const model = useMemo(() => libraryModel({ links: LINKS, filters }), [filters]);

  const openLink = useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

  const handlers: LibraryHandlers = {
    onQueryChange: (query: string) => {
      setFilters((current) => ({ ...current, query }));
    },
    onDomainChange: (domain: DomainChoice["value"]) => {
      setFilters((current) => ({ ...current, domain }));
    },
    onCostChange: (cost: CostChoice["value"]) => {
      setFilters((current) => ({ ...current, cost }));
    },
    onOpenLink: openLink,
    onOpenSearch: () => router.push("/search"),
  };

  return <Library model={model} handlers={handlers} />;
}
