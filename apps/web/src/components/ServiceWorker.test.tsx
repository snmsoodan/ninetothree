import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ServiceWorker, shouldRegister } from "./ServiceWorker";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("shouldRegister", () => {
  it("registers in a production build", () => {
    expect(shouldRegister("production", true)).toBe(true);
  });

  it("does not register in development, where the cache would serve stale edits", () => {
    expect(shouldRegister("development", true)).toBe(false);
  });

  it("does not register in a browser without service workers", () => {
    expect(shouldRegister("production", false)).toBe(false);
  });
});

describe("ServiceWorker", () => {
  it("registers the worker once on mount", () => {
    const register = vi.fn().mockResolvedValue({});
    vi.stubGlobal("navigator", { ...navigator, serviceWorker: { register } });
    vi.stubEnv("NODE_ENV", "production");

    render(<ServiceWorker />);

    expect(register).toHaveBeenCalledWith("/sw.js");
  });

  it("says nothing when registration fails, because the app still works", async () => {
    const register = vi.fn().mockRejectedValue(new Error("blocked"));
    vi.stubGlobal("navigator", { ...navigator, serviceWorker: { register } });
    vi.stubEnv("NODE_ENV", "production");

    render(<ServiceWorker />);

    /* The rejection is swallowed; an unhandled one would fail this test. */
    await Promise.resolve();
    expect(register).toHaveBeenCalled();
  });

  it("does not register in development", () => {
    const register = vi.fn().mockResolvedValue({});
    vi.stubGlobal("navigator", { ...navigator, serviceWorker: { register } });
    vi.stubEnv("NODE_ENV", "development");

    render(<ServiceWorker />);

    expect(register).not.toHaveBeenCalled();
  });
});
