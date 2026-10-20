import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RouteFocus } from "./RouteFocus";

let pathname = "/week";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

beforeEach(() => {
  pathname = "/week";
  document.body.innerHTML = "";
});

function page(heading: string | null) {
  return (
    <>
      <RouteFocus />
      <main id="main" tabIndex={-1}>
        {heading ? <h1>{heading}</h1> : <p>No heading here</p>}
      </main>
    </>
  );
}

describe("RouteFocus", () => {
  it("does not steal focus on the first render", () => {
    render(page("Week 28"));
    expect(document.activeElement).toBe(document.body);
  });

  it("moves focus to the new page heading on navigation", () => {
    const { rerender } = render(page("Week 28"));
    pathname = "/shelf";
    rerender(page("Your shelf"));

    const heading = screen.getByRole("heading", { name: "Your shelf" });
    expect(document.activeElement).toBe(heading);
    expect(heading).toHaveAttribute("tabindex", "-1");
  });

  it("falls back to the main region when a page has no heading", () => {
    const { rerender } = render(page("Week 28"));
    pathname = "/safety";
    rerender(page(null));
    expect(document.activeElement).toBe(screen.getByRole("main"));
  });

  it("does nothing when there is no main region", () => {
    const { rerender } = render(<RouteFocus />);
    pathname = "/shelf";
    expect(() => rerender(<RouteFocus />)).not.toThrow();
    expect(document.activeElement).toBe(document.body);
  });
});
