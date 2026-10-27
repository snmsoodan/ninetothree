"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button, Card, CardBody, Dialog } from "@ninetothree/ui";

import { formatDate } from "@/lib/i18n";
import { useAppState } from "@/lib/store";

interface Deletion {
  requestedAt: string;
  purgeAfter: string;
}

type State =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "ready"; deletion: Deletion | null }
  | { kind: "failed" };

// The purge date is a day, not a moment. Formatting it in the reader's own
// timezone turns "the 31st" into "the 30th" for anybody west of UTC.
const day = (iso: string): string =>
  formatDate(iso, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

function save(name: string, body: string, type: string): void {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Taking your data with you, and asking us to forget it.
 *
 * The download is assembled here rather than on the server, because half of
 * what a parent has written never leaves this browser. A file that only
 * contained the server's half would be a lie about completeness.
 */
export function DataCard() {
  const { status } = useSession();
  const state = useAppState();
  const [remote, setRemote] = useState<State>({ kind: "loading" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const read = useCallback(async () => {
    const response = await fetch("/api/account/delete");
    if (response.status === 401) {
      setRemote({ kind: "signed-out" });
      return;
    }
    if (!response.ok) {
      setRemote({ kind: "failed" });
      return;
    }
    const body = (await response.json()) as { deletion: Deletion | null };
    setRemote({ kind: "ready", deletion: body.deletion });
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      setRemote({ kind: "signed-out" });
      return;
    }
    void read().catch(() => setRemote({ kind: "failed" }));
  }, [status, read]);

  const download = useCallback(
    async (format: "json" | "csv") => {
      setNote(null);
      setBusy(true);
      try {
        const response = await fetch(`/api/account/export?format=${format}`);
        if (!response.ok) {
          setNote("We could not put that file together just now. Try again in a moment.");
          return;
        }
        const stamp = new Date().toISOString().slice(0, 10);
        if (format === "csv") {
          save(`nine-to-three-${stamp}.csv`, await response.text(), "text/csv");
          return;
        }
        const server = (await response.json()) as Record<string, unknown>;
        save(
          `nine-to-three-${stamp}.json`,
          JSON.stringify({ ...server, onThisDevice: state }, null, 2),
          "application/json",
        );
      } catch {
        setNote("We could not put that file together just now. Try again in a moment.");
      } finally {
        setBusy(false);
      }
    },
    [state],
  );

  const ask = useCallback(async () => {
    setBusy(true);
    setNote(null);
    try {
      const response = await fetch("/api/account/delete", { method: "POST" });
      if (!response.ok) {
        setNote("We could not do that just now. Try again in a moment.");
        return;
      }
      const body = (await response.json()) as { deletion: Deletion };
      setRemote({ kind: "ready", deletion: body.deletion });
      setConfirmOpen(false);
    } catch {
      setNote("We could not do that just now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }, []);

  const keep = useCallback(async () => {
    setBusy(true);
    setNote(null);
    try {
      const response = await fetch("/api/account/delete", { method: "DELETE" });
      if (!response.ok) {
        setNote("We could not do that just now. Try again in a moment.");
        return;
      }
      setRemote({ kind: "ready", deletion: null });
    } catch {
      setNote("We could not do that just now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }, []);

  const deletion = remote.kind === "ready" ? remote.deletion : null;

  return (
    <Card>
      <CardBody>
        <h3 className="text-lg font-medium text-ink">Your data</h3>
        <p className="mt-2 text-base text-ink-muted">
          You can take a copy of everything at any time. It is yours.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => void download("json")}
          >
            Download everything
          </Button>
          <Button variant="quiet" size="sm" disabled={busy} onClick={() => void download("csv")}>
            Download a spreadsheet
          </Button>
        </div>

        {remote.kind === "signed-out" ? (
          <p className="mt-3 text-base text-ink-muted">
            The download covers what is on this device. Sign in to include your account and your
            household.
          </p>
        ) : null}

        {remote.kind === "failed" ? (
          <p className="mt-3 text-base text-ink-muted">
            We could not read your account just now. Reloading the page usually settles it.
          </p>
        ) : null}

        {note ? (
          <p role="status" className="mt-3 text-base text-ink-muted">
            {note}
          </p>
        ) : null}

        {deletion ? (
          <div className="mt-4 rounded-lg border border-clay/40 bg-clay/5 p-3">
            <p className="text-base text-ink">
              Your account is set to be deleted on{" "}
              <span className="font-medium">{day(deletion.purgeAfter)}</span>.
            </p>
            <p className="mt-1 text-base text-ink-muted">
              Signing in again cancels it. So does this button.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              disabled={busy}
              onClick={() => void keep()}
            >
              Keep my account
            </Button>
          </div>
        ) : remote.kind === "ready" ? (
          <div className="mt-4 border-t border-ink-faint/20 pt-3">
            <Button variant="quiet" size="sm" onClick={() => setConfirmOpen(true)}>
              Delete my account
            </Button>
          </div>
        ) : null}

        <Dialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Delete your account?"
          description="It goes in thirty days. Until then, signing in again brings it back."
          footer={
            <>
              <Button variant="quiet" onClick={() => setConfirmOpen(false)}>
                Keep it
              </Button>
              <Button disabled={busy} onClick={() => void ask()}>
                Delete it
              </Button>
            </>
          }
        >
          <p className="text-base text-ink-muted">
            Your pins, your dates, your appointments and your household go with it. Anything you
            kept on this device stays on this device until you erase it here.
          </p>
        </Dialog>
      </CardBody>
    </Card>
  );
}
