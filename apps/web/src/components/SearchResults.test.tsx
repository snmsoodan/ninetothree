import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SearchHit } from "@ninetothree/content";
import { SearchResults } from "./SearchResults";

function hit(overrides: Partial<SearchHit> = {}): SearchHit {
  return {
    id: "step-pregnancy-w28-w28-glucose",
    kind: "step",
    title: "Get your glucose screening if you haven't",
    body: "",
    keywords: "",
    href: "/week/pregnancy-w28#w28-glucose-title",
    packId: "pregnancy-w28",
    packTitle: "Week 28",
    sourceIds: ["acog", "cdc"],
    score: 10,
    matched: ["glucose"],
    ...overrides,
  };
}

describe("SearchResults", () => {
  it("renders nothing before anything is typed", () => {
    const { container } = render(<SearchResults hits={[]} query="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a query that is only spaces", () => {
    const { container } = render(<SearchResults hits={[]} query="   " />);
    expect(container).toBeEmptyDOMElement();
  });

  it("says nothing is here without saying 'no results' or 'oops'", () => {
    render(<SearchResults hits={[]} query="stroller" />);
    expect(screen.getByText("Nothing here for that.")).toBeInTheDocument();
    expect(screen.queryByText(/no results/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/oops/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/0 results/i)).not.toBeInTheDocument();
  });

  it("offers the library when nothing matched", () => {
    render(<SearchResults hits={[]} query="stroller" />);
    expect(screen.getByRole("link", { name: "Open the library" })).toHaveAttribute(
      "href",
      "/library",
    );
  });

  it("links a step to its week, at the step", () => {
    render(<SearchResults hits={[hit()]} query="glucose" />);
    expect(
      screen.getByRole("link", { name: "Get your glucose screening if you haven't" }),
    ).toHaveAttribute("href", "/week/pregnancy-w28#w28-glucose-title");
  });

  it("says which week a step belongs to, and how many sources cite it", () => {
    render(<SearchResults hits={[hit()]} query="glucose" />);
    expect(screen.getByText("Week 28 · 2 sources")).toBeInTheDocument();
  });

  it("says 'source' in the singular", () => {
    render(<SearchResults hits={[hit({ sourceIds: ["acog"] })]} query="glucose" />);
    expect(screen.getByText("Week 28 · 1 source")).toBeInTheDocument();
  });

  it("labels a week, a step and a library entry differently", () => {
    render(
      <SearchResults
        hits={[
          hit({ id: "a", kind: "week", title: "Week 28" }),
          hit({ id: "b", kind: "step", title: "Pack the bag" }),
          hit({ id: "c", kind: "link", title: "ACOG", packTitle: undefined, packId: undefined }),
        ]}
        query="x"
      />,
    );
    expect(screen.getByText("A week")).toBeInTheDocument();
    expect(screen.getByText("A step")).toBeInTheDocument();
    expect(screen.getByText("In the library")).toBeInTheDocument();
  });

  it("cites a library entry by the library, not by a week", () => {
    render(
      <SearchResults
        hits={[
          hit({ kind: "link", packTitle: undefined, packId: undefined, href: "/library#acog" }),
        ]}
        query="acog"
      />,
    );
    expect(screen.getByText("Checked and cited in the library")).toBeInTheDocument();
  });

  it("keeps the order it was given", () => {
    render(
      <SearchResults
        hits={[hit({ id: "a", title: "First" }), hit({ id: "b", title: "Second" })]}
        query="x"
      />,
    );
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(["First", "Second"]);
  });
});
