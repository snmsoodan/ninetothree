import {
  ESCALATION_COPY,
  articleHref,
  articlesForAction,
  lensFor,
  type Action,
  type Article,
  type Source,
  type StagePack,
} from "@ninetothree/content";
import {
  STEP_PRIORITY_LABEL,
  STEPS_SUBTITLE,
  catchUpToggle,
  chosenOption,
  hiddenNotice,
  isDone,
  isPinned,
  isSkipped,
  isSnoozed,
  minutesLabel,
  setAsideNotice,
  stepStatusLabel,
  stepsHeading,
  weekProgress,
  type AppState,
  type WeekProgress,
} from "@ninetothree/domain";
import { catchUpCandidates, pickCatchUp, personalizePack } from "@ninetothree/rules";

/**
 * The week, as data.
 *
 * `WeekView` is 288 lines of React and the phone cannot render it, so what the
 * page actually says is spelled out here instead: every heading, every line,
 * every label, and the state of every step. The screen is then mechanical, and
 * a test can assert on the strings a parent reads without a simulator.
 *
 * The sentences come from `@ninetothree/domain`, the same module the web page
 * reads, so "3 steps set aside" cannot say something different here. What is
 * local is only the order of the blocks and the shape of each one.
 */

/** One option under a step, reduced to the four lines it shows. */
export interface WeekOption {
  id: string;
  label: string;
  url: string | null;
  detail: string | null;
  cost: string | null;
  note: string | null;
}

export type StepStatus = "open" | "done" | "skipped";

/** A step, drawn. The same shape serves the parent's week and a persona lens. */
export interface WeekStep {
  id: string;
  title: string;
  why: string;
  /** "Do this one", or nothing for the other three priorities. */
  priorityLabel: string | null;
  /** "About 5 minutes", or nothing. */
  minutesLine: string | null;
  detail: string | null;
  skipIfLine: string | null;
  options: WeekOption[];
  status: StepStatus;
  statusLabel: string | null;
  pinned: boolean;
  snoozed: boolean;
  /** The option this parent already picked, if the step has a chooser. */
  chosenLabel: string | null;
  /** Where "Help me choose" opens, when the step has one. Only ever external. */
  chooserUrl: string | null;
  /** The long read, as an in-app route and the words that link to it. */
  readMore: { href: string; title: string } | null;
  /** Snapshots written into progress and pins. Same four fields on both clients. */
  packId: string;
  packTitle: string;
}

export interface WeekLens {
  /** "Week 28" or "The first year" — empty for an authored view. */
  bandLabel: string | null;
  headline: string;
  body: string;
  /** Authored steps: real and checkable. Empty on a track. */
  actions: WeekStep[];
  suggestions: { id: string; title: string; why: string; minutesLabel: string | null }[];
  light: string | null;
}

export interface CatchUpRow {
  actionId: string;
  stageLabel: string;
  title: string;
  why: string;
  packId: string;
  packTitle: string;
}

export interface AppointmentRow {
  id: string;
  label: string;
  window: string;
  who: string | null;
  note: string | null;
}

export interface RedFlagRow {
  id: string;
  text: string;
  /** "Call 911" — always shown, even when there is no number to dial. */
  callLabel: string;
  /** The number, when the escalation has one. */
  phone: string | null;
  /** A `tel:`/`sms:` link on the web; on the phone the number is dialled. */
  href: string | null;
}

export interface WeekModel {
  status: "ok" | "quiet";
  /** Only after a loss. The page says why it is empty, and where to go instead. */
  quiet: {
    heading: string;
    lines: string[];
    primary: string;
    secondary: string;
  } | null;
  packId: string;
  /** "Week 28". The stage this page is about. */
  stageLabel: string;
  /** `pack.subtitle ?? pack.title`, the page's one `h1`. */
  heading: string;
  backLabel: string;

  /** Parent only. Non-parents get the lens instead. */
  progress: { percent: number; line: string; label: string } | null;
  /** Parent only, and only when the pack has something to say. */
  body: {
    babyHeading: string;
    babySize: string | null;
    babyDevelopment: string | null;
    youHeading: string;
    youBody: string | null;
    youMind: string | null;
  } | null;

  stepsHeading: string | null;
  stepsSubtitle: string | null;
  steps: WeekStep[];
  /** The line and the way back for snoozed steps. */
  setAside: { line: string; action: string; count: number } | null;
  hidden: { line: string; action: string; count: number } | null;
  /** The parent's light line. The lens carries its own for a persona. */
  light: string | null;
  lens: WeekLens | null;

  completion: {
    finished: boolean;
    heading: string;
    line: string;
    lookAheadLabel: string;
    dashboardLabel: string;
    reopenLabel: string;
    doneLabel: string;
    confirmTitle: string;
    confirmBody: string;
    confirmCancel: string;
    confirmLabel: string;
  } | null;

  catchUp: {
    heading: string;
    line: string;
    toggle: string;
    items: CatchUpRow[];
  } | null;

  alsoKnow: { heading: string; items: { id: string; title: string; body: string }[] };
  appointments: { heading: string; items: AppointmentRow[] };
  redFlags: {
    heading: string;
    items: RedFlagRow[];
    closing: string;
  };
  sources: {
    heading: string;
    items: { id: string; title: string; detail: string; url: string }[];
    reviewed: string;
  };
  nav: { lastLabel: string; nextLabel: string; previousId: string | null; nextId: string | null };
}

export interface WeekInput {
  /** The pack for this page, or `undefined` when the id is not a stage. */
  pack: StagePack | undefined;
  state: AppState;
  /** ISO date, YYYY-MM-DD. The parent's local day, not UTC. */
  today: string;
  /** Every stage, for the catch-up window. */
  packs: readonly StagePack[];
  /** Every long read, so a step can link to the one that explains it. */
  articles: readonly Article[];
}

const KIND_LABEL: Record<Source["kind"], string> = {
  clinical: "Clinical",
  government: "Government",
  charity: "Charity",
  editorial: "Editorial",
  vendor: "Vendor",
};

/** The web's chooser lives at its own route; the phone has none yet, so it opens there. */
const CHOOSER_HOST = "https://ninetothree.com";

function toStep(
  action: Action,
  input: { state: AppState; today: string; pack: StagePack; articles: readonly Article[] },
): WeekStep {
  const { state, today, pack, articles } = input;
  const done = isDone(state, action.id);
  const skipped = isSkipped(state, action.id);
  const snoozed = isSnoozed(state, action.id, today);
  const status: StepStatus = done ? "done" : skipped ? "skipped" : "open";
  const choice = chosenOption(state, action.id);
  const [article] = articlesForAction([...articles], action.id);

  return {
    id: action.id,
    title: action.title,
    why: action.why,
    priorityLabel: STEP_PRIORITY_LABEL[action.priority],
    minutesLine: minutesLabel(action.minutes),
    detail: action.detail ?? null,
    skipIfLine: action.skipIf ? `Skip this if: ${action.skipIf}` : null,
    options: action.options.map((option) => ({
      id: option.id,
      label: option.label,
      url: option.url ?? null,
      detail: option.detail ?? null,
      cost: option.cost ?? null,
      note: option.note ?? null,
    })),
    status,
    statusLabel: stepStatusLabel(status, snoozed),
    pinned: isPinned(state, action.id),
    snoozed,
    chosenLabel: choice?.label ?? null,
    chooserUrl: action.chooser ? `${CHOOSER_HOST}/choose/${action.id}` : null,
    readMore: article ? { href: articleHref(article), title: article.title } : null,
    packId: pack.id,
    packTitle: pack.title,
  };
}

function emptyWeek(pack: StagePack): WeekModel {
  return {
    status: "quiet",
    quiet: {
      heading: "The weekly guide is paused.",
      lines: [
        "You told us about a loss. We have stopped showing the week, and we have stopped sending the weekly email.",
        "Nothing you wrote down has been deleted. The safety page is still here, and so is everything you pinned.",
      ],
      primary: "Open the safety page",
      secondary: "Change this in settings",
    },
    packId: pack.id,
    stageLabel: pack.title,
    heading: pack.subtitle ?? pack.title,
    backLabel: "Back to this week",
    progress: null,
    body: null,
    stepsHeading: null,
    stepsSubtitle: null,
    steps: [],
    setAside: null,
    hidden: null,
    light: null,
    lens: null,
    completion: null,
    catchUp: null,
    alsoKnow: { heading: "", items: [] },
    appointments: { heading: "", items: [] },
    redFlags: { heading: "", items: [], closing: "" },
    sources: { heading: "", items: [], reviewed: "" },
    nav: { lastLabel: "", nextLabel: "", previousId: null, nextId: null },
  };
}

/**
 * Build the page.
 *
 * Order is the web's order, because a parent who has read a week on a laptop
 * and opens it on a phone should not have to find the flags twice: heading,
 * progress, the baby and you, the steps, the ending, catch-up, also worth
 * knowing, appointments, the flags, the sources, the two neighbours.
 */
export function weekModel(input: WeekInput): WeekModel {
  const { pack, state, today, packs, articles } = input;
  if (!pack) return emptyWeek({ id: "", title: "" } as StagePack);

  const { pack: personalized, hidden, quiet } = personalizePack(pack, state.profile);
  if (quiet) return emptyWeek(pack);

  const progress: WeekProgress = weekProgress(
    { id: personalized.id, coreActionIds: personalized.coreActions.map((a) => a.id) },
    state,
  );

  const drawn = { state, today, pack, articles };
  const visible = personalized.coreActions.filter((action) => !isSnoozed(state, action.id, today));
  const setAsideActions = personalized.coreActions.filter((action) =>
    isSnoozed(state, action.id, today),
  );

  const doneEverywhere = Object.entries(state.progress)
    .filter(([, entry]) => entry.status === "done")
    .map(([id]) => id);
  const catchUp = pickCatchUp(catchUpCandidates(packs, pack).candidates, doneEverywhere);

  const lens = lensFor(pack, state.persona, { enabled: state.humour });
  const isParent = state.persona === "parent";

  const next = packs.find((candidate) => candidate.id === nextOf(packs, pack));
  const previous = packs.find((candidate) => candidate.id === previousOf(packs, pack));

  return {
    status: "ok",
    quiet: null,
    packId: pack.id,
    stageLabel: pack.title,
    heading: pack.subtitle ?? pack.title,
    backLabel: "Back to this week",

    progress: isParent
      ? {
          percent: progress.percent,
          label: `${progress.settled} of ${progress.total} steps done or skipped`,
          line: `${progress.settled} of ${progress.total}`,
        }
      : null,

    body:
      isParent && (pack.baby || pack.you)
        ? {
            babyHeading: "The baby",
            babySize: pack.baby?.size ?? null,
            babyDevelopment: pack.baby?.development ?? null,
            youHeading: "You",
            youBody: pack.you?.body ?? null,
            youMind: pack.you?.mind ?? null,
          }
        : null,

    stepsHeading: isParent ? stepsHeading(visible.length) : null,
    stepsSubtitle: isParent ? STEPS_SUBTITLE : null,
    steps: isParent ? visible.map((action) => toStep(action, drawn)) : [],
    setAside:
      isParent && setAsideActions.length > 0
        ? {
            ...setAsideNotice(setAsideActions.length),
            count: setAsideActions.length,
          }
        : null,
    hidden:
      isParent && hidden.length > 0
        ? { line: hiddenNotice(hidden.length), action: "Change that", count: hidden.length }
        : null,
    light: isParent ? lens.light : null,
    lens: isParent
      ? null
      : {
          bandLabel: lens.source === "track" ? lens.bandLabel : null,
          headline: lens.headline,
          body: lens.body,
          actions: lens.actions.map((action) => toStep(action, drawn)),
          suggestions: lens.suggestions.map((suggestion) => ({
            id: suggestion.id,
            title: suggestion.title,
            why: suggestion.why,
            minutesLabel: suggestion.minutes ? `${suggestion.minutes} min` : null,
          })),
          light: lens.light,
        },

    completion: isParent
      ? {
          finished: progress.finished,
          heading: "That’s this week.",
          line: "Nothing else to do until Monday.",
          lookAheadLabel: "Look ahead",
          dashboardLabel: "Go to dashboard",
          reopenLabel: "Reopen this week",
          doneLabel: "I’m done with this week",
          confirmTitle: "Mark this week done?",
          confirmBody:
            "Some steps are still open. Nothing expires — they will be here if you come back.",
          confirmCancel: "Not yet",
          confirmLabel: "Mark it done",
        }
      : null,

    catchUp:
      isParent && catchUp.items.length > 0
        ? {
            heading: "Before this week",
            line: `You are on ${pack.title}. The last few weeks are still here if you want them — nothing expires.`,
            toggle: catchUpToggle(catchUp.items.length, false),
            items: catchUp.items.map((item) => ({
              actionId: item.actionId,
              stageLabel: item.stageLabel,
              title: item.title,
              why: item.why,
              packId: item.packId,
              packTitle: item.packTitle,
            })),
          }
        : null,

    alsoKnow: {
      heading: "Also worth knowing",
      items: pack.alsoKnow.map((item) => ({ id: item.id, title: item.title, body: item.body })),
    },

    appointments: {
      heading: "Appointments",
      items: pack.appointments.map((appointment) => ({
        id: appointment.id,
        label: appointment.label,
        window:
          appointment.from === appointment.to
            ? `${appointment.from}`
            : `${appointment.from}–${appointment.to}`,
        who: appointment.who ?? null,
        note: appointment.note ?? null,
      })),
    },

    redFlags: {
      heading: "Call now if",
      items: pack.redFlags.map((flag) => {
        const copy = ESCALATION_COPY[flag.escalation];
        const phone = flag.phone ?? copy.phone ?? null;
        return {
          id: flag.id,
          text: flag.text,
          callLabel: copy.label,
          phone,
          href: copy.href ?? null,
        };
      }),
      closing:
        "If you are not sure whether it is serious, call. You will not be wasting anyone’s time.",
    },

    sources: {
      heading: "Where this comes from",
      items: pack.sources.map((source) => ({
        id: source.id,
        title: source.title,
        detail: `${source.publisher}, ${KIND_LABEL[source.kind]}`,
        url: source.url,
      })),
      reviewed: `Reviewed by ${pack.reviewedBy} · ${pack.reviewedAt}`,
    },

    nav: {
      lastLabel: "← Last one",
      nextLabel: "Next →",
      previousId: previous?.id ?? null,
      nextId: next?.id ?? null,
    },
  };
}

function nextOf(packs: readonly StagePack[], pack: StagePack): string | null {
  const sameKind = packs.filter((candidate) => candidate.kind === pack.kind);
  const at = sameKind.findIndex((candidate) => candidate.id === pack.id);
  return at === -1 ? null : (sameKind[at + 1]?.id ?? null);
}

function previousOf(packs: readonly StagePack[], pack: StagePack): string | null {
  const sameKind = packs.filter((candidate) => candidate.kind === pack.kind);
  const at = sameKind.findIndex((candidate) => candidate.id === pack.id);
  return at <= 0 ? null : (sameKind[at - 1]?.id ?? null);
}

/** Which sheet a step has open, keyed by action id. The screen owns the open state. */
export type StepSheet = { actionId: string; kind: "skip" | "later" } | null;
