import type { Metadata } from "next";
import { CORRECTIONS, CORRECTION_WINDOWS } from "@ninetothree/content";
import { TextLink } from "@ninetothree/ui";

import { PolicyPage } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Corrections",
  description:
    "Every mistake Nine to Three has corrected, what it said, what it says now, and how fast each kind of mistake gets fixed.",
};

export default function CorrectionsPage() {
  return (
    <PolicyPage
      title="Corrections"
      lede="A record of what we got wrong, kept in public, including the parts that are only embarrassing."
    >
      <h2>How this works</h2>
      <p>
        Corrections are logged here rather than quietly edited out. Each entry keeps the original
        wording, because a correction you cannot compare against what it replaced is a press
        release. Entries are never deleted, and this page has no way to hide one.
      </p>

      <h2>How fast we fix things</h2>
      <p>
        These are commitments, not aspirations. They are held in the same data the site is built
        from, so they cannot drift away from the page that states them.
      </p>
      <ul>
        {CORRECTION_WINDOWS.map((entry) => (
          <li key={entry.kind}>
            <strong>{entry.kind}</strong> — {entry.window}. {entry.detail}
          </li>
        ))}
      </ul>

      <h2>The log</h2>
      {CORRECTIONS.length === 0 ? (
        <p>
          <strong>Nothing yet.</strong> This log opens empty, and it stays public either way. We
          would rather show you a blank page than a plausible-looking one: a corrections log that
          starts with a few tidy entries is a marketing device, and the first real correction will
          be the first thing here.
        </p>
      ) : (
        <ul>
          {CORRECTIONS.map((correction) => (
            <li key={correction.id}>
              <strong>{correction.where}</strong> — corrected {correction.published}, found by{" "}
              {correction.foundBy}.
              <br />
              Was: <q>{correction.was}</q>
              <br />
              Now: <q>{correction.now}</q>
            </li>
          ))}
        </ul>
      )}

      <h2>Tell us</h2>
      <p>
        Write to{" "}
        <TextLink href="mailto:hello@ninetothree.com" external>
          hello@ninetothree.com
        </TextLink>{" "}
        with the page and the sentence. You do not need to be polite about it, and you do not need
        to be sure — &ldquo;this does not match what my midwife told me&rdquo; is enough for us to
        go and read the source again.
      </p>
      <p>
        If the mistake could hurt someone, the page comes down first and the log entry follows the
        same day. If it affected something you were told to do, we email account holders rather than
        hoping they come back to this page.
      </p>
    </PolicyPage>
  );
}
