import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PlanCard } from "./PlanCard";

const session = vi.hoisted(() => ({ status: "authenticated" as string }));
vi.mock("next-auth/react", () => ({ useSession: () => ({ status: session.status }) }));

const FREE = {
  plan: "free",
  status: "active",
  entitlements: {
    fullTimeline: false,
    pinLimit: 5,
    partner: false,
    offline: false,
    print: false,
  },
  configured: true,
};

const PLUS = {
  plan: "plus",
  status: "active",
  entitlements: {
    fullTimeline: true,
    pinLimit: null,
    partner: true,
    offline: true,
    print: true,
  },
  configured: true,
};

function respond(body: unknown, init: { status?: number } = {}) {
  return Promise.resolve({
    ok: (init.status ?? 200) < 400,
    status: init.status ?? 200,
    json: async () => body,
  } as Response);
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  session.status = "authenticated";
  fetchMock = vi.fn(() => respond(FREE));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PlanCard", () => {
  it("says what the free plan includes", async () => {
    render(<PlanCard />);
    expect(await screen.findByText("Free")).toBeInTheDocument();
    expect(screen.getByText("This week and the next few")).toBeInTheDocument();
    expect(screen.getByText("Up to 5 pins")).toBeInTheDocument();
    expect(screen.getByText("One person")).toBeInTheDocument();
  });

  it("says what a paid plan includes", async () => {
    fetchMock.mockImplementation(() => respond(PLUS));
    render(<PlanCard />);
    expect(await screen.findByText("Plus")).toBeInTheDocument();
    expect(screen.getByText("Every week, from now to three")).toBeInTheDocument();
    expect(screen.getByText("As many pins as you like")).toBeInTheDocument();
    expect(screen.getByText("A partner, with their own way in")).toBeInTheDocument();
  });

  it("promises the safety pages are never gated", async () => {
    render(<PlanCard />);
    expect(
      await screen.findByText(/The red flags, the safety pages and the recall feed are never/),
    ).toBeInTheDocument();
  });

  it("offers to buy Plus once, at the price on the button", async () => {
    render(<PlanCard />);
    expect(await screen.findByRole("button", { name: "Pay $5, once" })).toBeInTheDocument();
    expect(screen.getByText("One payment. It does not renew.")).toBeInTheDocument();
  });

  it("has nothing to manage on a paid plan", async () => {
    fetchMock.mockImplementation(() => respond(PLUS));
    render(<PlanCard />);
    expect(
      await screen.findByText("Paid once. Nothing renews, and there is nothing to cancel."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("says so instead of offering a button when billing is not configured", async () => {
    fetchMock.mockImplementation(() => respond({ ...FREE, configured: false }));
    render(<PlanCard />);
    expect(await screen.findByText(/Payments are not open yet/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("thanks them when they come back from paying", async () => {
    fetchMock.mockImplementation(() => respond(PLUS));
    vi.stubGlobal("location", { ...window.location, search: "?billing=done" });
    render(<PlanCard />);
    expect(await screen.findByRole("status")).toHaveTextContent(/Thank you/);
  });

  it("does not thank them for a visit that was not a payment", async () => {
    fetchMock.mockImplementation(() => respond(PLUS));
    vi.stubGlobal("location", { ...window.location, search: "" });
    render(<PlanCard />);
    await screen.findByText("Paid once. Nothing renews, and there is nothing to cancel.");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("opens the checkout and follows the url it is given", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    fetchMock.mockImplementation((url: string) =>
      url === "/api/billing" ? respond(FREE) : respond({ url: "https://checkout.stripe.test/1" }),
    );
    render(<PlanCard />);
    await userEvent.click(await screen.findByRole("button", { name: "Pay $5, once" }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://checkout.stripe.test/1"));
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(url).toBe("/api/billing/checkout");
    expect(init).toMatchObject({ method: "POST" });
    // The server decides what is for sale and at what price; the browser only
    // says "one Plus, please", and not even that in a body.
    expect(init).not.toHaveProperty("body");
  });

  it("says so when the checkout cannot be opened", async () => {
    fetchMock.mockImplementation((url: string) =>
      url === "/api/billing" ? respond(FREE) : respond({}, { status: 503 }),
    );
    render(<PlanCard />);
    await userEvent.click(await screen.findByRole("button", { name: "Pay $5, once" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/could not open that just now/);
  });

  it("says so when the checkout never reaches the server", async () => {
    fetchMock.mockImplementation((url: string) =>
      url === "/api/billing" ? respond(FREE) : Promise.reject(new Error("offline")),
    );
    render(<PlanCard />);
    await userEvent.click(await screen.findByRole("button", { name: "Pay $5, once" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/could not open that just now/);
  });

  it("offers a way in when signed out, without asking the server", async () => {
    session.status = "unauthenticated";
    render(<PlanCard />);
    expect(await screen.findByText(/You are not signed in/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("waits for the session before asking", async () => {
    session.status = "loading";
    render(<PlanCard />);
    expect(screen.getByText("One moment.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats a 401 as signed out even when the session says otherwise", async () => {
    fetchMock.mockImplementation(() => respond({}, { status: 401 }));
    render(<PlanCard />);
    expect(await screen.findByText(/You are not signed in/)).toBeInTheDocument();
  });

  it("says so when the plan cannot be read", async () => {
    fetchMock.mockImplementation(() => respond({}, { status: 500 }));
    render(<PlanCard />);
    expect(await screen.findByText(/could not read your plan just now/)).toBeInTheDocument();
  });

  it("says so when the plan request never reaches the server", async () => {
    fetchMock.mockImplementation(() => Promise.reject(new Error("offline")));
    render(<PlanCard />);
    expect(await screen.findByText(/could not read your plan just now/)).toBeInTheDocument();
  });
});
