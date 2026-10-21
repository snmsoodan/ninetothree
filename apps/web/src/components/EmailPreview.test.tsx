import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { WeeklyEmail } from "@/lib/email";
import { EmailPreview } from "./EmailPreview";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/email",
}));

const EMAIL: WeeklyEmail = {
  key: "pregnancy-w28:2026-10-20",
  subject: "Week 28: Get your glucose screening if you haven't",
  preheader: "The third trimester starts now.",
  weekLabel: "Week 28",
  actions: [
    {
      id: "w28-glucose",
      title: "Get your glucose screening if you haven't",
      why: "It is usually done between 24 and 28 weeks.",
      url: "https://ninetothree.com/week/pregnancy-w28#w28-glucose",
    },
  ],
  partner: {
    title: "If someone is helping you this week",
    body: "This is the one to hand them: get your glucose screening if you haven't.",
    url: "https://ninetothree.com/week/pregnancy-w28",
  },
  redFlag: {
    title: "Call your OB triage line",
    body: "Any vaginal bleeding, or fluid that keeps leaking",
    url: "https://ninetothree.com/week/pregnancy-w28#red-flags",
  },
  settingsUrl: "https://ninetothree.com/settings#notify-heading",
  unsubscribeUrl: "https://ninetothree.com/settings#notify-heading",
};

const SEND_AT = new Date("2026-10-21T12:00:00.000Z");

function show(email: WeeklyEmail | null, reason: Parameters<typeof EmailPreview>[0]["reason"]) {
  return render(
    <EmailPreview email={email} reason={reason} sendAt={SEND_AT} timeZone="America/New_York" />,
  );
}

describe("EmailPreview", () => {
  it("shows the week, the subject and the preheader", () => {
    show(EMAIL, "ok");
    expect(screen.getByRole("heading", { name: "The weekly email" })).toBeInTheDocument();
    expect(screen.getByText("Week 28")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Week 28: Get your glucose screening if you haven't" }),
    ).toBeInTheDocument();
    expect(screen.getByText("The third trimester starts now.")).toBeInTheDocument();
  });

  it("shows every action with its reason", () => {
    show(EMAIL, "ok");
    expect(screen.getByText("Get your glucose screening if you haven't")).toBeInTheDocument();
    expect(screen.getByText("It is usually done between 24 and 28 weeks.")).toBeInTheDocument();
  });

  it("shows the partner card", () => {
    show(EMAIL, "ok");
    expect(screen.getByText("If someone is helping you this week")).toBeInTheDocument();
  });

  it("shows the red flag", () => {
    show(EMAIL, "ok");
    expect(screen.getByText("Call your OB triage line")).toBeInTheDocument();
    expect(
      screen.getByText("Any vaginal bleeding, or fluid that keeps leaking"),
    ).toBeInTheDocument();
  });

  it("leaves the red flag out when there is none", () => {
    show({ ...EMAIL, redFlag: null }, "ok");
    expect(screen.queryByText("Call your OB triage line")).not.toBeInTheDocument();
    expect(screen.getByText("If someone is helping you this week")).toBeInTheDocument();
  });

  it("offers one click to turn it off", () => {
    show(EMAIL, "ok");
    expect(screen.getByRole("link", { name: "Turn it off" })).toHaveAttribute(
      "href",
      "/settings#notify-heading",
    );
  });

  it("says when the next one would go, in the parent's zone", () => {
    show(EMAIL, "ok");
    expect(screen.getByText(/in America\/New_York/)).toBeInTheDocument();
  });

  it("explains why nothing would be sent, in the gate's own words", () => {
    show(null, "off");
    expect(
      screen.getByRole("heading", { name: "Nothing would be sent this week" }),
    ).toBeInTheDocument();
    expect(screen.getByText("The weekly email is off.")).toBeInTheDocument();
  });

  it("says plainly that nothing is sent yet", () => {
    show(EMAIL, "ok");
    expect(screen.getByText(/Nothing is sent yet/)).toBeInTheDocument();
  });
});
