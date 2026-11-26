import {
  TOGETHER_CLEAR,
  TOGETHER_COMING_UP,
  TOGETHER_DONE_ACTION,
  TOGETHER_FAILED,
  TOGETHER_FAILED_BODY,
  TOGETHER_INVITE,
  TOGETHER_JOBS_HEADING,
  TOGETHER_LOADING,
  TOGETHER_NO_APPOINTMENTS,
  TOGETHER_NO_APPOINTMENTS_BODY,
  TOGETHER_NO_JOBS,
  TOGETHER_NO_JOBS_BODY,
  TOGETHER_NO_SHARED,
  TOGETHER_NO_SHARED_BODY,
  TOGETHER_NOT_NEEDED_ACTION,
  TOGETHER_PRIVACY,
  TOGETHER_SETTLED,
  TOGETHER_SHARED_HEADING,
  TOGETHER_SIGNED_OUT,
  TOGETHER_SIGNED_OUT_BODY,
  TOGETHER_SIGN_IN_ACTION,
  TOGETHER_WHO,
  appointmentDetail,
  handableHelp,
  togetherModel,
  type JobLine,
  type JobSections,
  type MemberLine,
  type SharedLine,
  type Together,
  type TogetherAppointment,
  type TogetherHelpItem,
} from "@ninetothree/domain";

/**
 * The shared page, as data.
 *
 * `togetherModel` already decides who is named, which work is open and which
 * is settled — the browser renders from exactly the same model. What is added
 * here is the four states a phone can be in (nothing yet, signed out, a failed
 * read, a household) and the sentences for each, because a phone that shows an
 * empty page while it is still asking looks broken.
 *
 * The one thing this file cannot decide is how a date reads: `formatDay` comes
 * in from the container, so the week is formatted in the device's own zone and
 * locale rather than in the server's.
 */

export type TogetherState = "loading" | "signed-out" | "failed" | "ready";

export const TOGETHER_HEADING = "Together";
export const TOGETHER_INTRO =
  "What this week asks of the people around you, and the things you have chosen to share.";
export const TOGETHER_HELP_HEADING = "How to help this week";
export const TOGETHER_HELP_NO_WEEK = "There is no week to show yet.";
export const TOGETHER_HELP_NO_WEEK_BODY =
  "Once the person you are with has set their dates, this fills in with what the week actually asks of them.";
export const TOGETHER_HELP_TAKE = "What you can take off their plate";
export const TOGETHER_HELP_NOTHING = "Nothing on the list this week. Being there is the whole job.";
export const TOGETHER_INVITE_BODY =
  "The link is shown once. We keep only a hash of it, so copy it now — we cannot send it again.";
export const TOGETHER_INVITE_SHARE = "Share the link";

const VERB: Record<TogetherHelpItem["type"], string> = {
  do: "Do",
  book: "Book",
  buy: "Pick up",
};

export interface HelpLine {
  id: string;
  /** "Do. Buy the car seat" — the verb first, so a scan of the list reads as work. */
  line: string;
  minutes: string | null;
  /** The button's label; absent when there is nobody to hand it to. */
  assignLabel: string | null;
}

export interface TogetherWeekView {
  heading: string;
  title: string;
  body: string | null;
  mind: string | null;
  takeHeading: string;
  items: HelpLine[];
  nothing: string | null;
}

export interface TogetherJobLine extends JobLine {
  status: "open" | "done" | "dropped";
  /** "Done" / "Not needed" — omitted for open work, which is not a verdict. */
  verdict: string | null;
  doneAction: string;
  notNeededAction: string;
  clear: string;
}

export interface TogetherSection {
  heading: string;
  open: TogetherJobLine[];
  finished: TogetherJobLine[];
  empty: string | null;
  emptyBody: string | null;
  hasJobs: boolean;
}

export interface AppointmentLine {
  id: string;
  title: string;
  detail: string;
}

export interface TogetherView {
  state: TogetherState;
  heading: string;
  intro: string;
  /** Set for loading, a failed read and a signed-out device. */
  line: string | null;
  body: string | null;
  action: string | null;
  help: TogetherWeekView | null;
  jobs: TogetherSection;
  shared: { heading: string; lines: SharedLine[]; empty: string | null; emptyBody: string | null };
  comingUp: {
    heading: string;
    lines: AppointmentLine[];
    empty: string | null;
    emptyBody: string | null;
  };
  who: { heading: string; lines: MemberLine[]; privacy: string; invite: string };
  invite: { body: string; action: string };
}

const NOTHING: Omit<TogetherView, "state" | "line" | "body" | "action"> = {
  heading: TOGETHER_HEADING,
  intro: TOGETHER_INTRO,
  help: null,
  jobs: {
    heading: TOGETHER_JOBS_HEADING,
    open: [],
    finished: [],
    empty: null,
    emptyBody: null,
    hasJobs: false,
  },
  shared: { heading: TOGETHER_SHARED_HEADING, lines: [], empty: null, emptyBody: null },
  comingUp: { heading: TOGETHER_COMING_UP, lines: [], empty: null, emptyBody: null },
  who: { heading: TOGETHER_WHO, lines: [], privacy: TOGETHER_PRIVACY, invite: TOGETHER_INVITE },
  invite: { body: TOGETHER_INVITE_BODY, action: TOGETHER_INVITE_SHARE },
};

/** The three states that have no household behind them. */
export function togetherNotice(state: Exclude<TogetherState, "ready">): TogetherView {
  switch (state) {
    case "loading":
      return { ...NOTHING, state, line: TOGETHER_LOADING, body: null, action: null };
    case "signed-out":
      return {
        ...NOTHING,
        state,
        line: TOGETHER_SIGNED_OUT,
        body: TOGETHER_SIGNED_OUT_BODY,
        action: TOGETHER_SIGN_IN_ACTION,
      };
    case "failed":
      return { ...NOTHING, state, line: TOGETHER_FAILED, body: TOGETHER_FAILED_BODY, action: null };
  }
}

function helpView(data: Together, other: string | undefined): TogetherWeekView {
  const week = data.week;
  if (!week) {
    // No week yet is not an empty list, it is a household whose dates are not
    // set — so the section keeps its heading and says that, as the browser does.
    return {
      heading: TOGETHER_HELP_HEADING,
      title: TOGETHER_HELP_NO_WEEK,
      body: TOGETHER_HELP_NO_WEEK_BODY,
      mind: null,
      takeHeading: TOGETHER_HELP_TAKE,
      items: [],
      nothing: null,
    };
  }

  const items = handableHelp(week.help).map((item) => ({
    id: item.id,
    line: `${VERB[item.type as TogetherHelpItem["type"]] ?? "Do"}. ${item.title}`,
    minutes: item.minutes ? `About ${item.minutes} minutes.` : null,
    assignLabel: other ? `Ask ${other} to do this` : null,
  }));

  return {
    heading: TOGETHER_HELP_HEADING,
    title: week.title,
    body: week.body,
    mind: week.mind,
    takeHeading: TOGETHER_HELP_TAKE,
    items,
    nothing: items.length === 0 ? TOGETHER_HELP_NOTHING : null,
  };
}

/**
 * The household, or a state that says why there is none.
 *
 * `formatDay` is a parameter rather than a call to `Intl` in here so a test can
 * pin the line without depending on the machine's locale, and so the phone can
 * pass the same formatter the rest of the app uses.
 */
export function togetherView(input: {
  state: TogetherState;
  data?: Together | null;
  formatDay: (iso: string) => string;
}): TogetherView {
  const { state, data, formatDay } = input;
  if (state !== "ready" || !data) return togetherNotice(state === "ready" ? "loading" : state);

  const model = togetherModel(data);
  const byId = new Map(data.jobs.map((job) => [job.id, job]));

  const job = (line: JobLine): TogetherJobLine => {
    const status = byId.get(line.id)?.status ?? "open";
    return {
      ...line,
      status,
      verdict:
        status === "open"
          ? null
          : status === "done"
            ? TOGETHER_DONE_ACTION
            : TOGETHER_NOT_NEEDED_ACTION,
      doneAction: TOGETHER_DONE_ACTION,
      notNeededAction: TOGETHER_NOT_NEEDED_ACTION,
      clear: TOGETHER_CLEAR,
    };
  };

  const open = model.jobs.open.map(job);
  const finished = model.jobs.finished.map(job);

  return {
    ...NOTHING,
    state,
    line: null,
    body: null,
    action: null,
    help: helpView(data, model.otherName),
    jobs: {
      heading: TOGETHER_JOBS_HEADING,
      open,
      finished,
      empty: open.length === 0 ? TOGETHER_NO_JOBS : null,
      emptyBody: open.length === 0 ? TOGETHER_NO_JOBS_BODY : null,
      hasJobs: model.hasJobs,
    },
    shared: {
      heading: TOGETHER_SHARED_HEADING,
      lines: model.shared,
      empty: model.shared.length === 0 ? TOGETHER_NO_SHARED : null,
      emptyBody: model.shared.length === 0 ? TOGETHER_NO_SHARED_BODY : null,
    },
    comingUp: {
      heading: TOGETHER_COMING_UP,
      lines: model.upcoming.map((appointment: TogetherAppointment & { dueAt: string }) => ({
        id: appointment.id,
        title: appointment.title,
        detail: appointmentDetail(appointment, formatDay(appointment.dueAt)),
      })),
      empty: model.upcoming.length === 0 ? TOGETHER_NO_APPOINTMENTS : null,
      emptyBody: model.upcoming.length === 0 ? TOGETHER_NO_APPOINTMENTS_BODY : null,
    },
    who: {
      heading: TOGETHER_WHO,
      lines: model.members,
      privacy: TOGETHER_PRIVACY,
      invite: TOGETHER_INVITE,
    },
  };
}

/** The "settled" line above the folded finished work. */
export const TOGETHER_SETTLED_HEADING = TOGETHER_SETTLED;

export type { JobSections, SharedLine, MemberLine, Together };
