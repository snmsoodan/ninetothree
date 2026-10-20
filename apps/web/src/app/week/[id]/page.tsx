import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PACKS, nextPack, previousPack } from "@ninetothree/content";
import { WeekView } from "@/components/WeekView";

export function generateStaticParams() {
  return PACKS.map((pack) => ({ id: pack.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pack = PACKS.find((p) => p.id === id);
  return { title: pack ? pack.title : "Not found" };
}

export default async function WeekPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pack = PACKS.find((p) => p.id === id);
  if (!pack) notFound();

  return (
    <WeekView
      pack={pack}
      nextId={nextPack(PACKS, pack)?.id}
      previousId={previousPack(PACKS, pack)?.id}
    />
  );
}
