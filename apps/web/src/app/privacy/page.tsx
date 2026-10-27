import type { Metadata } from "next";
import { TextLink } from "@ninetothree/ui";

import { PolicyPage } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Nine to Three stores, what never leaves your phone, and how to delete all of it.",
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy"
      lede="The guide works without an account. If you make one, this is everything we keep — and how to have it deleted."
    >
      <h2>The short version</h2>
      <ul>
        <li>You can use the whole guide, including safety, without signing in at all.</li>
        <li>
          Without an account, what you read and tick off is stored in your own browser and never
          sent to us.
        </li>
        <li>With an account, we keep your email address and the things you asked us to keep.</li>
        <li>
          We do not run analytics, advertising or tracking of any kind. There are no ad cookies.
        </li>
        <li>
          We do not sell data, and we do not share it with data brokers. There is no business here
          that would benefit from it.
        </li>
        <li>
          Deleting your account removes it within thirty days, and signing in again cancels the
          deletion.
        </li>
      </ul>

      <h2>What stays on your device</h2>
      <p>
        The week you are on, the things you have ticked off, your pins, your reading preferences and
        the answers you gave during onboarding are kept in your browser&rsquo;s local storage. They
        are on your phone or your laptop. They are not copied to a server, they are not in a backup,
        and we cannot read them.
      </p>
      <p>
        The one exception is the date you give us for your pregnancy or your child&rsquo;s birth,
        and only if you sign in: it is saved with your household so the weekly email can know which
        week to write about. Clearing your browser data removes the local copy but not that one.
      </p>

      <h2>What we keep if you make an account</h2>
      <ul>
        <li>
          <strong>Your email address.</strong> It is how you sign in and how the weekly email is
          sent. There is no password — we email you a single-use link instead, and we store only a
          hash of that link.
        </li>
        <li>
          <strong>Your household.</strong> The people you have invited, their email addresses, and
          what each of them is allowed to see. An invitation you send is stored until it is used or
          expires.
        </li>
        <li>
          <strong>The things you asked us to keep.</strong> Appointments, reminders and the
          checklist items you have shared with a partner. If it is not on this list, it is on your
          device and not with us — including the files you download from Settings, which are built
          in your browser and never sent anywhere.
        </li>
        <li>
          <strong>Whether you are paying.</strong> The plan, its status and the customer reference
          our payment processor gives us. We never see or store a card number.
        </li>
        <li>
          <strong>Sign-in attempts.</strong> A timestamped count, so that a script cannot sit there
          guessing addresses. It is not linked to what you read.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>There are two, and neither of them follows you anywhere.</p>
      <ul>
        <li>
          <strong>The session cookie</strong>, set when you sign in and removed when you sign out.
          It is how the server knows it is still you. Without it you are signed out.
        </li>
        <li>
          <strong>One routing cookie</strong> holding a single character — whether you have finished
          onboarding — so that opening the site does not flash the wrong page at you before your
          browser catches up. It contains nothing about you and nothing about your pregnancy.
        </li>
      </ul>
      <p>
        There is no consent banner because there is nothing to consent to. If that ever changes, the
        banner will be the least of the changes.
      </p>

      <h2>Who else touches it</h2>
      <p>
        A short list, and each one does one job. We do not add to it quietly; this page changes when
        it does.
      </p>
      <ul>
        <li>
          <strong>Our database host</strong> stores the account data described above. It is managed
          Postgres, encrypted in transit and at rest, and reachable only from our servers.
        </li>
        <li>
          <strong>Our email provider</strong> delivers the sign-in link, and will deliver the weekly
          email when that is switched on. It sees the address and the message, which is the point of
          it.
        </li>
        <li>
          <strong>Our payment processor</strong> handles subscriptions. It sees your email and your
          card; we see whether the subscription is active.
        </li>
      </ul>
      <p>
        We will tell you before adding a fourth. Nothing here is sold, rented, or handed to an
        advertiser, because we do not have advertisers.
      </p>

      <h2>Your child</h2>
      <p>
        We never ask for your child&rsquo;s name. There are no photos, no uploads, and nowhere to
        put a birth story. The only thing we hold about a child is a date, entered by you, so the
        guide can work out which week to show — and it is stored on your device unless you have
        signed in.
      </p>
      <p>
        Accounts belong to adults. We do not knowingly collect anything from a child under thirteen,
        and if we learn we have, we delete it.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Account data stays until you delete the account. Deleting is a request rather than an
        instant event: you get thirty days in which signing in again cancels it, because the most
        common reason to delete an account is a bad afternoon. After thirty days a job removes your
        rows, and everything that referenced them is removed with them.
      </p>
      <p>
        We keep daily database backups so that a mistake can be undone. Those backups roll off on a
        fixed schedule, and a deleted account goes with them as they do.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask for a copy of what we hold, ask us to correct it, ask us to delete it, or ask
        what we have shared and with whom. You can also export the parts that are yours from{" "}
        <TextLink href="/settings">Settings</TextLink> without asking anybody. Write to{" "}
        <TextLink href="mailto:privacy@ninetothree.com" external>
          privacy@ninetothree.com
        </TextLink>{" "}
        and we will answer within thirty days.
      </p>
      <p>
        If you are in a place with a data protection authority, you can complain to it. We would
        rather you told us first, but it is your right either way.
      </p>

      <h2>Security</h2>
      <p>
        Sign-in links are single use, short lived and rate limited. Every table that holds a
        household&rsquo;s data is restricted at the database level, not only in our code, so a bug
        in one query cannot read another family&rsquo;s rows. If something does go wrong, we will
        tell the people affected, plainly and without waiting to be asked.
      </p>

      <h2>Changes</h2>
      <p>
        If this page changes in a way that affects what we collect or who we share it with, we will
        email account holders before the change takes effect and keep the previous version
        available. Corrections to the wording are recorded in the{" "}
        <TextLink href="/corrections">corrections log</TextLink> like everything else.
      </p>
    </PolicyPage>
  );
}
