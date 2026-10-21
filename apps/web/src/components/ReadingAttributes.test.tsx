import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { READING_STORAGE_KEY, readingBootstrapScript } from "@/lib/reading";
import { __resetForTests, setReading, subscribe } from "@/lib/store";
import { ReadingAttributes } from "./ReadingAttributes";

function stored(patch: Record<string, string>) {
  window.localStorage.setItem(
    READING_STORAGE_KEY,
    JSON.stringify({ version: 1, onboarded: true, reading: patch }),
  );
}

function attributes() {
  const root = document.documentElement;
  return {
    contrast: root.getAttribute("data-contrast"),
    motion: root.getAttribute("data-motion"),
    font: root.getAttribute("data-font"),
  };
}

beforeEach(() => {
  window.localStorage.clear();
  __resetForTests();
  subscribe(() => {});
});

afterEach(() => {
  for (const name of ["data-contrast", "data-motion", "data-font"]) {
    document.documentElement.removeAttribute(name);
  }
  window.localStorage.clear();
});

describe("ReadingAttributes", () => {
  it("renders the bootstrap script inline, so it runs before the first paint", () => {
    const { container } = render(<ReadingAttributes />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toBe(readingBootstrapScript());
  });

  it("puts nothing on <html> when every setting follows the device", async () => {
    render(<ReadingAttributes />);
    await waitFor(() => expect(attributes()).toEqual({ contrast: null, motion: null, font: null }));
  });

  it("puts the stored overrides on <html>", async () => {
    stored({ contrast: "more", motion: "reduced", letters: "hyperlegible" });
    __resetForTests();
    subscribe(() => {});
    render(<ReadingAttributes />);
    await waitFor(() =>
      expect(attributes()).toEqual({
        contrast: "more",
        motion: "reduced",
        font: "hyperlegible",
      }),
    );
  });

  it("follows a change made after the page has loaded", async () => {
    render(<ReadingAttributes />);
    await waitFor(() => expect(attributes().contrast).toBeNull());
    act(() => setReading({ contrast: "more" }));
    await waitFor(() => expect(attributes().contrast).toBe("more"));
  });

  it("takes an override back off when the parent turns it off", async () => {
    stored({ contrast: "more" });
    __resetForTests();
    subscribe(() => {});
    render(<ReadingAttributes />);
    await waitFor(() => expect(attributes().contrast).toBe("more"));
    act(() => setReading({ contrast: "default" }));
    await waitFor(() => expect(attributes().contrast).toBeNull());
  });
});
