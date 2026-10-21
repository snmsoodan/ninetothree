import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RecallNotice, type RecallNoticeItem } from "./RecallNotice";

const notice = (over: Partial<RecallNoticeItem> = {}): RecallNoticeItem => ({
  id: "cpsc-1:t-car-seat",
  title: "High chairs recalled for a fall hazard",
  product: "Bicystar high chairs",
  hazard: "The seat can detach from the frame.",
  action: "Stop using the chair and contact the maker for a free repair kit.",
  severity: "stop-use",
  because: "step",
  matchedOn: "t-car-seat",
  publishedAt: "2026-09-01",
  source: {
    title: "Bicystar high chairs",
    publisher: "CPSC",
    url: "https://www.cpsc.gov/Recalls/2026/example",
  },
  ...over,
});

describe("RecallNotice", () => {
  it("says what was recalled, what is wrong, and what to do", () => {
    render(<RecallNotice notice={notice()} />);
    expect(
      screen.getByRole("heading", { name: "High chairs recalled for a fall hazard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Bicystar high chairs")).toBeInTheDocument();
    expect(screen.getByText("The seat can detach from the frame.")).toBeInTheDocument();
    expect(screen.getByText(/contact the maker for a free repair kit/)).toBeInTheDocument();
  });

  it("says why it reached this parent", () => {
    render(<RecallNotice notice={notice({ because: "step" })} />);
    expect(screen.getByText("You pinned this step.")).toBeInTheDocument();
  });

  it("distinguishes a chosen product from a pinned step", () => {
    render(<RecallNotice notice={notice({ because: "option" })} />);
    expect(screen.getByText("You chose this.")).toBeInTheDocument();
  });

  it("distinguishes a keyword match from a named product", () => {
    render(<RecallNotice notice={notice({ because: "keyword" })} />);
    expect(screen.getByText("You pinned a step about this.")).toBeInTheDocument();
  });

  it("names the severity in words rather than colour alone", () => {
    render(<RecallNotice notice={notice({ severity: "stop-use" })} />);
    expect(screen.getByText("Stop using it")).toBeInTheDocument();
  });

  it("says check rather than stop for a lower severity", () => {
    render(<RecallNotice notice={notice({ severity: "check" })} />);
    expect(screen.getByText("Check yours")).toBeInTheDocument();
  });

  it("says worth knowing for the lowest severity", () => {
    render(<RecallNotice notice={notice({ severity: "info" })} />);
    expect(screen.getByText("Worth knowing")).toBeInTheDocument();
  });

  it("links to the agency and says it opens in a new tab", () => {
    render(<RecallNotice notice={notice()} />);
    const link = screen.getByRole("link", { name: /CPSC/ });
    expect(link).toHaveAttribute("href", "https://www.cpsc.gov/Recalls/2026/example");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAccessibleName(/opens in a new tab/);
  });

  it("writes the announcement date in words", () => {
    render(<RecallNotice notice={notice({ publishedAt: "2026-09-01" })} />);
    expect(screen.getByText("Announced September 1, 2026")).toBeInTheDocument();
  });

  it("falls back to the raw date rather than inventing one", () => {
    render(<RecallNotice notice={notice({ publishedAt: "sometime" })} />);
    expect(screen.getByText("Announced sometime")).toBeInTheDocument();
  });

  it("puts the notice away when asked", async () => {
    const onDismiss = vi.fn();
    render(<RecallNotice notice={notice()} onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole("button", { name: "Put this away" }));
    expect(onDismiss).toHaveBeenCalledWith("cpsc-1:t-car-seat");
  });

  it("offers no dismissal when there is nowhere to put it", () => {
    render(<RecallNotice notice={notice()} />);
    expect(screen.queryByRole("button", { name: "Put this away" })).not.toBeInTheDocument();
  });
});
