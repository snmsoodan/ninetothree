import Link from "next/link";
import { POLICIES } from "@ninetothree/content";

/**
 * The footer.
 *
 * Four links and one sentence. It sits above the tab bar rather than under it,
 * because the tab bar is fixed to the bottom of the screen and anything below
 * it would be unreachable. It is `no-print`: a printed week should carry the
 * week, not the legal furniture.
 *
 * The sentence above the links is the one thing here that is not a link. It is
 * the promise the whole product rests on, so it is stated where a parent who is
 * worried will actually see it.
 */
export function SiteFooter() {
  return (
    <footer className="no-print mt-12 border-t border-line pt-6">
      <p className="text-sm text-ink-muted">
        Nine to Three is a guide, not a doctor. It does not diagnose anything and it does not
        replace the person who does.{" "}
        <Link
          href="/safety"
          className="text-ink underline decoration-line-strong decoration-1 underline-offset-[3px] hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
        >
          If something is wrong right now
        </Link>
        , that page is free and needs no sign-in.
      </p>

      <nav aria-label="Policies" className="mt-4">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {POLICIES.map((policy) => (
            <li key={policy.href}>
              <Link
                href={policy.href}
                className="text-sm text-ink-muted underline decoration-1 underline-offset-[3px] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
              >
                {policy.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
