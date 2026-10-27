"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ACTION_INDEX, findIndexedAction } from "@ninetothree/content/action-index";
import { Badge, Card, CardBody, TextLink } from "@ninetothree/ui";
import { AppShell } from "@/components/AppShell";
import { resolvePins } from "@/lib/pins";
import { movePin, removePin, useAppState } from "@/lib/store";

export default function ShelfPage() {
  const state = useAppState();
  const [query, setQuery] = useState("");

  const pins = useMemo(() => resolvePins(state.pins, ACTION_INDEX), [state.pins]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return pins;
    return pins.filter(
      (pin) =>
        pin.title.toLowerCase().includes(needle) || pin.packTitle.toLowerCase().includes(needle),
    );
  }, [pins, query]);

  const doneCount = Object.values(state.progress).filter((p) => p.status === "done").length;
  const filtering = query.trim().length > 0;

  return (
    <AppShell stage="Shelf">
      <div className="measure">
        <h1 className="font-display text-3xl text-ink">Your shelf</h1>
        <p className="mt-2 text-base text-ink-muted">
          The things you pinned, and the things you finished. Nothing here expires.
        </p>

        <section aria-labelledby="pinned-heading" className="mt-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="pinned-heading" className="font-display text-2xl text-ink">
              Pinned
            </h2>
            {pins.length > 0 ? (
              <span className="text-sm text-ink-faint tabular">{pins.length} pinned</span>
            ) : null}
          </div>

          {pins.length === 0 ? (
            <Card tone="sunken" className="mt-3">
              <CardBody className="pt-5">
                <p className="text-base text-ink">Nothing pinned yet.</p>
                <p className="mt-1 text-base text-ink-muted">
                  Pin the things you keep needing — the pediatrician&rsquo;s number, your birth
                  preferences, the safe-sleep checklist.
                </p>
                <Link
                  href="/week"
                  className="mt-3 inline-block text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                >
                  See what you can pin
                </Link>
              </CardBody>
            </Card>
          ) : (
            <>
              <div className="mt-4">
                <label htmlFor="pin-filter" className="block text-sm text-ink-muted">
                  Find a pin
                </label>
                <input
                  id="pin-filter"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Pediatrician, week 28, car seat"
                  className="mt-1 w-full rounded-sm border border-line-strong bg-paper px-3 py-2 text-base text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                />
              </div>

              {filtering ? (
                <p className="mt-2 text-sm text-ink-faint">
                  Clear the filter to reorder. Moving a pin inside a filtered list would not mean
                  what it looks like.
                </p>
              ) : null}

              {filtered.length === 0 ? (
                <p className="mt-4 text-base text-ink-muted">
                  Nothing matches &ldquo;{query.trim()}&rdquo;.{" "}
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                  >
                    Show all {pins.length}
                  </button>
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {filtered.map((pin) => {
                    const index = pins.findIndex((candidate) => candidate.id === pin.id);
                    const action = findIndexedAction(pin.id, ACTION_INDEX);
                    return (
                      <li key={pin.id}>
                        <Card>
                          <CardBody className="pt-5">
                            <div className="flex items-baseline justify-between gap-2">
                              <h3 className="font-display text-lg text-ink">{pin.title}</h3>
                              <Badge tone="neutral">{pin.packTitle}</Badge>
                            </div>
                            {pin.stale ? (
                              <p className="mt-1 text-base text-ink-muted">
                                This step has changed since you pinned it. The note is still yours
                                to keep or remove.
                              </p>
                            ) : (
                              <>
                                {action ? (
                                  <p className="mt-1 text-base text-ink-muted">{action.why}</p>
                                ) : null}
                                {action && action.options.length > 0 ? (
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
                              </>
                            )}

                            <div className="mt-4 flex flex-wrap items-center gap-3">
                              {pin.stale ? null : (
                                <Link
                                  href={`/week/${pin.packId}`}
                                  className="text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                                >
                                  Open the week
                                </Link>
                              )}
                              {filtering ? null : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => movePin(pin.id, "up")}
                                    disabled={index === 0}
                                    aria-label={`Move ${pin.title} up`}
                                    className="rounded-sm px-2 py-1 text-sm text-ink-muted hover:text-ink disabled:text-ink-faint disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                                  >
                                    Move up
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => movePin(pin.id, "down")}
                                    disabled={index === pins.length - 1}
                                    aria-label={`Move ${pin.title} down`}
                                    className="rounded-sm px-2 py-1 text-sm text-ink-muted hover:text-ink disabled:text-ink-faint disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                                  >
                                    Move down
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => removePin(pin.id)}
                                aria-label={`Unpin ${pin.title}`}
                                className="rounded-sm px-2 py-1 text-sm text-ink-faint hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                              >
                                Unpin
                              </button>
                            </div>
                          </CardBody>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
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
