import type { Metadata } from "next";
import { TextLink } from "@ninetothree/ui";

import { PolicyPage } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Licence",
  description:
    "What you can reuse from Nine to Three, what we ask in return, and where the full licence texts are.",
};

/** The repository, so a reader can open the licence files themselves. */
const REPO = "https://github.com/snmsoodan/ninetothree/blob/main";

export default function LicensePage() {
  return (
    <PolicyPage
      title="Licence"
      lede="You can copy this. We would just like to be named when you do."
      notice={
        <>
          <strong className="font-medium text-ink">This page is a summary.</strong> The licence
          files in the repository are the licence; this page is the plain-English version, and where
          the two differ the files win.
        </>
      }
    >
      <h2>Why there are two licences</h2>
      <p>
        The code and the writing are different things, and somebody reusing one should not
        accidentally take the other. The code is licensed so you can build with it. The guidance is
        licensed so you can quote and translate it, as long as you say where it came from.
      </p>

      <h2>The code — Apache 2.0</h2>
      <p>
        Everything that makes the site run: the applications, the packages, the scripts, the tests
        and the configuration. Use it, change it, run it commercially. Apache 2.0 also grants a
        patent licence, which MIT does not, and it asks you to keep the notice file intact.
      </p>
      <p>
        <TextLink href={`${REPO}/LICENSE`} external>
          LICENSE
        </TextLink>{" "}
        ·{" "}
        <TextLink href={`${REPO}/NOTICE`} external>
          NOTICE
        </TextLink>
      </p>

      <h2>The guidance — CC BY 4.0</h2>
      <p>
        Every week of pregnancy and every month to three years, plus the articles, checklists and
        the recall commentary. Quoting a paragraph in a blog post, translating a week into Spanish,
        printing a month for a clinic waiting room: all fine, all free, including commercially.
      </p>
      <p>Three conditions, and they are the whole of it:</p>
      <ul>
        <li>Name Nine to Three and link to ninetothree.com.</li>
        <li>Say whether you changed anything.</li>
        <li>Do not suggest that we endorse your version.</li>
      </ul>
      <p>
        <TextLink href={`${REPO}/LICENSE-CONTENT`} external>
          LICENSE-CONTENT
        </TextLink>{" "}
        ·{" "}
        <TextLink href={`${REPO}/LICENSES/CC-BY-4.0.txt`} external>
          the full CC BY 4.0 text
        </TextLink>
      </p>

      <h2>The fonts — SIL Open Font License 1.1</h2>
      <p>
        Inter, Newsreader and Atkinson Hyperlegible are self-hosted in this repository under the
        OFL, which permits redistribution inside a product. They are not sold separately, and a
        modified copy cannot keep the original name.
      </p>
      <p>
        <TextLink href={`${REPO}/LICENSES/OFL-1.1.txt`} external>
          LICENSES/OFL-1.1.txt
        </TextLink>
      </p>

      <h2>What is not licensed</h2>
      <p>
        The name &ldquo;Nine to Three&rdquo;, the wordmark and the domain are not covered by either
        licence. A copy of the code does not come with the right to call itself Nine to Three, or to
        look like the original.
      </p>
      <p>
        Recalls and clinical recommendations belong to the bodies that published them — the Consumer
        Product Safety Commission, the Food and Drug Administration, the National Highway Traffic
        Safety Administration, the Food Safety and Inspection Service, the American College of
        Obstetricians and Gynecologists, the American Academy of Pediatrics and the NHS. We cite and
        link them rather than relicensing them. None of them endorses this site.
      </p>

      <h2>How to credit it</h2>
      <p>
        One line is enough, and it is the same line whether you copied a week or the whole thing:
      </p>
      <p>
        <em>
          Adapted from Nine to Three (ninetothree.com), licensed CC BY 4.0. Changes were made.
        </em>
      </p>
      <p>
        If you only used the code, keep the copyright line and the NOTICE file and you are done.
      </p>
    </PolicyPage>
  );
}
