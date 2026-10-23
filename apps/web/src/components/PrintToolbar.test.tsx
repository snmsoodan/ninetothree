import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PrintToolbar } from "./PrintToolbar";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PrintToolbar", () => {
  it("offers one obvious action and a way back", () => {
    render(<PrintToolbar backHref="/week/pregnancy-w28" backLabel="Back to Week 28" />);
    expect(screen.getByRole("button", { name: "Print this page" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Week 28" })).toHaveAttribute(
      "href",
      "/week/pregnancy-w28",
    );
  });

  it("asks the browser to print", async () => {
    const print = vi.fn();
    vi.stubGlobal("print", print);
    render(<PrintToolbar backHref="/" backLabel="Back" />);
    await userEvent.click(screen.getByRole("button", { name: "Print this page" }));
    expect(print).toHaveBeenCalledOnce();
  });

  it("hides itself on paper", () => {
    const { container } = render(<PrintToolbar backHref="/" backLabel="Back" />);
    expect(container.firstElementChild).toHaveClass("no-print");
  });
});
