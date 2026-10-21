import { describe, expect, it } from "vitest";
import {
  DEFAULT_READING,
  READING_ATTRIBUTES,
  READING_STORAGE_KEY,
  applyReading,
  migrateReading,
  readingAttributes,
  readingBootstrapScript,
} from "./reading";

describe("readingAttributes", () => {
  it("writes nothing when every setting follows the device", () => {
    expect(readingAttributes(DEFAULT_READING)).toEqual({});
  });

  it("writes only the settings that are overridden", () => {
    expect(readingAttributes({ ...DEFAULT_READING, contrast: "more" })).toEqual({
      "data-contrast": "more",
    });
    expect(readingAttributes({ ...DEFAULT_READING, motion: "reduced" })).toEqual({
      "data-motion": "reduced",
    });
    expect(readingAttributes({ ...DEFAULT_READING, letters: "hyperlegible" })).toEqual({
      "data-font": "hyperlegible",
    });
  });

  it("writes all three when all three are overridden", () => {
    expect(
      readingAttributes({ contrast: "more", motion: "reduced", letters: "hyperlegible" }),
    ).toEqual({
      "data-contrast": "more",
      "data-motion": "reduced",
      "data-font": "hyperlegible",
    });
  });

  it("never writes the word default, because the CSS keys off the attribute", () => {
    const values = Object.values(readingAttributes(DEFAULT_READING));
    expect(values).not.toContain("default");
  });
});

describe("applyReading", () => {
  function fakeRoot() {
    const attributes = new Map<string, string>();
    return {
      attributes,
      setAttribute: (name: string, value: string) => void attributes.set(name, value),
      removeAttribute: (name: string) => void attributes.delete(name),
    };
  }

  it("sets the attributes that are on", () => {
    const root = fakeRoot();
    applyReading({ contrast: "more", motion: "reduced", letters: "hyperlegible" }, root);
    expect(Object.fromEntries(root.attributes)).toEqual({
      "data-contrast": "more",
      "data-motion": "reduced",
      "data-font": "hyperlegible",
    });
  });

  it("removes the attributes that are off, so the device setting comes back", () => {
    const root = fakeRoot();
    applyReading({ contrast: "more", motion: "reduced", letters: "hyperlegible" }, root);
    applyReading(DEFAULT_READING, root);
    expect(root.attributes.size).toBe(0);
  });

  it("touches every attribute it knows about, not just the ones being set", () => {
    const touched: string[] = [];
    applyReading(DEFAULT_READING, {
      setAttribute: (name) => void touched.push(name),
      removeAttribute: (name) => void touched.push(name),
    });
    expect(touched.sort()).toEqual(Object.values(READING_ATTRIBUTES).sort());
  });
});

describe("migrateReading", () => {
  it("returns the defaults for nothing at all", () => {
    expect(migrateReading(undefined)).toEqual(DEFAULT_READING);
    expect(migrateReading(null)).toEqual(DEFAULT_READING);
  });

  it("returns the defaults for something that is not an object", () => {
    expect(migrateReading("more")).toEqual(DEFAULT_READING);
    expect(migrateReading(7)).toEqual(DEFAULT_READING);
    expect(migrateReading([])).toEqual(DEFAULT_READING);
  });

  it("keeps values this version understands", () => {
    expect(
      migrateReading({ contrast: "more", motion: "reduced", letters: "hyperlegible" }),
    ).toEqual({ contrast: "more", motion: "reduced", letters: "hyperlegible" });
  });

  it("drops a value this version does not understand, one field at a time", () => {
    expect(migrateReading({ contrast: "maximum", motion: "reduced" })).toEqual({
      contrast: "default",
      motion: "reduced",
      letters: "default",
    });
  });

  it("drops a value of the wrong type", () => {
    expect(migrateReading({ contrast: true, letters: 3 })).toEqual(DEFAULT_READING);
  });
});

describe("readingBootstrapScript", () => {
  it("reads the same key the store writes", () => {
    expect(readingBootstrapScript()).toContain(JSON.stringify(READING_STORAGE_KEY));
  });

  it("sets the same three attributes the effect sets", () => {
    const script = readingBootstrapScript();
    for (const name of Object.values(READING_ATTRIBUTES)) {
      expect(script).toContain(name);
    }
  });

  it("swallows every error, because a blocked storage must not break the page", () => {
    expect(readingBootstrapScript()).toContain("catch(e){}");
  });

  it("runs as a function, so it cannot leak a variable into the page", () => {
    expect(readingBootstrapScript().startsWith("(function(){")).toBe(true);
    expect(readingBootstrapScript().endsWith("})();")).toBe(true);
  });
});
