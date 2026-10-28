import { PERSONAS, type Persona, type PersonaView } from "./schema";
import { stageOrdinal } from "./links";

/**
 * Who is reading, and what the week asks of them.
 *
 * The guide is written for the person who is pregnant or who gave birth.
 * Everyone else in the room reads it over their shoulder and finds a page
 * that is not about them. A persona changes *what the week asks of you*, not
 * what is true: red flags, triage and sources are identical for everyone.
 *
 * See PERSONAS.md for the design and the rules this file implements.
 */

export interface PersonaMeta {
  /** The radio label in onboarding and settings. Plain, first person. */
  label: string;
  /** One line under the label, so nobody has to guess which one they are. */
  hint: string;
  /** What the lens is headed when this persona reads a week. */
  lensTitle: string;
}

export const PERSONA_META: Record<Persona, PersonaMeta> = {
  parent: {
    label: "I am the parent",
    hint: "I am pregnant, or I gave birth",
    lensTitle: "Your week",
  },
  partner: {
    label: "I am the other parent",
    hint: "My partner is pregnant, or gave birth",
    lensTitle: "What this week asks of you",
  },
  grandparent: {
    label: "I am a grandparent",
    hint: "My child is having a baby",
    lensTitle: "What this week asks of you",
  },
  extended: {
    label: "I am an aunt, uncle, sibling or friend",
    hint: "Someone close to me is having a baby",
    lensTitle: "What this week asks of you",
  },
};

/**
 * The three non-parent personas. `parent` is the pack itself, so it never
 * needs a view: a pack that carried one would be two copies of the same week.
 */
export const LENS_PERSONAS = ["partner", "grandparent", "extended"] as const;
export type LensPersona = (typeof LENS_PERSONAS)[number];

export function isPersona(value: unknown): value is Persona {
  return typeof value === "string" && (PERSONAS as readonly string[]).includes(value);
}

export function isLensPersona(value: unknown): value is LensPersona {
  return typeof value === "string" && (LENS_PERSONAS as readonly string[]).includes(value);
}

/**
 * The stages the fallback tracks are written for. A track is true of the whole
 * band, so it never claims a week — which is why it needs no disclaimer.
 */
export const BANDS = [
  "pregnancy-early",
  "pregnancy-mid",
  "pregnancy-late",
  "newborn",
  "first-year",
  "toddler",
] as const;
export type Band = (typeof BANDS)[number];

export const BAND_LABELS: Record<Band, string> = {
  "pregnancy-early": "The first trimester",
  "pregnancy-mid": "The middle months",
  "pregnancy-late": "The last weeks",
  newborn: "The first three months",
  "first-year": "The first year",
  toddler: "The toddler years",
};

export interface StageLike {
  kind: "pregnancy" | "postpartum" | "infant" | "toddler" | "event";
  stageIndex: number;
}

/** Which track a pack falls into. `event` packs read as the first year. */
export function bandFor(stage: StageLike): Band {
  switch (stage.kind) {
    case "pregnancy":
      if (stage.stageIndex <= 13) return "pregnancy-early";
      if (stage.stageIndex <= 27) return "pregnancy-mid";
      return "pregnancy-late";
    case "postpartum":
      return "newborn";
    case "infant":
      return "first-year";
    case "toddler":
      return "toddler";
    case "event":
      return "first-year";
  }
}

/**
 * Advice for a stage, not a task for a week. Read-only by design: a "done" tick
 * on a three-month band would be a lie about what was done, and a synthetic id
 * would break pins and history the day the band changed.
 */
export interface TrackSuggestion {
  id: string;
  title: string;
  why: string;
  minutes?: number;
}

export interface Track {
  headline: string;
  body: string;
  suggestions: TrackSuggestion[];
}

export const PERSONA_TRACKS: Record<LensPersona, Record<Band, Track>> = {
  partner: {
    "pregnancy-early": {
      headline: "The first trimester is quiet work",
      body: "She may be exhausted and not look pregnant at all. The tiredness is the pregnancy, not a lack of interest in you.",
      suggestions: [
        {
          id: "track-partner-early-shift",
          title: "Take the evening shift",
          why: "Cook, wash up, walk the dog. The hour she does not spend standing is the hour she gets back.",
          minutes: 45,
        },
        {
          id: "track-partner-early-appt",
          title: "Go to the first appointment",
          why: "The first visit is a long wait and a lot of questions. Two sets of ears remember more.",
          minutes: 90,
        },
        {
          id: "track-partner-early-quiet",
          title: "Tell nobody yet",
          why: "Wait until she says it is safe to tell. A loss is easier when strangers were never told.",
          minutes: 5,
        },
      ],
    },
    "pregnancy-mid": {
      headline: "The middle is the part with energy in it",
      body: "Use it. The things that are hard at 38 weeks are easy at 22, and doing them now is the most useful thing you will do all pregnancy.",
      suggestions: [
        {
          id: "track-partner-mid-cot",
          title: "Build the cot before the bump",
          why: "Assembling furniture at eight months pregnant, in a small room, is a two-person job and an argument.",
          minutes: 120,
        },
        {
          id: "track-partner-mid-class",
          title: "Book the birth class",
          why: "You will both be in the room. Knowing the words for what is happening is not a spectator sport.",
          minutes: 60,
        },
        {
          id: "track-partner-mid-plan",
          title: "Ask about the birth plan",
          why: "Not to agree with all of it. So you know what she wants at the moment she cannot say it.",
          minutes: 30,
        },
      ],
    },
    "pregnancy-late": {
      headline: "You are on call now",
      body: 'From 37 weeks the answer to "is this it?" can be yes. Know the route, the bag, and who is driving.',
      suggestions: [
        {
          id: "track-partner-late-bag",
          title: "Put the bag in the car",
          why: "The bag by the door is a plan. The bag in the car is a decision already made.",
          minutes: 15,
        },
        {
          id: "track-partner-late-numbers",
          title: "Save the triage number",
          why: "It is on the fridge in the pack. Put it in your phone too, because you will be the one dialling.",
          minutes: 5,
        },
        {
          id: "track-partner-late-sleep",
          title: "Sleep when she sleeps",
          why: "The last weeks of pregnancy are not the time to finish a project. You will need the sleep more than the project.",
        },
      ],
    },
    newborn: {
      headline: "Nobody is themselves in the first month",
      body: "She is healing, feeding around the clock and running on broken sleep. The most useful thing you own is the ability to take the baby for an hour.",
      suggestions: [
        {
          id: "track-partner-newborn-feed",
          title: "Own one night feed",
          why: "One feed you do without waking her is the difference between four hours of sleep and two.",
          minutes: 40,
        },
        {
          id: "track-partner-newborn-visitors",
          title: "Be the one who says no",
          why: 'You are the gatekeeper. "Not today" is easier to hear from you than from her.',
          minutes: 5,
        },
        {
          id: "track-partner-newborn-mood",
          title: "Watch her mood, not just the baby",
          why: "Postpartum depression is common and quiet. If she has stopped laughing at things she used to laugh at, say something.",
          minutes: 10,
        },
      ],
    },
    "first-year": {
      headline: "The baby is not the only one growing",
      body: "By six months the novelty has worn off and the work has not. This is the stretch that quietly breaks couples, and it is survivable.",
      suggestions: [
        {
          id: "track-partner-year-hour",
          title: "Take an hour alone every week",
          why: "Not to be a hero. So that you can be a person who is not on duty, and so she can be one too.",
          minutes: 60,
        },
        {
          id: "track-partner-year-split",
          title: "Write down who does what",
          why: "The invisible list is the argument. Writing it down makes it visible, and divisible.",
          minutes: 20,
        },
        {
          id: "track-partner-year-ask",
          title: "Ask how she is, not how the baby is",
          why: "Everyone asks about the baby. Almost nobody asks about her.",
          minutes: 5,
        },
      ],
    },
    toddler: {
      headline: "You are the other half of the discipline",
      body: "A two-year-old learns what is allowed by testing both of you. Two different answers is a lesson in which parent to ask.",
      suggestions: [
        {
          id: "track-partner-toddler-rule",
          title: "Agree on the one rule",
          why: "Pick the thing you will both hold, and hold it the same way. One rule held is worth ten announced.",
          minutes: 20,
        },
        {
          id: "track-partner-toddler-out",
          title: "Take them out on your own",
          why: "An hour at the park, without her, is an hour she is not being climbed on.",
          minutes: 60,
        },
        {
          id: "track-partner-toddler-play",
          title: "Say yes to the boring game",
          why: "The fifth round of the same game is the one they remember. It is also the one you will want to skip.",
          minutes: 15,
        },
      ],
    },
  },
  grandparent: {
    "pregnancy-early": {
      headline: "You know a lot. Some of it has changed.",
      body: "The advice you were given in 1990 was good advice for 1990. A short list of things has genuinely changed, and the cot is on it.",
      suggestions: [
        {
          id: "track-grandparent-early-sleep",
          title: "Learn the sleep rules before you babysit",
          why: "On the back, on a firm surface, nothing in the cot. This is the one where old advice is now dangerous.",
          minutes: 10,
        },
        {
          id: "track-grandparent-early-ask",
          title: "Ask before you tell",
          why: 'A question opens a door and a sentence closes one. "How are you feeling?" gets an answer.',
          minutes: 5,
        },
        {
          id: "track-grandparent-early-help",
          title: "Offer the specific thing",
          why: '"I will bring dinner on Thursday" is help. "Let me know if you need anything" is a chore.',
          minutes: 5,
        },
      ],
    },
    "pregnancy-mid": {
      headline: "The useful grandparent has a car and no opinions",
      body: "By the middle months she has heard every warning twice. What she has not got is somebody who can drive to the 8am appointment.",
      suggestions: [
        {
          id: "track-grandparent-mid-lift",
          title: "Take a morning off for an appointment",
          why: "The 20-week scan is the long one. A lift and a coffee afterwards is worth more than a cot.",
          minutes: 120,
        },
        {
          id: "track-grandparent-mid-gift",
          title: "Give the thing they will not buy",
          why: "Nappies, a cleaner, a meal. Not another outfit in newborn size.",
          minutes: 20,
        },
        {
          id: "track-grandparent-mid-birth",
          title: "Wait to be invited to the birth",
          why: "Being in the room is not a right and not a test of love. Ask once, and accept the answer.",
          minutes: 5,
        },
      ],
    },
    "pregnancy-late": {
      headline: "Be reachable, not resident",
      body: "The last month is a waiting room. Being available at 2am is worth more than being in the kitchen at 2pm.",
      suggestions: [
        {
          id: "track-grandparent-late-phone",
          title: "Keep the phone on",
          why: "The call may come at three in the morning. That is the whole job.",
        },
        {
          id: "track-grandparent-late-dog",
          title: "Agree what happens to the dog",
          why: "The plan nobody made is the one that goes wrong on the night.",
          minutes: 15,
        },
        {
          id: "track-grandparent-late-freezer",
          title: "Fill the freezer",
          why: "The first week at home has no cooking in it. Lasagne in portions is love with a date on it.",
          minutes: 90,
        },
      ],
    },
    newborn: {
      headline: "Hold the baby. Wash the dishes.",
      body: "The visit that helps is the one where you do the boring thing and leave. The visit that hurts is the one where you hold the baby and she makes the tea.",
      suggestions: [
        {
          id: "track-grandparent-newborn-chore",
          title: "Do one chore without asking",
          why: 'Not "what can I do". The dishes. The bin. The laundry sitting in the machine.',
          minutes: 20,
        },
        {
          id: "track-grandparent-newborn-visit",
          title: "Keep the visit short",
          why: "Forty minutes, then go. A new parent is hosting you whether they meant to or not.",
          minutes: 40,
        },
        {
          id: "track-grandparent-newborn-kiss",
          title: "Do not kiss the baby",
          why: "A newborn's immune system is not yours. Hands, no face, and no kissing until the pediatrician says so.",
          minutes: 2,
        },
      ],
    },
    "first-year": {
      headline: "The baby is not yours to raise",
      body: "The hardest part of this year is watching your child do it differently from how you did it, and saying nothing.",
      suggestions: [
        {
          id: "track-grandparent-year-advice",
          title: "Answer only what is asked",
          why: "If they ask how you did it, tell them. If they do not, the silence is the help.",
          minutes: 5,
        },
        {
          id: "track-grandparent-year-photo",
          title: "Ask before you post",
          why: "A photograph on your page is a photograph on the internet, permanently, with their name attached.",
          minutes: 5,
        },
        {
          id: "track-grandparent-year-regular",
          title: "Be the regular, not the event",
          why: "A Tuesday every week beats a party once a year. Children remember who was always there.",
          minutes: 60,
        },
      ],
    },
    toddler: {
      headline: "You are the safe place with the boring rules",
      body: "A toddler who knows your house has the same rules as their house is a toddler who can relax. That is the gift.",
      suggestions: [
        {
          id: "track-grandparent-toddler-rules",
          title: "Match their rules at your house",
          why: "If the cot has no blanket at home, it has no blanket at yours. Consistency is what makes you restful.",
          minutes: 15,
        },
        {
          id: "track-grandparent-toddler-backup",
          title: "Back the parent up in front of the child",
          why: "Disagree later, in the kitchen. A two-year-old who sees you overrule a parent learns to shop for the softer answer.",
          minutes: 5,
        },
        {
          id: "track-grandparent-toddler-hour",
          title: "Take them for an hour",
          why: "The hour is for the parent, not for you. Say so, so nobody has to feel grateful for it.",
          minutes: 60,
        },
      ],
    },
  },
  extended: {
    "pregnancy-early": {
      headline: "You are not the first person they told",
      body: "Early pregnancy is a secret with a short list. Being on it is an honour, and it comes with one rule: you do not tell anyone else.",
      suggestions: [
        {
          id: "track-extended-early-secret",
          title: "Keep it to yourself",
          why: "Not your partner, not your mother. It is their news, and they will say when.",
          minutes: 2,
        },
        {
          id: "track-extended-early-text",
          title: "Text, do not call",
          why: 'A call asks for energy. A text waits. "Thinking of you, no reply needed" is the whole message.',
          minutes: 2,
        },
        {
          id: "track-extended-early-food",
          title: "Learn what she cannot eat",
          why: "If you are cooking, the list matters: no unpasteurised cheese, no raw fish, no alcohol in the sauce.",
          minutes: 15,
        },
      ],
    },
    "pregnancy-mid": {
      headline: "The fun aunt or uncle is a real job",
      body: "You are not the parent and not the grandparent. That is a better position than it sounds: you can be delighted without being responsible.",
      suggestions: [
        {
          id: "track-extended-mid-plan",
          title: "Plan one thing for after the birth",
          why: "A meal, a walk, an afternoon of company. Week three is when the visitors stop and the help is still needed.",
          minutes: 30,
        },
        {
          id: "track-extended-mid-list",
          title: "Buy from the list, not the shop",
          why: "They wrote a list for a reason. The fourth muslin is not the gift; the thing nobody bought is.",
          minutes: 20,
        },
        {
          id: "track-extended-mid-touch",
          title: "Ask before you touch",
          why: "A pregnant body is not public property. Ask, and take the answer.",
          minutes: 2,
        },
      ],
    },
    "pregnancy-late": {
      headline: "The last month is logistics",
      body: "Nobody needs another babygrow. They need a lift, a dog walker, and somebody who will answer the phone at four in the morning.",
      suggestions: [
        {
          id: "track-extended-late-lift",
          title: "Offer a specific lift",
          why: 'The 36-week appointment, the 39-week check. "I can drive you Thursday" is a plan; "let me know" is not.',
          minutes: 60,
        },
        {
          id: "track-extended-late-dog",
          title: "Take the dog for the birth",
          why: "The plan nobody made is the one that goes wrong at 2am. Ask now, while it is hypothetical.",
          minutes: 30,
        },
        {
          id: "track-extended-late-news",
          title: 'Do not ask "any news?"',
          why: "Nothing is happening. Asking makes the waiting longer. Wait to be told.",
          minutes: 2,
        },
      ],
    },
    newborn: {
      headline: "Week three is the week they need you",
      body: "In the first week there are too many people. In the third there is nobody, and the doorbell has stopped ringing.",
      suggestions: [
        {
          id: "track-extended-newborn-later",
          title: "Come in week three",
          why: "The first week is for grandparents and sleep. The third is for anyone who will hold the baby while she showers.",
          minutes: 60,
        },
        {
          id: "track-extended-newborn-food",
          title: "Bring food, not advice",
          why: "Something that reheats in one pan and can be eaten with one hand. Say nothing about the mess.",
          minutes: 45,
        },
        {
          id: "track-extended-newborn-sick",
          title: "Stay away if you are ill",
          why: "A cold in a newborn is a hospital visit. A cold in you is a week off. Reschedule.",
          minutes: 2,
        },
      ],
    },
    "first-year": {
      headline: "Be the one who is not keeping score",
      body: "By now everyone has an opinion about the sleep, the feeding and the screens. You can be the one who asks and does not grade the answer.",
      suggestions: [
        {
          id: "track-extended-year-photo",
          title: "Ask before you post a photo",
          why: "Their face, their name, their choice. Ask every time until they say you do not have to.",
          minutes: 2,
        },
        {
          id: "track-extended-year-task",
          title: "Turn up with a task",
          why: "Not to hold the baby. To walk it round the block so she can eat with two hands.",
          minutes: 30,
        },
        {
          id: "track-extended-year-song",
          title: "Learn one song they like",
          why: "A song you can sing badly is worth more to a one-year-old than a toy that needs batteries.",
          minutes: 15,
        },
      ],
    },
    toddler: {
      headline: "The toddler years are when you become the fun one",
      body: "A two-year-old cannot be charmed, but can be delighted. You are the person with no rules to enforce and no bedtime to defend.",
      suggestions: [
        {
          id: "track-extended-toddler-out",
          title: "Take them somewhere with weather",
          why: "Puddles, sticks, a hill. The outing that costs nothing is the one they talk about.",
          minutes: 90,
        },
        {
          id: "track-extended-toddler-ask",
          title: "Ask the parent first",
          why: "A sweet before dinner is not your call. Ask once, in front of the child, and take the answer.",
          minutes: 2,
        },
        {
          id: "track-extended-toddler-gift",
          title: "Give an experience, not a thing",
          why: "The house is already full. A trip to the zoo is a memory and no clutter.",
          minutes: 30,
        },
      ],
    },
  },
};

/**
 * The light line. Wry, never at the reader's expense, never about the body,
 * money, feeding or the baby. Four pools, because the same joke from the wrong
 * person is a different joke.
 */
export const PERSONA_LIGHT: Record<Persona, string[]> = {
  parent: [
    "You are growing a person and a second opinion. Only one of them is welcome.",
    "At some point this week you will cry at something small. It is the hormones, and also it was quite sad.",
    "Your body is currently running a building project it did not consult you about.",
    "The app says the baby is the size of a butternut squash. You would like a word with whoever decided that was comforting.",
    "You will forget what you were saying mid-sentence. This is normal, and it is very funny later.",
    "There is a nap with your name on it. It is not a long nap, but it is yours.",
    "You have read four hundred pages about sleep and the baby has read none of them.",
    "Everything is a phase. It is the most useful sentence in parenting and the least comforting at 3am.",
  ],
  partner: [
    "You will become fluent in someone else's bodily fluids. Nobody warns you that this counts as a promotion.",
    "At some point you will be holding the baby at 4am whispering \"it's fine, it's fine\". You will be talking to yourself.",
    "You are about to own more opinions about a pram than about any car you will ever drive.",
    "The first time you are alone with the baby you will check that they are breathing about nine times an hour. That is the job.",
    "Your new skill is doing everything one-handed. You will be insufferable about it.",
    "Nobody will ask how you are. You will notice this around week six. Tell someone anyway.",
    'You will say "we are tired" and mean it in a way that has no equivalent in your previous life.',
    "Somewhere in a drawer is a shirt you will never wear again. You will keep it for four years.",
  ],
  grandparent: [
    'You will hear yourself say "in my day" and then hear the sentence land. It is fine. Say it anyway, quietly.',
    "The fastest way to be invited back is to leave before you are asked to.",
    "You are about to discover that the baby does not care that you raised three children. They would like to be bounced.",
    "There is a version of this where you are the person who turns up with dinner. It is the best version.",
    "You will buy one toy. It will be the wrong one. It will be loved beyond all reason.",
    "Your phone is about to hold four hundred photographs of one baby and no photographs of anything else.",
    "At some point you will be told the cot rules have changed since your day. They have. That is the one where you listen.",
    'The word "no" from you will be tested within ten minutes. Hold it. It is a kindness.',
  ],
  extended: [
    "You are the one who gets to hand the baby back. Do not apologise for enjoying that.",
    "There is a specific joy in being the person nobody is worried about. Lean into it.",
    "You will buy a present that makes a noise. The parents will remember. Choose wisely.",
    "You will be asked to hold the baby while somebody showers. This is the highest office available to you.",
    'The child will one day say your name before they say "aunt" or "uncle". It will be wrong and perfect.',
    "Your role at the birthday party is to take photographs and eat the cake. Both are essential.",
    "You will become the person who knows which park has the good swings. That is a real qualification.",
    "Nobody expects you to know what you are doing. This is your greatest advantage.",
  ],
};

/** How far each persona is offset into its pool, so two readers never share a line. */
const PERSONA_OFFSET: Record<Persona, number> = {
  parent: 0,
  partner: 3,
  grandparent: 5,
  extended: 6,
};

export interface LightOptions {
  /** False when the reader has turned humour off, or a loss is recorded. */
  enabled?: boolean;
}

/**
 * The light line for a persona at a stage. Rotation rather than randomness:
 * the same week always reads the same, and the line only changes when the week
 * does.
 */
export function lightFor(
  persona: Persona,
  stage: StageLike,
  options: LightOptions = {},
): string | null {
  if (options.enabled === false) return null;
  const pool = PERSONA_LIGHT[persona];
  const ordinal = stageOrdinal({ kind: stage.kind, index: stage.stageIndex });
  // The modulo keeps the index inside the pool, so the lookup is always defined.
  return pool[(ordinal + PERSONA_OFFSET[persona]) % pool.length] as string;
}

/** The view a pack carries for a persona, if it was written for them. */
export function findView(
  stage: { personas?: PersonaView[] },
  persona: Persona,
): PersonaView | undefined {
  return (stage.personas ?? []).find((candidate) => candidate.persona === persona);
}

export interface Lens {
  persona: Persona;
  /** "authored" means this week was written for this reader; "track" means the band was. */
  source: "authored" | "track";
  headline: string;
  body: string;
  /** Authored actions, checkable. Empty on a track. */
  actions: PersonaView["actions"];
  /** Read-only advice for the band. Empty when the week was authored. */
  suggestions: TrackSuggestion[];
  /** The band label, shown above a track so the reader knows it is not this week. */
  bandLabel: string;
  light: string | null;
}

export interface LensOptions extends LightOptions {
  /** True when the pack carries a view for this persona. */
  view?: PersonaView;
}

/**
 * What a persona reads for a pack: the authored view if the week has one,
 * otherwise the track for its band.
 *
 * A track never claims a week — its headline says "what this stage asks of
 * you" — which is why the fallback needs no disclaimer.
 */
export function lensFor(
  stage: StageLike & { personas?: PersonaView[] },
  persona: Persona,
  options: LensOptions = {},
): Lens {
  const band = bandFor(stage);
  const view = options.view ?? findView(stage, persona);

  if (persona === "parent") {
    // The pack is already the parent's week; the lens exists only to carry the
    // light line and the band label for the week page.
    return {
      persona,
      source: "authored",
      headline: "",
      body: "",
      actions: [],
      suggestions: [],
      bandLabel: BAND_LABELS[band],
      light: lightFor(persona, stage, options),
    };
  }

  const light = view?.light ?? lightFor(persona, stage, options);
  if (view) {
    return {
      persona,
      source: "authored",
      headline: view.headline,
      body: view.body,
      actions: view.actions,
      suggestions: [],
      bandLabel: BAND_LABELS[band],
      light,
    };
  }

  const track = PERSONA_TRACKS[persona][band];
  return {
    persona,
    source: "track",
    headline: track.headline,
    body: track.body,
    actions: [],
    suggestions: track.suggestions,
    bandLabel: BAND_LABELS[band],
    light,
  };
}
