import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExportButtons } from "./ExportButtons";
import { buildHistory } from "@/lib/history";
import { EMPTY_STATE, type AppState } from "@/lib/store";

const state: AppState = {
  ...EMPTY_STATE,
  onboarded: true,
  progress: {
    "t-glucose": { status: "done", at: "2026-10-01T10:00:00.000Z", title: "Glucose" },
  },
};

const history = buildHistory(state, {}, []);

let downloaded: { name: string; body: string; type: string }[] = [];

beforeEach(() => {
  downloaded = [];
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: (blob: Blob) => {
      downloaded.push({ name: "", body: "", type: blob.type });
      return "blob:test";
    },
    revokeObjectURL: () => {},
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    const last = downloaded[downloaded.length - 1];
    if (last) last.name = this.download;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ExportButtons", () => {
  it("offers both formats by name, with no menu in between", () => {
    render(<ExportButtons state={state} history={history} />);
    expect(screen.getByRole("button", { name: "Download JSON" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download CSV" })).toBeInTheDocument();
  });

  it("downloads a dated JSON file", async () => {
    render(<ExportButtons state={state} history={history} today="2026-10-20" />);
    await userEvent.click(screen.getByRole("button", { name: "Download JSON" }));
    expect(downloaded[0]?.name).toBe("ninetothree-history-2026-10-20.json");
    expect(downloaded[0]?.type).toBe("application/json");
  });

  it("downloads a dated CSV file", async () => {
    render(<ExportButtons state={state} history={history} today="2026-10-20" />);
    await userEvent.click(screen.getByRole("button", { name: "Download CSV" }));
    expect(downloaded[0]?.name).toBe("ninetothree-history-2026-10-20.csv");
    expect(downloaded[0]?.type).toBe("text/csv");
  });

  it("dates the file from today when no date is given", async () => {
    render(<ExportButtons state={state} history={history} />);
    await userEvent.click(screen.getByRole("button", { name: "Download JSON" }));
    expect(downloaded[0]?.name).toMatch(/^ninetothree-history-\d{4}-\d{2}-\d{2}\.json$/);
  });
});
