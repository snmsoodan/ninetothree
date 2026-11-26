import { describe, expect, it } from "vitest";
import {
  FIRST_WEEK,
  HOST,
  LAST_WEEK,
  STACK_SCREENS,
  TABS,
  appUrl,
  parseIncomingUrl,
  parseWeekNumber,
  readHref,
  tabForPath,
  webUrl,
  weekHref,
} from "./routes";

describe("the tab table", () => {
  it("has five tabs, and none of them is the week", () => {
    expect(TABS.map((tab) => tab.name)).toEqual([
      "today",
      "library",
      "shelf",
      "together",
      "settings",
    ]);
    expect(TABS.map((tab) => tab.href)).toEqual([
      "/today",
      "/library",
      "/shelf",
      "/together",
      "/settings",
    ]);
  });

  it("has one tab lit for every path it claims", () => {
    for (const tab of TABS) {
      expect(tabForPath(tab.href)).toBe(tab.name);
      for (const also of tab.also) expect(tabForPath(also)).toBe(tab.name);
    }
  });

  it("keeps This week lit on a week page, including a messy one", () => {
    expect(tabForPath("/week/24")).toBe("today");
    // The week's own tab list is the one that has to match on a prefix boundary,
    // so a path that merely starts with the same letters is not the same tab.
    expect(tabForPath("/weekly")).toBeNull();
    expect(tabForPath("/read/sleep")).toBe("library");
  });

  it("leaves a stack screen with no tab", () => {
    for (const path of ["/triage", "/updates", "/appointments", "/history", "/onboarding"]) {
      expect(tabForPath(path)).toBeNull();
    }
  });

  it("keeps a tab lit on its own sub-pages", () => {
    expect(tabForPath("/settings/quiet-hours")).toBe("settings");
    expect(tabForPath("/shelf/appointments")).toBe("shelf");
  });

  it("ignores a query and a hash when deciding the tab", () => {
    expect(tabForPath("/week/24?from=share#today")).toBe("today");
  });
});

describe("the link builders", () => {
  it("builds the same path the web serves", () => {
    expect(weekHref(24)).toBe("/week/24");
    expect(readHref("sleep")).toBe("/read/sleep");
    expect(webUrl(weekHref(24))).toBe(`https://${HOST}/week/24`);
    expect(appUrl(weekHref(24))).toBe("ninetothree://week/24");
  });

  it("names every stack screen with a leading slash, as the router does", () => {
    for (const screen of STACK_SCREENS) expect(screen.path.startsWith("/")).toBe(true);
  });
});

describe("parseIncomingUrl", () => {
  it("opens the routes the app has", () => {
    const expected: Array<[string, string]> = [
      ["ninetothree://week/24", "/week/24"],
      ["ninetothree:///week/24", "/week/24"],
      ["https://ninetothree.com/week/24", "/week/24"],
      ["https://www.ninetothree.com/week/24?utm=message", "/week/24"],
      ["http://ninetothree.com/today", "/today"],
      ["/library", "/library"],
      ["ninetothree://search", "/search"],
      ["https://ninetothree.com/search?q=car+seat", "/search"],
      ["/read/sleep-and-feeding", "/read/sleep-and-feeding"],
    ];
    for (const [raw, path] of expected) expect(parseIncomingUrl(raw)).toBe(path);
  });

  it("collapses a doubled slash and a trailing one", () => {
    expect(parseIncomingUrl("https://ninetothree.com//week/12/")).toBe("/week/12");
    expect(parseIncomingUrl("ninetothree:////shelf")).toBe("/shelf");
  });

  it("accepts every route the router declares", () => {
    for (const path of [
      "/today",
      "/week",
      "/library",
      "/search",
      "/read",
      "/shelf",
      "/together",
      "/settings",
    ]) {
      expect(parseIncomingUrl(path)).toBe(path);
    }
    for (const path of [
      "/updates",
      "/triage",
      "/appointments",
      "/history",
      "/onboarding",
      "/signin",
    ]) {
      expect(parseIncomingUrl(path)).toBe(path);
    }
  });

  it("refuses a host that is not ours", () => {
    expect(parseIncomingUrl("https://ninetothree.example/week/24")).toBeNull();
    expect(parseIncomingUrl("https://evil.test/ninetothree.com/week/24")).toBeNull();
  });

  it("refuses a scheme that is not ours", () => {
    expect(parseIncomingUrl("javascript://alert(1)")).toBeNull();
    expect(parseIncomingUrl("file:///etc/passwd")).toBeNull();
  });

  it("accepts a bare https origin as the app's front door", () => {
    expect(parseIncomingUrl("https://ninetothree.com")).toBe("/today");
    expect(parseIncomingUrl("https://www.ninetothree.com")).toBe("/today");
    expect(parseIncomingUrl("https://ninetothree.com:443/week/24")).toBe("/week/24");
  });

  it("normalises only what a browser would, and nothing else", () => {
    expect(parseIncomingUrl("//week/24")).toBe("/week/24");
    expect(parseIncomingUrl("/settings/")).toBe("/settings");
    expect(parseIncomingUrl("week/24")).toBeNull();
  });

  it("refuses a path it does not have, rather than guessing", () => {
    for (const raw of [
      "",
      "   ",
      "https://ninetothree.com/privacy",
      "ninetothree://pricing",
      "/week/3",
      "/week/43",
      "/week/1234",
      "/week/abc",
      "/read/Sleep",
      "/read/../settings",
      "settings",
    ]) {
      expect(parseIncomingUrl(raw)).toBeNull();
    }
  });

  it("opens every week the product has, and only those", () => {
    for (let week = FIRST_WEEK; week <= LAST_WEEK; week += 1) {
      expect(parseIncomingUrl(`/week/${week}`)).toBe(`/week/${week}`);
    }
    expect(parseWeekNumber("4")).toBe(4);
    expect(parseWeekNumber("42")).toBe(42);
    expect(parseWeekNumber(["24", "25"])).toBe(24);
    for (const raw of ["3", "43", "0", "100", "abc", "", undefined]) {
      expect(parseWeekNumber(raw)).toBeNull();
    }
  });
});
