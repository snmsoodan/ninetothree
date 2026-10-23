/**
 * Print pages are their own shell.
 *
 * They deliberately do not use `AppShell`: a sticky header and a bottom tab bar
 * are the two things a printed sheet must not have, and a parent who is here is
 * here to leave the screen. The skip link lives in the root layout, so this
 * layout only has to provide its target.
 */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="mx-auto max-w-[210mm] px-5 py-8 print:max-w-none print:p-0"
    >
      {children}
    </main>
  );
}
