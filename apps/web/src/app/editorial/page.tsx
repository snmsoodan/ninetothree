import type { Metadata } from "next";
import { TextLink } from "@ninetothree/ui";

import { PolicyPage } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "How we write",
  description:
    "Where the advice in Nine to Three comes from, who checks it, what we refuse to do, and how to tell us we are wrong.",
};

export default function EditorialPage() {
  return (
    <PolicyPage
      title="How we write"
      lede="Every claim in this guide has a source you can open yourself. This page is how that is enforced, and where it is still not good enough."
    >
      <h2>The one rule</h2>
      <p>
        A sentence that tells you to do something has a link next to it, and that link goes to the
        organisation that actually said it. Not a blog summarising it, not a brand, not us. If we
        cannot find a source good enough to point at, the sentence does not go in — we would rather
        a week say less than say something we cannot stand behind at 3am.
      </p>
      <p>
        The second half of the rule is that the link is a better source than our summary. Our job is
        to tell you what to do this week and why it matters. Theirs is to be right about the
        medicine.
      </p>

      <h2>Where it comes from</h2>
      <p>In order, and we only go down the list when the tier above has nothing usable:</p>
      <ol>
        <li>
          <strong>Government and public health.</strong> CDC, NIH, FDA, USDA and WIC, HRSA, and the
          state programmes that administer them. This is where schedules, eligibility rules and
          recalls come from.
        </li>
        <li>
          <strong>Clinical bodies.</strong> ACOG for pregnancy, the AAP for babies and children, and
          the specialty societies behind the specific numbers — safe sleep, feeding, vaccines,
          developmental screening.
        </li>
        <li>
          <strong>Charities and non-profits.</strong> March of Dimes, Postpartum Support
          International, ZERO TO THREE, NAEYC, and the crisis lines. These are usually the best
          writing on the thing you are actually frightened about.
        </li>
        <li>
          <strong>Independent testing.</strong> NHTSA and IIHS ratings, CPSC recalls, Consumer
          Reports and Wirecutter for gear. We use these for what to buy and never for what is safe
          to do.
        </li>
        <li>
          <strong>Commercial.</strong> Only where a parent has to buy something, and always with a
          budget option that is genuinely safe rather than a cheap one that is not.
        </li>
      </ol>
      <p>
        Apps and books are held to the same bar: a named organisation behind them, a reason they are
        here rather than a hundred others, and no ranking for sale.
      </p>

      <h2>Who checks it</h2>
      <p>
        <strong>No clinician has read this guide yet.</strong> Every one of the stage packs carries
        the same line in its data — clinical review pending — and that is the honest state of it. It
        is written against published guidance, with the citation attached, and it has not been
        signed off by an obstetrician, a midwife or a paediatrician. Until it is, treat it as a
        well-sourced second opinion and not as the thing you follow instead of your own clinician.
      </p>
      <p>
        What has been checked is narrower and worth saying plainly: that every citation resolves,
        that the numbers we quote match the source we quote them from, that the appointment windows
        match the schedule the US actually uses, and that a red flag never appears without the
        number to call next to it. That is a floor, not a review.
      </p>
      <p>
        When clinical review happens, this page changes on the same day, and so does the line in
        every pack. A product that quietly starts claiming review it does not have is the failure
        this paragraph exists to make impossible to do by accident.
      </p>

      <h2>How often it changes</h2>
      <p>
        Every cited source, every catalogue link, every article link and every recall is checked
        automatically on every change and again once a week, because a link rots without anybody
        touching the repository. A handful of the sites we rely on most — several government ones,
        and a few publishers — refuse automated checkers, so those are opened by hand on the same
        cadence. A dead citation is worse than no citation: it tells a parent at 3am that nobody is
        home.
      </p>
      <p>
        The weekly packs are reviewed against their sources before each release, and the appointment
        schedule is re-read whenever ACOG republishes it. Nothing here is on a once-a-year editorial
        calendar, because the thing you are reading about is happening this week.
      </p>

      <h2>What we refuse to do</h2>
      <ul>
        <li>
          <strong>No advertising, and no affiliate commission.</strong> There is no link in this
          guide that pays us. Some of the sites we link to earn commission on their own links; we
          say so where it might change how you read their ranking, and it never changes ours.
        </li>
        <li>
          <strong>No formula or toddler-milk advertising.</strong> The WHO code is not US law. We
          hold to it anyway.
        </li>
        <li>
          <strong>No sleep products that have killed babies.</strong> Positioners, crib bumpers,
          inclined sleepers, weighted sleep sacks and loungers used for sleep are named as unsafe
          rather than sold to you.
        </li>
        <li>
          <strong>No fear as a sales tactic.</strong> No countdown that implies your baby is behind,
          no milestone app that treats a delay as a failing, no locked safety feature behind a
          subscription. Safety content is free and needs no account.
        </li>
        <li>
          <strong>No tracking.</strong> No analytics, no ad pixels, no session recording. What you
          read is yours. The <TextLink href="/privacy">privacy page</TextLink> lists the two cookies
          and why they exist.
        </li>
      </ul>

      <h2>Written with AI, checked against sources</h2>
      <p>
        The prose in this guide was drafted with AI assistance and edited by a person. We are saying
        so because you are entitled to know how the thing you are reading was made, and because the
        failure mode of AI-written health content is specific: it is fluent, confident and
        occasionally wrong in a way that reads exactly like being right.
      </p>
      <p>
        The defence is structural rather than a promise. A claim without a citation does not pass
        the content check, so it cannot ship. The citation sits next to the claim, so you can settle
        any disagreement without trusting us. And the clinical review gate above is still shut,
        which is the correct state for content produced this way until a clinician has actually read
        it.
      </p>

      <h2>Who pays for it</h2>
      <p>
        Subscriptions, and nothing else. The week you are in, the safety pages and the triage
        questions are free forever, without an account, along with five pins. Plus is $7.99 a month:
        the whole timeline in both directions, no limit on pins, a second adult in your household,
        offline reading and printing. There is no advertising and there is no investor pressure to
        add any, which is the only reason a promise like that is worth writing down.
      </p>

      <h2>When we are wrong</h2>
      <p>
        Write to{" "}
        <TextLink href="mailto:hello@ninetothree.com" external>
          hello@ninetothree.com
        </TextLink>
        . A person reads it. If it is a correction, it goes in the{" "}
        <TextLink href="/corrections">corrections log</TextLink> with the date, what it said and
        what it says now — including the ones that are only embarrassing. The{" "}
        <TextLink href="/corrections">corrections page</TextLink> says how fast each kind of mistake
        gets fixed.
      </p>
      <p>
        If something here could hurt someone — a wrong dose, a wrong number, a warning sign
        described in a way that might delay care — it comes down first and gets discussed second.
      </p>
    </PolicyPage>
  );
}
