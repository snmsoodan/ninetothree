import type { Metadata } from "next";
import { TextLink } from "@ninetothree/ui";

import { PolicyPage } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "What Nine to Three is, what it is not, what it costs, and how to leave.",
};

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms"
      lede="Short, because most of it is one sentence: this is a guide, not a doctor, and you can leave whenever you like."
    >
      <h2>What this is</h2>
      <p>
        Nine to Three is a week-by-week guide for parents, from early pregnancy to a child&rsquo;s
        third birthday. It summarises published guidance from public health bodies and professional
        organisations, and it links to them. It is educational.
      </p>

      <h2>What this is not</h2>
      <p>
        <strong>
          It is not medical advice, and it is not a substitute for your own clinician.
        </strong>{" "}
        We do not know your history, your blood pressure, your baby or your pregnancy. Nothing on
        this site creates a doctor-patient relationship, and no page here should be used to decide
        whether a symptom is serious.
      </p>
      <p>
        If you think something is wrong, stop reading and call someone. In the United States that is
        911 for an emergency, your obstetric triage line, or your paediatrician. The{" "}
        <TextLink href="/safety">safety page</TextLink> has the numbers, works without a signal, and
        never asks you to sign in.
      </p>
      <p>
        We also do not promise that any number, programme or law described here is current in your
        state. Programs change; a link is a better source than our summary, which is why every claim
        has one.
      </p>

      <h2>Using it</h2>
      <p>
        You need to be eighteen or older, or the age of majority where you live. You can use the
        guide without an account; if you make one, keep it yours, and tell us if you think somebody
        else has got into it. We may suspend an account that is being used to attack the service or
        to scrape it — that is the only reason we would ever take something away without being
        asked.
      </p>

      <h2>What it costs</h2>
      <p>
        The week you are in, the safety pages and the triage questions are free, permanently and
        without an account. <strong>Plus is $5, paid once.</strong> It opens the whole timeline in
        both directions, lifts the limit on pins, adds a second adult to your household, and turns
        on offline reading and printing.
      </p>
      <p>
        It is not a subscription. There is no monthly charge, nothing renews, and there is nothing
        to cancel — one payment and the guide is yours for as long as we run it. Paying once also
        means there is no card to expire and no failed payment to be cut off by.
      </p>
      <p>
        The price you pay is the price on the day you pay it. If we raise it later, that applies to
        new purchases, not to yours.
      </p>

      <h2>Refunds</h2>
      <p>
        If Plus is not what you expected, write to us within thirty days of paying and we will
        refund it, no interrogation. A refund ends the access it paid for — the week you are in, the
        safety pages and the triage questions stay, because those were never the thing being sold.
      </p>

      <h2>The content</h2>
      <p>
        The words are ours. The guidance they summarise belongs to the organisations that published
        it, and the links point there. You may read, print and share pages for your own family. You
        may not republish the guide, resell it, or feed it to a model as a substitute for reading it
        — not because a licence forbids it, but because a summary of a summary is how a wrong number
        gets passed around.
      </p>
      <p>
        We correct mistakes in public. How we write, and what we do when we get something wrong, is
        on the <TextLink href="/editorial">editorial page</TextLink> and in the{" "}
        <TextLink href="/corrections">corrections log</TextLink>.
      </p>

      <h2>Availability</h2>
      <p>
        We try to keep the site up, and the safety page is built to work offline once you have
        opened it. We cannot promise uninterrupted service, and we are not liable for a missed
        reminder or a notification that did not arrive — set your own alarm for anything that
        matters.
      </p>

      <h2>Ending it</h2>
      <p>
        You can delete your account at any time; the{" "}
        <TextLink href="/privacy">privacy page</TextLink> explains exactly what happens and how long
        it takes. We can close an account for the reasons above, and if we do we will say which one
        and let you export your data first.
      </p>

      <h2>The legal part</h2>
      <p>
        The service is provided as it is. To the extent the law allows, we are not liable for
        indirect or consequential losses, and our total liability is limited to what you paid us in
        the twelve months before the claim. Nothing here limits liability for death or personal
        injury caused by negligence, or for anything else that cannot be limited — and nothing here
        is intended to make you give up a right you have as a consumer.
      </p>
      <p>
        These terms are governed by the laws of the State of Delaware, and disputes will be heard in
        its courts. If you live somewhere that gives you stronger rights as a consumer, those rights
        still apply.
      </p>

      <h2>Getting in touch</h2>
      <p>
        <TextLink href="mailto:hello@ninetothree.com" external>
          hello@ninetothree.com
        </TextLink>{" "}
        reaches a person. If it is about a mistake in the content, say so in the subject line and it
        goes to the front of the queue.
      </p>
    </PolicyPage>
  );
}
