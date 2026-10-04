import { AlertTriangle, RotateCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

/** Friendly, recoverable failure state — never leaks raw API errors. */
export function ErrorState({
  title = "We could not load this content",
  message = "Something went wrong while talking to the API. Please try again in a moment.",
  onRetry,
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-4 rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] text-center ${
        compact ? "px-5 py-6" : "px-6 py-12"
      }`}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">
        <AlertTriangle aria-hidden="true" className="size-5" />
      </span>
      <div className="space-y-1.5">
        <p className="font-semibold text-fg">{title}</p>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-fg-muted">{message}</p>
      </div>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn-outline mt-1">
          <RotateCw aria-hidden="true" className="size-4" />
          Try again
        </button>
      ) : null}
    </div>
  );
}
