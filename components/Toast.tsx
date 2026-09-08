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
 * white-card + checkmark pattern used across the product.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
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

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <div className="pointer-events-none fixed inset-x-4 top-4 z-[999] flex justify-center">
          <div
            className={`pointer-events-auto flex max-w-sm items-center gap-3 rounded-[18px] border bg-white px-3.5 py-3 shadow-[0_4px_10px_-2px_rgba(0,0,0,0.08)] ${
              toast.tone === "warning" ? "border-[#F0D9B5]" : "border-[#E6E6EB]"
            }`}
          >
            <div
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${
                toast.tone === "warning" ? "bg-[#B34700]" : "bg-[#111111]"
              }`}
            >
              {toast.tone === "warning" ? "!" : "✓"}
            </div>
            <p className="line-clamp-2 flex-1 text-sm font-extrabold text-[#14141C]">
              {toast.text}
            </p>
            {toast.actionLabel && toast.onAction ? (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  setToast(null);
                }}
                className="shrink-0 rounded-[10px] bg-[#111111] px-3 py-2 text-xs font-bold text-white"
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
