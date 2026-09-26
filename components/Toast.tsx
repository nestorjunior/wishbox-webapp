"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { consumeWelcomeToastVisible } from "@/lib/api";

type ToastTone = "success" | "warning";

type ToastOptions = {
  text: string;
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
};

type ToastState = Required<Pick<ToastOptions, "text" | "tone">> &
  Pick<ToastOptions, "actionLabel" | "onAction">;

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Shows a toast pinned to the top of the app, matching the standard
 * card + status indicator pattern used across the product.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const showToast = useCallback((options: ToastOptions) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setToast({
      text: options.text,
      tone: options.tone ?? "success",
      actionLabel: options.actionLabel,
      onAction: options.onAction,
    });

    timeoutRef.current = setTimeout(
      () => setToast(null),
      options.durationMs ?? 3200,
    );
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  // The signup flow sets this flag immediately before navigating home. Reading
  // it on route changes guarantees the feedback is shown after account creation,
  // while still surviving a full page reload during that navigation.
  useEffect(() => {
    let active = true;

    void consumeWelcomeToastVisible().then((visible) => {
      if (active && visible) {
        showToast({ text: "Bem-vinda ao Wishbox!" });
      }
    });

    return () => {
      active = false;
    };
  }, [pathname, showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <div className="pointer-events-none fixed inset-x-5 top-8 z-[999] flex justify-center">
          <div
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex min-h-[54px] w-full max-w-[355px] items-center gap-2.5 rounded-lg border bg-card px-3.5 py-3 shadow-[0_5px_16px_rgb(20_20_28/0.10)] ${
              toast.tone === "warning" ? "border-warning/30" : "border-border"
            }`}
          >
            <div
              className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold leading-none text-white ${
                toast.tone === "warning" ? "bg-warning" : "bg-foreground"
              }`}
            >
              {toast.tone === "warning" ? "!" : "✓"}
            </div>
            <p className="line-clamp-2 flex-1 text-sm font-medium text-foreground">
              {toast.text}
            </p>
            {toast.actionLabel && toast.onAction ? (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  setToast(null);
                }}
                className="shrink-0 rounded-md bg-foreground px-3 py-2 text-xs font-bold text-background"
              >
                {toast.actionLabel}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
