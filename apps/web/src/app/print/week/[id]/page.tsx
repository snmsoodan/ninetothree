import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PACKS } from "@ninetothree/content";
import { PrintGate } from "@/components/PrintGate";
import { PrintToolbar } from "@/components/PrintToolbar";
import { PrintWeek } from "@/components/PrintWeek";

export function generateStaticParams() {
  return PACKS.map((pack) => ({ id: pack.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pack = PACKS.find((candidate) => candidate.id === id);
  return pack
    ? { title: `${pack.title} — one page`, description: pack.subtitle, robots: { index: false } }
    : { title: "Not found" };
}

/**
 * One week, on one sheet.
 *
 * Server-rendered and static, so the sheet is complete in the first response
 * and prints identically with JavaScript off. The paywall is a client wrapper
 * around the sheet for that reason — see `PrintGate` for the trade it makes.
 */
export default async function PrintWeekPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pack = PACKS.find((candidate) => candidate.id === id);
  if (!pack) notFound();

  return (
    <>
      <PrintToolbar backHref={`/week/${pack.id}`} backLabel={`Back to ${pack.title}`} />
      <PrintGate packId={pack.id} title={pack.title}>
        <PrintWeek pack={pack} />
      </PrintGate>
    </>
  );
}
