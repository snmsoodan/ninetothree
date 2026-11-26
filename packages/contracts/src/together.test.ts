import { describe, expect, it } from "vitest";

import {
  CreateJobRequest,
  Together,
  TogetherJob,
  TogetherSharedItem,
  TogetherWeek,
  UpdateJobRequest,
} from "./together";

const member = {
  userId: "u1",
  role: "parent" as const,
  email: "a@example.com",
  name: "A",
  isYou: true,
};

const job = {
  id: "j1",
  itemId: "car-seat",
  title: "Fit the car seat",
  packTitle: "Week 34",
  assignedTo: "u2",
  assignedBy: "u1",
  status: "open" as const,
  doneAt: null,
};

const together = {
  id: "h1",
  role: "parent" as const,
  members: [member],
  shared: [
    {
      itemId: "car-seat",
      title: "Fit the car seat",
      packTitle: "Week 34",
      stagePackId: "week-34",
      sharedBy: "u1",
      isYours: true,
    },
  ],
  jobs: [job],
  appointments: [
    {
      id: "a1",
      title: "Midwife",
      kind: "visit",
      dueAt: "2026-12-02T10:00:00.000Z",
      who: "You",
      location: "Clinic",
    },
  ],
  week: {
    id: "week-34",
    title: "Week 34",
    subtitle: "Packing the bag",
    body: "You are 34 weeks.",
    mind: "Sleep is broken.",
    help: [{ id: "bag", title: "Pack the hospital bag", type: "do" as const, minutes: 20 }],
  },
};

describe("Together", () => {
  it("reads the body /api/household/together actually sends", () => {
    expect(Together.parse(together)).toEqual(together);
  });

  it("has no field for a note, a mood or a private answer", () => {
    const keys = new Set(Object.keys(Together.shape));
    for (const forbidden of ["notes", "note", "mood", "answers", "progress", "journal"]) {
      expect(keys.has(forbidden)).toBe(false);
    }
  });

  it("allows no week, which is what a device that sent no stage gets", () => {
    expect(Together.parse({ ...together, week: null }).week).toBeNull();
  });

  it("allows an empty appointment date, because a date can be pencilled in", () => {
    const [appointment] = together.appointments;
    expect(
      Together.parse({
        ...together,
        appointments: [{ ...appointment, kind: null, dueAt: null, who: null, location: null }],
      }).appointments,
    ).toHaveLength(1);
  });

  it("refuses a job status the database cannot hold", () => {
    expect(TogetherJob.safeParse({ ...job, status: "nearly" }).success).toBe(false);
  });

  it("refuses a shared pin with no title, which is the one thing a partner reads", () => {
    const [shared] = together.shared;
    expect(TogetherSharedItem.safeParse({ ...shared, title: "" }).success).toBe(false);
  });

  it("refuses a help item that is neither an errand nor a booking", () => {
    const week = together.week!;
    expect(
      TogetherWeek.safeParse({ ...week, help: [{ ...week.help[0], type: "think" }] }).success,
    ).toBe(false);
  });
});

describe("CreateJobRequest", () => {
  it("accepts the ids the shared list already has", () => {
    expect(
      CreateJobRequest.parse({
        itemId: "car-seat",
        title: "Fit the car seat",
        packId: "week-34",
        packTitle: "Week 34",
        assignedTo: "u2",
      }).assignedTo,
    ).toBe("u2");
  });

  it("refuses a job with nobody to do it", () => {
    expect(CreateJobRequest.safeParse({ itemId: "x", title: "y", assignedTo: "" }).success).toBe(
      false,
    );
  });
});

describe("UpdateJobRequest", () => {
  it("carries the two moves a job has", () => {
    expect(UpdateJobRequest.parse({ status: "done" }).status).toBe("done");
    expect(UpdateJobRequest.safeParse({ status: "archived" }).success).toBe(false);
  });
});
