import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import type { WeeklyEmail as WeeklyEmailModel } from "@/lib/email";
import { WeeklyEmail } from "./WeeklyEmail";

const EMAIL: WeeklyEmailModel = {
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
    {
      id: "w28-tdap",
      title: "Ask about the Tdap shot",
      why: "The antibodies pass to the baby before birth.",
      url: "https://ninetothree.com/week/pregnancy-w28#w28-tdap",
    },
    {
      id: "w28-kick-counts",
      title: "Learn your baby's normal movement pattern",
      why: "You are the only one who can notice a change.",
      url: "https://ninetothree.com/week/pregnancy-w28#w28-kick-counts",
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

async function html(email: WeeklyEmailModel = EMAIL): Promise<string> {
  return render(<WeeklyEmail email={email} />);
}

/** The rendered HTML with the entities React escapes put back. */
function text(out: string): string {
  return out.replaceAll("&#x27;", "'").replaceAll("&quot;", '"').replaceAll("&amp;", "&");
}

describe("WeeklyEmail template", () => {
  it("renders the week and the subject", async () => {
    const out = await html();
    expect(out).toContain("Week 28");
    expect(out).toContain("Get your glucose screening");
  });

  it("renders all three actions with their reasons", async () => {
    const out = text(await html());
    for (const action of EMAIL.actions) {
      expect(out).toContain(action.title);
      expect(out).toContain(action.why);
      expect(out).toContain(action.url);
    }
  });

  it("renders the partner card", async () => {
    const out = await html();
    expect(out).toContain("If someone is helping you this week");
    expect(out).toContain(EMAIL.partner.url);
  });

  it("renders the red flag, never collapsed", async () => {
    const out = await html();
    expect(out).toContain("Call your OB triage line");
    expect(out).toContain("Any vaginal bleeding");
  });

  it("renders the unsubscribe link as a real link in the body", async () => {
    const out = await html();
    expect(out).toContain(`href="${EMAIL.unsubscribeUrl}"`);
    expect(out).toContain("Turn it off");
  });

  it("carries no tracking pixel and no image", async () => {
    const out = await html();
    expect(out).not.toContain("<img");
    expect(out).not.toContain("pixel");
  });

  it("renders without a red flag when the pack has none", async () => {
    const out = await html({ ...EMAIL, redFlag: null });
    expect(out).not.toContain("Call your OB triage line");
    expect(out).toContain("Turn it off");
  });

  it("puts the preheader in the preview text", async () => {
    const out = await html();
    expect(out).toContain("The third trimester starts now.");
  });
});
