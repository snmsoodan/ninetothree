import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chooser } from "@/components/Chooser";
import { findAction } from "@ninetothree/content";
import { PACKS } from "@ninetothree/content/registry";

export function generateStaticParams() {
  return PACKS.flatMap((pack) =>
    pack.coreActions
      .filter((action) => action.chooser !== undefined)
      .map((action) => ({ actionId: action.id })),
  );
}

export async function generateMetadata({ params }: { params: Promise<{ actionId: string }> }) {
  const { actionId } = await params;
  const found = findAction(PACKS, actionId);
  if (!found?.action.chooser) return { title: "Help me choose" };
  return { title: `Help me choose: ${found.action.title}` };
}

export default async function ChoosePage({ params }: { params: Promise<{ actionId: string }> }) {
  const { actionId } = await params;
  const found = findAction(PACKS, actionId);
  const chooser = found?.action.chooser;
  if (!found || !chooser) notFound();

  const { pack, action } = found;

  return (
    <AppShell stage={pack.title}>
      <div className="measure">
        <p className="text-sm text-ink-muted">
          <a href={`/week/${pack.id}`} className="underline underline-offset-2">
            {pack.title}
          </a>
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink">Help me choose</h1>
        <p className="mt-2 text-base text-ink-muted">
          Three questions, and one answer with the reason for it. You can change your mind later.
        </p>
        <Chooser
          actionId={action.id}
          actionTitle={action.title}
          chooser={chooser}
          options={action.options}
          backHref={`/week/${pack.id}`}
        />
      </div>
    </AppShell>
  );
}
