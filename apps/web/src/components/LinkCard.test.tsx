import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { LinkEntry } from "@ninetothree/content";
import { LinkCard } from "./LinkCard";

const BASE: LinkEntry = {
  id: "test-link",
  title: "Safe to Sleep",
  url: "https://safetosleep.nichd.nih.gov/",
  publisher: "National Institutes of Health",
  type: "authoritative",
  domains: ["sleep"],
  stages: { from: { kind: "postpartum", index: 0 }, to: { kind: "infant", index: 12 } },
  cost: "free",
  why: "The safe-sleep rules, from the agency that funds the research.",
  country: ["US"],
  language: "en-US",
  lastChecked: "2026-10-20",
  affiliate: false,
  reviewedBy: "Clinical review pending",
};

describe("LinkCard", () => {
  it("links the title to the destination in a new tab", () => {
    render(<LinkCard link={BASE} />);
    const link = screen.getByRole("link", { name: /Safe to Sleep/ });
    expect(link).toHaveAttribute("href", "https://safetosleep.nichd.nih.gov/");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("leads with when to use it, not what it is", () => {
    render(<LinkCard link={BASE} />);
    expect(screen.getByText(/The safe-sleep rules/)).toBeInTheDocument();
  });

  it("names the publisher", () => {
    render(<LinkCard link={BASE} />);
    expect(screen.getByText("National Institutes of Health")).toBeInTheDocument();
  });

  it("labels the type and the cost", () => {
    render(<LinkCard link={BASE} />);
    expect(screen.getByText("Official")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("marks a paid link as not free", () => {
    render(<LinkCard link={{ ...BASE, cost: "$$$" }} />);
    expect(screen.getByText("Expensive")).toBeInTheDocument();
  });

  it("lists the platforms an app runs on", () => {
    render(
      <LinkCard link={{ ...BASE, type: "app", platforms: ["ios", "android"], cost: "varies" }} />,
    );
    expect(screen.getByText("On iPhone and Android")).toBeInTheDocument();
    expect(screen.getByText("App")).toBeInTheDocument();
    expect(screen.getByText("Cost varies")).toBeInTheDocument();
  });

  it("shows the honest caveat when there is one", () => {
    render(<LinkCard link={{ ...BASE, note: "Subscription required." }} />);
    expect(screen.getByText("Subscription required.")).toBeInTheDocument();
  });

  it("says so when a link earns us a commission", () => {
    render(<LinkCard link={{ ...BASE, type: "commercial", affiliate: true }} />);
    expect(
      screen.getByText(/We earn a commission if you buy through this link/),
    ).toBeInTheDocument();
  });

  it("says nothing about commission on a link that earns none", () => {
    render(<LinkCard link={{ ...BASE, type: "commercial" }} />);
    expect(screen.queryByText(/We earn a commission/)).not.toBeInTheDocument();
  });

  it("shows the day the link was last opened", () => {
    render(<LinkCard link={BASE} />);
    expect(screen.getByText("Checked October 20, 2026")).toBeInTheDocument();
  });

  it("renders no platform line and no note when neither is set", () => {
    render(<LinkCard link={BASE} />);
    expect(screen.queryByText(/^On /)).not.toBeInTheDocument();
  });

  it("labels every type", () => {
    const types = [
      ["charity", "Charity"],
      ["community", "Community"],
      ["commercial", "Shop"],
      ["course", "Course"],
      ["book", "Book"],
      ["local-service", "Local help"],
    ] as const;
    for (const [type, label] of types) {
      const { unmount } = render(<LinkCard link={{ ...BASE, type }} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it("labels every cost", () => {
    const costs = [
      ["$", "Cheap"],
      ["$$", "Moderate"],
    ] as const;
    for (const [cost, label] of costs) {
      const { unmount } = render(<LinkCard link={{ ...BASE, cost }} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it("labels a web-only app", () => {
    render(<LinkCard link={{ ...BASE, type: "app", platforms: ["web"] }} />);
    expect(screen.getByText("On Web")).toBeInTheDocument();
  });
});
