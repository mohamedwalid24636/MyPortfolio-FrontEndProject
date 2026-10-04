import { Loader2 } from "lucide-react";

/** Shown while a lazily-loaded route chunk is being downloaded. */
export function RouteFallback() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <Loader2 aria-hidden="true" className="size-7 animate-spin text-accent-400" />
        <p className="text-sm text-fg-muted">Loading…</p>
      </div>
    </div>
  );
}
