import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Paywall } from "./Paywall";

describe("Paywall", () => {
  it("says what is behind the wall and what stays free", () => {
    render(<Paywall title="This one is part of Plus." />);

    expect(
      screen.getByRole("heading", { level: 2, name: "This one is part of Plus." }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Everything for the week you are in/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See what Plus is" })).toHaveAttribute(
      "href",
      "/settings#plan",
    );
  });

  it("takes a line about this particular thing", () => {
    render(
      <Paywall title="This one is part of Plus." body="Week 20 is not the week you are in." />,
    );
    expect(screen.getByText("Week 20 is not the week you are in.")).toBeInTheDocument();
  });

  it("lets the caller say what stays free in its own words", () => {
    render(
      <Paywall title="Inviting someone is part of Plus." free="Your own household stays free." />,
    );

    expect(screen.getByText("Your own household stays free.")).toBeInTheDocument();
    expect(screen.queryByText(/Everything for the week you are in/)).not.toBeInTheDocument();
  });

  it("keeps whatever must stay visible underneath the card", () => {
    render(
      <Paywall title="This one is part of Plus.">
        <p>Call your OB today if you have a headache that will not go away.</p>
      </Paywall>,
    );

    expect(
      screen.getByText("Call your OB today if you have a headache that will not go away."),
    ).toBeInTheDocument();
  });

  it("has no lock, no blur and no countdown", () => {
    const { container } = render(<Paywall title="This one is part of Plus." />);
    const text = container.textContent ?? "";

    expect(text).not.toMatch(/locked|unlock|blur|hurry|only|left|expires/i);
  });
});
