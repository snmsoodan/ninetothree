import { describe, expect, it } from "vitest";
import { PACKS } from "@ninetothree/content/registry";
import { ARTICLES } from "@ninetothree/content/article-registry";
import { EMPTY_STATE } from "@ninetothree/domain";
import { weekModel, type WeekModel } from "./week";
import { weekHtml, weekShareFileName, weekShareTitle } from "./week-share";

function pack(id: string) {
  const found = PACKS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`no pack ${id}`);
  return found;
}

function build(id: string, state = EMPTY_STATE): WeekModel {
  return weekModel({
    pack: pack(id),
    state,
    today: "2026-03-02",
    packs: PACKS,
    articles: ARTICLES,
  });
}

describe("weekHtml", () => {
  it("prints the stage, the day and the steps", () => {
    const model = build("pregnancy-w28");
    const html = weekHtml(model, { today: "2026-03-02" });

    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain(model.heading);
    expect(html).toContain("2026-03-02");
    expect(html.match(/<h3>/g)?.length).toBe(model.steps.length);
  });

  it("prints every option with its cost and link, so a printed page still works", () => {
    const model = build("pregnancy-w16");
    const step = model.steps.find((s) => s.options.some((o) => o.url));
    if (!step) return;
    const html = weekHtml(model, { today: "2026-03-02" });

    for (const option of step.options) {
      expect(html).toContain(option.label);
      if (option.cost) expect(html).toContain(option.cost);
      if (option.url) expect(html).toContain(option.url);
    }
  });

  it("prints the appointment, the warning signs and where the facts came from", () => {
    const model = build("postpartum-week-1");
    const html = weekHtml(model, { today: "2026-03-02" });

    expect(html).toContain(model.appointments.heading);
    expect(html).toContain(model.redFlags.heading);
    expect(html).toContain(model.sources.heading);
    expect(html).toContain(model.sources.reviewed);
  });

  it("escapes anything a pack could put in the page", () => {
    const model = build("pregnancy-w28");
    model.heading = 'A & B <script>alert("x")</script>';
    const html = weekHtml(model, { today: "2026-03-02" });

    expect(html).toContain("A &amp; B &lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("prints the partner's lens instead of steps when that is what the screen shows", () => {
    const model = build("infant-month-10", { ...EMPTY_STATE, persona: "partner" });
    const html = weekHtml(model, { today: "2026-03-02" });

    expect(model.lens).toBeTruthy();
    expect(html).toContain(model.lens?.headline ?? "");
    expect(html).not.toContain(model.stepsHeading ?? "steps that do not exist");
  });

  it("prints a sparse week without empty headings or the word undefined", () => {
    const model = build("pregnancy-w4");
    model.steps = model.steps.map((step) => ({
      ...step,
      detail: null,
      options: step.options.map((option) => ({ ...option, cost: null })),
    }));
    model.alsoKnow = { ...model.alsoKnow, items: [] };
    model.appointments = {
      ...model.appointments,
      items: model.appointments.items.map((item) => ({ ...item, who: null, note: null })),
    };
    model.redFlags = {
      ...model.redFlags,
      items: model.redFlags.items.map((flag) => ({ ...flag, callLabel: "", phone: null })),
    };
    model.sources = { ...model.sources, items: [] };

    const html = weekHtml(model, { today: "2026-03-02" });

    expect(html).not.toContain("undefined");
    expect(html).not.toContain(model.alsoKnow.heading);
    expect(html).not.toContain(model.sources.heading);
    expect(html.match(/<h3>/g)?.length).toBe(model.steps.length);
  });

  it("falls back to the site's name when a page has no stage id", () => {
    const model = build("pregnancy-w4");
    model.packId = "";
    expect(weekShareFileName(model)).toBe("nine-to-three.html");
  });

  it("names the file after the stage so two weeks do not overwrite each other", () => {
    expect(weekShareFileName(build("pregnancy-w28"))).toBe("pregnancy-w28.html");
    expect(weekShareTitle(build("pregnancy-w28"))).toContain("Week 28");
  });
});
