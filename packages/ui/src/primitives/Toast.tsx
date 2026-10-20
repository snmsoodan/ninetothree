"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "../cn";

export interface ToastMessage {
  id: number;
  text: string;
}

interface ToastContextValue {
  /** Shows a quiet confirmation. Never use this for encouragement. */
  notify: (text: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export interface ToastProviderProps {
  children: ReactNode;
  /** How long a message stays. Short by design. */
  durationMs?: number;
}

export function ToastProvider({ children, durationMs = 2400 }: ToastProviderProps) {
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const nextId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback(
    (text: string) => {
      nextId.current += 1;
      setMessage({ id: nextId.current, text });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(null), durationMs);
    },
    [durationMs],
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4"
      >
        {message ? (
          <div
            key={message.id}
            className={cn(
              "pointer-events-auto rounded-full border border-line bg-paper-raised",
              "px-4 py-2 text-sm text-ink shadow-md",
            )}
          >
            {message.text}
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
