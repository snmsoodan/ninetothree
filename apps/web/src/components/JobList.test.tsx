import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TogetherJob } from "@ninetothree/contracts";
import { jobSections } from "@ninetothree/domain";
import { describe, expect, it, vi } from "vitest";

import { JobList } from "./JobList";

const names = { u1: "Maya", u2: "Sam" };

function job(overrides: Partial<TogetherJob> = {}): TogetherJob {
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

function list(
  jobs: TogetherJob[],
  props: { onStatus?: () => void; onRemove?: (id: string) => void } = {},
) {
  return (
    <JobList
      sections={jobSections(jobs, "u1", names)}
      hasJobs={jobs.length > 0}
      onStatus={props.onStatus ? () => undefined : undefined}
      onRemove={props.onRemove}
    />
  );
}

describe("JobList", () => {
  it("says nothing has been handed over yet", () => {
    render(list([]));
    expect(screen.getByText("Nothing handed over yet.")).toBeInTheDocument();
  });

  it("names the person a job is for", () => {
    render(list([job()]));
    expect(screen.getByText(/For Sam/)).toBeInTheDocument();
  });

  it("says For you when the job is yours", () => {
    render(list([job({ assignedTo: "u1" })]));
    expect(screen.getByText(/For you/)).toBeInTheDocument();
  });

  it("falls back to someone when the name is missing", () => {
    render(list([job({ assignedTo: "u9" })]));
    expect(screen.getByText(/For someone/)).toBeInTheDocument();
  });

  it("shows the week a job came from", () => {
    render(list([job()]));
    expect(screen.getByText(/Week 28/)).toBeInTheDocument();
  });

  it("shows a job with no week behind it", () => {
    render(list([job({ packTitle: null })]));
    expect(screen.getByText(/For Sam/).textContent).toBe("For Sam");
  });

  it("marks a job done", async () => {
    const onStatus = vi.fn();
    render(<JobList sections={jobSections([job()], "u1", names)} hasJobs onStatus={onStatus} />);
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onStatus).toHaveBeenCalledWith("j1", "done");
  });

  it("drops a job that is not needed", async () => {
    const onStatus = vi.fn();
    render(<JobList sections={jobSections([job()], "u1", names)} hasJobs onStatus={onStatus} />);
    await userEvent.click(screen.getByRole("button", { name: "Not needed" }));
    expect(onStatus).toHaveBeenCalledWith("j1", "dropped");
  });

  it("puts finished jobs under Settled", () => {
    render(list([job({ status: "done", doneAt: "2026-10-20T10:00:00Z" })]));
    expect(screen.getByText("Settled")).toBeInTheDocument();
    expect(screen.getByText(/Done · For Sam/)).toBeInTheDocument();
  });

  it("says Not needed for a dropped job", () => {
    render(list([job({ status: "dropped" })]));
    expect(screen.getByText(/Not needed · For Sam/)).toBeInTheDocument();
  });

  it("clears a settled job", async () => {
    const onRemove = vi.fn();
    render(list([job({ status: "done", doneAt: "2026-10-20T10:00:00Z" })], { onRemove }));
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onRemove).toHaveBeenCalledWith("j1");
  });

  it("shows no buttons when there is nothing to do with them", () => {
    render(list([job()]));
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
