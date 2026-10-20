import { afterEach, describe, expect, it, vi } from "vitest";
import {
  countryFromLanguage,
  countryFromTimeZone,
  countryName,
  detectCountry,
  isCovered,
} from "./country";

describe("countryFromTimeZone", () => {
  it("reads a US zone", () => {
    expect(countryFromTimeZone("America/New_York")).toBe("US");
    expect(countryFromTimeZone("America/Los_Angeles")).toBe("US");
    expect(countryFromTimeZone("Pacific/Honolulu")).toBe("US");
  });

  it("reads a UK zone", () => {
    expect(countryFromTimeZone("Europe/London")).toBe("UK");
    expect(countryFromTimeZone("Europe/Belfast")).toBe("UK");
  });

  it("does not mistake a neighbouring country for the US", () => {
    expect(countryFromTimeZone("America/Toronto")).toBeUndefined();
    expect(countryFromTimeZone("America/Mexico_City")).toBeUndefined();
    expect(countryFromTimeZone("America/Sao_Paulo")).toBeUndefined();
  });

  it("says nothing for a zone it does not know", () => {
    expect(countryFromTimeZone("Europe/Berlin")).toBeUndefined();
    expect(countryFromTimeZone("")).toBeUndefined();
    expect(countryFromTimeZone(undefined)).toBeUndefined();
  });
});

describe("countryFromLanguage", () => {
  it("reads a regional tag", () => {
    expect(countryFromLanguage("en-US")).toBe("US");
    expect(countryFromLanguage("en-GB")).toBe("UK");
    expect(countryFromLanguage("EN-gb")).toBe("UK");
  });

  it("reads a tag with a script or variant", () => {
    expect(countryFromLanguage("en-US-x-twain")).toBe("US");
    expect(countryFromLanguage("en-GB-oed")).toBe("UK");
  });

  it("says nothing for a language with no region", () => {
    expect(countryFromLanguage("en")).toBeUndefined();
    expect(countryFromLanguage("fr-FR")).toBeUndefined();
    expect(countryFromLanguage(undefined)).toBeUndefined();
  });
});

describe("detectCountry", () => {
  /** The machine running the tests has a zone of its own; pin it. */
  function stubZone(zone: string) {
    vi.stubGlobal("Intl", {
      DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: zone }) }),
    });
  }

  function stubLanguage(language: string) {
    Object.defineProperty(window.navigator, "language", { value: language, configurable: true });
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    stubLanguage("en-US");
  });

  it("reads the country from the time zone", () => {
    stubZone("Europe/London");
    expect(detectCountry()).toBe("UK");
  });

  it("falls back to the language when the zone says nothing", () => {
    stubZone("UTC");
    expect(detectCountry()).toBe("US");
  });

  it("says nothing when neither signal helps", () => {
    stubZone("UTC");
    stubLanguage("fr-FR");
    expect(detectCountry()).toBeUndefined();
  });

  it("says nothing when there is no Intl at all", () => {
    vi.stubGlobal("Intl", undefined);
    expect(detectCountry()).toBeUndefined();
  });

  it("says nothing when there is no navigator at all", () => {
    stubZone("UTC");
    vi.stubGlobal("navigator", undefined);
    expect(detectCountry()).toBeUndefined();
  });
});

describe("countryName", () => {
  it("names both countries in a sentence", () => {
    expect(countryName("US")).toBe("the United States");
    expect(countryName("UK")).toBe("the United Kingdom");
  });
});

describe("isCovered", () => {
  it("covers the US and nothing else yet", () => {
    expect(isCovered("US")).toBe(true);
    expect(isCovered("UK")).toBe(false);
    expect(isCovered(undefined)).toBe(false);
  });
});
