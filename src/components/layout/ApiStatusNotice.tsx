import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { useSiteData } from "@/context/SiteDataContext";

/**
 * Non-blocking notice shown when the API is unreachable or only some endpoints
 * failed. Keeps the page usable instead of collapsing into a full-screen error.
 */
export function ApiStatusNotice() {
  const { error, failedSources, reload, isLoading } = useSiteData();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || isLoading) return null;

  const isOffline = Boolean(error);
  if (!isOffline && failedSources.length === 0) return null;

  const message = isOffline
    ? "We could not reach the portfolio API. Some content may be missing or out of date."
    : `Part of the content could not be loaded (${failedSources.join(", ")}).`;

  return (
    <div
      role="status"
      className="sticky top-16 z-40 border-b border-amber-400/20 bg-amber-500/[0.08] backdrop-blur lg:top-16"
    >
      <div className="container-page flex items-start gap-3 py-2.5">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-300" />
        <p className="flex-1 text-xs leading-relaxed text-amber-100/90 sm:text-sm">{message}</p>
        <button
          type="button"
          onClick={reload}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-amber-200 underline-offset-2 hover:underline"
        >
          Retry
        </button>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss notice"
          className="shrink-0 rounded-md p-1 text-amber-200/80 transition hover:text-amber-100"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  );
}
