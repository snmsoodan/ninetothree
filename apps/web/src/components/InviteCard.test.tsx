import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ status: "authenticated" as string }));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: session.status, data: null }),
}));

/**
 * The plan is stubbed rather than fetched. `InviteCard` asks the entitlements
 * hook whether this household can have a second adult, and every other test in
 * this file is about the link itself — so the plan is a knob, not a request.
 */
const plan = vi.hoisted(() => ({ partner: true, known: true }));

vi.mock("@/lib/entitlements", () => ({
  useEntitlements: () => ({
    entitlements: {
      plan: "plus",
      fullTimeline: true,
      pinLimit: null,
      partner: plan.partner,
      offline: true,
      print: true,
      safety: true,
    },
    known: plan.known,
  }),
}));

import { InviteCard } from "./InviteCard";

const fetchMock = vi.fn();

beforeEach(() => {
  session.status = "authenticated";
  plan.partner = true;
  plan.known = true;
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn() } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function json(body: unknown, ok = true, status = 200) {
  return Promise.resolve({ ok, status, json: () => Promise.resolve(body) } as Response);
}

describe("InviteCard", () => {
  it("offers a way in when signed out", () => {
    session.status = "unauthenticated";
    render(<InviteCard />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signin");
  });

  it("explains what a link does", async () => {
    fetchMock.mockReturnValue(json({ invites: [] }));
    render(<InviteCard />);
    expect(
      await screen.findByText(/A link lets one person join this household, once/),
    ).toBeInTheDocument();
  });

  it("makes a link and shows it once", async () => {
    fetchMock
      .mockReturnValueOnce(json({ invites: [] }))
      .mockReturnValueOnce(json({ id: "i1", role: "partner", url: "/join/abc" }))
      .mockReturnValueOnce(json({ invites: [] }));

    render(<InviteCard />);
    await screen.findByText(/A link lets one person join/);
    await userEvent.click(screen.getByRole("button", { name: "Make a link" }));

    expect(await screen.findByText(/it is the only copy/)).toBeInTheDocument();
    expect(screen.getByText(`${window.location.origin}/join/abc`)).toBeInTheDocument();
  });

  it("sends the role that was chosen", async () => {
    fetchMock
      .mockReturnValueOnce(json({ invites: [] }))
      .mockReturnValueOnce(json({ id: "i1", role: "grandparent", url: "/join/abc" }))
      .mockReturnValueOnce(json({ invites: [] }));

    render(<InviteCard />);
    await screen.findByText(/A link lets one person join/);
    await userEvent.selectOptions(screen.getByLabelText("They join as"), "grandparent");
    await userEvent.click(screen.getByRole("button", { name: "Make a link" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const body = JSON.parse(fetchMock.mock.calls[1]![1].body as string);
    expect(body).toEqual({ role: "grandparent" });
  });

  it("says so when only a parent can invite", async () => {
    fetchMock
      .mockReturnValueOnce(json({ invites: [] }))
      .mockReturnValueOnce(json({ error: "not allowed" }, false, 403));

    render(<InviteCard />);
    await screen.findByText(/A link lets one person join/);
    await userEvent.click(screen.getByRole("button", { name: "Make a link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Only a parent can invite someone.");
  });

  it("says so when the link could not be made", async () => {
    fetchMock
      .mockReturnValueOnce(json({ invites: [] }))
      .mockReturnValueOnce(json({ error: "boom" }, false, 500));

    render(<InviteCard />);
    await screen.findByText(/A link lets one person join/);
    await userEvent.click(screen.getByRole("button", { name: "Make a link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Try again in a moment/);
  });

  it("lists the links that still work, and revokes one", async () => {
    fetchMock
      .mockReturnValueOnce(
        json({ invites: [{ id: "i1", role: "partner", expiresAt: "2026-11-02T00:00:00Z" }] }),
      )
      .mockReturnValueOnce(json({ revoked: true }))
      .mockReturnValueOnce(json({ invites: [] }));

    render(<InviteCard />);
    expect(await screen.findByText(/Partner · until/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Revoke" }));
    await waitFor(() => expect(screen.queryByText(/Partner · until/)).not.toBeInTheDocument());
  });

  it("copies the link", async () => {
    fetchMock
      .mockReturnValueOnce(json({ invites: [] }))
      .mockReturnValueOnce(json({ id: "i1", role: "partner", url: "/join/abc" }))
      .mockReturnValueOnce(json({ invites: [] }));

    render(<InviteCard />);
    await screen.findByText(/A link lets one person join/);
    await userEvent.click(screen.getByRole("button", { name: "Make a link" }));
    await screen.findByText(/it is the only copy/);

    await userEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/join/abc`,
    );
    expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();
  });

  it("stays quiet when the list cannot be read", async () => {
    fetchMock.mockReturnValue(json({ error: "signed out" }, false, 401));
    render(<InviteCard />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("asks for Plus before making a link, and still lists the links that work", async () => {
    plan.partner = false;
    fetchMock.mockReturnValue(
      json({ invites: [{ id: "i1", role: "partner", expiresAt: "2027-01-14T00:00:00.000Z" }] }),
    );

    render(<InviteCard />);

    expect(await screen.findByText("Inviting someone is part of Plus.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Make a link" })).not.toBeInTheDocument();
    // A link made while the household was on Plus can still be taken back.
    expect(await screen.findByRole("button", { name: "Revoke" })).toBeInTheDocument();
  });

  it("does not gate the form while the plan is still loading", async () => {
    plan.known = false;
    plan.partner = false;
    fetchMock.mockReturnValue(json({ invites: [] }));

    render(<InviteCard />);

    expect(await screen.findByRole("button", { name: "Make a link" })).toBeInTheDocument();
    expect(screen.queryByText("Inviting someone is part of Plus.")).not.toBeInTheDocument();
  });
});
