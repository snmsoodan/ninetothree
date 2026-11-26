import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@ninetothree/ui-native";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthScreen } from "./auth-screen";

const SESSION = {
  token: "abc123",
  expiresAt: "2030-01-01T00:00:00.000Z",
  user: { id: "5f1c9f0e-0000-4000-8000-000000000000", email: "sam@example.com", name: "Sam" },
};

afterEach(cleanup);

function draw(overrides: Partial<React.ComponentProps<typeof AuthScreen>> = {}) {
  const handlers = { onGoogle: vi.fn(), onApple: vi.fn(), onSignOut: vi.fn() };
  render(
    <ThemeProvider>
      <AuthScreen session={null} phase="signed-out" appleAvailable {...handlers} {...overrides} />
    </ThemeProvider>,
  );
  return handlers;
}

describe("the sign-in card", () => {
  it("offers Google and Apple on iOS", () => {
    const handlers = draw();
    fireEvent.click(screen.getByTestId("sign-in-google"));
    fireEvent.click(screen.getByTestId("sign-in-apple"));
    expect(handlers.onGoogle).toHaveBeenCalledOnce();
    expect(handlers.onApple).toHaveBeenCalledOnce();
  });

  it("hides Apple where the provider cannot run", () => {
    draw({ appleAvailable: false });
    expect(screen.queryByTestId("sign-in-apple")).toBeNull();
  });

  it("says nothing about a closed prompt beyond that it closed", () => {
    draw({ phase: "cancelled" });
    expect(screen.getByText("Closed without signing in.")).toBeTruthy();
    expect(screen.queryByText(/error|failed/i)).toBeNull();
  });

  it("offers a quiet sentence, not a diagnosis, after a refusal", () => {
    draw({ phase: "refused" });
    expect(screen.getByText(/That did not go through/)).toBeTruthy();
  });

  it("disables both providers while one is working", () => {
    draw({ phase: "working" });
    expect(screen.getByTestId("sign-in-google").getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByText("Opening the provider…")).toBeTruthy();
  });

  it("names the account and offers sign-out when signed in", () => {
    const handlers = draw({ session: SESSION, phase: "signed-in" });
    expect(screen.getByText(/signed in as Sam/)).toBeTruthy();
    fireEvent.click(screen.getByTestId("sign-out"));
    expect(handlers.onSignOut).toHaveBeenCalledOnce();
  });
});
