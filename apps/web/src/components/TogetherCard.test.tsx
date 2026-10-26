import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TogetherCard } from "./TogetherCard";

describe("TogetherCard", () => {
  it("says how many people share the dates", () => {
    render(<TogetherCard people={2} />);
    expect(screen.getByText(/^2 people share these dates/)).toBeInTheDocument();
  });

  it("links to the shared page", () => {
    render(<TogetherCard people={3} />);
    expect(screen.getByRole("link", { name: "Open Together" })).toHaveAttribute(
      "href",
      "/together",
    );
  });
});
