import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ status: "authenticated" as string }));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: session.status, data: null }),
}));

import { DataCard } from "./DataCard";

const live = { requestedAt: "2026-03-01T00:00:00.000Z", purgeAfter: "2026-03-31T00:00:00.000Z" };

function json(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
    text: async (): Promise<string> => JSON.stringify(body),
  };
}

let saved: string[] = [];

function read(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });
}

beforeEach(() => {
  session.status = "authenticated";
  saved = [];
  vi.stubGlobal("URL", {
    createObjectURL: (blob: Blob) => {
      void read(blob).then((body) => saved.push(body));
      return "blob:one";
    },
    revokeObjectURL: () => {},
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("DataCard", () => {
  it("offers a download and a delete when signed in", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ deletion: null })));
    render(<DataCard />);

    expect(await screen.findByRole("button", { name: "Download everything" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download a spreadsheet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete my account" })).toBeInTheDocument();
  });

  it("says the download is only the device when signed out, and offers no delete", async () => {
    session.status = "unauthenticated";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<DataCard />);

    expect(await screen.findByText(/Sign in to include your account/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete my account" })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("merges the server export with what is on this device", async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        url.startsWith("/api/account/export")
          ? json({ user: { email: "maya@example.com" } })
          : json({ deletion: null }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<DataCard />);

    await userEvent.click(await screen.findByRole("button", { name: "Download everything" }));

    await waitFor(() => expect(saved).toHaveLength(1));
    const body = JSON.parse(saved[0]!) as Record<string, unknown>;
    expect(body.user).toEqual({ email: "maya@example.com" });
    expect(body.onThisDevice).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith("/api/account/export?format=json");
  });

  it("downloads the spreadsheet as text", async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        url.startsWith("/api/account/export")
          ? { ok: true, status: 200, text: async (): Promise<string> => "section,id\nuser,u1\n" }
          : json({ deletion: null }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<DataCard />);

    await userEvent.click(await screen.findByRole("button", { name: "Download a spreadsheet" }));

    await waitFor(() => expect(saved).toHaveLength(1));
    expect(saved[0]).toBe("section,id\nuser,u1\n");
    expect(fetchMock).toHaveBeenCalledWith("/api/account/export?format=csv");
  });

  it("says so when the file cannot be put together", async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        url.startsWith("/api/account/export") ? json({}, false, 500) : json({ deletion: null }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<DataCard />);

    await userEvent.click(await screen.findByRole("button", { name: "Download everything" }));

    expect(await screen.findByRole("status")).toHaveTextContent(/could not put that file together/);
    expect(saved).toHaveLength(0);
  });

  it("asks before deleting, and says when it will happen", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) =>
      Promise.resolve(
        init?.method === "POST" ? json({ deletion: live }) : json({ deletion: null }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<DataCard />);

    await userEvent.click(await screen.findByRole("button", { name: "Delete my account" }));
    expect(screen.getByText(/It goes in thirty days/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Delete it" }));

    const banner = await screen.findByText(/set to be deleted on/);
    expect(banner.textContent).toContain("March 31, 2026");
    expect(fetchMock).toHaveBeenCalledWith("/api/account/delete", { method: "POST" });
  });

  it("closes the question without deleting when told to keep it", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ deletion: null }));
    vi.stubGlobal("fetch", fetchMock);
    render(<DataCard />);

    await userEvent.click(await screen.findByRole("button", { name: "Delete my account" }));
    await userEvent.click(screen.getByRole("button", { name: "Keep it" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
  });

  it("keeps the account when asked to", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) =>
      Promise.resolve(
        init?.method === "DELETE" ? json({ cancelled: true }) : json({ deletion: live }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<DataCard />);

    await userEvent.click(await screen.findByRole("button", { name: "Keep my account" }));

    await waitFor(() => expect(screen.queryByText(/set to be deleted on/)).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("/api/account/delete", { method: "DELETE" });
  });

  it("says so when the delete request never reaches the server", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) =>
      init?.method === "POST" ? Promise.reject(new Error("offline")) : json({ deletion: null }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<DataCard />);

    await userEvent.click(await screen.findByRole("button", { name: "Delete my account" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete it" }));

    expect(await screen.findByText(/could not do that just now/, { exact: false })).toBeTruthy();
  });

  it("says so when keeping the account fails", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) =>
      Promise.resolve(init?.method === "DELETE" ? json({}, false, 500) : json({ deletion: live })),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<DataCard />);

    await userEvent.click(await screen.findByRole("button", { name: "Keep my account" }));

    expect(await screen.findByText(/could not do that just now/, { exact: false })).toBeTruthy();
    expect(screen.getByText(/set to be deleted on/)).toBeInTheDocument();
  });

  it("says so when keeping the account never reaches the server", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) =>
      init?.method === "DELETE" ? Promise.reject(new Error("offline")) : json({ deletion: live }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<DataCard />);

    await userEvent.click(await screen.findByRole("button", { name: "Keep my account" }));

    expect(await screen.findByText(/could not do that just now/, { exact: false })).toBeTruthy();
  });

  it("waits for the session before asking the server", async () => {
    session.status = "loading";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<DataCard />);

    expect(screen.getByRole("button", { name: "Download everything" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats a 401 as signed out even when the session says otherwise", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({}, false, 401)));
    render(<DataCard />);

    expect(await screen.findByText(/Sign in to include your account/)).toBeInTheDocument();
  });

  it("says so when the download never reaches the server", async () => {
    const fetchMock = vi.fn((url: string) =>
      url.startsWith("/api/account/export")
        ? Promise.reject(new Error("offline"))
        : Promise.resolve(json({ deletion: null })),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<DataCard />);

    await userEvent.click(await screen.findByRole("button", { name: "Download everything" }));

    expect(await screen.findByRole("status")).toHaveTextContent(/could not put that file together/);
  });

  it("says so when the account cannot be read", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({}, false, 500)));
    render(<DataCard />);

    expect(await screen.findByText(/could not read your account/)).toBeInTheDocument();
  });

  it("says so when the delete request fails", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) =>
      Promise.resolve(init?.method === "POST" ? json({}, false, 500) : json({ deletion: null })),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<DataCard />);

    await userEvent.click(await screen.findByRole("button", { name: "Delete my account" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete it" }));

    expect(await screen.findByText(/could not do that just now/, { exact: false })).toBeTruthy();
  });
});
