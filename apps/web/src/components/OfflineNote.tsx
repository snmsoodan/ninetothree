"use client";

import { useEffect, useState } from "react";

/**
 * The one thing this product must never do is let a parent believe a page is
 * current when it is not. Offline, the safety page is a copy — a good copy,
 * with the right phone numbers, but a copy. So it says so, in one line, in the
 * quietest type on the page.
 *
 * No banner, no icon, no red. Being offline is not an error; it is a fact
 * about the train.
 */
export interface OfflineLineProps {
  /**
   * The safety page gets different words, because its content is the reason
   * this component exists: the numbers are always right, and the list of
   * warning signs may not be.
   */
  safety?: boolean;
}

/** The line itself, with no opinion about whether it should be showing. */
export function OfflineLine({ safety = false }: OfflineLineProps) {
  return (
    <p role="status" className="mb-6 text-sm text-ink-faint">
      {safety
        ? "You are offline. These numbers are always right. Anything added to this page since you last opened it is not here."
        : "You are offline. This is the copy saved on your device."}
    </p>
  );
}

export function OfflineNote({ safety = false }: OfflineLineProps) {
  /*
   * Starts online and corrects on mount. The alternative — reading
   * `navigator.onLine` during render — makes the server and the client
   * disagree about the first paint, and React throws the whole tree away.
   */
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return <OfflineLine safety={safety} />;
}
