import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RelatedActions, resolveRelated } from "./RelatedActions";
import type { Article } from "@ninetothree/content";

const ACTIONS = [
  {
    id: "w28-glucose",
    title: "Get your glucose screening if you haven't",
    packTitle: "Week 28",
    href: "/week/pregnancy-w28#w28-glucose-title",
  },
];

describe("RelatedActions", () => {
  it("links back to the step the article explains", () => {
    render(<RelatedActions actions={ACTIONS} />);
    expect(
      screen.getByRole("link", { name: "Get your glucose screening if you haven't" }),
    ).toHaveAttribute("href", "/week/pregnancy-w28#w28-glucose-title");
  });

  it("says which week the step is in", () => {
    render(<RelatedActions actions={ACTIONS} />);
    expect(screen.getByText(/— Week 28/)).toBeInTheDocument();
  });

  it("renders nothing at all when there is no step", () => {
    const { container } = render(<RelatedActions actions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is a labelled region", () => {
    render(<RelatedActions actions={ACTIONS} />);
    expect(screen.getByRole("region", { name: "The step this goes with" })).toBeInTheDocument();
  });
});

describe("resolveRelated", () => {
  const article = {
    relatedActions: ["w28-glucose", "w8-dental"],
  } as unknown as Article;

  it("resolves an id to the step's title, week and anchor", () => {
    const resolved = resolveRelated(article, (id) =>
      id === "w28-glucose"
        ? {
            pack: { id: "pregnancy-w28", title: "Week 28" },
            action: { id: "w28-glucose", title: "Get your glucose screening if you haven't" },
          }
        : undefined,
    );
    expect(resolved).toEqual([
      {
        id: "w28-glucose",
        title: "Get your glucose screening if you haven't",
        packTitle: "Week 28",
        href: "/week/pregnancy-w28#w28-glucose-title",
      },
    ]);
  });

  it("drops an id that no longer exists rather than linking nowhere", () => {
    const resolved = resolveRelated(article, () => undefined);
    expect(resolved).toEqual([]);
  });

  it("handles an article with no related actions", () => {
    expect(resolveRelated({} as Article, () => undefined)).toEqual([]);
  });
});
