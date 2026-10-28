import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/entitlements", () => ({
  useEntitlements: () => ({
    entitlements: {
      plan: "plus",
      fullTimeline: true,
      pinLimit: null,
      partner: true,
      offline: true,
      print: true,
      safety: true,
    },
    known: true,
  }),
}));

import { lensFor, type Lens, type PersonaView } from "@ninetothree/content/core";
import { PersonaLensCard } from "./PersonaLensCard";
import { TEST_PACK } from "@/test-fixtures";
import { __resetForTests, getSnapshot } from "@/lib/store";

const authored: PersonaView = {
  persona: "grandparent",
  headline: "Your job this week is the freezer",
  body: "One pot of something they can eat with one hand is worth more than any gift you could buy.",
  light: "Nobody has ever regretted a second lasagne.",
  actions: [
    {
      id: "cook-one-pot",
      type: "do",
      priority: "recommended",
      domain: "home",
      title: "Cook one pot they can reheat",
      why: "The first fortnight is not a time for cooking.",
      minutes: 45,
      options: [],
    },
  ],
};

function card(lens: Lens) {
  return (
    <PersonaLensCard lens={lens} packId={TEST_PACK.id} packTitle="Week 28" today="2027-01-07" />
  );
}

beforeEach(() => {
  window.localStorage.clear();
  __resetForTests();
});

describe("PersonaLensCard", () => {
  it("renders an authored week as the reader's own", () => {
    render(card(lensFor(TEST_PACK, "grandparent", { view: authored })));

    expect(
      screen.getByRole("heading", { name: "Your job this week is the freezer" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/One pot of something/)).toBeInTheDocument();
    // An authored week is about this week, so it carries no band label.
    expect(screen.queryByText(/trimester|first three months|first year/i)).not.toBeInTheDocument();
  });

  it("lets the reader check an authored action, and remembers it", async () => {
    const user = userEvent.setup();
    render(card(lensFor(TEST_PACK, "grandparent", { view: authored })));

    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(getSnapshot().progress["cook-one-pot"]?.status).toBe("done");
  });

  it("lets the reader pin an authored action from the lens", async () => {
    const user = userEvent.setup();
    render(card(lensFor(TEST_PACK, "grandparent", { view: authored })));

    await user.click(screen.getByRole("button", { name: "Pin Cook one pot they can reheat" }));
    expect(getSnapshot().pins.map((pin) => pin.id)).toEqual(["cook-one-pot"]);
  });

  it("names the band on a fallback track, so it never claims the week", () => {
    const lens = lensFor(TEST_PACK, "partner");
    expect(lens.source).toBe("track");
    render(card(lens));

    expect(screen.getByText(lens.bandLabel)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: lens.headline })).toBeInTheDocument();
  });

  it("shows track suggestions read-only, with the minutes they cost", () => {
    const lens = lensFor(TEST_PACK, "extended");
    const first = lens.suggestions[0]!;
    render(card(lens));

    const list = screen.getByRole("list");
    expect(within(list).getByText(first.title)).toBeInTheDocument();
    expect(within(list).queryByRole("button", { name: "Done" })).not.toBeInTheDocument();
    expect(within(list).queryByRole("button", { name: /pin/i })).not.toBeInTheDocument();
    if (first.minutes) expect(screen.getByText(`${first.minutes} min`)).toBeInTheDocument();
  });

  it("puts the light line last, in the quiet type", () => {
    render(card(lensFor(TEST_PACK, "grandparent", { view: authored })));
    const line = screen.getByText("Nobody has ever regretted a second lasagne.");
    expect(line.className).toMatch(/text-ink-faint/);
  });

  it("says nothing light when the reader has turned it off", () => {
    render(card(lensFor(TEST_PACK, "grandparent", { view: authored, enabled: false })));
    expect(
      screen.queryByText("Nobody has ever regretted a second lasagne."),
    ).not.toBeInTheDocument();
  });

  it("links to the full week only when it is given somewhere to go", () => {
    const lens = lensFor(TEST_PACK, "grandparent", { view: authored });
    const { rerender } = render(card(lens));
    expect(screen.queryByRole("link", { name: /Read this week in full/ })).not.toBeInTheDocument();

    rerender(
      <PersonaLensCard
        lens={lens}
        packId={TEST_PACK.id}
        packTitle="Week 28"
        today="2027-01-07"
        href="/week/pregnancy-w28"
      />,
    );
    expect(screen.getByRole("link", { name: /Read this week in full/ })).toHaveAttribute(
      "href",
      "/week/pregnancy-w28",
    );
  });
});
