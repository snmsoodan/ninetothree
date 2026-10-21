"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardBody } from "@ninetothree/ui";

/**
 * Chrome fires this; the DOM lib does not know about it.
 * https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallState = "installed" | "prompt" | "ios" | "none";

/**
 * Four states, and only two of them are worth a card.
 *
 * `installed` renders nothing because a parent who has already added it does
 * not need to be told. `none` renders nothing because a browser with no
 * install path should not be given instructions for a different browser.
 */
export function installState(input: {
  standalone: boolean;
  hasPrompt: boolean;
  userAgent: string;
}): InstallState {
  if (input.standalone) return "installed";
  if (input.hasPrompt) return "prompt";
  /* iOS has no `beforeinstallprompt`, so the only honest thing is the menu path. */
  if (/iPhone|iPad|iPod/.test(input.userAgent)) return "ios";
  return "none";
}

export interface InstallCardProps {
  state: InstallState;
  onInstall?: () => void;
}

/** The card, with no opinion about whether the browser can install it. */
export function InstallCard({ state, onInstall }: InstallCardProps) {
  if (state === "installed" || state === "none") return null;

  return (
    <Card className="mt-3">
      <CardBody className="pt-5">
        <h3 className="text-base font-medium text-ink">Keep it on your home screen</h3>
        {state === "prompt" ? (
          <>
            <p className="mt-1 text-sm text-ink-muted">
              It opens like an app, and the week you are on is there without a signal.
            </p>
            <p className="mt-3">
              <Button variant="secondary" onClick={onInstall}>
                Add to home screen
              </Button>
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-ink-muted">
            Tap the Share button, then <span className="text-ink">Add to Home Screen</span>. It
            opens like an app, and the week you are on is there without a signal.
          </p>
        )}
      </CardBody>
    </Card>
  );
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<InstallState>("none");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      /* iOS reports an installed web app here instead. */
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    setState(
      installState({
        standalone,
        hasPrompt: false,
        userAgent: navigator.userAgent,
      }),
    );

    const onPrompt = (event: Event) => {
      /* Chrome shows its own mini-infobar unless this is cancelled. */
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setState("prompt");
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  return (
    <InstallCard
      state={state}
      onInstall={() => {
        void deferred?.prompt();
        setDeferred(null);
        setState("none");
      }}
    />
  );
}
