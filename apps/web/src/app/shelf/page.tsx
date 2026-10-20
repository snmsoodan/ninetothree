"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PACKS } from "@ninetothree/content";
import { Badge, Card, CardBody, TextLink } from "@ninetothree/ui";
import { AppShell } from "@/components/AppShell";
import { useAppState } from "@/lib/store";

export default function ShelfPage() {
  const state = useAppState();

  const pinned = useMemo(() => {
    const found: {
      packId: string;
      packTitle: string;
      action: (typeof PACKS)[number]["coreActions"][number];
    }[] = [];
    for (const pack of PACKS) {
      for (const action of pack.coreActions) {
        if (state.pins.includes(action.id)) {
          found.push({ packId: pack.id, packTitle: pack.title, action });
        }
      }
    }
    return found;
  }, [state.pins]);

  const doneCount = Object.values(state.progress).filter((p) => p.status === "done").length;

  return (
    <AppShell stage="Shelf">
      <div className="measure">
        <h1 className="font-display text-3xl text-ink">Your shelf</h1>
        <p className="mt-2 text-base text-ink-muted">
          The things you pinned, and the things you finished. Nothing here expires.
        </p>

        <section aria-labelledby="pinned-heading" className="mt-8">
          <h2 id="pinned-heading" className="font-display text-2xl text-ink">
            Pinned
          </h2>
          {pinned.length === 0 ? (
            <p className="mt-2 text-base text-ink-muted">
              Nothing pinned yet. Tap the pin on any step and it lands here.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {pinned.map(({ packId, packTitle, action }) => (
                <li key={action.id}>
                  <Card>
                    <CardBody className="pt-5">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-display text-lg text-ink">{action.title}</h3>
                        <Badge tone="neutral">{packTitle}</Badge>
                      </div>
                      <p className="mt-1 text-base text-ink-muted">{action.why}</p>
                      {action.options.length > 0 ? (
                        <ul className="mt-3 space-y-1">
                          {action.options.map((option) => (
                            <li key={option.id} className="text-sm">
                              {option.url ? (
                                <TextLink href={option.url} external>
                                  {option.label}
                                </TextLink>
                              ) : (
                                <span className="text-ink-muted">{option.label}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <Link
                        href={`/week/${packId}`}
                        className="mt-3 inline-block text-sm text-ink-muted underline underline-offset-2 hover:text-ink"
                      >
                        Open the week
                      </Link>
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="done-heading" className="mt-10">
          <h2 id="done-heading" className="font-display text-2xl text-ink">
            Finished
          </h2>
          <p className="mt-2 text-base text-ink-muted tabular">
            {doneCount === 0
              ? "Nothing yet. That is fine."
              : `${doneCount} step${doneCount === 1 ? "" : "s"} done.`}
          </p>
        </section>
      </div>
    </AppShell>
  );
}
