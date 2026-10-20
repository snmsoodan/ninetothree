import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShareCard } from "./ShareCard";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ShareCard", () => {
  it("offers to send the week to someone", () => {
    render(<ShareCard stage="Week 28" url="https://ninetothree.com/week/x" />);
    expect(screen.getByRole("heading", { name: "Bringing someone with you" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share Week 28" })).toBeInTheDocument();
  });

  it("uses the native share sheet when the browser has one", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share });
    render(<ShareCard stage="Week 28" url="https://ninetothree.com/week/x" />);
    await userEvent.click(screen.getByRole("button", { name: "Share Week 28" }));
    expect(share).toHaveBeenCalledWith({
      title: "Nine to Three — Week 28",
      url: "https://ninetothree.com/week/x",
    });
  });

  it("falls back to the clipboard when there is no share sheet", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share: undefined, clipboard: { writeText } });
    render(<ShareCard stage="Week 28" url="https://ninetothree.com/week/x" />);
    await userEvent.click(screen.getByRole("button", { name: "Share Week 28" }));
    expect(writeText).toHaveBeenCalledWith("https://ninetothree.com/week/x");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Link copied."));
  });

  it("copies when the parent dismisses the share sheet", async () => {
    const share = vi.fn().mockRejectedValue(new Error("dismissed"));
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share, clipboard: { writeText } });
    render(<ShareCard stage="Week 28" url="https://ninetothree.com/week/x" />);
    await userEvent.click(screen.getByRole("button", { name: "Share Week 28" }));
    expect(writeText).toHaveBeenCalled();
  });

  it("says nothing when the clipboard is blocked", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("blocked"));
    vi.stubGlobal("navigator", { ...navigator, share: undefined, clipboard: { writeText } });
    render(<ShareCard stage="Week 28" url="https://ninetothree.com/week/x" />);
    await userEvent.click(screen.getByRole("button", { name: "Share Week 28" }));
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("shares the current page when no url is given", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share: undefined, clipboard: { writeText } });
    render(<ShareCard stage="Week 28" />);
    await userEvent.click(screen.getByRole("button", { name: "Share Week 28" }));
    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });
});
