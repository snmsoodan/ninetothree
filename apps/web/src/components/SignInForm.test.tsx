import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signIn = vi.fn();

vi.mock("next-auth/react", () => ({ signIn: (...args: unknown[]) => signIn(...args) }));

import { SignInForm } from "./SignInForm";

beforeEach(() => signIn.mockReset());

describe("SignInForm", () => {
  it("offers exactly two ways in, and they are Google and Apple", async () => {
    render(<SignInForm providers={["google", "apple"]} callbackUrl="/week/pregnancy-w28" />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Continue with Google",
      "Continue with Apple",
    ]);
    expect(screen.queryByLabelText("Your email")).not.toBeInTheDocument();
  });

  it("takes the parent back where they were going", async () => {
    render(<SignInForm providers={["google", "apple"]} callbackUrl="/week/pregnancy-w28" />);

    await userEvent.click(screen.getByRole("button", { name: "Continue with Apple" }));

    expect(signIn).toHaveBeenCalledWith("apple", { callbackUrl: "/week/pregnancy-w28" });
  });

  it("shows only the provider that is configured", () => {
    render(<SignInForm providers={["google"]} callbackUrl="/today" />);

    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue with Apple" })).not.toBeInTheDocument();
  });

  it("says so plainly when nothing is configured, instead of showing a dead button", () => {
    render(<SignInForm providers={[]} callbackUrl="/today" />);

    expect(screen.getByText(/Sign-in is not set up on this copy/)).toBeInTheDocument();
    expect(screen.getByText(/AUTH_GOOGLE_ID/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps the email form behind test mode, and labels it", () => {
    render(<SignInForm providers={["email"]} callbackUrl="/today" />);

    expect(screen.getByText("Test mode: email link")).toBeInTheDocument();
    expect(screen.getByLabelText("Your email")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Continue with/ })).not.toBeInTheDocument();
  });
});
