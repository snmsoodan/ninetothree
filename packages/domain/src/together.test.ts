import { describe, expect, it } from "vitest";

import {
  appointmentDetail,
  handableHelp,
  jobSections,
  memberLines,
  memberName,
  otherName,
  sharedLines,
  togetherModel,
  upcoming,
} from "./together";

const you = {
  userId: "u1",
  role: "parent" as const,
  email: "you@example.com",
  name: "Sam",
  isYou: true,
};
const partner = {
  userId: "u2",
  role: "partner" as const,
  email: "them@example.com",
  name: null,
  isYou: false,
};
const grandparent = { ...partner, userId: "u3", email: "nan@example.com" };

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

describe("naming people", () => {
  it("uses the name, and falls back to the address when there is none", () => {
    expect(memberName(you)).toBe("Sam");
    expect(memberName(partner)).toBe("them@example.com");
    expect(memberName({ ...partner, name: "   " })).toBe("them@example.com");
  });

  it("names the other person only when there is exactly one of them", () => {
    expect(otherName([you, partner])).toBe("them@example.com");
    expect(otherName([you])).toBeUndefined();
    expect(otherName([you, partner, grandparent])).toBeUndefined();
  });

  it("shows your own address only when you also gave a name", () => {
    const [mine, theirs] = memberLines([you, partner]);
    expect(mine).toEqual({ userId: "u1", label: "You", role: "parent", email: "you@example.com" });
    expect(theirs!.email).toBeNull();
  });

  it("labels a nameless you by address, not by the word You, when that is all there is", () => {
    const [mine] = memberLines([{ ...you, name: null }]);
    expect(mine!.label).toBe("You");
    expect(mine!.email).toBeNull();
  });
});

describe("jobs", () => {
  it("says For you rather than a name when the work is yours", () => {
    const { open } = jobSections([job], "u2", { u1: "Sam", u2: "them@example.com" });
    expect(open[0]!.detail).toBe("For you · Week 34");
  });

  it("names the person the work is for, and someone when they are unknown", () => {
    expect(jobSections([job], "u1", { u2: "Robin" }).open[0]!.detail).toBe("For Robin · Week 34");
    expect(jobSections([job], "u1", {}).open[0]!.detail).toBe("For someone · Week 34");
  });

  it("drops the week when the job has none", () => {
    expect(jobSections([{ ...job, packTitle: null }], "u1", { u2: "Robin" }).open[0]!.detail).toBe(
      "For Robin",
    );
  });

  it("folds finished work below open work, saying Done once", () => {
    const sections = jobSections(
      [job, { ...job, id: "j2", status: "done", doneAt: "2026-02-01T00:00:00.000Z" }],
      "u1",
      { u2: "Robin" },
    );
    expect(sections.open.map((line) => line.id)).toEqual(["j1"]);
    expect(sections.finished[0]!.detail).toBe("Done · For Robin");
  });

  it("calls a dropped job Not needed rather than done", () => {
    const sections = jobSections([{ ...job, status: "dropped" }], "u1", { u2: "Robin" });
    expect(sections.finished[0]!.detail).toBe("Not needed · For Robin");
  });
});

describe("shared pins", () => {
  const item = {
    itemId: "car-seat",
    title: "Fit the car seat",
    packTitle: "Week 34",
    stagePackId: "week-34",
    sharedBy: "u1",
    isYours: true,
  };

  it("says a pin of yours is yours, and never repeats a note", () => {
    expect(sharedLines([item], "Robin")[0]!.detail).toBe("Week 34 · shared by you");
  });

  it("credits the other person when there is one", () => {
    expect(sharedLines([{ ...item, isYours: false }], "Robin")[0]!.detail).toBe(
      "Week 34 · from Robin",
    );
  });

  it("does not guess whose a pin is when the household has two others", () => {
    expect(sharedLines([{ ...item, isYours: false }], undefined)[0]!.detail).toBe("Week 34");
  });

  it("calls an unpinned pack Pinned", () => {
    expect(sharedLines([{ ...item, packTitle: null, isYours: true }], undefined)[0]!.detail).toBe(
      "Pinned · shared by you",
    );
  });
});

describe("appointments", () => {
  const soon = {
    id: "a",
    title: "Midwife",
    kind: "visit",
    dueAt: "2026-03-02T10:00:00.000Z",
    who: null,
    location: null,
  };
  const later = { ...soon, id: "b", dueAt: "2026-04-02T10:00:00.000Z" };
  const pencilled = { ...soon, id: "c", dueAt: null };

  it("keeps only the ones with a date, soonest first", () => {
    expect(upcoming([later, pencilled, soon]).map((a) => a.id)).toEqual(["a", "b"]);
  });

  it("joins the day, the person and the place, skipping what is missing", () => {
    expect(appointmentDetail(soon, "Mon, Mar 2")).toBe("Mon, Mar 2");
    expect(appointmentDetail({ ...soon, who: "You", location: "Clinic" }, "Mon, Mar 2")).toBe(
      "Mon, Mar 2 · You · Clinic",
    );
  });
});

describe("togetherModel", () => {
  const data = {
    id: "h1",
    role: "parent" as const,
    members: [you, partner],
    shared: [],
    jobs: [job],
    appointments: [
      {
        id: "a",
        title: "Midwife",
        kind: null,
        dueAt: "2026-03-02T10:00:00.000Z",
        who: null,
        location: null,
      },
    ],
    week: null,
  };

  it("finds you, and hands work to the one other person", () => {
    const model = togetherModel(data);
    expect(model.youId).toBe("u1");
    expect(model.canAssign).toBe(true);
    expect(model.otherName).toBe("them@example.com");
  });

  it("offers nobody to hand work to in a household of one", () => {
    const model = togetherModel({ ...data, members: [you] });
    expect(model.canAssign).toBe(false);
    expect(model.otherName).toBeUndefined();
  });
});

describe("handableHelp", () => {
  it("hands over errands, bookings and purchases, but not reading", () => {
    const help = [
      { id: "a", title: "Read this", type: "read" as const, minutes: null },
      { id: "b", title: "Book the scan", type: "book" as const, minutes: 10 },
      { id: "c", title: "Buy the car seat", type: "buy" as const, minutes: null },
      { id: "d", title: "Pack the bag", type: "do" as const, minutes: 20 },
    ];
    expect(handableHelp(help).map((item) => item.id)).toEqual(["b", "c", "d"]);
  });
});
