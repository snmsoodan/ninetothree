"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ACTION_INDEX } from "@ninetothree/content/action-index";
import {
  SHELF_EMPTY,
  SHELF_EMPTY_BODY,
  SHELF_EMPTY_CTA,
  SHELF_FILTER_LABEL,
  SHELF_FILTER_NOTE,
  SHELF_FILTER_PLACEHOLDER,
  SHELF_FINISHED,
  SHELF_HEADING,
  SHELF_INTRO,
  SHELF_MOVE_DOWN,
  SHELF_MOVE_UP,
  SHELF_OPEN_WEEK,
  SHELF_PINNED,
  SHELF_STALE_NOTE,
  SHELF_UNPIN,
  finishedLine,
  moveLabel,
  shelfModel,
  unpinLabel,
} from "@ninetothree/domain";
import { Badge, Card, CardBody, TextLink } from "@ninetothree/ui";
import { AppShell } from "@/components/AppShell";
import { movePin, removePin, useAppState } from "@/lib/store";

export default function ShelfPage() {
  const state = useAppState();
  const [query, setQuery] = useState("");

  const shelf = useMemo(
    () => shelfModel({ pins: state.pins, index: ACTION_INDEX, query }),
    [state.pins, query],
  );

  const doneCount = Object.values(state.progress).filter((p) => p.status === "done").length;

  return (
    <AppShell stage="Shelf">
      <div className="measure">
        <h1 className="font-display text-3xl text-ink">{SHELF_HEADING}</h1>
        <p className="mt-2 text-base text-ink-muted">{SHELF_INTRO}</p>

        <section aria-labelledby="pinned-heading" className="mt-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="pinned-heading" className="font-display text-2xl text-ink">
              {SHELF_PINNED}
            </h2>
            {shelf.countLine ? (
              <span className="text-sm text-ink-faint tabular">{shelf.countLine}</span>
            ) : null}
          </div>

          {shelf.all.length === 0 ? (
            <Card tone="sunken" className="mt-3">
              <CardBody className="pt-5">
                <p className="text-base text-ink">{SHELF_EMPTY}</p>
                <p className="mt-1 text-base text-ink-muted">{SHELF_EMPTY_BODY}</p>
                <Link
                  href="/week"
                  className="mt-3 inline-block text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                >
                  {SHELF_EMPTY_CTA}
                </Link>
              </CardBody>
            </Card>
          ) : (
            <>
              <div className="mt-4">
                <label htmlFor="pin-filter" className="block text-sm text-ink-muted">
                  {SHELF_FILTER_LABEL}
                </label>
                <input
                  id="pin-filter"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={SHELF_FILTER_PLACEHOLDER}
                  className="mt-1 w-full rounded-sm border border-line-strong bg-paper px-3 py-2 text-base text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                />
              </div>

              {shelf.filtering ? (
                <p className="mt-2 text-sm text-ink-faint">{SHELF_FILTER_NOTE}</p>
              ) : null}

              {shelf.noMatch ? (
                <p className="mt-4 text-base text-ink-muted">
                  {shelf.noMatch.line}{" "}
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                  >
                    {shelf.noMatch.clearLabel}
                  </button>
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {shelf.shown.map((pin) => (
                    <li key={pin.id}>
                      <Card>
                        <CardBody className="pt-5">
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="font-display text-lg text-ink">{pin.title}</h3>
                            <Badge tone="neutral">{pin.packTitle}</Badge>
                          </div>
                          {pin.stale ? (
                            <p className="mt-1 text-base text-ink-muted">{SHELF_STALE_NOTE}</p>
                          ) : (
                            <>
                              {pin.why ? (
                                <p className="mt-1 text-base text-ink-muted">{pin.why}</p>
                              ) : null}
                              {pin.options.length > 0 ? (
                                <ul className="mt-3 space-y-1">
                                  {pin.options.map((option) => (
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
                            {pin.weekHref ? (
                              <Link
                                href={pin.weekHref}
                                className="text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                              >
                                {SHELF_OPEN_WEEK}
                              </Link>
                            ) : null}
                            {/* Both arrows stay on the page and are disabled at the
                                ends, so the order is legible rather than mysteriously
                                missing a control. Under a filter they go, because
                                moving inside a filtered list would lie. */}
                            {shelf.filtering ? null : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => movePin(pin.id, "up")}
                                  disabled={!pin.canMoveUp}
                                  aria-label={moveLabel(pin.title, "up")}
                                  className="rounded-sm px-2 py-1 text-sm text-ink-muted hover:text-ink disabled:text-ink-faint disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                                >
                                  {SHELF_MOVE_UP}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => movePin(pin.id, "down")}
                                  disabled={!pin.canMoveDown}
                                  aria-label={moveLabel(pin.title, "down")}
                                  className="rounded-sm px-2 py-1 text-sm text-ink-muted hover:text-ink disabled:text-ink-faint disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                                >
                                  {SHELF_MOVE_DOWN}
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => removePin(pin.id)}
                              aria-label={unpinLabel(pin.title)}
                              className="rounded-sm px-2 py-1 text-sm text-ink-faint hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                            >
                              {SHELF_UNPIN}
                            </button>
                          </div>
                        </CardBody>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        <section aria-labelledby="done-heading" className="mt-10">
          <h2 id="done-heading" className="font-display text-2xl text-ink">
            {SHELF_FINISHED}
          </h2>
          <p className="mt-2 text-base text-ink-muted tabular">{finishedLine(doneCount)}</p>
        </section>
      </div>
    </AppShell>
  );
}
