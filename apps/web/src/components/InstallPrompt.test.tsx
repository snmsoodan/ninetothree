import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InstallCard, InstallPrompt, installState } from "./InstallPrompt";

function setStandalone(standalone: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: standalone && query.includes("standalone"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
}

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, "userAgent", { configurable: true, get: () => ua });
}

afterEach(() => {
  vi.restoreAllMocks();
  setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0");
});

describe("installState", () => {
  it("says nothing to a parent who already installed it", () => {
    expect(installState({ standalone: true, hasPrompt: true, userAgent: "iPhone" })).toBe(
      "installed",
    );
  });

  it("offers the button when the browser offers a prompt", () => {
    expect(installState({ standalone: false, hasPrompt: true, userAgent: "Chrome" })).toBe(
      "prompt",
    );
  });

  it("gives the menu path on iOS, which has no prompt", () => {
    expect(installState({ standalone: false, hasPrompt: false, userAgent: "iPhone" })).toBe("ios");
    expect(installState({ standalone: false, hasPrompt: false, userAgent: "iPad" })).toBe("ios");
  });

  it("says nothing on a browser with no install path", () => {
    expect(installState({ standalone: false, hasPrompt: false, userAgent: "Firefox" })).toBe(
      "none",
    );
  });
});

describe("InstallPrompt", () => {
  it("renders nothing in a browser that cannot install", () => {
    setStandalone(false);
    setUserAgent("Mozilla/5.0 (X11; Linux) Firefox/130.0");
    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing once it is already on the home screen", () => {
    setStandalone(true);
    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it("gives an iPhone the menu path, because there is no button to press", () => {
    setStandalone(false);
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1");
    render(<InstallPrompt />);
    expect(screen.getByText("Add to Home Screen")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add to home screen" })).not.toBeInTheDocument();
  });

  it("shows the button when Chrome offers a prompt, and calls it once", async () => {
    setStandalone(false);
    setUserAgent("Mozilla/5.0 (Linux; Android 14) Chrome/130.0.0.0");
    render(<InstallPrompt />);

    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = Object.assign(new Event("beforeinstallprompt"), {
      prompt,
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    });
    act(() => {
      window.dispatchEvent(event);
    });

    const button = await screen.findByRole("button", { name: "Add to home screen" });
    await userEvent.click(button);

    expect(prompt).toHaveBeenCalledTimes(1);
    /* The card goes away rather than asking twice. */
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Add to home screen" })).not.toBeInTheDocument();
    });
  });

  it("stops listening when it unmounts", () => {
    setStandalone(false);
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<InstallPrompt />);
    unmount();
    expect(remove).toHaveBeenCalledWith("beforeinstallprompt", expect.any(Function));
  });
});

describe("InstallCard", () => {
  it("renders nothing when there is nothing to offer", () => {
    const { container } = render(<InstallCard state="installed" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("calls back when the button is pressed", async () => {
    const onInstall = vi.fn();
    render(<InstallCard state="prompt" onInstall={onInstall} />);
    await userEvent.click(screen.getByRole("button", { name: "Add to home screen" }));
    expect(onInstall).toHaveBeenCalledTimes(1);
  });
});
