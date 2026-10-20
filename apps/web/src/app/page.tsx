"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppState, useHydrated } from "@/lib/store";

export default function Home() {
  const state = useAppState();
  const ready = useHydrated();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(state.onboarded ? "/week" : "/onboarding");
  }, [ready, state.onboarded, router]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg items-center justify-center px-5">
      <p className="text-base text-ink-muted">One moment.</p>
    </main>
  );
}
