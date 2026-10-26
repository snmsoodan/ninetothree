import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ status: "authenticated" as string }));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: session.status, data: null }),
}));

import { HouseholdCard, type Household } from "./HouseholdCard";

const alone: Household = {
  id: "h1",
  role: "parent",
  members: [{ userId: "u1", role: "parent", email: "maya@example.com", name: "Maya", isYou: true }],
};

const two: Household = {
  id: "h1",
  role: "parent",
  members: [
    { userId: "u1", role: "parent", email: "maya@example.com", name: "Maya", isYou: true },
    { userId: "u2", role: "partner", email: "sam@example.com", name: null, isYou: false },
  ],
};

function respond(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({ ok, json: async () => body });
}

beforeEach(() => {
  session.status = "authenticated";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HouseholdCard", () => {
  it("asks a signed-out visitor to sign in", () => {
    session.status = "unauthenticated";
    render(<HouseholdCard />);
    expect(screen.getByText(/Sign in to set one up/)).toBeInTheDocument();
  });

  it("says one moment while the session is loading", () => {
    session.status = "loading";
    render(<HouseholdCard />);
    expect(screen.getByText("One moment.")).toBeInTheDocument();
  });

  it("lists everyone, marking you and falling back to the address", async () => {
    vi.stubGlobal("fetch", respond(two));
    render(<HouseholdCard />);

    expect(await screen.findByText("You")).toBeInTheDocument();
    expect(screen.getByText("Parent")).toBeInTheDocument();
    expect(screen.getByText("sam@example.com")).toBeInTheDocument();
    expect(screen.getByText("Partner")).toBeInTheDocument();
  });

  it("does not repeat your own address", async () => {
    vi.stubGlobal("fetch", respond(two));
    render(<HouseholdCard />);

    await screen.findByText("You");
    expect(screen.queryByText("maya@example.com")).not.toBeInTheDocument();
  });

  it("says it is only you when it is", async () => {
    vi.stubGlobal("fetch", respond(alone));
    render(<HouseholdCard />);

    expect(await screen.findByText(/It is only you here/)).toBeInTheDocument();
  });

  it("explains what a second person sees when there is one", async () => {
    vi.stubGlobal("fetch", respond(two));
    render(<HouseholdCard />);

    expect(
      await screen.findByText(/Your own notes and your own progress stay yours/),
    ).toBeInTheDocument();
  });

  it("offers a way out that is not leaving", async () => {
    vi.stubGlobal("fetch", respond(alone));
    render(<HouseholdCard />);

    await userEvent.click(await screen.findByRole("button", { name: "Leave household" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Stay" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("leaves, then reloads what is left", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => alone })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ left: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => alone });
    vi.stubGlobal("fetch", fetchMock);
    render(<HouseholdCard />);

    await userEvent.click(await screen.findByRole("button", { name: "Leave household" }));
    await userEvent.click(screen.getByRole("button", { name: "Leave" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/household");
    expect(fetchMock).toHaveBeenCalledWith("/api/household/membership", { method: "DELETE" });
  });

  it("says so when the household cannot be read", async () => {
    vi.stubGlobal("fetch", respond({ error: "nope" }, false));
    render(<HouseholdCard />);

    expect(await screen.findByText(/could not read your household/)).toBeInTheDocument();
  });

  it("says so when leaving fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => alone })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    render(<HouseholdCard />);

    await userEvent.click(await screen.findByRole("button", { name: "Leave household" }));
    await userEvent.click(screen.getByRole("button", { name: "Leave" }));

    expect(await screen.findByText(/could not read your household/)).toBeInTheDocument();
  });
});
