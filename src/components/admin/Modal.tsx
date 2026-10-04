import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZES: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

/**
 * Accessible dialog used for every admin create/edit form and for delete confirmations.
 * Traps Escape, locks background scroll and closes on backdrop click unless a submission is in
 * flight, so a half-sent request can never be dismissed out from under the user.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "lg",
  busy = false,
}: ModalProps & { busy?: boolean }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, busy, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    // Move focus into the dialog so keyboard users are not left behind on the page underneath.
    const focusable = panelRef.current?.querySelector<HTMLElement>(
      "input:not([type=hidden]), textarea, select, button:not([data-autofocus-ignore])",
    );
    focusable?.focus();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => {
              if (!busy) onClose();
            }}
            className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={`relative my-8 w-full ${SIZES[size]} overflow-hidden rounded-3xl border border-white/10 bg-ink-850 shadow-2xl`}
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/8 px-6 py-5">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold text-fg">{title}</h2>
                {description ? (
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                data-autofocus-ignore
                aria-label="Close dialog"
                className="shrink-0 rounded-xl border border-white/10 p-2 text-fg-muted transition hover:border-accent-500/40 hover:text-fg disabled:opacity-40"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </header>

            <div className="max-h-[calc(100dvh-16rem)] overflow-y-auto px-6 py-6">{children}</div>

            {footer ? (
              <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-white/8 bg-ink-900/60 px-6 py-4">
                {footer}
              </footer>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: "danger" | "default";
}

/** Destructive-action gate. Nothing is deleted without one of these. */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  busy = false,
  onConfirm,
  onCancel,
  tone = "danger",
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      busy={busy}
      footer={
        <>
          <button type="button" className="btn-outline" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={tone === "danger" ? "btn-danger" : "btn-primary"}
          >
            {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-fg-muted">{message}</div>
    </Modal>
  );
}