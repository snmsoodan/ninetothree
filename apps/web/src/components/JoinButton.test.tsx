import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

import { JoinButton } from "./JoinButton";

const fetchMock = vi.fn();

beforeEach(() => {
  router.push.mockReset();
  router.refresh.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("JoinButton", () => {
  it("joins and goes to the dashboard", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);
    render(<JoinButton token="abc" />);

    await userEvent.click(screen.getByRole("button", { name: "Join this household" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/today"));
    expect(router.refresh).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith("/api/household/invites/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "abc" }),
    });
  });

  it("says the link is spent when it is gone", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 } as Response);
    render(<JoinButton token="abc" />);

    await userEvent.click(screen.getByRole("button", { name: "Join this household" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That link has been used or has run out. Ask for a new one — nothing is lost.",
    );
    expect(router.push).not.toHaveBeenCalled();
  });

  it("says so when something else went wrong", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 } as Response);
    render(<JoinButton token="abc" />);

    await userEvent.click(screen.getByRole("button", { name: "Join this household" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Try again in a moment/);
  });

  it("says what it is doing while it does it", async () => {
    let release: (value: Response) => void = () => {};
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => (release = resolve)));
    render(<JoinButton token="abc" />);

    await userEvent.click(screen.getByRole("button", { name: "Join this household" }));

    const busy = screen.getByRole("button", { name: "Joining" });
    expect(busy).toBeDisabled();
    release({ ok: true, status: 200 } as Response);
    await waitFor(() => expect(router.push).toHaveBeenCalled());
  });
});
