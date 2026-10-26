import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { JobList, type Job } from "./JobList";

const names = { u1: "Maya", u2: "Sam" };

function job(overrides: Partial<Job> = {}): Job {
  return {
    id: "j1",
    itemId: "pregnancy-w28-glucose-test",
    title: "Book the glucose test",
    packTitle: "Week 28",
    assignedTo: "u2",
    assignedBy: "u1",
    status: "open",
    doneAt: null,
    ...overrides,
  };
}

describe("JobList", () => {
  it("says nothing has been handed over yet", () => {
    render(<JobList jobs={[]} youId="u1" names={names} />);
    expect(screen.getByText("Nothing handed over yet.")).toBeInTheDocument();
  });

  it("names the person a job is for", () => {
    render(<JobList jobs={[job()]} youId="u1" names={names} />);
    expect(screen.getByText(/For Sam/)).toBeInTheDocument();
  });

  it("says For you when the job is yours", () => {
    render(<JobList jobs={[job({ assignedTo: "u1" })]} youId="u1" names={names} />);
    expect(screen.getByText(/For you/)).toBeInTheDocument();
  });

  it("falls back to someone when the name is missing", () => {
    render(<JobList jobs={[job({ assignedTo: "u9" })]} youId="u1" names={names} />);
    expect(screen.getByText(/For someone/)).toBeInTheDocument();
  });

  it("shows the week a job came from", () => {
    render(<JobList jobs={[job()]} youId="u1" names={names} />);
    expect(screen.getByText(/Week 28/)).toBeInTheDocument();
  });

  it("shows a job with no week behind it", () => {
    render(<JobList jobs={[job({ packTitle: null })]} youId="u1" names={names} />);
    expect(screen.getByText(/For Sam/).textContent).toBe("For Sam");
  });

  it("marks a job done", async () => {
    const onStatus = vi.fn();
    render(<JobList jobs={[job()]} youId="u1" names={names} onStatus={onStatus} />);
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onStatus).toHaveBeenCalledWith("j1", "done");
  });

  it("drops a job that is not needed", async () => {
    const onStatus = vi.fn();
    render(<JobList jobs={[job()]} youId="u1" names={names} onStatus={onStatus} />);
    await userEvent.click(screen.getByRole("button", { name: "Not needed" }));
    expect(onStatus).toHaveBeenCalledWith("j1", "dropped");
  });

  it("puts finished jobs under Settled", () => {
    render(
      <JobList
        jobs={[job({ status: "done", doneAt: "2026-10-20T10:00:00Z" })]}
        youId="u1"
        names={names}
      />,
    );
    expect(screen.getByText("Settled")).toBeInTheDocument();
    expect(screen.getByText(/Done · For Sam/)).toBeInTheDocument();
  });

  it("says Not needed for a dropped job", () => {
    render(<JobList jobs={[job({ status: "dropped" })]} youId="u1" names={names} />);
    expect(screen.getByText(/Not needed · For Sam/)).toBeInTheDocument();
  });

  it("clears a settled job", async () => {
    const onRemove = vi.fn();
    render(
      <JobList
        jobs={[job({ status: "done", doneAt: "2026-10-20T10:00:00Z" })]}
        youId="u1"
        names={names}
        onRemove={onRemove}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onRemove).toHaveBeenCalledWith("j1");
  });

  it("shows no buttons when there is nothing to do with them", () => {
    render(<JobList jobs={[job()]} youId="u1" names={names} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
