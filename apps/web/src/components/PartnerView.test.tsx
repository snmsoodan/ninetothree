import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ status: "authenticated" as string }));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: session.status, data: null }),
}));

import { PartnerView, type TogetherPayload } from "./PartnerView";

const payload: TogetherPayload = {
  id: "h1",
  role: "partner",
  members: [
    { userId: "u1", role: "parent", email: "maya@example.com", name: "Maya", isYou: false },
    { userId: "u2", role: "partner", email: "sam@example.com", name: "Sam", isYou: true },
  ],
  jobs: [],
  shared: [
    {
      itemId: "a",
      title: "Book the glucose test",
      packTitle: "Week 28",
      stagePackId: "pregnancy-w28",
      sharedBy: "u1",
      isYours: false,
    },
  ],
  appointments: [
    {
      id: "ap1",
      title: "Glucose test",
      kind: "test",
      dueAt: "2026-11-02T15:00:00.000Z",
      who: "Maya",
      location: "Downtown",
    },
    { id: "ap2", title: "No date yet", kind: null, dueAt: null, who: null, location: null },
  ],
  week: {
    id: "pregnancy-w28",
    title: "Week 28",
    subtitle: null,
    body: "Your ribs are running out of room.",
    mind: null,
    help: [{ id: "a", title: "Book the glucose test", type: "book", minutes: 10 }],
  },
};

function respond(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body });
}

beforeEach(() => {
  session.status = "authenticated";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PartnerView", () => {
  it("asks the server for the week it was given", async () => {
    const fetchMock = respond(payload);
    vi.stubGlobal("fetch", fetchMock);

    render(<PartnerView stageId="pregnancy-w28" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0]![0]).toBe("/api/household/together?stage=pregnancy-w28");
  });

  it("asks without a stage when there is none", async () => {
    const fetchMock = respond(payload);
    vi.stubGlobal("fetch", fetchMock);

    render(<PartnerView />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0]![0]).toBe("/api/household/together");
  });

  it("shows the week, the shared pin and the appointment", async () => {
    vi.stubGlobal("fetch", respond(payload));
    render(<PartnerView stageId="pregnancy-w28" />);

    expect(await screen.findByText("Your ribs are running out of room.")).toBeInTheDocument();
    // Once in "how to help", once in "shared" — the same pin, two jobs.
    expect(screen.getAllByText("Book the glucose test")).toHaveLength(2);
    expect(screen.getByText("Glucose test")).toBeInTheDocument();
    expect(screen.getByText(/Downtown/)).toBeInTheDocument();
  });

  it("leaves out an appointment with no date", async () => {
    vi.stubGlobal("fetch", respond(payload));
    render(<PartnerView stageId="pregnancy-w28" />);

    await screen.findByText("Glucose test");
    expect(screen.queryByText("No date yet")).not.toBeInTheDocument();
  });

  it("names the other person when there is exactly one", async () => {
    vi.stubGlobal("fetch", respond(payload));
    render(<PartnerView stageId="pregnancy-w28" />);

    expect(await screen.findByText("Week 28 · from Maya")).toBeInTheDocument();
  });

  it("says who is here, and calls you You", async () => {
    vi.stubGlobal("fetch", respond(payload));
    render(<PartnerView stageId="pregnancy-w28" />);

    const who = await screen.findByRole("heading", { name: "Who is here" });
    const section = who.closest("section")!;
    expect(section.textContent).toContain("You · partner");
    expect(section.textContent).toContain("Maya · parent");
  });

  it("offers a way in when signed out, without asking the server", async () => {
    session.status = "unauthenticated";
    const fetchMock = respond({ error: "signed out" }, 401);
    vi.stubGlobal("fetch", fetchMock);
    render(<PartnerView />);

    expect(await screen.findByText("Sign in to see this.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/signin?callbackUrl=/together",
    );
    // A request that is certain to be refused is a console error on a page
    // that has nothing wrong with it.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("waits for the session before asking", async () => {
    session.status = "loading";
    const fetchMock = respond(payload);
    vi.stubGlobal("fetch", fetchMock);
    render(<PartnerView />);

    expect(screen.getByText("One moment.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still offers a way in when the server says 401", async () => {
    vi.stubGlobal("fetch", respond({ error: "signed out" }, 401));
    render(<PartnerView />);

    expect(await screen.findByText("Sign in to see this.")).toBeInTheDocument();
  });

  it("says so when the read fails", async () => {
    vi.stubGlobal("fetch", respond({}, 500));
    render(<PartnerView />);

    expect(await screen.findByText("We could not read this just now.")).toBeInTheDocument();
  });

  it("says so when the network is gone", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<PartnerView />);

    expect(await screen.findByText("We could not read this just now.")).toBeInTheDocument();
  });

  it("does not set state after it has been unmounted", async () => {
    let release: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      release = resolve;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending));

    const { unmount } = render(<PartnerView />);
    unmount();
    release({ ok: true, status: 200, json: async () => payload });

    // Nothing to assert beyond "no act() warning and no crash"; the point is
    // that the late response is dropped.
    await Promise.resolve();
    expect(screen.queryByText("Your ribs are running out of room.")).not.toBeInTheDocument();
  });

  it("hands a job to the other person and re-reads", async () => {
    const fetchMock = respond(payload);
    vi.stubGlobal("fetch", fetchMock);
    render(<PartnerView stageId="pregnancy-w28" />);

    await userEvent.click(await screen.findByRole("button", { name: "Ask Maya to do this" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/household/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          itemId: "a",
          title: "Book the glucose test",
          packId: "pregnancy-w28",
          packTitle: "Week 28",
          assignedTo: "u1",
        }),
      }),
    );
    // The list is re-read rather than patched: the other person may have moved
    // it a second ago.
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(
          (call) => call[0] === "/api/household/together?stage=pregnancy-w28",
        ),
      ).toHaveLength(2),
    );
  });

  it("moves a job's status and re-reads", async () => {
    const withJob = {
      ...payload,
      jobs: [
        {
          id: "j1",
          itemId: "a",
          title: "Book the glucose test",
          packTitle: "Week 28",
          assignedTo: "u2",
          assignedBy: "u1",
          status: "open",
          doneAt: null,
        },
      ],
    };
    const fetchMock = respond(withJob);
    vi.stubGlobal("fetch", fetchMock);
    render(<PartnerView stageId="pregnancy-w28" />);

    await userEvent.click(await screen.findByRole("button", { name: "Done" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/household/jobs/j1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      }),
    );
  });

  it("clears a settled job and re-reads", async () => {
    const withJob = {
      ...payload,
      jobs: [
        {
          id: "j1",
          itemId: "a",
          title: "Book the glucose test",
          packTitle: "Week 28",
          assignedTo: "u2",
          assignedBy: "u1",
          status: "done",
          doneAt: "2026-10-20T10:00:00.000Z",
        },
      ],
    };
    const fetchMock = respond(withJob);
    vi.stubGlobal("fetch", fetchMock);
    render(<PartnerView stageId="pregnancy-w28" />);

    await userEvent.click(await screen.findByRole("button", { name: "Clear" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/household/jobs/j1", { method: "DELETE" }),
    );
  });

  it("does not offer to assign when there is nobody else", async () => {
    const alone = {
      ...payload,
      members: [
        {
          userId: "u2",
          role: "partner" as const,
          email: "sam@example.com",
          name: "Sam",
          isYou: true,
        },
      ],
    };
    vi.stubGlobal("fetch", respond(alone));
    render(<PartnerView stageId="pregnancy-w28" />);

    await screen.findByText("Your ribs are running out of room.");
    expect(screen.queryByRole("button", { name: /to do this/ })).not.toBeInTheDocument();
  });

  it("shows an empty calendar rather than nothing", async () => {
    vi.stubGlobal("fetch", respond({ ...payload, appointments: [] }));
    render(<PartnerView />);

    expect(await screen.findByText("Nothing in the calendar.")).toBeInTheDocument();
  });
});
