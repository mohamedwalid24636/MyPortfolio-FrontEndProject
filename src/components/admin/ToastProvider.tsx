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
import { CheckCircle2, Info, Loader2, X, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export type ToastVariant = "success" | "error" | "info" | "pending";

export interface Toast {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
  /** Pending toasts stay until they are updated or dismissed. */
  sticky?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  /** Shows a toast and returns its id, so a pending toast can be updated in place. */
  push: (toast: Omit<Toast, "id">) => number;
  update: (id: number, patch: Partial<Omit<Toast, "id">>) => void;
  dismiss: (id: number) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS: Record<Exclude<ToastVariant, "pending">, number> = {
  success: 4000,
  error: 7000,
  info: 5000,
};

const ICONS: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  pending: Loader2,
};

const TONE: Record<ToastVariant, string> = {
  success: "border-emerald-400/30 bg-emerald-500/12 text-emerald-100",
  error: "border-rose-400/30 bg-rose-500/12 text-rose-100",
  info: "border-accent-400/30 bg-accent-500/12 text-accent-100",
  pending: "border-white/12 bg-white/[0.06] text-fg",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const scheduleDismiss = useCallback(
    (id: number, variant: ToastVariant) => {
      const existing = timers.current.get(id);
      if (existing) window.clearTimeout(existing);
      if (variant === "pending") return;

      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS[variant]),
      );
    },
    [dismiss],
  );

  const push = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-4), { ...toast, id }]);
      scheduleDismiss(id, toast.variant);
      return id;
    },
    [scheduleDismiss],
  );

  const update = useCallback(
    (id: number, patch: Partial<Omit<Toast, "id">>) => {
      setToasts((current) =>
        current.map((toast) => (toast.id === id ? { ...toast, ...patch } : toast)),
      );
      if (patch.variant) scheduleDismiss(id, patch.variant);
    },
    [scheduleDismiss],
  );

  const success = useCallback(
    (title: string, description?: string) => void push({ variant: "success", title, description }),
    [push],
  );
  const error = useCallback(
    (title: string, description?: string) => void push({ variant: "error", title, description }),
    [push],
  );
  const info = useCallback(
    (title: string, description?: string) => void push({ variant: "info", title, description }),
    [push],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, push, update, dismiss, success, error, info }),
    [toasts, push, update, dismiss, success, error, info],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:items-end"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.variant];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              role={toast.variant === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-2xl backdrop-blur-xl ${TONE[toast.variant]}`}
            >
              <Icon
                aria-hidden="true"
                className={`mt-0.5 size-5 shrink-0 ${toast.variant === "pending" ? "animate-spin" : ""}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-xs leading-relaxed opacity-85">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                className="-mr-1 -mt-1 shrink-0 rounded-lg p-1 opacity-70 transition hover:opacity-100"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a <ToastProvider>.");
  return context;
}