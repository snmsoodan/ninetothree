import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CHECKLISTS, getChecklist } from "@ninetothree/content/checklist-registry";
import { HospitalBag } from "@/components/HospitalBag";
import { PrintToolbar } from "@/components/PrintToolbar";

export function generateStaticParams() {
  return CHECKLISTS.map((checklist) => ({ id: checklist.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const checklist = getChecklist(id);
  return checklist
    ? {
        title: `${checklist.title} — checklist`,
        description: checklist.summary,
        robots: { index: false },
      }
    : { title: "Not found" };
}

/**
 * A checklist, on one sheet.
 *
 * The only page on the site whose job is to be printed. It is static and
 * server-rendered, so the squares are there before any script runs.
 */
export default async function PrintChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const checklist = getChecklist(id);
  if (!checklist) notFound();

  return (
    <>
      <PrintToolbar backHref="/today" backLabel="Back to this week" />
      <HospitalBag checklist={checklist} />
    </>
  );
}
